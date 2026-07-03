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

function shouldUseKeywordSearch(terms, allKeywords) {
  if (terms.length > 1) return true;

  if (terms.length === 1) {
    const lower = terms[0].toLowerCase();
    return allKeywords.some((keyword) => keyword.toLowerCase() === lower);
  }

  return false;
}

function itemMatchesAllKeywordTerms(item, terms, getKeywords) {
  return terms.every((term) => {
    const lower = term.toLowerCase();
    return (getKeywords(item) || []).some((keyword) => keyword.toLowerCase() === lower);
  });
}

export function filterItemsByKeywordSearch(items, query, {
  getKeywords = (item) => item.keywords,
  scoreItem,
  sortItems = (list) => list,
}) {
  const terms = parseSearchTerms(query);
  if (!terms.length) return sortItems(items);

  const allKeywords = collectAllKeywordsFromItems(items, getKeywords);

  if (shouldUseKeywordSearch(terms, allKeywords)) {
    return sortItems(items.filter((item) => itemMatchesAllKeywordTerms(item, terms, getKeywords)));
  }

  const trimmed = terms[0].toLowerCase();
  if (!scoreItem) return sortItems(items);

  return items
    .map((item) => ({ item, score: scoreItem(item, trimmed) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
