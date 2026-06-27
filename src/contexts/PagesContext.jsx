import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PAGE_TYPES, pagePath } from '../data/pages';
import { subscribePages } from '../services/pages';

const PagesContext = createContext(null);

export function PagesProvider({ children }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribePages(
      (data) => {
        setPages(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst stránky.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const getPageById = useCallback((id) => pages.find((page) => page.id === id) || null, [pages]);

  const getPageBySlug = useCallback((slug) => (
    pages.find((page) => page.slug === slug) || null
  ), [pages]);

  const getHomePage = useCallback(() => (
    pages.find((page) => page.type === PAGE_TYPES.home) || null
  ), [pages]);

  const getEventsUpcomingPage = useCallback(() => (
    pages.find((page) => page.type === PAGE_TYPES.eventsUpcoming) || null
  ), [pages]);

  const getEventsPastPage = useCallback(() => (
    pages.find((page) => page.type === PAGE_TYPES.eventsPast) || null
  ), [pages]);

  const value = useMemo(() => ({
    pages,
    loading,
    error,
    getPageById,
    getPageBySlug,
    getHomePage,
    getEventsUpcomingPage,
    getEventsPastPage,
    pagePath,
  }), [
    pages,
    loading,
    error,
    getPageById,
    getPageBySlug,
    getHomePage,
    getEventsUpcomingPage,
    getEventsPastPage,
  ]);

  return (
    <PagesContext.Provider value={value}>
      {children}
    </PagesContext.Provider>
  );
}

export function usePages() {
  const context = useContext(PagesContext);
  if (!context) {
    throw new Error('usePages must be used within PagesProvider');
  }
  return context;
}
