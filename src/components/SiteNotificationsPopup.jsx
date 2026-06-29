import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { ICONS } from '../data/icons';
import { COLOR_CSS_VARS } from '../data/colors';
import { NOTIFICATION_COLORS } from '../data/notifications';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useNotifications } from '../contexts/NotificationsContext';
import {
  markNotificationsHandledThisSession,
  notificationHasCta,
  notificationTextToDisplayHtml,
  wereNotificationsHandledThisSession,
} from '../utils/notification-format';
import NotificationIcon from './NotificationIcon';

let notificationsPopupEntryPathname = null;

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function getColorTokens(colorId) {
  const color = NOTIFICATION_COLORS.find((item) => item.id === colorId) || NOTIFICATION_COLORS[0];
  return {
    ...color,
    accentVar: COLOR_CSS_VARS[color.token],
    paleVar: COLOR_CSS_VARS[color.paleToken],
  };
}

function NotificationIconBadge({ icon }) {
  return (
    <span className="site-notification-card__icon-wrap" aria-hidden="true">
      <NotificationIcon icon={icon} className="site-notification-card__icon" />
    </span>
  );
}

function NotificationCard({ notification, onAction }) {
  const color = getColorTokens(notification.color);
  const textHtml = useMemo(
    () => notificationTextToDisplayHtml(notification.text),
    [notification.text],
  );

  return (
    <article
      className="site-notification-card"
      style={{
        '--notification-accent': `var(${color.accentVar})`,
        '--notification-accent-pale': `var(${color.paleVar})`,
      }}
      aria-labelledby={`site-notification-title-${notification.id}`}
    >
      <div className="site-notification-card__header">
        <NotificationIconBadge icon={notification.icon} />
        <h3 id={`site-notification-title-${notification.id}`} className="site-notification-card__title">
          {notification.title}
        </h3>
        <NotificationIconBadge icon={notification.icon} />
      </div>

      {(textHtml || notificationHasCta(notification)) && (
        <div className="site-notification-card__body">
          {textHtml ? (
            <div
              className="site-notification-card__text"
              dangerouslySetInnerHTML={{ __html: textHtml }}
            />
          ) : null}
          {notificationHasCta(notification) ? (
            <div className="site-notification-card__cta-wrap">
              <a
                href={notification.ctaHref}
                className={`btn site-notification-card__cta${notification.ctaOpenInNewTab ? ' site-notification-card__cta--external' : ''}`}
                target={notification.ctaOpenInNewTab ? '_blank' : undefined}
                rel={notification.ctaOpenInNewTab ? 'noopener noreferrer' : undefined}
                onClick={onAction}
              >
                {notification.ctaLabel}
                {notification.ctaOpenInNewTab && (
                  <span
                    className="site-notification-card__cta-icon nav-link__external"
                    aria-hidden="true"
                    dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
                  />
                )}
              </a>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

export default function SiteNotificationsPopup() {
  const { activeNotifications, loading } = useNotifications();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const { mounted, visible } = useAnimatedPresence(open, 280);

  const panelAccent = useMemo(() => {
    const first = activeNotifications[0];
    if (!first) return 'var(--orange)';
    const color = getColorTokens(first.color);
    return `var(${color.accentVar})`;
  }, [activeNotifications]);

  const isSingle = activeNotifications.length === 1;
  const titleId = isSingle
    ? `site-notification-title-${activeNotifications[0]?.id}`
    : 'site-notifications-title';

  useEffect(() => {
    if (notificationsPopupEntryPathname === null) {
      notificationsPopupEntryPathname = location.pathname;
      return;
    }

    if (notificationsPopupEntryPathname === location.pathname) {
      return;
    }

    notificationsPopupEntryPathname = location.pathname;
    markNotificationsHandledThisSession();
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (loading || wereNotificationsHandledThisSession()) return;
    if (activeNotifications.length === 0) return;

    const frame = window.requestAnimationFrame(() => {
      setOpen(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [loading, activeNotifications.length]);

  const handleClose = useCallback(() => {
    markNotificationsHandledThisSession();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape') handleClose();
    };

    document.body.classList.add('site-notifications-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('site-notifications-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, handleClose]);

  if (!mounted || activeNotifications.length === 0) return null;

  return createPortal(
    <div
      className={`site-notifications${visible ? ' site-notifications--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="site-notifications__backdrop"
        onClick={handleClose}
        aria-label="Zavřít upozornění"
      />
      <div
        className="site-notifications__panel"
        style={{ '--notification-accent': panelAccent }}
      >
        <div className="site-notifications__panel-accent" aria-hidden="true" />
        <button
          type="button"
          className="site-notifications__close"
          onClick={handleClose}
          aria-label="Zavřít"
        >
          <CloseIcon />
        </button>
        <div className={`site-notifications__list${isSingle ? ' site-notifications__list--single' : ''}`}>
          {activeNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAction={handleClose}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
