export function initParallax() {
  const parallaxBg = document.getElementById('parallaxBg');
  const parallaxSection = parallaxBg?.closest('.parallax-section');

  function updateParallax() {
    if (!parallaxBg || !parallaxSection) return;

    const rect = parallaxSection.getBoundingClientRect();
    const windowH = window.innerHeight;

    if (rect.bottom > 0 && rect.top < windowH) {
      const progress = (windowH - rect.top) / (windowH + rect.height);
      const offset = (progress - 0.5) * 480;
      parallaxBg.style.transform = `translate3d(0, ${offset}px, 0) scale(1.45)`;
    }
  }

  window.addEventListener('scroll', updateParallax, { passive: true });
  updateParallax();
}
