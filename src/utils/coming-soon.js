import { shouldShowComingSoon } from '../../shared/coming-soon.js';

export {
  COMING_SOON_PAGE_ID,
  isLocalhostHost,
  isProductionSiteHost,
  PRODUCTION_SITE_HOSTS,
  shouldShowComingSoon,
} from '../../shared/coming-soon.js';

export function shouldShowComingSoonForCurrentSite(settings) {
  if (typeof window === 'undefined') return false;
  return shouldShowComingSoon(settings, window.location.hostname);
}
