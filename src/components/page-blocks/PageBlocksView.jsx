import { useEffect } from 'react';
import { useEvents } from '../../contexts/EventsContext';
import { useImageFrames } from '../../hooks/useImageFrames';
import { useParallax } from '../../hooks/useParallax';
import { getBlockGapAfterStyle, getBlocksForPage } from '../../utils/page-blocks';
import { siteDocumentTitle } from '../../utils/admin-text';
import PageBlockRenderer from './PageBlockRenderer';

export default function PageBlocksView({ page, variant = 'home' }) {
  const { upcomingTop, pastTop, loading } = useEvents();
  const eventRevealKey = [...upcomingTop, ...pastTop].map((event) => event.id).join(',');
  const blocks = getBlocksForPage(page);
  const parallaxKey = blocks.map((block) => block.id).join(':');

  useParallax(parallaxKey);
  useImageFrames([loading, eventRevealKey, blocks.length]);

  useEffect(() => {
    if (!page?.title) return;
    document.title = variant === 'home'
      ? page.title
      : siteDocumentTitle(page.title);
  }, [page?.title, variant]);

  if (!blocks.length) return null;

  return (
    <div className={`page-blocks page-blocks--${variant}`}>
      {blocks.map((block, index) => {
        const isLast = index === blocks.length - 1;
        const gapStyle = isLast ? undefined : getBlockGapAfterStyle(block.gapAfterRem);

        return (
          <div
            key={block.id}
            className={`page-blocks__item${index === 0 ? ' page-blocks__item--first' : ''}`}
            style={gapStyle}
          >
            <PageBlockRenderer block={block} variant={variant} />
          </div>
        );
      })}
    </div>
  );
}
