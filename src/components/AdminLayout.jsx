import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { AdminShellProvider } from '../contexts/AdminShellContext';
import { migrateSiteColorPaleDefaults } from '../services/site-colors';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  const { canAccessAdmin } = useAdminAuth();

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    migrateSiteColorPaleDefaults().catch(() => {});

    return undefined;
  }, [canAccessAdmin]);

  return (
    <AdminShellProvider>
      <AdminNavbar />
      <div className="admin-shell">
        <AdminSidebar />
        <main className="page-main admin-page-main">
          <Outlet />
        </main>
      </div>
    </AdminShellProvider>
  );
}
