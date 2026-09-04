import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPageIntro, pagePath } from '../data/pages';
import { filterItemsByCategory } from '../data/resource-categories';
import EventsPagination from './EventsPagination';
import ResourceListToolbar from './ResourceListToolbar';
import SectionLabel from './SectionLabel';
import UsefulLinksTable from './UsefulLinksTable';
import { useUsefulLinks } from '../contexts/UsefulLinksContext';
import { filterUsefulLinksBySearch } from '../utils/useful-link-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 30;

export default function UsefulLinksListPage({ page }) {
  const intro = getPageIntro(page);
  const { links, loading } = useUsefulLinks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const basePath = page ? pagePath(page) : '/odkazy';

  const filteredLinks = useMemo(
    () => filterUsefulLinksBySearch(filterItemsByCategory(links, categoryId), search),
    [links, search, categoryId],
  );

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;
  const filterKeyRef = useRef(`${search}|${categoryId}`);

  const pageLinks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLinks.slice(start, start + PAGE_SIZE);
  }, [filteredLinks, currentPage]);

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
    <section className="section events-list resource-list resource-list--links links-page">
      <div className="container">
        <SectionLabel label={page.title} theme="blue" />
        <p className="events-list__intro reveal">{intro}</p>

        <ResourceListToolbar
          type="usefulLink"
          search={search}
          onSearchChange={setSearch}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          textPrefix="usefulLinks.list"
        />

        {!loading && filteredLinks.length > 0 && (
          <p className="links-page__count reveal" aria-live="polite">
            {siteText('usefulLinks.list.resultCount', { count: filteredLinks.length })}
          </p>
        )}

        {loading ? (
          <p className="section__empty">{siteText('usefulLinks.list.loading')}</p>
        ) : pageLinks.length > 0 ? (
          <UsefulLinksTable links={pageLinks} />
        ) : (
          <p className="section__empty reveal">
            {hasActiveFilters
              ? siteText('usefulLinks.list.emptySearch')
              : siteText('usefulLinks.list.empty')}
          </p>
        )}

        {!loading && filteredLinks.length > PAGE_SIZE && (
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
