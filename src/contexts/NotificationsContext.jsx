import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribeNotifications } from '../services/notifications';
import { isNotificationActive, normalizeNotification, sortActiveNotificationsByCreated } from '../utils/notification-format';

const NotificationsContext = createContext(null);

function normalizeInitialNotifications(initialNotifications) {
  if (!initialNotifications?.length) return [];
  return initialNotifications
    .map((item) => {
      try {
        return normalizeNotification(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function NotificationsProvider({ children, initialNotifications = null }) {
  const [notifications, setNotifications] = useState(() => (
    normalizeInitialNotifications(initialNotifications)
  ));
  const [loading, setLoading] = useState(initialNotifications === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeNotifications(
      (data) => {
        setNotifications(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst upozornění.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const activeNotifications = useMemo(() => {
    const now = new Date();
    return sortActiveNotificationsByCreated(
      notifications.filter((item) => isNotificationActive(item, now)),
      true,
    );
  }, [notifications]);

  const value = useMemo(() => ({
    notifications,
    activeNotifications,
    loading,
    error,
  }), [notifications, activeNotifications, loading, error]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
