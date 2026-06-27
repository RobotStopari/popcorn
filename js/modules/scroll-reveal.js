export function initScrollReveal({ loader } = {}) {
  const revealEls = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.reveal-stagger').forEach((group) => {
    group.querySelectorAll('.reveal').forEach((el, index) => {
      el.style.transitionDelay = `${index * 0.12}s`;
    });
  });

  function revealElement(el) {
    el.classList.add('reveal--visible');
  }

  let revealObserver;

  function checkVisibleReveals() {
    revealEls.forEach((el) => {
      if (el.classList.contains('reveal--visible')) return;

      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        revealElement(el);
        revealObserver?.unobserve(el);
      }
    });
  }

  if (prefersReducedMotion) {
    revealEls.forEach(revealElement);
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          revealElement(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );

  revealEls.forEach((el) => revealObserver.observe(el));

  window.addEventListener('scroll', checkVisibleReveals, { passive: true });
  window.addEventListener('resize', checkVisibleReveals, { passive: true });
  window.addEventListener('load', () => setTimeout(checkVisibleReveals, 120));

  const onReady = () => setTimeout(checkVisibleReveals, 180);

  if (!document.body.classList.contains('is-loading')) {
    checkVisibleReveals();
  } else if (loader) {
    loader.addEventListener('transitionend', onReady, { once: true });
  } else {
    onReady();
  }
}
