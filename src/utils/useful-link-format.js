import { adminText } from './admin-text';
import {
  keywordsToInput,
  MAX_KEYWORDS,
  normalizeKeywords,
  parseKeywordsInput,
} from './keywords-format';
import { filterItemsByKeywordSearch } from './keyword-search-format';

export const MAX_USEFUL_LINK_DESCRIPTION = 200;

export function normalizeUsefulLink(raw = {}) {
  if (!raw?.id) return null;

  const title = raw.title?.trim() || '';
  const url = raw.url?.trim() || '';
  if (!title || !url) return null;

  return {
    id: raw.id,
    title,
    url,
    description: raw.description?.trim() || '',
    keywords: normalizeKeywords(raw.keywords),
    categoryId: typeof raw.categoryId === 'string' ? raw.categoryId.trim().slice(0, 40) : '',
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || null,
  };
}

export function sortUsefulLinksByTitle(items = []) {
  return [...items].sort((a, b) => (
    a.title.localeCompare(b.title, 'cs', { sensitivity: 'base' })
  ));
}

export function usefulLinkMatchesSearch(item, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  const haystack = [
    item.title,
    item.url,
    item.description,
    ...(item.keywords || []),
  ].join(' ').toLowerCase();

  return haystack.includes(needle);
}

function scoreUsefulLinkSearch(item, query) {
  if (item.title.toLowerCase().includes(query)) return 5;
  if ((item.keywords || []).some((keyword) => keyword.toLowerCase().includes(query))) return 4;
  if (item.url.toLowerCase().includes(query)) return 3;
  if (item.description.toLowerCase().includes(query)) return 2;
  return 0;
}

export function filterUsefulLinksBySearch(links, query) {
  return filterItemsByKeywordSearch(links, query, {
    scoreItem: scoreUsefulLinkSearch,
    sortItems: sortUsefulLinksByTitle,
  });
}

export function getDefaultUsefulLinkFormState() {
  return {
    title: '',
    url: '',
    description: '',
    keywordsInput: '',
    categoryId: '',
  };
}

export function usefulLinkToFormState(link) {
  if (!link) return getDefaultUsefulLinkFormState();

  return {
    title: link.title || '',
    url: link.url || '',
    description: link.description || '',
    keywordsInput: keywordsToInput(link.keywords),
    categoryId: link.categoryId || '',
  };
}

export function formStateToUsefulLinkPayload(form) {
  return {
    title: form.title.trim(),
    url: form.url.trim(),
    description: form.description.trim(),
    keywords: parseKeywordsInput(form.keywordsInput),
    categoryId: typeof form.categoryId === 'string' ? form.categoryId.trim().slice(0, 40) : '',
  };
}

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateUsefulLinkForm(form) {
  const errors = {};
  const title = form.title?.trim() || '';
  const url = form.url?.trim() || '';
  const description = form.description?.trim() || '';
  const keywords = parseKeywordsInput(form.keywordsInput);

  if (!title) {
    errors.title = adminText('usefulLinks.form.errors.titleRequired');
  } else if (title.length > 120) {
    errors.title = adminText('usefulLinks.form.errors.titleTooLong');
  }

  if (!url) {
    errors.url = adminText('usefulLinks.form.errors.urlRequired');
  } else if (!isValidUrl(url)) {
    errors.url = adminText('usefulLinks.form.errors.urlInvalid');
  } else if (url.length > 500) {
    errors.url = adminText('usefulLinks.form.errors.urlTooLong');
  }

  if (description.length > MAX_USEFUL_LINK_DESCRIPTION) {
    errors.description = adminText('usefulLinks.form.errors.descriptionTooLong', {
      max: MAX_USEFUL_LINK_DESCRIPTION,
    });
  }

  if (keywords.length > MAX_KEYWORDS) {
    errors.keywordsInput = adminText('usefulLinks.form.errors.keywordsTooMany', {
      max: MAX_KEYWORDS,
    });
  }

  return errors;
}
