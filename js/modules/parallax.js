const PARALLAX_TRAVEL_PX = 480;

export function initParallax() {
  const parallaxBg = document.getElementById('parallaxBg');
  const parallaxSection = parallaxBg?.closest('.parallax-section');

  if (!parallaxBg || !parallaxSection) return;

  let rafId = 0;
  let docTop = 0;
  let height = 0;

  function measure() {
    const rect = parallaxSection.getBoundingClientRect();
    docTop = rect.top + window.scrollY;
    height = rect.height;
  }

  function update() {
    rafId = 0;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const relativeTop = docTop - scrollY;

    if (relativeTop > viewportHeight || relativeTop + height < 0) {
      return;
    }

    const progress = (viewportHeight - relativeTop) / (viewportHeight + height);
    const offset = (progress - 0.5) * PARALLAX_TRAVEL_PX;
    parallaxBg.style.setProperty('--parallax-offset', `${offset}px`);
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = window.requestAnimationFrame(update);
  }

  function refresh() {
    measure();
    scheduleUpdate();
  }

  measure();
  update();

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
}
