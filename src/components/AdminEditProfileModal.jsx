import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';

export default function AdminEditProfileModal({ open, onClose, allowDelete = true }) {
  const { profile, saveProfile, deleteProfile, error: authError } = useAdminAuth();
  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name || '');
    setNick(profile?.nick || '');
    setError('');
    setConfirmDelete(false);
  }, [open, profile]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        if (confirmDelete) setConfirmDelete(false);
        else onClose();
      }
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, confirmDelete, onClose]);

  if (!mounted) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError('');
    const ok = await saveProfile({ name, nick });
    setSaving(false);

    if (ok) onClose();
    else setError(authError || 'Uložení profilu se nezdařilo.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    const ok = await deleteProfile();
    setDeleting(false);

    if (ok) {
      onClose();
    } else {
      setError('Smazání profilu se nezdařilo.');
    }
  };

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-edit-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel">
        {confirmDelete ? (
          <>
            <h2 id="admin-edit-title" className="admin-modal__title">Smazat profil?</h2>
            <p className="admin-modal__text">
              Opravdu chcete smazat svůj profil? Tuto akci nelze vrátit zpět.
            </p>

            {error && <p className="admin-error">{error}</p>}

            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Zrušit
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Mažu…' : 'Smazat profil'}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="admin-edit-title" className="admin-modal__title">Upravit profil</h2>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label className="admin-form__label" htmlFor="admin-edit-name">
                Jméno
              </label>
              <input
                id="admin-edit-name"
                className="admin-form__input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />

              <label className="admin-form__label" htmlFor="admin-edit-nick">
                Přezdívka
              </label>
              <input
                id="admin-edit-nick"
                className="admin-form__input"
                type="text"
                value={nick}
                onChange={(e) => setNick(e.target.value)}
                autoComplete="nickname"
              />
              <p className="admin-form__hint">Přezdívka je dobrovolná.</p>

              {error && <p className="admin-error">{error}</p>}

              <div className="admin-modal__actions">
                <button type="button" className="btn btn--outline" onClick={onClose}>
                  Zrušit
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving || !name.trim()}>
                  {saving ? 'Ukládám…' : 'Uložit'}
                </button>
              </div>
            </form>

            {allowDelete && (
              <div className="admin-modal__danger-zone">
                <button
                  type="button"
                  className="admin-modal__danger-btn"
                  onClick={() => {
                    setError('');
                    setConfirmDelete(true);
                  }}
                >
                  Smazat profil
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
