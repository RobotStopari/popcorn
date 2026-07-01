const INSTAGRAM_APP_ID = '936619743392459';
const DEFAULT_USERNAME = 'popcorn_puk';
const CACHE_TTL_SECONDS = 3600;
const INSTAGRAM_TIMELINE_DOC_ID = '34579740524958711';
const INSTAGRAM_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';

function buildInstagramHeaders(username = '') {
  const profilePath = username ? `${username}/` : '';
  return {
    'X-IG-App-ID': INSTAGRAM_APP_ID,
    'X-ASBD-ID': '198387',
    'User-Agent': INSTAGRAM_USER_AGENT,
    Accept: '*/*',
    'Accept-Language': 'cs-CZ,cs;q=0.9,en;q=0.8',
    Referer: `https://www.instagram.com/${profilePath}`,
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };
}

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
  if (Array.isArray(node?.pinned_for_users) && node.pinned_for_users.length > 0) {
    return true;
  }

  if (Array.isArray(node?.timeline_pinned_user_ids) && node.timeline_pinned_user_ids.length > 0) {
    return true;
  }

  return false;
}

function normalizePost(node) {
  const shortcode = node?.shortcode || node?.code;
  if (!shortcode || isPinnedPost(node)) return null;

  const caption = node.edge_media_to_caption?.edges?.[0]?.node?.text?.trim()
    || node.caption?.text?.trim()
    || '';
  const imageUrl = node.display_url
    || node.thumbnail_src
    || node.image_versions2?.candidates?.[0]?.url
    || '';
  const isVideo = node.is_video === true
    || node.media_type === 2
    || (Array.isArray(node.video_versions) && node.video_versions.length > 0);

  return {
    id: shortcode,
    permalink: `https://www.instagram.com/p/${shortcode}/`,
    imageUrl: toProxiedImageUrl(imageUrl),
    caption,
    isVideo,
    timestamp: node.taken_at_timestamp || node.taken_at || null,
  };
}

async function fetchInstagramPostsGraphql(username, limit) {
  const variables = {
    data: {
      count: Math.max(limit, 12),
      include_relationship_info: true,
      latest_besties_reel_media: true,
      latest_reel_media: true,
    },
    username,
    __relay_internal__pv__PolarisFeedShareMenurelayprovider: false,
  };

  const url = `https://www.instagram.com/graphql/query/?doc_id=${INSTAGRAM_TIMELINE_DOC_ID}&variables=${encodeURIComponent(JSON.stringify(variables))}`;
  const response = await fetch(url, {
    headers: buildInstagramHeaders(username),
  });

  if (!response.ok) {
    throw new Error(`Instagram timeline request failed (${response.status})`);
  }

  const payload = await response.json();
  const edges = payload?.data?.xdt_api__v1__feed__user_timeline_graphql_connection?.edges || [];

  return edges
    .map((edge) => edge.node)
    .map((node) => normalizePost(node))
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
}

async function resolveInstagramUserId(username) {
  const response = await fetch(`https://www.instagram.com/${encodeURIComponent(username)}/`, {
    headers: buildInstagramHeaders(username),
  });

  if (!response.ok) {
    throw new Error(`Instagram profile page request failed (${response.status})`);
  }

  const html = await response.text();
  const match = html.match(/"profilePage_(\d+)"/) || html.match(/profilePage_(\d+)/);
  if (!match?.[1]) {
    throw new Error('Instagram user id not found');
  }

  return match[1];
}

async function fetchInstagramPostsFeedUser(username, limit) {
  const userId = await resolveInstagramUserId(username);
  const response = await fetch(`https://www.instagram.com/api/v1/feed/user/${userId}/`, {
    headers: buildInstagramHeaders(username),
  });

  if (!response.ok) {
    throw new Error(`Instagram feed request failed (${response.status})`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return items
    .map((node) => normalizePost(node))
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
}

export async function fetchInstagramPosts(username = DEFAULT_USERNAME, limit = 4) {
  try {
    return await fetchInstagramPostsGraphql(username, limit);
  } catch (graphqlError) {
    return fetchInstagramPostsFeedUser(username, limit);
  }
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
      'User-Agent': INSTAGRAM_USER_AGENT,
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
