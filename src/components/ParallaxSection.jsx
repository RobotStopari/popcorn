import { useMemo } from 'react';
import BlockSocialLinks from './BlockSocialLinks';
import { useSiteColors } from '../contexts/SiteColorsContext';
import { getEventCoverStyle } from '../utils/event-cover-pattern';
import { getParallaxOverlayBackground } from '../utils/parallax-overlay';
import { getParallaxBandStyle } from '../utils/page-blocks';

export default function ParallaxSection({
  imageUrl = '',
  heightVh,
  overlay,
  patternSeed = 'parallax',
  children = null,
}) {
  const { colors } = useSiteColors();
  const sectionStyle = getParallaxBandStyle(heightVh);
  const overlayBackground = getParallaxOverlayBackground(overlay, colors);
  const hasPhoto = Boolean(imageUrl?.trim());
  const patternStyle = useMemo(
    () => (hasPhoto ? null : getEventCoverStyle(patternSeed)),
    [hasPhoto, patternSeed],
  );

  const backgroundStyle = hasPhoto
    ? { backgroundImage: `url(${imageUrl.trim()})` }
    : patternStyle;

  const sectionBackground = !hasPhoto && patternStyle?.backgroundColor
    ? { backgroundColor: patternStyle.backgroundColor }
    : undefined;

  return (
    <section
      className="parallax-section"
      style={{ ...sectionStyle, ...sectionBackground }}
    >
      <div
        className={`parallax-section__bg${hasPhoto ? '' : ' parallax-section__bg--pattern'}`}
        data-parallax-bg=""
        style={{
          ...backgroundStyle,
          ...(!hasPhoto ? { '--parallax-scale': '1.55' } : null),
        }}
      />
      <div
        className="parallax-section__overlay"
        style={{ background: overlayBackground }}
      />
      {children && (
        <div className="parallax-section__content container">
          {children}
        </div>
      )}
    </section>
  );
}

export function ParallaxSocialSection({ block }) {
  return (
    <ParallaxSection
      imageUrl={block.imageUrl}
      heightVh={block.heightVh}
      overlay={block}
      patternSeed={block.id}
    >
      <BlockSocialLinks links={block.links} />
    </ParallaxSection>
  );
}
