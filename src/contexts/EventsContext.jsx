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
import { isEventPublic, toCalendarEvent } from '../utils/event-format';

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

  const publicEvents = useMemo(
    () => events.filter(isEventPublic),
    [events],
  );

  const getEventById = useCallback((id) => {
    const event = publicEvents.find((item) => item.id === id);
    if (!event) return null;
    return { event, past: event.past };
  }, [publicEvents]);

  const upcomingTop = useMemo(() => getTopUpcoming(publicEvents, 3), [publicEvents]);
  const pastTop = useMemo(() => getTopPast(publicEvents, 3), [publicEvents]);
  const calendarEvents = useMemo(() => publicEvents.map(toCalendarEvent), [publicEvents]);

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
