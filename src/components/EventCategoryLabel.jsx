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
  const pastClass = past ? ' event-category--past' : '';
  const label = getLabel(id);
  const description = showDescription ? getDescription(id) : '';

  const labelContent = (
    <span className="event-category__row">
      <EventCategoryIcon category={id} size={iconSize} past={past} />
      <span className="event-category__text">{label}</span>
    </span>
  );

  if (showDescription && description) {
    return (
      <div className={`event-category-detail event-category-detail--${id}${pastClass}${className ? ` ${className}` : ''}`}>
        <div className="event-category-detail__callout" role="note">
          <p className={`event-category event-category--${id}${pastClass} event-category-detail__label`}>
            {labelContent}
          </p>
          <p className="event-category-detail__text">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <p className={`event-category event-category--${id}${pastClass}${className ? ` ${className}` : ''}`}>
      {labelContent}
    </p>
  );
}
