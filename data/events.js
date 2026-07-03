/** Build URL for an event detail page */
export function eventUrl(id) {
  return `event.html?id=${encodeURIComponent(id)}`;
}

/** Card events for upcoming / past sections */
export const CARD_EVENTS = {
  upcoming: [],
  past: [],
};

/** Calendar events (multi-day bars) */
export const CALENDAR_EVENTS = [];

export const CALENDAR_LOCALE = {
  months: [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
  ],
  weekdays: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
};

/** Find a card event by id; returns { event, past } or null */
export function getEventById(id) {
  const upcoming = CARD_EVENTS.upcoming.find((e) => e.id === id);
  if (upcoming) return { event: upcoming, past: false };

  const past = CARD_EVENTS.past.find((e) => e.id === id);
  if (past) return { event: past, past: true };

  return null;
}
