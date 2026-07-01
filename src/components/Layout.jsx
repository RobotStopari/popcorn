import { Outlet } from 'react-router-dom';
import { useLoader } from '../hooks/useLoader';
import { useNavbar } from '../hooks/useNavbar';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { usePages } from '../contexts/PagesContext';
import { COMING_SOON_PAGE_ID } from '../data/pages';
import ContentPage from '../pages/ContentPage';
import Loader from './Loader';
import PageDots from './PageDots';
import Navbar from './Navbar';
import Footer from './Footer';
import SiteNotificationsPopup from './SiteNotificationsPopup';

export default function Layout() {
  const loading = useLoader();
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { getPageById, loading: pagesLoading } = usePages();
  useNavbar();
  useScrollReveal();

  const showComingSoon = !settingsLoading && settings.comingSoonEnabled;
  const comingSoonPage = showComingSoon ? getPageById(COMING_SOON_PAGE_ID) : null;

  if (showComingSoon) {
    return (
      <>
        {loading && <Loader />}
        <div className="page-curtain" aria-hidden="true" />
        <Navbar minimal />
        <main className="page-main">
          <PageDots />
          {pagesLoading || !comingSoonPage ? (
            <section className="section content-page-section">
              <div className="container">
                <p className="section__empty">Načítám stránku…</p>
              </div>
            </section>
          ) : (
            <ContentPage page={comingSoonPage} />
          )}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      {loading && <Loader />}
      <div className="page-curtain" aria-hidden="true" />
      <Navbar />
      <main className="page-main">
        <PageDots />
        <Outlet />
      </main>
      <Footer />
      <SiteNotificationsPopup />
    </>
  );
}
