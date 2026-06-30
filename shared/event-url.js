import { slugifyTitle } from './slug.js';

export function deriveEventSlug(event) {
  if (!event) return '';
  if (event.slug?.trim()) return event.slug.trim();
  if (event.title?.trim()) return slugifyTitle(event.title);
  return event.id || '';
}

export function eventUrlPath(eventOrId) {
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

export function suggestUniqueEventSlug(title, existingSlugs, currentSlug = '') {
  const base = slugifyTitle(title);
  if (!base) return currentSlug || '';

  if (!existingSlugs.has(base) || base === currentSlug) return base;

  let index = 2;
  while (existingSlugs.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}
