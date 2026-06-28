import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_COLORS,
  applyColorTokens,
  buildGradients,
  normalizeSiteColors,
} from '../data/colors';
import { subscribeSiteColors } from '../services/site-colors';

const SiteColorsContext = createContext(null);

const DEFAULT_PALETTE = normalizeSiteColors({});

export function SiteColorsProvider({ children }) {
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeSiteColors(
      (data) => {
        setPalette(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setPalette(DEFAULT_PALETTE);
        setError(err.message || 'Nepodařilo se načíst barvy.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    applyColorTokens(palette);
  }, [palette]);

  const value = useMemo(() => ({
    colors: palette.colors,
    gradients: palette.gradients,
    loading,
    error,
  }), [palette, loading, error]);

  return (
    <SiteColorsContext.Provider value={value}>
      {children}
    </SiteColorsContext.Provider>
  );
}

export function useSiteColors() {
  const context = useContext(SiteColorsContext);
  if (!context) {
    return {
      colors: DEFAULT_COLORS,
      gradients: buildGradients(DEFAULT_COLORS),
      loading: false,
      error: '',
    };
  }
  return context;
}
