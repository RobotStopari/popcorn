const STORAGE_KEY = 'popcorn-blog-anonymous-id';

function createAnonymousId() {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `anon_${uuid}`;
}

export function getAnonymousLikeId() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const next = createAnonymousId();
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return createAnonymousId();
  }
}
