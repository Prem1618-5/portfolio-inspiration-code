// Phase 4: screenshots. usage: node scripts/screenshots.mjs <baseUrl> <outDir> [--only=home]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { enter } from './enter.mjs';

const BASE = process.argv[2] || 'https://jithinrp.com';
const OUT = path.resolve(process.argv[3] || 'screenshots');
const PARTS = (process.env.PARTS || 'responsive,frames,states,ai').split(',');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const WIDTHS = [1440, 1024, 768, 390];
const PAGES = [['home', '/'], ['slot-booking', '/slot-booking'], ['squads', '/squads'], ['memory', '/memory/']];
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const mk = (d) => fs.mkdirSync(path.join(OUT, d), { recursive: true });
const shot = async (page, rel, opts = {}) => { await page.screenshot({ path: path.join(OUT, rel), ...opts }); console.log('  ', rel); };
async function open(ctx, url) {
  const page = await ctx.newPage();
  await page.route(/googletagmanager|google-analytics/, (r) => r.abort());
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  if (!(await enter(page))) await page.waitForTimeout(2500);
  return page;
}
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 450) { await page.mouse.wheel(0, 450); await page.waitForTimeout(160); }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(900);
}

// 1. full-page + viewport at 4 widths
mk('responsive');
for (const w of PARTS.includes('responsive') ? WIDTHS : []) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 390 ? 844 : 900 }, deviceScaleFactor: 1 });
  for (const [name, p] of PAGES) {
    if (ONLY && ONLY !== name) continue;
    const page = await open(ctx, BASE + p);
    await shot(page, `responsive/${name}-${w}-viewport.png`);
    await scrollThrough(page);
    await shot(page, `responsive/${name}-${w}-fullpage.png`, { fullPage: true });
    await page.close();
  }
  await ctx.close();
}
if (ONLY && ONLY !== 'home') { await b.close(); process.exit(0); }

// 2. seven scroll frames, home, 1440
mk('scroll-frames');
if (PARTS.includes('frames')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, BASE + '/');
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let i = 0; i < 7; i++) {
    const target = Math.round((H * i) / 6);
    // wheel in steps so Lenis / ScrollTrigger follow, then settle
    const cur = await page.evaluate(() => scrollY);
    const step = (target - cur) / 12;
    for (let s = 0; s < 12; s++) { await page.mouse.wheel(0, step); await page.waitForTimeout(90); }
    await page.waitForTimeout(1600);
    const y = await page.evaluate(() => Math.round(scrollY));
    await shot(page, `scroll-frames/home-frame-${i + 1}-of-7-y${y}.png`);
  }
  await ctx.close();
}

