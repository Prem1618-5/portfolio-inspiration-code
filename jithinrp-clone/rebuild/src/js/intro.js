import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';

// Entrance timeline: nav, hero lede lines, meta items, pixel name letters, LinkedIn badge, hero hairline
export function introTimeline() {
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.nav > *', { y: -20, autoAlpha: 0, duration: 1.1, stagger: 0.08, clearProps: 'transform,opacity,visibility' });

  // lines rise out of a mask
  document.querySelectorAll('[data-intro-lines]').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    el.removeAttribute('data-reveal');
    tl.set(el, { opacity: 1 }, 0).from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.09 }, 0.1);
  });

  const items = document.querySelectorAll('[data-intro-item]');
  if (items.length) tl.from(items, { y: 14, autoAlpha: 0, duration: 1, stagger: 0.05 }, 0.35);

  // pixel titles: letters rise, starting as droplets and settling into squares (ELSH axis 20 → 1)
  document.querySelectorAll('[data-pixel-title]').forEach((el) => {
    const { chars } = SplitText.create(el, { type: 'words,chars', wordsClass: 'word', charsClass: 'char', mask: 'chars' });
    tl.from(chars, { yPercent: 105, duration: 1.5, stagger: 0.045 }, 0.3)
      .fromTo(chars, { '--elsh': 20 }, { '--elsh': 1, duration: 1.6, stagger: 0.045, ease: 'power2.out' }, 0.45);
  });

  if (document.querySelector('.hero__linkedin')) {
    tl.fromTo('.hero__linkedin', { scale: 0 }, { scale: 1, duration: 1, ease: 'back.out(2)' }, 1);
  }

  const heroLine = document.querySelector('.hero');
  if (heroLine) {
    gsap.set(heroLine, { '--draw': 0 });
    tl.to(heroLine, { '--draw': 1, duration: 1.6, ease: 'expo.inOut' }, 0.6);
  }
  return tl;
}
