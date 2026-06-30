import { readFileSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import {
  fetchInstagramPosts,
  handleInstagramImageRequest,
  jsonResponse,
  resolveInstagramUsername,
} from './worker/instagram.js';
import {
  buildRobotsTxt,
  buildSitemapXml,
  fetchSsrPayload,
  injectSsrIntoHtml,
  shouldHandleSsr,
} from './worker/ssr.js';

async function sendWebResponse(webResponse, res) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = Buffer.from(await webResponse.arrayBuffer());
  res.end(body);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'popcorn-worker-dev',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) {
              next();
              return;
            }

            if (req.url.startsWith('/api/instagram/')) {
              const url = new URL(req.url, 'http://localhost');

              if (url.pathname === '/api/instagram/image') {
                try {
                  await sendWebResponse(await handleInstagramImageRequest(new Request(url)), res);
                } catch (error) {
                  res.statusCode = 502;
                  res.end(error.message || 'Image proxy failed.');
                }
                return;
              }

              if (url.pathname === '/api/instagram/posts') {
                try {
                  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '4', 10) || 4, 1), 12);
                  const username = resolveInstagramUsername(new Request(url), env);
                  const posts = await fetchInstagramPosts(username, limit);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json; charset=utf-8');
                  res.end(JSON.stringify({ posts, username }));
                } catch (error) {
                  const username = resolveInstagramUsername(new Request(url), env);
                  const response = jsonResponse(
                    { posts: [], username, error: error.message || 'Failed to load Instagram posts.' },
                    { status: 200, cacheSeconds: 0 },
                  );
                  await sendWebResponse(response, res);
                }
                return;
              }
            }

            if (req.method !== 'GET') {
              next();
              return;
            }

            const url = new URL(req.url, 'http://localhost');
            const request = new Request(url, {
              headers: req.headers,
            });

            if (url.pathname === '/robots.txt') {
              const siteUrl = (env.SITE_URL || env.VITE_SITE_URL || `http://${req.headers.host}`).replace(/\/$/, '');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.end(buildRobotsTxt(siteUrl));
              return;
            }

            if (url.pathname === '/sitemap.xml') {
              try {
                const xml = await buildSitemapXml(env, request);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/xml; charset=utf-8');
                res.end(xml);
              } catch (error) {
                res.statusCode = 503;
                res.end('Sitemap unavailable');
              }
              return;
            }

            if (!shouldHandleSsr(url.pathname, request)) {
              next();
              return;
            }

            try {
              const payload = await fetchSsrPayload(url.pathname, env, request);

              if (payload.redirect) {
                res.writeHead(301, { Location: payload.redirect });
                res.end();
                return;
              }

              const indexHtml = readFileSync('index.html', 'utf-8');
              let html = await server.transformIndexHtml(url.pathname, indexHtml);
              html = injectSsrIntoHtml(html, {
                pathname: url.pathname,
                meta: payload.meta,
                data: payload.data,
                route: payload.route,
              });
              res.statusCode = 200;
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.end(html);
            } catch (error) {
              console.warn('Dev SSR failed, falling back to SPA:', error.message);
              next();
            }
          });
        },
      },
    ],
    publicDir: 'public',
  };
});
