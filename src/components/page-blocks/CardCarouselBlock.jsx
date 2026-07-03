import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { pagePath } from '../../data/pages';
import { usePages } from '../../contexts/PagesContext';
import { ICONS } from '../../data/icons';
import { resolveMenuLink } from '../../services/site-menu';
import { getEventCoverStyle } from '../../utils/event-cover-pattern';
import { carouselCardHasContent } from '../../utils/page-blocks';
import { trackNavClick, trackOutboundClick } from '../../utils/analytics-track';

const SWIPE_THRESHOLD = 48;

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function createSessionCarousel(cards) {
  const shuffled = shuffleArray(cards);
  const count = shuffled.length;
  const startIndex = count ? Math.floor(Math.random() * count) : 0;
  return { shuffled, startIndex };
}

function isInternalHref(href) {
  return href.startsWith('/') && !href.startsWith('//');
}

function getCarouselLinkLabel(card, resolved, pages) {
  if (!resolved?.href || resolved.href === '#') return '';

  if (card.linkType === 'page' && card.pageId) {
    const page = pages.find((entry) => entry.id === card.pageId);
    return page?.title?.trim() || pagePath(page) || resolved.href;
  }

  const href = resolved.href.trim();
  try {
    const url = new URL(href.includes('://') ? href : `https://${href}`);
    return url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '');
  } catch {
    return href;
  }
}

function CarouselArrow({ direction, onClick, label }) {
  return (
    <button
      type="button"
      className={`page-block__carousel-arrow page-block__carousel-arrow--${direction}`}
      onClick={onClick}
      aria-label={label}
    >
      <span
        className={`page-block__carousel-arrow-icon page-block__carousel-arrow-icon--${direction}`}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: ICONS.chevron }}
      />
    </button>
  );
}

function CarouselCover({ card }) {
  if (card.imageUrl) {
    return (
      <img
        src={card.imageUrl}
        alt={card.imageAlt || card.title || ''}
        className="page-block__carousel-cover-img"
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className="page-block__carousel-cover-pattern"
      style={getEventCoverStyle(card.id)}
      aria-hidden="true"
    />
  );
}

function CarouselCardContent({ card, resolved, pages }) {
  const linkLabel = getCarouselLinkLabel(card, resolved, pages);

  return (
    <>
      <div className="page-block__carousel-cover">
        <CarouselCover card={card} />
      </div>
      {linkLabel && (
        <div className="page-block__carousel-link-row">
          <span className="page-block__carousel-link-label">{linkLabel}</span>
          {resolved.external && (
            <span
              className="page-block__carousel-link-icon nav-link__external"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: ICONS.externalLink }}
            />
          )}
        </div>
      )}
      <div className="page-block__carousel-body">
        {card.title?.trim() && (
          <h3 className="page-block__carousel-title">{card.title.trim()}</h3>
        )}
        {card.description?.trim() && (
          <p className="page-block__carousel-description">{card.description.trim()}</p>
        )}
      </div>
    </>
  );
}

function CarouselCard({ card, resolved, pages, isActive }) {
  const className = [
    'page-block__carousel-card',
    isActive ? 'page-block__carousel-card--active' : '',
  ].filter(Boolean).join(' ');

  const content = <CarouselCardContent card={card} resolved={resolved} pages={pages} />;

  const linkLabel = getCarouselLinkLabel(card, resolved, pages);

  const handleLinkClick = () => {
    if (!resolved?.href) return;
    if (!resolved.external && isInternalHref(resolved.href)) {
      trackNavClick(resolved.href, linkLabel);
      return;
    }
    trackOutboundClick(resolved.href, linkLabel);
  };

  if (!resolved?.href || resolved.href === '#') {
    return (
      <article className={className} aria-hidden={!isActive}>
        {content}
      </article>
    );
  }

  const linkClassName = 'page-block__carousel-card-link';

  if (!resolved.external && isInternalHref(resolved.href)) {
    return (
      <article className={className} aria-hidden={!isActive}>
        <Link to={resolved.href} className={linkClassName} tabIndex={isActive ? 0 : -1} onClick={handleLinkClick}>
          {content}
        </Link>
      </article>
    );
  }

  return (
    <article className={className} aria-hidden={!isActive}>
      <a
        href={resolved.href}
        className={linkClassName}
        target={resolved.external ? '_blank' : undefined}
        rel={resolved.external ? 'noopener noreferrer' : undefined}
        tabIndex={isActive ? 0 : -1}
        onClick={handleLinkClick}
      >
        {content}
      </a>
    </article>
  );
}

