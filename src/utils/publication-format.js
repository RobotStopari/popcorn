import { adminText } from './admin-text';
import {
  keywordsToInput,
  MAX_KEYWORDS,
  normalizeKeywords,
  parseKeywordsInput,
} from './keywords-format';
import { filterItemsByKeywordSearch } from './keyword-search-format';

export const MAX_PUBLICATION_DESCRIPTION = 400;

export function normalizePublication(raw = {}) {
  if (!raw?.id) return null;

  const title = raw.title?.trim() || '';
  if (!title) return null;

  return {
    id: raw.id,
    title,
    author: raw.author?.trim() || '',
    description: raw.description?.trim() || '',
    keywords: normalizeKeywords(raw.keywords),
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function sortPublicationsByTitle(items = []) {
  return [...items].sort((a, b) => (
    a.title.localeCompare(b.title, 'cs', { sensitivity: 'base' })
  ));
}

export function publicationMatchesSearch(item, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    item.title,
    item.author,
    item.description,
    ...(item.keywords || []),
  ].join(' ').toLowerCase();

  return haystack.includes(needle);
}

function scorePublicationSearch(item, query) {
  if (item.title.toLowerCase().includes(query)) return 5;
  if ((item.keywords || []).some((keyword) => keyword.toLowerCase().includes(query))) return 4;
  if (item.author.toLowerCase().includes(query)) return 3;
  if (item.description.toLowerCase().includes(query)) return 2;
  return 0;
}

export function filterPublicationsBySearch(publications, query) {
  return filterItemsByKeywordSearch(publications, query, {
    scoreItem: scorePublicationSearch,
    sortItems: sortPublicationsByTitle,
  });
}

export function getDefaultPublicationFormState() {
  return {
    title: '',
    author: '',
    description: '',
    keywordsInput: '',
  };
}

export function publicationToFormState(publication) {
  if (!publication) return getDefaultPublicationFormState();

  return {
    title: publication.title || '',
    author: publication.author || '',
    description: publication.description || '',
    keywordsInput: keywordsToInput(publication.keywords),
  };
}

export function formStateToPublicationPayload(form) {
  return {
    title: form.title.trim(),
    author: form.author.trim(),
    description: form.description.trim(),
    keywords: parseKeywordsInput(form.keywordsInput),
  };
}

export function validatePublicationForm(form) {
  const errors = {};
  const title = form.title?.trim() || '';
  const author = form.author?.trim() || '';
  const description = form.description?.trim() || '';
  const keywords = parseKeywordsInput(form.keywordsInput);

  if (!title) {
    errors.title = adminText('publications.form.errors.titleRequired');
  } else if (title.length > 120) {
    errors.title = adminText('publications.form.errors.titleTooLong');
  }

  if (author.length > 120) {
    errors.author = adminText('publications.form.errors.authorTooLong');
  }

  if (description.length > MAX_PUBLICATION_DESCRIPTION) {
    errors.description = adminText('publications.form.errors.descriptionTooLong', {
      max: MAX_PUBLICATION_DESCRIPTION,
    });
  }

  if (keywords.length > MAX_KEYWORDS) {
    errors.keywordsInput = adminText('publications.form.errors.keywordsTooMany', {
      max: MAX_KEYWORDS,
    });
  }

  return errors;
}
