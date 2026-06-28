import { handleInstagramImageRequest, handleInstagramPostsRequest } from './instagram.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/instagram/posts') {
      return handleInstagramPostsRequest(request, env);
    }

    if (url.pathname === '/api/instagram/image') {
      return handleInstagramImageRequest(request);
    }

    return env.ASSETS.fetch(request);
  },
};
