export const MAX_EVENT_STAMPS = 24;

export function createEventStampId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `stamp-${crypto.randomUUID()}`;
  }
  return `stamp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Keep a single letter or one emoji grapheme. */
export function normalizeStampIcon(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    const first = [...segmenter.segment(text)][0]?.segment || '';
    return first;
  }

  return Array.from(text)[0] || '';
}

export function normalizeEventStampItem(raw = {}) {
  const icon = normalizeStampIcon(raw.icon);
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, 80) : '';
  if (!icon || !name) return null;

  const id = typeof raw.id === 'string' && raw.id.trim()
    ? raw.id.trim().slice(0, 64)
    : createEventStampId();

  return { id, icon, name };
}

export function normalizeEventStampsList(raw) {
  if (!Array.isArray(raw)) return [];

  const seen = new Set();
  const result = [];

  for (const item of raw) {
    const normalized = normalizeEventStampItem(item);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
    if (result.length >= MAX_EVENT_STAMPS) break;
  }

  return result;
}

export function getEventStampById(stamps, stampId) {
  if (!stampId || !Array.isArray(stamps)) return null;
  return stamps.find((item) => item.id === stampId) || null;
}

export function createEmptyEventStamp() {
  return {
    id: createEventStampId(),
    icon: '',
    name: '',
  };
}
