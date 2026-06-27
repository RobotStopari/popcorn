import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

export default function AdminDeleteMenuDialog({
  open,
  item,
  onClose,
  onConfirm,
}) {
  const [deleting, setDeleting] = useState(false);
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  if (!mounted || !item) return null;

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm(item.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-delete-menu-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel admin-modal__panel--compact">
        <h2 id="admin-delete-menu-title" className="admin-modal__title">Smazat položku?</h2>
        <p className="admin-modal__text">
          Opravdu chcete smazat „{item.label}“ z menu?
        </p>

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose} disabled={deleting}>
            Zrušit
          </button>
          <button type="button" className="btn btn--primary" onClick={handleConfirm} disabled={deleting}>
            {deleting ? 'Mažu…' : 'Smazat'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
