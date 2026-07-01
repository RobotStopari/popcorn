import { useMemo, useState } from 'react';
import Calendar from '../Calendar';
import FlowConnector from '../FlowConnector';
import InstagramFeed from '../InstagramFeed';
import Lightbox from '../Lightbox';
import ParallaxSection, { ParallaxSocialSection } from '../ParallaxSection';
import PastEvents from '../PastEvents';
import UpcomingEvents from '../UpcomingEvents';
import SectionLabel from '../SectionLabel';
import { PAGE_BLOCK_TYPES } from '../../data/page-blocks';
import { getEventCoverStyle } from '../../utils/event-cover-pattern';
import { getImageTextGridStyle, getImageTripletBlockStyle, getNegativeSpaceBlockStyle, getReferenceGridStyle, getSpaceBlockStyle, getWideImageBlockStyle, isReferenceWideLayout } from '../../utils/page-blocks';
import { buildYoutubeEmbedHtml, transformRichTextForDisplay } from '../../utils/rich-text-embeds';
import MedallionsBlock from './MedallionsBlock';
import PageBlockLinkButton from './PageBlockLinkButton';

function CitationBlock({ block }) {
  const boldClass = block.bold !== false ? '' : ' hero__text--regular';

  return (
    <section className="hero page-block page-block--citation">
      <div className="hero__quote reveal reveal--scale">
        <h1 className={`hero__text${boldClass}`}>
          <span className="hero__mark hero__mark--open" aria-hidden="true">„</span>
          {block.text}
          <span className="hero__mark hero__mark--close" aria-hidden="true">“</span>
        </h1>
      </div>
    </section>
  );
}

function CitationSmallBlock({ block }) {
  if (!block.text?.trim()) return null;

  const boldClass = block.bold !== false ? '' : ' page-block__citation-small--regular';

  return (
    <section className="page-block page-block--citation-small reveal">
      <div className="container">
        <div className="page-block__content">
          <blockquote className={`page-block__citation-small${boldClass}`}>
            <span className="page-block__citation-small-mark page-block__citation-small-mark--open" aria-hidden="true">„</span>
            {block.text}
            <span className="page-block__citation-small-mark page-block__citation-small-mark--close" aria-hidden="true">“</span>
          </blockquote>
        </div>
      </div>
    </section>
  );
}

