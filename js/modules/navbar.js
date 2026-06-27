export function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('navbar--scrolled', window.scrollY > 10);
  }, { passive: true });

  navToggle?.addEventListener('click', () => {
    const open = navMenu.classList.toggle('navbar__nav--open');
    navToggle.setAttribute('aria-expanded', open);
  });

  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const btn = dropdown.querySelector('.nav-btn--dropdown');

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('nav-dropdown--open');

      document.querySelectorAll('.nav-dropdown--open').forEach((d) => {
        d.classList.remove('nav-dropdown--open');
        d.querySelector('.nav-btn--dropdown')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        dropdown.classList.add('nav-dropdown--open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown--open').forEach((d) => {
      d.classList.remove('nav-dropdown--open');
      d.querySelector('.nav-btn--dropdown')?.setAttribute('aria-expanded', 'false');
    });
  });
}
