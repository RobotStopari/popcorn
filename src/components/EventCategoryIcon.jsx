import { EVENT_CATEGORY_ICONS } from '../data/icons';
import { normalizeEventCategory } from '../data/event-categories';

export default function EventCategoryIcon({
  category,
  size = 'md',
  past = false,
  className = '',
}) {
  const id = normalizeEventCategory(category);
  const iconHtml = EVENT_CATEGORY_ICONS[id] || EVENT_CATEGORY_ICONS.public;

  return (
    <span
      className={[
        'event-category-icon',
        `event-category-icon--${id}`,
        `event-category-icon--${size}`,
        past ? 'event-category-icon--past' : '',
        className,
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: iconHtml }}
    />
  );
}
