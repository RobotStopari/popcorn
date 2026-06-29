import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {
  fetchInstagramPosts,
  handleInstagramImageRequest,
  jsonResponse,
  resolveInstagramUsername,
} from './worker/instagram.js';

async function sendWebResponse(webResponse, res) {
  res.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  const body = Buffer.from(await webResponse.arrayBuffer());
  res.end(body);
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'instagram-api-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/instagram/')) {
            next();
            return;
          }

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
              const username = resolveInstagramUsername(new Request(url), process.env);
              const posts = await fetchInstagramPosts(username, limit);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ posts, username }));
            } catch (error) {
              const username = resolveInstagramUsername(new Request(url), process.env);
              const response = jsonResponse(
                { posts: [], username, error: error.message || 'Failed to load Instagram posts.' },
                { status: 200, cacheSeconds: 0 },
              );
              await sendWebResponse(response, res);
            }
            return;
          }
        });
      },
    },
  ],
  publicDir: 'public',
});
