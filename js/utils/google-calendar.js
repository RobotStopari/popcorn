/** Build a Google Calendar event URL from structured event data */
export function buildGoogleCalendarUrl(event) {
  const start = formatGoogleDateTime(event.dateStart, event.timeStart);
  const end = formatGoogleDateTime(event.dateEnd, event.timeEnd);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${start}/${end}`,
    details: buildCalendarDetails(event),
    location: event.misto,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGoogleDateTime(date, time) {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function buildCalendarDetails(event) {
  const lines = [
    event.description,
    '',
    `Sraz: ${event.sraz}`,
    `Návrat: ${event.navrat}`,
    `Místo: ${event.misto}`,
    `Cena: ${event.cena}`,
  ];

  if (event.organisers?.contacts?.length) {
    lines.push('', `${event.organisers.label}:`);
    event.organisers.contacts.forEach((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      lines.push(parts.join(' · '));
    });
  }

  return lines.join('\n');
}
