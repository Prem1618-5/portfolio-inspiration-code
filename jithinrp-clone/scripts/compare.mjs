// Compare screenshots/<set>/* (live) against screenshots/rebuild/* (rebuild) with pixelmatch -> screenshots/diff + report
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const A = path.resolve('screenshots'), B = path.resolve('screenshots/rebuild'), OUT = path.resolve('screenshots/diff');
const only = process.argv[2]; // optional substring filter
const read = (f) => PNG.sync.read(fs.readFileSync(f));
const rows = [];
for (const dir of ['responsive', 'scroll-frames', 'states', 'ai-details']) {
  if (!fs.existsSync(path.join(B, dir))) continue;
  for (const f of fs.readdirSync(path.join(B, dir)).filter((x) => x.endsWith('.png')).sort()) {
    if (only && !f.includes(only) && !dir.includes(only)) continue;
    const fa = path.join(A, dir, f);
    if (!fs.existsSync(fa)) { rows.push({ dir, f, note: 'no live counterpart' }); continue; }
    const a = read(fa), b = read(path.join(B, dir, f));
    const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
    const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
    const ca = crop(a), cb = crop(b), diff = new PNG({ width: w, height: h });
    const n = pixelmatch(ca.data, cb.data, diff.data, w, h, { threshold: 0.15 });
    fs.mkdirSync(path.join(OUT, dir), { recursive: true });
    fs.writeFileSync(path.join(OUT, dir, f), PNG.sync.write(diff));
    rows.push({ dir, f, live: `${a.width}x${a.height}`, rebuild: `${b.width}x${b.height}`, sizeMatch: a.width === b.width && a.height === b.height, diffPct: +((n / (w * h)) * 100).toFixed(2) });
  }
}
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows, null, 1));
console.log('| Set | File | Live | Rebuild | Same size | Diff % |\n| --- | --- | --- | --- | --- | --- |');
rows.forEach((r) => console.log(`| ${r.dir} | ${r.f} | ${r.live || ''} | ${r.rebuild || ''} | ${r.sizeMatch ?? ''} | ${r.diffPct ?? r.note} |`));
