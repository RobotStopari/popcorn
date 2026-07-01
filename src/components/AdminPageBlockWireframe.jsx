import { useMemo } from 'react';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { resolveBlockSocialLinks } from '../utils/site-branding';
import { PAGE_BLOCK_TYPES } from '../data/page-blocks';
import { useSiteColors } from '../contexts/SiteColorsContext';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { getPageBlockButtonColorStyle } from '../utils/page-block-button-color';
import {
  getImageTextGridStyle,
  getImageTripletBlockStyle,
  getReferenceGridStyle,
  getWideImageBlockStyle,
  isReferenceWideLayout,
} from '../utils/page-blocks';
import { getParallaxOverlayBackground } from '../utils/parallax-overlay';
import { transformRichTextForDisplay } from '../utils/rich-text-embeds';

function stripHtml(html) {
  return (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function WireLines({ lines = 3, align = 'left' }) {
  const widths = ['92%', '78%', '64%'];
  return (
    <div className={`block-wireframe__lines block-wireframe__lines--${align}`}>
      {widths.slice(0, lines).map((width) => (
        <span key={width} className="block-wireframe__line" style={{ width }} />
      ))}
    </div>
  );
}

function WireSectionLabel({ text = 'Sekce' }) {
  return (
    <div className="block-wireframe__section-label">
      <span className="block-wireframe__section-line block-wireframe__section-line--red" />
      <span className="block-wireframe__section-text">{text}</span>
      <span className="block-wireframe__section-line block-wireframe__section-line--red" />
    </div>
  );
}

function WireEventCards({ count = 3 }) {
  return (
    <div className="block-wireframe__cards">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="block-wireframe__card">
          <span className="block-wireframe__card-image" />
          <span className="block-wireframe__card-line block-wireframe__card-line--title" />
          <span className="block-wireframe__card-line" />
          <span className="block-wireframe__card-btn" />
        </div>
      ))}
    </div>
  );
}

function WireCitation({ text, asHeading = false, small = false, bold = true, align = 'center' }) {
  const content = text?.trim();
  const Tag = asHeading ? 'h1' : 'p';
  const textRegularClass = bold !== false ? '' : small
    ? ' block-wireframe__citation-small-text--regular'
    : ' block-wireframe__citation-text--regular';
  const alignClass = small ? ` block-wireframe__citation-small--${align || 'center'}` : '';

  if (small) {
    return (
      <div className={`block-wireframe__citation-small${alignClass}`}>
        <span className="block-wireframe__citation-small-mark">„</span>
        {content ? (
          <p className={`block-wireframe__citation-small-text${textRegularClass}`}>{content}</p>
        ) : (
          <WireLines lines={2} align={align || 'center'} />
        )}
        <span className="block-wireframe__citation-small-mark">“</span>
      </div>
    );
  }

  return (
    <div className="block-wireframe__citation">
      <span className="block-wireframe__quote block-wireframe__quote--open">„</span>
      {content ? (
        <Tag className={`block-wireframe__citation-text${textRegularClass}`}>{content}</Tag>
      ) : (
        <WireLines lines={2} align="center" />
      )}
      <span className="block-wireframe__quote block-wireframe__quote--close">“</span>
    </div>
  );
}

function WireNarrow({ children }) {
  return <div className="block-wireframe__narrow">{children}</div>;
}

function WireHeading({ text, level = 1, align = 'left' }) {
  const content = text?.trim();
  return (
    <div
      className={`block-wireframe__heading block-wireframe__heading--h${level} block-wireframe__heading--${align}`}
    >
      {content || <span className="block-wireframe__line" style={{ width: level === 1 ? '72%' : '58%' }} />}
    </div>
  );
}

function WireParagraph({ html, align }) {
  const plain = stripHtml(html);
  const displayHtml = useMemo(() => transformRichTextForDisplay(html), [html]);

  if (!plain) {
    return <WireLines lines={3} align={align || 'left'} />;
  }

  return (
    <div
      className={`block-wireframe__rich block-wireframe__rich--${align || 'left'}`}
      dangerouslySetInnerHTML={{ __html: displayHtml }}
    />
  );
}

