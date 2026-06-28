import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Lightbox({ images, openIndex, onClose }) {
  const [index, setIndex] = useState(openIndex ?? 0);

  useEffect(() => {
    if (openIndex !== null && openIndex !== undefined) {
      setIndex(openIndex);
    }
  }, [openIndex]);

  const step = useCallback((direction) => {
    setIndex((current) => {
      const next = current + direction;
      if (next < 0 || next >= images.length) return current;
      return next;
    });
  }, [images.length]);

  useEffect(() => {
    if (openIndex === null) return undefined;

    const onKeydown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') step(-1);
      if (event.key === 'ArrowRight') step(1);
    };

    document.body.classList.add('lightbox-open');
    document.addEventListener('keydown', onKeydown);

    return () => {
      document.body.classList.remove('lightbox-open');
      document.removeEventListener('keydown', onKeydown);
    };
  }, [openIndex, onClose, step]);

  if (openIndex === null || !images.length) return null;

  const item = images[index];
  const showNav = images.length > 1;

  return createPortal(
    <div className="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Náhled obrázku">
      <div className="lightbox__backdrop" onClick={onClose} aria-hidden="true" />
      <button type="button" className="lightbox__close" onClick={onClose} aria-label="Zavřít">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {showNav && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--prev"
          onClick={() => step(-1)}
          disabled={index === 0}
          aria-label="Předchozí obrázek"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      )}
      <figure className="lightbox__figure">
        <div className="lightbox__stage">
          <img className="lightbox__img" src={item.src} alt={item.alt || ''} />
        </div>
      </figure>
      {showNav && (
        <button
          type="button"
          className="lightbox__nav lightbox__nav--next"
          onClick={() => step(1)}
          disabled={index === images.length - 1}
          aria-label="Další obrázek"
        >
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      )}
    </div>,
    document.body,
  );
}
