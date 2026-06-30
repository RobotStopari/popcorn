import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import EventDetail from '../components/EventDetail';
import { useEvents } from '../contexts/EventsContext';
import { useImageFrames } from '../hooks/useImageFrames';
import { deriveEventSlug } from '../data/events';

export default function EventPage() {
  const { eventSlug } = useParams();
  const { getEventBySlugOrId, loading } = useEvents();
  const result = eventSlug ? getEventBySlugOrId(eventSlug) : null;
  const contentKey = loading ? 'loading' : result ? result.event.id : 'missing';

  useImageFrames([eventSlug, contentKey]);

  useEffect(() => {
    if (loading) return;

    document.title = result
      ? `${result.event.name} — Komunita Popcorn`
      : 'Akce nenalezena — Komunita Popcorn';
  }, [eventSlug, loading, result]);

  return <EventDetail slug={eventSlug} />;
}

export function EventLegacyIdRedirect() {
  const { legacyId } = useParams();
  const { getEventById, loading } = useEvents();

  if (loading) {
    return (
      <article className="event-detail container">
        <p className="event-detail__loading">Načítám akci…</p>
      </article>
    );
  }

  const result = legacyId ? getEventById(legacyId) : null;
  if (!result) return <Navigate to="/" replace />;

  const slug = deriveEventSlug(result.event);
  return <Navigate to={`/akce/${encodeURIComponent(slug)}`} replace />;
}