export default function CardCarouselBlock({ block }) {
  const { pages } = usePages();
  const viewportRef = useRef(null);
  const touchStartX = useRef(null);

  const sourceCards = useMemo(
    () => (block.cards || []).filter((card) => carouselCardHasContent(card)),
    [block.cards],
  );

  const [session] = useState(() => createSessionCarousel(sourceCards));
  const shuffledCards = session.shuffled;

  const resolvedCards = useMemo(
    () => shuffledCards.map((card) => ({
      card,
      resolved: resolveMenuLink({ ...card, href: (card.href || '').trim() }, pages),
    })),
    [shuffledCards, pages],
  );

  const count = resolvedCards.length;
  const LOOP_COPIES = 5;
  const baseOffset = count * 2;
  const trackRef = useRef(null);
  const [position, setPosition] = useState(() => (
    session.shuffled.length * 2 + session.startIndex
  ));
  const [snapping, setSnapping] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const extendedCards = useMemo(() => {
    if (!count) return [];
    return Array.from({ length: LOOP_COPIES }, () => resolvedCards).flat();
  }, [count, resolvedCards]);

  const activeIndex = count ? ((position % count) + count) % count : 0;

  // After a boundary jump, force a synchronous reflow so re-enabling the
  // transition doesn't animate the snap — keeps the loop seamless with no gap.
  useLayoutEffect(() => {
    if (!snapping) return;
    if (trackRef.current) {
      // eslint-disable-next-line no-unused-expressions
      trackRef.current.offsetWidth;
    }
    setSnapping(false);
  }, [snapping, position]);

  const goTo = useCallback((nextPosition) => {
    setSnapping(false);
    setPosition(nextPosition);
  }, []);

  const goNext = useCallback(() => {
    goTo(position + 1);
  }, [goTo, position]);

  const goPrev = useCallback(() => {
    goTo(position - 1);
  }, [goTo, position]);

  const handleTransitionEnd = useCallback(() => {
    if (!count) return;

    if (position >= count * 3) {
      setSnapping(true);
      setPosition(position - count);
      return;
    }

    if (position < count * 2) {
      setSnapping(true);
      setPosition(position + count);
    }
  }, [count, position]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goNext();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goPrev();
    }
  }, [goNext, goPrev]);

  const handleTouchStart = useCallback((event) => {
    touchStartX.current = event.changedTouches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((event) => {
    if (touchStartX.current == null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta < 0) goNext();
    else goPrev();
  }, [goNext, goPrev]);

  if (!count) return null;

  return (
    <section className="page-block page-block--card-carousel reveal">
      <div
        className="page-block__carousel"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Karusel karet"
      >
        <CarouselArrow direction="prev" onClick={goPrev} label="Předchozí karta" />
        <div
          ref={viewportRef}
          className="page-block__carousel-viewport"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={trackRef}
            className={`page-block__carousel-track${snapping ? ' page-block__carousel-track--snapping' : ''}`}
            style={{
              '--carousel-position': position,
              transition: !snapping && !reducedMotion
                ? 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'none',
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {extendedCards.map(({ card, resolved }, index) => (
              <CarouselCard
                key={`${card.id}-${index}`}
                card={card}
                resolved={resolved}
                pages={pages}
                isActive={index === position}
              />
            ))}
          </div>
        </div>
        <CarouselArrow direction="next" onClick={goNext} label="Další karta" />

        <div className="page-block__carousel-dots" role="tablist" aria-label="Karty karuselu">
          {resolvedCards.map(({ card }, index) => (
            <button
              key={card.id}
              type="button"
              className={`page-block__carousel-dot${index === activeIndex ? ' page-block__carousel-dot--active' : ''}`}
              onClick={() => goTo(baseOffset + index)}
              aria-label={`Karta ${index + 1}: ${card.title}`}
              aria-selected={index === activeIndex}
              role="tab"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
