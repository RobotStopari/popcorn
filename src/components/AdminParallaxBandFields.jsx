import {
  PARALLAX_BAND_HEIGHT_DEFAULT,
  PARALLAX_BAND_HEIGHT_MAX,
  PARALLAX_BAND_HEIGHT_MIN,
} from '../data/page-blocks';
import { useSiteColors } from '../contexts/SiteColorsContext';
import {
  PARALLAX_OVERLAY_ANGLE_DEFAULT,
  PARALLAX_OVERLAY_ANGLE_MAX,
  PARALLAX_OVERLAY_ANGLE_MIN,
  PARALLAX_OVERLAY_COLOR_END_KEY_DEFAULT,
  PARALLAX_OVERLAY_COLOR_KEYS,
  PARALLAX_OVERLAY_COLOR_LABELS,
  PARALLAX_OVERLAY_COLOR_START_KEY_DEFAULT,
  PARALLAX_OVERLAY_OPACITY_DEFAULT,
  PARALLAX_OVERLAY_OPACITY_MAX,
  PARALLAX_OVERLAY_OPACITY_MIN,
  getParallaxOverlayBackground,
  isDefaultParallaxOverlay,
  normalizeParallaxOverlayFields,
} from '../utils/parallax-overlay';
import PageBlockImageUpload from './PageBlockImageUpload';

function MainColorPicker({
  label,
  value,
  colors,
  onChange,
}) {
  return (
    <div className="admin-parallax-overlay__color">
      <span className="admin-parallax-overlay__color-label">{label}</span>
      <div className="admin-parallax-overlay__swatches" role="radiogroup" aria-label={label}>
        {PARALLAX_OVERLAY_COLOR_KEYS.map((key) => {
          const swatchColor = colors[key];
          const isLight = key === 'white' || key === 'orange';

          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={value === key}
              aria-label={PARALLAX_OVERLAY_COLOR_LABELS[key]}
              className={`admin-parallax-overlay__swatch${value === key ? ' is-active' : ''}${isLight ? ' admin-parallax-overlay__swatch--light' : ''}`}
              style={{ backgroundColor: swatchColor }}
              onClick={() => onChange(key)}
              title={PARALLAX_OVERLAY_COLOR_LABELS[key]}
            />
          );
        })}
      </div>
      <span className="admin-parallax-overlay__swatch-name">
        {PARALLAX_OVERLAY_COLOR_LABELS[value] || value}
      </span>
    </div>
  );
}

export default function AdminParallaxBandFields({
  block,
  onChange,
}) {
  const { colors } = useSiteColors();
  const heightVh = block.heightVh ?? PARALLAX_BAND_HEIGHT_DEFAULT;
  const overlay = normalizeParallaxOverlayFields(block, colors);
  const overlayPreview = getParallaxOverlayBackground(overlay, colors);

  const resetOverlay = () => {
    onChange({
      overlayColorStartKey: PARALLAX_OVERLAY_COLOR_START_KEY_DEFAULT,
      overlayColorEndKey: PARALLAX_OVERLAY_COLOR_END_KEY_DEFAULT,
      overlayOpacity: PARALLAX_OVERLAY_OPACITY_DEFAULT,
      overlayAngle: PARALLAX_OVERLAY_ANGLE_DEFAULT,
    });
  };

  return (
    <div className="admin-parallax-fields">
      <PageBlockImageUpload
        imageUrl={block.imageUrl}
        imagePublicId={block.imagePublicId}
        previewSeed={block.id}
        variant="banner"
        onChange={onChange}
      />

      <div className="admin-parallax-fields__height">
        <div className="admin-parallax-fields__height-top">
          <span className="admin-parallax-fields__height-label">Výška řádku</span>
          <span className="admin-parallax-fields__height-value">{heightVh} %</span>
        </div>

        <input
          id={`block-${block.id}-height`}
          type="range"
          className="admin-parallax-fields__range"
          min={PARALLAX_BAND_HEIGHT_MIN}
          max={PARALLAX_BAND_HEIGHT_MAX}
          step={1}
          value={heightVh}
          onChange={(event) => onChange({ heightVh: Number(event.target.value) })}
          aria-valuemin={PARALLAX_BAND_HEIGHT_MIN}
          aria-valuemax={PARALLAX_BAND_HEIGHT_MAX}
          aria-valuenow={heightVh}
          aria-label="Výška parallax řádku v procentech výšky obrazovky"
        />

        <div className="admin-parallax-fields__height-scale" aria-hidden="true">
          <span>{PARALLAX_BAND_HEIGHT_MIN} %</span>
          <span>Výchozí {PARALLAX_BAND_HEIGHT_DEFAULT} %</span>
          <span>{PARALLAX_BAND_HEIGHT_MAX} %</span>
        </div>
      </div>

      <div className="admin-parallax-overlay">
        <div className="admin-parallax-overlay__head">
          <span className="admin-parallax-overlay__title">Barevný překryv</span>
          {!isDefaultParallaxOverlay(overlay, colors) && (
            <button
              type="button"
              className="btn btn--outline btn--small"
              onClick={resetOverlay}
            >
              Výchozí
            </button>
          )}
        </div>

        <div
          className="admin-parallax-overlay__preview"
          style={{ background: overlayPreview }}
          aria-hidden="true"
        />

        <div className="admin-parallax-overlay__opacity">
          <div className="admin-parallax-overlay__row-top">
            <span className="admin-parallax-overlay__row-label">Intenzita</span>
            <span className="admin-parallax-fields__height-value">{overlay.overlayOpacity} %</span>
          </div>
          <input
            id={`block-${block.id}-overlay-opacity`}
            type="range"
            className="admin-parallax-fields__range"
            min={PARALLAX_OVERLAY_OPACITY_MIN}
            max={PARALLAX_OVERLAY_OPACITY_MAX}
            step={1}
            value={overlay.overlayOpacity}
            onChange={(event) => onChange({ overlayOpacity: Number(event.target.value) })}
            aria-label="Intenzita barevného překryvu"
          />
        </div>

        <div className="admin-parallax-overlay__angle">
          <div className="admin-parallax-overlay__row-top">
            <span className="admin-parallax-overlay__row-label">Směr gradientu</span>
            <span className="admin-parallax-fields__height-value">{overlay.overlayAngle}°</span>
          </div>
          <input
            id={`block-${block.id}-overlay-angle`}
            type="range"
            className="admin-parallax-fields__range"
            min={PARALLAX_OVERLAY_ANGLE_MIN}
            max={PARALLAX_OVERLAY_ANGLE_MAX}
            step={1}
            value={overlay.overlayAngle}
            onChange={(event) => onChange({ overlayAngle: Number(event.target.value) })}
            aria-label="Úhel gradientu překryvu"
          />
        </div>

        <div className="admin-parallax-overlay__colors">
          <MainColorPicker
            label="Barva 1"
            value={overlay.overlayColorStartKey}
            colors={colors}
            onChange={(overlayColorStartKey) => onChange({ overlayColorStartKey })}
          />
          <MainColorPicker
            label="Barva 2"
            value={overlay.overlayColorEndKey}
            colors={colors}
            onChange={(overlayColorEndKey) => onChange({ overlayColorEndKey })}
          />
        </div>
      </div>
    </div>
  );
}
