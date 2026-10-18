import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { state, clamp } from './context.js';

// Selected Works, sideways: the section pins and the wheel slides the case studies across, one screen each
export function horizontalWorks() {
  const sec = document.querySelector('#works');
  const rows = sec ? [...sec.querySelectorAll(':scope > .work')] : [];
  if (rows.length < 2) return;
  const view = document.createElement('div');
  view.className = 'works__view';
  state.worksView = view;
  const track = document.createElement('div');
  track.className = 'works__track';
  rows[0].before(view);
  view.appendChild(track);
  rows.forEach((r) => track.appendChild(r));

  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  state.worksScroll = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: view, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 },
  });

  // jelly lean: the words trail the motion and settle with a little wobble
  const els = [...track.querySelectorAll('.work__intro, .work__col .fact')];
  const setSkew = els.map((el) => gsap.quickSetter(el, 'skewX', 'deg'));
  const clampT = clamp(-4, 4);
  let last = 0, v = 0, lean = 0, leanV = 0, shown = 0;
  gsap.ticker.add((time, dt) => {
    const step = Math.min(dt, 50) / 1000;
    const x = gsap.getProperty(track, 'x');
    v += ((x - last) / step - v) * (1 - Math.exp(-step * 10));
    last = x;
    leanV += (45 * (clampT(v * 0.005) - lean) - 9 * leanV) * step;
    lean += leanV * step;
    const next = Math.round(lean * 100) / 100;
    if (next === shown) return;
    shown = next;
    setSkew.forEach((f) => f(shown));
  });
}

// Each work row: the media pulls back into its frame, then the title/description lines and facts rise in.
// Played on entry, reversed when scrolling back past. (Original also lands the media on a WebGL water plane.)
export function setupStories() {
  document.querySelectorAll('.work').forEach((row, index) => {
    const side = state.worksScroll && index > 0 ? { containerAnimation: state.worksScroll } : null;
    const media = row.querySelector('.work__media[data-story-media]');
    const intro = row.querySelector('.work__intro');
    if (!media || !intro) return;
    const facts = [...row.querySelectorAll('.fact')];
    [intro, ...facts].forEach((e) => e.removeAttribute('data-reveal'));
    const tLines = SplitText.create(intro.querySelector('.work__title'), { type: 'lines', mask: 'lines' }).lines;
    const dLines = [...intro.querySelectorAll('p')].flatMap((p) => SplitText.create(p, { type: 'lines', mask: 'lines' }).lines);

    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .fromTo(tLines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0)
      .fromTo(dLines, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.035 }, 0.1)
      .fromTo(facts, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: 'power3.out' }, 0.22);

    const HIDDEN = { y: 90, scale: 0.86 };
    gsap.set(media, HIDDEN);
    gsap.set(media, { opacity: 0 });
    const show = () => {
      gsap.fromTo(media, { y: 0, scale: 1.3 }, { y: 0, scale: 1, duration: 1.5, ease: 'power3.inOut', overwrite: 'auto' });
      gsap.fromTo(media, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out', overwrite: 'auto' });
    };
    const hide = () => {
      gsap.to(media, { ...HIDDEN, duration: 0.7, ease: 'power2.in', overwrite: 'auto' });
      gsap.to(media, { opacity: 0, duration: 0.6, overwrite: 'auto' });
    };
    const playText = () => tl.timeScale(1).play();
    const rewindText = () => tl.timeScale(1.8).reverse();
    const pinned = state.worksView ? { pinnedContainer: state.worksView } : {};
    ScrollTrigger.create(side ? { trigger: row, ...side, start: 'left 72%', onEnter: show, onLeaveBack: hide }
                              : { trigger: row, ...pinned, start: 'top 72%', onEnter: show, onLeaveBack: hide });
    ScrollTrigger.create(side ? { trigger: row, ...side, start: 'left 92%', onEnter: playText, onLeaveBack: rewindText }
                              : { trigger: intro, ...pinned, start: 'top 94%', onEnter: playText, onLeaveBack: rewindText });
    if (!side && row.getBoundingClientRect().top < innerHeight * 0.72) { // opened mid-page: show settled
      gsap.set(media, { y: 0, scale: 1, opacity: 1 });
      tl.progress(1);
    }
  });
}
