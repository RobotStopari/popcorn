import { ICONS } from './icons.js';

/** Preset ids for social / link buttons in the parallax band block editor. */
export const SOCIAL_LINK_PRESET_IDS = [
  'instagram',
  'facebook',
  'mail',
  'youtube',
  'tiktok',
  'linkedin',
  'web',
];

/** Presets available in site settings and footer (no per-page-only web link). */
export const SITE_BRAND_LINK_PRESET_IDS = SOCIAL_LINK_PRESET_IDS.filter((id) => id !== 'web');

export const FOOTER_SOCIAL_PRESET_IDS = SITE_BRAND_LINK_PRESET_IDS;

export const SOCIAL_LINK_PRESETS = {
  instagram: {
    id: 'instagram',
    label: 'Instagram',
    icon: ICONS.instagram,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    icon: ICONS.facebook,
  },
  mail: {
    id: 'mail',
    label: 'E-mail',
    icon: ICONS.email,
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    icon: ICONS.youtube,
  },
  tiktok: {
    id: 'tiktok',
    label: 'TikTok',
    icon: ICONS.tiktok,
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: ICONS.linkedin,
  },
  web: {
    id: 'web',
    label: 'Web',
    icon: ICONS.web,
  },
};

export const SOCIAL_LINK_SLOT_COUNT = 4;

export function getDefaultSocialLinkSlots() {
  return [
    { preset: 'instagram', enabled: false, href: '', label: '' },
    { preset: 'facebook', enabled: false, href: '', label: '' },
    { preset: 'mail', enabled: false, href: '', label: '' },
    { preset: 'web', enabled: false, href: '', label: '' },
  ];
}
