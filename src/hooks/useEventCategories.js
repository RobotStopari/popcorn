import { useCallback, useMemo } from 'react';
import {
  EVENT_CATEGORY_IDS,
  buildEventCategoriesFromTexts,
  getEventCategoryDescription,
  getEventCategoryLabel,
} from '../data/event-categories';
import { useSiteTexts } from '../contexts/SiteTextsContext';

export function useEventCategories() {
  const { texts } = useSiteTexts();

  const categories = useMemo(
    () => buildEventCategoriesFromTexts(texts),
    [texts],
  );

  const getLabel = useCallback(
    (categoryId) => getEventCategoryLabel(categoryId, categories),
    [categories],
  );

  const getDescription = useCallback(
    (categoryId) => getEventCategoryDescription(categoryId, categories),
    [categories],
  );

  return {
    categories,
    categoryIds: EVENT_CATEGORY_IDS,
    getLabel,
    getDescription,
  };
}
