import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomeRoute from './components/HomeRoute';
import SlugRoute from './components/SlugRoute';
import EventPage from './pages/EventPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminBlogPostsPage from './pages/AdminBlogPostsPage';
import AdminTextsPage from './pages/AdminTextsPage';
import AdminPagesPage from './pages/AdminPagesPage';
import AdminMenuPage from './pages/AdminMenuPage';
import { EventsProvider } from './contexts/EventsContext';
import { BlogPostsProvider } from './contexts/BlogPostsContext';
import { SiteTextsProvider } from './contexts/SiteTextsContext';
import { SiteMenuProvider } from './contexts/SiteMenuContext';
import { PagesProvider } from './contexts/PagesContext';
import { usePageTransition } from './hooks/usePageTransition';
import { useScrollRestore } from './hooks/useScrollRestore';

function EventLegacyRedirect() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/event/${id}`} replace />;
}

const LEGACY_REDIRECTS = [
  { from: 'akce/vypukne', to: '/vypukne' },
  { from: 'akce/probehle', to: '/probehle' },
  { from: 'akce/usporadej', to: '/usporadej' },
  { from: 'o-popcornu/co-je-popcorn', to: '/co-je-popcorn' },
  { from: 'o-popcornu/vedeni-kontakt', to: '/vedeni-kontakt' },
  { from: 'o-popcornu/pro-novacky', to: '/pro-novacky' },
  { from: 'inspirace/blog', to: '/blog' },
  { from: 'inspirace/odkazy', to: '/odkazy' },
];

function AppRoutes() {
  const location = useLocation();
  useScrollRestore();
  usePageTransition(location);

  return (
    <Routes location={location}>
      <Route element={<Layout />}>
        <Route index element={<HomeRoute />} />
        {LEGACY_REDIRECTS.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="blog/:postSlug" element={<BlogPostPage />} />
        <Route path="event/:id" element={<EventPage />} />
        <Route path="event.html" element={<EventLegacyRedirect />} />
        <Route path=":slug" element={<SlugRoute />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="blog" element={<AdminBlogPostsPage />} />
        <Route path="texts" element={<AdminTextsPage />} />
        <Route path="pages" element={<AdminPagesPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <SiteTextsProvider>
        <PagesProvider>
          <SiteMenuProvider>
            <EventsProvider>
              <BlogPostsProvider>
                <AppRoutes />
              </BlogPostsProvider>
            </EventsProvider>
          </SiteMenuProvider>
        </PagesProvider>
      </SiteTextsProvider>
    </AdminAuthProvider>
  );
}
