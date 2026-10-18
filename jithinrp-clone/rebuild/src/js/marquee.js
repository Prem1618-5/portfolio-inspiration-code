import { gsap } from 'gsap';
import { state, clamp } from './context.js';

// Pixel type that drifts on its own, rushes and flips direction with scroll, and melts (rounder pixels) with speed
export function setupMarquee() {
  const root = document.querySelector('[data-marquee]');
  if (!root) return;
  const track = root.querySelector('.marquee__track');
  const group = track.querySelector('.marquee__group');
  // enough copies to cover the screen twice, so the loop never shows a gap
  const copies = Math.max(2, Math.ceil((innerWidth * 2) / group.offsetWidth) + 1);
  for (let i = 1; i < copies; i++) track.appendChild(group.cloneNode(true));
  const span = group.offsetWidth;
  const clampLean = clamp(-10, 10);

  let x = 0, dir = 1, speed = 0, lean = 0, leanV = 0;
  gsap.ticker.add((time, dt) => {
    const r = root.getBoundingClientRect();
    const step = Math.min(dt, 50) / 1000;
    const vel = state.lenis ? state.lenis.velocity : 0;
    if (Math.abs(vel) > 0.4) dir = vel > 0 ? 1 : -1;                // follow the scroll direction
    const targetSpeed = 70 + Math.min(1400, Math.abs(vel) * 38);    // px/s: drift, then rush
    speed += (targetSpeed - speed) * (1 - Math.exp(-step * 5));
    x -= dir * speed * step;
    x = ((x % span) - span) % span;                                  // wrap within one copy
    leanV += (60 * (clampLean(-vel * 0.25) - lean) - 10 * leanV) * step;
    lean += leanV * step;
    if (r.bottom < 0 || r.top > innerHeight) return;                 // off screen: keep time, skip paint
    gsap.set(track, { x, skewX: Math.round(lean * 100) / 100 });
    root.style.setProperty('--speed', Math.min(19, Math.abs(vel) * 0.45).toFixed(2));
  });
}

// Content tilts (skewY) in the direction of travel with scroll speed and springs back
export function scrollLean() {
  const els = [...document.querySelectorAll('.pillar, .work__intro, .quote, .award')];
  if (!els.length || !state.lenis) return;
  const clampT = clamp(-3.2, 3.2);
  let lean = 0, leanV = 0, shown = null;
  gsap.ticker.add((time, dt) => {
    const step = Math.min(dt, 50) / 1000;
    leanV += (55 * (clampT(-state.lenis.velocity * 0.09) - lean) - 10 * leanV) * step;
    lean += leanV * step;
    const next = Math.round(lean * 100) / 100;
    if (next === shown) return;
    shown = next;
    gsap.set(els, { skewY: next, transformOrigin: '50% 50%' });
  });
}
