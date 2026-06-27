import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminAvatar from '../components/AdminAvatar';
import { useAdminAuth } from '../contexts/AdminAuthContext';

export default function AdminPage() {
  const {
    user,
    profile,
    loading,
    error,
    photoURL,
    isAdmin,
    profileComplete,
    canAccessAdmin,
    signInWithGoogle,
    signOutUser,
    saveProfile,
  } = useAdminAuth();

  const [name, setName] = useState('');
  const [nick, setNick] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = 'Admin — Komunita Popcorn';
  }, []);

  useEffect(() => {
    setName(profile?.name || '');
    setNick(profile?.nick || '');
  }, [profile]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    await saveProfile({ name, nick });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-page container">
        <div className="admin-card">
          <p className="admin-loading">Načítání…</p>
        </div>
      </div>
    );
  }

  if (canAccessAdmin) {
    return <Navigate to="/admin/users" replace />;
  }

  if (!user) {
    return (
      <div className="admin-page container">
        <div className="admin-card">
          <h1 className="admin-card__title">Admin</h1>
          <p className="admin-card__subtitle">Přihlaste se pomocí Google účtu</p>
          <div className="admin-card__actions">
            <button type="button" className="btn btn--primary btn--large" onClick={signInWithGoogle}>
              Přihlásit se přes Google
            </button>
          </div>
          {error && <p className="admin-error">{error}</p>}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-page container">
        <div className="admin-card">
          <h1 className="admin-card__title">Přístup odepřen</h1>
          <p className="admin-card__subtitle">
            Nemáte oprávnění pro přístup do administrace. Kontaktujte správce webu.
          </p>
          <div className="admin-card__actions">
            <button type="button" className="btn btn--outline" onClick={signOutUser}>
              Odhlásit se
            </button>
          </div>
          {error && <p className="admin-error">{error}</p>}
        </div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="admin-page container">
        <div className="admin-card">
          <AdminAvatar photoURL={photoURL} name={name} email={user.email} />
          <h1 className="admin-card__title">Dokončete profil</h1>
          <p className="admin-card__subtitle">{user.email}</p>

          <form id="admin-profile-form" className="admin-form" onSubmit={handleProfileSubmit}>
            <label className="admin-form__label" htmlFor="admin-name">
              Jméno
            </label>
            <input
              id="admin-name"
              className="admin-form__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />

            <label className="admin-form__label" htmlFor="admin-nick">
              Přezdívka
            </label>
            <input
              id="admin-nick"
              className="admin-form__input"
              type="text"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              autoComplete="nickname"
            />
            <p className="admin-form__hint">Přezdívka je dobrovolná.</p>
          </form>

          {error && <p className="admin-error">{error}</p>}

          <div className="admin-card__actions">
            <button
              type="submit"
              form="admin-profile-form"
              className="btn btn--primary"
              disabled={saving || !name.trim()}
            >
              {saving ? 'Ukládám…' : 'Pokračovat'}
            </button>
            <button type="button" className="btn btn--outline" onClick={signOutUser}>
              Odhlásit se
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Navigate to="/admin/users" replace />;
}
