import { gsap } from 'gsap';
import { reduceMotion } from './context.js';

// The "Jithin" logo writes itself stroke by stroke, then the ink fills in; hovering writes it again.
export function setupSignature(loaderDone) {
  const tpl = document.getElementById('signature-template');
  if (!tpl) return;

  document.querySelectorAll('.nav__brand').forEach((brand) => {
    const svg = tpl.content.firstElementChild.cloneNode(true);
    if (!brand.hasAttribute('aria-label')) brand.setAttribute('aria-label', 'Jithin');
    brand.textContent = '';
    brand.appendChild(svg);
    if (reduceMotion) return;

    const ink = svg.querySelector('.signature__ink');
    const paths = [...svg.querySelectorAll('.signature__pen path')];
    const lengths = paths.map((p) => p.getTotalLength());
    const total = lengths.reduce((a, b) => a + b, 0);
    const WRITE = 1.9; // seconds for the whole signature at 1x

    const tl = gsap.timeline({ paused: true });
    tl.set(ink, { opacity: 0 }, 0).set(paths, { opacity: 1 }, 0);
    let at = 0;
    paths.forEach((p, i) => {
      const d = (WRITE * lengths[i]) / total;
      tl.fromTo(p, { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] }, { strokeDashoffset: 0, duration: d, ease: 'power1.inOut' }, at);
      at += d * 0.82; // next stroke starts just before the pen lifts
    });
    tl.to(ink, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '>-0.25')
      .to(paths, { opacity: 0, duration: 0.4 }, '<0.2');

    gsap.set(ink, { opacity: 0 });
    gsap.set(paths, { strokeDasharray: (i) => lengths[i], strokeDashoffset: (i) => lengths[i] });
    loaderDone.then(() => gsap.delayedCall(0.25, () => tl.play()));
    brand.addEventListener('pointerenter', () => { if (!tl.isActive()) tl.timeScale(1.5).restart(); });
  });
}
