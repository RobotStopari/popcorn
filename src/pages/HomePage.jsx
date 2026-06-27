import { useEffect } from 'react';
import Calendar from '../components/Calendar';
import FlowConnector from '../components/FlowConnector';
import Hero from '../components/Hero';
import ParallaxSection from '../components/ParallaxSection';
import PastEvents from '../components/PastEvents';
import UpcomingEvents from '../components/UpcomingEvents';
import { useEvents } from '../contexts/EventsContext';
import { useImageFrames } from '../hooks/useImageFrames';
import { useParallax } from '../hooks/useParallax';

export default function HomePage({ page }) {
  const { upcomingTop, pastTop, loading } = useEvents();
  const eventRevealKey = [...upcomingTop, ...pastTop].map((event) => event.id).join(',');

  useParallax();
  useImageFrames([loading, eventRevealKey]);

  useEffect(() => {
    document.title = page?.title || 'Komunita Popcorn';
  }, [page?.title]);

  return (
    <>
      <Hero />
      <UpcomingEvents />
      <ParallaxSection />
      <PastEvents />
      <FlowConnector />
      <Calendar />
    </>
  );
}
