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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

export default function BlogCommentItem({
  comment,
  canManage = false,
  onEdit,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setBody(comment.body);
    setEditing(false);
    setConfirmDelete(false);
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

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    const ok = await onDelete(comment.id);
    setDeleting(false);
    if (!ok) setError('Smazání se nezdařilo.');
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

          {canManage && !editing && (
            <div className="blog-comment__actions">
              {!confirmDelete ? (
                <>
                  <button
                    type="button"
                    className="blog-comment__action"
                    aria-label="Upravit komentář"
                    onClick={() => setEditing(true)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    type="button"
                    className="blog-comment__action blog-comment__action--danger"
                    aria-label="Smazat komentář"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <TrashIcon />
                  </button>
                </>
              ) : (
                <div className="blog-comment__confirm">
                  <span>Smazat?</span>
                  <button type="button" className="blog-comment__confirm-btn" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                    Ne
                  </button>
                  <button type="button" className="blog-comment__confirm-btn blog-comment__confirm-btn--danger" onClick={handleDelete} disabled={deleting}>
                    {deleting ? '…' : 'Ano'}
                  </button>
                </div>
              )}
            </div>
          )}
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
          <>
            <p className="blog-comment__body">{comment.body}</p>
            {error && <p className="admin-error">{error}</p>}
          </>
        )}
      </div>
    </article>
  );
}
