import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import './styles/tokens.css';
import './styles/base.css';
import './styles/loader.css';
import './styles/nav.css';
import './styles/hero.css';
import './styles/works.css';
import './styles/carousels.css';
import './styles/sections.css';
import './styles/modal.css';
import './styles/overlays.css';

import { reduceMotion, state } from './js/context.js';
import { setupLoader } from './js/loader.js';
import { setupSignature } from './js/signature.js';
import { setupNavbar } from './js/navbar.js';
import { setupSmoothScroll } from './js/smooth-scroll.js';
import { introTimeline } from './js/intro.js';
import { scrollReveals, liquidHeadings } from './js/reveals.js';
import { liquidPixels, heroKinetics, heroParallax, liquidTitleExit } from './js/hero.js';
import { setupMarquee, scrollLean } from './js/marquee.js';
import { horizontalWorks, setupStories } from './js/works.js';
import { setupCarousel, setupDragScroll, setupAutoScroll, setupTrackJelly } from './js/carousel.js';
import { setupCursorPill, setupCursorTrail, setupAboutTrail } from './js/cursor.js';
import { setupSound } from './js/sound.js';
import { setupProjectModals, setupCardLinks } from './js/modals.js';
import { readingProgress, setupFooter } from './js/page-chrome.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

if (!matchMedia('(max-width: 767px)').matches) {
  // phones get the "open this on a desktop" note only (see overlays.css)
  const loaderDone = setupLoader();
  const navbar = setupNavbar();
  setupSignature(loaderDone);
  setupSmoothScroll(loaderDone, navbar);

  setupCarousel();
  document.querySelectorAll('.track').forEach(setupDragScroll);
  setupCursorPill();
  setupCardLinks();
  setupProjectModals();
  setupCursorTrail();
  setupSound();
  setupAutoScroll(document.querySelector('.track--quotes'));
  setupTrackJelly(document.querySelector('[data-carousel]'), '.ai-card__title, .ai-card > p');

  // motion starts as the loader lifts
  Promise.all([document.fonts.ready, loaderDone]).then(() => {
    setupFooter();
    if (reduceMotion) return;
    const intro = introTimeline();
    if (state.throughGate) intro.progress(1); // the window opened onto a settled hero
    readingProgress();
    horizontalWorks();   // before setupStories: the case studies slide in sideways
    setupStories();      // before scrollReveals: story elements opt out of the generic fade-up
    setupAboutTrail();
    heroParallax();
    liquidHeadings();    // before scrollReveals: headings opt out of the generic fade-up
    scrollReveals();
    liquidPixels();
    liquidTitleExit();
    heroKinetics();
    setupMarquee();
    scrollLean();
    ScrollTrigger.refresh();
  });

  // lazy images grow the page as they arrive; keep trigger positions in sync
  const refreshSoon = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (!img.complete) img.addEventListener('load', () => refreshSoon.restart(true), { once: true });
  });
} else {
  matchMedia('(max-width: 767px)').addEventListener('change', (e) => { if (!e.matches) location.reload(); });
}
