export const DEFAULT_EVENT_CATEGORY = 'public';

export const EVENT_CATEGORIES = {
  public: {
    id: 'public',
    label: 'Popcorn – veřejná akce',
    description: 'Neboj se přizvat i své kamarády mimo komunitu Popcorn!',
  },
  private: {
    id: 'private',
    label: 'Popcorn – soukromá akce',
    description: 'Akce pouze pro Popcorňáky – absolventy Zapalovače.',
  },
  external: {
    id: 'external',
    label: 'Akce mimo Popcorn',
    description: 'Akci nepořádá Popcorn, ale společně na ni jedeme.',
  },
};

export const EVENT_CATEGORY_IDS = Object.keys(EVENT_CATEGORIES);

export function normalizeEventCategory(value) {
  if (value && EVENT_CATEGORIES[value]) return value;
  return DEFAULT_EVENT_CATEGORY;
}

export function buildEventCategoriesFromTexts(texts = {}) {
  return EVENT_CATEGORY_IDS.reduce((acc, id) => {
    const defaults = EVENT_CATEGORIES[id];
    acc[id] = {
      id,
      label: texts[`eventCategory${capitalize(id)}Label`]?.trim() || defaults.label,
      description: texts[`eventCategory${capitalize(id)}Description`]?.trim() || defaults.description,
    };
    return acc;
  }, {});
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getEventCategoryLabel(categoryId, categories = EVENT_CATEGORIES) {
  const id = normalizeEventCategory(categoryId);
  return categories[id]?.label || EVENT_CATEGORIES[id].label;
}

export function getEventCategoryDescription(categoryId, categories = EVENT_CATEGORIES) {
  const id = normalizeEventCategory(categoryId);
  return categories[id]?.description || EVENT_CATEGORIES[id].description;
}

export function isExternalEventCategory(categoryId) {
  return normalizeEventCategory(categoryId) === 'external';
}
