import { useEventCategories } from '../hooks/useEventCategories';
import { normalizeEventCategory } from '../data/event-categories';
import EventCategoryIcon from './EventCategoryIcon';

export default function EventCategoryLabel({
  category,
  past = false,
  className = '',
  showDescription = false,
  iconSize = 'sm',
}) {
  const { getLabel, getDescription } = useEventCategories();
  const id = normalizeEventCategory(category);
  const pastClass = past ? ' event-category-tag--past' : '';
  const label = getLabel(id);
  const description = showDescription ? getDescription(id) : '';
  const hasDescription = Boolean(description);

  return (
    <div
      className={[
        'event-category-tag',
        `event-category-tag--${id}`,
        hasDescription ? 'event-category-tag--with-text' : '',
        pastClass,
        className,
      ].filter(Boolean).join(' ')}
      role={hasDescription ? 'note' : undefined}
    >
      <span className="event-category-tag__label">
        <EventCategoryIcon category={id} size={iconSize} past={past} />
        <span className="event-category-tag__name">{label}</span>
      </span>
      {hasDescription && (
        <p className="event-category-tag__description">{description}</p>
      )}
    </div>
  );
}
