import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_SITE_TEXTS } from '../data/site-texts';
import { normalizeSiteTexts, subscribeSiteTexts } from '../services/site-texts';

const SiteTextsContext = createContext(null);

export function SiteTextsProvider({ children }) {
  const [texts, setTexts] = useState(DEFAULT_SITE_TEXTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSiteTexts(
      (data) => {
        setTexts(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setTexts(normalizeSiteTexts());
        setError(err.message || 'Nepodařilo se načíst texty.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    texts,
    loading,
    error,
  }), [texts, loading, error]);

  return (
    <SiteTextsContext.Provider value={value}>
      {children}
    </SiteTextsContext.Provider>
  );
}

export function useSiteTexts() {
  const context = useContext(SiteTextsContext);
  if (!context) {
    throw new Error('useSiteTexts must be used within SiteTextsProvider');
  }
  return context;
}
