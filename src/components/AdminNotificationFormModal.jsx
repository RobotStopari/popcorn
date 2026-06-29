import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NOTIFICATION_COLORS, NOTIFICATION_ICON_IDS, NOTIFICATION_SCHEDULE_MODES } from '../data/notifications';
import { NOTIFICATION_ICONS } from '../data/notification-icons';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import {
  formStateToNotificationPayload,
  getDefaultNotificationFormState,
  notificationToFormState,
  validateNotificationForm,
} from '../utils/notification-format';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';
import RichTextEditor from './RichTextEditor';

function FieldGroup({ label, required = false, children, hint, error }) {
  return (
    <div className="admin-form__group">
      {label && (
        <label className="admin-form__label">
          {label}
          {required && <span className="admin-form__required">*</span>}
        </label>
      )}
      {children}
      {hint && <p className="admin-form__hint">{hint}</p>}
      {error && <p className="admin-form__error">{error}</p>}
    </div>
  );
}

function ScheduleCalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

function ScheduleManualIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 14a8 8 0 0 1-8 8" />
      <path d="M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2" />
      <path d="M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1" />
      <path d="M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10" />
      <path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}

export default function AdminNotificationFormModal({
  open,
  notification,
  onClose,
  onSave,
  saveError = '',
}) {
  const [form, setForm] = useState(getDefaultNotificationFormState());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const panelRef = useRef(null);
  const pendingScrollTopRef = useRef(null);
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return;
    setForm(notification ? notificationToFormState(notification) : getDefaultNotificationFormState());
    setErrors({});
    setSaving(false);
  }, [open, notification?.id]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  useLayoutEffect(() => {
    if (pendingScrollTopRef.current === null || !panelRef.current) return;
    panelRef.current.scrollTop = pendingScrollTopRef.current;
    pendingScrollTopRef.current = null;
  });

  if (!mounted) return null;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateFieldPreservingScroll = (field, value) => {
    pendingScrollTopRef.current = panelRef.current?.scrollTop ?? 0;
    updateField(field, value);
  };

  const handleCtaOpenInNewTabToggle = () => {
    updateFieldPreservingScroll('ctaOpenInNewTab', !form.ctaOpenInNewTab);
  };

  const isManual = form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateNotificationForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    const ok = await onSave(formStateToNotificationPayload(form));
    setSaving(false);
    if (ok) onClose();
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-notification-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel
        panelRef={panelRef}
        className="admin-modal__panel--wide admin-modal__panel--notification-form"
      >
        <h2 id="admin-notification-form-title" className="admin-modal__title">
          {notification
            ? adminText('notifications.form.editTitle')
            : adminText('notifications.form.newTitle')}
        </h2>

        <form id="admin-notification-form" className="admin-form admin-notification-form" onSubmit={handleSubmit}>
          <FieldGroup label={adminText('notifications.form.titleLabel')} required error={errors.title}>
            <input
              type="text"
              className="admin-form__input"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder={adminText('notifications.form.titlePlaceholder')}
              maxLength={120}
            />
          </FieldGroup>

          <FieldGroup label={adminText('notifications.form.textLabel')} required error={errors.text}>
            <RichTextEditor
              id={notification ? `notification-text-${notification.id}` : 'notification-text-new'}
              value={form.text}
              onChange={(value) => updateField('text', value)}
              features="notificationBody"
            />
          </FieldGroup>

          <div className="admin-form__group admin-notification-form__schedule">
            <p className="admin-form__label">{adminText('notifications.form.scheduleLabel')}</p>
            <div className="admin-notification-form__schedule-panel">
              <div
                className="admin-notification-form__schedule-modes"
                role="radiogroup"
                aria-label={adminText('notifications.form.scheduleLabel')}
              >
                <label
                  className={`admin-notification-form__schedule-mode${!isManual ? ' admin-notification-form__schedule-mode--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="notification-schedule-mode"
                    checked={!isManual}
                    onChange={() => setForm((prev) => ({
                      ...prev,
                      scheduleMode: NOTIFICATION_SCHEDULE_MODES.scheduled,
                    }))}
                  />
                  <span className="admin-notification-form__schedule-mode-icon">
                    <ScheduleCalendarIcon />
                  </span>
                  <span className="admin-notification-form__schedule-mode-label">
                    {adminText('notifications.form.scheduleScheduled')}
                  </span>
                  <span className="admin-notification-form__schedule-mode-desc">
                    {adminText('notifications.form.scheduleScheduledDesc')}
                  </span>
                </label>
                <label
                  className={`admin-notification-form__schedule-mode${isManual ? ' admin-notification-form__schedule-mode--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="notification-schedule-mode"
                    checked={isManual}
                    onChange={() => setForm((prev) => ({
                      ...prev,
                      scheduleMode: NOTIFICATION_SCHEDULE_MODES.manual,
                      manualActive: true,
                    }))}
                  />
                  <span className="admin-notification-form__schedule-mode-icon">
                    <ScheduleManualIcon />
                  </span>
                  <span className="admin-notification-form__schedule-mode-label">
                    {adminText('notifications.form.scheduleManual')}
                  </span>
                  <span className="admin-notification-form__schedule-mode-desc">
                    {adminText('notifications.form.scheduleManualDesc')}
                  </span>
                </label>
              </div>

              <div className="admin-notification-form__schedule-body">
                {isManual ? (
                  <>
                    <p className="admin-notification-form__schedule-subhead">
                      {adminText('notifications.form.manualActiveLabel')}
                    </p>
                    <div
                      className="admin-notification-form__status-modes"
                      role="radiogroup"
                      aria-label={adminText('notifications.form.manualActiveLabel')}
                    >
                      <label
                        className={`admin-notification-form__status-option${form.manualActive ? ' admin-notification-form__status-option--active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="notification-manual-active"
                          checked={form.manualActive}
                          onChange={() => updateField('manualActive', true)}
                        />
                        <span className="admin-notification-form__status-dot admin-notification-form__status-dot--on" aria-hidden="true" />
                        <span>{adminText('notifications.form.manualActiveOn')}</span>
                      </label>
                      <label
                        className={`admin-notification-form__status-option${!form.manualActive ? ' admin-notification-form__status-option--active' : ''}`}
                      >
                        <input
                          type="radio"
                          name="notification-manual-active"
                          checked={!form.manualActive}
                          onChange={() => updateField('manualActive', false)}
                        />
                        <span className="admin-notification-form__status-dot admin-notification-form__status-dot--off" aria-hidden="true" />
                        <span>{adminText('notifications.form.manualActiveOff')}</span>
                      </label>
                    </div>
                    <p className="admin-notification-form__schedule-hint">
                      {adminText('notifications.form.scheduleHint')}
                    </p>
                  </>
                ) : (
                  <div className="admin-notification-form__schedule-range">
                    <div className="admin-notification-form__schedule-block">
                      <p className="admin-notification-form__schedule-block-label">
                        {adminText('notifications.form.dateStartLabel')}
                      </p>
                      <div className="admin-notification-form__schedule-fields">
                        <input
                          type="date"
                          className="admin-form__input"
                          value={form.dateStart}
                          onChange={(e) => updateField('dateStart', e.target.value)}
                          aria-invalid={Boolean(errors.dateStart)}
                        />
                        <input
                          type="time"
                          className="admin-form__input"
                          value={form.timeStart}
                          onChange={(e) => updateField('timeStart', e.target.value)}
                          aria-invalid={Boolean(errors.timeStart)}
                        />
                      </div>
                      {(errors.dateStart || errors.timeStart) && (
                        <p className="admin-form__error">
                          {errors.dateStart || errors.timeStart}
                        </p>
                      )}
                    </div>

                    <span className="admin-notification-form__schedule-arrow" aria-hidden="true">→</span>

                    <div className="admin-notification-form__schedule-block">
                      <p className="admin-notification-form__schedule-block-label">
                        {adminText('notifications.form.dateEndLabel')}
                      </p>
                      <div className="admin-notification-form__schedule-fields">
                        <input
                          type="date"
                          className="admin-form__input"
                          value={form.dateEnd}
                          onChange={(e) => updateField('dateEnd', e.target.value)}
                          aria-invalid={Boolean(errors.dateEnd)}
                        />
                        <input
                          type="time"
                          className="admin-form__input"
                          value={form.timeEnd}
                          onChange={(e) => updateField('timeEnd', e.target.value)}
                          aria-invalid={Boolean(errors.timeEnd)}
                        />
                      </div>
                      {(errors.dateEnd || errors.timeEnd) && (
                        <p className="admin-form__error">
                          {errors.dateEnd || errors.timeEnd}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <FieldGroup label={adminText('notifications.form.colorLabel')}>
            <div className="admin-notification-form__swatches">
              {NOTIFICATION_COLORS.map((color) => (
                <label
                  key={color.id}
                  className={`admin-notification-form__swatch${form.color === color.id ? ' admin-notification-form__swatch--active' : ''}`}
                  style={{ '--swatch-color': `var(--${color.token})` }}
                >
                  <input
                    type="radio"
                    name="notification-color"
                    value={color.id}
                    checked={form.color === color.id}
                    onChange={() => updateField('color', color.id)}
                  />
                  <span>{color.label}</span>
                </label>
              ))}
            </div>
          </FieldGroup>

          <FieldGroup label={adminText('notifications.form.iconLabel')}>
            <div className="admin-notification-form__icons">
              {NOTIFICATION_ICON_IDS.map((iconId) => (
                <label
                  key={iconId}
                  className={`admin-notification-form__icon-option${form.icon === iconId ? ' admin-notification-form__icon-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="notification-icon"
                    value={iconId}
                    checked={form.icon === iconId}
                    onChange={() => updateField('icon', iconId)}
                  />
                  <span
                    className="admin-notification-form__icon-preview"
                    dangerouslySetInnerHTML={{ __html: NOTIFICATION_ICONS[iconId] }}
                  />
                  <span>{adminText(`notifications.form.icons.${iconId}`)}</span>
                </label>
              ))}
            </div>
          </FieldGroup>

          <div className="admin-form__group admin-notification-form__cta">
            <p className="admin-form__label">{adminText('notifications.form.ctaLabel')}</p>
            <p className="admin-form__hint">{adminText('notifications.form.ctaHint')}</p>
            <FieldGroup label={adminText('notifications.form.ctaTextLabel')} error={errors.ctaLabel}>
              <input
                type="text"
                className="admin-form__input"
                value={form.ctaLabel}
                onChange={(e) => updateField('ctaLabel', e.target.value)}
                placeholder={adminText('notifications.form.ctaTextPlaceholder')}
              />
            </FieldGroup>
            <FieldGroup label={adminText('notifications.form.ctaHrefLabel')} error={errors.ctaHref}>
              <input
                type="url"
                className="admin-form__input"
                value={form.ctaHref}
                onChange={(e) => updateField('ctaHref', e.target.value)}
                placeholder="https://"
                inputMode="url"
              />
            </FieldGroup>
            <FieldGroup label={adminText('notifications.form.ctaTargetLabel')}>
              <div
                className="admin-toggle admin-event-external-page__toggle admin-notification-form__cta-toggle"
                role="group"
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.ctaOpenInNewTab}
                  className="admin-notification-form__cta-switch"
                  onClick={handleCtaOpenInNewTabToggle}
                >
                  <span className={`admin-toggle__track${form.ctaOpenInNewTab ? ' admin-toggle__track--on' : ''}`} aria-hidden="true">
                    <span className="admin-toggle__thumb" />
                  </span>
                </button>
                <span className="admin-toggle__label">{adminText('notifications.form.ctaOpenInNewTab')}</span>
              </div>
            </FieldGroup>
          </div>

          {(saveError || Object.keys(errors).length > 0) && (
            <p className="admin-error">{saveError || adminText('notifications.form.validationFailed')}</p>
          )}

          <div className="admin-modal__actions admin-notification-form__actions">
            <button type="button" className="btn btn--outline" onClick={onClose} disabled={saving}>
              {adminText('common.cancel')}
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? adminText('common.saving') : adminText('common.save')}
            </button>
          </div>
        </form>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
