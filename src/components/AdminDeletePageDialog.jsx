import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { pagePath } from '../data/pages';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import AdminModalPanel from './AdminModalPanel';

export default function AdminDeletePageDialog({ open, page, onClose, onConfirm }) {
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

  if (!mounted || !page) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');

    try {
      await onConfirm(page.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Smazání stránky se nezdařilo.');
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-page-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-delete-page-title" className="admin-modal__title">Smazat stránku?</h2>
        <p className="admin-modal__text">
          Opravdu chcete smazat stránku <strong>{page.title}</strong>
          {' '}({pagePath(page)})? Tuto akci nelze vrátit zpět.
        </p>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={deleting}>
            Zrušit
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Mažu…' : 'Smazat'}
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
