/** Build a Google Calendar event URL from structured event data */
import { siteText } from './admin-text';

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
  if (event.sraz) lines.push(`${siteText('events.detail.fields.departure')}: ${event.sraz}`);
  if (event.navrat) lines.push(`${siteText('events.detail.fields.return')}: ${event.navrat}`);
  if (event.misto || event.place) lines.push(`${siteText('events.detail.fields.place')}: ${event.misto || event.place}`);
  if (event.cena) lines.push(`${siteText('events.detail.fields.price')}: ${event.cena}`);

  const organisersTitle = siteText('events.detail.organisersTitle');
  const organisers = event.organisersBlock || event.organisers;
  if (organisers?.contacts?.length) {
    lines.push('', `${organisers.label || organisersTitle}:`);
    organisers.contacts.forEach((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      lines.push(parts.join(' · '));
    });
  } else if (Array.isArray(organisers) && organisers.length) {
    lines.push('', `${organisersTitle}:`);
    organisers.forEach((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(contact.email);
      if (contact.phone) parts.push(contact.phone);
      lines.push(parts.join(' · '));
    });
  }

  return lines.join('\n');
}
