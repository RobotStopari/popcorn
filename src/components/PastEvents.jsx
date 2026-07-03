import { Link } from 'react-router-dom';
import { pagePath } from '../data/pages';
import { useEvents } from '../contexts/EventsContext';
import { usePages } from '../contexts/PagesContext';
import EventCard from './EventCard';
import SectionLabel from './SectionLabel';
import { siteText } from '../utils/admin-text';

export default function PastEvents() {
  const { pastTop, loading } = useEvents();
  const { getEventsPastPage, getPageById } = usePages();
  const listPage = getEventsPastPage();
  const organizePage = getPageById('usporadej');
  const label = listPage?.title || siteText('events.past.fallbackTitle');
  const pastHref = listPage ? pagePath(listPage) : '/probehle';
  const organizeHref = organizePage ? pagePath(organizePage) : '/usporadej';

  return (
    <section className="section" id="past">
      <div className="container">
        <SectionLabel label={label} />
        {loading ? (
          <p className="section__empty">{siteText('events.list.loading')}</p>
        ) : (
          <div className="cards-grid reveal-stagger">
            {pastTop.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} past />
            ))}
          </div>
        )}
        {!loading && !pastTop.length && (
          <p className="section__empty">{siteText('events.list.emptyPast')}</p>
        )}
        <div className="section__cta section__cta--double reveal-stagger">
          <Link to={pastHref} className="btn btn--primary reveal">
            {siteText('events.past.viewAll')}
          </Link>
          <Link to={organizeHref} className="btn btn--secondary reveal">
            {siteText('events.past.organizeCta')}
          </Link>
        </div>
      </div>
    </section>
  );
}
