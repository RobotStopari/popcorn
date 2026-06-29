import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminAvatar from '../components/AdminAvatar';
import AdminDeleteUserDialog from '../components/AdminDeleteUserDialog';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { formatJoinDate } from '../utils/format-date';
import { adminDocumentTitle, adminText } from '../utils/admin-text';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function getUserSortName(item) {
  return (item.name || item.email || '').trim();
}

function compareUsersByName(a, b) {
  return getUserSortName(a).localeCompare(getUserSortName(b), 'cs', { sensitivity: 'base' });
}

function filterUsersBySearch(users, query) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return users;

  return users.filter((item) => {
    const name = (item.name || '').toLowerCase();
    const nick = (item.nick || '').toLowerCase();
    const email = (item.email || '').toLowerCase();
    return name.includes(trimmed) || nick.includes(trimmed) || email.includes(trimmed);
  });
}

function groupUsersByAdmin(users) {
  const admins = users.filter((item) => item.admin === true).sort(compareUsersByName);
  const nonAdmins = users.filter((item) => item.admin !== true).sort(compareUsersByName);
  return { admins, nonAdmins };
}

function UserRow({
  item,
  currentUserId,
  togglingId,
  onToggleAdmin,
  onDelete,
}) {
  const isSelf = item.id === currentUserId;
  const isAdminUser = item.admin === true;
  const deletable = item.id !== currentUserId && item.admin !== true;

  return (
    <li className="admin-users__row">
      <div className="admin-users__user">
        <AdminAvatar
          photoURL={item.photoURL}
          name={item.name}
          email={item.email}
          size="small"
        />
        <span className="admin-users__name">{item.name || item.email || adminText('common.emptyDash')}</span>
      </div>

      <div className="admin-users__meta">
        <div className="admin-users__nick">{item.nick || adminText('common.emptyDash')}</div>
        <div className="admin-users__date">{formatJoinDate(item.createdAt)}</div>
      </div>

      <div className="admin-users__footer">
        <div className="admin-users__toggle">
          <label className={`admin-toggle${isSelf ? ' admin-toggle--disabled' : ''}`}>
            <input
              type="checkbox"
              checked={isAdminUser}
              disabled={isSelf || togglingId === item.id}
              onChange={() => onToggleAdmin(item.id, isAdminUser)}
            />
            <span className="admin-toggle__track" aria-hidden="true">
              <span className="admin-toggle__thumb" />
            </span>
            <span className="admin-toggle__label">
              {isSelf ? adminText('common.self') : isAdminUser ? adminText('common.yes') : adminText('common.no')}
            </span>
          </label>
        </div>

        <div className="admin-users__actions">
          {deletable ? (
            <button
              type="button"
              className="admin-users__delete"
              aria-label={adminText('users.list.deleteAria', { name: item.name || item.email })}
              onClick={() => onDelete(item)}
            >
              <TrashIcon />
            </button>
          ) : (
            <span className="admin-users__no-action" aria-hidden="true">—</span>
          )}
        </div>
      </div>
    </li>
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
  const [search, setSearch] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('users.list.title'));
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

  const filteredUsers = useMemo(
    () => filterUsersBySearch(users, search),
    [users, search],
  );

  const { admins, nonAdmins } = useMemo(
    () => groupUsersByAdmin(filteredUsers),
    [filteredUsers],
  );

  const showAdminDivider = admins.length > 0 && nonAdmins.length > 0;

  if (loading) {
    return (
      <div className="admin-content">
        <p className="admin-loading">{adminText('common.loading')}</p>
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

  return (
    <div className="admin-content container">
      <header className="admin-content__header">
        <h1 className="admin-content__title">{adminText('users.list.title')}</h1>
        <p className="admin-content__subtitle">{adminText('users.list.subtitle')}</p>
      </header>

      {error && <p className="admin-error admin-content__error">{error}</p>}

      {!listLoading && (
        <div className="admin-users__toolbar">
          <input
            type="search"
            className="admin-form__input admin-users__search"
            placeholder={adminText('users.list.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}

      {listLoading ? (
        <p className="admin-loading">{adminText('users.list.loading')}</p>
      ) : (
        <div className="admin-users">
          <div className="admin-users__head" aria-hidden="true">
            <span>{adminText('users.list.columns.user')}</span>
            <span>{adminText('users.list.columns.nick')}</span>
            <span>{adminText('users.list.columns.joined')}</span>
            <span>{adminText('users.list.columns.admin')}</span>
            <span>{adminText('common.columns.actions')}</span>
          </div>

          <ul className="admin-users__list">
            {admins.map((item) => (
              <UserRow
                key={item.id}
                item={item}
                currentUserId={user.uid}
                togglingId={togglingId}
                onToggleAdmin={handleToggleAdmin}
                onDelete={setUserToDelete}
              />
            ))}

            {showAdminDivider && (
              <li className="admin-users__divider" aria-hidden="true" />
            )}

            {nonAdmins.map((item) => (
              <UserRow
                key={item.id}
                item={item}
                currentUserId={user.uid}
                togglingId={togglingId}
                onToggleAdmin={handleToggleAdmin}
                onDelete={setUserToDelete}
              />
            ))}
          </ul>

          {!admins.length && !nonAdmins.length && (
            <p className="admin-users__empty">
              {search.trim() ? adminText('users.list.emptySearch') : adminText('users.list.empty')}
            </p>
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
