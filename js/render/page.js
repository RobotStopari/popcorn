import { SITE } from '../../data/site.js';
import { renderFooterSocials } from './socials.js';

export function renderFooter({ socialsEl, brandEl, contactEl }) {
  if (socialsEl) renderFooterSocials(socialsEl);

  if (brandEl) {
    brandEl.innerHTML = `
      <img src="${SITE.logo}" alt="${SITE.logoAlt}" class="footer__logo">
      <p class="footer__year">${SITE.footer.year}</p>
    `;
  }

  if (contactEl) {
    contactEl.innerHTML = `
      <p>${SITE.footer.contactLabel}</p>
      <a href="mailto:${SITE.footer.contactEmail}">${SITE.footer.contactEmail}</a>
    `;
  }
}

export function renderHero(quoteEl) {
  if (!quoteEl) return;

  quoteEl.innerHTML = `
    <p class="hero__text">
      <span class="hero__mark hero__mark--open" aria-hidden="true">„</span>${SITE.hero.quoteHtml}<span class="hero__mark hero__mark--close" aria-hidden="true">“</span>
    </p>
  `;
}
