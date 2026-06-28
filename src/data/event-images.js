/** Event image upload presets & delivery specs (transforms live on Cloudinary presets). */

export const EVENT_COVER_ASPECT_RATIO = '3 : 2';
export const EVENT_COVER_WIDTH = 840;
export const EVENT_COVER_HEIGHT = 560;

export const EVENT_COVER_UPLOAD_HINT = `Ideální vstup: ${EVENT_COVER_WIDTH} × ${EVENT_COVER_HEIGHT} px (${EVENT_COVER_ASPECT_RATIO}). Při nahrání se ořízne na střed a uloží jako WebP ${EVENT_COVER_WIDTH}×${EVENT_COVER_HEIGHT}.`;

export const EVENT_COVER_PRESET_TRANSFORM = `c_fill,g_center,w_${EVENT_COVER_WIDTH},h_${EVENT_COVER_HEIGHT},f_webp,q_auto`;

export const EVENT_PROMO_MAX = 10;
export const EVENT_PROMO_MAX_WIDTH = 1200;
export const EVENT_PROMO_UPLOAD_HINT = `Max. ${EVENT_PROMO_MAX} obrázků — vyberte jich v dialogu najednou (tolik, kolik zbývá volných míst). Zachová se poměr stran, delší strana max. ${EVENT_PROMO_MAX_WIDTH} px, WebP. Zobrazí se u nadcházejících akcí v galerii na stránce akce.`;

export const EVENT_PROMO_PRESET_TRANSFORM = `c_limit,w_${EVENT_PROMO_MAX_WIDTH},f_webp,q_auto`;

export const EVENT_GALLERY_PICKS_MAX = 10;
export const EVENT_GALLERY_PICKS_MAX_WIDTH = 1600;
export const EVENT_GALLERY_PICKS_UPLOAD_HINT = `Max. ${EVENT_GALLERY_PICKS_MAX} fotek — vyberte jich v dialogu najednou (tolik, kolik zbývá volných míst). Výběr z galerie akce. Zachová se poměr stran, delší strana max. ${EVENT_GALLERY_PICKS_MAX_WIDTH} px, WebP. Zobrazí se u proběhlých akcí.`;

export const EVENT_GALLERY_PICKS_PRESET_TRANSFORM = `c_limit,w_${EVENT_GALLERY_PICKS_MAX_WIDTH},f_webp,q_auto`;

export function normalizeEventImage(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const url = raw.url?.trim() || '';
  if (!url) return null;

  return {
    url,
    publicId: raw.publicId?.trim() || '',
    alt: raw.alt?.trim() || '',
  };
}

export function normalizeEventImageList(raw, max = 10) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeEventImage)
    .filter(Boolean)
    .slice(0, max);
}

export function getUpcomingGalleryImages(event) {
  return (event.promoImages || []).map((item, index) => ({
    src: item.url,
    alt: item.alt || `Propagační materiál ${index + 1}`,
  }));
}

export function getPastGalleryImages(event) {
  return (event.galleryPicks || []).map((item, index) => ({
    src: item.url,
    alt: item.alt || `Fotografie z akce ${index + 1}`,
  }));
}
