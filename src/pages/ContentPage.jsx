import { useEffect } from 'react';
import SectionLabel from '../components/SectionLabel';

export default function ContentPage({ page }) {
  useEffect(() => {
    if (!page?.title) return;
    document.title = `${page.title} — Komunita Popcorn`;
  }, [page?.title]);

  if (!page) return null;

  return (
    <section className="section content-page-section">
      <div className="container">
        <SectionLabel label={page.title} />
      </div>
      <div className="content-page" />
    </section>
  );
}
