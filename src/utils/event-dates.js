export const MONTHS_GENITIVE = [
  'ledna', 'února', 'března', 'dubna', 'května', 'června',
  'července', 'srpna', 'září', 'října', 'listopadu', 'prosince',
];

const WEEKDAYS = ['neděle', 'pondělí', 'úterý', 'středa', 'čvrtek', 'pátek', 'sobota'];

export function parseIsoDate(iso) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getEventStartDateTime(event) {
  return new Date(`${event.dateStart}T${event.timeStart || '00:00'}`);
}

export function getEventEndDateTime(event) {
  return new Date(`${event.dateEnd}T${event.timeEnd || '23:59'}`);
}

export function isEventPast(event, now = new Date()) {
  if (!event.dateEnd || !event.timeEnd) return false;
  const end = getEventEndDateTime(event);
  if (Number.isNaN(end.getTime())) return false;
  return end <= now;
}

export function suggestEndDate(dateStart) {
  if (!dateStart) return '';
  const start = parseIsoDate(dateStart);
  const end = new Date(start);
  if (start.getDay() === 5) {
    end.setDate(end.getDate() + 2);
  }
  return toIsoDate(end);
}

export function validateDateRange(event) {
  if (!event.dateStart || !event.timeStart || !event.dateEnd || !event.timeEnd) {
    return 'Vyplňte datum a čas začátku i konce akce.';
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
  return event.published !== false;
}

export function getAllUpcoming(events, now = new Date()) {
  return events
    .filter((event) => {
      if (!isPublicListedEvent(event)) return false;
      if (!event.dateEnd || !event.timeEnd) return false;
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
      if (!event.dateEnd || !event.timeEnd) return false;
      const end = getEventEndDateTime(event);
      if (Number.isNaN(end.getTime())) return false;
      return end <= now;
    })
    .sort((a, b) => getEventEndDateTime(b) - getEventEndDateTime(a));
}

export function sortAdminEventList(events, descending = true) {
  const drafts = events.filter((event) => event.isDraft);
  const rest = events.filter((event) => !event.isDraft);

  const sortDrafts = [...drafts].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() || a.updatedAt?.toMillis?.() || 0;
    const bTime = b.createdAt?.toMillis?.() || b.updatedAt?.toMillis?.() || 0;
    return bTime - aTime;
  });

  return [...sortDrafts, ...sortByStart(rest, descending)];
}
