# Animation Reference

> Cinematic motion design extracted from live DOM. Follow these specs exactly to recreate the experience.

## Motion Technology Stack

| Library | Type | Notes |
|---------|------|-------|
| **GSAP v3.13.0** | animation |  |
| **ScrollTrigger** | scroll |  |
| **Three.js v159** | 3d |  |
| **Web Animations API (2 active)** | animation |  |
| Canvas (3 elements) | WebGL/3D | WebGL context detected — likely Three.js or custom shader |

## Scroll Journey

The page is **7,909px** tall. Each frame below shows what the user sees at that scroll depth.

> **Use these screenshots to understand WHAT animates, WHEN it animates, and HOW it moves.**

### 0% — Top / Hero
Scroll position: 0px

![Scroll 0%](../screens/scroll/scroll-000.png)

### 17% — Opening Section
Scroll position: 1,192px

![Scroll 17%](../screens/scroll/scroll-017.png)

### 33% — First Feature Section
Scroll position: 2,313px

![Scroll 33%](../screens/scroll/scroll-033.png)

### 50% — Mid-Page
Scroll position: 3,505px

![Scroll 50%](../screens/scroll/scroll-050.png)

### 67% — Lower Content
Scroll position: 4,696px

![Scroll 67%](../screens/scroll/scroll-067.png)

### 83% — Near Footer
Scroll position: 5,817px

![Scroll 83%](../screens/scroll/scroll-083.png)

### 100% — Bottom / Footer
Scroll position: 7,009px

![Scroll 100%](../screens/scroll/scroll-100.png)

## Video Elements

| # | Role | Autoplay | Loop | Muted | Size | First Frame |
|---|------|----------|------|-------|------|-------------|
| 1 | content | — | ✓ | ✓ | 436×569 | — |
| 2 | content | — | ✓ | ✓ | 436×569 | — |
| 3 | content | — | ✓ | ✓ | 436×569 | — |
| 4 | content | — | ✓ | ✓ | 436×569 | — |
| 5 | content | — | ✓ | ✓ | 436×569 | — |
| 6 | content | — | ✓ | ✓ | — | — |

- **Source:** `https://jithinrp.com/assets/slot-booking-trailer-story-web.mp4`
- **Poster:** `https://jithinrp.com/assets/slot-booking-trailer-story-poster.webp`
- **Source:** `https://jithinrp.com/assets/community-trailer-story-web.mp4`
- **Poster:** `https://jithinrp.com/assets/community-trailer-story-poster.webp`
- **Source:** `https://jithinrp.com/assets/ai/parcel-sorter/preview.mp4`
- **Poster:** `https://jithinrp.com/assets/ai/parcel-sorter/poster.webp`
- **Source:** `https://jithinrp.com/assets/ai/undo/preview.mp4?v=3`
- **Poster:** `https://jithinrp.com/assets/ai/undo/poster.webp?v=3`
- **Source:** `https://jithinrp.com/assets/ai/stickskate/preview.mp4?v=4`
- **Poster:** `https://jithinrp.com/assets/ai/stickskate/poster.webp?v=4`
- **Source:** `https://jithinrp.com/assets/ai/parcel-sorter/preview.mp4`
- **Poster:** `https://jithinrp.com/assets/ai/parcel-sorter/poster.webp`

## Scroll Animation Patterns

| Pattern | Library | Element Count | Duration | Delay | Easing |
|---------|---------|---------------|----------|-------|--------|
| scroll-reveal (paused → running) | CSS + IntersectionObserver | 1 | — | — | — |

### CSS + IntersectionObserver Implementation

```css
.animate-on-scroll {
  opacity: 0;
  transform: translateY(40px);
  animation: fadeSlideUp 0.6s ease-out forwards;
  animation-play-state: paused;
}
.animate-on-scroll.visible {
  animation-play-state: running;
}
```

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('visible');
  });
}, { threshold: 0.1 });
document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
```

## CSS Keyframes (2 extracted)

### `@keyframes sound-wave-travel`

Duration: `1.1s` · Easing: `linear` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.sound-toggle__path`

```css
@keyframes sound-wave-travel {
  0% {
    transform: translateX(0px);
  }
  100% {
    transform: translateX(-12px);
  }
}
```

> Transform/motion animation

### `@keyframes grain`

Duration: `0.9s` · Easing: `steps(6)` · Delay: `0s` · Iteration: `infinite` · Fill: `none`

Used by: `.grain`

```css
@keyframes grain {
  0% {
    transform: translate(0px, 0px);
  }
  17% {
    transform: translate(-3%, 2%);
  }
  33% {
    transform: translate(2%, -4%);
  }
  50% {
    transform: translate(-4%, -1%);
  }
  67% {
    transform: translate(3%, 3%);
  }
  83% {
    transform: translate(-1%, 4%);
  }
  100% {
    transform: translate(1%, -2%);
  }
}
```

> Transform/motion animation

## Motion Tokens (CSS Variables)

### Easing Tokens

```css
--ease-liquid: cubic-bezier(0.22, 1, 0.36, 1);
```

## Global Transition Declarations

These `transition` values were extracted from CSS rules across the site:

```css
transition: padding-bottom 0.5s var(--ease-liquid);
transition: opacity 0.4s var(--ease-liquid);
transition: margin-top 0.5s var(--ease-liquid);
transition: background-color 0.3s var(--ease-liquid);
transition: transform 0.5s var(--ease-liquid);
transition: transform 0.6s var(--ease-liquid), opacity 0.4s;
transition: color 0.3s var(--ease-liquid);
transition: background-color 0.4s var(--ease-liquid), color 0.4s var(--ease-liquid), border-radius 0.4s var(--ease-liquid);
transition: color 0.5s var(--ease-liquid);
transition: transform 0.7s var(--ease-liquid), border-radius 0.7s var(--ease-liquid);
transition: transform 0.45s var(--ease-liquid);
transition: background-size 0.6s var(--ease-liquid);
```

## How to Recreate This Motion Design

### Step 1 — Install Dependencies

```bash
npm install gsap
npm install gsap
npm install three
```

### Step 2 — Scroll-Reveal Pattern

Elements that animate into view follow this pattern:

```css
/* Initial hidden state */
.reveal {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Step 3 — Key Motion Principles

- **WebGL/3D layer detected** — product visualizations use Three.js or custom WebGL. Use `<canvas>` with Three.js for 3D product renders
- **GSAP ScrollTrigger** — scroll-linked animations (product rotation, parallax) use `ScrollTrigger.scrub` for frame-perfect scroll sync
- **Canvas elements (3)** — animated via requestAnimationFrame loop. Use canvas for particle effects, gradient animations, and WebGL scenes
- **Duration scale:** `0.5s` · `0.4s` · `0.3s` — use these values, never invent new durations
- **Always add** `@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

### Step 4 — Scroll Journey Reference

Match what happens at each scroll position:

- **0%** (`0px`) → `screens/scroll/scroll-000.png`
- **17%** (`1192px`) → `screens/scroll/scroll-017.png`
- **33%** (`2313px`) → `screens/scroll/scroll-033.png`
- **50%** (`3505px`) → `screens/scroll/scroll-050.png`
- **67%** (`4696px`) → `screens/scroll/scroll-067.png`
- **83%** (`5817px`) → `screens/scroll/scroll-083.png`
- **100%** (`7009px`) → `screens/scroll/scroll-100.png`

