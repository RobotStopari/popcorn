import { Outlet } from 'react-router-dom';
import { useLoader } from '../hooks/useLoader';
import { useNavbar } from '../hooks/useNavbar';
import { useScrollReveal } from '../hooks/useScrollReveal';
import Loader from './Loader';
import PageDots from './PageDots';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const loading = useLoader();
  useNavbar();
  useScrollReveal();

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
    </>
  );
}
