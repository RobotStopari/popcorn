export function parseSearchTerms(query) {
  return String(query || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function collectAllKeywordsFromItems(items, getKeywords = (item) => item.keywords) {
  const keywords = new Set();

  items.forEach((item) => {
    (getKeywords(item) || []).forEach((keyword) => {
      if (keyword?.trim()) keywords.add(keyword.trim());
    });
  });

  return [...keywords].sort((a, b) => a.localeCompare(b, 'cs'));
}

/** Ranked text search: title/name first, then keywords, then content. No keyword-chip filtering. */
export function filterItemsByKeywordSearch(items, query, {
  scoreItem,
  sortItems = (list) => list,
}) {
  const trimmed = String(query || '').trim().toLowerCase();
  if (!trimmed) return sortItems(items);
  if (!scoreItem) return sortItems(items);

  return items
    .map((item) => ({ item, score: scoreItem(item, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
