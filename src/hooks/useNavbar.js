import { useEffect } from 'react';

export function useNavbar() {
  useEffect(() => {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    const onScroll = () => {
      navbar?.classList.toggle('navbar--scrolled', window.scrollY > 10);
    };

    const onToggle = () => {
      const open = navMenu?.classList.toggle('navbar__nav--open');
      navToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    const closeDropdowns = () => {
      document.querySelectorAll('.nav-dropdown--open').forEach((dropdown) => {
        dropdown.classList.remove('nav-dropdown--open');
        dropdown.querySelector('.nav-btn--dropdown')?.setAttribute('aria-expanded', 'false');
      });
    };

    const onDocClick = () => {
      closeDropdowns();
    };

    const onNavClick = (event) => {
      const btn = event.target.closest('.nav-btn--dropdown');
      if (!btn || !navMenu?.contains(btn)) return;

      event.stopPropagation();
      const dropdown = btn.closest('.nav-dropdown');
      if (!dropdown) return;

      const isOpen = dropdown.classList.contains('nav-dropdown--open');
      closeDropdowns();

      if (!isOpen) {
        dropdown.classList.add('nav-dropdown--open');
        btn.setAttribute('aria-expanded', 'true');
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    navToggle?.addEventListener('click', onToggle);
    document.addEventListener('click', onDocClick);
    navMenu?.addEventListener('click', onNavClick);
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      navToggle?.removeEventListener('click', onToggle);
      document.removeEventListener('click', onDocClick);
      navMenu?.removeEventListener('click', onNavClick);
    };
  });
}
