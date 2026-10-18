// Phase 3: extract design data from the LIVE site -> tokens/tokens.json  (run from jithinrp-clone/)
import { chromium } from 'playwright';
import fs from 'node:fs';
import { enter } from './enter.mjs';

const ORIGIN = process.env.ORIGIN || 'https://jithinrp.com';
const PAGES = ['/', '/slot-booking', '/squads', '/memory/'];
const COMPONENTS = {
  nav: '.navbar', 'mobile-gate': '.mobile-gate', hero: '.hero', pillar: '.pillar', marquee: '.marquee',
  'work-card': '.work', 'ai-project-card': '.ai-card', 'carousel-arrows': '.arrows', about: '.about',
  'award-badge': '.award', 'testimonial-card': '.quote', cta: '.contact', footer: '.footer',
  'project-modal': '.pmodal', 'sound-toggle': '.sound-toggle',
};
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.route(/googletagmanager|google-analytics/, (r) => r.abort());
const page = await ctx.newPage();
const out = { source: ORIGIN, viewport: '1440x900', pages: {}, sheets: {}, jsMotion: {} };

for (const p of PAGES) {
  await page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
  await enter(page);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(200); }
  await page.waitForTimeout(600);

  out.pages[p] = await page.evaluate(({ COMPONENTS }) => {
    const cs = (el) => getComputedStyle(el);
    const all = [...document.querySelectorAll('body, body *')].filter((e) => !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META'].includes(e.tagName));
    const tally = (m, k) => { if (k && k !== 'none' && k !== 'normal') m[k] = (m[k] || 0) + 1; };
    const colors = { text: {}, background: {}, border: {}, outline: {}, svgFill: {}, svgStroke: {}, shadowColors: {} };
    const sp = { padding: {}, margin: {}, gap: {} }, radius = {}, shadow = {}, zi = {}, trans = {}, anim = {}, filters = {}, blend = {}, cursors = {};
    const isClear = (c) => !c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent';
    for (const el of all) {
      const s = cs(el);
      tally(colors.text, s.color);
      if (!isClear(s.backgroundColor)) tally(colors.background, s.backgroundColor);
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(s['border' + side + 'Width']) > 0 && s['border' + side + 'Style'] !== 'none') tally(colors.border, s['border' + side + 'Color']);
      if (parseFloat(s.outlineWidth) > 0 && s.outlineStyle !== 'none') tally(colors.outline, s.outlineColor);
      if (el instanceof SVGElement) { tally(colors.svgFill, s.fill); tally(colors.svgStroke, s.stroke); }
      for (const prop of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) if (parseFloat(s[prop])) tally(sp.padding, s[prop]);
      for (const prop of ['marginTop', 'marginRight', 'marginBottom', 'marginLeft']) if (parseFloat(s[prop])) tally(sp.margin, s[prop]);
      for (const prop of ['rowGap', 'columnGap']) if (parseFloat(s[prop])) tally(sp.gap, s[prop]);
      tally(radius, s.borderRadius);
      if (s.boxShadow !== 'none') { tally(shadow, s.boxShadow); for (const m of s.boxShadow.matchAll(/rgba?\([^)]*\)/g)) tally(colors.shadowColors, m[0]); }
      if (s.zIndex !== 'auto') tally(zi, s.zIndex);
      if (s.transitionDuration && s.transitionDuration !== '0s') tally(trans, `${s.transitionProperty} | ${s.transitionDuration} | ${s.transitionTimingFunction} | delay ${s.transitionDelay}`);
      if (s.animationName !== 'none') tally(anim, `${s.animationName} | ${s.animationDuration} | ${s.animationTimingFunction} | ${s.animationIterationCount} | delay ${s.animationDelay}`);
      if (s.filter !== 'none') tally(filters, 'filter: ' + s.filter);
      if (s.backdropFilter && s.backdropFilter !== 'none') tally(filters, 'backdrop-filter: ' + s.backdropFilter);
      if (s.mixBlendMode !== 'normal') tally(blend, s.mixBlendMode);
      tally(cursors, s.cursor);
    }
    const sel = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
    // type scale: one row per distinct (selector, size, weight, lh, ls, family) for text-bearing elements
    const typeRows = {};
    for (const el of all) {
      if (el instanceof SVGElement) continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const s = cs(el);
      const key = [sel(el), s.fontSize, s.fontWeight, s.lineHeight, s.letterSpacing, s.fontFamily, s.textTransform, s.fontStyle].join('||');
      typeRows[key] = typeRows[key] || { selector: sel(el), fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, fontFamily: s.fontFamily, textTransform: s.textTransform, fontStyle: s.fontStyle, count: 0, sample: el.textContent.trim().slice(0, 50) };
      typeRows[key].count++;
    }
    // layout: width / display / grid / flex for structural containers
    const layout = [];
    for (const el of document.querySelectorAll('.container, .site, main, section, header, footer, [class*="__grid"], [class*="__row"], [class*="__inner"], .track, .band')) {
      const s = cs(el), r = el.getBoundingClientRect();
      layout.push({ selector: sel(el), width: Math.round(r.width), maxWidth: s.maxWidth, display: s.display, gridTemplateColumns: s.display.includes('grid') ? s.gridTemplateColumns : undefined, flexDirection: s.display.includes('flex') ? s.flexDirection : undefined, justify: s.justifyContent, align: s.alignItems, gap: s.gap, padding: s.padding, position: s.position, overflowX: s.overflowX });
    }
    const components = {};
    for (const [name, q] of Object.entries(COMPONENTS)) {
      const el = document.querySelector(q);
      if (!el) continue;
      const s = cs(el), r = el.getBoundingClientRect();
      const html = el.outerHTML.replace(/\s+/g, ' ');
      components[name] = { selector: q, size: `${Math.round(r.width)}x${Math.round(r.height)}`, computed: { display: s.display, position: s.position, color: s.color, background: s.backgroundColor, padding: s.padding, margin: s.margin, borderRadius: s.borderRadius, border: s.border, boxShadow: s.boxShadow, gap: s.gap, fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: s.fontWeight, cursor: s.cursor, transition: s.transition }, html: html.length > 2500 ? html.slice(0, 2500) + ' …[truncated, full length ' + html.length + ']' : html };
    }
    return { rootVars: [...document.styleSheets].length, colors, spacing: sp, radius, shadow, zIndex: zi, transitions: trans, animations: anim, filters, blend, cursors, typeScale: Object.values(typeRows), layout, components, docHeight: document.documentElement.scrollHeight, bodyBg: cs(document.body).backgroundColor, fontsLoaded: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} ${f.status}`) };
  }, { COMPONENTS });
}

// stylesheet-level data (same on all pages that include the sheet): @font-face, :root vars, keyframes, media, rules
const grabSheets = () => {
  const res = {};
  const walk = (rules, acc, ctx) => {
    for (const r of rules) {
      if (r.type === CSSRule.STYLE_RULE) acc.rules.push({ sel: r.selectorText, css: r.style.cssText, media: ctx });
      else if (r.type === CSSRule.KEYFRAMES_RULE) acc.keyframes.push({ name: r.name, css: r.cssText });
      else if (r.type === CSSRule.FONT_FACE_RULE) acc.fontFaces.push(r.cssText);
      else if (r.type === CSSRule.MEDIA_RULE) { acc.media.push(r.conditionText); walk(r.cssRules, acc, r.conditionText); }
      else if (r.type === CSSRule.SUPPORTS_RULE) walk(r.cssRules, acc, 'supports ' + r.conditionText);
      else acc.other.push(r.cssText.slice(0, 300));
    }
  };
  for (const sh of document.styleSheets) {
    const acc = { rules: [], keyframes: [], fontFaces: [], media: [], other: [] };
    try { walk(sh.cssRules, acc, null); } catch (e) { acc.error = String(e); }
    res[sh.href || 'inline'] = acc;
  }
  return res;
};
out.sheets = {}; out.sheetsByPage = {};
for (const p of PAGES) {
  await page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
  const got = await page.evaluate(grabSheets);
  out.sheetsByPage[p] = Object.keys(got);
  Object.assign(out.sheets, got);
}
await b.close();

// JS-driven motion: grep real lines from site.js (no interpretation)
const js = await (await fetch(ORIGIN + '/site.js?v=170')).text();
const lines = js.split('\n');
const grab = (re) => lines.map((l, i) => [i + 1, l.trim()]).filter(([, l]) => re.test(l)).map(([n, l]) => `${n}: ${l.slice(0, 220)}`);
out.jsMotion = {
  gsapCalls: grab(/gsap\.(to|from|fromTo|set|timeline|quickTo|registerPlugin|ticker)\b/),
  scrollTrigger: grab(/ScrollTrigger\.(create|batch|config)|scrollTrigger\s*:/),
  lenis: grab(/new Lenis|lenis\.(on|scrollTo|stop|start)\b/),
  splitText: grab(/SplitText/),
  three: grab(/THREE\./).slice(0, 40),
  audio: grab(/AudioContext|createOscillator|createGain|music\.|\.play\(\)/).slice(0, 40),
  cursor: grab(/cursor-pill|data-cursor|pointermove|mousemove/).slice(0, 30),
  easings: grab(/ease\s*:\s*["']/).slice(0, 60),
  reducedMotion: grab(/prefers-reduced-motion/),
  setup_functions: grab(/^function setup\w+|^\s*function (setup|init)\w+/),
};
fs.mkdirSync('tokens', { recursive: true });
fs.writeFileSync('tokens/tokens.json', JSON.stringify(out, null, 1));
console.log('wrote tokens/tokens.json', (fs.statSync('tokens/tokens.json').size / 1024) | 0, 'KB');
