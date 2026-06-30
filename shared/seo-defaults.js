export const SITE_LANGUAGE = 'cs';
export const SITE_LOCALE = 'cs_CZ';

export const HOME_META_KEYWORDS = [
  'komunita Popcorn',
  'Kurz Zapalovač',
  'Zapalovač',
  'kurzzapalovac',
  'absolventi Zapalovače',
  'osobní rozvoj',
  'setkání absolventů',
  'komunitní akce',
  'VyPUKne',
  'blog',
  'networking',
  'sdílení zkušeností',
  'neformální rozvoj',
  'komunita',
  'Popcorn',
];

const HOME_DESCRIPTION_BASE =
  'Komunita Popcorn je komunita absolventů kurzu Zapalovač (Kurz Zapalovač, kurzzapalovac.cz) — '
  + 'místo pro neformální rozvoj, sdílení zkušeností a vzájemnou podporu po absolvování kurzu. '
  + 'Na webu najdete nadcházející akce, přehled proběhlých setkání, blog s inspirací a příběhy z komunity, '
  + 'informace pro nováčky, kontakt na vedení a odkazy na související projekty. '
  + 'Přidejte se k setkáním, která propojují absolventy Zapalovače dlouhodobě a doplňují kurz živou komunitou.';

export function formatMetaKeywords(keywords) {
  if (!keywords) return '';
  if (Array.isArray(keywords)) {
    return keywords.map((item) => String(item).trim()).filter(Boolean).join(', ');
  }
  return String(keywords).trim();
}

export function buildHomeMetaDescription(siteTexts = {}) {
  const heroQuote = typeof siteTexts.heroQuote === 'string' ? siteTexts.heroQuote.trim() : '';
  if (!heroQuote) return HOME_DESCRIPTION_BASE;

  const lead = heroQuote.endsWith('.') ? heroQuote : `${heroQuote}.`;
  return `${lead} ${HOME_DESCRIPTION_BASE}`.slice(0, 320);
}

export function buildHomeMetaKeywords() {
  return formatMetaKeywords(HOME_META_KEYWORDS);
}

export function trimMetaDescription(text, max = 320) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trim()}…`;
}
