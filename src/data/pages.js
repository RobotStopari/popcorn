import {
  COMING_SOON_PAGE_SLUG,
  NOT_FOUND_PAGE_ID,
  NOT_FOUND_PAGE_SLUG,
  isHiddenPublicPageSlug,
} from '../../shared/page-system.js';

export const PAGE_TYPES = {
  home: 'home',
  eventsUpcoming: 'events-upcoming',
  eventsPast: 'events-past',
  blogList: 'blog-list',
  content: 'content',
};

export const PAGE_TYPE_LABELS = {
  [PAGE_TYPES.home]: 'Hlavní stránka',
  [PAGE_TYPES.eventsUpcoming]: 'Nadcházející akce',
  [PAGE_TYPES.eventsPast]: 'Proběhlé akce',
  [PAGE_TYPES.blogList]: 'Blog',
  [PAGE_TYPES.content]: 'Obsah',
};

export {
  COMING_SOON_PAGE_SLUG,
  NOT_FOUND_PAGE_ID,
  NOT_FOUND_PAGE_SLUG,
  isHiddenPublicPageSlug,
};

export const COMING_SOON_PAGE_ID = 'coming-soon';
export const NOT_FOUND_PAGE_ADMIN_TITLE = '404 – Stránka nenalezena';

export const STANDALONE_CONTENT_PAGE_IDS = [COMING_SOON_PAGE_ID, NOT_FOUND_PAGE_ID];

export const RESERVED_SLUGS = ['event', 'akce', 'admin', COMING_SOON_PAGE_SLUG, NOT_FOUND_PAGE_SLUG];

export const SYSTEM_PAGE_CONFIG = {
  home: { noDelete: true, lockName: true, lockSlug: true },
  vypukne: { noDelete: true },
  probehle: { noDelete: true },
  blog: { noDelete: true },
  [COMING_SOON_PAGE_ID]: { noDelete: true, lockSlug: true, hideSlug: true },
  [NOT_FOUND_PAGE_ID]: { noDelete: true, lockName: true, lockSlug: true, hideSlug: true },
};

export const DEFAULT_PAGES = [
  {
    id: 'home',
    slug: '',
    title: 'Komunita Popcorn',
    type: PAGE_TYPES.home,
  },
  {
    id: 'vypukne',
    slug: 'vypukne',
    title: 'VyPUKne',
    type: PAGE_TYPES.eventsUpcoming,
  },
  {
    id: 'probehle',
    slug: 'probehle',
    title: 'Proběhlé',
    type: PAGE_TYPES.eventsPast,
  },
  {
    id: 'blog',
    slug: 'blog',
    title: 'Blog',
    type: PAGE_TYPES.blogList,
  },
  {
    id: COMING_SOON_PAGE_ID,
    slug: COMING_SOON_PAGE_SLUG,
    title: 'Již brzy',
    type: PAGE_TYPES.content,
  },
  {
    id: NOT_FOUND_PAGE_ID,
    slug: NOT_FOUND_PAGE_SLUG,
    title: NOT_FOUND_PAGE_ADMIN_TITLE,
    type: PAGE_TYPES.content,
  },
  {
    id: 'co-je-popcorn',
    slug: 'co-je-popcorn',
    title: 'Co je Popcorn',
    type: PAGE_TYPES.content,
  },
  {
    id: 'vedeni-kontakt',
    slug: 'vedeni-kontakt',
    title: 'Vedení – Kontakt',
    type: PAGE_TYPES.content,
  },
  {
    id: 'pro-novacky',
    slug: 'pro-novacky',
    title: 'Pro nováčky',
    type: PAGE_TYPES.content,
  },
  {
    id: 'usporadej',
    slug: 'usporadej',
    title: 'Uspořádej akci!',
    type: PAGE_TYPES.content,
  },
  {
    id: 'odkazy',
    slug: 'odkazy',
    title: 'Odkazy',
    type: PAGE_TYPES.content,
  },
];