function RichTextBlock({ html, align, className }) {
  const displayHtml = useMemo(() => transformRichTextForDisplay(html), [html]);

  if (!html?.trim()) return null;

  return (
    <div
      className={`page-block__rich-text ${className}`.trim()}
      style={{ textAlign: align }}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}

function getLightboxOpenLabel(alt, fallbackIndex) {
  const trimmed = alt?.trim();
  if (trimmed) return `Otevřít obrázek: ${trimmed}`;
  if (fallbackIndex !== undefined) return `Otevřít obrázek ${fallbackIndex + 1}`;
  return 'Otevřít obrázek';
}

function getImageBorderClass(borderEnabled) {
  return borderEnabled !== false ? '' : ' page-block__image-frame--borderless';
}

function WideImageBlock({ block }) {
  const [openIndex, setOpenIndex] = useState(null);
  const hasPhoto = Boolean(block.imageUrl?.trim());
  const lightboxEnabled = block.lightboxEnabled !== false;
  const borderClass = getImageBorderClass(block.borderEnabled);
  const patternStyle = hasPhoto ? null : getEventCoverStyle(block.id);
  const layoutStyle = getWideImageBlockStyle(block.maxWidthPercent);

  const lightboxImages = useMemo(() => (
    hasPhoto
      ? [{ src: block.imageUrl, alt: block.imageAlt || '' }]
      : []
  ), [block.imageUrl, block.imageAlt, hasPhoto]);

  const imageElement = (
    <img
      src={block.imageUrl}
      alt={block.imageAlt || ''}
      className="page-block__wide-image-img"
      loading="lazy"
      decoding="async"
      onLoad={(event) => {
        event.currentTarget.parentElement?.classList.add('is-loaded');
      }}
    />
  );

  return (
    <section className="page-block page-block--wide-image reveal">
      <div className="container">
        <figure className="page-block__wide-image" style={layoutStyle}>
          {hasPhoto ? (
            <>
              {lightboxEnabled ? (
                <button
                  type="button"
                  className={`page-block__wide-image-open img-frame${borderClass}`}
                  onClick={() => setOpenIndex(0)}
                  aria-label={getLightboxOpenLabel(block.imageAlt)}
                >
                  {imageElement}
                </button>
              ) : (
                <div className={`page-block__wide-image-open page-block__wide-image-open--static img-frame is-loaded${borderClass}`}>
                  {imageElement}
                </div>
              )}
              {lightboxEnabled && (
                <Lightbox
                  images={lightboxImages}
                  openIndex={openIndex}
                  onClose={() => setOpenIndex(null)}
                />
              )}
            </>
          ) : (
            <div
              className="page-block__wide-image-pattern"
              style={patternStyle}
              role="img"
              aria-label={block.imageAlt || 'Dekorativní textura'}
            />
          )}
        </figure>
      </div>
    </section>
  );
}

function ImageTripletBlock({ block }) {
  const [openIndex, setOpenIndex] = useState(null);
  const images = block.images || [];
  const lightboxEnabled = block.lightboxEnabled !== false;
  const borderClass = getImageBorderClass(block.borderEnabled);
  const layoutStyle = getImageTripletBlockStyle({
    maxWidthPercent: block.maxWidthPercent,
    gapRem: block.gapRem,
  });

  const lightboxImages = useMemo(() => (
    images
      .filter((image) => image?.imageUrl?.trim())
      .map((image) => ({
        src: image.imageUrl,
        alt: image.imageAlt || '',
      }))
  ), [images]);

  const visibleImages = images.filter((image) => image?.imageUrl?.trim());
  const slots = visibleImages.length > 0 ? visibleImages : images;

  if (!slots.length) return null;

  return (
    <section className="page-block page-block--image-triplet reveal">
      <div className="container">
        <div className="page-block__image-triplet" style={layoutStyle}>
          {slots.map((image, index) => {
            const hasPhoto = Boolean(image?.imageUrl?.trim());
            const seed = image?.id || `${block.id}-${index}`;
            const lightboxIndex = hasPhoto
              ? lightboxImages.findIndex((item) => item.src === image.imageUrl)
              : -1;

            const imageElement = (
              <img
                src={image.imageUrl}
                alt={image.imageAlt || ''}
                className="page-block__image-triplet-img"
                loading="lazy"
                decoding="async"
                onLoad={(event) => {
                  event.currentTarget.parentElement?.classList.add('is-loaded');
                }}
              />
            );

            return (
              <figure key={`${block.id}-${index}`} className="page-block__image-triplet-item">
                {hasPhoto ? (
                  lightboxEnabled ? (
                    <button
                      type="button"
                      className={`page-block__image-triplet-open img-frame${borderClass}`}
                      onClick={() => setOpenIndex(lightboxIndex)}
                      aria-label={getLightboxOpenLabel(image.imageAlt, index)}
                    >
                      {imageElement}
                    </button>
                  ) : (
                    <div className={`page-block__image-triplet-open page-block__image-triplet-open--static img-frame is-loaded${borderClass}`}>
                      {imageElement}
                    </div>
                  )
                ) : (
                  <div
                    className={`page-block__image-triplet-pattern${borderClass}`}
                    style={getEventCoverStyle(seed)}
                    role="img"
                    aria-label={image.imageAlt || `Dekorativní textura ${index + 1}`}
                  />
                )}
              </figure>
            );
          })}
        </div>
      </div>

      {lightboxEnabled && (
        <Lightbox
          images={lightboxImages}
          openIndex={openIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </section>
  );
}

function ReferenceBlock({ block }) {
  const reversedClass = block.reversed ? ' page-block__reference--reversed' : '';
  const hasPhoto = Boolean(block.imageUrl?.trim());
  const borderClass = getImageBorderClass(block.borderEnabled);
  const align = block.align || 'left';
  const boldClass = block.bold !== false ? '' : ' page-block__reference-quote--regular';
  const wideClass = isReferenceWideLayout(block.text) ? ' page-block__reference-grid--wide' : '';
  const gridStyle = getReferenceGridStyle({ gapRem: block.gapRem });
  const patternStyle = useMemo(
    () => (hasPhoto ? null : getEventCoverStyle(block.id)),
    [hasPhoto, block.id],
  );
  const displayName = (block.name || block.imageAlt || '').trim();
  const imageAlt = displayName;

  if (!hasPhoto && !block.text?.trim()) return null;

  return (
    <section className={`page-block page-block--reference reveal${reversedClass}`}>
      <div className="container">
        <div className="page-block__content">
          <div className={`page-block__reference-grid${wideClass}`} style={gridStyle}>
            <div className="page-block__reference-media">
              {hasPhoto ? (
                <div className={`page-block__reference-portrait img-frame${borderClass}`}>
                  <img
                    src={block.imageUrl}
                    alt={imageAlt}
                    className="page-block__reference-portrait-img"
                    loading="lazy"
                    decoding="async"
                    onLoad={(event) => {
                      event.currentTarget.parentElement?.classList.add('is-loaded');
                    }}
                  />
                </div>
              ) : (
                <div
                  className={`page-block__reference-portrait page-block__reference-portrait--pattern${borderClass}`}
                  style={patternStyle}
                  aria-hidden="true"
                />
              )}
              {displayName ? (
                <p className="page-block__reference-name">{displayName}</p>
              ) : null}
            </div>
            {block.text?.trim() ? (
              <blockquote className={`page-block__reference-quote page-block__reference-quote--${align}${boldClass}`}>
                <span className="page-block__reference-quote-mark page-block__reference-quote-mark--open" aria-hidden="true">„</span>
                {block.text}
                <span className="page-block__reference-quote-mark page-block__reference-quote-mark--close" aria-hidden="true">“</span>
              </blockquote>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function ImageTextBlock({ block }) {
  const [openIndex, setOpenIndex] = useState(null);
  const reversedClass = block.reversed ? ' page-block__image-text--reversed' : '';
  const hasPhoto = Boolean(block.imageUrl?.trim());
  const lightboxEnabled = block.lightboxEnabled !== false;
  const borderClass = getImageBorderClass(block.borderEnabled);
  const gridStyle = getImageTextGridStyle({
    imageSharePercent: block.imageSharePercent,
    gapRem: block.gapRem,
  });
  const patternStyle = useMemo(
    () => (hasPhoto ? null : getEventCoverStyle(block.id)),
    [hasPhoto, block.id],
  );

  const lightboxImages = useMemo(() => (
    block.imageUrl
      ? [{ src: block.imageUrl, alt: block.imageAlt || '' }]
      : []
  ), [block.imageUrl, block.imageAlt]);

  const openLabel = getLightboxOpenLabel(block.imageAlt);

  return (
    <section className={`page-block page-block--image-text reveal${reversedClass}`}>
      <div className="container">
        <div className="page-block__content">
          <div className="page-block__image-text-grid" style={gridStyle}>
            <div className="page-block__image-text-media">
              {block.imageUrl ? (
                <>
                  {lightboxEnabled ? (
                    <button
                      type="button"
                      className={`page-block__image-text-open img-frame${borderClass}`}
                      onClick={() => setOpenIndex(0)}
                      aria-label={openLabel}
                    >
                      <img
                        src={block.imageUrl}
                        alt={block.imageAlt || ''}
                        className="page-block__image-text-img"
                        loading="lazy"
                        decoding="async"
                        onLoad={(event) => {
                          event.currentTarget.parentElement?.classList.add('is-loaded');
                        }}
                      />
                    </button>
                  ) : (
                    <div className={`page-block__image-text-open page-block__image-text-open--static img-frame is-loaded${borderClass}`}>
                      <img
                        src={block.imageUrl}
                        alt={block.imageAlt || ''}
                        className="page-block__image-text-img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  {lightboxEnabled && (
                    <Lightbox
                      images={lightboxImages}
                      openIndex={openIndex}
                      onClose={() => setOpenIndex(null)}
                    />
                  )}
                </>
              ) : (
                <div
                  className={`page-block__image-text-placeholder page-block__image-text-placeholder--pattern${borderClass}`}
                  style={patternStyle}
                  aria-hidden="true"
                />
              )}
            </div>
            <RichTextBlock
              html={block.html}
              align={block.align}
              className="page-block__image-text-copy blog-detail__body"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PageBlockRenderer({ block, variant = 'home' }) {
  if (!block?.type) return null;

  switch (block.type) {
    case PAGE_BLOCK_TYPES.citation:
      return <CitationBlock block={block} />;

    case PAGE_BLOCK_TYPES.citationSmall:
      return <CitationSmallBlock block={block} />;

    case PAGE_BLOCK_TYPES.h1:
      if (!block.text?.trim()) return null;
      return (
        <section className="page-block page-block--h1-label">
          <div className="container">
            <SectionLabel label={block.text} as="h1" />
          </div>
        </section>
      );

    case PAGE_BLOCK_TYPES.h2:
      if (!block.text?.trim()) return null;
      return (
        <section className={`page-block page-block--h2 page-block--align-${block.align || 'left'}`}>
          <div className="container">
            <div className="page-block__content">
              <h2 className="page-block__h2 blog-detail__title">{block.text}</h2>
            </div>
          </div>
        </section>
      );

    case PAGE_BLOCK_TYPES.paragraph:
      if (!block.html?.trim()) return null;
      return (
        <section className={`page-block page-block--paragraph page-block--align-${block.align} reveal`}>
          <div className="container">
            <div className="page-block__content">
              <RichTextBlock html={block.html} align={block.align} className="blog-detail__body" />
            </div>
          </div>
        </section>
      );

    case PAGE_BLOCK_TYPES.imageText:
      return <ImageTextBlock block={block} />;

    case PAGE_BLOCK_TYPES.reference:
      return <ReferenceBlock block={block} />;

    case PAGE_BLOCK_TYPES.upcomingEvents:
      return <UpcomingEvents />;

    case PAGE_BLOCK_TYPES.pastEvents:
      return <PastEvents />;

    case PAGE_BLOCK_TYPES.calendar:
      return <Calendar />;

    case PAGE_BLOCK_TYPES.divider:
      return <FlowConnector />;

    case PAGE_BLOCK_TYPES.socials:
      return <ParallaxSocialSection block={block} />;

    case PAGE_BLOCK_TYPES.parallaxImage:
      return <ParallaxSection imageUrl={block.imageUrl} heightVh={block.heightVh} overlay={block} patternSeed={block.id} />;

    case PAGE_BLOCK_TYPES.instagramFeed:
      return <InstagramFeed />;

    case PAGE_BLOCK_TYPES.wideImage:
      return <WideImageBlock block={block} />;

    case PAGE_BLOCK_TYPES.imageTriplet:
      return <ImageTripletBlock block={block} />;

    case PAGE_BLOCK_TYPES.button: {
      if (!block.label?.trim() || !block.href?.trim()) return null;
      return (
        <section className="page-block page-block--button reveal">
          <div className="container">
            <div className="page-block__button-row">
              <PageBlockLinkButton
                label={block.label}
                href={block.href}
                openInNewTab={block.openInNewTab}
                color={block.color}
                large
              />
            </div>
          </div>
        </section>
      );
    }

    case PAGE_BLOCK_TYPES.buttonPair: {
      const buttons = (block.buttons || []).filter(
        (button) => button?.label?.trim() && button?.href?.trim(),
      );
      if (!buttons.length) return null;
      return (
        <section className="page-block page-block--button-pair reveal">
          <div className="container">
            <div className="page-block__button-pair">
              {buttons.map((button, index) => (
                <PageBlockLinkButton
                  key={`${block.id}-${index}`}
                  label={button.label}
                  href={button.href}
                  openInNewTab={button.openInNewTab}
                  color={button.color}
                />
              ))}
            </div>
          </div>
        </section>
      );
    }

    case PAGE_BLOCK_TYPES.youtube:
      if (!block.videoId?.trim()) return null;
      return (
        <section className="page-block page-block--youtube reveal">
          <div className="container">
            <div className="page-block__content blog-detail__body">
              <div
                className="rich-text__youtube"
                dangerouslySetInnerHTML={{
                  __html: buildYoutubeEmbedHtml(block.videoId, block.title),
                }}
              />
            </div>
          </div>
        </section>
      );

    case PAGE_BLOCK_TYPES.space:
      return (
        <div
          className="page-block page-block--space"
          style={getSpaceBlockStyle(block.heightRem)}
          aria-hidden="true"
        />
      );

    case PAGE_BLOCK_TYPES.negativeSpace:
      return (
        <div
          className="page-block page-block--negative-space"
          style={getNegativeSpaceBlockStyle(block.pullRem)}
          aria-hidden="true"
        />
      );

    case PAGE_BLOCK_TYPES.medallions:
      return <MedallionsBlock block={block} />;

    default:
      return null;
  }
}
