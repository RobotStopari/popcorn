import { useEffect } from 'react';

const DEFAULT_MIN_MS = 900;

export function useAppBoot({ minDelay = DEFAULT_MIN_MS } = {}) {
  useEffect(() => {
    const started = Date.now();
    let hideTimer;

    const finish = () => {
      const delay = Math.max(0, minDelay - (Date.now() - started));
      hideTimer = window.setTimeout(() => {
        document.body.classList.remove('is-loading');
      }, delay);
    };

    if (document.readyState === 'complete') {
      finish();
    } else {
      window.addEventListener('load', finish);
    }

    const fallback = window.setTimeout(finish, 5000);

    return () => {
      window.removeEventListener('load', finish);
      window.clearTimeout(fallback);
      window.clearTimeout(hideTimer);
    };
  }, [minDelay]);
}
