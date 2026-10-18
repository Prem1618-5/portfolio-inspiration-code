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

