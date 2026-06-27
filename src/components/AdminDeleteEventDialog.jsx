import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

export default function AdminDeleteEventDialog({ open, event, onClose, onConfirm }) {
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

  if (!mounted || !event) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    setError('');
    const ok = await onConfirm(event.id);
    setDeleting(false);
    if (ok) onClose();
    else setError('Smazání akce se nezdařilo.');
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-event-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel">
        <h2 id="admin-delete-event-title" className="admin-modal__title">Smazat akci?</h2>
        <p className="admin-modal__text">
          Opravdu chcete smazat akci <strong>{event.title}</strong>? Tuto akci nelze vrátit zpět.
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
      </div>
    </div>,
    document.body,
  );
}
