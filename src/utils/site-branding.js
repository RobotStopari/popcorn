import { SOCIAL_LINK_PRESETS } from '../data/social-link-presets';
import { buildCloudinaryDisplayUrl } from '../services/cloudinary';
import {
  DEFAULT_SITE_SETTINGS,
  getBrandLinkHref,
  normalizeFooterSocialSlots,
} from '../data/site-settings';

export function resolveBlockSocialLinks(links = [], settings = DEFAULT_SITE_SETTINGS) {
  const brandLinks = settings.brandLinks || DEFAULT_SITE_SETTINGS.brandLinks;

  return (Array.isArray(links) ? links : [])
    .map((link) => ({
      ...link,
      href: link.preset === 'web'
        ? (link.href?.trim() || '')
        : getBrandLinkHref(link.preset, brandLinks),
    }))
    .filter((link) => link.enabled && link.href?.trim())
    .slice(0, 4);
}

export function resolveSiteLogo(settings = DEFAULT_SITE_SETTINGS, { width = 104, height = 104 } = {}) {
  if (settings?.logoPublicId?.trim()) {
    const built = buildCloudinaryDisplayUrl(settings.logoPublicId.trim(), { width, height });
    if (built) return built;
  }

  const url = settings?.logoUrl?.trim();
  if (url) return url;

  return DEFAULT_SITE_SETTINGS.logoUrl;
}

export function resolveSiteBranding(settings = DEFAULT_SITE_SETTINGS) {
  return {
    logo: resolveSiteLogo(settings),
    logoAlt: settings.logoAlt || DEFAULT_SITE_SETTINGS.logoAlt,
    brand: {
      line1: settings.brandLine1 || DEFAULT_SITE_SETTINGS.brandLine1,
      line2: settings.brandLine2 || DEFAULT_SITE_SETTINGS.brandLine2,
    },
    footer: {
      year: settings.footerYear || DEFAULT_SITE_SETTINGS.footerYear,
      contactLabel: settings.footerContactLabel || DEFAULT_SITE_SETTINGS.footerContactLabel,
      contactEmail: settings.footerContactEmail || DEFAULT_SITE_SETTINGS.footerContactEmail,
    },
  };
}

export function resolveFooterSocialLinks(settings = DEFAULT_SITE_SETTINGS) {
  const brandLinks = settings.brandLinks || DEFAULT_SITE_SETTINGS.brandLinks;
  const slots = normalizeFooterSocialSlots(settings.footerSocialSlots);

  return slots
    .filter((slot) => slot.enabled)
    .map((slot) => {
      const preset = SOCIAL_LINK_PRESETS[slot.preset];
      if (!preset) return null;

      return {
        id: slot.preset,
        label: preset.label,
        href: getBrandLinkHref(slot.preset, brandLinks),
        icon: preset.icon,
      };
    })
    .filter((item) => item?.href?.trim());
}
