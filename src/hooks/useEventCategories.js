import { useCallback, useMemo } from 'react';
import {
  EVENT_CATEGORY_IDS,
  buildEventCategoriesFromTexts,
  getEventCategoryDescription,
  getEventCategoryLabel,
} from '../data/event-categories';
import { getEventCategoryTexts } from '../data/site-settings';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export function useEventCategories() {
  const { settings } = useSiteSettings();

  const categories = useMemo(
    () => buildEventCategoriesFromTexts(getEventCategoryTexts(settings)),
    [settings],
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
