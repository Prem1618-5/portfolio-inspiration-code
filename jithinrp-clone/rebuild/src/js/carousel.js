import { gsap } from 'gsap';
import { reduceMotion, clamp } from './context.js';

// Arrow buttons glide the Gen AI track one card at a time
export function setupCarousel() {
  const track = document.querySelector('[data-carousel]');
  const prev = document.querySelector('[data-carousel-prev]');
  const next = document.querySelector('[data-carousel-next]');
  if (!track) return;

  const step = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return track.firstElementChild.getBoundingClientRect().width + gap;
  };
  const update = () => {
    const max = track.scrollWidth - track.clientWidth - 2;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max;
  };
  const go = (dir) => {
    const max = track.scrollWidth - track.clientWidth; // aim inside the range so the glide never hits the wall
    const to = clamp(0, max)(Math.round(track.scrollLeft + dir * step()));
    gsap.to(track, { scrollLeft: to, duration: reduceMotion ? 0 : 1.5, ease: 'power2.inOut', overwrite: true });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();
}

// Mouse drag with inertial glide (touch keeps native scrolling)
export function setupDragScroll(track) {
  let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0, v = 0;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false;
    startX = lastX = e.clientX; startScroll = track.scrollLeft; lastT = performance.now(); v = 0;
    gsap.killTweensOf(track);
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
    if (!moved) return;
    track.scrollLeft = startScroll - dx;
    const now = performance.now();
    v = (e.clientX - lastX) / Math.max(1, now - lastT);
    lastX = e.clientX; lastT = now;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (!moved) return;
    requestAnimationFrame(() => track.classList.remove('is-dragging'));
    const max = track.scrollWidth - track.clientWidth;
    gsap.to(track, { scrollLeft: clamp(0, max)(track.scrollLeft - v * 480), duration: 1.9, ease: 'expo.out' });
  });
  track.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  track.addEventListener('dragstart', (e) => e.preventDefault());
}

// Testimonials: seamless auto-scroll loop (cards cloned so the strip wraps); hover stops it with a jelly settle
export function setupAutoScroll(track) {
  if (!track || reduceMotion) return;
  const SPEED = 40; // px per second
  const originals = [...track.children];
  for (let k = 0; k < 2; k++) {
    originals.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }
  let loopWidth = 0;
  const measure = () => { loopWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft; };
  measure();
  addEventListener('resize', measure);
  document.fonts.ready.then(measure);

  let hover = false, visible = false, pos = track.scrollLeft;
  track.addEventListener('pointerenter', () => (hover = true));
  track.addEventListener('pointerleave', () => (hover = false));
  track.addEventListener('focusin', () => (hover = true));
  track.addEventListener('focusout', () => (hover = false));
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(track);

  const cards = [...track.children];
  const clampPush = clamp(-4, 4);
  let speed = SPEED, lean = 0, leanV = 0, leanShown = 0;
  gsap.ticker.add((time, dt) => {
    if (!visible || !loopWidth) return;
    const step = Math.min(dt, 50) / 1000;
    if (track.classList.contains('is-dragging') || gsap.isTweening(track)) { pos = track.scrollLeft; speed = 0; return; }

    const target = hover ? 0 : SPEED;
    const prev = speed;
    speed += (target - speed) * (1 - Math.exp(-step * 3.2)); // ~0.6s viscous ease
    const accel = (speed - prev) / step;
    leanV += (70 * (clampPush(-accel * 0.028) - lean) - 6 * leanV) * step; // underdamped → a little wobble
    lean += leanV * step;
    const shown = Math.round(lean * 100) / 100;
    if (shown !== leanShown) {
      leanShown = shown;
      for (const c of cards) c.style.transform = shown ? `skewX(${shown}deg)` : '';
    }
    if (hover && speed < 0.5) { pos = track.scrollLeft; return; } // stopped: let people scroll it by hand
    pos += speed * step;
    if (pos >= loopWidth) pos -= loopWidth;
    if (pos < 0) pos += loopWidth;
    track.scrollLeft = pos;
  });
}

// Text leans with a horizontal track's scroll speed and springs back
export function setupTrackJelly(track, textSelector) {
  if (!track || reduceMotion) return;
  const els = [...track.querySelectorAll(textSelector)];
  const clampT = clamp(-4, 4);
  let last = track.scrollLeft, v = 0, lean = 0, leanV = 0, shown = 0;
  gsap.ticker.add((time, dt) => {
    const step = Math.min(dt, 50) / 1000;
    const sl = track.scrollLeft;
    v += ((sl - last) / step - v) * (1 - Math.exp(-step * 10));
    last = sl;
    leanV += (45 * (clampT(-v * 0.005) - lean) - 9 * leanV) * step;
    lean += leanV * step;
    const next = Math.round(lean * 100) / 100;
    if (next === shown) return;
    shown = next;
    for (const el of els) el.style.transform = shown ? `skewX(${shown}deg)` : '';
  });
}
