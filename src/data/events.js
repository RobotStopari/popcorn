import { deriveEventSlug } from '../../shared/event-url.js';

/** Build URL for an event detail page */
export function eventUrl(eventOrId) {
  if (typeof eventOrId === 'object' && eventOrId !== null) {
    const slug = deriveEventSlug(eventOrId);
    if (slug) return `/akce/${encodeURIComponent(slug)}`;
    if (eventOrId.id) return `/event/${encodeURIComponent(eventOrId.id)}`;
    return '/';
  }

  const value = String(eventOrId || '').trim();
  if (!value) return '/';
  return `/event/${encodeURIComponent(value)}`;
}

export { deriveEventSlug };

export const CALENDAR_LOCALE = {
  months: [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
  ],
  weekdays: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
};
