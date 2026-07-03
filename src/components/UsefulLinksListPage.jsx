import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPageIntro, pagePath } from '../data/pages';
import EventsPagination from './EventsPagination';
import KeywordFilter from './KeywordFilter';
import SectionLabel from './SectionLabel';
import UsefulLinkCard from './UsefulLinkCard';
import { useUsefulLinks } from '../contexts/UsefulLinksContext';
import { filterUsefulLinksBySearch } from '../utils/useful-link-format';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

const PAGE_SIZE = 20;

export default function UsefulLinksListPage({ page }) {
  const intro = getPageIntro(page);
  const { links, loading } = useUsefulLinks();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const basePath = page ? pagePath(page) : '/odkazy';

  const filteredLinks = useMemo(
    () => filterUsefulLinksBySearch(links, search),
    [links, search],
  );

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;

  const pageLinks = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredLinks.slice(start, start + PAGE_SIZE);
  }, [filteredLinks, currentPage]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = siteDocumentTitle(page.title);
  }, [page?.title]);

  useEffect(() => {
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
  }, [requestedPage, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage, page?.id]);

  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('page');
      return next;
    }, { replace: true });
  }, [search, setSearchParams]);

  if (!page) return null;

  return (
    <section className="section events-list resource-list resource-list--links">
      <div className="container">
        <SectionLabel label={page.title} theme="blue" />
        <p className="events-list__intro reveal">{intro}</p>

        <KeywordFilter
          items={links}
          search={search}
          onSearchChange={setSearch}
          textPrefix="usefulLinks.list"
        />

        {loading ? (
          <p className="section__empty">{siteText('usefulLinks.list.loading')}</p>
        ) : pageLinks.length > 0 ? (
          <div className="resource-grid reveal-stagger">
            {pageLinks.map((link, index) => (
              <UsefulLinkCard key={link.id} link={link} index={index} />
            ))}
          </div>
        ) : (
          <p className="section__empty reveal">
            {search.trim()
              ? siteText('usefulLinks.list.emptySearch')
              : siteText('usefulLinks.list.empty')}
          </p>
        )}

        {!loading && filteredLinks.length > PAGE_SIZE && (
          <EventsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            basePath={basePath}
          />
        )}
      </div>
    </section>
  );
}
