// Shared runtime state: one object so modules never reach into each other
export const root = document.documentElement;

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion) root.classList.add('no-motion');

export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

export const state = {
  lenis: null,          // smooth-scroll instance (null when motion is reduced)
  cursorPill: false,    // true while the labelled pill replaces the pointer (the trail hides)
  throughGate: false,   // true when the visitor entered through the Z gate
  worksScroll: null,    // the sideways-scroll tween of the Selected Works strip
  worksView: null,      // the pinned wrapper of that strip
};

export const clamp = (min, max) => (v) => Math.min(max, Math.max(min, v));
