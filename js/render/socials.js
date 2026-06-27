import { FOOTER_ICON_SIZE } from '../../data/icons.js';
import { SOCIALS } from '../../data/socials.js';

function resizeIcon(svg, size) {
  return svg.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
}

function renderBandLink(social) {
  return `
    <a href="${social.href}" class="social-btn social-btn--${social.id} shine-hover reveal" aria-label="${social.label}">
      ${social.icon}
      <span>${social.label}</span>
    </a>
  `;
}

function renderFooterLink(social) {
  return `
    <a href="${social.href}" class="footer__social-link footer__social-link--${social.id}" aria-label="${social.label}">
      ${resizeIcon(social.icon, FOOTER_ICON_SIZE)}
    </a>
  `;
}

export function renderSocialBand(container) {
  if (!container) return;

  container.innerHTML = SOCIALS
    .filter((social) => social.showInBand)
    .map(renderBandLink)
    .join('');
}

export function renderFooterSocials(container) {
  if (!container) return;

  container.innerHTML = SOCIALS
    .filter((social) => social.showInFooter)
    .map(renderFooterLink)
    .join('');
}
