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

