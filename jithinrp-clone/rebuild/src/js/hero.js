import { gsap } from 'gsap';
import { state, finePointer, clamp } from './context.js';

// Hover: a pixel melts into a droplet (ELSH axis) and re-forms with an elastic settle
export function liquidPixels() {
  document.querySelectorAll('[data-pixel-title] .char').forEach((c) => {
    c.addEventListener('pointerenter', () => {
      gsap.to(c, { '--elsh': 20, duration: 0.5, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(c, { '--elsh': 1, duration: 1.4, delay: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

// The name melts toward the cursor, an idle ripple drifts across it, scroll speed rounds and leans each letter;
// the lede and meta drift up at different speeds as the hero leaves.
export function heroKinetics() {
  const title = document.querySelector('.hero__name');
  const hero = document.querySelector('.hero');
  if (!title || !hero) return;
  const chars = [...title.querySelectorAll('.char')];
  if (!chars.length) return;

  let mx = -1e4, my = -1e4;
  addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; } }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { mx = my = -1e4; });

  const field = chars.map(() => 0);
  const lean = chars.map(() => ({ v: 0, x: 0 })); // per-letter spring
  const RIPPLE_EVERY = 6.5;                        // seconds between idle ripples
  const clampV = clamp(-60, 60), clampLean = clamp(-9, 9);

  gsap.ticker.add((time, dt) => {
    const tr = title.getBoundingClientRect();
    if (tr.bottom < -200 || tr.top > innerHeight + 200) { // off screen: rest upright and solid
      if (lean[0].x !== 0 || field[0] !== 0) {
        lean.forEach((s) => { s.x = 0; s.v = 0; });
        field.fill(0);
        chars.forEach((c) => { c.style.setProperty('--field', '0'); gsap.set(c, { skewX: 0 }); });
      }
      return;
    }
    const step = Math.min(dt, 50) / 1000;
    const vel = state.lenis ? clampV(state.lenis.velocity) : 0;
    const ripple = ((time % RIPPLE_EVERY) / 1.6) * 1.5 - 0.25; // sweeps 0→1 over ~1.6s, then rests
    chars.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const d2 = (mx - cx) ** 2 + ((my - cy) * 1.3) ** 2;
      const u = (cx - tr.left) / tr.width;
      let target = 13 * Math.exp(-d2 / (2 * 170 * 170));                 // warmth of the cursor
      target += 6 * Math.exp(-((u - ripple) ** 2) / (2 * 0.07 * 0.07));  // idle ripple
      target += Math.min(9, Math.abs(vel) * 0.3);                         // speed rounds the pixels
      field[i] += (target - field[i]) * (1 - Math.exp(-step * 9));
      c.style.setProperty('--field', field[i].toFixed(2));
      const s = lean[i], k = 70 - i * 4; // later letters respond a touch slower
      s.v += (k * (clampLean(-vel * 0.22) - s.x) - 11 * s.v) * step;
      s.x += s.v * step;
      gsap.set(c, { skewX: Math.round(s.x * 100) / 100 });
    });
  });

  const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 };
  gsap.to('.hero__lede', { y: -140, ease: 'none', scrollTrigger: scrub });
  gsap.to('.hero__meta', { y: -70, ease: 'none', scrollTrigger: { ...scrub } });
}

// Hero layers part at different rates on scroll (lede lags, name leads); the pointer tilts them apart a touch
export function heroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const layers = [['.hero__lede', 0.28, -12], ['.hero__meta', 0.12, -6], ['.hero__name-row', -0.1, 16]]
    .map(([q, k, m]) => [hero.querySelector(q), k, m]).filter(([el]) => el);
  if (!layers.length) return;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  if (finePointer) addEventListener('pointermove', (e) => {
    tilt.tx = (e.clientX / innerWidth) * 2 - 1;
    tilt.ty = (e.clientY / innerHeight) * 2 - 1;
  }, { passive: true });
  let lastKey = '';
  gsap.ticker.add(() => {
    const y = window.scrollY, h = hero.offsetHeight + hero.offsetTop;
    if (y > h + 200) { if (lastKey !== 'off') { layers.forEach(([el]) => (el.style.translate = '')); lastKey = 'off'; } return; }
    tilt.x += (tilt.tx - tilt.x) * 0.06;
    tilt.y += (tilt.ty - tilt.y) * 0.06;
    const near = Math.max(0, 1 - y / h); // the tilt fades as the hero leaves
    const key = `${y}|${tilt.x.toFixed(3)}|${tilt.y.toFixed(3)}`;
    if (key === lastKey) return;
    lastKey = key;
    layers.forEach(([el, k, m]) => {
      el.style.translate = `${(tilt.x * m * near).toFixed(1)}px ${(y * k + tilt.y * m * 0.6 * near).toFixed(1)}px`;
    });
  });
}

// As the title leaves: pixels round into droplets (--melt) and letters sink into their masks at random. Scrubbed.
export function liquidTitleExit() {
  document.querySelectorAll('[data-pixel-title]').forEach((title) => {
    const chars = title.querySelectorAll('.char');
    if (!chars.length) return;
    gsap.timeline({ scrollTrigger: { trigger: title, start: 'top 30%', end: 'bottom 5%', scrub: 0.8 } })
      .fromTo(title, { '--melt': 0 }, { '--melt': 19, duration: 0.5, ease: 'none', immediateRender: false }, 0)
      .fromTo(chars, { y: 0, opacity: 1, filter: 'blur(0px)' }, {
        y: (i, el) => el.offsetHeight * gsap.utils.random(0.7, 1.3),
        opacity: 0, filter: 'blur(4px)', duration: 0.6, ease: 'power2.in',
        stagger: { each: 0.06, from: 'random' }, immediateRender: false,
      }, 0.25);
  });
}
