import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_SITE_MENU, normalizeMenuItems } from '../data/site-menu';
import { resolveMenuItems, subscribeSiteMenu } from '../services/site-menu';
import { usePages } from './PagesContext';

const SiteMenuContext = createContext(null);

export function SiteMenuProvider({ children }) {
  const { pages } = usePages();
  const [items, setItems] = useState(normalizeMenuItems(DEFAULT_SITE_MENU.items));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSiteMenu(
      (data) => {
        setItems(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setItems(normalizeMenuItems(DEFAULT_SITE_MENU.items));
        setError(err.message || 'Nepodařilo se načíst menu.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const menu = useMemo(
    () => resolveMenuItems(items, pages),
    [items, pages],
  );

  const value = useMemo(() => ({
    items,
    menu,
    loading,
    error,
  }), [items, menu, loading, error]);

  return (
    <SiteMenuContext.Provider value={value}>
      {children}
    </SiteMenuContext.Provider>
  );
}

export function useSiteMenu() {
  const context = useContext(SiteMenuContext);
  if (!context) {
    throw new Error('useSiteMenu must be used within SiteMenuProvider');
  }
  return context;
}
