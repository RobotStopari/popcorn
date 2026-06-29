import { NOTIFICATION_ICONS } from '../data/notification-icons';

export default function NotificationIcon({ icon = 'notification', className = '' }) {
  const markup = NOTIFICATION_ICONS[icon] || NOTIFICATION_ICONS.notification;

  return (
    <span
      className={`notification-icon${className ? ` ${className}` : ''}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
