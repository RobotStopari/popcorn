import { Navigate, useParams } from 'react-router-dom';
import { COMING_SOON_PAGE_SLUG, isHiddenPublicPageSlug } from '../data/pages';
import { usePages } from '../contexts/PagesContext';
import NotFoundPage from './NotFoundPage';
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

  if (isHiddenPublicPageSlug(slug)) {
    if (slug === COMING_SOON_PAGE_SLUG) {
      return <Navigate to="/" replace />;
    }
    return <NotFoundPage />;
  }

  const page = getPageBySlug(slug);

  if (!page) {
    return <NotFoundPage />;
  }

  return <PageRenderer page={page} />;
}
