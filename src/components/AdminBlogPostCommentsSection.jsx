import { useEffect, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminAvatar from './AdminAvatar';
import BlogPostStats from './BlogPostStats';
import { formatAuthorDisplayName } from '../utils/blog-post-format';
import { formatCommentDateTime } from '../utils/blog-comment-format';
import { deletePostComment, fetchPostComments } from '../services/blog-engagement';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

export default function AdminBlogPostCommentsSection({ post }) {
  const { canAccessAdmin } = useAdminAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  useEffect(() => {
    if (!post?.id) return undefined;

    let cancelled = false;
    setLoading(true);
    setError('');

    fetchPostComments(post.id)
      .then((data) => {
        if (!cancelled) {
          setComments(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Nepodařilo se načíst komentáře.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [post?.id]);

  const handleDelete = async (commentId) => {
    setDeletingId(commentId);
    setError('');

    try {
      await deletePostComment(post.id, commentId);
      setComments((prev) => prev.filter((item) => item.id !== commentId));
      setConfirmDeleteId('');
    } catch (err) {
      setError(err.message || 'Smazání komentáře se nezdařilo.');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <section className="admin-blog-form__engagement" aria-label="Reakce na příspěvek">
      <h3 className="admin-blog-form__engagement-title">Reakce</h3>
      <BlogPostStats
        likeCount={post.likeCount}
        commentCount={post.commentCount ?? comments.length}
        className="admin-blog-form__stats"
      />

      <h4 className="admin-blog-form__comments-title">Komentáře</h4>

      {loading ? (
        <p className="admin-form__hint">Načítám komentáře…</p>
      ) : comments.length > 0 ? (
        <ul className="blog-engagement__list admin-blog-form__comments">
          {comments.map((comment) => (
            <li key={comment.id}>
              <article className="blog-comment">
                <AdminAvatar
                  photoURL={comment.author?.photoURL}
                  name={comment.author?.name}
                  email={comment.author?.email}
                  size="small"
                  className="blog-comment__avatar"
                />

                <div className="blog-comment__content">
                  <div className="blog-comment__head">
                    <span className="blog-comment__author">{formatAuthorDisplayName(comment.author)}</span>
                    <time className="blog-comment__date">{formatCommentDateTime(comment)}</time>
                    <div className="blog-comment__actions">
                      {canAccessAdmin && (
                        confirmDeleteId === comment.id ? (
                          <div className="blog-comment__confirm">
                            <span>Smazat?</span>
                            <button
                              type="button"
                              className="blog-comment__confirm-btn"
                              onClick={() => setConfirmDeleteId('')}
                              disabled={deletingId === comment.id}
                            >
                              Ne
                            </button>
                            <button
                              type="button"
                              className="blog-comment__confirm-btn blog-comment__confirm-btn--danger"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingId === comment.id}
                            >
                              {deletingId === comment.id ? '…' : 'Ano'}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="blog-comment__action blog-comment__action--danger admin-blog-form__comment-delete"
                            aria-label="Smazat komentář"
                            disabled={Boolean(deletingId)}
                            onClick={() => setConfirmDeleteId(comment.id)}
                          >
                            <TrashIcon />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <p className="blog-comment__body">{comment.body}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-form__hint">K tomuto příspěvku zatím nejsou žádné komentáře.</p>
      )}

      {error && <p className="admin-error">{error}</p>}
    </section>
  );
}
