const INSTAGRAM_APP_ID = '936619743392459';
const DEFAULT_USERNAME = 'popcorn_puk';
const CACHE_TTL_SECONDS = 3600;
const INSTAGRAM_HEADERS = {
  'X-IG-App-ID': INSTAGRAM_APP_ID,
  'X-ASBD-ID': '129477',
  'X-IG-WWW-Claim': '0',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: '*/*',
  'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.8',
  Referer: 'https://www.instagram.com/',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

export function sanitizeInstagramUsername(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/^@/, '');
  return /^[a-zA-Z0-9._]{1,30}$/.test(trimmed) ? trimmed : '';
}

export function resolveInstagramUsername(request, env = {}) {
  const fromQuery = sanitizeInstagramUsername(new URL(request.url).searchParams.get('username'));
  if (fromQuery) return fromQuery;

  const fromEnv = sanitizeInstagramUsername(env.INSTAGRAM_USERNAME);
  if (fromEnv) return fromEnv;

  return DEFAULT_USERNAME;
}

function isAllowedInstagramImageUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:'
      && (
        parsed.hostname.endsWith('.cdninstagram.com')
        || parsed.hostname.endsWith('.fbcdn.net')
        || parsed.hostname.endsWith('.instagram.com')
      );
  } catch {
    return false;
  }
}

export function toProxiedImageUrl(imageUrl) {
  if (!imageUrl) return '';
  return `/api/instagram/image?url=${encodeURIComponent(imageUrl)}`;
}

function isPinnedPost(node) {
  return Array.isArray(node?.pinned_for_users) && node.pinned_for_users.length > 0;
}

function normalizePost(node) {
  if (!node?.shortcode) return null;

  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text?.trim() || '';
  const imageUrl = node.display_url || node.thumbnail_src || '';

  return {
    id: node.shortcode,
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
    imageUrl: toProxiedImageUrl(imageUrl),
    caption,
    isVideo: node.is_video === true,
    timestamp: node.taken_at_timestamp || null,
  };
}

export async function fetchInstagramPosts(username = DEFAULT_USERNAME, limit = 4) {
  const profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;

  const response = await fetch(profileUrl, {
    headers: INSTAGRAM_HEADERS,
  });

  if (!response.ok) {
    throw new Error(`Instagram profile request failed (${response.status})`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges || [];

  return edges
    .map((edge) => edge.node)
    .filter((node) => node?.shortcode && !isPinnedPost(node))
    .sort((a, b) => (b.taken_at_timestamp || 0) - (a.taken_at_timestamp || 0))
    .map((node) => normalizePost(node))
    .filter(Boolean)
    .slice(0, limit);
}

export function jsonResponse(data, { status = 200, cacheSeconds = CACHE_TTL_SECONDS } = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
  };

  return new Response(JSON.stringify(data), { status, headers });
}

export async function handleInstagramImageRequest(request) {
  const url = new URL(request.url);
  const sourceUrl = url.searchParams.get('url');

  if (!sourceUrl || !isAllowedInstagramImageUrl(sourceUrl)) {
    return new Response('Forbidden', { status: 403 });
  }

  const cacheKey = new Request(sourceUrl);
  const cache = typeof caches !== 'undefined' ? caches.default : null;

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  const upstream = await fetch(sourceUrl, {
    headers: {
      Referer: 'https://www.instagram.com/',
      'User-Agent': INSTAGRAM_HEADERS['User-Agent'],
      Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });

  if (!upstream.ok) {
    return new Response('Image not found', { status: upstream.status });
  }

  const contentType = upstream.headers.get('content-type') || 'image/jpeg';
  const response = new Response(upstream.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });

  if (cache) {
    await cache.put(cacheKey, response.clone());
  }

  return response;
}

export async function handleInstagramPostsRequest(request, env) {
  const url = new URL(request.url);
  const username = resolveInstagramUsername(request, env);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get('limit') || '4', 10) || 4, 1), 12);

  const cache = caches.default;
  const cacheKey = new Request(`https://instagram-cache.local/${username}?limit=${limit}`);

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  try {
    const posts = await fetchInstagramPosts(username, limit);
    const response = jsonResponse({ posts, username });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return jsonResponse(
      { posts: [], username, error: error.message || 'Failed to load Instagram posts.' },
      { status: 200, cacheSeconds: 120 },
    );
  }
}
