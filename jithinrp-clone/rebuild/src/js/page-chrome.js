import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reduceMotion, state } from './context.js';

// Quiet reading-progress indicator on the right
export function readingProgress() {
  const el = document.createElement('div');
  el.className = 'progress';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<span class="progress__value">0%</span><span class="progress__line"><span class="progress__fill"></span></span>';
  document.body.appendChild(el);
  const value = el.querySelector('.progress__value');
  const fill = el.querySelector('.progress__fill');
  let shown = -1;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    fill.style.transform = `scaleY(${p.toFixed(4)})`;
    const pct = Math.round(p * 100);
    if (pct !== shown) { shown = pct; value.textContent = pct + '%'; }
  };
  update();
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.6, ease: 'power2.out' });
}

// Footer: live Melbourne time, back-to-top, and a rise-in on arrival
export function setupFooter() {
  const footer = document.querySelector('[data-footer]');
  if (!footer) return;

  const timeEl = footer.querySelector('[data-local-time]');
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: 'numeric', minute: '2-digit', hour12: true });
    const tick = () => (timeEl.textContent = 'Melbourne, ' + fmt.format(new Date()).toUpperCase());
    tick();
    setInterval(tick, 20000);
  }
  const top = footer.querySelector('[data-back-top]');
  if (top) top.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.lenis) state.lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  if (reduceMotion) return;
  const note = footer.querySelector('.footer__note');
  const meta = footer.querySelector('.footer__meta');
  const tl = gsap.timeline({ paused: true })
    .fromTo(note, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out' }, 0)
    .fromTo(meta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 0.3);
  ScrollTrigger.create({ trigger: footer, start: 'top 92%', once: true, onEnter: () => tl.play() });
  if (footer.getBoundingClientRect().top < innerHeight * 0.92) tl.progress(1);
}
