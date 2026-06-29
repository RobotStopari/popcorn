import { EVENT_CATEGORIES } from './event-categories';
import { FOOTER_SOCIAL_PRESET_IDS } from './social-link-presets';
import { SITE } from './site';
import { SOCIALS } from './socials';
import { DEFAULT_SITE_TEXTS } from './site-texts';

export const SITE_SETTINGS_DOC_ID = 'config';

const FOOTER_SOCIAL_SLOT_COUNT = 3;

function findSocialHref(id) {
  return SOCIALS.find((item) => item.id === id)?.href || '';
}

export const DEFAULT_BRAND_LINKS = {
  instagram: findSocialHref('instagram') || 'https://www.instagram.com/popcorn_puk/',
  facebook: findSocialHref('facebook') || 'https://www.facebook.com/groups/popcorn.puk',
  mail: findSocialHref('email') || 'mailto:popcorn@kurzzapalovac.cz',
  youtube: '',
  tiktok: '',
  linkedin: '',
};

export const DEFAULT_FOOTER_SOCIAL_SLOTS = [
  { preset: 'instagram', enabled: true },
  { preset: 'facebook', enabled: true },
  { preset: 'mail', enabled: true },
];

export const DEFAULT_SITE_SETTINGS = {
  logoUrl: SITE.logo,
  logoPublicId: '',
  logoAlt: SITE.logoAlt,
  brandLine1: SITE.brand.line1,
  brandLine2: SITE.brand.line2,
  footerYear: SITE.footer.year,
  footerContactLabel: SITE.footer.contactLabel,
  footerContactEmail: SITE.footer.contactEmail,
  brandLinks: { ...DEFAULT_BRAND_LINKS },
  footerSocialSlots: DEFAULT_FOOTER_SOCIAL_SLOTS.map((slot) => ({ ...slot })),
  comingSoonEnabled: false,
  anonymousBlogLikesEnabled: true,
  membersCanCreateBlogPosts: true,
  eventCategoryPublicLabel: EVENT_CATEGORIES.public.label,
  eventCategoryPublicDescription: EVENT_CATEGORIES.public.description,
  eventCategoryPrivateLabel: EVENT_CATEGORIES.private.label,
  eventCategoryPrivateDescription: EVENT_CATEGORIES.private.description,
  eventCategoryExternalLabel: EVENT_CATEGORIES.external.label,
  eventCategoryExternalDescription: EVENT_CATEGORIES.external.description,
};

export const SITE_SETTINGS_SECTIONS = [
  { id: 'branding', title: 'Značka a logo' },
  { id: 'socials', title: 'Sociální sítě webu' },
  { id: 'footer', title: 'Patička' },
  { id: 'options', title: 'Možnosti' },
];

export const BRAND_LINK_FIELDS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'mail', label: 'E-mail' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
];

export const EVENT_CATEGORY_FIELDS = [
  {
    id: 'eventCategoryPublicLabel',
    label: 'Veřejná akce — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryPublicDescription',
    label: 'Veřejná akce — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    inputType: 'textarea',
  },
  {
    id: 'eventCategoryPrivateLabel',
    label: 'Soukromá akce — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryPrivateDescription',
    label: 'Soukromá akce — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    inputType: 'textarea',
  },
  {
    id: 'eventCategoryExternalLabel',
    label: 'Akce mimo Popcorn — název',
    hint: 'Karty, kalendář, legenda, admin i stránka akce',
    inputType: 'text',
  },
  {
    id: 'eventCategoryExternalDescription',
    label: 'Akce mimo Popcorn — popis na stránce akce',
    hint: 'Zobrazí se za dvojtečkou pod názvem akce',
    inputType: 'textarea',
  },
];

