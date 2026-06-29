import { ADMIN_TEXTS } from './admin-texts';

const PAGE_BLOCK_COPY = ADMIN_TEXTS.pageBlocks;

export const PAGE_BLOCK_TYPES = {
  paragraph: 'paragraph',
  h1: 'h1',
  h2: 'h2',
  citation: 'citation',
  imageText: 'imageText',
  upcomingEvents: 'upcomingEvents',
  pastEvents: 'pastEvents',
  calendar: 'calendar',
  divider: 'divider',
  socials: 'socials',
  parallaxImage: 'parallaxImage',
  instagramFeed: 'instagramFeed',
  wideImage: 'wideImage',
  imageTriplet: 'imageTriplet',
  button: 'button',
  buttonPair: 'buttonPair',
  youtube: 'youtube',
  space: 'space',
  negativeSpace: 'negativeSpace',
  citationSmall: 'citationSmall',
  reference: 'reference',
  medallions: 'medallions',
};

export const PAGE_BLOCK_SPACE_HEIGHT_DEFAULT = 3;
export const PAGE_BLOCK_SPACE_HEIGHT_MIN = 0.5;
export const PAGE_BLOCK_SPACE_HEIGHT_MAX = 12;

export const PAGE_BLOCK_NEGATIVE_SPACE_PULL_DEFAULT = 1.5;
export const PAGE_BLOCK_NEGATIVE_SPACE_PULL_MIN = 0.5;
export const PAGE_BLOCK_NEGATIVE_SPACE_PULL_MAX = 4;

export const PAGE_BLOCK_WIDE_IMAGE_WIDTH_DEFAULT = 65;
export const PAGE_BLOCK_WIDE_IMAGE_WIDTH_MIN = 40;
export const PAGE_BLOCK_WIDE_IMAGE_WIDTH_MAX = 100;
export const PAGE_BLOCK_WIDE_IMAGE_MAX_REM = 72;

export const PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_DEFAULT = 100;
export const PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MIN = 40;
export const PAGE_BLOCK_IMAGE_TRIPLET_WIDTH_MAX = 100;
export const PAGE_BLOCK_IMAGE_TRIPLET_MAX_REM = 56;

export const PAGE_BLOCK_IMAGE_TRIPLET_GAP_DEFAULT = 1;
export const PAGE_BLOCK_IMAGE_TRIPLET_GAP_MIN = 0;
export const PAGE_BLOCK_IMAGE_TRIPLET_GAP_MAX = 3;

/** Share of row width for the image column in image+text blocks (desktop). */
export const PAGE_BLOCK_IMAGE_TEXT_SHARE_DEFAULT = 46;
export const PAGE_BLOCK_IMAGE_TEXT_SHARE_MIN = 10;
export const PAGE_BLOCK_IMAGE_TEXT_SHARE_MAX = 50;

export const PAGE_BLOCK_IMAGE_TEXT_GAP_DEFAULT = 2;
export const PAGE_BLOCK_IMAGE_TEXT_GAP_MIN = 0.5;
export const PAGE_BLOCK_IMAGE_TEXT_GAP_MAX = 8;

export const PAGE_BLOCK_REFERENCE_GAP_DEFAULT = 1.5;
export const PAGE_BLOCK_REFERENCE_PORTRAIT_SIZE_REM = 7.5;
export const PAGE_BLOCK_REFERENCE_STACKED_PORTRAIT_SIZE_REM = 10;
export const PAGE_BLOCK_REFERENCE_WIDE_TEXT_THRESHOLD = 100;
export const PAGE_BLOCK_REFERENCE_WIDE_PORTRAIT_SHARE = 40;

export const MEDALLION_DESCRIPTION_PREVIEW_LENGTH = 140;

export const PARALLAX_BAND_HEIGHT_DEFAULT = 45;
export const PARALLAX_BAND_HEIGHT_MIN = 25;
export const PARALLAX_BAND_HEIGHT_MAX = 70;

