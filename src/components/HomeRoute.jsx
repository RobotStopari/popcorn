import { Navigate } from 'react-router-dom';
import { usePages } from '../contexts/PagesContext';
import PageRenderer from './PageRenderer';

export default function HomeRoute() {
  const { getHomePage, loading } = usePages();

  if (loading) {
    return (
      <div className="content-page">
        <p className="section__empty">Načítám stránku…</p>
      </div>
    );
  }

  const page = getHomePage();

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return <PageRenderer page={page} />;
}
