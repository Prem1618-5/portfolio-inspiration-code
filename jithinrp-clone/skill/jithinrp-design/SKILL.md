---
name: jithinrp-design
description: Design system skill for jithinrp. Activate when building UI components, pages, or any visual elements. Provides exact color tokens, typography scale, spacing grid, component patterns, and craft rules. Read references/DESIGN.md before writing any CSS or JSX. Includes ultra-mode visual journey: read references/ANIMATIONS.md, references/LAYOUT.md, references/COMPONENTS.md, and references/INTERACTIONS.md for full motion and layout details.
---

# jithinrp Design System

You are building UI for **jithinrp**. Dark-themed, cool palette, sans-serif typography (Awesome Serif Italic), compact density on a 4px grid.

## Visual Reference

**IMPORTANT**: Study ALL screenshots below before writing any UI. Match colors, typography, spacing, layout, and motion exactly as shown.

### Scroll Journey (Cinematic Visual States)

> These screenshots capture the website at different scroll depths. The design changes dramatically as you scroll — each frame shows a different cinematic state. Replicate these exact visual transitions.

#### 0% — Hero / Above the fold

![Scroll 0%](screens/scroll/scroll-000.png)

#### 17% — Mid-page at 17% scroll

![Scroll 17%](screens/scroll/scroll-017.png)

#### 33% — Mid-page at 33% scroll

![Scroll 33%](screens/scroll/scroll-033.png)

#### 50% — Mid-page at 50% scroll

![Scroll 50%](screens/scroll/scroll-050.png)

#### 67% — Mid-page at 67% scroll

![Scroll 67%](screens/scroll/scroll-067.png)

#### 83% — Mid-page at 83% scroll

![Scroll 83%](screens/scroll/scroll-083.png)

#### 100% — Footer / End of page

![Scroll 100%](screens/scroll/scroll-100.png)

> Read `references/DESIGN.md` for full token details. Read `references/ANIMATIONS.md` for motion specs. Read `references/LAYOUT.md` for layout structure. Read `references/COMPONENTS.md` for component patterns.

## Ultra Reference Files

This package includes extended documentation. **Read these files before implementing:**

| File | Contents |
|------|----------|
| `references/DESIGN.md` | Full design system tokens, colors, typography, spacing |
| `references/VISUAL_GUIDE.md` | **START HERE** — Master visual guide with all screenshots embedded |
| `references/ANIMATIONS.md` | CSS keyframes, scroll triggers, motion library stack, video specs |
| `references/LAYOUT.md` | Flex/grid containers, page structure, spacing relationships |
| `references/COMPONENTS.md` | DOM component patterns, HTML structure, class fingerprints |
| `references/INTERACTIONS.md` | Hover/focus states with before/after style diffs |
| `screens/scroll/` | 7 scroll journey screenshots showing cinematic states |

### Animation Stack Detected

- **GSAP** v3.13.0 — animation
- **ScrollTrigger** — scroll
- **Three.js** v159 — 3d
- **Web Animations API (2 active)** — animation

## Design Philosophy

- **Layered depth** — use shadow tokens to create a sense of physical layering. Each elevation level has a specific shadow.
- **Gradient accents** — gradients are used thoughtfully for emphasis, not decoration.
- **Type pairing** — Awesome Serif Italic for body/UI text, Aeonik for headings/display. Never introduce a third typeface.
- **compact density** — 4px base grid. Every dimension is a multiple of 4.
- **cool palette** — the color temperature runs cool, matching the sans-serif typography.
- **Restrained accent** — `#178a4c` is the only pop of color. Used exclusively for CTAs, links, focus rings, and active states.
- **Subtle motion** — transitions smooth state changes. Keep durations under 300ms, use ease-out curves.

## Color System

### Core Palette

| Role | Token | Hex | Use |
|------|-------|-----|-----|
| Background | `--background` | `#000000` | Page/app background |
| Surface | `--surface` | `#111111` | Cards, panels, modals |
| Text Primary | `--text-primary` | `#ffffff` | Headings, body text |
| Text Muted | `--text-muted` | `#555555` | Captions, placeholders |
| Accent | `--accent` | `#178a4c` | CTAs, links, focus rings |
| Border | `--border` | `#333333` | Dividers, card borders |

### Status Colors

| Status | Hex | Use |
|--------|-----|-----|
| Success | `#1f7a4d` | Confirmations, positive trends |
| Warning | `#f2e8d0` | Caution states, pending items |
| Danger | `#e5502f` | Errors, destructive actions |

### Extended Palette

- `#eeeeee` — Light surface or highlight color
- `#e2e2e2` — Light surface or highlight color
- `#8a8a8a`
- `#494949`
- `#bdbdbd`
- `#d9d9d9`
- `#9a9a9a`
- `#222222`

### CSS Variable Tokens

```css
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
```

## Typography

### Font Stack

- **Awesome Serif Italic** — Heading 1, Heading 2, Heading 3
- **Aeonik** — Body, Caption

### Font Sources

```css
@font-face {
  font-family: "Aeonik";
  src: url("fonts/Aeonik-Regular.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "Aeonik";
  src: url("fonts/Aeonik-700.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Awesome Serif Italic";
  src: url("fonts/AwesomeSerifItalic-300.woff2") format("woff2");
  font-weight: 300;
}
@font-face {
  font-family: "Geist Pixel";
  src: url("fonts/GeistPixel-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Digital Planers";
  src: url("fonts/DigitalPlaners-Regular.woff2") format("woff2");
  font-weight: 400;
}
```

### Type Scale

| Role | Family | Size | Weight |
|------|--------|------|--------|
| Heading 1 | Awesome Serif Italic | min(290px,(100vw - 2*var(--gutter))*0.2164) | 700 |
| Heading 2 | Awesome Serif Italic | 150px | 700 |
| Heading 3 | Awesome Serif Italic | 128px | 700 |
| Body | Aeonik | 20px | 400 |
| Caption | Aeonik | 12px | 400 |

### Typography Rules

- Body/UI: **Awesome Serif Italic**, Headings: **Aeonik** — these are the only display fonts
- Max 3-4 font sizes per screen
- Headings: weight 600-700, body: weight 400
- Use color and opacity for text hierarchy, not additional font sizes
- Line height: 1.5 for body, 1.2 for headings

## Spacing & Layout

### Base Grid: 4px

Every dimension (margin, padding, gap, width, height) must be a multiple of **4px**.

### Spacing Scale

`4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26` px

### Spacing as Meaning

| Spacing | Use |
|---------|-----|
| 4-8px | Tight: related items (icon + label, avatar + name) |
| 12-16px | Medium: between groups within a section |
| 24-32px | Wide: between distinct sections |
| 48px+ | Vast: major page section breaks |

### Border Radius

Scale: `1px, 2px, 10px, 12px, 14px, 16px, 18px, 20px, 24px, 999px`
Default: `16px`

### Container

Max-width: `1100px`, centered with auto margins.

### Breakpoints

| Name | Value |
|------|-------|
| md | 767px |
| lg | 900px |
| xl | 1100px |

