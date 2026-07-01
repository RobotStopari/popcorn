import { usePages } from '../contexts/PagesContext';
import { NOT_FOUND_PAGE_ID } from '../data/pages';
import ContentPage from '../pages/ContentPage';

export default function NotFoundPage() {
  const { getPageById, loading } = usePages();
  const page = getPageById(NOT_FOUND_PAGE_ID);

  if (loading) {
    return (
      <section className="section content-page-section">
        <div className="container">
          <p className="section__empty">Načítám stránku…</p>
        </div>
      </section>
    );
  }

  if (!page) {
    return (
      <section className="section content-page-section">
        <div className="container">
          <h1>Stránka nenalezena</h1>
          <p>Tato stránka neexistuje nebo byla přesunuta.</p>
        </div>
      </section>
    );
  }

  return <ContentPage page={page} />;
}
