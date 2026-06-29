import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

export default function AdminDeleteNotificationDialog({ open, notification, onClose, onConfirm }) {
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

  if (!mounted || !notification) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    const ok = await onConfirm(notification.id);
    setDeleting(false);
    if (ok) onClose();
    else setError(adminText('notifications.deleteDialog.failed'));
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-notification-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-delete-notification-title" className="admin-modal__title">
          {adminText('notifications.deleteDialog.title')}
        </h2>
        <p className="admin-modal__text">
          {adminText('notifications.deleteDialog.body', { title: notification.title })}
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
