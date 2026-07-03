import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import NotFoundPage from '../components/NotFoundPage';
import EventDetail from '../components/EventDetail';
import { useEvents } from '../contexts/EventsContext';
import { useImageFrames } from '../hooks/useImageFrames';
import { deriveEventSlug } from '../data/events';
import { siteDocumentTitle, siteText } from '../utils/admin-text';

export default function EventPage() {
  const { eventSlug } = useParams();
  const { getEventBySlugOrId, loading } = useEvents();
  const result = eventSlug ? getEventBySlugOrId(eventSlug) : null;
  const contentKey = loading ? 'loading' : result ? result.event.id : 'missing';

  useImageFrames([eventSlug, contentKey]);

  useEffect(() => {
    if (loading) return;
    if (!result) return;

    document.title = siteDocumentTitle(result.event.name);
  }, [eventSlug, loading, result]);

  return <EventDetail slug={eventSlug} />;
}

export function EventLegacyIdRedirect() {
  const { legacyId } = useParams();
  const { getEventById, loading } = useEvents();

  if (loading) {
    return (
      <article className="event-detail container">
        <p className="event-detail__loading">{siteText('events.detail.loading')}</p>
      </article>
    );
  }

  const result = legacyId ? getEventById(legacyId) : null;
  if (!result) return <NotFoundPage />;

  const slug = deriveEventSlug(result.event);
  return <Navigate to={`/akce/${encodeURIComponent(slug)}`} replace />;
}
