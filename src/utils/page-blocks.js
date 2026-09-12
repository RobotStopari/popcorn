import { COMING_SOON_PAGE_ID, NOT_FOUND_PAGE_ID, PAGE_TYPES, isStandaloneContentPage } from '../data/pages';
import { normalizePageBlockButtonColor } from './page-block-button-color';
import { SITE } from '../data/site';
import {
  PAGE_BLOCK_ALIGNMENTS,
  PAGE_BLOCK_TYPES,
  MEDALLION_DESCRIPTION_PREVIEW_LENGTH,
  CARD_CAROUSEL_MIN_CARDS,
  CARD_CAROUSEL_MAX_CARDS,
  CARD_CAROUSEL_DESCRIPTION_MAX,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX,
  PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN,
  PAGE_BLOCK_IMAGE_TRIPLET_MAX_REM,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MAX,
  PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MIN,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX,
  PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN,
  PAGE_BLOCK_BUTTON_TEXT_SHARE_DEFAULT,
  PAGE_BLOCK_BUTTON_TEXT_SHARE_MAX,
  PAGE_BLOCK_BUTTON_TEXT_SHARE_MIN,
  PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
  PAGE_BLOCK_REFERENCE_GAP_DEFAULT,
  PAGE_BLOCK_REFERENCE_WIDE_TEXT_THRESHOLD,
  PAGE_BLOCK_IMAGE_TEXT_GAP_MAX,
  PAGE_BLOCK_IMAGE_TEXT_GAP_MIN,
  PAGE_BLOCK_GAP_AFTER_DEFAULT,
  PAGE_BLOCK_GAP_AFTER_MAX,
  PAGE_BLOCK_GAP_AFTER_MIN,
  LEGACY_PAGE_BLOCK_NEGATIVE_SPACE,
  LEGACY_PAGE_BLOCK_SPACE,
  PAGE_BLOCK_RANDOM_PICK_ALIGN_DEFAULT,
  PAGE_BLOCK_RANDOM_PICK_ALIGNMENTS,
  PAGE_BLOCK_WIDE_IMAGE_MAX_REM,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX,
  PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN,
  PARALLAX_BAND_HEIGHT_DEFAULT,
  PARALLAX_BAND_HEIGHT_MAX,
  PARALLAX_BAND_HEIGHT_MIN,
} from '../data/page-blocks';
import { getDefaultSocialLinkSlots, SOCIAL_LINK_PRESET_IDS } from '../data/social-link-presets';
import { normalizeParallaxOverlayFields } from './parallax-overlay';
import { parseYoutubeVideoId } from './rich-text-embeds';
import { DEFAULT_SITE_TEXTS } from '../data/site-texts';
import { SPACING_TEST_PAGE_SLUG, SPACING_TEST_PAGE_MAX_BLOCKS } from '../data/spacing-test-page';
import { MENU_LINK_TYPES } from '../data/site-menu';

const MAX_BLOCKS = 50;
const IMAGE_TRIPLET_COUNT = 3;
const BUTTON_PAIR_COUNT = 2;

export function canPageHaveBlocks(page) {
  if (!page) return false;
  return page.type === PAGE_TYPES.home || page.type === PAGE_TYPES.content;
}

export function createBlockId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeAlignment(value) {
  return PAGE_BLOCK_ALIGNMENTS.includes(value) ? value : 'left';
}

function normalizeRandomPickAlign(value) {
  return PAGE_BLOCK_RANDOM_PICK_ALIGNMENTS.includes(value)
    ? value
    : PAGE_BLOCK_RANDOM_PICK_ALIGN_DEFAULT;
}

export function getPageBlockLimit(pageOrSlug) {
  const slug = typeof pageOrSlug === 'string' ? pageOrSlug : pageOrSlug?.slug;
  if (slug === SPACING_TEST_PAGE_SLUG) return SPACING_TEST_PAGE_MAX_BLOCKS;
  return MAX_BLOCKS;
}

function clampHeightVh(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PARALLAX_BAND_HEIGHT_DEFAULT;
  return Math.min(PARALLAX_BAND_HEIGHT_MAX, Math.max(PARALLAX_BAND_HEIGHT_MIN, Math.round(parsed)));
}

export function clampGapAfterRem(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PAGE_BLOCK_GAP_AFTER_DEFAULT;
  return Math.min(
    PAGE_BLOCK_GAP_AFTER_MAX,
    Math.max(PAGE_BLOCK_GAP_AFTER_MIN, Math.round(parsed * 4) / 4),
  );
}

