import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminAvatar from '../components/AdminAvatar';
import AdminDeleteUserDialog from '../components/AdminDeleteUserDialog';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { formatJoinDate } from '../utils/format-date';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

export default function AdminUsersPage() {
  const {
    user,
    canAccessAdmin,
    loading,
    fetchAllUsers,
    setUserAdmin,
    deleteUser,
    error,
  } = useAdminAuth();

  const [users, setUsers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    document.title = 'Uživatelé — Admin';
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    let active = true;

    const loadUsers = async () => {
      setListLoading(true);
      try {
        const data = await fetchAllUsers();
        if (active) setUsers(data);
      } finally {
        if (active) setListLoading(false);
      }
    };

    loadUsers();

    return () => {
      active = false;
    };
  }, [canAccessAdmin, fetchAllUsers]);

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">Načítání…</p>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleToggleAdmin = async (userId, currentAdmin) => {
    if (userId === user.uid) return;

    setTogglingId(userId);
    const ok = await setUserAdmin(userId, !currentAdmin);

    if (ok) {
      setUsers((prev) => prev.map((item) => (
        item.id === userId ? { ...item, admin: !currentAdmin } : item
      )));
    }

    setTogglingId(null);
  };

  const handleConfirmDelete = async (userId) => {
    const ok = await deleteUser(userId);

    if (ok) {
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    }

    return ok;
  };

  const canDeleteUser = (item) => item.id !== user.uid && item.admin !== true;

  return (
    <div className="admin-content container">
      <header className="admin-content__header">
        <h1 className="admin-content__title">Uživatelé</h1>
        <p className="admin-content__subtitle">Seznam všech uživatelů v aplikaci</p>
      </header>

      {error && <p className="admin-error admin-content__error">{error}</p>}

      {listLoading ? (
        <p className="admin-loading">Načítám uživatele…</p>
      ) : (
        <div className="admin-users">
          <div className="admin-users__head" aria-hidden="true">
            <span>Uživatel</span>
            <span>Přezdívka</span>
            <span>Datum připojení</span>
            <span>Admin</span>
            <span>Akce</span>
          </div>

          <ul className="admin-users__list">
            {users.map((item) => {
              const isSelf = item.id === user.uid;
              const isAdminUser = item.admin === true;
              const deletable = canDeleteUser(item);

              return (
                <li key={item.id} className="admin-users__row">
                  <div className="admin-users__user">
                    <AdminAvatar
                      photoURL={item.photoURL}
                      name={item.name}
                      email={item.email}
                      size="small"
                    />
                    <span className="admin-users__name">{item.name || item.email || '—'}</span>
                  </div>

                  <div className="admin-users__nick">{item.nick || '—'}</div>
                  <div className="admin-users__date">{formatJoinDate(item.createdAt)}</div>

                  <div className="admin-users__toggle">
                    <label className={`admin-toggle${isSelf ? ' admin-toggle--disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isAdminUser}
                        disabled={isSelf || togglingId === item.id}
                        onChange={() => handleToggleAdmin(item.id, isAdminUser)}
                      />
                      <span className="admin-toggle__track" aria-hidden="true">
                        <span className="admin-toggle__thumb" />
                      </span>
                      <span className="admin-toggle__label">
                        {isSelf ? 'Vy' : isAdminUser ? 'Ano' : 'Ne'}
                      </span>
                    </label>
                  </div>

                  <div className="admin-users__actions">
                    {deletable ? (
                      <button
                        type="button"
                        className="admin-users__delete"
                        aria-label={`Smazat uživatele ${item.name || item.email}`}
                        onClick={() => setUserToDelete(item)}
                      >
                        <TrashIcon />
                      </button>
                    ) : (
                      <span className="admin-users__no-action" aria-hidden="true">—</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {!users.length && (
            <p className="admin-loading">Zatím žádní uživatelé.</p>
          )}
        </div>
      )}

      <AdminDeleteUserDialog
        open={Boolean(userToDelete)}
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
