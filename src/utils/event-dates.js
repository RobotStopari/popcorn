export const MONTHS_GENITIVE = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

const WEEKDAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čvrtek', 'pátek', 'sobota'];

export function parseIsoDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || '').trim());
  if (!match) return new Date(NaN);
  // Noon avoids DST midnight edge cases when reading weekday/calendar day.
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
}

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Weekday for a YYYY-MM-DD calendar date: 0=Sun … 5=Fri … 6=Sat (timezone-independent). */
export function getCalendarWeekday(isoDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!match) return null;
  return new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
  )).getUTCDay();
}

export function addCalendarDays(isoDate, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || '').trim());
  if (!match) return '';
  const date = new Date(Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
  ));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getEventStartDateTime(event) {
  return new Date(`${event.dateStart}T${event.timeStart || '00:00'}`);
}

export function getEventEndDateTime(event) {
  return new Date(`${event.dateEnd}T${event.timeEnd || '23:59'}`);
}

export function isEventPast(event, now = new Date()) {
  if (!event.dateEnd) return false;
  const end = getEventEndDateTime(event);
  if (Number.isNaN(end.getTime())) return false;
  return end <= now;
}

/** Friday start → following Sunday; otherwise same day. */
export function suggestEndDate(dateStart) {
  const iso = String(dateStart || '').trim();
  if (!iso) return '';
  const weekday = getCalendarWeekday(iso);
  if (weekday === null) return iso;
  if (weekday === 5) return addCalendarDays(iso, 2);
  return iso;
}

export function isCompleteEventTime(value) {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

/** Suggest end time from a completed start time. Empty string = no suggestion. */
export function suggestEndTime(timeStart, dateStart = '', dateEnd = '') {
  const raw = String(timeStart || '').trim();
  if (!isCompleteEventTime(raw)) return '';

  const start = raw.slice(0, 5);
  const sameDay = !dateStart || !dateEnd || dateStart === dateEnd;
  if (!sameDay) return start;

  const [hours, minutes] = start.split(':').map(Number);
  const totalMinutes = Math.min(hours * 60 + minutes + 60, 23 * 60 + 59);
  const end = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
  return end > start ? end : '';
}

export function eventHasMissingTimes(event) {
  return !String(event?.timeStart || '').trim() || !String(event?.timeEnd || '').trim();
}

export function validateDateRange(event) {
  if (!event.dateStart || !event.dateEnd) {
    return 'Vyplňte datum začátku i konce akce.';
  }

  const startYear = Number(String(event.dateStart).slice(0, 4));
  const endYear = Number(String(event.dateEnd).slice(0, 4));
  if (
    !Number.isFinite(startYear) || startYear < 2015 || startYear > 2300
    || !Number.isFinite(endYear) || endYear < 2015 || endYear > 2300
  ) {
    return 'Datum musí být v letech 2015 až 2300.';
  }

  const start = getEventStartDateTime(event);
  const end = getEventEndDateTime(event);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Neplatné datum nebo čas.';
  }

  if (start >= end) {
    return 'Začátek akce musí být před koncem.';
  }

  return '';
}

export function formatDayMonth(date) {
  return `${date.getDate()}. ${MONTHS_GENITIVE[date.getMonth()]}`;
}

export function formatEventDateLabel(event) {
  if (!event.dateStart || !event.dateEnd) return '—';

  const start = parseIsoDate(event.dateStart);
  const end = parseIsoDate(event.dateEnd);

  if (event.dateStart === event.dateEnd) {
    return `${formatDayMonth(start)} ${start.getFullYear()}`;
  }

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()}.–${end.getDate()}. ${MONTHS_GENITIVE[start.getMonth()]} ${start.getFullYear()}`;
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${start.getFullYear()}`;
  }

  return `${formatDayMonth(start)} ${start.getFullYear()} – ${formatDayMonth(end)} ${end.getFullYear()}`;
}

export function formatSchedulePart(dateIso, time) {
  if (!dateIso || !time) return '—';
  const date = parseIsoDate(dateIso);
  const weekday = WEEKDAYS[date.getDay()];
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalizedWeekday} ${date.getDate()}. ${date.getMonth() + 1}., ${time}`;
}

export function sortByStart(events, descending = true) {
  return [...events].sort((a, b) => {
    const diff = getEventStartDateTime(a) - getEventStartDateTime(b);
    return descending ? -diff : diff;
  });
}

export function getTopUpcoming(events, limit = 3) {
  return getAllUpcoming(events).slice(0, limit);
}

export function getTopPast(events, limit = 3) {
  const now = new Date();
  return getAllPast(events, now).slice(0, limit);
}

function isPublicListedEvent(event) {
  return event.published !== false && !event.calendarOnly;
}

export function getAllUpcoming(events, now = new Date()) {
  return events
    .filter((event) => {
      if (!isPublicListedEvent(event)) return false;
      if (!event.dateEnd) return false;
      const end = getEventEndDateTime(event);
      if (Number.isNaN(end.getTime())) return false;
      return end > now;
    })
    .sort((a, b) => getEventStartDateTime(a) - getEventStartDateTime(b));
}

export function getAllPast(events, now = new Date()) {
  return events
    .filter((event) => {
      if (!isPublicListedEvent(event)) return false;
      if (!event.dateEnd) return false;
      const end = getEventEndDateTime(event);
      if (Number.isNaN(end.getTime())) return false;
      return end <= now;
    })
    .sort((a, b) => getEventEndDateTime(b) - getEventEndDateTime(a));
}

export function sortUpcomingEvents(events, descending = false) {
  return [...events].sort((a, b) => {
    const aStart = getEventStartDateTime(a);
    const bStart = getEventStartDateTime(b);
    const aValid = !Number.isNaN(aStart.getTime());
    const bValid = !Number.isNaN(bStart.getTime());
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    const diff = aStart - bStart;
    return descending ? -diff : diff;
  });
}

export function sortPastEvents(events, descending = false) {
  return [...events].sort((a, b) => {
    const aEnd = getEventEndDateTime(a);
    const bEnd = getEventEndDateTime(b);
    const aValid = !Number.isNaN(aEnd.getTime());
    const bValid = !Number.isNaN(bEnd.getTime());
    if (!aValid && !bValid) return 0;
    if (!aValid) return 1;
    if (!bValid) return -1;
    const diff = aEnd - bEnd;
    return descending ? diff : -diff;
  });
}

function sortDraftEvents(events) {
  return [...events].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });
}

/** Admin list: drafts, then upcoming (soonest first), then past (most recent first). */
export function partitionAdminEventList(events, descending = false, now = new Date()) {
  const drafts = sortDraftEvents(events.filter((event) => event.isDraft));
  const rest = events.filter((event) => !event.isDraft);
  const upcoming = sortUpcomingEvents(rest.filter((event) => !isEventPast(event, now)), descending);
  const past = sortPastEvents(rest.filter((event) => isEventPast(event, now)), descending);

  return { drafts, upcoming, past };
}

export function sortAdminEventList(events, descending = false, now = new Date()) {
  const { drafts, upcoming, past } = partitionAdminEventList(events, descending, now);
  return [...drafts, ...upcoming, ...past];
}
