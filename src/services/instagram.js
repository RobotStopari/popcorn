const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/popcorn_puk/';

export { INSTAGRAM_PROFILE_URL };

export async function fetchInstagramPosts(limit = 4) {
  const response = await fetch(`/api/instagram/posts?limit=${limit}`);
  const payload = await response.json().catch(() => ({}));

  if (Array.isArray(payload.posts) && payload.posts.length > 0) {
    return payload.posts;
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Nepodařilo se načíst příspěvky z Instagramu.');
  }

  return [];
}
