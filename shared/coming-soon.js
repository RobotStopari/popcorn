export const PRODUCTION_SITE_HOSTS = ['komunitapopcorn.cz', 'www.komunitapopcorn.cz'];

export const COMING_SOON_PAGE_ID = 'coming-soon';

export function normalizeHostname(hostname) {
  return typeof hostname === 'string' ? hostname.trim().toLowerCase() : '';
}

export function isLocalhostHost(hostname) {
  const host = normalizeHostname(hostname);
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

export function isProductionSiteHost(hostname) {
  return PRODUCTION_SITE_HOSTS.includes(normalizeHostname(hostname));
}

/**
 * Whether the public site should show the coming-soon page instead of the full site.
 * - Off when comingSoonEnabled is false
 * - On production domain when enabled
 * - On localhost: bypassed by default (comingSoonBypassLocalhost !== false)
 */
export function shouldShowComingSoon(settings = {}, hostname = '') {
  if (!settings?.comingSoonEnabled) return false;

  if (isLocalhostHost(hostname)) {
    return settings.comingSoonBypassLocalhost === false;
  }

  return isProductionSiteHost(hostname);
}
