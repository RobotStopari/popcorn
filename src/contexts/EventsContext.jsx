import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { subscribeEvents } from '../services/events';
import { getTopPast, getTopUpcoming } from '../utils/event-dates';
import { deriveEventSlug } from '../data/events';
import { isEventListedPublicly, isEventPublic, normalizeEvent, toCalendarEvent } from '../utils/event-format';

const EventsContext = createContext(null);

function normalizeInitialEvents(initialEvents) {
  if (!initialEvents?.length) return [];
  return initialEvents
    .map((item) => {
      try {
        return normalizeEvent(item);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function EventsProvider({ children, initialEvents = null }) {
  const [events, setEvents] = useState(() => normalizeInitialEvents(initialEvents));
  const [loading, setLoading] = useState(initialEvents === null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = subscribeEvents(
      (data) => {
        setEvents(data);
        setLoading(false);
        setError('');
      },
      (err) => {
        setError(err.message || 'Nepodařilo se načíst akce.');
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const publishedEvents = useMemo(
    () => events.filter(isEventPublic),
    [events],
  );

  const listedEvents = useMemo(
    () => publishedEvents.filter(isEventListedPublicly),
    [publishedEvents],
  );

  const getEventById = useCallback((id) => {
    const event = listedEvents.find((item) => item.id === id);
    if (!event) return null;
    return { event, past: event.past };
  }, [listedEvents]);

  const getEventBySlug = useCallback((slug) => {
    const event = listedEvents.find((item) => deriveEventSlug(item) === slug || item.slug === slug);
    if (!event) return null;
    return { event, past: event.past };
  }, [listedEvents]);

  const getEventBySlugOrId = useCallback((slugOrId) => (
    getEventBySlug(slugOrId) || getEventById(slugOrId)
  ), [getEventBySlug, getEventById]);

  const upcomingTop = useMemo(() => getTopUpcoming(listedEvents, 3), [listedEvents]);
  const pastTop = useMemo(() => getTopPast(listedEvents, 3), [listedEvents]);
  const calendarEvents = useMemo(
    () => publishedEvents.map(toCalendarEvent),
    [publishedEvents],
  );

  const value = useMemo(() => ({
    events,
    loading,
    error,
    upcomingTop,
    pastTop,
    calendarEvents,
    getEventById,
    getEventBySlug,
    getEventBySlugOrId,
  }), [
    events,
    loading,
    error,
    upcomingTop,
    pastTop,
    calendarEvents,
    getEventById,
    getEventBySlug,
    getEventBySlugOrId,
  ]);

  return (
    <EventsContext.Provider value={value}>
      {children}
    </EventsContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within EventsProvider');
  }
  return context;
}
