// awards / testimonial / footer hover states (viewport shots; their boxes can exceed the viewport)
import { chromium } from 'playwright';
import { enter } from './enter.mjs';
const BASE = process.argv[2] || 'https://jithinrp.com', OUT = process.argv[3] || 'screenshots';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.route(/googletagmanager|google-analytics/, (r) => r.abort());
await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 }); await enter(page);
for (const [sel, name] of [['.award', 'awards-hover'], ['.quote', 'quote-hover'], ['.footer__top', 'footer-back-to-top-hover']]) {
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
  await page.waitForTimeout(1800);
  const el = page.locator(sel).first(); const bb = await el.boundingBox();
  console.log(name, JSON.stringify(bb));
  await page.mouse.move(5, 5); await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/states/${name.replace('hover', 'default')}.png` });
  if (bb) await page.mouse.move(bb.x + bb.width / 2, Math.min(880, Math.max(10, bb.y + bb.height / 2)), { steps: 8 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/states/${name}.png` });
}
await b.close();
