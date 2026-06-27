import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import {
  clearHomeScroll,
  getHomeScroll,
  saveHomeScroll,
  shouldSaveHomeScroll,
} from '../utils/scroll-memory';

function isHome(path) {
  return path === '/' || path === '/index.html';
}

export function useScrollRestore() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const isFirstMount = useRef(true);
  const prevPathRef = useRef(pathname);

  useLayoutEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPathRef.current = pathname;
      return;
    }

    const prevPath = prevPathRef.current;

    if (shouldSaveHomeScroll(prevPath, pathname)) {
      saveHomeScroll();
    }

    if (navigationType === 'POP' && isHome(pathname)) {
      const saved = getHomeScroll();
      if (saved !== null) {
        window.scrollTo(0, saved);
        prevPathRef.current = pathname;
        return;
      }
    }

    if (isHome(pathname)) {
      clearHomeScroll();
    }

    window.scrollTo(0, 0);
    prevPathRef.current = pathname;
  }, [pathname, search, navigationType]);
}
