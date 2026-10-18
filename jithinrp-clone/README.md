# jithinrp.com study clone

- Purpose: study the design of https://jithinrp.com/ and run it locally (offline mirror + clean rebuild of the home page)
- Captured: 2026-10-18 from a cloud Linux container (not a local machine), Chromium 141, Playwright

## Folder structure

| Path | Contents |
| --- | --- |
| `raw/` | Offline mirror, served as-is with `npx serve ./raw` |
| `raw/_source/` | Original page source per page (no JS run), GA included |
| `raw/_rendered/` | Rendered DOM per page, plus `home-modal-*.html` for the 3 AI modals |
| `raw/_har/jithinrp.har` | HAR of all requests (bodies omitted; bodies are saved as files) |
| `raw/_manifest-pass-*.json` | What each mirror pass saved / could not find |
| `tokens/` | `tokens.json` (raw data) + `tokens.md` (tables, generated from the JSON) |
| `skill/jithinrp-design/` | skillui ultra output incl. `jithinrp-design.skill`, DESIGN.md, fonts, screens |
| `screenshots/` | Live-site shots: `responsive/`, `scroll-frames/`, `states/`, `ai-details/` |
| `screenshots/rebuild/` | Same shots of the rebuild |
| `screenshots/diff/` | pixelmatch diffs + `report.md` / `report.json` |
| `rebuild/` | Vite project: home page rebuilt (tokens as CSS variables) |
| `scripts/` | All capture / extraction / compare scripts |

## How to run

| Task | Commands |
| --- | --- |
| Mirror (offline) | `cd jithinrp-clone && npx serve ./raw -l 3000` then open http://localhost:3000 |
| Rebuild | `cd rebuild && npm install && npm run dev` then open http://127.0.0.1:5173 |
| Re-capture mirror | `node scripts/mirror.mjs && node scripts/mirror-b.mjs && python3 scripts/offlinize.py` |
| Re-extract tokens | `node scripts/extract-tokens.mjs && node scripts/render-tokens-md.mjs` |
| Screenshots | `node scripts/screenshots.mjs <baseUrl> <outDir>` (+ `scripts/screenshots-extra-states.mjs`) |
| Compare | `node scripts/compare.mjs` |
| Offline check | `node scripts/offline-check.mjs http://localhost:3000` (blocks all non-local requests) |

- Set `CHROMIUM_PATH` if your Chromium is not at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`

## Things to know about the site

- Home opens on a gate: "Draw a Z on the water / press Enter". Scripts press Enter (`scripts/enter.mjs`)
- At width < 768 px the site shows only a "Hey Mate… open this on a desktop" note
- Selected Works is a pinned, sideways-scrolling strip
- Fonts: Aeonik, Awesome Serif Italic, Geist Pixel, Digital Planers, all self-hosted
- Libraries (self-hosted in `raw/vendor`): GSAP 3.13.0 + ScrollTrigger + SplitText, Lenis 1.1.14, Three.js

## Mirror results

- Pages: `/`, `/slot-booking`, `/squads`, `/memory/`
- Offline check: all 4 pages load with 0 failed non-media requests and 0 JS errors; page heights equal live
- Changes made to saved HTML: Google Analytics removed; same-origin absolute URLs made root-relative
- Third-party: only Google Analytics (skipped)
- Requests were serialized with a 250 ms delay

## Rebuild results (home page, 1440 / 1024 / 768 px)

| Check | Result |
| --- | --- |
| Full-page size vs live | identical at 1440 (9922), 1024 (8166), 768 (8776) |
| Viewport shots (first screen) | 0.01% / 0.01% / 0.6% pixel diff |
| AI modals (8 shots) | 0% diff |
| CTA / nav states | 0–1.4% diff |
| Scroll frames | 0.04–11.4% diff (animation state, WebGL media) |
| Details | `screenshots/diff/report.md` |

## Known gaps

| Gap | Detail |
| --- | --- |
| Not ported to rebuild | WebGL liquid planes (Three.js shaders on media and about photo), water-sheet Z gate (2D canvas ink used instead), "ball lens" text curve, page-transition / bubble-burst to case studies, light mode (`?lite`) |
| Rebuild sound | Synthesised drops + music ported; no bubble swell/pop used by the transitions |
| Rebuild pages | Home only; links to `/slot-booking`, `/squads`, `/memory/` do not resolve in the Vite dev server |
| Phone (390 px) diff | Live shows an unplayed signature (dots) in the phone note; rebuild shows the script-font brand |
| MP4 / MP3 in headless capture | This container's Chromium has no H.264, so videos show posters in all screenshots; files are mirrored and served correctly (verified with HTTP range requests) |
| Parcel Sorter gallery | JS requests images 01–08; only 01 and 02 exist on the server (the site removes the rest) |
| Hover/focus | Captured as screenshots; some hover effects (cursor pill, trail) depend on real pointer movement |
| Server-side logic | None found: all pages are static files. Anything server-side (headers, redirects, `?v=` cache busting) was not captured |
| Resume link | Points to a Google Docs export URL; not mirrored |
| Token extraction | Values set at runtime by GSAP/ScrollTrigger are only listed as source lines in `tokens.md` §5.5, not replayed. Case-study and Memory pages: CSS included, component HTML not inventoried |
| Mirror pass A/B | 59 URL candidates 404ed in pass B; these are comment text / fallback extensions (see `raw/_manifest-pass-b.json`) |
