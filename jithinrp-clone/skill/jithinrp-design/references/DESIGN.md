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