function legacySpaceHeightRem(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(12, Math.max(0.5, Math.round(parsed * 2) / 2));
}

function legacyNegativeSpacePullRem(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1.5;
  return Math.min(8, Math.max(0.5, Math.round(parsed * 2) / 2));
}

function clampImageLayoutWidthPercent(value, { defaultValue = PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return defaultValue;
  return Math.min(
    PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX,
    Math.max(PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN, Math.round(parsed)),
  );
}

function clampImageTripletGapRem(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT;
  return Math.min(
    PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX,
    Math.max(PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN, Math.round(parsed * 4) / 4),
  );
}

function clampImageTextSharePercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT;
  return Math.min(
    PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX,
    Math.max(PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN, Math.round(parsed)),
  );
}

function clampButtonTextSharePercent(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PAGE_BLOCK_BUTTON_TEXT_SHARE_DEFAULT;
  return Math.min(
    PAGE_BLOCK_BUTTON_TEXT_SHARE_MAX,
    Math.max(PAGE_BLOCK_BUTTON_TEXT_SHARE_MIN, Math.round(parsed)),
  );
}

function clampImageTextGapRem(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT;
  return Math.min(
    PAGE_BLOCK_IMAGE_TEXT_GAP_MAX,
    Math.max(PAGE_BLOCK_IMAGE_TEXT_GAP_MIN, Math.round(parsed * 4) / 4),
  );
}

function normalizeLightboxEnabled(value) {
  return value !== false;
}

function normalizeBorderEnabled(value) {
  return value !== false;
}

function normalizeCitationBold(value) {
  return value !== false;
}

function normalizeImageTextBlock(raw = {}) {
  return {
    html: typeof raw.html === 'string' ? raw.html : '',
    ...normalizePageBlockImage(raw),
    reversed: Boolean(raw.reversed),
    align: normalizeAlignment(raw.align),
    imageSharePercent: clampImageTextSharePercent(raw.imageSharePercent),
    gapRem: clampImageTextGapRem(raw.gapRem),
    lightboxEnabled: normalizeLightboxEnabled(raw.lightboxEnabled),
    borderEnabled: normalizeBorderEnabled(raw.borderEnabled),
  };
}

function normalizeButtonTextBlock(raw = {}) {
  return {
    html: typeof raw.html === 'string' ? raw.html : '',
    reversed: Boolean(raw.reversed),
    align: normalizeAlignment(raw.align),
    buttonSharePercent: clampButtonTextSharePercent(raw.buttonSharePercent),
    gapRem: clampImageTextGapRem(raw.gapRem),
    ...normalizePageBlockButton(raw),
  };
}

function normalizeReferenceBlock(raw = {}) {
  const name = typeof raw.name === 'string'
    ? raw.name
    : (typeof raw.imageAlt === 'string' ? raw.imageAlt : '');

  return {
    text: typeof raw.text === 'string' ? raw.text : '',
    name,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    imagePublicId: typeof raw.imagePublicId === 'string' ? raw.imagePublicId : '',
    imageAlt: name,
    reversed: Boolean(raw.reversed),
    align: normalizeAlignment(raw.align),
    bold: normalizeCitationBold(raw.bold),
    gapRem: clampImageTextGapRem(raw.gapRem ?? PAGE_BLOCK_REFERENCE_GAP_DEFAULT),
    borderEnabled: normalizeBorderEnabled(raw.borderEnabled),
  };
}

export function isReferenceWideLayout(text) {
  return (text?.trim().length ?? 0) >= PAGE_BLOCK_REFERENCE_WIDE_TEXT_THRESHOLD;
}

function normalizeWideImageFields(raw = {}) {
  return {
    ...normalizePageBlockImage(raw),
    maxWidthPercent: clampImageLayoutWidthPercent(raw.maxWidthPercent, {
      defaultValue: PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT,
    }),
    lightboxEnabled: normalizeLightboxEnabled(raw.lightboxEnabled),
    borderEnabled: normalizeBorderEnabled(raw.borderEnabled),
  };
}

function normalizeImageTripletBlock(raw = {}) {
  return {
    images: normalizeImageTriplet(raw.images),
    maxWidthPercent: clampImageLayoutWidthPercent(raw.maxWidthPercent, {
      defaultValue: PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
    }),
    gapRem: clampImageTripletGapRem(raw.gapRem),
    lightboxEnabled: normalizeLightboxEnabled(raw.lightboxEnabled),
    borderEnabled: normalizeBorderEnabled(raw.borderEnabled),
  };
}

