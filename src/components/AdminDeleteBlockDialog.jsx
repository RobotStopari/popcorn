import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PAGE_BLOCK_LABELS } from '../data/page-blocks';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import AdminModalPanel from './AdminModalPanel';

export default function AdminDeleteBlockDialog({
  open,
  block,
  summary,
  hasContent = false,
  onClose,
  onConfirm,
}) {
  const { mounted, visible } = useAnimatedPresence(open, 200);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [mounted, onClose]);

  if (!mounted || !block) return null;

  const label = PAGE_BLOCK_LABELS[block.type] || block.type;
  const trimmedSummary = summary?.trim() || '';

  return createPortal(
    <div
      className={`admin-modal admin-page-block-delete-modal${visible ? ' admin-modal--visible' : ''}`}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-delete-block-title"
      aria-describedby="admin-delete-block-text"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <AdminModalPanel>
        <h2 id="admin-delete-block-title" className="admin-modal__title">
          Odstranit prvek?
        </h2>
        <p id="admin-delete-block-text" className="admin-modal__text">
          {hasContent ? (
            <>
              Prvek <strong>{label}</strong>
              {trimmedSummary ? (
                <>
                  {' '}
                  (
                  {trimmedSummary.length > 80 ? `${trimmedSummary.slice(0, 80)}…` : trimmedSummary}
                  )
                </>
              ) : null}
              {' '}
              obsahuje data. Opravdu ho chcete odstranit?
            </>
          ) : (
            <>
              Opravdu chcete odstranit prvek <strong>{label}</strong>?
            </>
          )}
        </p>

        <div className="admin-modal__actions">
          <button type="button" className="btn btn--outline" onClick={onClose}>
            Zrušit
          </button>
          <button type="button" className="btn btn--secondary" onClick={onConfirm}>
            Odstranit
          </button>
        </div>
      </AdminModalPanel>
    </div>,
    document.body,
  );
}
