import { gsap } from 'gsap';
import { root, reduceMotion, finePointer, state } from './context.js';

// Loader: the signature fills left→right over a grey ghost while fonts and above-the-fold images arrive.
// A fresh desktop visit then waits at the "Draw a Z / press Enter" gate; otherwise the sheet lifts away.
// Returns a promise that resolves as the page is released.
export function setupLoader() {
  const el = document.querySelector('.loader');
  const tpl = document.getElementById('signature-template');
  if (!el || !tpl) { el?.remove(); return Promise.resolve(); }
  if (matchMedia('(max-width: 767px)').matches) { el.remove(); return Promise.resolve(); }

  root.classList.add('is-loading');
  const box = el.querySelector('.loader__sig');
  const ghost = tpl.content.firstElementChild.cloneNode(true);
  const fill = tpl.content.firstElementChild.cloneNode(true);
  ghost.classList.add('loader__ghost');
  fill.classList.add('loader__fill');
  box.append(ghost, fill);

  let seen = false;
  try { seen = sessionStorage.getItem('jrp-loaded') === '1'; sessionStorage.setItem('jrp-loaded', '1'); } catch {}
  const MIN_WRITE = reduceMotion ? 0 : seen ? 0.7 : 1.8; // seconds
  const MAX_WAIT = 8000;                                  // never hold the page longer than this

  // "loaded" = webfonts + every image that isn't lazy
  const imgs = [...document.images].filter((img) => img.loading !== 'lazy');
  const tasks = [
    document.fonts.ready,
    ...imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => {
      img.addEventListener('load', r, { once: true });
      img.addEventListener('error', r, { once: true });
    }))),
  ];
  let done = 0, ready = 0;
  tasks.forEach((t) => t.then(() => { done++; ready = Math.max(ready, done / tasks.length); }));
  setTimeout(() => (ready = 1), Math.max(0, MAX_WAIT - performance.now()));

  return new Promise((resolve) => {
    const start = performance.now();
    let shown = 0;
    const tick = () => {
      const byTime = MIN_WRITE ? Math.min(1, (performance.now() - start) / 1000 / MIN_WRITE) : 1;
      const target = Math.min(ready, byTime);
      shown += (target - shown) * 0.12;
      if (target === 1 && shown > 0.995) shown = 1;
      fill.style.setProperty('--p', (shown * 100).toFixed(2) + '%');
      if (shown < 1) return;

      gsap.ticker.remove(tick);
      if (freshVisit() && !reduceMotion && finePointer) {
        holdToEnter(el, box, () => { state.throughGate = true; root.classList.remove('is-loading'); resolve(); });
        return;
      }
      lift(el, box, resolve);
    };
    gsap.ticker.add(tick);
  });
}

// the sheet lifts away with a curved bottom edge
function lift(el, box, resolve) {
  const exit = gsap.timeline({ delay: reduceMotion ? 0 : 0.25, onComplete: () => el.remove() });
  exit.call(() => { root.classList.remove('is-loading'); resolve(); }, null, reduceMotion ? 0 : 0.35);
  if (reduceMotion) return;
  exit.to(box, { y: -24, opacity: 0, duration: 0.6, ease: 'power3.in' }, 0)
    .to(el, { yPercent: -100, borderBottomLeftRadius: '50% 18vh', borderBottomRightRadius: '50% 18vh', duration: 1.1, ease: 'expo.inOut' }, 0.15);
}

function freshVisit() {
  try {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') return true;
    if (nav && nav.type === 'back_forward') return false;
    return !document.referrer || new URL(document.referrer).origin !== location.origin;
  } catch { return true; }
}

/* Draw a Z to enter: across (right), the diagonal (down-left), across again (right); each stroke needs a real
   run. A dashed Z under the signature fills as strokes are recognised; letting go early empties it.
   Drawn, a circular window opens at the heart of the Z until it fills the screen.
   Enter / Space draws it for you. (The original paints ink on a WebGL water sheet; this uses a 2D canvas.) */
