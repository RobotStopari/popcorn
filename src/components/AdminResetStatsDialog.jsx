import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminModalPanel from './AdminModalPanel';

export default function AdminResetStatsDialog({ open, onClose, onConfirm }) {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 200);

  useEffect(() => {
    if (!open) {
      setError('');
      setResetting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (keyEvent) => {
      if (keyEvent.key === 'Escape' && !resetting) onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose, resetting]);

  if (!mounted) return null;

  const handleConfirm = async () => {
    setResetting(true);
    setError('');

    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.message || adminText('statistikyPage.reset.failed'));
    } finally {
      setResetting(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-reset-stats-title"
    >
      <div className="admin-modal__backdrop" onClick={resetting ? undefined : onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-reset-stats-title" className="admin-modal__title">
          {adminText('statistikyPage.reset.title')}
        </h2>
        <p className="admin-modal__text">
          {adminText('statistikyPage.reset.body')}
        </p>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={resetting}>
            {adminText('common.cancel')}
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleConfirm} disabled={resetting}>
            {resetting ? adminText('statistikyPage.reset.resetting') : adminText('statistikyPage.reset.confirm')}
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