Mobile-first: design for small screens, layer on responsive overrides.

## Component Patterns

### Card

```css
.card {
  background: #111111;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 14px 34px rgba(0,0,0,0.18);
}
```

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

### Button

```css
/* Primary */
.btn-primary {
  background: #178a4c;
  color: #ffffff;
  border-radius: 16px;
  padding: 8px 16px;
  font-weight: 500;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.9; }

/* Ghost */
.btn-ghost {
  background: transparent;
  border: 1px solid #333333;
  color: #ffffff;
  border-radius: 16px;
  padding: 8px 16px;
}
```

```html
<button class="btn-primary">Get Started</button>
<button class="btn-ghost">Learn More</button>
```

### Input

```css
.input {
  background: #000000;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 8px 12px;
  color: #ffffff;
  font-size: 14px;
}
.input:focus { border-color: #178a4c; outline: none; }
```

```html
<input class="input" type="text" placeholder="Search..." />
```

### Badge / Chip

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  background: #111111;
  color: #555555;
}
```

```html
<span class="badge">New</span>
<span class="badge">Beta</span>
```

### Modal / Dialog

```css
.modal-backdrop { background: rgba(0, 0, 0, 0.6); }
.modal {
  background: #111111;
  border: 1px solid #333333;
  border-radius: 999px;
  padding: 24px;
  max-width: 480px;
  width: 90vw;
  box-shadow: 0 14px 34px rgba(0,0,0,0.18);
}
```

```html
<div class="modal-backdrop">
  <div class="modal">
    <h2>Dialog Title</h2>
    <p>Dialog content.</p>
    <button class="btn-primary">Confirm</button>
    <button class="btn-ghost">Cancel</button>
  </div>
</div>
```

### Table

```css
.table { width: 100%; border-collapse: collapse; }
.table th {
  text-align: left;
  padding: 8px 12px;
  font-weight: 500;
  font-size: 12px;
  color: #555555;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #333333;
}
.table td {
  padding: 12px;
  border-bottom: 1px solid #333333;
}
```

```html
<table class="table">
  <thead><tr><th>Name</th><th>Status</th><th>Date</th></tr></thead>
  <tbody>
    <tr><td>Item One</td><td>Active</td><td>Jan 1</td></tr>
    <tr><td>Item Two</td><td>Pending</td><td>Jan 2</td></tr>
  </tbody>
