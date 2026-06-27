import { renderMenu } from './render/menu.js';
import { renderFooter } from './render/page.js';
import { renderEventDetail } from './render/event-detail.js';
import { initLoader } from './modules/loader.js';
import { initNavbar } from './modules/navbar.js';
import { initScrollReveal } from './modules/scroll-reveal.js';
import { initLightbox } from './modules/lightbox.js';
import { preparePageEnter, initPageTransition } from './modules/page-transition.js';
import { initImageFrames } from './modules/image-loader.js';

preparePageEnter();
renderMenu(document.getElementById('navMenu'));

const eventDetailEl = document.getElementById('eventDetail');
renderEventDetail(eventDetailEl);
initLightbox(eventDetailEl);
initImageFrames(eventDetailEl);

renderFooter({
  socialsEl: document.getElementById('footer-socials'),
  brandEl: document.getElementById('footer-brand'),
  contactEl: document.getElementById('footer-contact'),
});

const { loader } = initLoader();
initNavbar();
initScrollReveal({ loader });
initPageTransition();
