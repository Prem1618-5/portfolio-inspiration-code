import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduceMotion, state } from './context.js';

// Lenis drives ScrollTrigger; stopped until the loader has lifted
export function setupSmoothScroll(loaderDone, navbar) {
  if (!reduceMotion) {
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    loaderDone.then(() => lenis.start());
    state.lenis = lenis;
  }

  // in-page anchors scroll to their target, offset by the compact navbar
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return e.preventDefault();
      const target = document.querySelector(id);
      if (!target || target.classList.contains('pmodal')) return;
      e.preventDefault();
      if (state.lenis) state.lenis.scrollTo(target, { duration: 1.4, offset: -(navbar.compactHeight() + 24) });
      else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
}