/** Display names for palette cards, block list, and edit modal titles. */
export const PAGE_BLOCK_LABELS = {
  [PAGE_BLOCK_TYPES.paragraph]: PAGE_BLOCK_COPY.labels.paragraph,
  [PAGE_BLOCK_TYPES.h1]: PAGE_BLOCK_COPY.labels.h1,
  [PAGE_BLOCK_TYPES.h2]: PAGE_BLOCK_COPY.labels.h2,
  [PAGE_BLOCK_TYPES.citation]: PAGE_BLOCK_COPY.labels.citation,
  [PAGE_BLOCK_TYPES.imageText]: PAGE_BLOCK_COPY.labels.imageText,
  [PAGE_BLOCK_TYPES.upcomingEvents]: PAGE_BLOCK_COPY.labels.upcomingEvents,
  [PAGE_BLOCK_TYPES.pastEvents]: PAGE_BLOCK_COPY.labels.pastEvents,
  [PAGE_BLOCK_TYPES.calendar]: PAGE_BLOCK_COPY.labels.calendar,
  [PAGE_BLOCK_TYPES.divider]: PAGE_BLOCK_COPY.labels.divider,
  [PAGE_BLOCK_TYPES.socials]: PAGE_BLOCK_COPY.labels.socials,
  [PAGE_BLOCK_TYPES.parallaxImage]: PAGE_BLOCK_COPY.labels.parallaxImage,
  [PAGE_BLOCK_TYPES.instagramFeed]: PAGE_BLOCK_COPY.labels.instagramFeed,
  [PAGE_BLOCK_TYPES.wideImage]: PAGE_BLOCK_COPY.labels.wideImage,
  [PAGE_BLOCK_TYPES.imageTriplet]: PAGE_BLOCK_COPY.labels.imageTriplet,
  [PAGE_BLOCK_TYPES.button]: PAGE_BLOCK_COPY.labels.button,
  [PAGE_BLOCK_TYPES.buttonPair]: PAGE_BLOCK_COPY.labels.buttonPair,
  [PAGE_BLOCK_TYPES.youtube]: PAGE_BLOCK_COPY.labels.youtube,
  [PAGE_BLOCK_TYPES.space]: PAGE_BLOCK_COPY.labels.space,
  [PAGE_BLOCK_TYPES.negativeSpace]: PAGE_BLOCK_COPY.labels.negativeSpace,
  [PAGE_BLOCK_TYPES.citationSmall]: PAGE_BLOCK_COPY.labels.citationSmall,
  [PAGE_BLOCK_TYPES.reference]: PAGE_BLOCK_COPY.labels.reference,
  [PAGE_BLOCK_TYPES.medallions]: PAGE_BLOCK_COPY.labels.medallions,
};

/** Short descriptions shown on palette cards. */
export const PAGE_BLOCK_DESCRIPTIONS = {
  [PAGE_BLOCK_TYPES.paragraph]: PAGE_BLOCK_COPY.descriptions.paragraph,
  [PAGE_BLOCK_TYPES.h1]: PAGE_BLOCK_COPY.descriptions.h1,
  [PAGE_BLOCK_TYPES.h2]: PAGE_BLOCK_COPY.descriptions.h2,
  [PAGE_BLOCK_TYPES.citation]: PAGE_BLOCK_COPY.descriptions.citation,
  [PAGE_BLOCK_TYPES.imageText]: PAGE_BLOCK_COPY.descriptions.imageText,
  [PAGE_BLOCK_TYPES.upcomingEvents]: PAGE_BLOCK_COPY.descriptions.upcomingEvents,
  [PAGE_BLOCK_TYPES.pastEvents]: PAGE_BLOCK_COPY.descriptions.pastEvents,
  [PAGE_BLOCK_TYPES.calendar]: PAGE_BLOCK_COPY.descriptions.calendar,
  [PAGE_BLOCK_TYPES.divider]: PAGE_BLOCK_COPY.descriptions.divider,
  [PAGE_BLOCK_TYPES.socials]: PAGE_BLOCK_COPY.descriptions.socials,
  [PAGE_BLOCK_TYPES.parallaxImage]: PAGE_BLOCK_COPY.descriptions.parallaxImage,
  [PAGE_BLOCK_TYPES.instagramFeed]: PAGE_BLOCK_COPY.descriptions.instagramFeed,
  [PAGE_BLOCK_TYPES.wideImage]: PAGE_BLOCK_COPY.descriptions.wideImage,
  [PAGE_BLOCK_TYPES.imageTriplet]: PAGE_BLOCK_COPY.descriptions.imageTriplet,
  [PAGE_BLOCK_TYPES.button]: PAGE_BLOCK_COPY.descriptions.button,
  [PAGE_BLOCK_TYPES.buttonPair]: PAGE_BLOCK_COPY.descriptions.buttonPair,
  [PAGE_BLOCK_TYPES.youtube]: PAGE_BLOCK_COPY.descriptions.youtube,
  [PAGE_BLOCK_TYPES.space]: PAGE_BLOCK_COPY.descriptions.space,
  [PAGE_BLOCK_TYPES.negativeSpace]: PAGE_BLOCK_COPY.descriptions.negativeSpace,
  [PAGE_BLOCK_TYPES.citationSmall]: PAGE_BLOCK_COPY.descriptions.citationSmall,
  [PAGE_BLOCK_TYPES.reference]: PAGE_BLOCK_COPY.descriptions.reference,
  [PAGE_BLOCK_TYPES.medallions]: PAGE_BLOCK_COPY.descriptions.medallions,
};

