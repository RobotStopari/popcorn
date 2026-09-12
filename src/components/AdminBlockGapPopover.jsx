import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PAGE_BLOCK_GAP_AFTER_DEFAULT,
  PAGE_BLOCK_GAP_AFTER_MAX,
  PAGE_BLOCK_GAP_AFTER_MIN,
  PAGE_BLOCK_GAP_AFTER_STEP,
  PAGE_BLOCK_LABELS,
} from '../data/page-blocks';
import { clampGapAfterRem, getBlockGapAfterStyle } from '../utils/page-blocks';
import { adminText } from '../utils/admin-text';
import { useAnimatedPresence } from '../hooks/useAnimatedPresence';
import { useImageFrames } from '../hooks/useImageFrames';
import { useParallax } from '../hooks/useParallax';
import PageBlockRenderer from './page-blocks/PageBlockRenderer';

function formatGapLabel(value) {
  const gap = clampGapAfterRem(value);
  if (gap > 0) return `+${gap} rem`;
  if (gap < 0) return `${gap} rem`;
  return '0 rem';
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export default function AdminBlockGapPopover({
  open,
  topBlock,
  bottomBlock,
  variant = 'home',
  initialGap = PAGE_BLOCK_GAP_AFTER_DEFAULT,
  onClose,
  onSave,
}) {
  const sliderId = useId();
  const previewRef = useRef(null);
  const topItemRef = useRef(null);
  const [gap, setGap] = useState(() => clampGapAfterRem(initialGap));
  const { mounted, visible } = useAnimatedPresence(open, 220);
  const previewKey = `${topBlock?.id || 'top'}:${bottomBlock?.id || 'bottom'}`;

  useParallax(mounted ? previewKey : '');
  useImageFrames([previewKey, mounted]);

  useEffect(() => {
    if (!open) return;
    setGap(clampGapAfterRem(initialGap));
  }, [open, initialGap, topBlock?.id, bottomBlock?.id]);

  useEffect(() => {
    if (!mounted) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.classList.add('admin-modal-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('admin-modal-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [mounted, onClose]);

  // Keep the real junction (end of top → start of bottom) centered — same layout as the live page.
  useLayoutEffect(() => {
    if (!mounted || !visible) return undefined;

    const preview = previewRef.current;
    const topItem = topItemRef.current;
    if (!preview || !topItem) return undefined;

    const centerJunction = () => {
      const junctionY = topItem.offsetTop + topItem.offsetHeight;
      const nextScroll = Math.max(0, junctionY - (preview.clientHeight / 2));
      preview.scrollTop = nextScroll;
    };

    centerJunction();
    const frame = window.requestAnimationFrame(centerJunction);
    const images = preview.querySelectorAll('img');
    images.forEach((image) => {
      if (!image.complete) {
        image.addEventListener('load', centerJunction, { once: true });
      }
    });

    return () => {
      window.cancelAnimationFrame(frame);
      images.forEach((image) => {
        image.removeEventListener('load', centerJunction);
      });
    };
  }, [mounted, visible, gap, previewKey]);

  if (!mounted || !topBlock || !bottomBlock) return null;

  const topLabel = PAGE_BLOCK_LABELS[topBlock.type] || topBlock.type;
  const bottomLabel = PAGE_BLOCK_LABELS[bottomBlock.type] || bottomBlock.type;

  const handleGapInput = (event) => {
    setGap(clampGapAfterRem(Number(event.target.value)));
  };

  return createPortal(
    <div
      className={`admin-block-gap${visible ? ' admin-block-gap--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-block-gap-title"
    >
      <header className="admin-block-gap__head">
        <div className="admin-block-gap__head-main">
          <button
            type="button"
            className="admin-block-gap__close"
            aria-label={adminText('pages.builder.gapModalCancel')}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
          <div>
            <p className="admin-block-gap__eyebrow">{topLabel} → {bottomLabel}</p>
            <h3 id="admin-block-gap-title" className="admin-block-gap__title">
              {adminText('pages.builder.gapModalTitle')}
            </h3>
          </div>
        </div>
        <span className="admin-block-gap__value" aria-live="polite">{formatGapLabel(gap)}</span>
      </header>

      <div
        ref={previewRef}
        className="admin-block-gap__preview"
        aria-label={adminText('pages.builder.gapModalHint')}
      >
        <div className="admin-block-gap__stage">
          <div
            className={
              variant === 'content'
                ? 'section content-page-section admin-block-gap__surface'
                : 'admin-block-gap__surface'
            }
          >
            <div className={`page-blocks page-blocks--${variant}`}>
              <div
                ref={topItemRef}
                className="page-blocks__item"
                style={getBlockGapAfterStyle(gap)}
              >
                <PageBlockRenderer block={topBlock} variant={variant} />
              </div>
              <div className="page-blocks__item">
                <PageBlockRenderer block={bottomBlock} variant={variant} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-block-gap__dock">
        <p className="admin-block-gap__hint">{adminText('pages.builder.gapModalHint')}</p>

        <div className="admin-block-gap__controls">
          <label className="admin-block-gap__slider-label" htmlFor={sliderId}>
            {formatGapLabel(gap)}
          </label>
          <input
            id={sliderId}
            type="range"
            className="admin-block-gap__slider"
            min={PAGE_BLOCK_GAP_AFTER_MIN}
            max={PAGE_BLOCK_GAP_AFTER_MAX}
            step={PAGE_BLOCK_GAP_AFTER_STEP}
            value={gap}
            onInput={handleGapInput}
            onChange={handleGapInput}
            aria-valuemin={PAGE_BLOCK_GAP_AFTER_MIN}
            aria-valuemax={PAGE_BLOCK_GAP_AFTER_MAX}
            aria-valuenow={gap}
          />
          <div className="admin-block-gap__scale" aria-hidden="true">
            <span>{adminText('pages.builder.gapSliderMin')}</span>
            <span>{adminText('pages.builder.gapSliderMid')}</span>
            <span>{adminText('pages.builder.gapSliderMax')}</span>
          </div>
        </div>

        <footer className="admin-block-gap__footer">
          <button
            type="button"
            className="btn btn--outline btn--small"
            onClick={() => setGap(PAGE_BLOCK_GAP_AFTER_DEFAULT)}
          >
            {adminText('pages.builder.gapModalReset')}
          </button>
          <div className="admin-block-gap__footer-actions">
            <button type="button" className="btn btn--outline btn--small" onClick={onClose}>
              {adminText('pages.builder.gapModalCancel')}
            </button>
            <button
              type="button"
              className="btn btn--primary btn--small"
              onClick={() => onSave(clampGapAfterRem(gap))}
            >
              {adminText('pages.builder.gapModalSave')}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
