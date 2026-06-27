import { normalizeAuthor } from './blog-post-format';
import { MONTHS_GENITIVE } from './event-dates';

export const MAX_COMMENT_LENGTH = 2000;

export function normalizeComment(raw) {
  const author = normalizeAuthor(raw.author);

  return {
    id: raw.id,
    postId: raw.postId || '',
    body: raw.body?.trim() || '',
    author,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
    editedAt: raw.editedAt || null,
    isEdited: Boolean(raw.editedAt),
  };
}

export function formatCommentDateTime(comment) {
  const timestamp = comment.editedAt || comment.createdAt;
  if (!timestamp?.toDate) return '—';

  const date = timestamp.toDate();
  const base = `${date.getDate()}. ${MONTHS_GENITIVE[date.getMonth()]} ${date.getFullYear()}`;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${base}, ${hours}:${minutes}`;
}

export function validateCommentBody(body) {
  const trimmed = body?.trim() || '';
  if (!trimmed) return 'Komentář nemůže být prázdný.';
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return `Komentář může mít maximálně ${MAX_COMMENT_LENGTH} znaků.`;
  }
  return null;
}
