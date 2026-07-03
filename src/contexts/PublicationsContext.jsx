import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribePublications } from '../services/publications';
import { normalizePublication, sortPublicationsByTitle } from '../utils/publication-format';

const PublicationsContext = createContext(null);

function normalizeInitialPublications(initialPublications) {
  if (!initialPublications?.length) return [];
  return initialPublications
    .map((item) => {
      try {
        return normalizePublication(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function PublicationsProvider({ children, initialPublications = null }) {
  const [publications, setPublications] = useState(() => (
    normalizeInitialPublications(initialPublications)
  ));
  const [loading, setLoading] = useState(initialPublications === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribePublications(
      (data) => {
        setPublications(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst publikace.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const sortedPublications = useMemo(
    () => sortPublicationsByTitle(publications),
    [publications],
  );

  const value = useMemo(() => ({
    publications: sortedPublications,
    loading,
    error,
  }), [sortedPublications, loading, error]);

  return (
    <PublicationsContext.Provider value={value}>
      {children}
    </PublicationsContext.Provider>
  );
}

export function usePublications() {
  const context = useContext(PublicationsContext);
  if (!context) {
    throw new Error('usePublications must be used within PublicationsProvider');
  }
  return context;
}
