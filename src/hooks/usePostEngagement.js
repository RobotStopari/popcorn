import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { getAnonymousLikeId } from '../utils/anonymous-like-id';
import { validateCommentBody } from '../utils/blog-comment-format';
import {
  createPostComment,
  deletePostComment,
  fetchUserHasLiked,
  resolveLikeId,
  subscribePostComments,
  togglePostLike,
  updatePostComment,
} from '../services/blog-engagement';

export function usePostEngagement(postId) {
  const { user, profile, profileComplete, signInWithGoogle } = useAdminAuth();
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likeError, setLikeError] = useState('');
  const [actionError, setActionError] = useState('');

  const anonymousId = useMemo(() => getAnonymousLikeId(), []);
  const likeId = useMemo(
    () => resolveLikeId(user, anonymousId),
    [user, anonymousId],
  );

  const canComment = Boolean(user && profileComplete);

  useEffect(() => {
    if (!postId) return undefined;

    setCommentsLoading(true);
    const unsubscribe = subscribePostComments(
      postId,
      (data) => {
        setComments(data);
        setCommentsLoading(false);
        setCommentsError('');
      },
      (err) => {
        setCommentsError(err.message || 'Nepodařilo se načíst komentáře.');
        setCommentsLoading(false);
      },
    );

    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    if (!postId || !likeId) return undefined;

    let cancelled = false;

    fetchUserHasLiked(postId, likeId)
      .then((liked) => {
        if (!cancelled) setHasLiked(liked);
      })
      .catch(() => {
        if (!cancelled) setHasLiked(false);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, likeId, user?.uid]);

  const toggleLike = useCallback(async () => {
    if (!postId || likeLoading) return false;

    setLikeLoading(true);
    setLikeError('');

    try {
      await togglePostLike(postId, { user, anonymousId });
      setHasLiked((prev) => !prev);
      return true;
    } catch (err) {
      setLikeError(err.message || 'Like se nepodařilo uložit.');
      return false;
    } finally {
      setLikeLoading(false);
    }
  }, [anonymousId, likeLoading, postId, user]);

  const addComment = useCallback(async (body) => {
    if (!canComment || !postId) return false;

    const validationError = validateCommentBody(body);
    if (validationError) {
      setActionError(validationError);
      return false;
    }

    setActionError('');

    try {
      await createPostComment(postId, { body, profile, user });
      return true;
    } catch (err) {
      setActionError(err.message || 'Komentář se nepodařilo uložit.');
      return false;
    }
  }, [canComment, postId, profile, user]);

  const editComment = useCallback(async (commentId, body) => {
    if (!postId) return false;

    const validationError = validateCommentBody(body);
    if (validationError) {
      setActionError(validationError);
      return false;
    }

    setActionError('');

    try {
      await updatePostComment(postId, commentId, body);
      return true;
    } catch (err) {
      setActionError(err.message || 'Komentář se nepodařilo upravit.');
      return false;
    }
  }, [postId]);

  const removeComment = useCallback(async (commentId) => {
    if (!postId) return false;

    setActionError('');

    try {
      await deletePostComment(postId, commentId);
      return true;
    } catch (err) {
      setActionError(err.message || 'Komentář se nepodařilo smazat.');
      return false;
    }
  }, [postId]);

  return {
    comments,
    commentsLoading,
    commentsError,
    hasLiked,
    likeLoading,
    likeError,
    actionError,
    setActionError,
    canComment,
    toggleLike,
    addComment,
    editComment,
    removeComment,
    signInWithGoogle,
    user,
    profileComplete,
  };
}
