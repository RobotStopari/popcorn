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
import { toCalendarEvent } from '../utils/event-format';

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

  const getEventById = useCallback((id) => {
    const event = events.find((item) => item.id === id);
    if (!event) return null;
    return { event, past: event.past };
  }, [events]);

  const upcomingTop = useMemo(() => getTopUpcoming(events, 3), [events]);
  const pastTop = useMemo(() => getTopPast(events, 3), [events]);
  const calendarEvents = useMemo(() => events.map(toCalendarEvent), [events]);

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