export function getWideImageBlockStyle(maxWidthPercent = PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT) {
  const scale = clampImageLayoutWidthPercent(maxWidthPercent) / 100;
  return {
    maxWidth: `min(${PAGE_BLOCK_WIDE_IMAGE_MAX_REM * scale}rem, 100%)`,
  };
}

export function getImageTripletBlockStyle({
  maxWidthPercent = PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
  gapRem = PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT,
} = {}) {
  const scale = clampImageLayoutWidthPercent(maxWidthPercent, {
    defaultValue: PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
  }) / 100;

  return {
    maxWidth: `min(${PAGE_BLOCK_IMAGE_TRIPLET_MAX_REM * scale}rem, 100%)`,
    gap: `${clampImageTripletGapRem(gapRem)}rem`,
  };
}

export function getImageTextGridStyle({
  imageSharePercent = PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT,
  gapRem = PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
} = {}) {
  const share = clampImageTextSharePercent(imageSharePercent);
  return {
    '--image-text-image-share': `${share}%`,
    '--image-text-gap': `${clampImageTextGapRem(gapRem)}rem`,
  };
}

export function getButtonTextGridStyle({
  buttonSharePercent = PAGE_BLOCK_BUTTON_TEXT_SHARE_DEFAULT,
  gapRem = PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
} = {}) {
  const share = clampButtonTextSharePercent(buttonSharePercent);
  return {
    '--button-text-button-share': `${share}%`,
    '--button-text-gap': `${clampImageTextGapRem(gapRem)}rem`,
  };
}

export function getReferenceGridStyle({
  gapRem = PAGE_BLOCK_REFERENCE_GAP_DEFAULT,
} = {}) {
  return {
    '--reference-gap': `${clampImageTextGapRem(gapRem)}rem`,
  };
}

function normalizeParallaxBandFields(raw = {}) {
  return {
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    imagePublicId: typeof raw.imagePublicId === 'string' ? raw.imagePublicId : '',
    heightVh: clampHeightVh(raw.heightVh),
    ...normalizeParallaxOverlayFields(raw),
  };
}

function normalizeSocialLinkSlot(raw, fallback) {
  const preset = SOCIAL_LINK_PRESET_IDS.includes(raw?.preset) ? raw.preset : fallback.preset;
  const href = preset === 'web' && typeof raw?.href === 'string' ? raw.href : '';

  return {
    preset,
    enabled: Boolean(raw?.enabled),
    href,
    label: typeof raw?.label === 'string' ? raw.label : '',
  };
}

function normalizeSocialLinks(rawLinks) {
  const defaults = getDefaultSocialLinkSlots();
  if (!Array.isArray(rawLinks)) return defaults;

  return defaults.map((fallback, index) => normalizeSocialLinkSlot(rawLinks[index], fallback));
}

function sanitizeYoutubeId(videoId) {
  return String(videoId || '').replace(/[^a-zA-Z0-9_-]/g, '');
}

function normalizePageBlockImage(raw = {}) {
  return {
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    imagePublicId: typeof raw.imagePublicId === 'string' ? raw.imagePublicId : '',
    imageAlt: typeof raw.imageAlt === 'string' ? raw.imageAlt : '',
  };
}

function normalizePageBlockButton(raw = {}) {
  return {
    label: typeof raw.label === 'string' ? raw.label : '',
    href: typeof raw.href === 'string' ? raw.href : '',
    openInNewTab: Boolean(raw.openInNewTab),
    color: normalizePageBlockButtonColor(raw.color),
  };
}

function normalizeImageTriplet(rawImages) {
  const slots = Array.isArray(rawImages) ? rawImages : [];
  return Array.from({ length: IMAGE_TRIPLET_COUNT }, (_, index) => (
    normalizePageBlockImage(slots[index])
  ));
}

function normalizeButtonPair(rawButtons) {
  const slots = Array.isArray(rawButtons) ? rawButtons : [];
  return Array.from({ length: BUTTON_PAIR_COUNT }, (_, index) => (
    normalizePageBlockButton(slots[index])
  ));
}

