import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// [data-reveal] fade-ups, hairlines that draw left→right, vertical dividers that grow downward
export function scrollReveals() {
  gsap.set('[data-reveal]', { y: 40, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.08, overwrite: 'auto' }),
  });

  document.querySelectorAll('.band, .about').forEach((el) => {
    if (el.classList.contains('hero')) return;
    gsap.fromTo(el, { '--draw': 0 }, {
      '--draw': 1, duration: 1.6, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'bottom 95%', once: true },
    });
  });

  const verticals = [
    ...document.querySelectorAll('.pillar + .pillar'),
    ...document.querySelectorAll('.work__mid'),
    ...document.querySelectorAll('.quote + .quote'),
  ];
  verticals.forEach((el) => {
    gsap.fromTo(el, { '--draw': 0 }, {
      '--draw': 1, duration: 1.4, ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

// Section titles condense line by line out of a blur and melt as they leave the top
export function liquidHeadings() {
  document.querySelectorAll('.site .display').forEach((h) => {
    h.removeAttribute('data-reveal');
    gsap.set(h, { opacity: 1, y: 0 });
    const { lines } = SplitText.create(h, { type: 'lines', linesClass: 'lline' });
    gsap.set(lines, { transformOrigin: '50% 100%' });

    const liquid = { opacity: 0, yPercent: 35, scaleY: 1.25, filter: 'blur(12px)' };
    const solid = { opacity: 1, yPercent: 0, scaleY: 1, filter: 'blur(0px)' };
    gsap.set(lines, liquid);
    const condense = () => gsap.to(lines, { ...solid, duration: 1.1, ease: 'power3.out', stagger: 0.12, overwrite: true });
    const melt = (up) => gsap.to(lines, { opacity: 0, yPercent: up ? -30 : 35, scaleY: up ? 1.2 : 1.25, filter: 'blur(10px)', duration: 0.55, ease: 'power2.in', stagger: { each: 0.08, from: up ? 'start' : 'end' }, overwrite: true });
    ScrollTrigger.create({ trigger: h, start: 'top 92%', end: 'bottom 8%', onEnter: condense, onEnterBack: condense, onLeave: () => melt(true), onLeaveBack: () => melt(false) });
    const r = h.getBoundingClientRect();
    if (r.top < innerHeight * 0.92 && r.bottom > innerHeight * 0.08) gsap.set(lines, solid);
  });
}
