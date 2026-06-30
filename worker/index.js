import { handleInstagramImageRequest, handleInstagramPostsRequest } from './instagram.js';
import shellHtml from './shell.html';
import { buildRobotsTxt } from '../shared/robots.js';
import {
  buildSitemapXml,
  fetchSsrPayload,
  injectSsrIntoHtml,
  shouldHandleSsr,
} from './ssr.js';

function resolveSiteUrl(env, request) {
  const configured = env.SITE_URL || env.VITE_SITE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
}

async function loadShellHtml(request, env) {
  const assetResponse = await env.ASSETS.fetch(request);
  if (assetResponse.ok) {
    return assetResponse.text();
  }

  // SPA asset routing can 307 /index.html → / — never forward that to the client.
  return shellHtml;
}

async function handleSsrRequest(request, env) {
  const url = new URL(request.url);

  try {
    const payload = await fetchSsrPayload(url.pathname, env, request);

    if (payload.redirect) {
      return Response.redirect(payload.redirect, 301);
    }

    const template = await loadShellHtml(request, env);
    const html = injectSsrIntoHtml(template, {
      pathname: url.pathname,
      meta: payload.meta,
      data: payload.data,
      route: payload.route,
    });

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('SSR failed:', error);

    try {
      const html = injectSsrIntoHtml(shellHtml, {
        pathname: url.pathname,
        meta: null,
        data: null,
        route: { type: 'unknown' },
      });
      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    } catch {
      return new Response('Page unavailable', { status: 503 });
    }
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/instagram/posts') {
      return handleInstagramPostsRequest(request, env);
    }

    if (url.pathname === '/api/instagram/image') {
      return handleInstagramImageRequest(request);
    }

    if (url.pathname === '/robots.txt') {
      const siteUrl = resolveSiteUrl(env, request);
      return new Response(buildRobotsTxt(siteUrl), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (url.pathname === '/sitemap.xml') {
      try {
        const xml = await buildSitemapXml(env, request);
        return new Response(xml, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          },
        });
      } catch (error) {
        console.error('Sitemap failed:', error);
        return new Response('Sitemap unavailable', { status: 503 });
      }
    }

    if (shouldHandleSsr(url.pathname, request)) {
      return handleSsrRequest(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
