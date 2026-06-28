import { NavLink } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminShell } from '../contexts/AdminShellContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import AdminBrand from './AdminBrand';

const NAV_GROUPS = [
  [{ to: '/admin/users', label: 'Uživatelé' }],
  [
    { to: '/admin/events', label: 'Akce' },
    { to: '/admin/blog', label: 'Blog' },
  ],
  [
    { to: '/admin/pages', label: 'Stránky' },
    { to: '/admin/menu', label: 'Menu' },
    { to: '/admin/texts', label: 'Texty' },
  ],
  [{ to: '/admin/colors', label: 'Barvy' }],
];

export default function AdminSidebar() {
  const { canAccessAdmin } = useAdminAuth();
  const { sidebarOpen, closeSidebar } = useAdminShell();
  const { mounted, visible } = useAnimatedPresence(sidebarOpen, 240);

  if (!canAccessAdmin) return null;

  return (
    <>
      {mounted && (
        <button
          type="button"
          className={`admin-sidebar__backdrop${visible ? ' admin-sidebar__backdrop--visible' : ''}`}
          aria-label="Zavřít menu"
          onClick={closeSidebar}
        />
      )}

      <aside className={`admin-sidebar${sidebarOpen ? ' admin-sidebar--open' : ''}`}>
        <AdminBrand className="admin-sidebar__brand" onClick={closeSidebar} />
        <nav className="admin-sidebar__nav" aria-label="Administrace">
          <p className="admin-sidebar__heading">Administrace</p>
          <ul className="admin-sidebar__list">
            {NAV_GROUPS.flatMap((group, groupIndex) => {
              const items = group.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`}
                    onClick={closeSidebar}
                  >
                    {item.label}
                  </NavLink>
                </li>
              ));

              if (groupIndex === 0) return items;

              return [
                <li key={`divider-${groupIndex}`} className="admin-sidebar__divider" aria-hidden="true" />,
                ...items,
              ];
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
