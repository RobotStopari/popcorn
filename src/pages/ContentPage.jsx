import PageBlocksView from '../components/page-blocks/PageBlocksView';

export default function ContentPage({ page }) {
  if (!page) return null;

  return (
    <section className="section content-page-section">
      <PageBlocksView page={page} variant="content" />
    </section>
  );
}