export const PAGE_BLOCK_ALIGNMENTS = ['left', 'center', 'right'];

export const PAGE_BLOCK_PALETTE = [
  PAGE_BLOCK_TYPES.paragraph,
  PAGE_BLOCK_TYPES.h1,
  PAGE_BLOCK_TYPES.h2,
  PAGE_BLOCK_TYPES.imageText,
  PAGE_BLOCK_TYPES.citation,
  PAGE_BLOCK_TYPES.citationSmall,
  PAGE_BLOCK_TYPES.reference,
  PAGE_BLOCK_TYPES.space,
  PAGE_BLOCK_TYPES.negativeSpace,
  PAGE_BLOCK_TYPES.divider,
  PAGE_BLOCK_TYPES.button,
  PAGE_BLOCK_TYPES.buttonPair,
  PAGE_BLOCK_TYPES.wideImage,
  PAGE_BLOCK_TYPES.imageTriplet,
  PAGE_BLOCK_TYPES.youtube,
  PAGE_BLOCK_TYPES.parallaxImage,
  PAGE_BLOCK_TYPES.upcomingEvents,
  PAGE_BLOCK_TYPES.pastEvents,
  PAGE_BLOCK_TYPES.calendar,
  PAGE_BLOCK_TYPES.socials,
  PAGE_BLOCK_TYPES.instagramFeed,
  PAGE_BLOCK_TYPES.medallions,
];

export const PAGE_BLOCK_EDITABLE_TYPES = new Set([
  PAGE_BLOCK_TYPES.paragraph,
  PAGE_BLOCK_TYPES.h1,
  PAGE_BLOCK_TYPES.h2,
  PAGE_BLOCK_TYPES.citation,
  PAGE_BLOCK_TYPES.imageText,
  PAGE_BLOCK_TYPES.socials,
  PAGE_BLOCK_TYPES.parallaxImage,
  PAGE_BLOCK_TYPES.wideImage,
  PAGE_BLOCK_TYPES.imageTriplet,
  PAGE_BLOCK_TYPES.button,
  PAGE_BLOCK_TYPES.buttonPair,
  PAGE_BLOCK_TYPES.youtube,
  PAGE_BLOCK_TYPES.space,
  PAGE_BLOCK_TYPES.negativeSpace,
  PAGE_BLOCK_TYPES.citationSmall,
  PAGE_BLOCK_TYPES.reference,
  PAGE_BLOCK_TYPES.medallions,
]);

export function isBlockEditable(blockOrType) {
  const type = typeof blockOrType === 'string' ? blockOrType : blockOrType?.type;
  return PAGE_BLOCK_EDITABLE_TYPES.has(type);
}

/** Palette sections and which block types appear in each (order = display order). */
export const PAGE_BLOCK_PALETTE_GROUPS = [
  {
    id: 'text',
    label: PAGE_BLOCK_COPY.paletteGroups.text,
    items: [
      PAGE_BLOCK_TYPES.paragraph,
      PAGE_BLOCK_TYPES.h1,
      PAGE_BLOCK_TYPES.h2,
      PAGE_BLOCK_TYPES.imageText,
      PAGE_BLOCK_TYPES.citation,
      PAGE_BLOCK_TYPES.citationSmall,
      PAGE_BLOCK_TYPES.reference,
    ],
  },
  {
    id: 'elements',
    label: PAGE_BLOCK_COPY.paletteGroups.elements,
    items: [
      PAGE_BLOCK_TYPES.space,
      PAGE_BLOCK_TYPES.negativeSpace,
      PAGE_BLOCK_TYPES.divider,
      PAGE_BLOCK_TYPES.button,
      PAGE_BLOCK_TYPES.buttonPair,
    ],
  },
  {
    id: 'media',
    label: PAGE_BLOCK_COPY.paletteGroups.media,
    items: [
      PAGE_BLOCK_TYPES.wideImage,
      PAGE_BLOCK_TYPES.imageTriplet,
      PAGE_BLOCK_TYPES.youtube,
      PAGE_BLOCK_TYPES.parallaxImage,
    ],
  },
  {
    id: 'events',
    label: PAGE_BLOCK_COPY.paletteGroups.events,
    items: [
      PAGE_BLOCK_TYPES.upcomingEvents,
      PAGE_BLOCK_TYPES.pastEvents,
      PAGE_BLOCK_TYPES.calendar,
    ],
  },
  {
    id: 'interaction',
    label: PAGE_BLOCK_COPY.paletteGroups.interaction,
    items: [
      PAGE_BLOCK_TYPES.socials,
      PAGE_BLOCK_TYPES.instagramFeed,
      PAGE_BLOCK_TYPES.medallions,
    ],
  },
];
