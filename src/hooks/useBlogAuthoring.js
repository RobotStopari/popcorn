import { useCallback, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useBlogPosts } from '../contexts/BlogPostsContext';
import {
  buildAuthorSnapshot,
  getPublishTimestamp,
  normalizeBlogPost,
  resolveAuthorForDisplay,
} from '../utils/blog-post-format';
import {
  createBlogPost,
  deleteBlogPost,
  fetchAuthorSnapshot,
  isSlugTaken,
  updateBlogPost,
} from '../services/blog-posts';

export function useBlogAuthoring() {
  const { user, profile, profileComplete } = useAdminAuth();
  const { posts, prependPost } = useBlogPosts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');

  const canAuthor = Boolean(user && profileComplete);

  const canManagePost = useCallback(
    (post) => canAuthor && post?.author?.uid === user.uid,
    [canAuthor, user],
  );

  const openCreate = useCallback(() => {
    setEditingPost(null);
    setSaveError('');
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((post) => {
    if (!canManagePost(post)) return;
    setEditingPost(post);
    setSaveError('');
    setFormOpen(true);
  }, [canManagePost]);

  const openDelete = useCallback((post) => {
    if (!canManagePost(post)) return;
    setPostToDelete(post);
  }, [canManagePost]);

  const closeForm = useCallback(() => {
    setSaveError('');
    setFormOpen(false);
  }, []);

  const closeDelete = useCallback(() => {
    setPostToDelete(null);
  }, []);

  const handleSave = useCallback(async (payload) => {
    setSaveError('');

    if (!canAuthor) {
      setSaveError('Pro publikování dokončete profil a přihlaste se.');
      return false;
    }

    if (isSlugTaken(posts, payload.slug, editingPost?.id)) {
      setSaveError('URL příspěvku už používá jiný příspěvek.');
      return false;
    }

    try {
      if (editingPost) {
        if (!canManagePost(editingPost)) {
          setSaveError('Můžete upravovat jen vlastní příspěvky.');
          return false;
        }

        const author = editingPost.author?.uid
          ? await fetchAuthorSnapshot(editingPost.author.uid) || editingPost.author
          : buildAuthorSnapshot(profile, user);

        await updateBlogPost(editingPost.id, {
          ...payload,
          author,
        });
      } else {
        const publishMeta = getPublishTimestamp();
        const author = buildAuthorSnapshot(profile, user);
        const id = await createBlogPost({
          ...payload,
          ...publishMeta,
          author,
        });

        prependPost(normalizeBlogPost({
          id,
          ...payload,
          ...publishMeta,
          author,
          likeCount: 0,
          commentCount: 0,
          coverImage: payload.coverImage || '',
          coverPublicId: payload.coverPublicId || '',
          galleryImages: payload.galleryImages || [],
        }));
      }

      return true;
    } catch (err) {
      setSaveError(err.message || 'Uložení příspěvku se nezdařilo.');
      return false;
    }
  }, [
    canAuthor,
    canManagePost,
    editingPost,
    posts,
    profile,
    user,
    prependPost,
  ]);

  const handleConfirmDelete = useCallback(async (postId) => {
    const post = posts.find((item) => item.id === postId);
    if (!post || !canManagePost(post)) return false;

    try {
      await deleteBlogPost(postId);
      return true;
    } catch {
      return false;
    }
  }, [canManagePost, posts]);

  const formAuthor = editingPost
    ? resolveAuthorForDisplay(editingPost.author, { profile, user })
    : buildAuthorSnapshot(profile, user);

  return {
    canAuthor,
    canManagePost,
    formOpen,
    editingPost,
    postToDelete,
    saveError,
    formAuthor,
    openCreate,
    openEdit,
    openDelete,
    closeForm,
    closeDelete,
    handleSave,
    handleConfirmDelete,
  };
}
