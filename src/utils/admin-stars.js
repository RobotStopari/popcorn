export const ADMIN_STAR_FIELDS = {
  pages: 'starredPageIds',
  events: 'starredEventIds',
  blogPosts: 'starredBlogPostIds',
};

export function normalizeStarredIds(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const ids = [];

  value.forEach((item) => {
    if (typeof item !== 'string') return;
    const id = item.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids;
}

export function toggleStarredId(current, itemId) {
  const ids = normalizeStarredIds(current);
  const index = ids.indexOf(itemId);

  if (index >= 0) {
    return ids.filter((id) => id !== itemId);
  }

  return [...ids, itemId];
}

export function isStarred(starredIds, itemId) {
  return normalizeStarredIds(starredIds).includes(itemId);
}

export function filterStarredOnly(items, starredOnly, starredIds) {
  if (!starredOnly) return items;

  const starredSet = new Set(normalizeStarredIds(starredIds));
  return items.filter((item) => starredSet.has(item.id));
}

// Backward-compatible aliases for pages.
export const normalizeStarredPageIds = normalizeStarredIds;
export const toggleStarredPageId = toggleStarredId;
export const isPageStarred = isStarred;
