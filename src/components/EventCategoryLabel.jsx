import { useEventCategories } from '../hooks/useEventCategories';
import { normalizeEventCategory } from '../data/event-categories';

export default function EventCategoryLabel({
  category,
  past = false,
  className = '',
  showDescription = false,
}) {
  const { getLabel, getDescription } = useEventCategories();
  const id = normalizeEventCategory(category);
  const pastClass = past ? ' event-category--past' : '';
  const label = getLabel(id);
  const description = showDescription ? getDescription(id) : '';

  if (showDescription && description) {
    return (
      <div className={`event-category-detail event-category-detail--${id}${pastClass}${className ? ` ${className}` : ''}`}>
        <div className="event-category-detail__callout" role="note">
          <p className={`event-category event-category--${id}${pastClass} event-category-detail__label`}>
            {label}
          </p>
          <p className="event-category-detail__text">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <p className={`event-category event-category--${id}${pastClass}${className ? ` ${className}` : ''}`}>
      {label}
    </p>
  );
}
