import { useSiteColors } from '../contexts/SiteColorsContext';

/** Applies Firestore palette to CSS variables via SiteColorsProvider. */
export function useColorTokens() {
  useSiteColors();
}
