import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AdminDeleteNotificationDialog from '../components/AdminDeleteNotificationDialog';
import AdminNotificationFormModal from '../components/AdminNotificationFormModal';
import NotificationIcon from '../components/NotificationIcon';
import { NOTIFICATION_COLORS } from '../data/notifications';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import {
  createNotification,
  deleteNotification,
  fetchNotificationById,
  setNotificationManualActive,
  updateNotification,
} from '../services/notifications';
import {
  formatNotificationScheduleLabel,
  getNotificationStatus,
  notificationMatchesSearch,
  partitionAdminNotificationList,
  sortNotificationsByStart,
} from '../utils/notification-format';
import { adminDocumentTitle, adminText } from '../utils/admin-text';

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

const FILTERS = [
  { id: 'all', labelKey: 'all' },
  { id: 'active', labelKey: 'active' },
  { id: 'upcoming', labelKey: 'upcoming' },
  { id: 'past', labelKey: 'past' },
];

function getColorMeta(colorId) {
  return NOTIFICATION_COLORS.find((item) => item.id === colorId) || NOTIFICATION_COLORS[0];
}

export default function AdminNotificationsPage() {
  const { canAccessAdmin, loading } = useAdminAuth();
  const { notifications, loading: notificationsLoading, error: notificationsError } = useNotifications();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortDescending, setSortDescending] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    document.title = adminDocumentTitle(adminText('notifications.list.title'));
  }, []);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    let list = notifications.filter((item) => notificationMatchesSearch(item, query));

    if (statusFilter === 'active') {
      return sortNotificationsByStart(
        list.filter((item) => getNotificationStatus(item) === 'active'),
        sortDescending,
      );
    }

    if (statusFilter === 'upcoming') {
      return sortNotificationsByStart(
        list.filter((item) => getNotificationStatus(item) === 'upcoming'),
        sortDescending,
      );
    }

    if (statusFilter === 'past') {
      return sortNotificationsByStart(
        list.filter((item) => getNotificationStatus(item) === 'past'),
        sortDescending,
      );
    }

    const { active, upcoming, past } = partitionAdminNotificationList(list, sortDescending);
    const hasFutureSection = active.length > 0 || upcoming.length > 0;
    return {
      active,
      upcoming,
      past,
      showPastDivider: hasFutureSection && past.length > 0,
    };
  }, [notifications, search, statusFilter, sortDescending]);

  const flatNotifications = Array.isArray(filteredNotifications)
    ? filteredNotifications
    : [
      ...filteredNotifications.active,
      ...filteredNotifications.upcoming,
      ...filteredNotifications.past,
    ];
  const showPastDivider = !Array.isArray(filteredNotifications) && filteredNotifications.showPastDivider;
  const pastSectionStartId = !Array.isArray(filteredNotifications)
    ? filteredNotifications.past[0]?.id
    : null;

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

  const handleCreate = () => {
    setEditingNotification(null);
    setFormOpen(true);
  };

  const handleEdit = async (notification) => {
    try {
      const fresh = await fetchNotificationById(notification.id);
      setEditingNotification(fresh || notification);
    } catch {
      setEditingNotification(notification);
    }
    setFormOpen(true);
  };

  const handleSave = async (payload) => {
    setSaveError('');
    try {
      if (editingNotification?.id) {
        await updateNotification(editingNotification.id, payload);
      } else {
        await createNotification(payload);
      }
      return true;
    } catch (err) {
      setSaveError(err.message || adminText('notifications.list.saveFailed'));
      return false;
    }
  };

  const handleToggleManual = async (notification) => {
    try {
      await setNotificationManualActive(notification.id, !notification.manualActive);
    } catch (err) {
      setSaveError(err.message || adminText('notifications.list.saveFailed'));
    }
  };

  const handleConfirmDelete = async (notificationId) => {
    try {
      await deleteNotification(notificationId);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="admin-content container">
      <header className="admin-content__header admin-content__header--actions">
        <div>
          <h1 className="admin-content__title">{adminText('notifications.list.title')}</h1>
          <p className="admin-content__subtitle">{adminText('notifications.list.subtitle')}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={handleCreate}>
          {adminText('notifications.list.newNotification')}
        </button>
      </header>

      <div className="admin-events__toolbar">
        <div className="admin-events__toolbar-row admin-events__toolbar-row--filters">
          <div className="admin-events__filters" role="group" aria-label={adminText('notifications.list.filters.aria')}>
            {FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={`admin-events__filter${statusFilter === filter.id ? ' admin-events__filter--active' : ''}`}
                aria-pressed={statusFilter === filter.id}
                onClick={() => setStatusFilter(filter.id)}
              >
                {adminText(`notifications.list.filters.${filter.labelKey}`)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => setSortDescending((value) => !value)}
          >
            {sortDescending ? adminText('notifications.list.sortReversed') : adminText('notifications.list.sortNearest')}
          </button>
        </div>
        <div className="admin-events__toolbar-row">
          <input
            type="search"
            className="admin-form__input admin-events__search"
            placeholder={adminText('notifications.list.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {(notificationsError || saveError) && (
        <p className="admin-error admin-content__error">{notificationsError || saveError}</p>
      )}

      {notificationsLoading ? (
        <p className="admin-loading">{adminText('notifications.list.loading')}</p>
      ) : (
        <div className="admin-events admin-notifications">
          <div className="admin-events__head" aria-hidden="true">
            <span>{adminText('common.columns.name')}</span>
            <span>{adminText('notifications.list.columns.schedule')}</span>
            <span>{adminText('notifications.list.columns.status')}</span>
            <span>{adminText('common.columns.actions')}</span>
          </div>

          <ul className={`admin-events__list${showPastDivider ? ' admin-events__list--with-past-divider' : ''}`}>
            {flatNotifications.map((notification) => {
              const status = getNotificationStatus(notification);
              const colorMeta = getColorMeta(notification.color);
              const isPastSectionStart = showPastDivider && notification.id === pastSectionStartId;

              return (
                <li
                  key={notification.id}
                  className={[
                    'admin-events__row',
                    isPastSectionStart ? 'admin-events__row--past-divider' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <div
                    className="admin-events__title admin-notifications__title"
                    style={{ '--notification-color': `var(--${colorMeta.token})` }}
                  >
                    <NotificationIcon icon={notification.icon} className="admin-notifications__icon" />
                    <span className="admin-events__title-text">{notification.title}</span>
                  </div>
                  <div className="admin-events__meta">
                    <div className="admin-events__date">{formatNotificationScheduleLabel(notification)}</div>
                    <div className="admin-events__status">
                      <span className={`admin-events__badge admin-notifications__badge--${status}`}>
                        {adminText(`notifications.list.badges.${status}`)}
                      </span>
                      {notification.scheduleMode === 'manual' && status === 'active' && (
                        <button
                          type="button"
                          className="btn btn--outline btn--small admin-notifications__toggle"
                          onClick={() => handleToggleManual(notification)}
                        >
                          {adminText('notifications.list.turnOff')}
                        </button>
                      )}
                    </div>
                    <div className="admin-events__actions">
                      <button
                        type="button"
                        className="admin-events__action"
                        onClick={() => handleEdit(notification)}
                        aria-label={adminText('notifications.list.editAria', { title: notification.title })}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        className="admin-events__action admin-events__action--danger"
                        onClick={() => setNotificationToDelete(notification)}
                        aria-label={adminText('notifications.list.deleteAria', { title: notification.title })}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {!flatNotifications.length && (
            <p className="admin-events__empty">
              {search.trim() || statusFilter !== 'all'
                ? adminText('notifications.list.emptySearch')
                : adminText('notifications.list.empty')}
            </p>
          )}
        </div>
      )}

      <AdminNotificationFormModal
        open={formOpen}
        notification={editingNotification}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        saveError={saveError}
      />

      <AdminDeleteNotificationDialog
        open={Boolean(notificationToDelete)}
        notification={notificationToDelete}
        onClose={() => setNotificationToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
