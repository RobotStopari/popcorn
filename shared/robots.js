const DISALLOWED_PATHS = [
  '/admin',
  '/admin/',
  '/share',
  '/share/',
  '/event',
  '/event/',
  '/event.html',
  '/api/',
];

const ALLOWED_HIGHLIGHTS = [
  '/',
  '/akce/',
  '/blog/',
  '/blog',
  '/vypukne',
  '/probehle',
  '/co-je-popcorn',
  '/vedeni-kontakt',
  '/pro-novacky',
  '/usporadej',
  '/odkazy',
];

const SEARCH_BOTS = [
  'Googlebot',
  'Googlebot-Image',
  'Google-InspectionTool',
  'GoogleOther',
  'Bingbot',
  'DuckDuckBot',
  'Slurp',
  'Applebot',
  'SeznamBot',
  'facebot',
  'facebookexternalhit',
  'Twitterbot',
  'LinkedInBot',
];

const AI_TRAINING_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'CCBot',
  'anthropic-ai',
  'ClaudeBot',
  'Google-Extended',
  'Bytespider',
  'cohere-ai',
  'PerplexityBot',
];

function normalizeSiteUrl(siteUrl) {
  const trimmed = String(siteUrl || 'https://komunitapopcorn.cz').replace(/\/$/, '');
  return trimmed || 'https://komunitapopcorn.cz';
}

function linesForBot(userAgent, { allowAll = false, disallow = DISALLOWED_PATHS, allow = [] } = {}) {
  const block = [`User-agent: ${userAgent}`];

  if (allowAll) {
    block.push('Allow: /');
    return block;
  }

  for (const path of allow) {
    block.push(`Allow: ${path}`);
  }

  for (const path of disallow) {
    block.push(`Disallow: ${path}`);
  }

  return block;
}

export function buildRobotsTxt(siteUrl) {
  const origin = normalizeSiteUrl(siteUrl);
  const lines = [
    '# robots.txt — Komunita Popcorn',
    `# ${origin}`,
    '# Komunitní web absolventů kurzu Zapalovač — veřejný obsah je vítán pro indexaci.',
    '#',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
    '# ── Výchozí pravidla ───────────────────────────────────────────',
    ...linesForBot('*', { allow: ALLOWED_HIGHLIGHTS, disallow: DISALLOWED_PATHS }),
    '',
    '# ── Vyhledávače a náhledy odkazů ───────────────────────────────',
  ];

  for (const bot of SEARCH_BOTS) {
    lines.push(...linesForBot(bot, { allowAll: true }), '');
  }

  lines.push(
    '# ── AI trénovací roboty (neovlivňuje Google vyhledávání) ─────────',
  );

  for (const bot of AI_TRAINING_BOTS) {
    lines.push(...linesForBot(bot, { disallow: ['/'] }), '');
  }

  lines.push(
    '# ── Yandex ─────────────────────────────────────────────────────',
    `Host: ${new URL(origin).host}`,
    '',
    `# Aktualizováno pro ${origin}`,
  );

  return `${lines.join('\n').trim()}\n`;
}
