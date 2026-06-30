import { Routes, Route, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import HomeRoute from './components/HomeRoute';
import SlugRoute from './components/SlugRoute';
import EventPage, { EventLegacyIdRedirect } from './pages/EventPage';
import EventShareEditPage from './pages/EventShareEditPage';
import BlogPostPage from './pages/BlogPostPage';
import AdminPage from './pages/AdminPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminEventsPage from './pages/AdminEventsPage';
import AdminBlogPostsPage from './pages/AdminBlogPostsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminPagesPage from './pages/AdminPagesPage';
import AdminMenuPage from './pages/AdminMenuPage';
import AdminColorsPage from './pages/AdminColorsPage';
import { EventsProvider } from './contexts/EventsContext';
import { BlogPostsProvider } from './contexts/BlogPostsContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { SiteSettingsProvider } from './contexts/SiteSettingsContext';
import { SiteMenuProvider } from './contexts/SiteMenuContext';
import { SiteColorsProvider } from './contexts/SiteColorsContext';
import { PagesProvider } from './contexts/PagesContext';
import { usePageTransition } from './hooks/usePageTransition';
import { useScrollRestore } from './hooks/useScrollRestore';
import { useAppBoot } from './hooks/useAppBoot';

function isStandaloneRoute(pathname) {
  return pathname.startsWith('/share/') || pathname.startsWith('/admin');
}

function EventLegacyQueryRedirect() {
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
  useAppBoot({ minDelay: isStandaloneRoute(location.pathname) ? 0 : 900 });

  return (
    <Routes location={location}>
      <Route path="share/event/:shareId" element={<EventShareEditPage />} />
      <Route element={<Layout />}>
        <Route index element={<HomeRoute />} />
        {LEGACY_REDIRECTS.map(({ from, to }) => (
          <Route key={from} path={from} element={<Navigate to={to} replace />} />
        ))}
        <Route path="blog/:postSlug" element={<BlogPostPage />} />
        <Route path="akce/:eventSlug" element={<EventPage />} />
        <Route path="event/:legacyId" element={<EventLegacyIdRedirect />} />
        <Route path="event.html" element={<EventLegacyQueryRedirect />} />
        <Route path=":slug" element={<SlugRoute />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="events" element={<AdminEventsPage />} />
        <Route path="blog" element={<AdminBlogPostsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="pages" element={<AdminPagesPage />} />
        <Route path="menu" element={<AdminMenuPage />} />
        <Route path="colors" element={<AdminColorsPage />} />
      </Route>
    </Routes>
  );
}

export default function App({ ssrData = null }) {
  return (
    <AdminAuthProvider>
      <SiteColorsProvider initialColors={ssrData?.siteColors}>
        <SiteSettingsProvider initialSettings={ssrData?.siteSettings}>
          <PagesProvider initialPages={ssrData?.pages}>
            <SiteMenuProvider initialMenu={ssrData?.siteMenu}>
              <EventsProvider initialEvents={ssrData?.events}>
                <BlogPostsProvider initialPosts={ssrData?.blogPosts}>
                  <NotificationsProvider initialNotifications={ssrData?.notifications}>
                    <AppRoutes />
                  </NotificationsProvider>
                </BlogPostsProvider>
              </EventsProvider>
            </SiteMenuProvider>
          </PagesProvider>
        </SiteSettingsProvider>
      </SiteColorsProvider>
    </AdminAuthProvider>
  );
}
