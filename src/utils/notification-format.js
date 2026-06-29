import {
  DEFAULT_NOTIFICATION,
  NOTIFICATION_COLOR_IDS,
  NOTIFICATION_ICON_IDS,
  NOTIFICATION_SCHEDULE_MODES,
} from '../data/notifications';
import { toIsoDate } from './event-dates';
import { transformRichTextForDisplay } from './rich-text-embeds';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasNotificationText(value) {
  return Boolean(stripHtml(value));
}

export function notificationTextToDisplayHtml(text) {
  const trimmed = typeof text === 'string' ? text.trim() : '';
  if (!trimmed) return '';

  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return transformRichTextForDisplay(trimmed);
  }

  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\n/g, '<br>');
}

function toMillis(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
}

export function getNotificationStartDateTime(notification) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    const created = toMillis(notification.createdAt);
    return created ? new Date(created) : new Date(0);
  }
  return new Date(`${notification.dateStart}T${notification.timeStart || '00:00'}`);
}

export function getNotificationEndDateTime(notification) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    const updated = toMillis(notification.updatedAt);
    return updated ? new Date(updated) : new Date();
  }
  return new Date(`${notification.dateEnd}T${notification.timeEnd || '23:59'}`);
}

export function isNotificationActive(notification, now = new Date()) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    return Boolean(notification.manualActive);
  }

  const start = getNotificationStartDateTime(notification);
  const end = getNotificationEndDateTime(notification);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return start <= now && end >= now;
}

export function isNotificationUpcoming(notification, now = new Date()) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    return false;
  }

  const start = getNotificationStartDateTime(notification);
  if (Number.isNaN(start.getTime())) return false;
  return start > now;
}

export function isNotificationPast(notification, now = new Date()) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    return !notification.manualActive;
  }

  const end = getNotificationEndDateTime(notification);
  if (Number.isNaN(end.getTime())) return false;
  return end < now;
}

export function getNotificationStatus(notification, now = new Date()) {
  if (isNotificationActive(notification, now)) return 'active';
  if (isNotificationUpcoming(notification, now)) return 'upcoming';
  return 'past';
}

export function sortNotificationsByStart(notifications, descending = false) {
  return [...notifications].sort((a, b) => {
    const diff = getNotificationStartDateTime(a) - getNotificationStartDateTime(b);
    return descending ? -diff : diff;
  });
}

export function sortActiveNotificationsByCreated(notifications, descending = true) {
  return [...notifications].sort((a, b) => {
    const aCreated = toMillis(a.createdAt) ?? 0;
    const bCreated = toMillis(b.createdAt) ?? 0;
    return descending ? bCreated - aCreated : aCreated - bCreated;
  });
}

export function partitionAdminNotificationList(notifications, descending = false, now = new Date()) {
  const active = sortNotificationsByStart(
    notifications.filter((item) => isNotificationActive(item, now)),
    descending,
  );
  const upcoming = sortNotificationsByStart(
    notifications.filter((item) => isNotificationUpcoming(item, now)),
    descending,
  );
  const past = sortNotificationsByStart(
    notifications.filter((item) => isNotificationPast(item, now)),
    descending,
  );

  return { active, upcoming, past };
}

export function notificationMatchesSearch(notification, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return notification.title.toLowerCase().includes(needle)
    || stripHtml(notification.text).toLowerCase().includes(needle);
}

export function formatNotificationScheduleLabel(notification) {
  if (notification.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual) {
    return notification.manualActive ? 'Ručně zapnuto' : 'Ručně vypnuto';
  }

  const start = getNotificationStartDateTime(notification);
  const end = getNotificationEndDateTime(notification);
  const startLabel = Number.isNaN(start.getTime())
    ? '—'
    : start.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const endLabel = Number.isNaN(end.getTime())
    ? '—'
    : end.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return `${startLabel} – ${endLabel}`;
}

function normalizeScheduleMode(value) {
  return value === NOTIFICATION_SCHEDULE_MODES.manual
    ? NOTIFICATION_SCHEDULE_MODES.manual
    : NOTIFICATION_SCHEDULE_MODES.scheduled;
}

function normalizeColor(value) {
  return NOTIFICATION_COLOR_IDS.includes(value) ? value : DEFAULT_NOTIFICATION.color;
}

function normalizeIcon(value) {
  return NOTIFICATION_ICON_IDS.includes(value) ? value : DEFAULT_NOTIFICATION.icon;
}

