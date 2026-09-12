import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NOTIFICATION_COLORS, NOTIFICATION_ICON_IDS, NOTIFICATION_SCHEDULE_MODES } from '../data/notifications';
import { NOTIFICATION_ICONS } from '../data/notification-icons';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useAutosaveRunner } from '../hooks/useAutosaveRunner';
import { getAutosaveFormHandlers, nextDraftFlag } from '../utils/autosave';
import {
  formStateToNotificationPayload,
  getDefaultNotificationFormState,
  notificationToFormState,
  validateNotificationForm,
} from '../utils/notification-format';
import { adminText } from '../utils/admin-text';
import AdminFormBlock from './AdminFormBlock';
import AdminModalPanel from './AdminModalPanel';
import RichTextEditor from './RichTextEditor';
import AutosaveStatus from './AutosaveStatus';
import UrlInput from './UrlInput';

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
  const skipFormResetRef = useRef(false);
  const formRef = useRef(form);
  const { run: runAutosave, remember: rememberAutosave, status: autosaveStatus } = useAutosaveRunner();
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    if (!open) return;
    if (skipFormResetRef.current) {
      skipFormResetRef.current = false;
      return;
    }
    const next = notification ? notificationToFormState(notification) : getDefaultNotificationFormState();
    setForm(next);
    formRef.current = next;
    rememberAutosave(formStateToNotificationPayload(next));
    setErrors({});
    setSaving(false);
  }, [open, notification?.id, rememberAutosave]);

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
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      formRef.current = next;
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateFieldPreservingScroll = (field, value) => {
    pendingScrollTopRef.current = panelRef.current?.scrollTop ?? 0;
    updateField(field, value);
  };

  const persistNotification = async ({ close = false } = {}) => {
    const current = formRef.current;
    if (close) {
      const nextErrors = validateNotificationForm(current);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return false;
      }
    }

    const payload = {
      ...formStateToNotificationPayload(current),
      draft: nextDraftFlag(notification, { close }),
    };
    skipFormResetRef.current = true;
    if (close) setSaving(true);
    const ok = await runAutosave(payload, () => onSave(payload, { silent: !close }));
    if (close) setSaving(false);
    if (close && ok) onClose();
    return ok;
  };

  const persistSoon = () => {
    persistNotification();
  };

  const handleCtaOpenInNewTabToggle = () => {
    updateFieldPreservingScroll('ctaOpenInNewTab', !form.ctaOpenInNewTab);
    persistSoon();
  };

  const isManual = form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual;

  const handleSubmit = async (event) => {
    event.preventDefault();
    await persistNotification({ close: true });
  };

  return createPortal(
    <div
      className={`admin-modal admin-modal--wide admin-modal--event-form${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-notification-form-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel
        panelRef={panelRef}
        className="admin-modal__panel--wide admin-modal__panel--event-form admin-modal__panel--notification-form"
      >
        <header className="admin-event-modal__header">
          <div className="admin-event-modal__header-copy">
            <p className="admin-event-modal__eyebrow">
              {notification
                ? adminText('notifications.form.editEyebrow')
                : adminText('notifications.form.newEyebrow')}
            </p>
            <h2 id="admin-notification-form-title" className="admin-modal__title admin-event-modal__title">
              {notification
                ? adminText('notifications.form.editTitle')
                : adminText('notifications.form.newTitle')}
            </h2>
            <p className="admin-event-modal__lede">
              {adminText('notifications.form.lede')}
            </p>
          </div>
        </header>

        <form
          id="admin-notification-form"
          className="admin-form admin-form--event admin-notification-form"
          onSubmit={handleSubmit}
          {...getAutosaveFormHandlers(persistSoon)}
        >
          <div className="admin-event-tab">
          <AdminFormBlock
            title={adminText('notifications.form.blockContent')}
            hint={adminText('notifications.form.blockContentHint')}
            accent="identity"
          >
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
              onPersist={persistSoon}
              features="notificationBody"
            />
          </FieldGroup>
          </AdminFormBlock>

          <AdminFormBlock
            title={adminText('notifications.form.blockSchedule')}
            hint={adminText('notifications.form.blockScheduleHint')}
            accent="dates"
          >
          <div className="admin-form__group admin-notification-form__schedule">
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
                    onChange={() => {
                      setForm((prev) => {
                        const next = {
                          ...prev,
                          scheduleMode: NOTIFICATION_SCHEDULE_MODES.scheduled,
                        };
                        formRef.current = next;
                        return next;
                      });
                    }}
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
                    onChange={() => {
                      setForm((prev) => {
                        const next = {
                          ...prev,
                          scheduleMode: NOTIFICATION_SCHEDULE_MODES.manual,
                          manualActive: true,
                        };
                        formRef.current = next;
                        return next;
                      });
                    }}
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
          </AdminFormBlock>

          <AdminFormBlock
            title={adminText('notifications.form.blockLook')}
            hint={adminText('notifications.form.blockLookHint')}
            accent="media"
          >
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
          </AdminFormBlock>

          <AdminFormBlock
            title={adminText('notifications.form.blockCta')}
            hint={adminText('notifications.form.ctaHint')}
            accent="signup"
          >
          <div className="admin-form__group admin-notification-form__cta">
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
              <UrlInput
                value={form.ctaHref}
                onChange={(next) => updateField('ctaHref', next)}
                allowRelative
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
          </AdminFormBlock>
          </div>

          {(saveError || Object.keys(errors).length > 0) && (
            <p className="admin-error admin-form__error">{saveError || adminText('notifications.form.validationFailed')}</p>
          )}

          <div className="admin-modal__actions admin-event-modal__actions">
            <AutosaveStatus status={autosaveStatus} />
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