function holdToEnter(el, box, enter) {
  const hint = document.createElement('div');
  hint.className = 'loader__hint';
  hint.innerHTML = 'Draw a Z on the water<span>or press Enter</span>';
  el.appendChild(hint);
  gsap.to(box, { opacity: 0, y: -12, duration: 0.7, ease: 'power2.inOut' });
  gsap.fromTo(hint, { opacity: 0, y: 8 }, { opacity: 0.55, y: 0, duration: 0.9, delay: 0.9, ease: 'power3.out' });

  const NS = 'http://www.w3.org/2000/svg';
  const guide = document.createElementNS(NS, 'svg');
  guide.setAttribute('class', 'loader__guide');
  guide.setAttribute('viewBox', '-100 -70 200 140');
  const zd = 'M-80 -55 L80 -55 L-80 55 L80 55';
  guide.innerHTML = `<defs><filter id="zwater" x="-30%" y="-40%" width="160%" height="180%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="2" seed="4" result="n">` +
    `<animate attributeName="baseFrequency" dur="7s" values="0.018 0.045;0.024 0.055;0.018 0.045" repeatCount="indefinite"/></feTurbulence>` +
    `<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>` +
    `<feGaussianBlur stdDeviation="2.4"/></filter></defs>` +
    `<g filter="url(#zwater)"><path class="loader__guide-track" d="${zd}"/><path class="loader__guide-fill" d="${zd}" pathLength="1"/></g>`;
  el.appendChild(guide);
  const fillP = guide.querySelector('.loader__guide-fill');
  gsap.fromTo(guide, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.3, delay: 0.6, ease: 'power3.out' });

  const canvas = document.createElement('canvas');
  canvas.className = 'loader__ink';
  canvas.width = innerWidth; canvas.height = innerHeight;
  el.prepend(canvas);
  const c2d = canvas.getContext('2d');
  const ink = (a, b, w) => { c2d.lineCap = 'round'; c2d.lineWidth = w; c2d.strokeStyle = '#000'; c2d.beginPath(); c2d.moveTo(a[0], a[1]); c2d.lineTo(b[0], b[1]); c2d.stroke(); };

  const st = { p: 0, shown: 0, R: 0 };
  let drawing = false, done = false, auto = null, pts = [], phase = 0, run = 0, cx = innerWidth / 2, cy = innerHeight / 2;
  const PHASES = [{ ang: 0, need: 70 }, { ang: (3 * Math.PI) / 4, need: 90 }, { ang: 0, need: 70 }];
  const wrap = (d) => { while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

  const draw = () => {
    st.shown += (st.p - st.shown) * 0.2;
    fillP.style.strokeDashoffset = (1 - st.shown).toFixed(4);
    // ink dissolves when the pen lifts early
    if (!drawing && !done) { c2d.globalCompositeOperation = 'destination-out'; c2d.fillStyle = 'rgba(0,0,0,0.08)'; c2d.fillRect(0, 0, canvas.width, canvas.height); c2d.globalCompositeOperation = 'source-over'; }
    const R = st.R;
    el.style.webkitMaskImage = el.style.maskImage = R > 0.5
      ? `radial-gradient(circle at ${cx}px ${cy}px, transparent ${R.toFixed(1)}px, #000 ${(R + 1.2).toFixed(1)}px)` : 'none';
  };
  gsap.ticker.add(draw);

  const begin = (x, y) => {
    if (done) return;
    drawing = true; pts = [[x, y]]; phase = 0; run = 0; st.p = 0;
    c2d.clearRect(0, 0, canvas.width, canvas.height);
    gsap.to(hint, { opacity: 0.35, duration: 0.4, overwrite: 'auto' });
  };
  const move = (x, y) => {
    if (!drawing || done) return;
    const last = pts[pts.length - 1];
    const dx = x - last[0], dy = y - last[1], len = Math.hypot(dx, dy);
    if (len < 4) return;
    pts.push([x, y]);
    ink(last, [x, y], 9);
    const ph = PHASES[phase];
    const diff = wrap(Math.atan2(dy, dx) - ph.ang);
    if (Math.abs(diff) < 0.6) run += len * Math.cos(diff);
    else if (run >= ph.need && phase < 2) {
      const d2 = wrap(Math.atan2(dy, dx) - PHASES[phase + 1].ang);
      if (Math.abs(d2) < 0.6) { phase++; run = len * Math.cos(d2); }
    }
    st.p = Math.min(1, (phase + Math.min(1, run / PHASES[phase].need)) / 3);
    if (phase === 2 && run >= PHASES[2].need) open();
  };
  const end = () => {
    if (!drawing || done) return;
    drawing = false; st.p = 0;
    gsap.to(hint, { opacity: 1, duration: 0.6, overwrite: 'auto' });
  };

  function open() {
    done = true; drawing = false; cleanup(); st.p = 1;
    cx = pts.reduce((n, p) => n + p[0], 0) / pts.length;
    cy = pts.reduce((n, p) => n + p[1], 0) / pts.length;
    const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
    gsap.to([hint, guide], { opacity: 0, duration: 0.35, overwrite: 'auto' });
    gsap.timeline({ onComplete: () => { gsap.ticker.remove(draw); el.remove(); } })
      .to(box, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0)
      .call(() => {
        enter();
        const site = document.querySelector('.site');
        if (site) gsap.fromTo(site, { scale: 1.06, transformOrigin: `${cx}px ${cy}px` }, { scale: 1, duration: 1.6, ease: 'expo.out', clearProps: 'transform,transformOrigin' });
      }, null, 0.25)
      .fromTo(st, { R: 1 }, { R: far, duration: 0.95, ease: 'power1.inOut' }, 0);
  }

  // Enter / Space: the Z draws itself over the guide
  const drawForMe = () => {
    if (done || auto) return;
    const g = guide.getBoundingClientRect();
    const sx = g.width / 200, sy = g.height / 140, ox = g.left + g.width / 2, oy = g.top + g.height / 2;
    const P = [[-80, -55], [80, -55], [-80, 55], [80, 55]].map(([x, y]) => [ox + x * sx, oy + y * sy]);
    const segs = [0, 1, 2].map((i) => Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]));
    const total = segs.reduce((a, b) => a + b, 0);
    const at = (t) => { let d = t * total; for (let i = 0; i < 3; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } d -= segs[i]; } return P[3]; };
    const o = { t: 0 };
    begin(P[0][0], P[0][1]);
    auto = gsap.to(o, { t: 1, duration: 1.1, ease: 'power1.inOut', onUpdate: () => { const q = at(o.t); move(q[0], q[1]); } });
  };

  const onDown = (e) => { if (e.button === 0) { e.preventDefault(); el.setPointerCapture(e.pointerId); begin(e.clientX, e.clientY); } };
  const onMove = (e) => { if (drawing && !auto) (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach((c) => move(c.clientX, c.clientY)); };
  const onUp = () => { if (!auto) end(); };
  const onKey = (e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); drawForMe(); } };
  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
  addEventListener('keydown', onKey);
  function cleanup() {
    el.removeEventListener('pointerdown', onDown);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    removeEventListener('keydown', onKey);
  }
}
