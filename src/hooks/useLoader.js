import { useEffect, useState } from 'react';
import { useAppBoot } from './useAppBoot';

export function useLoader() {
  const [loading, setLoading] = useState(() => document.body.classList.contains('is-loading'));

  useAppBoot();

  useEffect(() => {
    if (!document.body.classList.contains('is-loading')) {
      setLoading(false);
      return undefined;
    }

    const started = Date.now();
    const minMs = 900;
    let hideTimer;

    const hide = () => {
      const delay = Math.max(0, minMs - (Date.now() - started));
      hideTimer = window.setTimeout(() => setLoading(false), delay);
    };

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide);
    }

    const fallback = window.setTimeout(hide, 5000);

    return () => {
      window.removeEventListener('load', hide);
      window.clearTimeout(fallback);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return loading;
}
