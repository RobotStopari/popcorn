export async function fetchInstagramPosts(limit = 4, username = '') {
  const params = new URLSearchParams({ limit: String(limit) });
  const normalizedUsername = typeof username === 'string' ? username.trim().replace(/^@/, '') : '';
  if (normalizedUsername) {
    params.set('username', normalizedUsername);
  }

  const response = await fetch(`/api/instagram/posts?${params}`);
  const payload = await response.json().catch(() => ({}));
  const posts = Array.isArray(payload.posts) ? payload.posts : [];

  return {
    posts,
    error: typeof payload.error === 'string' && payload.error
      ? payload.error
      : (!response.ok && !posts.length
        ? 'Nepodařilo se načíst příspěvky z Instagramu.'
        : ''),
  };
}
