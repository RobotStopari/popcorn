import { useEffect, useState } from 'react';

export function useLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const started = Date.now();
    const minMs = 900;

    const hide = () => {
      const delay = Math.max(0, minMs - (Date.now() - started));
      const timer = setTimeout(() => {
        setLoading(false);
        document.body.classList.remove('is-loading');
      }, delay);
      return () => clearTimeout(timer);
    };

    if (document.readyState === 'complete') return hide();
    window.addEventListener('load', hide);
    const fallback = setTimeout(hide, 5000);
    return () => {
      window.removeEventListener('load', hide);
      clearTimeout(fallback);
    };
  }, []);

  return loading;
}
