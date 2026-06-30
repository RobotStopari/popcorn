import { deriveEventSlug } from '../shared/event-url.js';

const DEFAULT_MENU_LINKS = [
  { href: '/', label: 'Domů' },
  { href: '/co-je-popcorn', label: 'Co je Popcorn' },
  { href: '/vedeni-kontakt', label: 'Vedení – Kontakt' },
  { href: '/pro-novacky', label: 'Pro nováčky' },
  { href: '/vypukne', label: 'VyPUKne' },
  { href: '/probehle', label: 'Proběhlé' },
  { href: '/usporadej', label: 'Uspořádej akci!' },
  { href: '/blog', label: 'Blog' },
  { href: '/odkazy', label: 'Odkazy' },
];

function pagePath(page) {
  if (!page) return '/';
  return page.slug ? `/${page.slug}` : '/';
}

function resolveMenuLink(link, pages) {
  const linkType = link?.linkType === 'custom' ? 'custom' : 'page';

  if (linkType === 'page') {
    const page = pages.find((entry) => entry.id === link.pageId);
    return {
      href: page ? pagePath(page) : '/',
      label: link.label?.trim() || page?.title || '',
      external: false,
    };
  }

  return {
    href: link.href?.trim() || '#',
    label: link.label?.trim() || '',
    external: Boolean(link.external),
  };
}

function flattenMenuLinks(menuItems, pages) {
  const links = [];

  for (const item of menuItems || []) {
    if (item?.type === 'dropdown') {
      for (const link of item.items || []) {
        const resolved = resolveMenuLink(link, pages);
        if (resolved.label && !resolved.external && resolved.href.startsWith('/')) {
          links.push(resolved);
        }
      }
      continue;
    }

    const resolved = resolveMenuLink(item, pages);
    if (resolved.label && !resolved.external && resolved.href.startsWith('/')) {
      links.push(resolved);
    }
  }

  return links;
}

function uniqueLinks(links) {
  const seen = new Set();
  return links.filter((link) => {
    const key = link.href;
    if (!link.label || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseIsoDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function sortEventsByStart(events) {
  return [...events].sort((a, b) => {
    const aDate = parseIsoDate(a.dateStart)?.getTime() || 0;
    const bDate = parseIsoDate(b.dateStart)?.getTime() || 0;
    return bDate - aDate;
  });
}

function sortPostsByPublished(posts) {
  return [...posts].sort((a, b) => {
    const aDate = new Date(`${a.publishedDate || '1970-01-01'}T${a.publishedTime || '00:00'}`);
    const bDate = new Date(`${b.publishedDate || '1970-01-01'}T${b.publishedTime || '00:00'}`);
    return bDate.getTime() - aDate.getTime();
  });
}

export function collectSsrInternalLinks(data) {
  const pages = data?.pages || [];
  const menuItems = data?.siteMenu?.items || [];
  const menuLinks = flattenMenuLinks(menuItems, pages);
  const fallbackLinks = menuLinks.length ? menuLinks : DEFAULT_MENU_LINKS;

  const pageLinks = pages
    .filter((page) => page.slug && page.title)
    .map((page) => ({ href: pagePath(page), label: page.title }));

  const eventLinks = sortEventsByStart(data?.events || [])
    .slice(0, 8)
    .map((event) => ({
      href: `/akce/${encodeURIComponent(deriveEventSlug(event))}`,
      label: event.title || 'Akce',
    }))
    .filter((link) => link.label);

  const blogLinks = sortPostsByPublished(data?.blogPosts || [])
    .filter((post) => post.slug && post.title)
    .slice(0, 8)
    .map((post) => ({
      href: `/blog/${encodeURIComponent(post.slug)}`,
      label: post.title,
    }));

  return {
    nav: uniqueLinks([{ href: '/', label: 'Domů' }, ...fallbackLinks]),
    pages: uniqueLinks(pageLinks),
    events: uniqueLinks(eventLinks),
    blog: uniqueLinks(blogLinks),
  };
}

function renderLinkList(links) {
  if (!links.length) return '';
  return `<ul class="ssr-fallback__links">\n${
    links.map((link) => `    <li><a href="${escapeAttr(link.href)}">${escapeHtml(link.label)}</a></li>`).join('\n')
  }\n  </ul>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value);
}

export function buildSsrShellHtml(route, data, mainContent) {
  if (!data) return mainContent || '';

  const links = collectSsrInternalLinks(data);
  const nav = renderLinkList(links.nav);

  const sections = [];

  if (links.events.length) {
    sections.push(`  <section class="ssr-fallback__section">
    <h2>Akce</h2>
${renderLinkList(links.events).replace(/^/gm, '    ')}
  </section>`);
  }

  if (links.blog.length) {
    sections.push(`  <section class="ssr-fallback__section">
    <h2>Blog</h2>
${renderLinkList(links.blog).replace(/^/gm, '    ')}
  </section>`);
  }

  if (links.pages.length) {
    sections.push(`  <section class="ssr-fallback__section">
    <h2>Stránky</h2>
${renderLinkList(links.pages).replace(/^/gm, '    ')}
  </section>`);
  }

  const footerLinks = uniqueLinks([
    ...links.nav,
    ...links.events.slice(0, 4),
    ...links.blog.slice(0, 4),
  ]);

  return `<div id="ssr-shell" class="ssr-fallback">
  <nav id="ssr-nav" class="ssr-fallback__nav" aria-label="Hlavní navigace">
${nav.replace(/^/gm, '    ')}
  </nav>
  <main id="ssr-fallback" class="ssr-fallback__main">
${mainContent}
${sections.join('\n')}
  </main>
  <footer id="ssr-footer" class="ssr-fallback__footer">
    <p><a href="/">${escapeHtml(data.siteSettings?.brandLine1 || 'Komunita Popcorn')}</a></p>
${renderLinkList(footerLinks).replace(/^/gm, '    ')}
  </footer>
</div>`;
}
