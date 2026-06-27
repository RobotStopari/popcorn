import { useEffect, useMemo, useRef, useState } from 'react';
import { formatAuthorDisplayName } from '../utils/blog-post-format';
import AdminAvatar from './AdminAvatar';

function userDisplayName(user) {
  return formatAuthorDisplayName({
    name: user.name,
    nick: user.nick,
    label: user.displayName || user.email || 'Uživatel',
  });
}

export default function UserCombobox({
  id,
  users,
  value,
  onChange,
  required = false,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedUser = users.find((user) => (user.id || user.uid) === value);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...users].sort((a, b) => userDisplayName(a).localeCompare(userDisplayName(b), 'cs'));

    if (!q) return sorted;

    return sorted.filter((user) => {
      const hay = `${userDisplayName(user)} ${user.email || ''} ${user.nick || ''} ${user.name || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  const displayValue = open
    ? query
    : (selectedUser ? userDisplayName(selectedUser) : '');

  const handleActivate = () => {
    if (disabled) return;
    if (!open) setQuery('');
    setOpen(true);
  };

  return (
    <div
      ref={rootRef}
      className={`admin-combobox${open ? ' admin-combobox--open' : ''}`}
    >
      <div className="admin-combobox__control">
        {selectedUser && !open && (
          <AdminAvatar
            photoURL={selectedUser.photoURL}
            name={selectedUser.name}
            email={selectedUser.email}
            size="small"
            className="admin-combobox__avatar"
          />
        )}
        <input
          id={id}
          type="text"
          className={`admin-form__input admin-combobox__input${selectedUser && !open ? ' admin-combobox__input--with-avatar' : ''}`}
          value={displayValue}
          placeholder="Hledat uživatele…"
          readOnly={!open}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={handleActivate}
          onClick={handleActivate}
          required={required && !value}
          disabled={disabled}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-listbox`}
        />
      </div>

      {open && (
        <ul
          id={`${id}-listbox`}
          className="admin-combobox__list"
          role="listbox"
        >
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => {
              const uid = user.id || user.uid;
              return (
                <li key={uid} role="option" aria-selected={uid === value}>
                  <button
                    type="button"
                    className={`admin-combobox__option${uid === value ? ' admin-combobox__option--active' : ''}`}
                    onClick={() => {
                      onChange(uid);
                      setQuery('');
                      setOpen(false);
                    }}
                  >
                    <AdminAvatar
                      photoURL={user.photoURL}
                      name={user.name}
                      email={user.email}
                      size="small"
                      className="admin-combobox__option-avatar"
                    />
                    <span className="admin-combobox__option-copy">
                      <span className="admin-combobox__option-title">{userDisplayName(user)}</span>
                      {user.email && (
                        <span className="admin-combobox__option-path">{user.email}</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })
          ) : (
            <li className="admin-combobox__empty">Žádný uživatel neodpovídá hledání.</li>
          )}
        </ul>
      )}
    </div>
  );
}