function normalizeYoutubeFields(raw = {}) {
  const videoUrl = typeof raw.videoUrl === 'string' ? raw.videoUrl : '';
  let videoId = sanitizeYoutubeId(raw.videoId);
  if (!videoId && videoUrl) {
    videoId = sanitizeYoutubeId(parseYoutubeVideoId(videoUrl));
  }

  return {
    videoId,
    videoUrl,
    title: typeof raw.title === 'string' ? raw.title : '',
  };
}

function normalizeMedallionPerson(raw = {}) {
  const id = typeof raw?.id === 'string' && raw.id ? raw.id : createBlockId();

  return {
    id,
    name: typeof raw.name === 'string' ? raw.name : '',
    nick: typeof raw.nick === 'string' ? raw.nick : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    instagram: typeof raw.instagram === 'string' ? raw.instagram : '',
    facebook: typeof raw.facebook === 'string' ? raw.facebook : '',
    descriptionHtml: typeof raw.descriptionHtml === 'string' ? raw.descriptionHtml : '',
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    imagePublicId: typeof raw.imagePublicId === 'string' ? raw.imagePublicId : '',
  };
}

function normalizeMedallionPeople(rawPeople) {
  const slots = Array.isArray(rawPeople) ? rawPeople : [];
  const normalized = slots.map((person) => normalizeMedallionPerson(person));
  if (!normalized.length) {
    return [normalizeMedallionPerson({})];
  }
  return normalized;
}

function normalizeCarouselCard(raw = {}) {
  const linkType = raw.linkType === MENU_LINK_TYPES.custom
    ? MENU_LINK_TYPES.custom
    : MENU_LINK_TYPES.page;
  let description = typeof raw.description === 'string' ? raw.description : '';
  if (description.length > CARD_CAROUSEL_DESCRIPTION_MAX) {
    description = description.slice(0, CARD_CAROUSEL_DESCRIPTION_MAX);
  }

  return {
    id: typeof raw?.id === 'string' && raw.id ? raw.id : createBlockId(),
    title: typeof raw.title === 'string' ? raw.title : '',
    description,
    imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
    imagePublicId: typeof raw.imagePublicId === 'string' ? raw.imagePublicId : '',
    imageAlt: typeof raw.imageAlt === 'string' ? raw.imageAlt : '',
    linkType,
    pageId: linkType === MENU_LINK_TYPES.page ? (raw.pageId || '') : '',
    href: linkType === MENU_LINK_TYPES.custom ? (raw.href || '') : '',
    external: linkType === MENU_LINK_TYPES.custom ? true : Boolean(raw.external),
  };
}

function normalizeCarouselCards(rawCards) {
  const slots = Array.isArray(rawCards) ? rawCards : [];
  let normalized = slots
    .map((card) => normalizeCarouselCard(card))
    .slice(0, CARD_CAROUSEL_MAX_CARDS);

  while (normalized.length < CARD_CAROUSEL_MIN_CARDS) {
    normalized.push(normalizeCarouselCard({}));
  }

  return normalized;
}

export function createEmptyCarouselCard() {
  return normalizeCarouselCard({});
}

export function carouselCardHasContent(card) {
  if (!card) return false;
  return Boolean(
    card.title?.trim()
    || card.description?.trim()
    || card.imageUrl?.trim()
    || card.pageId?.trim()
    || card.href?.trim(),
  );
}

export function getBlockGapAfterStyle(gapAfterRem = PAGE_BLOCK_GAP_AFTER_DEFAULT) {
  const gap = clampGapAfterRem(gapAfterRem);
  return { marginBottom: `${gap}rem` };
}

export function stripMedallionDescriptionPreview(html) {
  const plain = stripBlockHtml(html);
  if (plain.length <= MEDALLION_DESCRIPTION_PREVIEW_LENGTH) {
    return { plain, truncated: false };
  }

  const cut = plain.slice(0, MEDALLION_DESCRIPTION_PREVIEW_LENGTH).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  const preview = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim();

  return {
    plain: preview,
    truncated: true,
  };
}

export function normalizeSocialLinkSlots(rawLinks) {
  return normalizeSocialLinks(rawLinks);
}

export function normalizePageBlock(block) {
  return normalizeBlock(block) ?? block;
}

export function mergePageBlockPatch(block, patch) {
  if (!block?.type || !patch || typeof patch !== 'object' || Array.isArray(patch)) {
    return block ?? null;
  }

  return normalizeBlock({
    ...block,
    ...patch,
    id: block.id,
    type: block.type,
  }) ?? block;
}

