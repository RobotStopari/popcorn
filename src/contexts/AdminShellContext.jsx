import { createContext, useContext, useMemo, useState } from 'react';

const AdminShellContext = createContext(null);

export function AdminShellProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value = useMemo(() => ({
    sidebarOpen,
    setSidebarOpen,
    closeSidebar: () => setSidebarOpen(false),
    toggleSidebar: () => setSidebarOpen((open) => !open),
  }), [sidebarOpen]);

  return (
    <AdminShellContext.Provider value={value}>
      {children}
    </AdminShellContext.Provider>
  );
}

export function useAdminShell() {
  const context = useContext(AdminShellContext);
  if (!context) {
    throw new Error('useAdminShell must be used within AdminShellProvider');
  }
  return context;
}
