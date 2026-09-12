import { getEventStampById } from '../data/event-stamps';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export default function EventStampBadge({
  stampId = '',
  className = '',
  title,
}) {
  const { settings } = useSiteSettings();
  const stamp = getEventStampById(settings?.eventStamps, stampId);
  if (!stamp?.icon) return null;

  const label = title || stamp.name || 'Razítko';

  return (
    <span
      className={`event-stamp${className ? ` ${className}` : ''}`}
      title={label}
      aria-label={label}
    >
      <span className="event-stamp__icon" aria-hidden="true">{stamp.icon}</span>
    </span>
  );
}
