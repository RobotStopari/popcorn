import { useEventCategories } from '../hooks/useEventCategories';
import { normalizeEventCategory } from '../data/event-categories';

export default function EventCategoryBadge({ category, className = '' }) {
  const { getLabel } = useEventCategories();
  const id = normalizeEventCategory(category);

  return (
    <span className={`admin-events__category-badge admin-events__category-badge--${id}${className ? ` ${className}` : ''}`}>
      {getLabel(id)}
    </span>
  );
}
