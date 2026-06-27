import HomePage from '../pages/HomePage';
import ContentPage from '../pages/ContentPage';
import EventsListPage from './EventsListPage';
import BlogListPage from './BlogListPage';
import { PAGE_TYPES } from '../data/pages';

export default function PageRenderer({ page }) {
  if (!page) return null;

  switch (page.type) {
    case PAGE_TYPES.home:
      return <HomePage key={page.id} page={page} />;
    case PAGE_TYPES.eventsUpcoming:
      return <EventsListPage key={page.id} page={page} variant="upcoming" />;
    case PAGE_TYPES.eventsPast:
      return <EventsListPage key={page.id} page={page} variant="past" />;
    case PAGE_TYPES.blogList:
      return <BlogListPage key={page.id} page={page} />;
    case PAGE_TYPES.content:
    default:
      return <ContentPage key={page.id} page={page} />;
  }
}
