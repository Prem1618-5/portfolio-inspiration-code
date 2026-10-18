// Phase 2, pass B: fetch assets that pass A could not see (lazy videos, JS-built gallery images, MP3), then make raw/ run offline.
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://jithinrp.com';
const RAW = path.resolve('raw');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const EXT = /\.(css|js|woff2?|ttf|svg|webp|png|jpe?g|gif|mp4|mp3|webm|json|ico)(\?[^"'\s)<>]*)?$/i;

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.name.startsWith('_')) continue;
    const f = path.join(d, e.name);
    e.isDirectory() ? walk(f, out) : out.push(f);
  }
  return out;
}

// 1. collect candidate URLs from every saved text file (source + rendered HTML, CSS, JS)
const textFiles = [...walk(RAW).filter((f) => /\.(html|css|js)$/.test(f)),
  ...fs.readdirSync(path.join(RAW, '_source')).map((f) => path.join(RAW, '_source', f)),
  ...fs.readdirSync(path.join(RAW, '_rendered')).map((f) => path.join(RAW, '_rendered', f))];
const want = new Map(); // url -> where found
for (const f of textFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  const base = new URL('/' + path.relative(RAW, f).replace(/^_(source|rendered)\//, (m, k) => ''), ORIGIN);
  const pageBase = f.includes('/memory/') || f.includes('home-modal') && false ? base : base;
  for (const m of txt.matchAll(/["'(=\s]((?:https?:\/\/jithinrp\.com\/)?(?:\.\.?\/)?[A-Za-z0-9_%+ ./~-]+\.(?:css|js|woff2?|ttf|svg|webp|png|jpe?g|gif|mp4|mp3|webm|json)(?:\?[A-Za-z0-9_=&.-]+)?)["')\s]/g)) {
    let ref = m[1].trim();
    if (/^https?:/.test(ref) && !ref.startsWith(ORIGIN)) continue;
    if (ref.startsWith('//')) continue;
    // page-relative refs: memory/* resolve against /memory/, everything else against /
    const dir = /\/memory\//.test(f) || /_source\/memory|_rendered\/memory/.test(f) ? ORIGIN + '/memory/' : ORIGIN + '/';
    let abs; try { abs = new URL(ref, dir).href; } catch { continue; }
    if (abs.startsWith(ORIGIN) && EXT.test(abs)) want.set(abs, path.relative(RAW, f));
  }
}
// JS-built references (see site.js): gallery 01..08 in 4 extensions, music file
for (const dir of ['assets/ai/parcel-sorter/']) for (let i = 1; i <= 8; i++) for (const e of ['webp', 'jpg', 'png', 'jpeg']) want.set(`${ORIGIN}/${dir}${String(i).padStart(2, '0')}.${e}`, 'site.js gallery');
want.set(`${ORIGIN}/mp3/${encodeURIComponent('Lofi BGM.mp3')}`, 'site.js music');

// 2. fetch the ones we do not have yet
const have = (u) => { const p = decodeURIComponent(new URL(u).pathname); return fs.existsSync(path.join(RAW, p)); };
const rep = { fetched: [], missing404: [], error: [] };
let galleryHit = new Set();
for (const [u, where] of want) {
  if (have(u)) continue;
  const m = u.match(/(assets\/ai\/parcel-sorter\/\d\d)\.\w+$/);
  if (m && galleryHit.has(m[1])) continue; // an earlier extension already matched
  try {
    const r = await fetch(u);
    if (r.status === 200 && !/text\/html/.test(r.headers.get('content-type') || '')) {
      const f = path.join(RAW, decodeURIComponent(new URL(u).pathname));
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      rep.fetched.push([u, where]); if (m) galleryHit.add(m[1]);
    } else rep.missing404.push([u, r.status, where]);
  } catch (e) { rep.error.push([u, String(e)]); }
  await sleep(250);
}
fs.writeFileSync(path.join(RAW, '_manifest-pass-b.json'), JSON.stringify(rep, null, 2));
console.log('fetched', rep.fetched.length, 'not-found', rep.missing404.length, 'errors', rep.error.length);