export const SITE_OPTION_TOGGLES = [
  {
    id: 'anonymousBlogLikesEnabled',
    label: 'Anonymní návštěvníci mohou lajkovat blog',
    hint: 'Vypnutím zůstanou lajky jen pro přihlášené uživatele.',
    icon: 'heart',
    defaultValue: true,
    confirmOn: {
      title: 'Povolit lajkování anonymně?',
      text: 'Anonymní návštěvníci budou moci lajkovat příspěvky na blogu bez přihlášení.',
    },
    confirmOff: {
      title: 'Vypnout anonymní lajkování?',
      text: 'Lajkovat příspěvky budou moci jen přihlášení uživatelé.',
    },
  },
  {
    id: 'membersCanCreateBlogPosts',
    label: 'Přihlášení uživatelé mohou zakládat příspěvky',
    hint: 'Vypnutím mohou příspěvky vytvářet jen administrátoři. Uživatelé si stále mohou upravovat vlastní starší příspěvky.',
    icon: 'pen',
    defaultValue: true,
    confirmOn: {
      title: 'Povolit zakládání příspěvků uživatelům?',
      text: 'Všichni přihlášení uživatelé budou moci vytvářet nové blogové příspěvky.',
    },
    confirmOff: {
      title: 'Zakázat zakládání příspěvků uživatelům?',
      text: 'Nové příspěvky budou moci vytvářet jen administrátoři. Stávající vlastní příspěvky si uživatelé stále upraví.',
    },
  },
  {
    id: 'comingSoonEnabled',
    label: 'Zobrazit „Již brzy“ místo celého webu',
    hint: 'Administrace zůstane dostupná. Veřejný web ukáže jednoduchou stránku s očekáváním.',
    icon: 'clock',
    defaultValue: false,
    confirmOn: {
      title: 'Zapnout režim „Již brzy“?',
      text: 'Veřejný web se nahradí stránkou s očekáváním. Administrace zůstane dostupná.',
    },
    confirmOff: {
      title: 'Zveřejnit celý web?',
      text: 'Režim „Již brzy“ se vypne a návštěvníci uvidí běžný web.',
    },
  },
];

export function normalizeFooterSocialSlots(rawSlots) {
  const source = Array.isArray(rawSlots) ? rawSlots : [];
  return Array.from({ length: FOOTER_SOCIAL_SLOT_COUNT }, (_, index) => {
    const slot = source[index] || {};
    const preset = FOOTER_SOCIAL_PRESET_IDS.includes(slot.preset) ? slot.preset : 'instagram';
    return {
      preset,
      enabled: Boolean(slot.enabled),
    };
  });
}

export function normalizeBrandLinks(raw = {}) {
  return BRAND_LINK_FIELDS.reduce((acc, field) => {
    const value = raw[field.id];
    acc[field.id] = typeof value === 'string' ? value : (DEFAULT_BRAND_LINKS[field.id] || '');
    return acc;
  }, {});
}

export function getBrandLinkHref(preset, brandLinks = DEFAULT_BRAND_LINKS) {
  if (!preset || preset === 'web') return '';
  return brandLinks[preset] || '';
}

export function parseInstagramUsername(url) {
  if (typeof url !== 'string' || !url.trim()) return '';

  const match = url.trim().match(/instagram\.com\/([^/?#]+)/i);
  if (!match) return '';

  const segment = match[1].replace(/^@/, '');
  if (['p', 'reel', 'reels', 'stories', 'explore', 'accounts'].includes(segment.toLowerCase())) {
    return '';
  }

  return segment;
}

export function getInstagramUsername(settings = DEFAULT_SITE_SETTINGS) {
  const brandLinks = settings?.brandLinks || DEFAULT_BRAND_LINKS;
  const fromUrl = parseInstagramUsername(brandLinks.instagram);
  if (fromUrl) return fromUrl;

  const legacy = settings?.instagramUsername;
  if (typeof legacy === 'string' && legacy.trim()) {
    return legacy.trim().replace(/^@/, '');
  }

  return parseInstagramUsername(DEFAULT_BRAND_LINKS.instagram) || 'popcorn_puk';
}

export function getInstagramProfileUrl(settings) {
  const href = settings?.brandLinks?.instagram?.trim() || DEFAULT_BRAND_LINKS.instagram;
  if (href) return href;

  const username = getInstagramUsername(settings);
  return `https://www.instagram.com/${username}/`;
}

export function getEventCategoryTexts(settings = DEFAULT_SITE_SETTINGS) {
  return EVENT_CATEGORY_FIELDS.reduce((acc, field) => {
    acc[field.id] = typeof settings[field.id] === 'string'
      ? settings[field.id]
      : (DEFAULT_SITE_TEXTS[field.id] || '');
    return acc;
  }, {});
}

export const FOOTER_SOCIAL_SLOT_LIMIT = FOOTER_SOCIAL_SLOT_COUNT;
