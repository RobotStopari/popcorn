/** Build URL for an event detail page */
export function eventUrl(id) {
  return `/event/${encodeURIComponent(id)}`;
}

export const CALENDAR_LOCALE = {
  months: [
    'leden', 'únor', 'březen', 'duben', 'květen', 'červen',
    'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec',
  ],
  weekdays: ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'],
};
