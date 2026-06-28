/** Blog post cover — wide banner crop matching card (~2.8:1) and detail (720×208px ≈ 3.5:1) at 2×. */

export const BLOG_COVER_ASPECT_RATIO = '3.5 : 1';
export const BLOG_COVER_WIDTH = 1440;
export const BLOG_COVER_HEIGHT = 416;

export const BLOG_COVER_UPLOAD_HINT = `Ideální vstup: široký formát, min. ${BLOG_COVER_WIDTH} × ${BLOG_COVER_HEIGHT} px (${BLOG_COVER_ASPECT_RATIO}). Při nahrání se ořízne na střed a uloží jako WebP ${BLOG_COVER_WIDTH}×${BLOG_COVER_HEIGHT}. Zobrazí se na kartě příspěvku a na stránce článku.`;

export const BLOG_COVER_PRESET_TRANSFORM = `c_fill,g_center,w_${BLOG_COVER_WIDTH},h_${BLOG_COVER_HEIGHT},f_webp,q_auto`;

export const BLOG_GALLERY_MAX = 10;
export const BLOG_GALLERY_MAX_WIDTH = 1600;
export const BLOG_GALLERY_UPLOAD_HINT = `Max. ${BLOG_GALLERY_MAX} fotek — vyberte jich v dialogu najednou (tolik, kolik zbývá volných míst). Zachová se poměr stran, delší strana max. ${BLOG_GALLERY_MAX_WIDTH} px, WebP. Zobrazí se na konci příspěvku nad komentáři.`;

export const BLOG_GALLERY_PRESET_TRANSFORM = `c_limit,w_${BLOG_GALLERY_MAX_WIDTH},f_webp,q_auto`;
