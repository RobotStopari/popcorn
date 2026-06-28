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
import { isEventListedPublicly, isEventPublic, toCalendarEvent } from '../utils/event-format';

const EventsContext = createContext(null);

export function EventsProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }), [events, loading, error, upcomingTop, pastTop, calendarEvents, getEventById]);

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
