import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import AdminAvatar from './AdminAvatar';

export default function BlogCompleteProfileModal({ open, onClose }) {
  const {
    user,
    profile,
    photoURL,
    saveProfile,
    signOutUser,
    error: authError,
  } = useAdminAuth();
  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { mounted, visible } = useAnimatedPresence(open, 240);

  useEffect(() => {
    if (!open) return;
    setName(profile?.name || '');
    setNick(profile?.nick || '');
    setError('');
  }, [open, profile]);

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

  if (!mounted || !user) return null;

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

  return createPortal(
    <div
      className={`admin-modal${visible ? ' admin-modal--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-complete-profile-title"
    >
      <div className="admin-modal__backdrop" onClick={onClose} aria-hidden="true" />
      <div className="admin-modal__panel">
        <AdminAvatar photoURL={photoURL} name={name} email={user.email} />
        <h2 id="blog-complete-profile-title" className="admin-modal__title">Dokončete profil</h2>
        <p className="admin-modal__text">
          Než začnete psát na blog, vyplňte své jméno. Přezdívka je dobrovolná.
        </p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-form__label" htmlFor="blog-profile-name">
            Jméno
          </label>
          <input
            id="blog-profile-name"
            className="admin-form__input"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            autoComplete="name"
          />

          <label className="admin-form__label" htmlFor="blog-profile-nick">
            Přezdívka
          </label>
          <input
            id="blog-profile-nick"
            className="admin-form__input"
            type="text"
            value={nick}
            onChange={(event) => setNick(event.target.value)}
            autoComplete="nickname"
          />
          <p className="admin-form__hint">Přezdívka je dobrovolná.</p>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-modal__actions">
            <button type="button" className="btn btn--outline" onClick={signOutUser}>
              Odhlásit se
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving || !name.trim()}>
              {saving ? 'Ukládám…' : 'Pokračovat'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
