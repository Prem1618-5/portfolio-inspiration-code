// Phase 2: mirror https://jithinrp.com/ into ./raw  (run from jithinrp-clone/: node scripts/mirror.mjs)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { enter } from './enter.mjs';

const ORIGIN = 'https://jithinrp.com';
const RAW = path.resolve('raw');
const CHROME = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DELAY = 250;
const BLOCK = /googletagmanager\.com|google-analytics\.com|doubleclick\.net/;
const PAGES = [['/', 'home'], ['/slot-booking', 'slot-booking'], ['/squads', 'squads'], ['/memory/', 'memory']];
const MODALS = ['parcel-sorter', 'undo', 'stickskate'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const manifest = { saved: {}, failed: {}, blocked: [] };

function fileFor(urlStr, contentType = '') {
  const u = new URL(urlStr);
  let p = decodeURIComponent(u.pathname);
  if (p.endsWith('/')) p += 'index.html';
  else if (!path.extname(p) && /text\/html/.test(contentType)) p += '.html'; // clean URLs: /squads -> squads.html
  return path.join(RAW, p);
}
function save(urlStr, body, contentType) {
  const f = fileFor(urlStr, contentType);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, body);
  manifest.saved[new URL(urlStr).pathname] = path.relative(RAW, f);
}

const browser = await chromium.launch({ executablePath: CHROME });
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordHar: { path: path.join(RAW, '_har', 'jithinrp.har'), content: 'omit', mode: 'full' },
});
fs.mkdirSync(path.join(RAW, '_har'), { recursive: true });
fs.mkdirSync(path.join(RAW, '_source'), { recursive: true });
fs.mkdirSync(path.join(RAW, '_rendered'), { recursive: true });

// one request at a time, small delay between requests
let chain = Promise.resolve();
await ctx.route('**/*', (route) => {
  const req = route.request();
  const url = req.url();
  if (BLOCK.test(url)) { manifest.blocked.push(url.slice(0, 120)); return route.abort(); }
  if (!url.startsWith(ORIGIN)) return route.continue();
  const job = chain.then(async () => {
    try {
      const res = await route.fetch();
      const ct = res.headers()['content-type'] || '';
      // media (video/audio) and partial responses are fetched whole in pass B
      if (res.status() === 200 && !/^(video|audio)\//.test(ct) && req.method() === 'GET') save(url, await res.body(), ct);
      await route.fulfill({ response: res });
    } catch (e) { manifest.failed[url] = String(e); try { await route.abort(); } catch {} }
    await sleep(DELAY);
  });
  chain = job.catch(() => {});
  return job;
});

const page = await ctx.newPage();
const log = (...a) => console.log('[mirror]', ...a);

for (const [p, name] of PAGES) {
  // original page source (no JS executed)
  const src = await ctx.request.get(ORIGIN + p);
  fs.writeFileSync(path.join(RAW, '_source', name + '.html'), await src.body());
  await sleep(DELAY);

  await page.goto(ORIGIN + p, { waitUntil: 'networkidle' });
  log('gate passed:', await enter(page));
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + 900; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250); }
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  fs.writeFileSync(path.join(RAW, '_rendered', name + '.html'), await page.content());
  log('page', p, 'height', h);

  if (name === 'home') {
    for (const id of MODALS) {
      const ok = await page.evaluate((i) => { const el = document.querySelector(`[data-modal-open="${i}"]`); if (!el) return false; el.click(); return true; }, id);
      if (!ok) log('opener not found', id);
      await page.waitForTimeout(1800);
      fs.writeFileSync(path.join(RAW, '_rendered', `home-modal-${id}.html`), await page.content());
      await page.keyboard.press('Escape');
      await page.waitForTimeout(700);
    }
    await page.evaluate(() => document.querySelector('[data-sound-toggle]')?.click());
    await page.waitForTimeout(1200);
  }
}
await ctx.close();
await browser.close();
fs.writeFileSync(path.join(RAW, '_manifest-pass-a.json'), JSON.stringify(manifest, null, 2));
log('pass A saved', Object.keys(manifest.saved).length, 'files; blocked', manifest.blocked.length);