function WireImageText({ block }) {
  const reversed = block.reversed;
  const hasText = Boolean(stripHtml(block.html));
  const gridStyle = getImageTextGridStyle({
    imageSharePercent: block.imageSharePercent,
    gapRem: block.gapRem,
  });

  return (
    <div
      className={`block-wireframe__image-text${reversed ? ' block-wireframe__image-text--reversed' : ''}`}
      style={gridStyle}
    >
      <div className="block-wireframe__image-text-media">
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="" className="block-wireframe__image-text-img" />
        ) : (
          <span className="block-wireframe__image-placeholder" />
        )}
      </div>
      <div className="block-wireframe__image-text-copy">
        {hasText ? (
          <WireParagraph html={block.html} align={block.align} />
        ) : (
          <WireLines lines={3} align={block.align} />
        )}
      </div>
    </div>
  );
}

function WireReference({ block }) {
  const reversed = block.reversed;
  const wideClass = isReferenceWideLayout(block.text) ? ' block-wireframe__reference--wide' : '';
  const gridStyle = getReferenceGridStyle({ gapRem: block.gapRem });
  const displayName = (block.name || block.imageAlt || '').trim();

  return (
    <div
      className={`block-wireframe__reference${reversed ? ' block-wireframe__reference--reversed' : ''}${wideClass}`}
      style={gridStyle}
    >
      <span className="block-wireframe__reference-media">
        <span className="block-wireframe__reference-portrait">
          {block.imageUrl ? (
            <img src={block.imageUrl} alt="" className="block-wireframe__reference-portrait-img" />
          ) : (
            <span className="block-wireframe__reference-portrait-placeholder" />
          )}
        </span>
        {displayName ? (
          <span className="block-wireframe__reference-name">{displayName}</span>
        ) : null}
      </span>
      <WireCitation
        text={block.text}
        small
        bold={block.bold}
        align={block.align}
      />
    </div>
  );
}

function WireDivider() {
  return (
    <div className="block-wireframe__divider">
      <span className="block-wireframe__divider-line block-wireframe__divider-line--red" />
      <span className="block-wireframe__divider-dot" />
      <span className="block-wireframe__divider-line block-wireframe__divider-line--red" />
    </div>
  );
}

function WireCalendar() {
  const days = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  return (
    <div className="block-wireframe__calendar">
      <div className="block-wireframe__calendar-head">
        <span className="block-wireframe__calendar-nav" />
        <span className="block-wireframe__calendar-title" />
        <span className="block-wireframe__calendar-nav" />
      </div>
      <div className="block-wireframe__calendar-weekdays">
        {days.map((day) => (
          <span key={day} className="block-wireframe__calendar-weekday">{day}</span>
        ))}
      </div>
      <div className="block-wireframe__calendar-grid">
        {Array.from({ length: 35 }, (_, index) => (
          <span key={index} className="block-wireframe__calendar-cell" />
        ))}
      </div>
    </div>
  );
}

function getEnabledSocialLinkCount(links, settings) {
  return resolveBlockSocialLinks(links, settings).length;
}

function WireParallaxBand({ block, imageOnly = false }) {
  const { settings } = useSiteSettings();
  const { colors } = useSiteColors();
  const overlayBackground = useMemo(
    () => getParallaxOverlayBackground(block, colors),
    [
      block?.overlayAngle,
      block?.overlayColorEndKey,
      block?.overlayColorEnd,
      block?.overlayColorStartKey,
      block?.overlayColorStart,
      block?.overlayOpacity,
      colors,
    ],
  );

  const iconCount = Math.min(getEnabledSocialLinkCount(block?.links, settings), 4);
  const hasPhoto = Boolean(block?.imageUrl?.trim());
  const patternStyle = useMemo(
    () => (hasPhoto ? null : getEventCoverStyle(block?.id || 'parallax')),
    [block?.id, hasPhoto],
  );

  return (
    <div className={`block-wireframe__socials${imageOnly ? ' block-wireframe__socials--image-only' : ''}`}>
      <span
        className={`block-wireframe__socials-bg${hasPhoto ? '' : ' block-wireframe__socials-bg--pattern'}`}
        style={hasPhoto
          ? { backgroundImage: `url(${block.imageUrl})`, backgroundSize: 'cover' }
          : patternStyle}
      />
      <span
        className="block-wireframe__socials-overlay"
        style={{ background: overlayBackground }}
        aria-hidden="true"
      />
      {!imageOnly && iconCount > 0 && (
        <div className="block-wireframe__socials-row">
          {Array.from({ length: iconCount }, (_, index) => (
            <span key={index} className="block-wireframe__social-icon" />
          ))}
        </div>
      )}
    </div>
  );
}

