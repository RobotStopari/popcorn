export function formatJoinDate(timestamp) {
  if (!timestamp) return '—';

  const date = typeof timestamp.toDate === 'function'
    ? timestamp.toDate()
    : new Date(timestamp);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
