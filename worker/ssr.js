import { deriveEventSlug } from '../shared/event-url.js';
import {
  buildHomeMetaDescription,
  buildHomeMetaKeywords,
  formatMetaKeywords,
  SITE_LANGUAGE,
  SITE_LOCALE,
  trimMetaDescription,
} from '../shared/seo-defaults.js';
import { buildSsrShellHtml } from './ssr-links.js';
import {
  fetchFirestoreCollection,
  fetchFirestoreDocument,
  queryFirestoreByField,
} from './firestore.js';

const SITE_NAME = 'Komunita Popcorn';

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function isEventPublished(event) {
  return event?.published !== false;
}

function isEventListed(event) {
  return isEventPublished(event) && event?.calendarOnly !== true;
}

function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function normalizeEventSlug(event) {
  const slug = deriveEventSlug(event);
  return { ...event, slug };
}

function withEventSlugs(events) {
  const used = new Set();
  return events.map((event) => {
    let slug = deriveEventSlug(event);
    if (!slug) slug = event.id;
    if (used.has(slug)) {
      slug = `${slug}-${event.id.slice(0, 6)}`;
    }
    used.add(slug);
    return { ...event, slug };
  });
}

function resolveSiteUrl(env, request) {
  const configured = env.SITE_URL || env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

export function matchPublicRoute(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/') return { type: 'home' };
  if (path === '/vypukne') return { type: 'events-upcoming' };
  if (path === '/probehle') return { type: 'events-past' };
  if (path === '/blog') return { type: 'blog-list' };

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) return { type: 'blog-post', slug: decodeURIComponent(blogMatch[1]) };

  const akceMatch = path.match(/^\/akce\/([^/]+)$/);
  if (akceMatch) return { type: 'event', slug: decodeURIComponent(akceMatch[1]) };

  const legacyEventMatch = path.match(/^\/event\/([^/]+)$/);
  if (legacyEventMatch) return { type: 'event-legacy-id', id: decodeURIComponent(legacyEventMatch[1]) };

  const slug = path.slice(1);
  if (slug && !slug.includes('/')) return { type: 'page', slug };

  return { type: 'unknown' };
}

async function fetchGlobalSiteData(env) {
  const [siteSettings, siteMenu, siteColors, siteTexts, notifications] = await Promise.all([
    fetchFirestoreDocument('siteSettings', 'config', env),
    fetchFirestoreDocument('siteMenu', 'config', env),
    fetchFirestoreDocument('siteColors', 'config', env),
    fetchFirestoreDocument('siteTexts', 'config', env),
    fetchFirestoreCollection('notifications', env),
  ]);

  return {
    siteSettings: siteSettings || {},
    siteMenu: siteMenu || {},
    siteColors: siteColors || {},
    siteTexts: siteTexts || {},
    notifications: notifications || [],
  };
}

async function findEventBySlugOrId(events, slugOrId) {
  const bySlug = events.find((item) => deriveEventSlug(item) === slugOrId || item.slug === slugOrId);
  if (bySlug) return bySlug;
  return events.find((item) => item.id === slugOrId) || null;
}

