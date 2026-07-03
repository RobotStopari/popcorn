import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { subscribeAdminActivityLog } from '../services/admin-activity-log';
import { adminDocumentTitle, adminText } from '../utils/admin-text';
import { formatAdminActivityTimestamp } from '../utils/admin-activity-format';

export default function AdminHistoryPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const [entries, setEntries] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('historyPage.title'));
  }, []);

  useEffect(() => {
    if (!canAccessAdmin) return undefined;

    setListLoading(true);
    const unsubscribe = subscribeAdminActivityLog(
      (items) => {
        setEntries(items);
        setListLoading(false);
      },
      (error) => {
        setListError(error.message || adminText('historyPage.loadFailed'));
        setListLoading(false);
      },
    );

    return unsubscribe;
  }, [canAccessAdmin]);

  const rows = useMemo(
    () => entries.map((entry) => ({
      ...entry,
      whenLabel: formatAdminActivityTimestamp(entry.createdAt),
    })),
    [entries],
  );

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

  return (
    <div className="admin-content container">
      <header className="admin-content__header">
        <h1 className="admin-content__title">{adminText('historyPage.title')}</h1>
        <p className="admin-content__subtitle">{adminText('historyPage.subtitle')}</p>
      </header>

      {listError && <p className="admin-error">{listError}</p>}

      {listLoading ? (
        <p className="admin-loading">{adminText('historyPage.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="admin-empty">{adminText('historyPage.empty')}</p>
      ) : (
        <div className="admin-history">
          <ul className="admin-history__list">
            {rows.map((entry) => (
              <li key={entry.id} className="admin-history__row">
                <time className="admin-history__time" dateTime={entry.whenLabel}>
                  {entry.whenLabel}
                </time>
                <span className="admin-history__user">{entry.actorName}</span>
                <span className="admin-history__summary">{entry.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
