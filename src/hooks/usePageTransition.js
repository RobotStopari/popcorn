import { useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  finishPageEnter,
  isPublicRoute,
  playCurtainIn,
  waitForCurtainOut,
} from '../utils/page-transition';
import {
  clearHomeScroll,
  saveHomeScroll,
  shouldSaveHomeScroll,
} from '../utils/scroll-memory';

function isHome(path) {
  return path === '/' || path === '/index.html';
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function usePageTransition(location) {
  const navigate = useNavigate();
  const isFirstMount = useRef(true);
  const switchingRef = useRef(false);
  const enterTokenRef = useRef(0);

  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return undefined;
    }

    const enterToken = ++enterTokenRef.current;

    if (prefersReducedMotion()) {
      document.body.classList.remove('page-switch-active', 'page-reveal-pending');
      switchingRef.current = false;
      finishPageEnter();
      return undefined;
    }

    document.body.classList.add('page-reveal-pending');

    if (!switchingRef.current) {
      document.body.classList.add('page-switch-active');
    }

    let cancelled = false;
    let frame = 0;

    const runEnter = () => {
      frame = requestAnimationFrame(() => {
        requestAnimationFrame(async () => {
          if (cancelled || enterToken !== enterTokenRef.current) return;

          document.body.classList.remove('page-switch-active');
          await waitForCurtainOut();

          if (cancelled || enterToken !== enterTokenRef.current) return;

          switchingRef.current = false;
          finishPageEnter();
        });
      });
    };

    runEnter();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (event) => {
      const anchor = event.target.closest('a[href]');
      if (!anchor || anchor.target === '_blank') return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      const destination = `${url.pathname}${url.search}${url.hash}`;
      const samePath = url.pathname === location.pathname && url.search === location.search;

      if (samePath) {
        if (isHome(url.pathname)) {
          event.preventDefault();
          clearHomeScroll();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      if (!isPublicRoute(url.pathname)) return;

      event.preventDefault();

      if (shouldSaveHomeScroll(location.pathname, url.pathname)) {
        saveHomeScroll();
      }

      if (isHome(url.pathname)) {
        clearHomeScroll();
      }

      switchingRef.current = true;
      document.body.classList.add('page-switch-active');

      playCurtainIn().then(() => {
        navigate(destination);
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [navigate, location.pathname, location.search]);
}
