import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useLoader } from '../hooks/useLoader';
import { useNavbar } from '../hooks/useNavbar';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import ComingSoonPage from './ComingSoonPage';
import Loader from './Loader';
import PageDots from './PageDots';
import Navbar from './Navbar';
import Footer from './Footer';
import SiteNotificationsPopup from './SiteNotificationsPopup';

export default function Layout() {
  const loading = useLoader();
  const { settings, loading: settingsLoading } = useSiteSettings();
  useNavbar();
  useScrollReveal();

  const showComingSoon = !settingsLoading && settings.comingSoonEnabled;

  useEffect(() => {
    if (!showComingSoon) return undefined;

    document.body.classList.add('coming-soon-active');
    return () => {
      document.body.classList.remove('coming-soon-active');
    };
  }, [showComingSoon]);

  if (showComingSoon) {
    return (
      <>
        {loading && <Loader />}
        <div className="page-curtain" aria-hidden="true" />
        <Navbar minimal />
        <main className="page-main page-main--coming-soon">
          <PageDots />
          <ComingSoonPage />
        </main>
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
