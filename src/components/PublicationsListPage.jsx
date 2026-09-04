import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPageIntro, pagePath } from '../data/pages';
import { filterItemsByCategory } from '../data/resource-categories';
import EventsPagination from './EventsPagination';
import PublicationCard from './PublicationCard';
import ResourceListToolbar from './ResourceListToolbar';
import SectionLabel from './SectionLabel';
import { usePublications } from '../contexts/PublicationsContext';
import { filterPublicationsBySearch } from '../utils/publication-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 20;

export default function PublicationsListPage({ page }) {
  const intro = getPageIntro(page);
  const { publications, loading } = usePublications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const basePath = page ? pagePath(page) : '/publikace';

  const filteredPublications = useMemo(
    () => filterPublicationsBySearch(filterItemsByCategory(publications, categoryId), search),
    [publications, search, categoryId],
  );

  const totalPages = Math.max(1, Math.ceil(filteredPublications.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;
  const filterKeyRef = useRef(`${search}|${categoryId}`);

  const pagePublications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredPublications.slice(start, start + PAGE_SIZE);
  }, [filteredPublications, currentPage]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = siteDocumentTitle(page.title);
  }, [page?.title]);

  useEffect(() => {
    if (loading) return;

    if (!Number.isFinite(requestedPage) || requestedPage < 1) {
      setSearchParams({}, { replace: true });
      return;
    }

    if (requestedPage > totalPages) {
      if (totalPages === 1) {
        setSearchParams({}, { replace: true });
      } else {
        setSearchParams({ page: String(totalPages) }, { replace: true });
      }
    }
  }, [loading, requestedPage, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, page?.id]);

  useEffect(() => {
    const key = `${search}|${categoryId}`;
    if (filterKeyRef.current === key) return;
    filterKeyRef.current = key;

    setSearchParams((prev) => {
      if (!prev.get('page')) return prev;
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [search, categoryId, setSearchParams]);

  if (!page) return null;

  const hasActiveFilters = Boolean(search.trim() || categoryId);

  return (
    <section className="section events-list resource-list resource-list--publications">
      <div className="container">
        <SectionLabel label={page.title} theme="red" />
        <p className="events-list__intro reveal">{intro}</p>

        <ResourceListToolbar
          type="publication"
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          textPrefix="publications.list"
        />

        {loading ? (
          <p className="section__empty">{siteText('publications.list.loading')}</p>
        ) : pagePublications.length > 0 ? (
          <div className="resource-grid reveal-stagger">
            {pagePublications.map((publication, index) => (
              <PublicationCard key={publication.id} publication={publication} index={index} />
            ))}
          </div>
        ) : (
          <p className="section__empty reveal">
            {hasActiveFilters
              ? siteText('publications.list.emptySearch')
              : siteText('publications.list.empty')}
          </p>
        )}

        {!loading && filteredPublications.length > PAGE_SIZE && (
          <EventsPagination
            basePath={basePath}
            page={currentPage}
            totalPages={totalPages}
          />
        )}
      </div>
    </section>
  );
}
