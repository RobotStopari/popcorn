import { bindFrameImage } from './image-loader.js';

let lightboxEl = null;
let images = [];
let currentIndex = 0;

function ensureLightbox() {
  if (lightboxEl) return lightboxEl;

  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.id = 'lightbox';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  lightboxEl.setAttribute('aria-label', 'Náhled obrázku');
  lightboxEl.hidden = true;
  lightboxEl.innerHTML = `
    <div class="lightbox__backdrop" data-lightbox-close></div>
    <button type="button" class="lightbox__close" data-lightbox-close aria-label="Zavřít">
      <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <button type="button" class="lightbox__nav lightbox__nav--prev" data-lightbox-prev aria-label="Předchozí obrázek">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M15 6l-6 6 6 6"/></svg>
    </button>
    <figure class="lightbox__figure">
      <div class="lightbox__stage img-frame">
        <img class="lightbox__img" src="" alt="">
      </div>
      <figcaption class="lightbox__caption"></figcaption>
    </figure>
    <button type="button" class="lightbox__nav lightbox__nav--next" data-lightbox-next aria-label="Další obrázek">
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M9 6l6 6-6 6"/></svg>
    </button>
  `;

  document.body.appendChild(lightboxEl);

  lightboxEl.querySelectorAll('[data-lightbox-close]').forEach((el) => {
    el.addEventListener('click', closeLightbox);
  });
  lightboxEl.querySelector('[data-lightbox-prev]')?.addEventListener('click', () => stepLightbox(-1));
  lightboxEl.querySelector('[data-lightbox-next]')?.addEventListener('click', () => stepLightbox(1));

  document.addEventListener('keydown', onLightboxKeydown);

  return lightboxEl;
}

function onLightboxKeydown(event) {
  if (!lightboxEl || lightboxEl.hidden) return;

  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') stepLightbox(-1);
  if (event.key === 'ArrowRight') stepLightbox(1);
}

function updateLightbox() {
  if (!lightboxEl || !images.length) return;

  const item = images[currentIndex];
  const stage = lightboxEl.querySelector('.lightbox__stage');
  const img = lightboxEl.querySelector('.lightbox__img');
  const caption = lightboxEl.querySelector('.lightbox__caption');
  const prev = lightboxEl.querySelector('[data-lightbox-prev]');
  const next = lightboxEl.querySelector('[data-lightbox-next]');

  stage?.classList.remove('is-loaded');
  img.src = item.src;
  img.alt = item.alt;
  bindFrameImage(img);
  caption.textContent = item.alt || '';
  caption.hidden = !item.alt;

  const showNav = images.length > 1;
  prev.hidden = !showNav;
  next.hidden = !showNav;
  prev.disabled = currentIndex === 0;
  next.disabled = currentIndex === images.length - 1;
}

function openLightbox(index, galleryImages) {
  images = galleryImages;
  currentIndex = index;
  const lb = ensureLightbox();

  updateLightbox();
  lb.hidden = false;
  document.body.classList.add('lightbox-open');
  lb.querySelector('.lightbox__close')?.focus();
}

function closeLightbox() {
  if (!lightboxEl || lightboxEl.hidden) return;

  lightboxEl.hidden = true;
  document.body.classList.remove('lightbox-open');
  images = [];
  currentIndex = 0;
}

function stepLightbox(direction) {
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= images.length) return;

  currentIndex = nextIndex;
  updateLightbox();
}

function collectGalleryImages(container) {
  return [...container.querySelectorAll('[data-lightbox-index]')].map((trigger) => {
    const img = trigger.querySelector('img');
    return {
      src: img?.dataset.fullSrc || img?.src || '',
      alt: img?.alt || '',
    };
  });
}

export function initLightbox(root = document) {
  const galleries = root.querySelectorAll('[data-lightbox-gallery]');

  galleries.forEach((gallery) => {
    const galleryImages = collectGalleryImages(gallery);

    gallery.querySelectorAll('[data-lightbox-index]').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const index = Number.parseInt(trigger.dataset.lightboxIndex, 10);
        openLightbox(index, galleryImages);
      });
    });
  });
}
