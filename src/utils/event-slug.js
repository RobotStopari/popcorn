import { slugifyTitle, SLUG_PATTERN } from '../../shared/slug.js';
import { suggestUniqueEventSlug } from '../../shared/event-url.js';

export { slugifyTitle, SLUG_PATTERN };

export function suggestEventSlugFromTitle(title) {
  return slugifyTitle(title);
}

export function ensureUniqueEventSlug(title, slug, events, currentEventId = '') {
  const existing = new Set(
    events
      .filter((event) => event.id !== currentEventId)
      .map((event) => event.slug)
      .filter(Boolean),
  );
  const trimmed = slug?.trim() || '';
  if (trimmed && SLUG_PATTERN.test(trimmed) && !existing.has(trimmed)) {
    return trimmed;
  }
  return suggestUniqueEventSlug(title, existing, trimmed);
}

export function validateEventSlug(slug) {
  if (!slug?.trim()) return 'URL akce je povinná.';
  if (!SLUG_PATTERN.test(slug.trim())) {
    return 'URL smí obsahovat jen malá písmena, čísla a pomlčky.';
  }
  return null;
}
