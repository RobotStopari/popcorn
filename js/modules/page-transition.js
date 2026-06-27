const TRANSITION_KEY = 'popcorn:transition';
const EXIT_MS = 180;
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function shouldSkipLoader() {
  return (
    sessionStorage.getItem(TRANSITION_KEY) === '1'
    || document.documentElement.classList.contains('page-skip-loader')
  );
}

export function preparePageEnter() {
  if (!shouldSkipLoader()) return;

  sessionStorage.removeItem(TRANSITION_KEY);
  document.documentElement.classList.remove('page-enter-pending');
  document.getElementById('pageLoader')?.remove();
  document.body.classList.remove('is-loading');

  if (REDUCED_MOTION) return;

  document.body.classList.add('page-transition-enter');

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.classList.add('page-transition-enter--active');
    });
  });
}

function isInternalPageLink(anchor) {
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;

    const path = url.pathname.replace(/\/$/, '') || '/';
    return (
      path === '/'
      || path.endsWith('/index.html')
      || path.endsWith('event.html')
    );
  } catch {
    return false;
  }
}

function playExit() {
  if (REDUCED_MOTION) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const main = document.querySelector('.page-main');
    let finished = false;

    const done = () => {
      if (finished) return;
      finished = true;
      resolve();
    };

    document.body.classList.add('page-transition-exit');

    if (main) {
      main.addEventListener(
        'transitionend',
        (event) => {
          if (event.propertyName === 'opacity') done();
        },
        { once: true },
      );
    }

    window.setTimeout(done, EXIT_MS + 30);
  });
}

export function initPageTransition() {
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;

    const anchor = event.target.closest('a[href]');
    if (!anchor) return;
    if (anchor.target === '_blank') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isInternalPageLink(anchor)) return;

    const destination = new URL(anchor.href, window.location.href).href;
    if (destination === window.location.href) return;

    event.preventDefault();
    sessionStorage.setItem(TRANSITION_KEY, '1');

    playExit().then(() => {
      window.location.href = destination;
    });
  });
}
