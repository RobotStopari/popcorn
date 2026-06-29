import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

export default function AdminDeleteUserDialog({ open, user, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape' && !deleting) onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, deleting, onClose]);

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  if (!mounted || !user) return null;

  const displayName = user.name || user.email || adminText('users.deleteDialog.fallbackName');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    const ok = await onConfirm(user.id);
    setDeleting(false);

    if (ok) {
      onClose();
    } else {
      setError(adminText('users.deleteDialog.failed'));
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-user-title"
    >
      <div className="admin-modal__backdrop" onClick={deleting ? undefined : onClose} aria-hidden="true" />
      <AdminModalPanel className="admin-modal__panel--compact">
        <h2 id="admin-delete-user-title" className="admin-modal__title">
          {adminText('users.deleteDialog.title')}
        </h2>
        <p className="admin-modal__text">
          {adminText('users.deleteDialog.bodyPrefix')}{' '}
          <strong>{displayName}</strong>
          {adminText('users.deleteDialog.bodySuffix')}
        </p>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={deleting}>
            {adminText('common.cancel')}
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleDelete} disabled={deleting}>
            {deleting ? adminText('common.deleting') : adminText('users.deleteDialog.confirm')}
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
