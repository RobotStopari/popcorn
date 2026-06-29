import { NavLink } from 'react-router-dom';
import { ADMIN_NAV_GROUPS } from '../data/admin-texts';
import { ADMIN_SIDEBAR_ICONS } from '../data/admin-sidebar-icons';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useAdminShell } from '../contexts/AdminShellContext';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { adminText } from '../utils/admin-text';
import AdminBrand from './AdminBrand';

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
          aria-label={adminText('shell.sidebar.closeMenu')}
          onClick={closeSidebar}
        />
      )}

      <aside className={`admin-sidebar${sidebarOpen ? ' admin-sidebar--open' : ''}`}>
        <AdminBrand className="admin-sidebar__brand" onClick={closeSidebar} />
        <nav className="admin-sidebar__nav" aria-label={adminText('shell.sidebar.navAria')}>
          <p className="admin-sidebar__heading">{adminText('shell.sidebar.heading')}</p>
          <ul className="admin-sidebar__list">
            {ADMIN_NAV_GROUPS.flatMap((group, groupIndex) => {
              const items = group.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) => `admin-sidebar__link${isActive ? ' admin-sidebar__link--active' : ''}`}
                    onClick={closeSidebar}
                  >
                    <span
                      className="admin-sidebar__icon"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: ADMIN_SIDEBAR_ICONS[item.itemKey] || '' }}
                    />
                    <span className="admin-sidebar__label">
                      {adminText(`shell.sidebar.items.${item.itemKey}`)}
                    </span>
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
