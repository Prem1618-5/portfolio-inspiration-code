// loads every page from the local server with all non-localhost requests aborted; reports failures
import { chromium } from 'playwright';
import { enter } from './enter.mjs';
const base = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const bad = [], ext = [];
p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
p.on('requestfailed', (r) => bad.push('FAILED ' + r.url()));
p.on('pageerror', (e) => bad.push('JSERR ' + e.message.slice(0, 120)));
await p.route('**/*', (r) => { const u = r.request().url(); if (u.startsWith(base)) return r.continue(); ext.push(u.slice(0, 80)); return r.abort(); });
for (const u of ['/', '/slot-booking', '/squads', '/memory/']) {
  await p.goto(base + u, { waitUntil: 'load' }); await enter(p);
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 600) { await p.mouse.wheel(0, 600); await p.waitForTimeout(150); }
  console.log(u, 'height', h, 'title', await p.title());
}
console.log('problems:', bad.length ? bad : 'none'); console.log('external requests attempted:', ext.length ? ext : 'none');
await b.close();
