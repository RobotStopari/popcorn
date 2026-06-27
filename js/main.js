import { renderPage } from './render/index.js';
import { initLoader } from './modules/loader.js';
import { initNavbar } from './modules/navbar.js';
import { initParallax } from './modules/parallax.js';
import { initScrollReveal } from './modules/scroll-reveal.js';
import { initCalendar } from './calendar/index.js';
import { preparePageEnter, initPageTransition } from './modules/page-transition.js';
import { initImageFrames } from './modules/image-loader.js';

preparePageEnter();
renderPage();
initImageFrames();

const { loader } = initLoader();
initNavbar();
initParallax();
initCalendar();
initScrollReveal({ loader });
initPageTransition();
