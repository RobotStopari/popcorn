import { Outlet } from 'react-router-dom';
import { AdminShellProvider } from '../contexts/AdminShellContext';
import AdminNavbar from './AdminNavbar';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
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