export async function fetchSsrPayload(pathname, env, request) {
  const route = matchPublicRoute(pathname);
  const siteUrl = resolveSiteUrl(env, request);

  if (route.type === 'unknown') {
    return { route, siteUrl, redirect: null, data: null, meta: null };
  }

  const global = await fetchGlobalSiteData(env);

  if (route.type === 'event-legacy-id') {
    const events = withEventSlugs(await fetchFirestoreCollection('events', env));
    const event = events.find((item) => item.id === route.id);
    if (event && isEventListed(event)) {
      const slug = deriveEventSlug(event);
      return {
        route,
        siteUrl,
        redirect: `${siteUrl}/akce/${encodeURIComponent(slug)}`,
        data: null,
        meta: null,
      };
    }
  }

  const [pages, eventsRaw, blogPosts] = await Promise.all([
    fetchFirestoreCollection('pages', env),
    fetchFirestoreCollection('events', env),
    fetchFirestoreCollection('blogPosts', env),
  ]);

  const events = withEventSlugs(eventsRaw).filter(isEventListed);
  const publishedPosts = blogPosts.filter((post) => post.title && post.slug);

  let page = null;
  let event = null;
  let blogPost = null;

  if (route.type === 'home') {
    page = pages.find((item) => item.type === 'home' || item.slug === '') || null;
  } else if (route.type === 'events-upcoming') {
    page = pages.find((item) => item.type === 'events-upcoming' || item.slug === 'vypukne') || null;
  } else if (route.type === 'events-past') {
    page = pages.find((item) => item.type === 'events-past' || item.slug === 'probehle') || null;
  } else if (route.type === 'blog-list') {
    page = pages.find((item) => item.type === 'blog-list' || item.slug === 'blog') || null;
  } else if (route.type === 'page') {
    page = pages.find((item) => item.slug === route.slug) || null;
  } else if (route.type === 'event') {
    event = await findEventBySlugOrId(events, route.slug);
    if (!event) {
      const queried = await queryFirestoreByField('events', 'slug', route.slug, env);
      if (queried[0]) event = normalizeEventSlug(queried[0]);
    }
  } else if (route.type === 'blog-post') {
    blogPost = publishedPosts.find((post) => post.slug === route.slug) || null;
    if (!blogPost) {
      const queried = await queryFirestoreByField('blogPosts', 'slug', route.slug, env);
      if (queried[0]) blogPost = queried[0];
    }
  }

  const data = {
    ...global,
    pages,
    events,
    blogPosts: publishedPosts,
    page,
    event,
    blogPost,
  };

  const meta = buildMeta({ route, siteUrl, data, pathname });

  return { route, siteUrl, redirect: null, data, meta };
}

