import { shouldSkipLoader } from './page-transition.js';

export function initLoader() {
  const loader = document.getElementById('pageLoader');

  if (shouldSkipLoader()) {
    loader?.remove();
    document.body.classList.remove('is-loading');
    return { loader: null, hideLoader: () => {} };
  }

  const loadStarted = Date.now();
  const MIN_LOADER_MS = 900;

  function hideLoader() {
    if (!loader || loader.classList.contains('loader--hide')) return;

    const elapsed = Date.now() - loadStarted;
    const delay = Math.max(0, MIN_LOADER_MS - elapsed);

    setTimeout(() => {
      loader.classList.add('loader--hide');
      document.body.classList.remove('is-loading');

      loader.addEventListener('transitionend', () => {
        loader.remove();
      }, { once: true });
    }, delay);
  }

  window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 5000);

  return { loader, hideLoader };
}