// 3. hover / focus states, home, 1440
mk('states');
if (PARTS.includes('states')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await open(ctx, BASE + '/');
  const clip = async (loc, name, pad = 30) => {
    try { await loc.scrollIntoViewIfNeeded({ timeout: 3000 }); await page.waitForTimeout(600); } catch {}
    const bb = await loc.boundingBox(); if (!bb) return console.log('   no box for', name);
    const vw = 1440, vh = 900;
    if (bb.y < 0 || bb.y + bb.height > vh) { console.log('   outside viewport, skipped', name); return; }
    try { const x = Math.max(0, bb.x - pad), y = Math.max(0, bb.y - pad); await page.screenshot({ path: path.join(OUT, `states/${name}.png`), clip: { x, y, width: Math.min(vw - x, bb.width + pad * 2), height: Math.min(vh - y, bb.height + pad * 2) } }); } catch (e) { console.log('   FAILED', name, String(e).split('\n')[0]); return; }
    console.log('   states/' + name + '.png');
  };
  const nav = page.locator('.nav__links a');
  for (let i = 0; i < await nav.count(); i++) {
    const a = nav.nth(i); const label = (await a.innerText()).trim().toLowerCase().replace(/\s+/g, '-');
    await page.mouse.move(5, 500); await page.waitForTimeout(300);
    await clip(a, `nav-${label}-default`);
    await a.hover(); await page.waitForTimeout(500); await clip(a, `nav-${label}-hover`);
    await page.mouse.move(5, 500); await a.focus(); await page.keyboard.press('Shift+Tab'); await a.focus(); await page.waitForTimeout(300); await clip(a, `nav-${label}-focus`);
  }
  const sound = page.locator('[data-sound-toggle]');
  await page.mouse.move(5, 500); await clip(sound, 'sound-toggle-default'); await sound.hover(); await page.waitForTimeout(400); await clip(sound, 'sound-toggle-hover');
  // cards: scroll each into view with wheel, then hover
  const goto = async (sel) => { await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel); await page.waitForTimeout(1500); };
  await goto('.work'); const work = page.locator('.work').first(); await page.mouse.move(5, 5); await page.waitForTimeout(300); await clip(work, 'work-card-default', 0);
  await work.hover(); await page.waitForTimeout(900); await clip(work, 'work-card-hover', 0);
  await goto('.ai-card'); const ai = page.locator('.ai-card'); for (let i = 0; i < await ai.count(); i++) { const c = ai.nth(i); if (!(await c.isVisible())) continue; await page.mouse.move(5, 5); await clip(c, `ai-card-${i + 1}-default`, 0); await c.hover(); await page.waitForTimeout(900); await clip(c, `ai-card-${i + 1}-hover`, 0); }
  const arrows = page.locator('.arrow'); for (let i = 0; i < await arrows.count(); i++) { await arrows.nth(i).hover(); await page.waitForTimeout(400); await clip(arrows.nth(i), `carousel-arrow-${i + 1}-hover`); await arrows.nth(i).focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await clip(arrows.nth(i), `carousel-arrow-${i + 1}-focus`); }
  await goto('.contact__links'); const cl = page.locator('.contact__links a'); for (let i = 0; i < await cl.count(); i++) { const a = cl.nth(i); const label = (await a.innerText()).trim().toLowerCase(); await page.mouse.move(5, 5); await page.waitForTimeout(300); await clip(a, `cta-${label}-default`); await a.hover(); await page.waitForTimeout(500); await clip(a, `cta-${label}-hover`); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab'); await a.focus(); await clip(a, `cta-${label}-focus`); }
  await goto('.award'); await page.locator('.award').first().hover(); await page.waitForTimeout(500); await clip(page.locator('.awards__row'), 'awards-row-hover', 0);
  await goto('.quote'); await page.locator('.quote').first().hover(); await page.waitForTimeout(500); await clip(page.locator('.quote').first(), 'quote-hover', 10);
  await goto('.footer__top'); await page.locator('.footer__top').hover(); await page.waitForTimeout(400); await clip(page.locator('.footer'), 'footer-hover', 0);
  await ctx.close();
}

// 4. the three AI project detail views
mk('ai-details');
if (PARTS.includes('ai')) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  for (const id of ['parcel-sorter', 'undo', 'stickskate']) {
    const page = await open(ctx, BASE + '/');
    await page.evaluate((i) => { document.querySelector('.genai').scrollIntoView(); document.querySelector(`[data-modal-open="${i}"]`).click(); }, id);
    await page.waitForTimeout(2200);
    await shot(page, `ai-details/${id}-open.png`);
    // full content of the modal: expand scroll container to its content height and shoot the panel
    const panel = page.locator(`#${id} .pmodal__panel`);
    const sh = await page.evaluate((i) => { const m = document.querySelector(`#${i}`); const p = m.querySelector('.pmodal__panel'); return [p.scrollHeight, p.clientHeight, getComputedStyle(m).overflowY, getComputedStyle(p).overflowY]; }, id);
    console.log('   modal', id, 'scrollHeight/clientHeight/overflow', sh);
    for (let k = 1, y = 0; ; k++) { // scroll the panel (or modal) in steps and capture each
      const done = await page.evaluate(([i, step]) => { const m = document.querySelector(`#${i}`); const p = m.querySelector('.pmodal__panel'); const el = p.scrollHeight > p.clientHeight + 4 ? p : m; const before = el.scrollTop; el.scrollTop += step; return el.scrollTop === before; }, [id, 800]);
      if (done || k > 6) break;
      await page.waitForTimeout(900);
      await shot(page, `ai-details/${id}-scroll-${k}.png`);
    }
    await page.close();
  }
  await ctx.close();
}
await b.close();