function buildMeta({ route, siteUrl, data, pathname }) {
  const canonical = `${siteUrl}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
  const defaultDescription = trimMetaDescription(
    'Komunita Popcorn — setkávání absolventů kurzu Zapalovač, komunitní akce VyPUKne, blog a inspirace pro neformální rozvoj a sdílení zkušeností.',
  );

  if (route.type === 'home') {
    const description = buildHomeMetaDescription(data.siteTexts);
    return {
      title: SITE_NAME,
      description,
      keywords: buildHomeMetaKeywords(),
      canonical,
      ogType: 'website',
      ogImage: data.siteSettings?.logoUrl || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        description,
        url: siteUrl,
      },
    };
  }

  if (route.type === 'event' && data.event) {
    const event = data.event;
    const description = trimMetaDescription(stripHtml(event.description || event.report), 160);
    return {
      title: `${event.title || 'Akce'} — ${SITE_NAME}`,
      description: description || defaultDescription,
      keywords: formatMetaKeywords([event.title, event.category, 'akce', 'Popcorn', event.place].filter(Boolean)),
      canonical,
      ogType: 'website',
      ogImage: event.coverImage || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        startDate: event.dateStart ? `${event.dateStart}T${event.timeStart || '00:00'}:00` : undefined,
        endDate: event.dateEnd ? `${event.dateEnd}T${event.timeEnd || '23:59'}:00` : undefined,
        location: event.place ? { '@type': 'Place', name: event.place } : undefined,
        image: event.coverImage || undefined,
        description: description || undefined,
        url: canonical,
      },
    };
  }

  if (route.type === 'blog-post' && data.blogPost) {
    const post = data.blogPost;
    const description = trimMetaDescription(stripHtml(post.body), 160);
    return {
      title: `${post.title} — ${SITE_NAME}`,
      description: description || defaultDescription,
      keywords: formatMetaKeywords(post.keywords),
      canonical,
      ogType: 'article',
      ogImage: post.coverImage || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        datePublished: post.publishedDate
          ? `${post.publishedDate}T${post.publishedTime || '00:00'}:00`
          : undefined,
        image: post.coverImage || undefined,
        description: description || undefined,
        url: canonical,
      },
    };
  }

  const page = data.page;
  if (page?.title) {
    const intro = trimMetaDescription(stripHtml(page.intro || ''), 160);
    const isHomePage = page.slug === '' || page.type === 'home';
    return {
      title: isHomePage ? SITE_NAME : `${page.title} — ${SITE_NAME}`,
      description: isHomePage ? buildHomeMetaDescription(data.siteTexts) : (intro || defaultDescription),
      keywords: isHomePage ? buildHomeMetaKeywords() : formatMetaKeywords([page.title, 'Popcorn', page.slug]),
      canonical,
      ogType: 'website',
      ogImage: data.siteSettings?.logoUrl || '',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: intro || defaultDescription,
        url: canonical,
      },
    };
  }

  if (route.type === 'events-upcoming') {
    return {
      title: `VyPUKne — ${SITE_NAME}`,
      description: defaultDescription,
      canonical,
      ogType: 'website',
      ogImage: data.siteSettings?.logoUrl || '',
      jsonLd: null,
    };
  }

  if (route.type === 'events-past') {
    return {
      title: `Proběhlé akce — ${SITE_NAME}`,
      description: defaultDescription,
      canonical,
      ogType: 'website',
      ogImage: data.siteSettings?.logoUrl || '',
      jsonLd: null,
    };
  }

  if (route.type === 'blog-list') {
    return {
      title: `Blog — ${SITE_NAME}`,
      description: defaultDescription,
      canonical,
      ogType: 'website',
      ogImage: data.siteSettings?.logoUrl || '',
      jsonLd: null,
    };
  }

  return {
    title: SITE_NAME,
    description: defaultDescription,
    canonical,
    ogType: 'website',
    ogImage: data.siteSettings?.logoUrl || '',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

export async function buildSitemapXml(env, request) {
  const siteUrl = resolveSiteUrl(env, request);
  const [pages, eventsRaw, blogPosts] = await Promise.all([
    fetchFirestoreCollection('pages', env),
    fetchFirestoreCollection('events', env),
    fetchFirestoreCollection('blogPosts', env),
  ]);

  const events = withEventSlugs(eventsRaw).filter(isEventListed);
  const posts = blogPosts.filter((post) => post.slug && post.title);

  const urls = new Set([`${siteUrl}/`]);

  for (const page of pages) {
    if (page.slug === '') {
      urls.add(`${siteUrl}/`);
    } else if (page.slug) {
      urls.add(`${siteUrl}/${page.slug}`);
    }
  }

  urls.add(`${siteUrl}/vypukne`);
  urls.add(`${siteUrl}/probehle`);
  urls.add(`${siteUrl}/blog`);

  for (const event of events) {
    const slug = deriveEventSlug(event);
    if (slug) urls.add(`${siteUrl}/akce/${encodeURIComponent(slug)}`);
  }

  for (const post of posts) {
    urls.add(`${siteUrl}/blog/${encodeURIComponent(post.slug)}`);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls].map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n')}
</urlset>`;

  return body;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildRobotsTxt(siteUrl) {
  return `User-agent: *
Allow: /

Disallow: /admin
Disallow: /admin/
Disallow: /share/
Disallow: /event/

Sitemap: ${siteUrl}/sitemap.xml
`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHeadTags(meta) {
  if (!meta) return '';

  const tags = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta http-equiv="content-language" content="${SITE_LANGUAGE}">`,
    `<meta name="language" content="${SITE_LANGUAGE}">`,
    `<meta property="og:locale" content="${SITE_LOCALE}">`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:type" content="${escapeHtml(meta.ogType || 'website')}">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE_NAME)}">`,
    `<meta name="twitter:card" content="${meta.ogImage ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
  ];

  if (meta.ogImage) {
    tags.push(`<meta property="og:image" content="${escapeHtml(meta.ogImage)}">`);
    tags.push(`<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}">`);
  }

  if (meta.keywords) {
    tags.push(`<meta name="keywords" content="${escapeHtml(meta.keywords)}">`);
  }

  if (meta.jsonLd) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`);
  }

  return tags.join('\n  ');
}

export function buildSsrFallbackHtml(route, data) {
  if (!data) return '';

  let mainContent = '';

  if (route.type === 'event' && data.event) {
    const event = data.event;
    const description = stripHtml(event.description || event.report).slice(0, 500);
    mainContent = `    <article>
      <h1>${escapeHtml(event.title || 'Akce')}</h1>
      ${event.dateStart ? `<p><time datetime="${escapeHtml(event.dateStart)}">${escapeHtml(event.dateStart)}</time></p>` : ''}
      ${event.place ? `<p>${escapeHtml(event.place)}</p>` : ''}
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      <p><a href="/vypukne">Všechny nadcházející akce</a> · <a href="/probehle">Proběhlé akce</a></p>
    </article>`;
  } else if (route.type === 'blog-post' && data.blogPost) {
    const post = data.blogPost;
    const excerpt = stripHtml(post.body).slice(0, 500);
    mainContent = `    <article>
      <h1>${escapeHtml(post.title || 'Blog')}</h1>
      ${excerpt ? `<p>${escapeHtml(excerpt)}</p>` : ''}
      <p><a href="/blog">Všechny blogové příspěvky</a></p>
    </article>`;
  } else if (data.page?.title) {
    const intro = stripHtml(data.page.intro || '').slice(0, 500);
    const isHomePage = route.type === 'home' || data.page.slug === '' || data.page.type === 'home';
    const description = isHomePage
      ? buildHomeMetaDescription(data.siteTexts)
      : intro;
    mainContent = `    <article>
      <h1>${escapeHtml(data.page.title)}</h1>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
    </article>`;
  } else {
    mainContent = `    <article><h1>${escapeHtml(SITE_NAME)}</h1></article>`;
  }

  return buildSsrShellHtml(route, data, mainContent);
}

export function injectSsrIntoHtml(html, { pathname, meta, data, route }) {
  const headTags = buildHeadTags(meta);
  const fallback = buildSsrFallbackHtml(route, data);
  const bootstrap = JSON.stringify({ pathname, meta, data }).replace(/</g, '\\u003c');

  let output = html;

  if (headTags) {
    output = output.replace(/<title>[^<]*<\/title>/i, headTags);
  }

  if (fallback) {
    output = output.replace('<div id="root"></div>', `${fallback}\n  <div id="root"></div>`);
  }

  const script = `<script>window.__POPCORN_SSR__=${bootstrap};</script>`;
  output = output.replace('</body>', `  ${script}\n</body>`);

  return output;
}

export function isStaticOrDevAsset(pathname) {
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return (
    pathname.startsWith('/@')
    || pathname.startsWith('/__')
    || pathname.startsWith('/node_modules/')
    || pathname.startsWith('/src/')
    || pathname.startsWith('/assets/')
  );
}

export function shouldHandleSsr(pathname, request) {
  if (pathname.startsWith('/api/')) return false;
  if (pathname.startsWith('/admin')) return false;
  if (pathname.startsWith('/share/')) return false;
  if (pathname === '/sitemap.xml') return false;
  if (pathname === '/robots.txt') return false;
  if (isStaticOrDevAsset(pathname)) return false;

  const accept = request.headers.get('Accept') || '';
  if (!accept.includes('text/html')) return false;

  const secFetchDest = request.headers.get('Sec-Fetch-Dest');
  if (secFetchDest && secFetchDest !== 'document' && secFetchDest !== 'empty') {
    return false;
  }

  return true;
}
