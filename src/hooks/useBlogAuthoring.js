import { useCallback, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
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
import { notifyAdminsOfNewBlogPost } from '../services/blog-notify';
import { siteText } from '../utils/admin-text';

export function useBlogAuthoring() {
  const { user, profile, profileComplete, canAccessAdmin } = useAdminAuth();
  const { settings } = useSiteSettings();
  const { posts, prependPost } = useBlogPosts();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');

  const canCreatePosts = Boolean(
    user && profileComplete && (settings.membersCanCreateBlogPosts || canAccessAdmin),
  );
  const canAuthor = canCreatePosts;

  const canManagePost = useCallback(
    (post) => Boolean(
      user
      && profileComplete
      && (
        (post?.author?.uid && post.author.uid === user.uid)
        || (canAccessAdmin && post?.isExternal)
      ),
    ),
    [user, profileComplete, canAccessAdmin],
  );

  const openCreate = useCallback(() => {
    if (!canCreatePosts) return;
    setEditingPost(null);
    setSaveError('');
    setFormOpen(true);
  }, [canCreatePosts]);

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

  const handleSave = useCallback(async (payload, { silent = false } = {}) => {
    setSaveError('');

    if (!user || !profileComplete) {
      setSaveError(siteText('blog.authoring.profileRequired'));
      return false;
    }

    if (!editingPost && !canCreatePosts) {
      setSaveError(siteText('blog.authoring.createDisabled'));
      return false;
    }

    if (!payload.isExternal && payload.slug && isSlugTaken(posts, payload.slug, editingPost?.id)) {
      setSaveError(siteText('blog.authoring.slugTaken'));
      return false;
    }

    try {
      if (editingPost) {
        if (!canManagePost(editingPost)) {
          setSaveError(siteText('blog.authoring.editOwnOnly'));
          return false;
        }

        let author = payload.author;
        if (!payload.isExternal) {
          author = editingPost.author?.uid
            ? await fetchAuthorSnapshot(editingPost.author.uid) || editingPost.author
            : buildAuthorSnapshot(profile, user);
        }

        await updateBlogPost(editingPost.id, {
          ...payload,
          author,
        });
        if (editingPost.draft && payload.draft !== true) {
          notifyAdminsOfNewBlogPost(editingPost.id).catch(() => {});
        }
        setEditingPost((current) => (
          current?.id === editingPost.id
            ? normalizeBlogPost({ ...current, ...payload, author, id: editingPost.id })
            : current
        ));
      } else {
        const publishMeta = getPublishTimestamp();
        const author = payload.isExternal
          ? payload.author
          : buildAuthorSnapshot(profile, user);
        const id = await createBlogPost({
          ...payload,
          ...publishMeta,
          author,
        });

        const created = normalizeBlogPost({
          id,
          ...payload,
          ...publishMeta,
          author,
          likeCount: 0,
          commentCount: 0,
          coverImage: payload.coverImage || '',
          coverPublicId: payload.coverPublicId || '',
          galleryImages: payload.galleryImages || [],
        });
        prependPost(created);
        setEditingPost(created);
      }

      return true;
    } catch (err) {
      setSaveError(err.message || siteText('blog.authoring.saveError'));
      return false;
    }
  }, [
    canCreatePosts,
    canManagePost,
    editingPost,
    posts,
    profile,
    profileComplete,
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
    user,
    canAuthor,
    canCreatePosts,
    canManagePost,
    allowExternalPosts: canAccessAdmin,
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
