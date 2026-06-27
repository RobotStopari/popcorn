import { renderHero, renderFooter } from './page.js';
import { renderMenu } from './menu.js';
import { renderUpcomingEvents, renderPastEvents } from './events.js';
import { renderSocialBand } from './socials.js';

export function renderPage() {
  renderHero(document.querySelector('.hero__quote'));
  renderMenu(document.getElementById('navMenu'));

  renderUpcomingEvents({
    labelEl: document.getElementById('upcoming-label'),
    gridEl: document.getElementById('upcoming-events'),
    ctaEl: document.getElementById('upcoming-cta'),
  });

  renderPastEvents({
    labelEl: document.getElementById('past-label'),
    gridEl: document.getElementById('past-events'),
    ctaEl: document.getElementById('past-cta'),
  });

  renderSocialBand(document.getElementById('social-band'));

  renderFooter({
    socialsEl: document.getElementById('footer-socials'),
    brandEl: document.getElementById('footer-brand'),
    contactEl: document.getElementById('footer-contact'),
  });
}
