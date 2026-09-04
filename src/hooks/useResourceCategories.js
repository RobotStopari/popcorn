import { useMemo } from 'react';
import {
  getResourceCategories,
  getResourceCategoryLabel,
} from '../data/resource-categories';
import { useSiteSettings } from '../contexts/SiteSettingsContext';

export function useResourceCategories(type) {
  const { settings } = useSiteSettings();

  const categories = useMemo(
    () => getResourceCategories(settings, type),
    [settings, type],
  );

  const getLabel = useMemo(
    () => (categoryId) => getResourceCategoryLabel(categories, categoryId),
    [categories],
  );

  return {
    categories,
    hasCategories: categories.length > 0,
    getLabel,
  };
}
