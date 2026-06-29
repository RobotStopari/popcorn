import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

export default function AdminDeleteBlogPostDialog({ open, post, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 200);

  useEffect(() => {
    if (!open) {
      setError('');
      setDeleting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted || !post) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    const ok = await onConfirm(post.id);
    setDeleting(false);
    if (ok) onClose();
    else setError(adminText('blog.deleteDialog.failed'));
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-blog-post-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-delete-blog-post-title" className="admin-modal__title">
          {adminText('blog.deleteDialog.title')}
        </h2>
        <p className="admin-modal__text">
          {adminText('blog.deleteDialog.bodyPrefix')}{' '}
          <strong>{post.title}</strong>
          {adminText('blog.deleteDialog.bodySuffix')}
        </p>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={deleting}>
            {adminText('common.cancel')}
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleConfirm} disabled={deleting}>
            {deleting ? adminText('common.deleting') : adminText('common.delete')}
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