export function normalizeNotification(raw = {}) {
  const scheduleMode = normalizeScheduleMode(raw.scheduleMode);
  return {
    id: typeof raw.id === 'string' ? raw.id : '',
    title: typeof raw.title === 'string' ? raw.title.trim() : '',
    text: typeof raw.text === 'string' ? raw.text.trim() : '',
    scheduleMode,
    manualActive: Boolean(raw.manualActive),
    dateStart: typeof raw.dateStart === 'string' ? raw.dateStart : '',
    timeStart: typeof raw.timeStart === 'string' ? raw.timeStart : '',
    dateEnd: typeof raw.dateEnd === 'string' ? raw.dateEnd : '',
    timeEnd: typeof raw.timeEnd === 'string' ? raw.timeEnd : '',
    color: normalizeColor(raw.color),
    icon: normalizeIcon(raw.icon),
    ctaEnabled: Boolean(raw.ctaEnabled),
    ctaLabel: typeof raw.ctaLabel === 'string' ? raw.ctaLabel.trim() : '',
    ctaHref: typeof raw.ctaHref === 'string' ? raw.ctaHref.trim() : '',
    ctaOpenInNewTab: Boolean(raw.ctaOpenInNewTab),
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

export function notificationToFormState(notification) {
  const base = normalizeNotification(notification);
  return {
    title: base.title,
    text: base.text,
    scheduleMode: base.scheduleMode,
    manualActive: base.manualActive,
    dateStart: base.dateStart,
    timeStart: base.timeStart,
    dateEnd: base.dateEnd,
    timeEnd: base.timeEnd,
    color: base.color,
    icon: base.icon,
    ctaEnabled: base.ctaEnabled,
    ctaLabel: base.ctaLabel,
    ctaHref: base.ctaHref,
    ctaOpenInNewTab: base.ctaOpenInNewTab,
  };
}

export function getDefaultNotificationFormState() {
  const now = new Date();
  const inWeek = new Date(now);
  inWeek.setDate(inWeek.getDate() + 7);

  return {
    ...notificationToFormState(DEFAULT_NOTIFICATION),
    dateStart: toIsoDate(now),
    timeStart: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    dateEnd: toIsoDate(inWeek),
    timeEnd: '23:59',
  };
}

export function notificationHasCta(item) {
  return Boolean(item?.ctaLabel?.trim() && item?.ctaHref?.trim());
}

export function formStateToNotificationPayload(form) {
  const ctaEnabled = notificationHasCta(form);
  return {
    title: form.title.trim(),
    text: form.text.trim(),
    scheduleMode: normalizeScheduleMode(form.scheduleMode),
    manualActive: Boolean(form.manualActive),
    dateStart: form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual ? '' : form.dateStart,
    timeStart: form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual ? '' : form.timeStart,
    dateEnd: form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual ? '' : form.dateEnd,
    timeEnd: form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.manual ? '' : form.timeEnd,
    color: normalizeColor(form.color),
    icon: normalizeIcon(form.icon),
    ctaEnabled,
    ctaLabel: ctaEnabled ? form.ctaLabel.trim() : '',
    ctaHref: ctaEnabled ? form.ctaHref.trim() : '',
    ctaOpenInNewTab: ctaEnabled ? Boolean(form.ctaOpenInNewTab) : false,
  };
}

export function validateNotificationForm(form) {
  const errors = {};

  if (!form.title.trim()) {
    errors.title = 'Vyplňte název upozornění.';
  }

  if (!hasNotificationText(form.text)) {
    errors.text = 'Vyplňte text upozornění.';
  }

  if (form.scheduleMode === NOTIFICATION_SCHEDULE_MODES.scheduled) {
    if (!form.dateStart) errors.dateStart = 'Vyplňte datum začátku.';
    if (!form.timeStart) errors.timeStart = 'Vyplňte čas začátku.';
    if (!form.dateEnd) errors.dateEnd = 'Vyplňte datum konce.';
    if (!form.timeEnd) errors.timeEnd = 'Vyplňte čas konce.';

    const start = getNotificationStartDateTime({ ...form, scheduleMode: NOTIFICATION_SCHEDULE_MODES.scheduled });
    const end = getNotificationEndDateTime({ ...form, scheduleMode: NOTIFICATION_SCHEDULE_MODES.scheduled });
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end < start) {
      errors.dateEnd = 'Konec musí být po začátku.';
    }
  }

  const ctaLabel = form.ctaLabel.trim();
  const ctaHref = form.ctaHref.trim();
  if (ctaLabel && !ctaHref) {
    errors.ctaHref = 'Vyplňte odkaz tlačítka.';
  }
  if (ctaHref && !ctaLabel) {
    errors.ctaLabel = 'Vyplňte text tlačítka.';
  }

  return errors;
}

let notificationsPopupHandledThisDocument = false;

export function wereNotificationsHandledThisSession() {
  return notificationsPopupHandledThisDocument;
}

export function markNotificationsHandledThisSession() {
  notificationsPopupHandledThisDocument = true;
}
