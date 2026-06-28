import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AdminEventFormModal from '../components/AdminEventFormModal';
import {
  fetchShareLink,
  registerShareLinkOpen,
  updateEventViaShareLink,
} from '../services/event-share-links';
import { fetchEventById } from '../services/events';
import { isEventPublishable } from '../utils/event-format';
import { getShareLinkStatus } from '../utils/event-share-link-format';

export default function EventShareEditPage() {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [event, setEvent] = useState(null);

  useEffect(() => {
    if (!shareId) {
      setError('Neplatný sdílecí odkaz.');
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      setEvent(null);

      try {
        const link = await fetchShareLink(shareId);
        if (!link) {
          throw new Error('Sdílecí odkaz neexistuje.');
        }

        const status = getShareLinkStatus(link, { forOpen: true });
        if (!status.valid) {
          throw new Error(status.reason);
        }

        await registerShareLinkOpen(shareId);

        const matchedEvent = await fetchEventById(link.eventId);
        if (!matchedEvent) {
          throw new Error('Akce pro tento odkaz nebyla nalezena.');
        }

        if (cancelled) return;

        setEvent(matchedEvent);
        document.title = matchedEvent.title
          ? `Úprava akce — ${matchedEvent.title}`
          : 'Nová akce — sdílený odkaz';
      } catch (err) {
        if (!cancelled) {
          const message = err.code === 'permission-denied'
            ? 'Odkaz se nepodařilo ověřit. Zkontrolujte, že je stále aktivní, nebo požádejte o nový.'
            : (err.message || 'Odkaz se nepodařilo ověřit.');
          setError(message);
          document.title = 'Odkaz nelze použít';
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const handleSave = async (payload, { published } = {}) => {
    if (!shareId || !event) return false;

    try {
      const resolvedPublished = published ?? isEventPublishable({
        title: payload.title,
        dateStart: payload.dateStart,
        timeStart: payload.timeStart,
        dateEnd: payload.dateEnd,
        timeEnd: payload.timeEnd,
      });
      await updateEventViaShareLink(shareId, event.id, {
        ...payload,
        published: resolvedPublished,
      });
      setEvent((current) => ({
        ...current,
        ...payload,
        published: resolvedPublished,
        title: payload.title,
      }));
      if (payload.title?.trim()) {
        document.title = `Úprava akce — ${payload.title.trim()}`;
      }
      return true;
    } catch (err) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="event-share-page">
        <div className="event-share-page__status container">
          <p className="event-share-page__loading">Ověřuji sdílecí odkaz…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-share-page">
        <div className="event-share-page__status container">
          <div className="event-share-page__error">
            <h1 className="event-share-page__title">Odkaz nelze použít</h1>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <AdminEventFormModal
      open
      fullPage
      shareMode
      event={event}
      shareId={shareId}
      onClose={() => {}}
      onSave={handleSave}
    />
  );
}
