import { handleInstagramImageRequest, handleInstagramPostsRequest } from './instagram.js';
import {
  buildRobotsTxt,
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

async function handleSsrRequest(request, env) {
  const url = new URL(request.url);

  try {
    const payload = await fetchSsrPayload(url.pathname, env, request);

    if (payload.redirect) {
      return Response.redirect(payload.redirect, 301);
    }

    const assetRequest = new Request(new URL('/index.html', request.url), request);
    const assetResponse = await env.ASSETS.fetch(assetRequest);
    if (!assetResponse.ok) {
      return assetResponse;
    }

    let html = await assetResponse.text();
    html = injectSsrIntoHtml(html, {
      pathname: url.pathname,
      meta: payload.meta,
      data: payload.data,
      route: payload.route,
    });

    return new Response(html, {
      status: assetResponse.status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('SSR failed:', error);
    return env.ASSETS.fetch(request);
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
          'Cache-Control': 'public, max-age=3600',
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
