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

