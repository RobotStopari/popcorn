import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useBlogCompleteProfile } from '../hooks/useBlogCompleteProfile';
import AdminAvatar from './AdminAvatar';
import AdminEditProfileModal from './AdminEditProfileModal';
import BlogCompleteProfileModal from './BlogCompleteProfileModal';

export default function BlogProfileMenu() {
  const {
    user,
    profile,
    loading,
    profileComplete,
    profileLabel,
    photoURL,
    signInWithGoogle,
    signOutUser,
  } = useAdminAuth();

  const {
    openCompleteProfile,
    showCompleteProfileModal,
    closeCompleteProfile,
  } = useBlogCompleteProfile();

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const menuRef = useRef(null);
  const { mounted: menuMounted, visible: menuVisible } = useAnimatedPresence(menuOpen, 200);

  useEffect(() => {
    const onDocClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    await signInWithGoogle();
    setSigningIn(false);
  };

  if (loading) {
    return <span className="blog-page-toolbar__loading" aria-hidden="true">…</span>;
  }

  if (!user) {
    return (
      <button
        type="button"
        className="btn btn--outline blog-page-toolbar__login"
        onClick={handleSignIn}
        disabled={signingIn}
      >
        {signingIn ? 'Přihlašuji…' : 'Přihlásit se'}
      </button>
    );
  }

  const triggerLabel = profileComplete ? profileLabel : 'Dokončit profil';

  return (
    <>
      <div className="admin-profile-menu blog-page-toolbar__profile" ref={menuRef}>
        <button
          type="button"
          className="admin-profile-menu__trigger"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          aria-label={`Profil: ${triggerLabel}`}
          onClick={(event) => {
            event.stopPropagation();
            if (!profileComplete) {
              openCompleteProfile();
              return;
            }
            setMenuOpen((open) => !open);
          }}
        >
          <AdminAvatar
            photoURL={photoURL}
            name={profile?.name}
            email={user.email}
            className="admin-profile-menu__avatar"
            size="small"
          />
          <span className="admin-profile-menu__label">{triggerLabel}</span>
        </button>

        {profileComplete && menuMounted && (
          <ul
            className={`admin-profile-menu__dropdown${menuVisible ? ' admin-profile-menu__dropdown--visible' : ''}`}
            role="menu"
          >
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="admin-profile-menu__item"
                onClick={() => {
                  closeMenu();
                  setEditOpen(true);
                }}
              >
                Upravit profil
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="admin-profile-menu__item"
                onClick={() => {
                  closeMenu();
                  signOutUser();
                }}
              >
                Odhlásit se
              </button>
            </li>
          </ul>
        )}
      </div>

      <BlogCompleteProfileModal
        open={showCompleteProfileModal}
        onClose={closeCompleteProfile}
      />

      <AdminEditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        allowDelete={false}
      />
    </>
  );
}
