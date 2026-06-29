import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { pagePath, getPageIntro } from '../data/pages';
import { useEvents } from '../contexts/EventsContext';
import { getAllPast, getAllUpcoming } from '../utils/event-dates';
import EventCard from './EventCard';
import EventsPagination from './EventsPagination';
import SectionLabel from './SectionLabel';

const PAGE_SIZE = 15;

const EMPTY_MESSAGES = {
  upcoming: 'Zatím žádné nadcházející akce.',
  past: 'Zatím žádné proběhlé akce.',
};

export default function EventsListPage({ page, variant }) {
  const past = variant === 'past';
  const intro = getPageIntro(page);
  const { events, loading } = useEvents();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = page ? pagePath(page) : '/';

  const allEvents = useMemo(() => (
    past ? getAllPast(events) : getAllUpcoming(events)
  ), [events, past]);

  const totalPages = Math.max(1, Math.ceil(allEvents.length / PAGE_SIZE));
  const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
  const currentPage = Number.isFinite(requestedPage) && requestedPage > 0
    ? Math.min(requestedPage, totalPages)
    : 1;

  const pageEvents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allEvents.slice(start, start + PAGE_SIZE);
  }, [allEvents, currentPage]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = `${page.title} — Komunita Popcorn`;
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
  }, [currentPage, variant, page?.id]);

  if (!page) return null;

  return (
    <section className="section events-list">
      <div className="container">
        <SectionLabel label={page.title} />
        <p className="events-list__intro reveal">{intro}</p>

        {loading ? (
          <p className="section__empty">Načítám akce…</p>
        ) : pageEvents.length > 0 ? (
          <div className="cards-grid reveal-stagger">
            {pageEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} past={past} />
            ))}
          </div>
        ) : (
          <p className="section__empty">{EMPTY_MESSAGES[variant]}</p>
        )}

        {!loading && allEvents.length > 0 && (
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