export function getParallaxBandStyle(heightVh = PARALLAX_BAND_HEIGHT_DEFAULT) {
  const clamped = clampHeightVh(heightVh);
  const minHeightPx = Math.round((clamped / PARALLAX_BAND_HEIGHT_DEFAULT) * 300);

  return {
    '--parallax-height': `${clamped}vh`,
    '--parallax-min-height': `${minHeightPx}px`,
  };
}

function normalizeBlock(raw) {
  if (!raw || typeof raw !== 'object' || !raw.type) return null;

  const id = typeof raw.id === 'string' && raw.id ? raw.id : createBlockId();
  const type = raw.type;
  const gapAfterRem = clampGapAfterRem(raw.gapAfterRem);
  let core = null;

  switch (type) {
    case PAGE_BLOCK_TYPES.paragraph:
      core = {
        id,
        type,
        html: typeof raw.html === 'string' ? raw.html : '',
        align: normalizeAlignment(raw.align),
      };
      break;
    case PAGE_BLOCK_TYPES.h1:
      core = {
        id,
        type,
        text: typeof raw.text === 'string' ? raw.text : '',
      };
      break;
    case PAGE_BLOCK_TYPES.h2:
      core = {
        id,
        type,
        text: typeof raw.text === 'string' ? raw.text : '',
        align: normalizeAlignment(raw.align),
      };
      break;
    case PAGE_BLOCK_TYPES.citation:
      core = {
        id,
        type,
        text: typeof raw.text === 'string' ? raw.text : '',
        bold: normalizeCitationBold(raw.bold),
      };
      break;
    case PAGE_BLOCK_TYPES.imageText:
      core = {
        id,
        type,
        ...normalizeImageTextBlock(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.buttonText:
      core = {
        id,
        type,
        ...normalizeButtonTextBlock(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.reference:
      core = {
        id,
        type,
        ...normalizeReferenceBlock(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.divider:
      core = { id, type };
      break;
    case PAGE_BLOCK_TYPES.upcomingEvents:
    case PAGE_BLOCK_TYPES.pastEvents:
    case PAGE_BLOCK_TYPES.calendar:
    case PAGE_BLOCK_TYPES.instagramFeed:
      core = { id, type };
      break;
    case PAGE_BLOCK_TYPES.randomLink:
    case PAGE_BLOCK_TYPES.randomBook:
      core = {
        id,
        type,
        align: normalizeRandomPickAlign(raw.align),
      };
      break;
    case PAGE_BLOCK_TYPES.socials:
      core = {
        id,
        type,
        ...normalizeParallaxBandFields(raw),
        links: normalizeSocialLinks(raw.links),
      };
      break;
    case PAGE_BLOCK_TYPES.socialButtons:
      core = {
        id,
        type,
        links: normalizeSocialLinks(raw.links),
      };
      break;
    case PAGE_BLOCK_TYPES.parallaxImage:
      core = {
        id,
        type,
        ...normalizeParallaxBandFields(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.wideImage:
      core = {
        id,
        type,
        ...normalizeWideImageFields(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.imageTriplet:
      core = {
        id,
        type,
        ...normalizeImageTripletBlock(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.button:
      core = {
        id,
        type,
        ...normalizePageBlockButton(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.buttonPair:
      core = {
        id,
        type,
        buttons: normalizeButtonPair(raw.buttons),
      };
      break;
    case PAGE_BLOCK_TYPES.youtube:
      core = {
        id,
        type,
        ...normalizeYoutubeFields(raw),
      };
      break;
    case PAGE_BLOCK_TYPES.citationSmall:
      core = {
        id,
        type,
        text: typeof raw.text === 'string' ? raw.text : '',
        bold: normalizeCitationBold(raw.bold),
      };
      break;
    case PAGE_BLOCK_TYPES.medallions:
      core = {
        id,
        type,
        people: normalizeMedallionPeople(raw.people),
      };
      break;
    case PAGE_BLOCK_TYPES.cardCarousel:
      core = {
        id,
        type,
        cards: normalizeCarouselCards(raw.cards),
      };
      break;
    default:
      return null;
  }

  return { ...core, gapAfterRem };
}

export function normalizePageBlocks(blocks, { maxBlocks } = {}) {
  if (!Array.isArray(blocks)) return [];

  const limit = maxBlocks ?? MAX_BLOCKS;
  const result = [];
  let pendingGap = 0;

  for (const raw of blocks) {
    if (!raw || typeof raw !== 'object' || !raw.type) continue;

    if (raw.type === LEGACY_PAGE_BLOCK_SPACE || raw.type === 'space') {
      pendingGap += legacySpaceHeightRem(raw.heightRem);
      continue;
    }

    if (raw.type === LEGACY_PAGE_BLOCK_NEGATIVE_SPACE || raw.type === 'negativeSpace') {
      pendingGap -= legacyNegativeSpacePullRem(raw.pullRem);
      continue;
    }

    const normalized = normalizeBlock(raw);
    if (!normalized) continue;

    if (result.length > 0 && pendingGap !== 0) {
      const prev = result[result.length - 1];
      result[result.length - 1] = {
        ...prev,
        gapAfterRem: clampGapAfterRem((prev.gapAfterRem || 0) + pendingGap),
      };
    }
    pendingGap = 0;

    result.push(normalized);
    if (result.length >= limit) break;
  }

  return result;
}

/** Deep-copy a block with fresh ids (block + nested people/cards). */
export function duplicatePageBlock(block) {
  if (!block || typeof block !== 'object' || !block.type) return null;

  let raw;
  try {
    raw = JSON.parse(JSON.stringify(block));
  } catch {
    return null;
  }

  raw.id = createBlockId();

  if (Array.isArray(raw.people)) {
    raw.people = raw.people.map((person) => ({
      ...person,
      id: createBlockId(),
    }));
  }

  if (Array.isArray(raw.cards)) {
    raw.cards = raw.cards.map((card) => ({
      ...card,
      id: createBlockId(),
    }));
  }

  return normalizeBlock(raw);
}

export function createBlock(type, data = {}) {
  const base = normalizeBlock({ id: createBlockId(), type, ...data });
  if (base) return base;

  switch (type) {
    case PAGE_BLOCK_TYPES.paragraph:
      return {
        id: createBlockId(),
        type,
        html: data.html || '<p></p>',
        align: normalizeAlignment(data.align),
      };
    case PAGE_BLOCK_TYPES.h1:
      return {
        id: createBlockId(),
        type,
        text: data.text || '',
      };
    case PAGE_BLOCK_TYPES.citation:
      return {
        id: createBlockId(),
        type,
        text: data.text || '',
        bold: true,
      };
    case PAGE_BLOCK_TYPES.citationSmall:
      return {
        id: createBlockId(),
        type,
        text: data.text || '',
        bold: true,
      };
    case PAGE_BLOCK_TYPES.reference:
      return {
        id: createBlockId(),
        type,
        text: data.text || '',
        name: data.name || '',
        imageUrl: data.imageUrl || '',
        imagePublicId: data.imagePublicId || '',
        imageAlt: data.imageAlt || '',
        reversed: Boolean(data.reversed),
        align: normalizeAlignment(data.align),
        bold: true,
        gapRem: PAGE_BLOCK_REFERENCE_GAP_DEFAULT,
        borderEnabled: true,
      };
    case PAGE_BLOCK_TYPES.h2:
      return {
        id: createBlockId(),
        type,
        text: data.text || '',
        align: normalizeAlignment(data.align),
      };
    case PAGE_BLOCK_TYPES.imageText:
      return {
        id: createBlockId(),
        type,
        html: data.html || '<p></p>',
        imageUrl: data.imageUrl || '',
        imagePublicId: data.imagePublicId || '',
        imageAlt: data.imageAlt || '',
        reversed: Boolean(data.reversed),
        align: normalizeAlignment(data.align),
        imageSharePercent: PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT,
        gapRem: PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
        lightboxEnabled: true,
        borderEnabled: true,
      };
    case PAGE_BLOCK_TYPES.buttonText:
      return {
        id: createBlockId(),
        type,
        html: data.html || '<p></p>',
        reversed: Boolean(data.reversed),
        align: normalizeAlignment(data.align),
        buttonSharePercent: PAGE_BLOCK_BUTTON_TEXT_SHARE_DEFAULT,
        gapRem: PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT,
        label: data.label || '',
        href: data.href || '',
        openInNewTab: Boolean(data.openInNewTab),
        color: normalizePageBlockButtonColor(data.color),
      };
    case PAGE_BLOCK_TYPES.divider:
      return { id: createBlockId(), type };
    case PAGE_BLOCK_TYPES.wideImage:
      return {
        id: createBlockId(),
        type,
        imageUrl: '',
        imagePublicId: '',
        imageAlt: '',
        maxWidthPercent: PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT,
        lightboxEnabled: true,
        borderEnabled: true,
      };
    case PAGE_BLOCK_TYPES.imageTriplet:
      return {
        id: createBlockId(),
        type,
        images: normalizeImageTriplet([]),
        maxWidthPercent: PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT,
        gapRem: PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT,
        lightboxEnabled: true,
        borderEnabled: true,
      };
    case PAGE_BLOCK_TYPES.button:
      return {
        id: createBlockId(),
        type,
        label: '',
        href: '',
        openInNewTab: false,
      };
    case PAGE_BLOCK_TYPES.buttonPair:
      return {
        id: createBlockId(),
        type,
        buttons: normalizeButtonPair([]),
      };
    case PAGE_BLOCK_TYPES.youtube:
      return {
        id: createBlockId(),
        type,
        videoId: '',
        videoUrl: '',
        title: '',
      };
    case PAGE_BLOCK_TYPES.medallions:
      return {
        id: createBlockId(),
        type,
        people: normalizeMedallionPeople([]),
      };
    case PAGE_BLOCK_TYPES.cardCarousel:
      return {
        id: createBlockId(),
        type,
        cards: normalizeCarouselCards([]),
      };
    case PAGE_BLOCK_TYPES.randomLink:
    case PAGE_BLOCK_TYPES.randomBook:
      return {
        id: createBlockId(),
        type,
        align: normalizeRandomPickAlign(data.align),
      };
    default:
      return { id: createBlockId(), type };
  }
}

export function getDefaultHomeBlocks(heroQuote = DEFAULT_SITE_TEXTS.heroQuote) {
  return [
    createBlock(PAGE_BLOCK_TYPES.citation, { text: heroQuote }),
    createBlock(PAGE_BLOCK_TYPES.upcomingEvents),
    createBlock(PAGE_BLOCK_TYPES.divider),
    createBlock(PAGE_BLOCK_TYPES.calendar),
    createBlock(PAGE_BLOCK_TYPES.socials),
    createBlock(PAGE_BLOCK_TYPES.pastEvents),
    createBlock(PAGE_BLOCK_TYPES.divider),
    createBlock(PAGE_BLOCK_TYPES.instagramFeed),
  ];
}

export function getHomeIntroFromBlocks(blocks = []) {
  const citation = blocks.find((block) => block.type === PAGE_BLOCK_TYPES.citation);
  return citation?.text?.trim() || DEFAULT_SITE_TEXTS.heroQuote;
}

export function applyHomeIntroToBlocks(blocks = [], introText = '') {
  const trimmed = introText.trim();
  if (!trimmed) return blocks;

  let applied = false;
  return blocks.map((block) => {
    if (!applied && block.type === PAGE_BLOCK_TYPES.citation) {
      applied = true;
      return { ...block, text: trimmed };
    }
    return block;
  });
}

export function hasLockedPageTitleBlock(page) {
  return page?.type === PAGE_TYPES.content && !isStandaloneContentPage(page);
}

export function isLockedPageTitleBlock(page, block, index) {
  return hasLockedPageTitleBlock(page)
    && index === 0
    && block?.type === PAGE_BLOCK_TYPES.h1;
}

export function ensureLockedPageTitleBlock(blocks, title, page) {
  if (!hasLockedPageTitleBlock(page)) return blocks;

  const trimmedTitle = (title || '').trim();
  const normalized = Array.isArray(blocks) ? blocks.filter(Boolean) : [];

  if (!normalized.length) {
    return getDefaultContentBlocks(trimmedTitle);
  }

  const [first, ...rest] = normalized;
  if (first.type === PAGE_BLOCK_TYPES.h1) {
    if (first.text === trimmedTitle) return normalized;
    return [{ ...first, text: trimmedTitle }, ...rest];
  }

  return [
    createBlock(PAGE_BLOCK_TYPES.h1, { text: trimmedTitle }),
    ...normalized,
  ];
}

export function getDefaultContentBlocks(title = '') {
  return [
    createBlock(PAGE_BLOCK_TYPES.h1, { text: title }),
  ];
}

export function getDefaultComingSoonBlocks() {
  const contactEmail = SITE.footer.contactEmail;

  return [
    createBlock(PAGE_BLOCK_TYPES.h1, { text: 'Již brzy' }),
    createBlock(PAGE_BLOCK_TYPES.citation, {
      text: 'Na webu právě pracujeme. Brzy tu najdeš všechny informace o Popcornu, jeho akcích a dalších aktivitách.',
    }),
    createBlock(PAGE_BLOCK_TYPES.paragraph, {
      html: '<p>Mezitím nás můžeš sledovat na sociálních sítích.</p>',
      align: 'center',
    }),
    createBlock(PAGE_BLOCK_TYPES.socials),
    createBlock(PAGE_BLOCK_TYPES.button, {
      label: contactEmail,
      href: `mailto:${contactEmail}`,
    }),
  ];
}

export function getDefaultNotFoundBlocks() {
  return [
    createBlock(PAGE_BLOCK_TYPES.h1, { text: 'Stránka nenalezena' }),
    createBlock(PAGE_BLOCK_TYPES.paragraph, {
      html: '<p>Tato stránka neexistuje nebo byla přesunuta.</p>',
      align: 'center',
    }),
    createBlock(PAGE_BLOCK_TYPES.button, {
      label: 'Zpět na hlavní stránku',
      href: '/',
    }),
  ];
}

export function getBlocksForPage(page, { heroQuote } = {}) {
  if (!page?.blocks?.length) {
    if (page?.type === PAGE_TYPES.home) {
      return getDefaultHomeBlocks(heroQuote);
    }
    if (page?.id === COMING_SOON_PAGE_ID) {
      return getDefaultComingSoonBlocks();
    }
    if (page?.id === NOT_FOUND_PAGE_ID) {
      return getDefaultNotFoundBlocks();
    }
    if (page?.type === PAGE_TYPES.content) {
      return getDefaultContentBlocks(page.title);
    }
    return [];
  }
  return ensureLockedPageTitleBlock(
    normalizePageBlocks(page.blocks, { maxBlocks: getPageBlockLimit(page) }),
    page.title,
    page,
  );
}

export function isBlockAllowedForPage(page, blockType) {
  if (!canPageHaveBlocks(page)) return false;
  return Object.values(PAGE_BLOCK_TYPES).includes(blockType);
}

function stripBlockHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function isBlockEmpty(block) {
  if (!block?.type) return true;

  switch (block.type) {
    case PAGE_BLOCK_TYPES.paragraph:
      return !stripBlockHtml(block.html);
    case PAGE_BLOCK_TYPES.h1:
    case PAGE_BLOCK_TYPES.h2:
    case PAGE_BLOCK_TYPES.citation:
    case PAGE_BLOCK_TYPES.citationSmall:
      return !block.text?.trim();
    case PAGE_BLOCK_TYPES.reference:
      return !block.imageUrl?.trim() && !block.text?.trim();
    case PAGE_BLOCK_TYPES.imageText:
      return !block.imageUrl && !stripBlockHtml(block.html);
    case PAGE_BLOCK_TYPES.buttonText:
      return (!block.label?.trim() || !block.href?.trim()) && !stripBlockHtml(block.html);
    case PAGE_BLOCK_TYPES.wideImage:
      return !block.imageUrl?.trim();
    case PAGE_BLOCK_TYPES.imageTriplet:
      return !(block.images || []).some((image) => image?.imageUrl?.trim());
    case PAGE_BLOCK_TYPES.button:
      return !block.label?.trim() || !block.href?.trim();
    case PAGE_BLOCK_TYPES.buttonPair:
      return !(block.buttons || []).some((button) => button?.label?.trim() && button?.href?.trim());
    case PAGE_BLOCK_TYPES.youtube:
      return !block.videoId?.trim();
    case PAGE_BLOCK_TYPES.medallions:
      return !(block.people || []).some((person) => person?.name?.trim());
    case PAGE_BLOCK_TYPES.cardCarousel:
      return !(block.cards || []).some((card) => carouselCardHasContent(card));
    default:
      return true;
  }
}

export function validatePageBlocks(blocks, page, { pageTitle } = {}) {
  const limit = getPageBlockLimit(page);

  if (!canPageHaveBlocks(page)) {
    const normalized = normalizePageBlocks(blocks, { maxBlocks: limit });
    return normalized.length === 0 ? [] : normalized;
  }

  const validated = normalizePageBlocks(blocks, { maxBlocks: limit })
    .filter((block) => isBlockAllowedForPage(page, block.type));

  if (isStandaloneContentPage(page)) {
    return validated;
  }

  return ensureLockedPageTitleBlock(validated, pageTitle ?? page?.title ?? '', page);
}
