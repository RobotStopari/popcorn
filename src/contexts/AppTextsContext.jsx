import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ADMIN_TEXTS, SITE_UI_TEXTS } from '../data/admin-texts';
import { mergeTextTree } from '../utils/app-text-merge';
import { normalizeAppTexts, subscribeAppTexts } from '../services/app-texts';
import { setAppTextRuntime } from '../utils/admin-text';

const AppTextsContext = createContext(null);

export function AppTextsProvider({ children, initialOverrides = null }) {
  const [overrides, setOverrides] = useState(initialOverrides || {});
  const [loading, setLoading] = useState(initialOverrides === null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOverrides !== null) {
      setOverrides(initialOverrides);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = subscribeAppTexts(
      (data) => {
        setOverrides(data.overrides);
        setLoading(false);
        setError('');
      },
      (err) => {
        setOverrides({});
        setError(err.message || 'Nepodařilo se načíst texty.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [initialOverrides]);

  const { adminTexts, siteTexts, revision } = useMemo(() => {
    const admin = mergeTextTree(ADMIN_TEXTS, overrides);
    const site = mergeTextTree(SITE_UI_TEXTS, overrides);

    // Update the module-level runtime synchronously during render so plain
    // adminText()/siteText() calls read fresh values on the very next render.
    setAppTextRuntime({ admin, site });

    return {
      adminTexts: admin,
      siteTexts: site,
      revision: JSON.stringify(overrides),
    };
  }, [overrides]);

  const value = useMemo(() => ({
    overrides,
    adminTexts,
    siteTexts,
    revision,
    loading,
    error,
  }), [overrides, adminTexts, siteTexts, revision, loading, error]);

  return (
    <AppTextsContext.Provider value={value}>
      {children}
    </AppTextsContext.Provider>
  );
}

export function useAppTexts() {
  const context = useContext(AppTextsContext);
  if (!context) {
    throw new Error('useAppTexts must be used within AppTextsProvider');
  }
  return context;
}

export function getInitialAppTextsState(ssrData) {
  if (!ssrData?.appTexts) return null;
  return normalizeAppTexts(ssrData.appTexts).overrides;
}
