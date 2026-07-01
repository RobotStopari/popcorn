import { useEffect, useState } from 'react';
import AdminAvatar from './AdminAvatar';
import { formatAuthorDisplayName } from '../utils/blog-post-format';
import { formatCommentDateTime, MAX_COMMENT_LENGTH } from '../utils/blog-comment-format';

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function BlogCommentItem({
  comment,
  canEdit = false,
  onEdit,
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setBody(comment.body);
    setEditing(false);
    setError('');
  }, [comment.id, comment.body]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const ok = await onEdit(comment.id, body);
    setSaving(false);
    if (ok) setEditing(false);
    else setError('Uložení se nezdařilo.');
  };

  return (
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
          <time className="blog-comment__date">
            {formatCommentDateTime(comment)}
            {comment.isEdited && ' · upraveno'}
          </time>
        </div>

        {editing ? (
          <div className="blog-comment__edit">
            <textarea
              className="blog-comment__textarea admin-form__input"
              value={body}
              maxLength={MAX_COMMENT_LENGTH}
              rows={2}
              onChange={(event) => setBody(event.target.value)}
            />
            {error && <p className="admin-error">{error}</p>}
            <div className="blog-comment__edit-actions">
              <button type="button" className="btn btn--outline btn--small" onClick={() => setEditing(false)} disabled={saving}>
                Zrušit
              </button>
              <button type="button" className="btn btn--primary btn--small" onClick={handleSave} disabled={saving || !body.trim()}>
                {saving ? 'Ukládám…' : 'Uložit'}
              </button>
            </div>
          </div>
        ) : (
          <div className="blog-comment__body-row">
            <p className="blog-comment__body">{comment.body}</p>
            {canEdit && (
              <div className="blog-comment__actions">
                <button
                  type="button"
                  className="blog-comment__action"
                  aria-label="Upravit komentář"
                  onClick={() => setEditing(true)}
                >
                  <EditIcon />
                </button>
              </div>
            )}
            {error && <p className="admin-error">{error}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
