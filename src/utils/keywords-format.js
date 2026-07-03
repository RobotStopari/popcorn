export const MAX_KEYWORDS = 15;

export function normalizeKeywords(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);
}

export function parseKeywordsInput(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);
}

export function keywordsToInput(keywords) {
  return (keywords || []).join(', ');
}
