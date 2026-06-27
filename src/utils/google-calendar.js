/** Build a Google Calendar event URL from structured event data */
export function buildGoogleCalendarUrl(event) {
  const start = formatGoogleDateTime(event.dateStart, event.timeStart);
  const end = formatGoogleDateTime(event.dateEnd, event.timeEnd);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name || event.title,
    dates: `${start}/${end}`,
    details: buildCalendarDetails(event),
    location: event.misto || event.place || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function formatGoogleDateTime(date, time) {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = (time || '00:00').split(':');
  return `${year}${month}${day}T${hours}${minutes}00`;
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildCalendarDetails(event) {
  const lines = [];

  if (event.description) lines.push(stripHtml(event.description));
  if (event.sraz) lines.push(`Sraz: ${event.sraz}`);
  if (event.navrat) lines.push(`Návrat: ${event.navrat}`);
  if (event.misto || event.place) lines.push(`Místo: ${event.misto || event.place}`);
  if (event.cena) lines.push(`Cena: ${event.cena}`);

  const organisers = event.organisersBlock || event.organisers;
  if (organisers?.contacts?.length) {
    lines.push('', `${organisers.label || 'Organizátoři'}:`);
    organisers.contacts.forEach((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      lines.push(parts.join(' · '));
    });
  } else if (Array.isArray(organisers) && organisers.length) {
    lines.push('', 'Organizátoři:');
    organisers.forEach((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      lines.push(parts.join(' · '));
    });
  }

  return lines.join('\n');
}
