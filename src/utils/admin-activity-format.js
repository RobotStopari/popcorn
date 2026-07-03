import { MONTHS_GENITIVE } from './event-dates';

export function formatAdminActivityTimestamp(value) {
  if (!value) return '—';

  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  const day = date.getDate();
  const month = MONTHS_GENITIVE[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}. ${month} ${year}, ${hours}:${minutes}`;
}
