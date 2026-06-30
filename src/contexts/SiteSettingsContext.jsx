import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_SITE_SETTINGS } from '../data/site-settings';
import { normalizeSiteSettings, subscribeSiteSettings } from '../services/site-settings';

const SiteSettingsContext = createContext(null);

export function SiteSettingsProvider({ children, initialSettings = null }) {
  const [settings, setSettings] = useState(() => (
    initialSettings ? normalizeSiteSettings(initialSettings) : DEFAULT_SITE_SETTINGS
  ));
  const [loading, setLoading] = useState(initialSettings === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSiteSettings(
      (data) => {
        setSettings(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setSettings(DEFAULT_SITE_SETTINGS);
        setLoading(false);
        setError(err.message || 'Nepodařilo se načíst nastavení webu.');
      },
    );

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({
    settings,
    loading,
    error,
  }), [settings, loading, error]);

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within SiteSettingsProvider');
  }
  return context;
}
