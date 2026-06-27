import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EventDetail from '../components/EventDetail';
import { useEvents } from '../contexts/EventsContext';
import { useImageFrames } from '../hooks/useImageFrames';

export default function EventPage() {
  const { id } = useParams();
  const { getEventById, loading } = useEvents();
  const result = id ? getEventById(id) : null;
  const contentKey = loading ? 'loading' : result ? result.event.id : 'missing';

  useImageFrames([id, contentKey]);

  useEffect(() => {
    if (loading) return;

    document.title = result
      ? `${result.event.name} — Komunita Popcorn`
      : 'Akce nenalezena — Komunita Popcorn';
  }, [id, loading, result]);

  return <EventDetail id={id} />;
}
