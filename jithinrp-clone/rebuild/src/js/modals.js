import { gsap } from 'gsap';
import { root, reduceMotion, state } from './context.js';

// Project modals (Gen AI cards): backdrop + panel animate in, Escape closes, Tab stays inside, gallery images load lazily
export function setupProjectModals() {
  const openers = document.querySelectorAll('[data-modal-open]');
  if (!openers.length) return;
  let current = null, lastFocus = null;

  function fillGallery(modal) {
    const g = modal.querySelector('[data-modal-gallery]');
    if (!g || g.dataset.filled) return;
    g.dataset.filled = '1';
    const base = g.dataset.modalGallery, n = +g.dataset.count || 8;
    const exts = ['webp', 'jpg', 'png', 'jpeg'];
    for (let i = 1; i <= n; i++) {
      const name = String(i).padStart(2, '0');
      const img = new Image();
      img.loading = 'lazy';
      img.alt = '';
      let k = 0;
      img.onerror = () => { k += 1; if (k < exts.length) img.src = `${base}${name}.${exts[k]}`; else img.remove(); };
      img.src = `${base}${name}.${exts[0]}`;
      g.appendChild(img);
    }
  }
  function open(id, from) {
    const modal = document.getElementById(id);
    if (!modal || current) return;
    current = modal; lastFocus = from || document.activeElement;
    fillGallery(modal);
    modal.hidden = false;
    root.classList.add('is-modal');
    state.lenis?.stop();
    const panel = modal.querySelector('.pmodal__panel');
    modal.querySelector('video')?.play().catch(() => {});
    if (!reduceMotion) {
      gsap.fromTo(modal.querySelector('.pmodal__backdrop'), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      gsap.fromTo(panel, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
    }
    panel.scrollTop = 0;
    panel.focus({ preventScroll: true });
  }
  function close() {
    if (!current) return;
    const modal = current;
    current = null;
    const done = () => {
      modal.hidden = true;
      root.classList.remove('is-modal');
      state.lenis?.start();
      modal.querySelector('video')?.pause();
      lastFocus?.focus?.({ preventScroll: true });
    };
    if (reduceMotion) return done();
    gsap.to(modal.querySelector('.pmodal__backdrop'), { opacity: 0, duration: 0.3, ease: 'power2.in' });
    gsap.to(modal.querySelector('.pmodal__panel'), { y: 30, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: done });
  }

  openers.forEach((el) => el.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    const track = el.closest('[data-carousel]');
    if (track && track.classList.contains('is-dragging')) return; // a drag, not a click
    e.preventDefault();
    open(el.dataset.modalOpen, el);
  }));
  document.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', close));
  addEventListener('keydown', (e) => {
    if (!current) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key !== 'Tab') return; // keep focus inside the modal
    const f = [...current.querySelectorAll("button, a[href], video[controls], [tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

// Whole case-study row opens its project; the title link stays the keyboard / screen-reader target
export function setupCardLinks() {
  document.querySelectorAll('[data-href]').forEach((card) => {
    const open = (newTab) => {
      if (newTab || card.hasAttribute('data-external')) window.open(card.dataset.href, '_blank', 'noopener');
      else location.href = card.dataset.href;
    };
    card.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;   // real links handle themselves
      if (String(getSelection())) return;          // let people select text
      open(e.metaKey || e.ctrlKey || e.shiftKey);
    });
    card.addEventListener('auxclick', (e) => { if (e.button === 1 && !e.target.closest('a, button')) open(true); });
  });
}
