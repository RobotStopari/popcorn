import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribeUsefulLinks } from '../services/useful-links';
import { normalizeUsefulLink, sortUsefulLinksByTitle } from '../utils/useful-link-format';

const UsefulLinksContext = createContext(null);

function normalizeInitialLinks(initialLinks) {
  if (!initialLinks?.length) return [];
  return initialLinks
    .map((item) => {
      try {
        return normalizeUsefulLink(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function UsefulLinksProvider({ children, initialLinks = null }) {
  const [links, setLinks] = useState(() => normalizeInitialLinks(initialLinks));
  const [loading, setLoading] = useState(initialLinks === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeUsefulLinks(
      (data) => {
        setLinks(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst odkazy.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const sortedLinks = useMemo(() => sortUsefulLinksByTitle(links), [links]);

  const value = useMemo(() => ({
    links: sortedLinks,
    loading,
    error,
  }), [sortedLinks, loading, error]);

  return (
    <UsefulLinksContext.Provider value={value}>
      {children}
    </UsefulLinksContext.Provider>
  );
}

export function useUsefulLinks() {
  const context = useContext(UsefulLinksContext);
  if (!context) {
    throw new Error('useUsefulLinks must be used within UsefulLinksProvider');
  }
  return context;
}
