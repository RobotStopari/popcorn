const PARALLAX_TRAVEL_PX = 480;
const PARALLAX_SCALE = 1.45;

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function isPatternBackground(bg) {
  return bg.classList.contains('parallax-section__bg--pattern');
}

function computeOffset(docTop, height, scrollY, viewportHeight) {
  const relativeTop = docTop - scrollY;

  if (relativeTop > viewportHeight || relativeTop + height < 0) {
    return null;
  }

  const progress = (viewportHeight - relativeTop) / (viewportHeight + height);
  return (progress - 0.5) * PARALLAX_TRAVEL_PX;
}

export function createParallaxController({ root = document } = {}) {
  const entries = [];
  let rafId = 0;
  let running = false;
  const resizeObserver = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(() => refreshMetrics())
    : null;

  function collectEntries() {
    entries.length = 0;

    root.querySelectorAll('[data-parallax-bg]').forEach((bg) => {
      const section = bg.closest('.parallax-section');
      if (!section) return;

      entries.push({ bg, section, docTop: 0, height: 0, isPattern: isPatternBackground(bg) });
    });
  }

  function observeSections() {
    if (!resizeObserver) return;

    resizeObserver.disconnect();
    entries.forEach(({ section }) => resizeObserver.observe(section));
  }

  function refreshMetrics() {
    collectEntries();
    observeSections();

    const scrollY = window.scrollY;

    entries.forEach((entry) => {
      const rect = entry.section.getBoundingClientRect();
      entry.docTop = rect.top + scrollY;
      entry.height = rect.height;
    });
  }

  function applyTransforms() {
    rafId = 0;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    entries.forEach((entry) => {
      const offset = computeOffset(entry.docTop, entry.height, scrollY, viewportHeight);
      if (offset === null) return;

      const scale = entry.isPattern ? 1.55 : PARALLAX_SCALE;
      entry.bg.style.setProperty('--parallax-offset', `${offset}px`);
      entry.bg.style.setProperty('--parallax-scale', String(scale));
    });
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(applyTransforms);
  }

  function refreshMetricsAndApply() {
    refreshMetrics();
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    applyTransforms();
  }

  function start() {
    if (running || prefersReducedMotion()) return;

    running = true;
    refreshMetricsAndApply();

    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', refreshMetricsAndApply, { passive: true });
  }

  function stop() {
    if (!running) return;

    running = false;
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', refreshMetricsAndApply);

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    resizeObserver?.disconnect();
    entries.length = 0;
  }

  return {
    start,
    stop,
    refresh: refreshMetricsAndApply,
  };
}
