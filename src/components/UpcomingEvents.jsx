import { Link } from 'react-router-dom';
import { pagePath } from '../data/pages';
import { useEvents } from '../contexts/EventsContext';
import { usePages } from '../contexts/PagesContext';
import EventCard from './EventCard';
import SectionLabel from './SectionLabel';
import { siteText } from '../utils/admin-text';

export default function UpcomingEvents() {
  const { upcomingTop, loading } = useEvents();
  const { getEventsUpcomingPage } = usePages();
  const listPage = getEventsUpcomingPage();
  const label = listPage?.title || siteText('events.upcoming.fallbackTitle');
  const href = listPage ? pagePath(listPage) : '/vypukne';

  return (
    <section className="section" id="upcoming">
      <div className="container">
        <SectionLabel label={label} />
        {loading ? (
          <p className="section__empty">{siteText('events.list.loading')}</p>
        ) : (
          <div className="cards-grid reveal-stagger">
            {upcomingTop.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
        {!loading && !upcomingTop.length && (
          <p className="section__empty">{siteText('events.list.emptyUpcoming')}</p>
        )}
        <div className="section__cta reveal">
          <Link to={href} className="btn btn--primary">
            {siteText('events.upcoming.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