</table>
```

### Navigation

```css
.nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #333333;
}
.nav-link {
  color: #555555;
  padding: 8px 12px;
  border-radius: 16px;
  transition: color 150ms;
}
.nav-link:hover { color: #ffffff; }
.nav-link.active { color: #178a4c; }
```

```html
<nav class="nav">
  <a href="/" class="nav-link active">Home</a>
  <a href="/about" class="nav-link">About</a>
  <a href="/pricing" class="nav-link">Pricing</a>
  <button class="btn-primary" style="margin-left: auto">Get Started</button>
</nav>
```

### Extracted Components

These components were found in the codebase:

**Button** (`html`)
- Variants: `-solid`

## Page Structure

The following page sections were detected:

- **Navigation** — Top navigation bar (3 items)
- **Hero** — Hero/banner section with headline and CTAs
- **Footer** — Page footer with links and info (1 items)
- **Testimonials** — Testimonials/reviews section
- **Cards** — Grid of 6 card elements (6 items)
- **Stats** — Statistics/metrics display
- **Features** — Feature/benefit cards grid

When building pages, follow this section order and structure.

## Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without calling attention.

### CSS Animations

- `sound-wave-travel`
- `grain`

### Motion Tokens

- **Duration scale:** `300ms`, `400ms`, `450ms`, `500ms`, `600ms`, `650ms`, `700ms`
- **Easing functions:** `ease`
- **Animated properties:** `padding-bottom`

### Motion Guidelines

- **Duration:** Use values from the duration scale above. Short (300ms) for micro-interactions, long (700ms) for page transitions
- **Easing:** Use `ease` as the default easing curve
- **Direction:** Elements enter from bottom/right, exit to top/left
- **Reduced motion:** Always respect `prefers-reduced-motion` — disable animations when set

## Depth & Elevation

### Shadow Tokens

- Overlay (modals, dialogs): `0 14px 34px rgba(0,0,0,0.18)`
- Overlay (modals, dialogs): `0 40px 120px rgba(0,0,0,0.25)`
- Overlay (modals, dialogs): `rgba(0, 0, 0, 0.25) 0px 40px 120px 0px`

### Z-Index Scale

`0, 1, 2, 8, 50, 60, 90, 92, 95, 96, 99, 100, 1000, 1001, 1002, 1003, 2000, 2147483000`

Use these exact values — never invent z-index values.

## Anti-Patterns (Never Do)

- **No blur effects** — no backdrop-blur, no filter: blur()
- **No zebra striping** — tables and lists use borders for separation
- **No invented colors** — every hex value must come from the palette above
- **No arbitrary spacing** — every dimension is a multiple of 4px
- **No extra fonts** — only Awesome Serif Italic and Aeonik are allowed
- **No arbitrary border-radius** — use the scale: 1px, 2px, 10px, 12px, 14px, 16px, 18px, 20px, 24px, 999px
- **No opacity for disabled states** — use muted colors instead

## Workflow

1. **Read** `references/DESIGN.md` before writing any UI code
2. **Pick colors** from the Color System section — never invent new ones
3. **Set typography** — Awesome Serif Italic, Aeonik only, using the type scale
4. **Build layout** on the 4px grid — check every margin, padding, gap
5. **Match components** to patterns above before creating new ones
6. **Apply elevation** — use shadow tokens
7. **Validate** — every value traces back to a design token. No magic numbers.

## Brand Spec

- **Favicon:** `assets/32x32.png`
- **Site URL:** `https://jithinrp.com/`
- **Brand color:** `#178a4c`
- **Brand typeface:** Awesome Serif Italic

## Quick Reference

```
Background:     #000000
Surface:        #111111
Text:           #ffffff / #555555
Accent:         #178a4c
Border:         #333333
Font:           Awesome Serif Italic
Spacing:        4px grid
Radius:         16px
Components:     8 detected
```

## When to Trigger

Activate this skill when:
- Creating new components, pages, or visual elements for jithinrp
- Writing CSS, Tailwind classes, styled-components, or inline styles
- Building page layouts, templates, or responsive designs
- Reviewing UI code for design consistency
- The user mentions "jithinrp" design, style, UI, or theme
- Generating mockups, wireframes, or visual prototypes

---

# Full Reference Files

> Every output file is embedded below. Claude has full design system context from /skills alone.

## Design System Tokens (DESIGN.md)

# jithinrp DESIGN.md

> Auto-generated design system — reverse-engineered via static analysis by skillui.
> Frameworks: None detected
> Colors: 17 · Fonts: 2 · Components: 8
> Icon library: not detected · State: not detected
> Primary theme: dark · Dark mode toggle: no · Motion: subtle

---

## 1. Visual Theme & Atmosphere

This is a **dark-themed** interface with a cool tone. Depth is expressed through layered shadows and subtle surface color variation. Typography pairs **Aeonik** for display/headings with **Awesome Serif Italic** for body text, creating clear visual hierarchy through type contrast. Spacing follows a **4px base grid** (compact density), with scale: 4, 6, 8, 10, 12, 14, 16, 18px. The accent color **#178a4c** anchors interactive elements (buttons, links, focus rings). Motion is subtle — smooth transitions (150-300ms) ease state changes without drawing attention.

---

## 2. Color Palette & Roles

| Token | Hex | Role | Use |
|---|---|---|---|
| muted | `#000000` | background | Page background, darkest surface |
| surface | `#111111` | surface | Card and panel backgrounds |
| text-primary | `#ffffff` | text-primary | Headings and body text |
| text-muted | `#555555` | text-muted | Captions, placeholders, secondary info |
| border | `#333333` | border | Dividers, card borders, outlines |
| accent | `#178a4c` | accent | CTAs, links, focus rings, active states |
| danger | `#e5502f` | danger | Error states, destructive actions |
| success | `#1f7a4d` | success | Success states, positive indicators |
| warning | `#f2e8d0` | warning | Warning states, caution indicators |
| unknown | `#eeeeee` | unknown | Palette color |
| unknown | `#e2e2e2` | unknown | Palette color |
| unknown | `#8a8a8a` | unknown | Palette color |
| unknown | `#494949` | unknown | Palette color |
| unknown | `#bdbdbd` | unknown | Palette color |
| unknown | `#d9d9d9` | unknown | Palette color |
| unknown | `#9a9a9a` | unknown | Palette color |
| unknown | `#222222` | unknown | Palette color |

### CSS Variable Tokens

```css
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
--muted: rgba(0,0,0,0.6);
--muted-2: rgba(0,0,0,0.5);
```


---

## 3. Typography Rules

**Font Stack:**
- **Awesome Serif Italic** — Heading 1, Heading 2, Heading 3
- **Aeonik** — Body, Caption

**Font Sources:**

```css
@font-face {
  font-family: "Aeonik";
  src: url("fonts/Aeonik-Regular.woff2") format("woff2");
  font-weight: 400;
}
@font-face {
  font-family: "Aeonik";
  src: url("fonts/Aeonik-700.woff2") format("woff2");
  font-weight: 700;
}
@font-face {
  font-family: "Awesome Serif Italic";
  src: url("fonts/AwesomeSerifItalic-300.woff2") format("woff2");
  font-weight: 300;
}
@font-face {
  font-family: "Geist Pixel";
  src: url("fonts/GeistPixel-Regular.ttf") format("truetype");
  font-weight: 400;
}
@font-face {
  font-family: "Digital Planers";
  src: url("fonts/DigitalPlaners-Regular.woff2") format("woff2");
  font-weight: 400;
}
```

| Role | Font | Size | Weight |
|---|---|---|---|
| Heading 1 | Awesome Serif Italic | min(290px,(100vw - 2*var(--gutter))*0.2164) | 700 |
| Heading 2 | Awesome Serif Italic | 150px | 700 |
| Heading 3 | Awesome Serif Italic | 128px | 700 |
| Body | Aeonik | 20px | 400 |
| Caption | Aeonik | 12px | 400 |

**Typographic Rules:**
- Limit to 2 font families max per screen
- Use **Awesome Serif Italic** for body/UI text, **Aeonik** for display/headings
- Maintain consistent hierarchy: no more than 3-4 font sizes per screen
- Headings use bold (600-700), body uses regular (400)
- Line height: 1.5 for body text, 1.2 for headings
- Use color and opacity for secondary hierarchy, not additional font sizes


---

## 4. Component Stylings

### Layout (1)

**Footer** — `html`

### Navigation (1)

**Navigation** — `html`

### Data Display (2)

**Card** — `html`

**Badge** — `html`

### Data Input (1)

**Button** — `html`
- Variants: `-solid`
- Animation: 

### Media (3)

**Image** — `html`

**Icon** — `html`

**Map/Canvas** — `html`



---

## 5. Layout Principles

- **Base spacing unit:** 4px
- **Spacing scale:** 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26
- **Border radius:** 1px, 2px, 10px, 12px, 14px, 16px, 18px, 20px, 24px, 999px
- **Max content width:** 1100px

**Spacing as Meaning:**
| Spacing | Use |
|---|---|
| 4-8px | Tight: related items within a group |
| 12-16px | Medium: between groups |
| 24-32px | Wide: between sections |
| 48px+ | Vast: major section breaks |


---

## 6. Depth & Elevation

### Overlay — full-screen overlays, top-level dialogs

- `0 14px 34px rgba(0,0,0,0.18)`
- `0 40px 120px rgba(0,0,0,0.25)`
- `rgba(0, 0, 0, 0.25) 0px 40px 120px 0px`

### Z-Index Scale

`0, 1, 2, 8, 50, 60, 90, 92, 95, 96, 99, 100, 1000, 1001, 1002, 1003, 2000, 2147483000`



---

## 7. Animation & Motion

This project uses **subtle motion**. Transitions smooth state changes without demanding attention.

### CSS Animations

- `@keyframes sound-wave-travel`
- `@keyframes grain`

### Animated Components

- **Button**: 

### Motion Guidelines

- Duration: 150-300ms for micro-interactions, 300-500ms for page transitions
- Easing: `ease-out` for enters, `ease-in` for exits
- Always respect `prefers-reduced-motion`


---

## 8. Do's and Don'ts

### Do's

- Use `#178a4c` for interactive elements (buttons, links, focus rings)
- Use `#000000` as the primary page background
- Pair **Awesome Serif Italic** (body) with **Aeonik** (display) — these are the only allowed fonts
- Follow the **4px** spacing grid for all margins, padding, and gaps
- Use the defined shadow tokens for elevation — see Section 6
- Use border-radius from the scale: 1px, 2px, 10px, 12px, 14px
- Reuse existing components from Section 4 before creating new ones

### Don'ts

- Don't introduce colors outside this palette — extend the design tokens first
- Don't introduce additional font families beyond Awesome Serif Italic and Aeonik
- Don't use arbitrary spacing values — stick to multiples of 4px
- Don't create custom box-shadow values outside the system tokens
- Don't use arbitrary border-radius values — pick from the defined scale
- Don't duplicate component patterns — check Section 4 first
- Don't use backdrop-blur or blur effects

### Anti-Patterns (detected from codebase)

- No blur or backdrop-blur effects
- No zebra striping on tables/lists


---

## 9. Responsive Behavior

| Name | Value | Source |
|---|---|---|
| md | 767px | css |
| lg | 900px | css |
| xl | 1100px | css |

**Approach:** Use `@media (min-width: ...)` queries matching the breakpoints above.


---

## 10. Agent Prompt Guide

Use these as starting points when building new UI:

### Build a Card

```
Background: #111111
Border: 1px solid #333333
Radius: 16px
Padding: 16px
Font: Awesome Serif Italic
Use shadow tokens from Section 6.
```

### Build a Button

```
Primary: bg #178a4c, text white
Ghost: bg transparent, border #333333
Padding: 8px 16px
Radius: 16px
Hover: opacity 0.9 or lighter shade
Focus: ring with #178a4c
```

### Build a Page Layout

```
Background: #000000
Max-width: 1100px, centered
Grid: 4px base
Responsive: mobile-first, breakpoints from Section 9
```

### Build a Stats Card

```
Surface: #111111
Label: #555555 (muted, 12px, uppercase)
Value: #ffffff (primary, 24-32px, bold)
Status: use success/warning/danger from Section 2
```

### Build a Form

```
Input bg: #000000
Input border: 1px solid #333333
Focus: border-color #178a4c
Label: #555555 12px
Spacing: 16px between fields
Radius: 16px
```

### General Component

```
1. Read DESIGN.md Sections 2-6 for tokens
2. Colors: only from palette
3. Font: Awesome Serif Italic, type scale from Section 3
4. Spacing: 4px grid
5. Components: match patterns from Section 4
6. Elevation: shadow tokens
```

## Visual Guide — Screenshots (VISUAL_GUIDE.md)

# jithinrp — Visual Guide

> Master visual reference. Study every screenshot carefully before implementing any UI.
> Match colors, layout, typography, spacing, and motion states exactly.

**Motion Stack:** **GSAP**, **ScrollTrigger**, **Three.js**, **Web Animations API (2 active)**

**WebGL/3D:** Detected (3 canvas elements) — replicate with Three.js or CSS 3D transforms

## Scroll Journey

The page has cinematic scroll animations. Each screenshot below shows the exact visual state at that scroll depth.
**Replicate these transitions precisely** — the design changes dramatically as you scroll.

### Hero — Above the fold

*Scroll position: 0px of 7909px total*

![Hero — Above the fold](../screens/scroll/scroll-000.png)

### 17% scroll depth

*Scroll position: 1192px of 7909px total*

![17% scroll depth](../screens/scroll/scroll-017.png)

### 33% scroll depth

*Scroll position: 2313px of 7909px total*

![33% scroll depth](../screens/scroll/scroll-033.png)

### 50% scroll depth

*Scroll position: 3505px of 7909px total*

![50% scroll depth](../screens/scroll/scroll-050.png)

### 67% scroll depth

*Scroll position: 4696px of 7909px total*

![67% scroll depth](../screens/scroll/scroll-067.png)

### 83% scroll depth

*Scroll position: 5817px of 7909px total*

![83% scroll depth](../screens/scroll/scroll-083.png)

### Footer — End of page

*Scroll position: 7009px of 7909px total*

![Footer — End of page](../screens/scroll/scroll-100.png)

## Full Page Screenshots

### Jithin RP — Senior Product Designer

*URL: `https://jithinrp.com/`*

![Jithin RP — Senior Product Designer](../screens/pages/home.png)

### Memory — Jithin RP

*URL: `https://jithinrp.com/memory/`*

![Memory — Jithin RP](../screens/pages/memory.png)

### Slot Booking — Turning Slot Selection into a Confident Decision | Jithin RP

*URL: `https://jithinrp.com/slot-booking`*

![Slot Booking — Turning Slot Selection into a Confident Decision | Jithin RP](../screens/pages/slot-booking.png)

### Squads — Community Experience | Jithin RP

*URL: `https://jithinrp.com/squads`*

![Squads — Community Experience | Jithin RP](../screens/pages/squads.png)

## Section Screenshots

Clipped sections showing individual components in context.

### Section 1 — `section`

*1440×731px*

![Section 1](../screens/sections/home-section-1.png)

### Section 1 — `section`

*1066×704px*

![Section 1](../screens/sections/memory-section-1.png)

### Section 1 — `section`

*1440×400px*

![Section 1](../screens/sections/slot-booking-section-1.png)

### Section 2 — `section`

*1440×804px*

![Section 2](../screens/sections/slot-booking-section-2.png)

### Section 1 — `section`

*1440×400px*

![Section 1](../screens/sections/squads-section-1.png)

### Section 2 — `section`

*1440×804px*

![Section 2](../screens/sections/squads-section-2.png)

## Animations & Motion (ANIMATIONS.md)

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

## Layout & Grid (LAYOUT.md)

# Layout Reference

> Auto-extracted from live DOM. Use this to understand how the site is structured spatially.

## Spacing System

**Base grid:** 4px

**Scale:** `4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32` px

| Spacing | Semantic Use |
|---------|-------------|
| 4px | Tight — within a component |
| 8px | Medium — between sibling items |
| 16px | Wide — between sections |
| 32px | Vast — major section breaks |

## Flex Layouts

| Element | Direction | Justify | Align | Gap | Children |
|---------|-----------|---------|-------|-----|----------|
| `div.pillars__grid.container` | row | — | — | 52px | 3 |
| `div.genai__head.container` | row | space-between | start | 40px | 2 |
| `div.genai__controls.container` | row | end | — | — | 1 |
| `div.about__grid.container` | row | space-between | — | 40px | 2 |
| `ul.awards__row.container` | row | space-between | — | 32px | 3 |
| `div.container.contact__inner` | column | — | center | — | 3 |
| `article.pillar` | row | — | start | 16px | 2 |
| `article.pillar` | row | — | start | 16px | 2 |
| `article.pillar` | row | — | start | 16px | 2 |
| `div.arrows` | row | — | — | — | 2 |
| `a.ai-card` | column | — | — | — | 3 |
| `a.ai-card` | column | — | — | — | 3 |
| `a.ai-card` | column | — | — | — | 3 |
| `a.ai-card` | column | — | — | — | 3 |
| `a.ai-card` | column | — | — | — | 3 |

## Grid Layouts

| Element | Template Columns | Gap | Children |
|---------|-----------------|-----|----------|
| `header.nav` | `452.266px 435.469px 452.266px` | — | 3 |
| `div.work__grid.container` | `323px 436px 323px` | normal 129px | 3 |
| `div.work__grid.container` | `323px 436px 323px` | normal 129px | 3 |
| `div.work__grid.container` | `323px 436px 323px` | normal 129px | 3 |
| `div.work__grid.container` | `323px 436px 323px` | normal 129px | 3 |

## Structural Containers

### `<main>` (`main#top`)

```
display:          block
children:         9
```

### `<footer>` (`footer.footer`)

```
display:          block
padding:          50px 0px
children:         2
```

### `<header>` (`header.nav`)

```
display:          grid
grid-template-columns: 452.266px 435.469px 452.266px
children:         3
```

### `<section>` (`section.hero.container`)

```
display:          block
padding:          100px 0px 90px
children:         3
```

### `<section>` (`section.pillars.band`)

```
display:          block
padding:          50px 0px
children:         1
```

### `<section>` (`section#works.works`)

```
display:          block
children:         5
```

### `<section>` (`section.genai.band`)

```
display:          block
padding:          100px 0px
children:         3
```

### `<section>` (`section#about.about`)

```
display:          block
padding:          100px 0px 0px
children:         1
```

### `<section>` (`section.awards.band`)

```
display:          block
padding:          50px 0px
children:         1
```

### `<section>` (`section.quotes`)

```
display:          block
children:         2
```

### `<section>` (`section#contact.contact.band`)

```
display:          block
padding:          100px 0px
children:         1
```

### `<article>` (`article.work.band`)

```
display:          block
padding:          100px 0px
children:         1
```

## Layout Rules

- Primary layout system: **Flexbox**
- Secondary layout system: **CSS Grid** (used for card grids and multi-column layouts)
- Every spacing value must be a multiple of **4px**
- Never use arbitrary margin/padding values outside the spacing scale

## Component Patterns (COMPONENTS.md)

# Component Reference

> Repeated DOM patterns detected by structural analysis. Each component appeared 3+ times.

## Detected Components

| Component | Category | Instances | Key Classes |
|-----------|----------|-----------|-------------|
| **Quote** | unknown | 15× | `.quote` |
| **Muted** | unknown | 14× | `.muted` |
| **Fact** | unknown | 13× | `.fact` |
| **Ai Card** | card | 6× | `.ai-card` |
| **Ai Card  Title** | card | 6× | `.ai-card__title` |
| **Band** | unknown | 4× | `.band`, `.work` |
| **Container** | unknown | 4× | `.container`, `.work__grid` |
| **Work  Col** | unknown | 4× | `.work__col` |
| **Work  Title** | unknown | 4× | `.work__title` |
| **Work  Mid** | unknown | 4× | `.work__mid` |
| **Signature  Ink** | unknown | 3× | `.signature__ink` |
| **Pillar  Title** | unknown | 3× | `.pillar__title` |
| **Pillar  Body** | unknown | 3× | `.pillar__body` |
| **Work  Intro** | unknown | 3× | `.work__intro` |
| **Work  Col** | unknown | 3× | `.work__col` |
| **Display** | unknown | 3× | `.display` |
| **Ai Card  Media** | card | 3× | `.ai-card__media` |
| **Award** | list-item | 3× | `.award` |
| **Award  Name** | unknown | 3× | `.award__name` |

## Cards

### Ai Card

**Instances found:** 6

**CSS classes:** `.ai-card`

**HTML structure:**

```html
<a class="ai-card" href="#parcel-sorter" data-modal-open="parcel-sorter" data-cursor-pill="View project"> <div class="ai-card__media" data-liquid="video" data-colors="#1f7a4d,#c48412,#2c5fc9,#b2303b" style="background: radial-gradient(90% 70% at 100% 0%, rgb(196, 132, 18), transparent 70%), radial-gradient(80% 60% at 0% 100%, rgb(44, 95, 201), transparent 70%), radial-gradient(80% 60% at 100% 100%, rgb(178, 48, 59), transparent 70%), rgb(31, 122, 77);"> <video src="assets/ai/parcel-sorter/preview.mp4" poster="assets/ai/parcel-sorter/poster.webp" muted="" loop="" playsinline="" preload="none" a
```

**Base styles (from design tokens):**

```css
.ai-card {
  background: #111111;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 8px;
}```

### Ai Card  Title

**Instances found:** 6

**CSS classes:** `.ai-card__title`

**HTML structure:**

```html
<h3 class="ai-card__title">Australia Post Parcel Sorter</h3>
```

**Base styles (from design tokens):**

```css
.ai-card__title {
  background: #111111;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 8px;
}```

### Ai Card  Media

**Instances found:** 3

**CSS classes:** `.ai-card__media`

**HTML structure:**

```html
<div class="ai-card__media" data-liquid="video" data-colors="#1f7a4d,#c48412,#2c5fc9,#b2303b" style="background: radial-gradient(90% 70% at 100% 0%, rgb(196, 132, 18), transparent 70%), radial-gradient(80% 60% at 0% 100%, rgb(44, 95, 201), transparent 70%), radial-gradient(80% 60% at 100% 100%, rgb(178, 48, 59), transparent 70%), rgb(31, 122, 77);"> <video src="assets/ai/parcel-sorter/preview.mp4" poster="assets/ai/parcel-sorter/poster.webp" muted="" loop="" playsinline="" preload="none" aria-hidden="true"></video> </div>
```

**Base styles (from design tokens):**

```css
.ai-card__media {
  background: #111111;
  border: 1px solid #333333;
  border-radius: 16px;
  padding: 8px;
}```

## List Items

### Award

**Instances found:** 3

**CSS classes:** `.award`

**HTML structure:**

```html
<li class="award" data-reveal=""> <img src="assets/landing/award-googleplay.webp" width="60" height="60" alt=""> <div><p class="award__name">Google Play</p><p class="muted">Inspiring App, 2023</p></div> </li>
```

**Base styles (from design tokens):**

```css
.award {
  padding: 4px 0;
  border-bottom: 1px solid #333333;
}```

## Other Components

### Quote

**Instances found:** 15

**CSS classes:** `.quote`

**HTML structure:**

```html
<figure class="quote"> <blockquote>Jithin’s impact at Playo went beyond des…</blockquote> <figcaption> <span><strong>Gauravjeet Singh</strong><small>CEO @ Playo</small></span> <img src="assets/landing/avatar-gauravjeet.webp" width="52" height="52" alt="" loading="lazy"> </figcaption> </figure>
```

**Base styles (from design tokens):**

```css
.quote {
  background: #111111;
  padding: 4px;
}```

### Muted

**Instances found:** 14

**CSS classes:** `.muted`

**HTML structure:**

```html
<p class="muted">Users could find a venue and reach the slot selection screen, but making the final decision wasn't always straightforward. They had to figure out when their session would end, how long they were booking, what they would pay, and whether they were getting the best available option</p>
```

**Base styles (from design tokens):**

```css
.muted {
  background: #111111;
  padding: 4px;
}```

### Fact

**Instances found:** 13

**CSS classes:** `.fact`

**HTML structure:**

```html
<dl class="fact" data-reveal=""><dt>Project Timeline</dt><dd>3 Months</dd></dl>
```

**Base styles (from design tokens):**

```css
.fact {
  background: #111111;
  padding: 4px;
}```

### Band

**Instances found:** 4

**CSS classes:** `.band` `.work`

**HTML structure:**

```html
<article class="work band" data-href="slot-booking.html" data-cursor-pill="View case study"> <div class="work__grid container"> <div class="work__col"> <div class="work__intro" data-reveal=""> <h3 class="work__title"><a href="/slot-booking">Slot Booking Experience</a></h3> <p class="muted">Users could find a venue and reach the s…</p> </div> <dl class="fact" data-reveal=""><dt>Project Timeline</dt><dd>3 Months</dd></dl> </div> <div class="work__mid"> <div class="work__media work__media--tall" data-story-media="" data-liquid="video" data-colors="#178a4c,#a9b3e6,#7fe3a9,#a4d77a" style="backgroun
```

**Base styles (from design tokens):**

```css
.band {
  background: #111111;
  padding: 4px;
}```

### Container

**Instances found:** 4

**CSS classes:** `.container` `.work__grid`

**HTML structure:**

```html
<div class="work__grid container"> <div class="work__col"> <div class="work__intro" data-reveal=""> <h3 class="work__title"><a href="/slot-booking">Slot Booking Experience</a></h3> <p class="muted">Users could find a venue and reach the s…</p> </div> <dl class="fact" data-reveal=""><dt>Project Timeline</dt><dd>3 Months</dd></dl> </div> <div class="work__mid"> <div class="work__media work__media--tall" data-story-media="" data-liquid="video" data-colors="#178a4c,#a9b3e6,#7fe3a9,#a4d77a" style="background: radial-gradient(90% 70% at 100% 0%, rgb(169, 179, 230), transparent 70%), radial-gradient(
```

**Base styles (from design tokens):**

```css
.container {
  background: #111111;
  padding: 4px;
}```

### Work  Col

**Instances found:** 4

**CSS classes:** `.work__col`

**HTML structure:**

```html
<div class="work__col"> <div class="work__intro" data-reveal=""> <h3 class="work__title"><a href="/slot-booking">Slot Booking Experience</a></h3> <p class="muted">Users could find a venue and reach the s…</p> </div> <dl class="fact" data-reveal=""><dt>Project Timeline</dt><dd>3 Months</dd></dl> </div>
```

**Base styles (from design tokens):**

```css
.work__col {
  background: #111111;
  padding: 4px;
}```

### Work  Title

**Instances found:** 4

**CSS classes:** `.work__title`

**HTML structure:**

```html
<h3 class="work__title"><a href="/slot-booking">Slot Booking Experience</a></h3>
```

**Base styles (from design tokens):**

```css
.work__title {
  background: #111111;
  padding: 4px;
}```

### Work  Mid

**Instances found:** 4

**CSS classes:** `.work__mid`

**HTML structure:**

```html
<div class="work__mid"> <div class="work__media work__media--tall" data-story-media="" data-liquid="video" data-colors="#178a4c,#a9b3e6,#7fe3a9,#a4d77a" style="background: radial-gradient(90% 70% at 100% 0%, rgb(169, 179, 230), transparent 70%), radial-gradient(80% 60% at 0% 100%, rgb(127, 227, 169), transparent 70%), radial-gradient(80% 60% at 100% 100%, rgb(164, 215, 122), transparent 70%), rgb(23, 138, 76);"> <video src="assets/slot-booking-trailer-story-web.mp4" poster="assets/slot-booking-trailer-story-poster.webp" muted="" loop="" playsinline="" preload="none" aria-hidden="true"></video>
```

**Base styles (from design tokens):**

```css
.work__mid {
  background: #111111;
  padding: 4px;
}```

### Signature  Ink

**Instances found:** 3

**CSS classes:** `.signature__ink`

**HTML structure:**

```html
<g class="signature__ink"><path d="M494 -668C468 -705 426 -725 382 -731C323 -740 264 -722 209 -699C159 -679 111 -651 74 -612C38 -574 13 -525 11 -473C8 -414 39 -363 71 -316C85 -295 120 -315 106 -337C80 -374 52 -415 51 -462C50 -505 70 -546 98 -578C127 -611 164 -635 204 -653C246 -673 293 -690 340 -693C380 -695 425 -686 453 -655C484 -621 489 -571 493 -528C495 -499 495 -470 494 -442C490 -442 487 -441 483 -440C320 -366 187 -229 120 -63C85 25 68 124 81 218C91 295 136 419 238 383C284 366 317 325 341 285C369 239 390 190 409 140C450 33 479 -80 501 -193C522 -304 542 -419 533 -532C529 -579 522 -629 494 -6
```

**Base styles (from design tokens):**

```css
.signature__ink {
  background: #111111;
  padding: 4px;
}```

### Pillar  Title

**Instances found:** 3

**CSS classes:** `.pillar__title`

**HTML structure:**

```html
<h2 class="pillar__title">Product design</h2>
```

**Base styles (from design tokens):**

```css
.pillar__title {
  background: #111111;
  padding: 4px;
}```

### Pillar  Body

**Instances found:** 3

**CSS classes:** `.pillar__body`

**HTML structure:**

```html
<p class="pillar__body" style="translate: 7.9px -16px; scale: 0.9815 0.9328;">I take a problem from funnel data to shipped screens and stay on it until the number moves.</p>
```

**Base styles (from design tokens):**

```css
.pillar__body {
  background: #111111;
  padding: 4px;
}```

### Work  Intro

**Instances found:** 3

**CSS classes:** `.work__intro`

**HTML structure:**

```html
<div class="work__intro" data-reveal=""> <h3 class="work__title"><a href="/slot-booking">Slot Booking Experience</a></h3> <p class="muted">Users could find a venue and reach the s…</p> </div>
```

**Base styles (from design tokens):**

```css
.work__intro {
  background: #111111;
  padding: 4px;
}```

### Work  Col

**Instances found:** 3

**CSS classes:** `.work__col`

**HTML structure:**

```html
<div class="work__col"> <dl class="fact" data-reveal=""><dt>Role</dt><dd>Sole Product Designer</dd></dl> <dl class="fact" data-reveal=""> <dt>Tools</dt> <dd class="tools"> <span class="tool" role="img" aria-label="Figma: Designing UI screens and prototypes" data-cursor-pill="Figma" data-cursor-note="Designing UI screens and prototypes"><svg aria-hidden="true"><use href="assets/landing/tools.svg#figma"></use></svg></span> <span class="tool" role="img" aria-label="Claude: Fast progress on building and prototyping" data-cursor-pill="Claude" data-cursor-note="Fast progress on building and prototyp
```

**Base styles (from design tokens):**

```css
.work__col {
  background: #111111;
  padding: 4px;
}```

### Display

**Instances found:** 3

**CSS classes:** `.display`

**HTML structure:**

```html
<h2 id="genai-title" class="display" data-reveal="">Gen AI Projects</h2>
```

**Base styles (from design tokens):**

```css
.display {
  background: #111111;
  padding: 4px;
}```

### Award  Name

**Instances found:** 3

**CSS classes:** `.award__name`

**HTML structure:**

```html
<p class="award__name">Google Play</p>
```

**Base styles (from design tokens):**

```css
.award__name {
  background: #111111;
  padding: 4px;
}```

## Component Rules

- Match class names exactly from the patterns above
- Each component instance must be visually identical to others of its type
- Do not add extra wrappers or change the DOM structure
- Use `#333333` for all dividers within components
- Use `#178a4c` for all interactive/active states

## Interactions & States (INTERACTIONS.md)

# Interaction Reference

> Micro-interactions extracted from live DOM. Recreate these exactly for authentic feel.

## Coverage

| Component Type | Count | States Captured |
|----------------|-------|----------------|
| Button | 2 | default, hover, focus |
| Link | 3 | default, hover, focus |

## Transition System

These transition declarations were extracted from interactive elements:

```css
transition: background-color 0.3s cubic-bezier(0.22, 1, 0.36, 1);
transition: color 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s;
transition: all;
transition: color 0.3s cubic-bezier(0.22, 1, 0.36, 1);
```

Apply these to all interactive elements. Never invent new durations or easings.

## Button Interactions

### Button 1 — `Click for sound`

**States:**

- Default: `../screens/states/button-1-default.png`
- Hover: `../screens/states/button-1-hover.png`
- Focus: `../screens/states/button-1-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 0) none 0px → */ outline: rgb(0, 0, 0) solid 2px;
```

**Transition:** `background-color 0.3s cubic-bezier(0.22, 1, 0.36, 1)`

### Button 2 — `Next project`

**States:**

- Default: `../screens/states/button-2-default.png`
- Hover: `../screens/states/button-2-hover.png`
- Focus: `../screens/states/button-2-focus.png`

**On focus:**

```css
/* outline: rgb(0, 0, 0) none 0px → */ outline: rgb(0, 0, 0) solid 2px;
```

**Transition:** `color 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s`

## Link Interactions

### Link 1 — `Slow connection? Open the light version`

**States:**

- Default: `../screens/states/link-1-default.png`
- Hover: `../screens/states/link-1-hover.png`
- Focus: `../screens/states/link-1-focus.png`

**On hover:**

```css
/* color: rgb(138, 138, 138) → */ color: rgb(34, 34, 34);
/* border-color: rgb(138, 138, 138) → */ border-color: rgb(34, 34, 34);
/* outline: rgb(138, 138, 138) none 0px → */ outline: rgb(34, 34, 34) none 0px;
/* outline-color: rgb(138, 138, 138) → */ outline-color: rgb(34, 34, 34);
```

**On focus:**

```css
/* outline: rgb(138, 138, 138) none 0px → */ outline: rgb(0, 0, 0) solid 2px;
/* outline-color: rgb(138, 138, 138) → */ outline-color: rgb(0, 0, 0);
```

**Transition:** `all`

### Link 2 — `Play Game`

**States:**

- Default: `../screens/states/link-2-default.png`
- Hover: `../screens/states/link-2-hover.png`
- Focus: `../screens/states/link-2-focus.png`

**On focus:**

```css
/* outline: rgba(0, 0, 0, 0.6) none 0px → */ outline: rgb(0, 0, 0) solid 2px;
/* outline-color: rgba(0, 0, 0, 0.6) → */ outline-color: rgb(0, 0, 0);
```

**Transition:** `color 0.3s cubic-bezier(0.22, 1, 0.36, 1)`

### Link 3 — `Resume`

**States:**

- Default: `../screens/states/link-3-default.png`
- Hover: `../screens/states/link-3-hover.png`
- Focus: `../screens/states/link-3-focus.png`

**On focus:**

```css
/* outline: rgba(0, 0, 0, 0.6) none 0px → */ outline: rgb(0, 0, 0) solid 2px;
/* outline-color: rgba(0, 0, 0, 0.6) → */ outline-color: rgb(0, 0, 0);
```

**Transition:** `color 0.3s cubic-bezier(0.22, 1, 0.36, 1)`

## Interaction Rules

- Accent color `#178a4c` is used for focus rings, active states, and hover highlights
- Hover effects include **color transitions** — use the extracted values, not approximations
- Focus states use **outline** (not box-shadow) — always match the extracted focus ring
- Transition durations in use: `0.3s`, `0.4s`
- Always respect `prefers-reduced-motion` — set all transitions to `0s` when enabled

## Design Tokens — JSON Files

### tokens/colors.json
```json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "core": {
    "background": {
      "value": "#000000",
      "role": "background",
      "name": "muted"
    },
    "text-primary": {
      "value": "#ffffff",
      "role": "text-primary"
    },
    "surface": {
      "value": "#111111",
      "role": "surface"
    },
    "text-muted": {
      "value": "#555555",
      "role": "text-muted"
    },
    "border": {
      "value": "#333333",
      "role": "border"
    },
    "accent": {
      "value": "#178a4c",
      "role": "accent"
    }
  },
  "status": {
    "success": {
      "value": "#1f7a4d",
      "role": "success"
    },
    "warning": {
      "value": "#f2e8d0",
      "role": "warning"
    },
    "danger": {
      "value": "#e5502f",
      "role": "danger"
    }
  },
  "extended": {
    "color-eeeeee": {
      "value": "#eeeeee",
      "role": "unknown"
    },
    "color-e2e2e2": {
      "value": "#e2e2e2",
      "role": "unknown"
    },
    "color-8a8a8a": {
      "value": "#8a8a8a",
      "role": "unknown"
    },
    "color-494949": {
      "value": "#494949",
      "role": "unknown"
    },
    "color-bdbdbd": {
      "value": "#bdbdbd",
      "role": "unknown"
    },
    "color-d9d9d9": {
      "value": "#d9d9d9",
      "role": "unknown"
    },
    "color-9a9a9a": {
      "value": "#9a9a9a",
      "role": "unknown"
    },
    "color-222222": {
      "value": "#222222",
      "role": "unknown"
    }
  },
  "meta": {
    "theme": "dark",
    "extracted": "2026-10-18"
  }
}
```

### tokens/spacing.json
```json
{
  "base": {
    "value": "4px",
    "description": "Grid unit — all spacing must be multiples of this"
  },
  "unit": "px",
  "scale": {
    "xs": {
      "value": "4px",
      "px": 4
    },
    "sm": {
      "value": "6px",
      "px": 6
    },
    "md": {
      "value": "8px",
      "px": 8
    },
    "lg": {
      "value": "10px",
      "px": 10
    },
    "xl": {
      "value": "12px",
      "px": 12
    },
    "2xl": {
      "value": "14px",
      "px": 14
    },
    "3xl": {
      "value": "16px",
      "px": 16
    },
    "4xl": {
      "value": "18px",
      "px": 18
    },
    "5xl": {
      "value": "20px",
      "px": 20
    },
    "6xl": {
      "value": "22px",
      "px": 22
    }
  },
  "multipliers": {
    "1x": {
      "value": "4px",
      "raw": 4
    },
    "2x": {
      "value": "8px",
      "raw": 8
    },
    "3x": {
      "value": "12px",
      "raw": 12
    },
    "4x": {
      "value": "16px",
      "raw": 16
    },
    "5x": {
      "value": "20px",
      "raw": 20
    },
    "6x": {
      "value": "24px",
      "raw": 24
    },
    "7x": {
      "value": "28px",
      "raw": 28
    },
    "8x": {
      "value": "32px",
      "raw": 32
    },
    "9x": {
      "value": "36px",
      "raw": 36
    },
    "10x": {
      "value": "40px",
      "raw": 40
    },
    "11x": {
      "value": "44px",
      "raw": 44
    },
    "12x": {
      "value": "48px",
      "raw": 48
    },
    "13x": {
      "value": "52px",
      "raw": 52
    },
    "14x": {
      "value": "56px",
      "raw": 56
    },
    "15x": {
      "value": "60px",
      "raw": 60
    },
    "16x": {
      "value": "64px",
      "raw": 64
    }
  },
  "meta": {
    "totalValues": 15,
    "min": 4,
    "max": 32
  }
}
```

### tokens/typography.json
```json
{
  "families": [
    "Awesome Serif Italic",
    "Aeonik"
  ],
  "scale": {
    "heading-1": {
      "fontFamily": "Awesome Serif Italic",
      "fontSize": "min(290px,(100vw - 2*var(--gutter))*0.2164)",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-2": {
      "fontFamily": "Awesome Serif Italic",
      "fontSize": "150px",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "heading-3": {
      "fontFamily": "Awesome Serif Italic",
      "fontSize": "128px",
      "fontWeight": "700",
      "lineHeight": null,
      "source": "css"
    },
    "body": {
      "fontFamily": "Aeonik",
      "fontSize": "20px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    },
    "caption": {
      "fontFamily": "Aeonik",
      "fontSize": "12px",
      "fontWeight": "400",
      "lineHeight": null,
      "source": "css"
    }
  },
  "fontFaces": [
    {
      "family": "Aeonik",
      "src": "https://jithinrp.com/fonts/Aeonik-Regular.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Aeonik",
      "src": "https://jithinrp.com/fonts/Aeonik-Medium.woff2",
      "format": "woff2",
      "weight": "500"
    },
    {
      "family": "Aeonik",
      "src": "https://jithinrp.com/fonts/Aeonik-Bold.woff2",
      "format": "woff2",
      "weight": "700"
    },
    {
      "family": "Awesome Serif Italic",
      "src": "https://jithinrp.com/fonts/AwesomeSerifItalic-VF.woff2",
      "format": "woff2",
      "weight": "300"
    },
    {
      "family": "Geist Pixel",
      "src": "https://jithinrp.com/fonts/GeistPixel-VF.woff2",
      "format": "woff2",
      "weight": "400"
    },
    {
      "family": "Digital Planers",
      "src": "https://jithinrp.com/fonts/DigitalPlaners.woff2",
      "format": "woff2",
      "weight": "400"
    }
  ],
  "rules": {
    "maxSizesPerScreen": 4,
    "headingWeightRange": "600-700",
    "bodyWeight": 400,
    "lineHeightBody": 1.5,
    "lineHeightHeading": 1.2
  }
}
```

## Bundled Fonts (fonts/)

The following font files are bundled in the `fonts/` directory:

- `fonts/Aeonik-500.woff2`
- `fonts/Aeonik-700.woff2`
- `fonts/Aeonik-Regular.woff2`
- `fonts/AwesomeSerifItalic-300.woff2`
- `fonts/DigitalPlaners-Regular.woff2`
- `fonts/GeistPixel-Regular.ttf`

Use these local font files in `@font-face` declarations instead of fetching from Google Fonts.

## Screenshots Inventory (screens/)

> Study all screenshots carefully before implementing any UI. Match every visual detail exactly.

### Scroll Journey (screens/scroll/)

*Cinematic scroll states — page visual at each scroll depth*

![scroll-000.png](screens/scroll/scroll-000.png)

![scroll-017.png](screens/scroll/scroll-017.png)

![scroll-033.png](screens/scroll/scroll-033.png)

![scroll-050.png](screens/scroll/scroll-050.png)

![scroll-067.png](screens/scroll/scroll-067.png)

![scroll-083.png](screens/scroll/scroll-083.png)

![scroll-100.png](screens/scroll/scroll-100.png)

### Full Page Screenshots (screens/pages/)

*Full-page screenshots of each crawled URL*

![home.png](screens/pages/home.png)

![memory.png](screens/pages/memory.png)

![slot-booking.png](screens/pages/slot-booking.png)

![squads.png](screens/pages/squads.png)

### Section Clips (screens/sections/)

*Clipped individual sections and components*

![home-section-1.png](screens/sections/home-section-1.png)

![memory-section-1.png](screens/sections/memory-section-1.png)

![slot-booking-section-1.png](screens/sections/slot-booking-section-1.png)

![slot-booking-section-2.png](screens/sections/slot-booking-section-2.png)

![squads-section-1.png](screens/sections/squads-section-1.png)

![squads-section-2.png](screens/sections/squads-section-2.png)

### Interaction States (screens/states/)

*Hover, focus, and active state captures*

![button-1-default.png](screens/states/button-1-default.png)

![button-1-focus.png](screens/states/button-1-focus.png)

![button-1-hover.png](screens/states/button-1-hover.png)

![button-2-default.png](screens/states/button-2-default.png)

![button-2-focus.png](screens/states/button-2-focus.png)

![button-2-hover.png](screens/states/button-2-hover.png)

![link-1-default.png](screens/states/link-1-default.png)

![link-1-focus.png](screens/states/link-1-focus.png)

![link-1-hover.png](screens/states/link-1-hover.png)

![link-2-default.png](screens/states/link-2-default.png)

![link-2-focus.png](screens/states/link-2-focus.png)

![link-2-hover.png](screens/states/link-2-hover.png)

![link-3-default.png](screens/states/link-3-default.png)

![link-3-focus.png](screens/states/link-3-focus.png)

![link-3-hover.png](screens/states/link-3-hover.png)

### Screenshot Index (screens/INDEX.md)

# Screenshot Index

## Scroll Journey

> Shows the cinematic state at each point of the page

| Scroll | Y Position | File |
|--------|-----------|------|
| 0% | 0px | `screens/scroll/scroll-000.png` |
| 17% | 1192px | `screens/scroll/scroll-017.png` |
| 33% | 2313px | `screens/scroll/scroll-033.png` |
| 50% | 3505px | `screens/scroll/scroll-050.png` |
| 67% | 4696px | `screens/scroll/scroll-067.png` |
| 83% | 5817px | `screens/scroll/scroll-083.png` |
| 100% | 7009px | `screens/scroll/scroll-100.png` |

## Pages

| Page | URL | File |
|------|-----|------|
| Jithin RP — Senior Product Designer | `https://jithinrp.com/` | `screens/pages/home.png` |
| Memory — Jithin RP | `https://jithinrp.com/memory/` | `screens/pages/memory.png` |
| Slot Booking — Turning Slot Selection into a Confident Decision | Jithin RP | `https://jithinrp.com/slot-booking` | `screens/pages/slot-booking.png` |
| Squads — Community Experience | Jithin RP | `https://jithinrp.com/squads` | `screens/pages/squads.png` |

## Sections

| Page | Section | File |
|------|---------|------|
| home | #1 (section) | `screens/sections/home-section-1.png` |
| memory | #1 (section) | `screens/sections/memory-section-1.png` |
| slot-booking | #1 (section) | `screens/sections/slot-booking-section-1.png` |
| slot-booking | #2 (section) | `screens/sections/slot-booking-section-2.png` |
| squads | #1 (section) | `screens/sections/squads-section-1.png` |
| squads | #2 (section) | `screens/sections/squads-section-2.png` |

