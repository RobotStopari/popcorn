import { Link } from 'react-router-dom';
import { pagePath } from '../data/pages';
import { useEvents } from '../contexts/EventsContext';
import { usePages } from '../contexts/PagesContext';
import EventCard from './EventCard';
import SectionLabel from './SectionLabel';

export default function UpcomingEvents() {
  const { upcomingTop, loading } = useEvents();
  const { getEventsUpcomingPage } = usePages();
  const listPage = getEventsUpcomingPage();
  const label = listPage?.title || 'VyPUKne';
  const href = listPage ? pagePath(listPage) : '/vypukne';

  return (
    <section className="section" id="upcoming">
      <div className="container">
        <SectionLabel label={label} />
        {loading ? (
          <p className="section__empty">Načítám akce…</p>
        ) : (
          <div className={`cards-grid reveal-stagger${upcomingTop.length > 0 && upcomingTop.length < 3 ? ` cards-grid--${upcomingTop.length}` : ''}`}>
            {upcomingTop.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
        {!loading && !upcomingTop.length && (
          <p className="section__empty">Zatím žádné nadcházející akce.</p>
        )}
        <div className="section__cta reveal">
          <Link to={href} className="btn btn--primary">
            Všechny nadcházející akce
          </Link>
        </div>
      </div>
    </section>
  );
}
