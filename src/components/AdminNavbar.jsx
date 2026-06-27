import { useEffect, useRef, useState } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminShell } from '../contexts/AdminShellContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import AdminAvatar from './AdminAvatar';
import AdminBrand from './AdminBrand';
import AdminEditProfileModal from './AdminEditProfileModal';

export default function AdminNavbar() {
  const {
    user,
    profile,
    canAccessAdmin,
    profileLabel,
    photoURL,
    signOutUser,
  } = useAdminAuth();

  const { toggleSidebar } = useAdminShell();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef(null);
  const { mounted: menuMounted, visible: menuVisible } = useAnimatedPresence(menuOpen, 200);

  useEffect(() => {
    const navbar = document.getElementById('adminNavbar');
    const onScroll = () => {
      navbar?.classList.toggle('navbar--scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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

  return (
    <>
      <header className={`navbar admin-navbar${canAccessAdmin ? ' admin-navbar--compact' : ''}`} id="adminNavbar">
        <div className="admin-navbar__main container">
          {canAccessAdmin && (
            <button
              type="button"
              className="admin-navbar__menu-btn"
              aria-label="Otevřít menu administrace"
              onClick={toggleSidebar}
            >
              <span className="admin-navbar__menu-icon" aria-hidden="true">
                <span /><span /><span />
              </span>
            </button>
          )}

          <AdminBrand />

          {canAccessAdmin && (
            <div className="admin-profile-menu" ref={menuRef}>
              <button
                type="button"
                className="admin-profile-menu__trigger"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={`Profil: ${profileLabel}`}
                onClick={(e) => {
                  e.stopPropagation();
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
                <span className="admin-profile-menu__label">{profileLabel}</span>
              </button>

              {menuMounted && (
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
          )}
        </div>
      </header>

      <AdminEditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
