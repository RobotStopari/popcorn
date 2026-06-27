import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { waitForPageEnterComplete } from '../utils/page-transition';

export function useScrollReveal() {
  const { pathname } = useLocation();
  const runIdRef = useRef(0);

  useEffect(() => {
    const runId = ++runIdRef.current;
    let active = true;
    let intersectionObserver;
    let mutationObserver;
    let mutationFrame = 0;
    const timeouts = [];
    const tracked = new WeakSet();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const reveal = (el) => {
      if (!el.classList.contains('reveal--visible')) {
        el.classList.add('reveal--visible');
      }
    };

    const applyStagger = (elements) => {
      const groups = new Set();

      elements.forEach((el) => {
        const group = el.closest('.reveal-stagger');
        if (group) groups.add(group);
      });

      groups.forEach((group) => {
        const items = group.querySelectorAll('.reveal');
        items.forEach((el, index) => {
          if (el.classList.contains('reveal--visible')) return;
          el.style.transitionDelay = `${index * 0.12}s`;
        });
      });
    };

    const checkVisible = (elements) => {
      elements.forEach((el) => {
        if (el.classList.contains('reveal--visible')) return;

        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
          reveal(el);
          intersectionObserver?.unobserve(el);
        }
      });
    };

    const observeNew = () => {
      if (!active || runId !== runIdRef.current) return;

      const revealEls = Array.from(document.querySelectorAll('.page-main .reveal')).filter(
        (el) => !tracked.has(el) && !el.classList.contains('reveal--visible'),
      );

      if (!revealEls.length) return;

      applyStagger(revealEls);

      if (prefersReducedMotion) {
        revealEls.forEach(reveal);
        revealEls.forEach((el) => tracked.add(el));
        return;
      }

      if (!intersectionObserver) {
        intersectionObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                reveal(entry.target);
                intersectionObserver.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
        );
      }

      revealEls.forEach((el) => {
        tracked.add(el);
        intersectionObserver.observe(el);
      });

      checkVisible(revealEls);
    };

    const onScrollOrResize = () => {
      checkVisible(document.querySelectorAll('.page-main .reveal'));
    };

    const scheduleObserveNew = () => {
      cancelAnimationFrame(mutationFrame);
      mutationFrame = requestAnimationFrame(observeNew);
    };

    const start = async () => {
      await waitForPageEnterComplete();
      if (!active || runId !== runIdRef.current) return;

      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!active || runId !== runIdRef.current) return;

      observeNew();

      timeouts.push(setTimeout(() => {
        if (active && runId === runIdRef.current) observeNew();
      }, 400));

      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize, { passive: true });

      const root = document.querySelector('.page-main') || document.body;
      mutationObserver = new MutationObserver(scheduleObserveNew);
      mutationObserver.observe(root, { childList: true, subtree: true });
    };

    start();

    return () => {
      active = false;
      intersectionObserver?.disconnect();
      mutationObserver?.disconnect();
      cancelAnimationFrame(mutationFrame);
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      timeouts.forEach(clearTimeout);
    };
  }, [pathname]);
}
