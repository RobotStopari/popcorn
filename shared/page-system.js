export const COMING_SOON_PAGE_SLUG = 'jiz-brzy';
export const NOT_FOUND_PAGE_ID = '404';
export const NOT_FOUND_PAGE_SLUG = '404-stranka';

export function isHiddenPublicPageSlug(slug) {
  return slug === COMING_SOON_PAGE_SLUG || slug === NOT_FOUND_PAGE_SLUG;
}

export function pageHasPublicUrl(pageId) {
  return pageId !== 'coming-soon' && pageId !== '404';
}
