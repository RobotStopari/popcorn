import { auth } from '../firebase';

export async function notifyAdminsOfNewBlogPost(postId) {
  const trimmedId = String(postId || '').trim();
  if (!trimmedId) return;

  const user = auth.currentUser;
  if (!user) return;

  const idToken = await user.getIdToken();

  const response = await fetch('/api/blog/notify-created', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ postId: trimmedId }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Notification request failed (${response.status}).`);
  }

  return response.json();
}
