import { useState } from 'react';
import { MAX_COMMENT_LENGTH } from '../utils/blog-comment-format';
import { siteText } from '../utils/admin-text';
import BlogCommentItem from './BlogCommentItem';
import BlogCompleteProfileModal from './BlogCompleteProfileModal';
import { HeartIcon, CommentBubbleIcon } from './BlogEngagementIcons';
import { useBlogCompleteProfile } from '../hooks/useBlogCompleteProfile';
import { usePostEngagement } from '../hooks/usePostEngagement';
import { trackBlogComment, trackBlogLike } from '../utils/analytics-track';

export default function BlogPostEngagement({ post }) {
  const {
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
    signInWithGoogle,
    user,
    profileComplete,
  } = usePostEngagement(post.id);

  const {
    openCompleteProfile,
    showCompleteProfileModal,
    closeCompleteProfile,
  } = useBlogCompleteProfile();

  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const likeCount = post.likeCount ?? 0;
  const commentCount = post.commentCount ?? comments.length;

  const handleLike = async () => {
    const liked = await toggleLike();
    if (liked && !hasLiked) {
      trackBlogLike(post.id, post.title || post.slug || '');
    }
  };

  const handleSubmitComment = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setActionError('');
    const ok = await addComment(commentBody);
    setSubmitting(false);
    if (ok) {
      trackBlogComment(post.id, post.title || post.slug || '');
      setCommentBody('');
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    await signInWithGoogle();
    setSigningIn(false);
  };

  return (
    <section className="blog-engagement reveal" aria-label={siteText('blog.engagement.sectionAriaLabel')}>
      <div className="blog-engagement__toolbar">
        <button
          type="button"
          className={`blog-engagement__like${hasLiked ? ' blog-engagement__like--active' : ''}`}
          onClick={handleLike}
          disabled={likeLoading}
          aria-pressed={hasLiked}
          aria-label={hasLiked
            ? siteText('blog.engagement.unlikeAriaLabel')
            : siteText('blog.engagement.likeAriaLabel')}
        >
          <HeartIcon filled={hasLiked} size={18} />
          <span>{likeCount}</span>
        </button>

        <div className="blog-engagement__comment-count">
          <CommentBubbleIcon size={18} />
          <span>{commentCount}</span>
        </div>
      </div>

      {likeError && <p className="admin-error blog-engagement__error">{likeError}</p>}

      <div className="blog-engagement__comments">
        <h2 className="blog-engagement__title">{siteText('blog.engagement.commentsTitle')}</h2>

        {commentsLoading ? (
          <p className="section__empty">{siteText('blog.engagement.commentsLoading')}</p>
        ) : commentsError ? (
          <p className="admin-error">{commentsError}</p>
        ) : comments.length > 0 ? (
          <ul className="blog-engagement__list">
            {comments.map((comment) => (
              <li key={comment.id}>
                <BlogCommentItem
                  comment={comment}
                  canEdit={Boolean(user?.uid && comment.author.uid === user.uid)}
                  onEdit={editComment}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="blog-engagement__empty">{siteText('blog.engagement.commentsEmpty')}</p>
        )}

        {canComment ? (
          <form className="blog-engagement__form" onSubmit={handleSubmitComment}>
            <label className="admin-form__label" htmlFor={`comment-body-${post.id}`}>
              {siteText('blog.engagement.commentLabel')}
            </label>
            <textarea
              id={`comment-body-${post.id}`}
              className="blog-comment__textarea blog-comment__textarea--new admin-form__input"
              value={commentBody}
              maxLength={MAX_COMMENT_LENGTH}
              rows={3}
              placeholder={siteText('blog.engagement.commentPlaceholder')}
              onChange={(event) => setCommentBody(event.target.value)}
            />
            {actionError && <p className="admin-error">{actionError}</p>}
            <button
              type="submit"
              className="btn btn--primary btn--small"
              disabled={submitting || !commentBody.trim()}
            >
              {submitting ? siteText('common.submitting') : siteText('blog.engagement.submit')}
            </button>
          </form>
        ) : user && !profileComplete ? (
          <div className="blog-engagement__login-prompt">
            <p>{siteText('blog.engagement.completeProfilePrompt')}</p>
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={openCompleteProfile}
            >
              {siteText('blog.profile.completeCta')}
            </button>
          </div>
        ) : (
          <div className="blog-engagement__login-prompt">
            <p>{siteText('blog.engagement.signInPrompt')}</p>
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={handleSignIn}
              disabled={signingIn}
            >
              {signingIn ? siteText('auth.signingIn') : siteText('auth.signIn')}
            </button>
          </div>
        )}
      </div>

      <BlogCompleteProfileModal
        open={showCompleteProfileModal}
        onClose={closeCompleteProfile}
      />
    </section>
  );
}
