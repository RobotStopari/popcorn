import { useEffect } from 'react';
import { useEvents } from '../../contexts/EventsContext';
import { useImageFrames } from '../../hooks/useImageFrames';
import { useParallax } from '../../hooks/useParallax';
import { getBlocksForPage } from '../../utils/page-blocks';
import PageBlockRenderer from './PageBlockRenderer';

export default function PageBlocksView({ page, variant = 'home' }) {
  const { upcomingTop, pastTop, loading } = useEvents();
  const eventRevealKey = [...upcomingTop, ...pastTop].map((event) => event.id).join(',');
  const blocks = getBlocksForPage(page);
  const parallaxKey = blocks.map((block) => block.id).join(',');

  useParallax(parallaxKey);
  useImageFrames([loading, eventRevealKey, blocks.length]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = variant === 'home'
      ? page.title
      : `${page.title} — Komunita Popcorn`;
  }, [page?.title, variant]);

  if (!blocks.length) return null;

  return (
    <div className={`page-blocks page-blocks--${variant}`}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`page-blocks__item${index === 0 ? ' page-blocks__item--first' : ''}`}
        >
          <PageBlockRenderer block={block} variant={variant} />
        </div>
      ))}
    </div>
  );
}
