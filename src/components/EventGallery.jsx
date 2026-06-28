import { useState } from 'react';
import Lightbox from './Lightbox';

function GalleryThumb({ image, index, onOpen }) {
  return (
    <button
      type="button"
      className="event-detail__figure img-frame"
      onClick={() => onOpen(index)}
      aria-label={image.alt ? `Otevřít obrázek: ${image.alt}` : `Otevřít obrázek ${index + 1}`}
    >
      <img
        src={image.src}
        alt={image.alt}
        className="event-detail__img"
        loading="lazy"
        decoding="async"
        onLoad={(event) => {
          event.currentTarget.parentElement?.classList.add('is-loaded');
        }}
      />
    </button>
  );
}

export default function EventGallery({
  images,
  title,
  intro,
  className = 'event-detail__media',
}) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!images?.length) return null;

  return (
    <section className="event-detail__gallery-section reveal">
      {title && <h2 className="event-detail__gallery-title">{title}</h2>}
      {intro && <p className="event-detail__gallery-intro">{intro}</p>}

      <div className={`${className} reveal-stagger`}>
        {images.map((image, index) => (
          <GalleryThumb
            key={`${image.src}-${index}`}
            image={image}
            index={index}
            onOpen={setOpenIndex}
          />
        ))}
      </div>

      <Lightbox
        images={images}
        openIndex={openIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}