function WireInstagram() {
  return (
    <div className="block-wireframe__instagram">
      <span className="block-wireframe__instagram-btn" />
      <div className="block-wireframe__instagram-grid">
        {Array.from({ length: 4 }, (_, index) => (
          <span key={index} className="block-wireframe__instagram-tile" />
        ))}
      </div>
    </div>
  );
}

function WireSpace({ block }) {
  const heightRem = block.heightRem ?? 3;
  return (
    <div
      className="block-wireframe__space"
      style={{ height: `${Math.max(1.5, heightRem * 0.55)}rem` }}
      aria-hidden="true"
    >
      <span className="block-wireframe__space-label">{heightRem} rem</span>
    </div>
  );
}

function WireNegativeSpace({ block }) {
  const pullRem = block.pullRem ?? 1.5;
  return (
    <div className="block-wireframe__negative-space" aria-hidden="true">
      <span className="block-wireframe__negative-space-label">−{pullRem} rem</span>
    </div>
  );
}

function WireMedallions({ block }) {
  const people = Array.isArray(block.people) ? block.people : [];
  const count = Math.max(people.length, 1);

  return (
    <div className="block-wireframe__medallions">
      {Array.from({ length: Math.min(count, 3) }, (_, index) => {
        const person = people[index];
        return (
          <div key={person?.id || index} className="block-wireframe__medallion">
            <span className="block-wireframe__medallion-photo">
              {person?.imageUrl && (
                <img src={person.imageUrl} alt="" className="block-wireframe__medallion-img" />
              )}
            </span>
            <span className="block-wireframe__medallion-line block-wireframe__medallion-line--name" />
            <span className="block-wireframe__medallion-line" />
            <span className="block-wireframe__medallion-icons">
              <span />
              <span />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function WireWideImage({ block }) {
  return (
    <div className="block-wireframe__wide-image" style={getWideImageBlockStyle(block.maxWidthPercent)}>
      {block.imageUrl ? (
        <img src={block.imageUrl} alt="" className="block-wireframe__wide-image-img" />
      ) : (
        <span className="block-wireframe__wide-image-placeholder" />
      )}
    </div>
  );
}

function WireImageTriplet({ block }) {
  const images = Array.isArray(block.images) ? block.images : [];

  return (
    <div
      className="block-wireframe__image-triplet"
      style={getImageTripletBlockStyle({
        maxWidthPercent: block.maxWidthPercent,
        gapRem: block.gapRem,
      })}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <span key={index} className="block-wireframe__image-triplet-item">
          {images[index]?.imageUrl ? (
            <img src={images[index].imageUrl} alt="" className="block-wireframe__image-triplet-img" />
          ) : (
            <span className="block-wireframe__image-triplet-placeholder" />
          )}
        </span>
      ))}
    </div>
  );
}

function WireButton({ label, external = false, large = false, color = 'orange' }) {
  const text = label?.trim();
  return (
    <span
      className={`block-wireframe__btn block-wireframe__btn--accent${large ? ' block-wireframe__btn--large' : ''}${external ? ' block-wireframe__btn--external' : ''}`}
      style={getPageBlockButtonColorStyle(color)}
    >
      {text || 'Tlačítko'}
      {external && <span className="block-wireframe__btn-icon" aria-hidden="true">↗</span>}
    </span>
  );
}

function WireButtonPair({ buttons = [] }) {
  return (
    <div className="block-wireframe__btn-row">
      {Array.from({ length: 2 }, (_, index) => {
        const button = buttons[index] || {};
        return (
          <WireButton
            key={index}
            label={button.label}
            external={button.openInNewTab}
            color={button.color}
          />
        );
      })}
    </div>
  );
}

function WireYoutube({ block }) {
  const hasVideo = Boolean(block.videoId?.trim());
  return (
    <div className={`block-wireframe__youtube${hasVideo ? ' block-wireframe__youtube--ready' : ''}`}>
      <span className="block-wireframe__youtube-play" aria-hidden="true">▶</span>
      {block.title?.trim() && (
        <span className="block-wireframe__youtube-title">{block.title.trim()}</span>
      )}
    </div>
  );
}

export default function AdminPageBlockWireframe({ block }) {
  if (!block?.type) return null;

  let preview = null;

  switch (block.type) {
    case PAGE_BLOCK_TYPES.citation:
      preview = <WireCitation text={block.text} asHeading bold={block.bold} />;
      break;
    case PAGE_BLOCK_TYPES.h1:
      preview = <WireSectionLabel text={block.text || 'Nadpis H1'} />;
      break;
    case PAGE_BLOCK_TYPES.h2:
      preview = (
        <WireNarrow>
          <WireHeading text={block.text} level={2} align={block.align} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.paragraph:
      preview = (
        <WireNarrow>
          <WireParagraph html={block.html} align={block.align} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.imageText:
      preview = (
        <WireNarrow>
          <WireImageText block={block} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.divider:
      preview = <WireDivider />;
      break;
    case PAGE_BLOCK_TYPES.upcomingEvents:
      preview = (
        <>
          <WireSectionLabel text="VyPUKne" />
          <WireEventCards count={3} />
          <span className="block-wireframe__cta" />
        </>
      );
      break;
    case PAGE_BLOCK_TYPES.pastEvents:
      preview = (
        <>
          <WireSectionLabel text="Proběhlé" />
          <WireEventCards count={3} />
          <div className="block-wireframe__cta-row">
            <span className="block-wireframe__cta block-wireframe__cta--small" />
            <span className="block-wireframe__cta block-wireframe__cta--small" />
          </div>
        </>
      );
      break;
    case PAGE_BLOCK_TYPES.calendar:
      preview = (
        <>
          <WireSectionLabel text="Kalendář" />
          <WireCalendar />
        </>
      );
      break;
    case PAGE_BLOCK_TYPES.socials:
      preview = <WireParallaxBand block={block} />;
      break;
    case PAGE_BLOCK_TYPES.parallaxImage:
      preview = <WireParallaxBand block={block} imageOnly />;
      break;
    case PAGE_BLOCK_TYPES.instagramFeed:
      preview = <WireInstagram />;
      break;
    case PAGE_BLOCK_TYPES.wideImage:
      preview = <WireWideImage block={block} />;
      break;
    case PAGE_BLOCK_TYPES.imageTriplet:
      preview = (
        <WireNarrow>
          <WireImageTriplet block={block} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.button:
      preview = (
        <WireNarrow>
          <div className="block-wireframe__button-row">
            <WireButton label={block.label} external={block.openInNewTab} color={block.color} large />
          </div>
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.buttonPair:
      preview = (
        <WireNarrow>
          <WireButtonPair buttons={block.buttons} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.youtube:
      preview = (
        <WireNarrow>
          <WireYoutube block={block} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.space:
      preview = <WireSpace block={block} />;
      break;
    case PAGE_BLOCK_TYPES.negativeSpace:
      preview = <WireNegativeSpace block={block} />;
      break;
    case PAGE_BLOCK_TYPES.citationSmall:
      preview = (
        <WireNarrow>
          <WireCitation text={block.text} small bold={block.bold} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.reference:
      preview = (
        <WireNarrow>
          <WireReference block={block} />
        </WireNarrow>
      );
      break;
    case PAGE_BLOCK_TYPES.medallions:
      preview = (
        <WireNarrow>
          <WireMedallions block={block} />
        </WireNarrow>
      );
      break;
    default:
      preview = <WireLines lines={2} />;
  }

  return (
    <div className="block-wireframe" aria-hidden="true">
      <p className="block-wireframe__label">Náhled na webu</p>
      <div className="block-wireframe__canvas">
        {preview}
      </div>
    </div>
  );
}
