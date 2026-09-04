import { useResourceCategories } from '../hooks/useResourceCategories';

export default function ResourceCategoryBadge({
  type,
  categoryId,
  className = '',
}) {
  const { getLabel, hasCategories } = useResourceCategories(type);
  if (!hasCategories) return null;

  const label = getLabel(categoryId);
  if (!label) return null;

  return (
    <span className={`resource-category-badge${className ? ` ${className}` : ''}`}>
      {label}
    </span>
  );
}
