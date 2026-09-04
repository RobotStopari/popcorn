/** Shared CRUD categories for blog, publications, and useful links. */

export const RESOURCE_CATEGORY_TYPES = {
  blog: {
    id: 'blog',
    settingsKey: 'blogCategories',
    title: 'Kategorie blogu',
    subtitle: 'Kategorie se zobrazují na kartách příspěvků a slouží k filtrování na stránce blogu.',
    emptyHint: 'Zatím žádné kategorie. Bez kategorií se filtr na blogu nezobrazí.',
    itemLabel: 'příspěvek',
  },
  publication: {
    id: 'publication',
    settingsKey: 'publicationCategories',
    title: 'Kategorie publikací',
    subtitle: 'Kategorie se zobrazují na kartách knih a slouží k filtrování na stránce publikací.',
    emptyHint: 'Zatím žádné kategorie. Bez kategorií se filtr na stránce publikací nezobrazí.',
    itemLabel: 'publikace',
  },
  usefulLink: {
    id: 'usefulLink',
    settingsKey: 'usefulLinkCategories',
    title: 'Kategorie odkazů',
    subtitle: 'Kategorie se zobrazují na kartách odkazů a slouží k filtrování na stránce odkazů.',
    emptyHint: 'Zatím žádné kategorie. Bez kategorií se filtr na stránce odkazů nezobrazí.',
    itemLabel: 'odkaz',
  },
};

export const MAX_RESOURCE_CATEGORIES = 40;

export function createResourceCategoryId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `rc_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeResourceCategoryItem(raw = {}) {
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  if (!id || !label) return null;

  return {
    id: id.slice(0, 40),
    label: label.slice(0, 80),
  };
}

export function normalizeResourceCategoriesList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeResourceCategoryItem(item))
    .filter(Boolean)
    .slice(0, MAX_RESOURCE_CATEGORIES);
}

export function getResourceCategories(settings, type) {
  const meta = RESOURCE_CATEGORY_TYPES[type];
  if (!meta) return [];
  return normalizeResourceCategoriesList(settings?.[meta.settingsKey]);
}

export function getResourceCategoryLabel(categories, categoryId) {
  const id = typeof categoryId === 'string' ? categoryId.trim() : '';
  if (!id) return '';
  return categories.find((item) => item.id === id)?.label || '';
}

export function normalizeItemCategoryId(value, categories = null) {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id) return '';
  if (Array.isArray(categories)) {
    return categories.some((item) => item.id === id) ? id : '';
  }
  return id.slice(0, 40);
}

export function filterItemsByCategory(items, categoryId) {
  const id = typeof categoryId === 'string' ? categoryId.trim() : '';
  if (!id) return items;
  return items.filter((item) => item.categoryId === id);
}