export const PINNED_PAGE_IDS = ['home', 'vypukne', 'probehle', 'blog', COMING_SOON_PAGE_ID, NOT_FOUND_PAGE_ID];

export function filterAndGroupPages(pages, query = '') {
  const q = query.trim().toLowerCase();
  const matches = (page) => {
    if (!q) return true;
    const hay = `${getPageAdminListTitle(page)} ${page.slug} ${pagePath(page)}`.toLowerCase();
    return hay.includes(q);
  };

  const filtered = pages.filter(matches);
  const pinnedSet = new Set(PINNED_PAGE_IDS);

  const pinned = PINNED_PAGE_IDS
    .map((id) => filtered.find((page) => page.id === id))
    .filter(Boolean);

  const rest = filtered
    .filter((page) => !pinnedSet.has(page.id))
    .sort((a, b) => a.title.localeCompare(b.title, 'cs'));

  return { pinned, rest };
}

export function getSystemFlags(pageId) {
  return SYSTEM_PAGE_CONFIG[pageId] || {};
}

export function isSlugValid(slug, { allowEmpty = false } = {}) {
  if (slug === '') return allowEmpty;
  if (RESERVED_SLUGS.includes(slug)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function pagePath(page) {
  return page?.slug ? `/${page.slug}` : '/';
}

export const PAGE_INTRO_DEFAULTS = {
  vypukne: 'Těšíme se na setkání s vámi na těchto akcích. Vyberte si tu svou a přijďte zažít společné chvíle s komunitou Popcorn.',
  probehle: 'Za námi už je spousta skvělých setkání a zážitků. Prohlédněte si, co všechno jsme společně prožili.',
  blog: 'Inspirace, zkušenosti a příběhy z komunity Popcorn. Prohlédněte si naše blogové příspěvky.',
};

export const PAGE_INTRO_FIELD_COPY = {
  home: {
    label: 'Úvodní citát',
    hint: 'Velký citát na hlavní stránce',
  },
  vypukne: {
    label: 'Úvodní text VyPUKne',
    hint: 'Zobrazí se pod nadpisem stránky',
  },
  probehle: {
    label: 'Úvodní text Proběhlé',
    hint: 'Zobrazí se pod nadpisem stránky',
  },
  blog: {
    label: 'Úvodní text Blog',
    hint: 'Zobrazí se pod nadpisem stránky',
  },
};

export function pageHasIntroField(page) {
  return Boolean(page?.id && PAGE_INTRO_FIELD_COPY[page.id]);
}

export function getPageIntro(page) {
  const custom = page?.intro?.trim();
  if (custom) return custom;
  return PAGE_INTRO_DEFAULTS[page?.id] || '';
}

export function getPageIntroFieldCopy(page) {
  return PAGE_INTRO_FIELD_COPY[page?.id] || null;
}

export function canDeletePage(page) {
  return !getSystemFlags(page.id).noDelete;
}

export function canEditPageTitle(page) {
  return !getSystemFlags(page.id).lockName;
}

export function canEditPageSlug(page) {
  return !getSystemFlags(page.id).lockSlug;
}

export function pageHasPublicUrl(page) {
  return !getSystemFlags(page?.id).hideSlug;
}

export function getPageSlugLabel(page) {
  if (!pageHasPublicUrl(page)) return '—';
  return page?.type === PAGE_TYPES.home ? '/' : pagePath(page);
}

export function isStandaloneContentPage(page) {
  return STANDALONE_CONTENT_PAGE_IDS.includes(page?.id);
}

export function isStandalonePageWithEditableAdminTitle(page) {
  return page?.id === COMING_SOON_PAGE_ID;
}

export function getPageAdminListTitle(page) {
  if (page?.id === NOT_FOUND_PAGE_ID) return NOT_FOUND_PAGE_ADMIN_TITLE;
  return page?.title || '';
}

export { slugifyTitle } from '../../shared/slug.js';
