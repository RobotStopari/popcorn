export function isPublicRoute(pathname) {
  return !pathname.startsWith('/admin');
}

export const PAGE_CURTAIN_IN_MS = 220;
export const PAGE_CURTAIN_OUT_MS = 550;
export const PAGE_ENTER_EVENT = 'page:enter-complete';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function playCurtainIn() {
  return new Promise((resolve) => {
    if (prefersReducedMotion()) {
      resolve();
      return;
    }

    const curtain = document.querySelector('.page-curtain');
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      curtain?.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallback);
      resolve();
    };

    const onTransitionEnd = (event) => {
      if (event.target === curtain && event.propertyName === 'opacity') {
        finish();
      }
    };

    if (curtain) {
      curtain.addEventListener('transitionend', onTransitionEnd);
    }

    const fallback = setTimeout(finish, PAGE_CURTAIN_IN_MS + 40);
  });
}

function waitForCurtainOut() {
  return new Promise((resolve) => {
    if (prefersReducedMotion()) {
      resolve();
      return;
    }

    const curtain = document.querySelector('.page-curtain');
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      curtain?.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallback);
      resolve();
    };

    const onTransitionEnd = (event) => {
      if (event.target === curtain && event.propertyName === 'opacity') {
        finish();
      }
    };

    if (curtain) {
      curtain.addEventListener('transitionend', onTransitionEnd);
    }

    const fallback = setTimeout(finish, PAGE_CURTAIN_OUT_MS + 40);
  });
}

export function waitForPageEnterComplete() {
  return new Promise((resolve) => {
    if (prefersReducedMotion() || !document.body.classList.contains('page-reveal-pending')) {
      resolve();
      return;
    }

    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      document.removeEventListener(PAGE_ENTER_EVENT, onComplete);
      clearTimeout(fallback);
      resolve();
    };

    const onComplete = () => finish();

    document.addEventListener(PAGE_ENTER_EVENT, onComplete);
    const fallback = setTimeout(finish, PAGE_CURTAIN_OUT_MS + 120);
  });
}

export function finishPageEnter() {
  document.body.classList.remove('page-reveal-pending', 'page-switch-active');
  document.dispatchEvent(new CustomEvent(PAGE_ENTER_EVENT));
}

export { waitForCurtainOut };
