import { gsap } from 'gsap';
import { reduceMotion, finePointer, state, clamp } from './context.js';

// Over [data-cursor-pill] the pointer becomes a black pill that trails the mouse and leans into its motion
export function setupCursorPill() {
  if (!finePointer || !document.querySelector('[data-cursor-pill]')) return;

  const pill = document.createElement('div');
  pill.className = 'cursor-pill';
  pill.setAttribute('aria-hidden', 'true');
  document.body.appendChild(pill);
  gsap.set(pill, { scale: 0, autoAlpha: 0 });

  const xTo = gsap.quickTo(pill, 'x', { duration: 0.35, ease: 'power3' });
  const yTo = gsap.quickTo(pill, 'y', { duration: 0.35, ease: 'power3' });
  const lean = clamp(-10, 10);
  let current = null, lastX = 0, flipped = false;

  // near the right edge the pill opens to the left of the pointer
  function side(x) {
    const flip = !!current && x + pill.offsetWidth + 16 > innerWidth;
    if (flip === flipped) return;
    flipped = flip;
    gsap.to(pill, { xPercent: flip ? -100 : 0, duration: 0.35, ease: 'power3.out' });
    pill.style.transformOrigin = flip ? '100% 0' : '0 0';
  }

  addEventListener('pointermove', (e) => {
    side(e.clientX);
    xTo(e.clientX);
    yTo(e.clientY);
    if (current) gsap.to(pill, { skewX: lean((lastX - e.clientX) * 0.6), duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    lastX = e.clientX;
  }, { passive: true });

  // nearest labelled ancestor wins, so a tool chip inside a card swaps the label and back
  function show(el, e) {
    if (el === current) return;
    if (!el) return hide();
    const note = el.dataset.cursorNote;
    pill.textContent = el.dataset.cursorPill;
    pill.classList.toggle('has-note', !!note);
    if (note) {
      const small = document.createElement('span');
      small.className = 'cursor-pill__note';
      small.textContent = note;
      pill.appendChild(small);
    }
    if (!current && gsap.getProperty(pill, 'scale') < 0.05) gsap.set(pill, { x: e.clientX, y: e.clientY });
    current = el;
    side(e.clientX);
    state.cursorPill = true;
    gsap.to(pill, { scale: 1, autoAlpha: 1, duration: reduceMotion ? 0 : 0.55, ease: 'back.out(2.2)', overwrite: 'auto' });
  }
  function hide() {
    if (!current) return;
    current = null;
    state.cursorPill = false;
    gsap.to(pill, { scale: 0, autoAlpha: 0, skewX: 0, duration: reduceMotion ? 0 : 0.3, ease: 'power3.in', overwrite: 'auto' });
  }
  document.addEventListener('pointerover', (e) => { if (e.pointerType === 'mouse') show(e.target.closest('[data-cursor-pill]'), e); });
  document.documentElement.addEventListener('pointerleave', hide);
}

// A short tapered tail that stretches behind the pointer while it moves and retracts when it stops
export function setupCursorTrail() {
  if (reduceMotion || !finePointer) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'cursor-trail';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const COUNT = 14;    // segments in the tail
  const HEAD = 4;      // head radius in px
  const FOLLOW = 0.42; // how tightly each segment chases the one ahead
  const pts = Array.from({ length: COUNT }, () => ({ x: -100, y: -100 }));
  const mouse = { x: -100, y: -100 };
  let alpha = 0, seen = false, drawn = false;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!seen) { pts.forEach((p) => { p.x = mouse.x; p.y = mouse.y; }); seen = true; }
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { seen = false; alpha = 0; });

  gsap.ticker.add(() => {
    if (!seen && !drawn) return;
    pts[0].x += (mouse.x - pts[0].x) * 0.6;
    pts[0].y += (mouse.y - pts[0].y) * 0.6;
    for (let i = 1; i < COUNT; i++) {
      pts[i].x += (pts[i - 1].x - pts[i].x) * FOLLOW;
      pts[i].y += (pts[i - 1].y - pts[i].y) * FOLLOW;
    }
    const tail = Math.hypot(pts[0].x - pts[COUNT - 1].x, pts[0].y - pts[COUNT - 1].y); // visible only while stretched, never with the pill
    const target = seen && !state.cursorPill ? Math.min(1, tail / 40) : 0;
    alpha += (target - alpha) * 0.2;

    ctx.clearRect(0, 0, innerWidth, innerHeight);
    drawn = alpha > 0.01;
    if (!drawn) return;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = ctx.fillStyle = '#fff';
    ctx.lineCap = 'round';
    for (let i = 0; i < COUNT - 1; i++) {
      ctx.lineWidth = HEAD * 2 * (1 - i / COUNT);
      ctx.beginPath();
      ctx.moveTo(pts[i].x, pts[i].y);
      ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      ctx.stroke();
    }
  });
}

// About: photos pop in along the cursor's path, drift on, then sink and fade
export function setupAboutTrail() {
  const about = document.querySelector('.about');
  if (!about || !finePointer) return;
  const SRC = [1, 2, 3, 4, 5, 6].map((n) => `assets/about-trail/${n}.webp`);
  const layer = document.createElement('div');
  layer.className = 'about-trail';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  const pool = Array.from({ length: 12 }, () => {
    const img = document.createElement('img');
    img.alt = ''; img.decoding = 'async';
    layer.appendChild(img);
    gsap.set(img, { opacity: 0 });
    return img;
  });
  let loaded = false, next = 0, pick = 0, z = 1, last = null, lastT = 0;
  const load = () => { if (loaded) return; loaded = true; SRC.forEach((src) => { new Image().src = src; }); };
  about.addEventListener('pointerenter', load, { passive: true });
  about.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    load();
    const now = performance.now();
    if (!last) { last = { x: e.clientX, y: e.clientY }; lastT = now; return; }
    const dx = e.clientX - last.x, dy = e.clientY - last.y, d = Math.hypot(dx, dy);
    if (d < 55) return; // one every so often along the path
    const v = d / Math.max(16, now - lastT);
    last = { x: e.clientX, y: e.clientY }; lastT = now;
    const img = pool[next]; next = (next + 1) % pool.length;
    img.src = SRC[pick]; pick = (pick + 1) % SRC.length;
    const w = 170, h = 226, drift = Math.min(1.6, v) * 70;
    gsap.killTweensOf(img);
    gsap.set(img, { x: e.clientX - w / 2, y: e.clientY - h / 2, zIndex: ++z, rotation: gsap.utils.random(-9, 9), scale: 0.55, opacity: 0 });
    gsap.timeline()
      .to(img, { opacity: 1, scale: 1, duration: 0.35, ease: 'expo.out' }, 0)
      .to(img, { x: `+=${(dx / d) * drift}`, y: `+=${(dy / d) * drift}`, duration: 0.8, ease: 'power3.out' }, 0)
      .to(img, { opacity: 0, scale: 0.86, y: '+=26', duration: 0.42, ease: 'power2.in' }, 0.36);
  }, { passive: true });
  about.addEventListener('pointerleave', () => { last = null; }, { passive: true });
}
