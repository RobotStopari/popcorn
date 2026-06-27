import { Navigate, useParams } from 'react-router-dom';
import { usePages } from '../contexts/PagesContext';
import PageRenderer from './PageRenderer';

export default function SlugRoute() {
  const { slug } = useParams();
  const { getPageBySlug, loading } = usePages();

  if (loading) {
    return (
      <section className="section content-page-section">
        <div className="container">
          <p className="section__empty">Načítám stránku…</p>
        </div>
      </section>
    );
  }

  const page = getPageBySlug(slug);

  if (!page) {
    return <Navigate to="/" replace />;
  }

  return <PageRenderer page={page} />;
}
