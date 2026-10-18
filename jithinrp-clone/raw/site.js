/* =========================================================
   Site runtime — shared by every page (landing + case studies)
   Everything is opt-in by markup, so a page only gets what it uses:
   [data-liquid] planes, [data-reveal], [data-pixel-title],
   [data-intro-lines], [data-cursor-pill], .band hairlines, etc.
   - Lenis smooth scroll drives GSAP ScrollTrigger
   - One fixed Three.js canvas mirrors every [data-liquid] element
     as a shader plane (images, videos + procedural gradients)
   - Phones (<768px) skip all of this and see a "desktop" note
   - Planes respond to cursor (liquid lens + ripples),
     scroll velocity (sheet bends and smears) and reveal (noisy wipe)
   ========================================================= */
(() => {
  const SITE_ROOT = new URL(".", document.currentScript.src).href; // site root, even from /memory/
  const root = document.documentElement;
  // The light version: plain pages, no motion, no WebGL, no music. Chosen from the Z screen (?lite),
  // or taken automatically on a very slow connection / Data Saver. Remembered until ?full.
  const lite = (() => {
    try {
      const q = new URLSearchParams(location.search);
      if (q.has("full")) localStorage.setItem("jrp-lite", "0");
      if (q.has("lite")) localStorage.setItem("jrp-lite", "1");
      const pick = localStorage.getItem("jrp-lite");
      if (pick) return pick === "1";
    } catch (e) {}
    const c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g$/.test(c.effectiveType || "")));
  })();
  const reduceMotion = lite || matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) root.classList.add("no-motion");
  if (lite) root.classList.add("is-lite");

  /* ---------------- Loader + signature logo (run on phones too) ---------------- */
  // the ball lens' current strength, shared by the pictures' mesh and the text (see setupBallLens)
  const BALL = { value: 0.03, rest: 0.03, scroll: 0.07 };
  let arrivedTorn = false;          // came in through a hold-to-open tear (setupLoader)
  let throughGate = false;          // came in by drawing the Z: the water window already revealed the hero
  // Some pieces (the gate's water shaders) are defined further down this file; anything that can
  // fire early (the loader finishing on a fast, cached load) waits until the whole script has run
  let scriptReady = false;
  const afterScript = [];
  const whenReady = (fn) => (scriptReady ? fn() : afterScript.push(fn));
  if (lite) {
    const chip = document.createElement("a");
    chip.className = "lite-chip";
    chip.href = "?full";
    chip.innerHTML = "Light version <span>Switch to full site</span>";
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(chip));
    if (document.body) document.body.appendChild(chip);
  }
  const loaderDone = setupLoader(); // resolves as the loader starts lifting away
  window.siteReady = loaderDone;    // page scripts (e.g. the memory game) can wait on it
  setupSignature();
  const navbar = setupNavbar();     // fixed nav (runs on phones too: the memory game is playable there)

  /* ---------------- Phones: desktop note only ---------------- */
  const phone = matchMedia("(max-width: 767px)");
  if (phone.matches) {
    // Nothing heavy has loaded yet, so a reload is the cleanest way into the full site
    phone.addEventListener("change", (e) => { if (!e.matches) location.reload(); });
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    // No scrolling behind the loader
    lenis.stop();
    loaderDone.then(() => lenis.start());
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id === "#") return e.preventDefault();
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { duration: 1.4, offset: -(navbar.compactHeight() + 24) });
      else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ---------------- Liquid stage (Three.js) ---------------- */
  let Liquid = null; // created at the end, once the shader sources below are defined

  /* ---------------- Carousels ---------------- */
  setupCarousel();
  document.querySelectorAll(".track").forEach(setupDragScroll);
  const cursor = { pill: false }; // shared: the trail hides while the pill replaces the pointer
  setupBallLens();
  setupCursorPill();
  setupCardLinks();
  setupProjectModals();
  setupCursorTrail();
  setupSound();
  // The full-page SVG lens (setupPageLens) re-filtered the whole screen on every scroll frame and was the
  // main cause of lag, so it is no longer started. The WebGL fish-eye stays off too (it bowed full-bleed photos).
  const pageLensOn = false;
  setupAutoScroll(document.querySelector(".track--quotes"));
  setupTrackJelly(document.querySelector("[data-carousel]"), ".ai-card__title, .ai-card > p");

  /* ---------------- Motion (starts as the loader lifts) ---------------- */
  Promise.all([document.fonts.ready, loaderDone]).then(() => {
    setupFooter();      // time + back-to-top always; its motion only when allowed
    if (reduceMotion) {
      Liquid && Liquid.revealAll();
      return;
    }
    const intro = introTimeline();
    if (throughGate) intro.progress(1);   // the window opened onto a settled hero; replaying its entrance read as a flicker
    readingProgress();  // how much of the page has been read, quietly on the right
    horizontalWorks();  // before setupStories: the case studies slide in sideways
    setupStories();     // before scrollReveals: story elements opt out of the generic fade-up
    setupAboutTrail();  // photos follow the cursor across About
    heroParallax();     // the hero's words part into layers as you scroll and move
    setupLiquidNav();   // homepage → case study liquid transition
    liquidHeadings();   // before scrollReveals: headings opt out of the generic fade-up
    scrollReveals();
    liquidPixels();
    liquidTitleExit();
    heroKinetics();
    setupMarquee();
    scrollLean();
    ScrollTrigger.refresh();
    if (arrivedTorn) settleEntrances();
  });

  // After a tear the page was already seen, settled, through the rip: so the first screen's entrances
  // finish at once instead of playing again. Scrubbed effects and endless loops are left alone.
  function settleEntrances() {
    const fold = window.scrollY + innerHeight;
    gsap.globalTimeline.getChildren(false, true, true).forEach((a) => {
      if (a.repeat && a.repeat() === -1) return;
      const st = a.scrollTrigger;
      if (st && (st.vars.scrub || st.start > fold)) return;
      a.progress(1);
    });
  }

  // Lazy images grow the page as they arrive; keep trigger positions in sync
  const refreshSoon = gsap.delayedCall(0.2, () => ScrollTrigger.refresh()).pause();
  document.querySelectorAll('img[loading="lazy"]').forEach((img) => {
    if (!img.complete) img.addEventListener("load", () => refreshSoon.restart(true), { once: true });
  });

  /* =========================================================
     Signature: the "Jithin" logo writes itself stroke by stroke,
     then the ink fills in. Hovering writes it again.
     ========================================================= */
  function setupSignature() {
    const tpl = document.getElementById("signature-template");
    if (!tpl) return;

    document.querySelectorAll(".nav__brand:not(.nav__brand--ghost)").forEach((brand) => {
      const svg = tpl.content.firstElementChild.cloneNode(true);
      if (!brand.hasAttribute("aria-label")) brand.setAttribute("aria-label", "Jithin");
      brand.textContent = "";
      brand.appendChild(svg);
      if (reduceMotion) return;

      const ink = svg.querySelector(".signature__ink");
      const paths = [...svg.querySelectorAll(".signature__pen path")];
      const lengths = paths.map((p) => p.getTotalLength());
      const total = lengths.reduce((a, b) => a + b, 0);
      const WRITE = 1.9; // seconds for the whole signature at 1x

      const tl = gsap.timeline({ paused: true });
      tl.set(ink, { opacity: 0 }, 0).set(paths, { opacity: 1 }, 0);
      let at = 0;
      paths.forEach((p, i) => {
        const d = (WRITE * lengths[i]) / total;
        tl.fromTo(p,
          { strokeDasharray: lengths[i], strokeDashoffset: lengths[i] },
          { strokeDashoffset: 0, duration: d, ease: "power1.inOut" },
          at);
        at += d * 0.82; // next stroke starts just before the pen lifts
      });
      // ink floods in, then the pen outline dissolves into it
      tl.to(ink, { opacity: 1, duration: 0.5, ease: "power2.out" }, ">-0.25")
        .to(paths, { opacity: 0, duration: 0.4 }, "<0.2");

      gsap.set(ink, { opacity: 0 });
      gsap.set(paths, { strokeDasharray: (i) => lengths[i], strokeDashoffset: (i) => lengths[i] });
      loaderDone.then(() => gsap.delayedCall(0.25, () => tl.play()));

      brand.addEventListener("pointerenter", () => {
        if (!tl.isActive()) tl.timeScale(1.5).restart();
      });
    });
  }

  /* =========================================================
     Fixed navbar: toggles a compact, frosted state once the page has
     scrolled, and sizes the spacer to the navbar's resting height so the
     layout below never shifts.
     ========================================================= */
  function setupNavbar() {
    const bar = document.querySelector(".navbar");
    const spacer = document.querySelector(".navbar-spacer");
    if (!bar) return { compactHeight: () => 0 };
    let scrolled = false;
    const measure = () => {
      const was = bar.classList.contains("is-scrolled");
      bar.style.transition = "none";
      bar.classList.remove("is-scrolled");
      if (spacer) spacer.style.height = bar.offsetHeight + "px";
      bar.classList.toggle("is-scrolled", was);
      void bar.offsetHeight; // flush before restoring the transition
      bar.style.transition = "";
    };
    const update = () => {
      const next = window.scrollY > 12;
      if (next === scrolled) return;
      scrolled = next;
      bar.classList.toggle("is-scrolled", scrolled);
    };
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure);
    return {
      // height once compacted (for anchor offsets): 16px top + nav row + 16px bottom
      compactHeight: () => 32 + (bar.querySelector(".nav") || bar).offsetHeight,
    };
  }

  /* =========================================================
     Loader: the signature fills left→right over a grey ghost as the
     page's fonts and above-the-fold images arrive, then the sheet
     lifts away with a liquid bottom edge. A minimum write time keeps
     the signature legible (shorter on later pages in the session).
     ========================================================= */
  function setupLoader() {
    const el = document.querySelector(".loader");
    const tpl = document.getElementById("signature-template");
    if (lite) {                                                          // the light version opens at once
      if (el) el.remove();
      root.classList.remove("is-loading");
      return Promise.resolve();
    }
    if (!el || !tpl || !window.gsap) {
      if (el) el.remove();
      return Promise.resolve();
    }
    // Arriving through a liquid page transition: open on the same frame instead of the loader
    let arrive = null;
    // the page waiting behind a hold-to-open card is loaded with ?behind: it opens settled and leaves
    // the hand-off flag alone (the real page after the tear needs it)
    if (/[?&]behind\b/.test(location.search)) arrive = { kind: "tear" };
    else try { arrive = JSON.parse(sessionStorage.getItem("jrp-arrive") || "null"); sessionStorage.removeItem("jrp-arrive"); } catch (e) {}
    if (arrive && arrive.kind === "tear") {                              // came through a tear: straight in, already settled
      document.documentElement.classList.remove("is-torn");
      arrivedTorn = window.jrpArrivedTorn = true;                       // case-study-page.js reads this too
      el.remove();
      return Promise.resolve();
    }
    if (arrive && arrive.kind === "cover" && !reduceMotion && !matchMedia("(max-width: 767px)").matches) {
      const release = () => {               // never leave the page covered
        document.documentElement.classList.remove("is-arriving");
        root.classList.remove("is-loading");
        el.remove();
      };
      try {
        // watchdog: if the sheet hasn't started lifting within 6s for any reason, release the page
        return Promise.race([
          arriveFrom(arrive, el),
          new Promise((r) => setTimeout(() => { if (el.isConnected && !el.dataset.lifting) release(); r(); }, 6000)),
        ]);
      } catch (err) {
        release();
        return Promise.resolve();
      }
    }
    root.classList.add("is-loading");

    const box = el.querySelector(".loader__sig");
    const ghost = tpl.content.firstElementChild.cloneNode(true);
    const fill = tpl.content.firstElementChild.cloneNode(true);
    ghost.classList.add("loader__ghost");
    fill.classList.add("loader__fill");
    box.append(ghost, fill);

    let seen = false;
    try { seen = sessionStorage.getItem("jrp-loaded") === "1"; sessionStorage.setItem("jrp-loaded", "1"); } catch (e) {}
    const MIN_WRITE = reduceMotion ? 0 : seen ? 0.7 : 1.8; // seconds
    const MAX_WAIT = 8000; // never hold the page longer than this

    // What "loaded" means: webfonts + every image that isn't lazy
    const imgs = [...document.images].filter((img) => img.loading !== "lazy");
    const tasks = [
      document.fonts.ready,
      ...imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((r) => {
        img.addEventListener("load", r, { once: true });
        img.addEventListener("error", r, { once: true });
      }))),
    ];
    let done = 0, ready = 0;
    // Progress only moves forward: after the MAX_WAIT cut-off, late images must not pull it back
    tasks.forEach((t) => t.then(() => { done++; ready = Math.max(ready, done / tasks.length); }));
    setTimeout(() => (ready = 1), Math.max(0, MAX_WAIT - performance.now())); // measured from navigation start

    return new Promise((resolve) => {
      const start = performance.now();
      let shown = 0;
      const tick = () => {
        const byTime = MIN_WRITE ? Math.min(1, (performance.now() - start) / 1000 / MIN_WRITE) : 1;
        const target = Math.min(ready, byTime);
        shown += (target - shown) * 0.12;
        if (target === 1 && shown > 0.995) shown = 1;
        fill.style.setProperty("--p", (shown * 100).toFixed(2) + "%");
        if (shown < 1) return;

        gsap.ticker.remove(tick);
        // a fresh arrival on a desktop (a reload, or coming in from outside): the visitor draws their way in
        if (freshVisit() && !reduceMotion && matchMedia("(hover: hover) and (pointer: fine)").matches) {
          whenReady(() => holdToEnter(el, box, () => { throughGate = true; root.classList.remove("is-loading"); resolve(); }));
          return;
        }
        const exit = gsap.timeline({ delay: reduceMotion ? 0 : 0.25, onComplete: () => el.remove() });
        exit.call(() => { root.classList.remove("is-loading"); resolve(); }, null, reduceMotion ? 0 : 0.35);
        if (reduceMotion) return;
        exit.to(box, { y: -24, opacity: 0, duration: 0.6, ease: "power3.in" }, 0)
          .to(el, {
            yPercent: -100,
            borderBottomLeftRadius: "50% 18vh",
            borderBottomRightRadius: "50% 18vh",
            duration: 1.1,
            ease: "expo.inOut",
          }, 0.15);
      };
      gsap.ticker.add(tick);
    });
  }

  /* =========================================================
     Page transition (homepage → case study), one continuous motion:
     leaving, a dark sheet rises from the bottom (its curved top edge flattening
     as it lands) while the page drifts back, and a counter starts from 000; the
     case study opens on that same sheet at the same number (painted before any
     script runs, see the <head> of the case study pages), counts on to 100 as
     the page gets ready, then the sheet carries on upward with the loader's
     curved edge, revealing the page as its intro plays.
     ========================================================= */
  // Declared as functions (hoisted): the loader runs before this part of the script is reached
  function coverEdge() { return "50% 16vh"; }
  function pad3(n) { return String(Math.round(n)).padStart(3, "0"); }
  function coverWords() {
    return ["Pouring..", "Brewing..", "Steeping..", "Stirring..", "Simmering..", "Distilling..", "Percolating..", "Rippling..", "Condensing..", "Melting.."];
  }
  function coverCount(n) {
    const t = document.createElement("p");
    t.className = "page-cover__count";
    t.textContent = pad3(n);
    return t;
  }
  function coverWord(i) {
    const t = document.createElement("p");
    t.className = "page-cover__word";
    t.textContent = coverWords()[i % coverWords().length];
    return t;
  }
  // Cycle the centre word: the current one rises out as the next rises in. Returns { index(), stop() }
  function cycleWords(el, start) {
    const words = coverWords();
    let i = start % words.length;
    const id = setInterval(() => {
      gsap.to(el, { yPercent: -35, opacity: 0, duration: 0.22, ease: "power2.in", onComplete: () => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        gsap.fromTo(el, { yPercent: 35, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.32, ease: "power3.out" });
      } });
    }, 820);
    return { index: () => i, stop: () => clearInterval(id) };
  }

  // The gate greets every fresh arrival: a reload, a typed address, a link from elsewhere. Moving
  // between the site's own pages (links, the case study burst, back / forward) goes straight in.
  /* =========================================================
     Bubble burst mist: as the film tears open from the pointer, its rim sheds a fine spray, tiny
     specks thrown off the edge that trail behind it and are gone in a moment. The rupture front
     follows the bubble's own (uPop over `dur` seconds, power1.out, to the farthest corner).
     ========================================================= */
  function burstMist(ox, oy, colors, dur) {
    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    const W = innerWidth, H = innerHeight;
    const cv = document.createElement("canvas");
    cv.className = "burst-mist";
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    document.body.appendChild(cv);
    const cx = cv.getContext("2d");
    cx.scale(DPR, DPR);
    const pal = (colors || []).map((h) => { const n = parseInt(String(h).replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.7)); });
    if (!pal.length) pal.push([60, 60, 60]);
    const far = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
    const rand = (a, b) => a + Math.random() * (b - a);
    const ps = [];
    let t = 0, last = performance.now(), lastFront = 0;
    const tick = () => {
      const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
      last = now; t += dt;
      // the torn edge: where it is, and how fast it is running out
      // the shader's rupture: radius uPop * 2.6 screen heights, uPop eased power1.out over dur
      const k = Math.min(1, t / dur), front = 2.6 * H * (1 - (1 - k) * (1 - k)), speed = (2 * 2.6 * H * (1 - k)) / dur;
      if (front < far) {
        // shed across the band the edge swept since the last frame, densest just behind it
        const r0 = lastFront, r1 = Math.min(front, far);
        const n = Math.min(1600, Math.round(Math.PI * (r1 * r1 - r0 * r0) * 0.009) + 8);
        lastFront = r1;
        for (let i = 0; i < n; i++) {
          const a = rand(0, Math.PI * 2);
          const rr = Math.sqrt(rand(r0 * r0, r1 * r1));
          const c = pal[(Math.random() * pal.length) | 0];
          const out = speed * rand(0.35, 0.8);                              // thrown with the edge but slower: the spray trails just behind it
          const x = ox + Math.cos(a) * rr, y = oy + Math.sin(a) * rr;
          if (x < -20 || y < -20 || x > W + 20 || y > H + 20) continue;    // that part of the edge is off screen
          ps.push({ x, y, vx: Math.cos(a) * out + rand(-40, 40), vy: Math.sin(a) * out + rand(-40, 40),
            life: rand(0.1, 0.3), age: 0, r: rand(0.7, 1.8), c, w: Math.random() < 0.2 });
        }
      }
      cx.clearRect(0, 0, W, H);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.age += dt;
        if (p.age >= p.life) { ps.splice(i, 1); continue; }
        const d = Math.exp(-7 * dt);                                    // air stops it quickly
        p.vx *= d; p.vy = p.vy * d + 240 * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        const al = 1 - Math.pow(p.age / p.life, 1.6);
        cx.fillStyle = p.w ? `rgba(255,255,255,${al})` : `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al})`;
        const v = Math.hypot(p.vx, p.vy);
        if (v > 600) {                                                    // the fastest blur into the shortest streaks
          cx.strokeStyle = cx.fillStyle; cx.lineWidth = p.r * 0.85;
          cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(p.x - (p.vx / v) * Math.min(5, v * 0.003), p.y - (p.vy / v) * Math.min(5, v * 0.003)); cx.stroke();
        } else cx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      }
      if (front >= far && !ps.length) { gsap.ticker.remove(tick); cv.remove(); }
    };
    gsap.ticker.add(tick);
  }

  /* =========================================================
     After a burst, the case study already open beneath it (the iframe loaded behind the card) is
     promoted to be the page instead of navigating to it: nothing reloads, nothing plays again.
     The address bar moves to the case study; Back (or any link inside it) is a normal navigation.
     ========================================================= */
  const HOME_TITLE = document.title;
  function promote(frame, href, onBack) {
    let doc = null;
    try { doc = frame && frame.contentDocument; } catch (e) {}
    if (!doc || doc.readyState === "loading" || !frame.classList.contains("is-shown")) return false;   // not ready: navigate as usual
    try {
      frame.classList.add("is-page");
      frame.removeAttribute("aria-hidden");
      frame.tabIndex = 0;
      document.title = doc.title;
      const homePath = location.pathname;
      history.pushState({ jrpPromoted: true }, "", href);
      // Back: the burst plays in reverse (onBack); anything else in history loads normally
      const onPop = () => {
        removeEventListener("popstate", onPop);
        if (location.pathname === homePath && onBack) onBack();
        else location.reload();
      };
      addEventListener("popstate", onPop);
      // links inside the case study leave the frame and navigate the window itself
      doc.addEventListener("click", (e) => {
        const a = e.target.closest && e.target.closest("a[href]");
        if (!a || a.target === "_blank" || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        const raw = a.getAttribute("href") || "";
        if (raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) return;
        e.preventDefault();
        const toHome = a.origin === location.origin && !a.hash && (a.pathname === homePath || a.pathname === "/" || /\/index\.html$/.test(a.pathname));
        if (toHome && document.documentElement.classList.contains("is-promoted")) history.back();   // the way it came, backwards
        else location.href = a.href;
      }, true);
      frame.focus({ preventScroll: true });
      frame.contentWindow.focus();
      // the homepage underneath stops: no scrolling, and its motion sleeps once the spray has settled
      if (lenis) lenis.stop();
      document.documentElement.classList.add("is-promoted");
      setTimeout(() => gsap.ticker.sleep(), 900);
      return true;
    } catch (e) { return false; }
  }

  /* =========================================================
     Pool light: the net of light a moving surface throws on a pool floor, laid over the "Draw a Z"
     screen, so the sheet reads as shallow water. Multiplied onto the page:
     the bright lines leave it untouched, the cells between them shade it very slightly. A small
     WebGL canvas (half resolution, ~30 fps) stretched over the screen.
     ========================================================= */
  const lowEndDevice = () => (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  function poolLight(host) {
    if (reduceMotion || lowEndDevice()) return;
    const cv = document.createElement("canvas");
    cv.className = "pool-light";
    cv.setAttribute("aria-hidden", "true");
    const gl = cv.getContext("webgl", { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    host.appendChild(cv);
    const vs = "attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
    const fs = `precision mediump float;
      uniform float t; uniform vec2 res; uniform float amt; varying vec2 v;
      float caustic(vec2 uv, float tt){
        vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
        vec2 i = p; float c = 1.0;
        for (int n = 0; n < 3; n++) {
          float t2 = tt * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(t2 - i.x) + sin(t2 + i.y), sin(t2 - i.y) + cos(t2 + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + t2) / 0.005), p.y / (cos(i.y + t2) / 0.005)));
        }
        c /= 3.0; c = 1.17 - pow(c, 1.4);
        return clamp(pow(abs(c), 8.0), 0.0, 1.0);
      }
      void main(){
        vec2 uv = v * vec2(res.x / res.y, 1.0) * 1.15;
        // two nets drifting through each other, as real ripples do
        float c = max(caustic(uv, t * 0.21), 0.75 * caustic(uv * 1.37 + vec2(3.1, 1.7), t * 0.17 + 9.0));
        float shade = pow(1.0 - c, 2.0) * amt;                            // only the deep cells shade; the page stays white
        gl_FragColor = vec4(vec3(1.0 - shade), 1.0);
      }`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { cv.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(prog, "t"), uRes = gl.getUniformLocation(prog, "res"), uAmt = gl.getUniformLocation(prog, "amt");
    const size = () => {
      cv.width = Math.round(innerWidth * 0.5); cv.height = Math.round(innerHeight * 0.5);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(uRes, innerWidth, innerHeight);
    };
    size();
    addEventListener("resize", size);
    let acc = 0;
    const tick = (time, dt) => {
      if (!cv.isConnected) { gsap.ticker.remove(tick); removeEventListener("resize", size); return; }   // gone with the gate
      acc += dt;
      if (acc < 33 || document.hidden) return;                           // ~30 fps is enough for light on a pool floor
      acc = 0;
      gl.uniform1f(uT, time);
      gl.uniform1f(uAmt, 0.07);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    gsap.ticker.add(tick);
    gsap.fromTo(cv, { opacity: 0 }, { opacity: 1, duration: 1.4, delay: 0.4, ease: "power2.out" });
  }

  /* =========================================================
     Project modals (Gen AI cards with data-modal-open="id"): the story behind a project, over the
     page. Opens with a short rise, closes on the button, Esc or the backdrop; scrolling and focus stay
     inside while it's open. The gallery fills itself from a folder: 01–NN in .webp, .jpg or .png
     (whatever exists), so images can be dropped in without touching the markup.
     ========================================================= */
  function setupProjectModals() {
    const openers = document.querySelectorAll("[data-modal-open]");
    if (!openers.length) return;
    let current = null, lastFocus = null;

    function fillGallery(modal) {
      const g = modal.querySelector("[data-modal-gallery]");
      if (!g || g.dataset.filled) return;
      g.dataset.filled = "1";
      const base = g.dataset.modalGallery, n = +g.dataset.count || 8;
      for (let i = 1; i <= n; i++) {
        const name = String(i).padStart(2, "0");
        const img = new Image();
        img.loading = "lazy";
        img.alt = "";
        const exts = ["webp", "jpg", "png", "jpeg"];
        let k = 0;
        img.onerror = () => { k += 1; if (k < exts.length) img.src = `${base}${name}.${exts[k]}`; else img.remove(); };
        img.src = `${base}${name}.${exts[0]}`;
        g.appendChild(img);
      }
    }
    function open(id, from) {
      const modal = document.getElementById(id);
      if (!modal || current) return;
      current = modal; lastFocus = from || document.activeElement;
      fillGallery(modal);
      modal.hidden = false;
      root.classList.add("is-modal");
      if (lenis) lenis.stop();
      const panel = modal.querySelector(".pmodal__panel");
      const vid = modal.querySelector("video");
      if (vid) vid.play().catch(() => {});
      if (!reduceMotion) {
        gsap.fromTo(modal.querySelector(".pmodal__backdrop"), { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
        gsap.fromTo(panel, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
      }
      panel.scrollTop = 0;
      panel.focus({ preventScroll: true });
    }
    function close() {
      if (!current) return;
      const modal = current;
      current = null;
      const done = () => {
        modal.hidden = true;
        root.classList.remove("is-modal");
        if (lenis) lenis.start();
        const vid = modal.querySelector("video");
        if (vid) vid.pause();
        if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
      };
      if (reduceMotion) return done();
      gsap.to(modal.querySelector(".pmodal__backdrop"), { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(modal.querySelector(".pmodal__panel"), { y: 30, opacity: 0, duration: 0.3, ease: "power2.in", onComplete: done });
    }
    openers.forEach((el) => el.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      const track = el.closest("[data-carousel]");
      if (track && track.classList.contains("is-dragging")) return;          // a drag, not a click
      e.preventDefault();
      open(el.dataset.modalOpen, el);
    }));
    document.querySelectorAll("[data-modal-close]").forEach((el) => el.addEventListener("click", close));
    addEventListener("keydown", (e) => {
      if (!current) return;
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab") return;                                          // keep focus inside the modal
      const f = [...current.querySelectorAll("button, a[href], video[controls], [tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function freshVisit() {
    try {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav && nav.type === "reload") return true;
      if (nav && nav.type === "back_forward") return false;
      return !document.referrer || new URL(document.referrer).origin !== location.origin;
    } catch (e) { return true; }
  }

  /* Draw a Z on the water to enter. The sheet is water (loaderWater): the pointer drags ink through
     it, leaving a wake; a dashed Z under the signature fills stroke by stroke as the gesture is
     read (across, down-left, across: a scribble won't do). Lift off early and the ink dissolves.
     Drawn, the water opens at the heart of the Z: a window with a soft meniscus that widens, rings
     running out across the sheet, until it fills the screen and the page drops into place.
     Enter / Space draws it for you. */
  function holdToEnter(el, box, enter) {
    const hint = document.createElement("div");
    hint.className = "loader__hint";
    hint.innerHTML = 'Draw a Z on the water<span>or press Enter</span>';
    el.appendChild(hint);
    const liteLink = document.createElement("a");
    liteLink.className = "loader__lite";
    liteLink.href = "?lite";
    liteLink.textContent = "Slow connection? Open the light version";
    el.appendChild(liteLink);
    gsap.fromTo(liteLink, { opacity: 0 }, { opacity: 1, duration: 0.9, delay: 1.4, ease: "power2.out" });
    // the water takes every press for drawing; this one is a link
    liteLink.addEventListener("pointerdown", (e) => e.stopPropagation());
    liteLink.addEventListener("click", (e) => { e.preventDefault(); location.href = liteLink.href; });
    // the signature has done its job as the loader: it fades away, then the Z and the prompt appear
    gsap.to(box, { opacity: 0, y: -12, duration: 0.7, ease: "power2.inOut" });
    gsap.fromTo(hint, { opacity: 0, y: 8 }, { opacity: 0.55, y: 0, duration: 0.9, delay: 0.9, ease: "power3.out" });

    // guide: a dashed Z that fills as each stroke is recognised
    const NS = "http://www.w3.org/2000/svg";
    const guide = document.createElementNS(NS, "svg");
    guide.setAttribute("class", "loader__guide");
    guide.setAttribute("viewBox", "-100 -70 200 140");
    const zd = "M-80 -55 L80 -55 L-80 55 L80 55";
    // a watermark under the water: a broad, soft shadow of a Z, wavering as the surface moves over it
    guide.innerHTML = `<defs><filter id="zwater" x="-30%" y="-40%" width="160%" height="180%">` +
      `<feTurbulence type="fractalNoise" baseFrequency="0.018 0.045" numOctaves="2" seed="4" result="n">` +
      `<animate attributeName="baseFrequency" dur="7s" values="0.018 0.045;0.024 0.055;0.018 0.045" repeatCount="indefinite"/></feTurbulence>` +
      `<feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G"/>` +
      `<feGaussianBlur stdDeviation="2.4"/></filter></defs>` +
      `<g filter="url(#zwater)"><path class="loader__guide-track" d="${zd}"/><path class="loader__guide-fill" d="${zd}" pathLength="1"/></g>`;
    el.appendChild(guide);
    const fillP = guide.querySelector(".loader__guide-fill");
    gsap.fromTo(guide, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 1.3, delay: 0.6, ease: "power3.out" });

    const water = loaderWater(el, box, hint, { signature: false });
    poolLight(el);                                                       // light moving across the water while you write
    const st = { p: 0, shown: 0, R: 0 };
    const pondS = { s: 0, t: 0, held: false };                           // the pond ripple under the Z (see LOADER_WATER_FRAG)
    let drawing = false, done = false, pts = [], dist = 0, lastDrop = 0, auto = null;
    let phase = 0, run = 0, cx = innerWidth / 2, cy = innerHeight / 2, lastRing = 0;
    // a Z: across (right), the diagonal (down-left), across again (right). Each needs a real run.
    const PHASES = [{ ang: 0, need: 70 }, { ang: (3 * Math.PI) / 4, need: 90 }, { ang: 0, need: 70 }];

    let flat = null;
    if (!water) {
      flat = document.createElement("canvas");
      flat.className = "loader__water";
      flat.width = innerWidth; flat.height = innerHeight;
      el.prepend(flat);
    }
    const ink = (a, b, w) => {
      if (water) water.ink(a[0], a[1], b[0], b[1], w);
      else { const c = flat.getContext("2d"); c.lineCap = "round"; c.lineWidth = w; c.strokeStyle = "#000"; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    };

    const draw = () => {
      st.shown += (st.p - st.shown) * 0.2;
      // writing the Z stirs the pond: the rings build with each stroke and calm when the pen lifts
      pondS.t += gsap.ticker.deltaRatio(60) / 60;
      if (!pondS.held) { pondS.s += (0.35 * st.shown - pondS.s) * 0.06; if (pondS.s < 0.01) pondS.t = 0; }
      if (water) water.pond(cx, cy, pondS.t, pondS.s);
      fillP.style.strokeDashoffset = (1 - st.shown).toFixed(4);
      const R = st.R;
      el.style.webkitMaskImage = el.style.maskImage = R > 0.5
        ? `radial-gradient(circle at ${cx}px ${cy}px, transparent ${R.toFixed(1)}px, #000 ${(R + 1.2).toFixed(1)}px)` : "none";
      // while it opens, rings keep running out from the window's edge
      const now = performance.now();
      if (water && R > 1 && now - lastRing > 120) { lastRing = now; for (let k = 0; k < 6; k++) { const a = Math.random() * Math.PI * 2; water.drop(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8), 22, 0.07); } }
      if (water) water.update(0, cx, cy, R, 1);
    };
    gsap.ticker.add(draw);

    const begin = (x, y) => {
      if (done) return;
      drawing = true;
      pts = [[x, y]]; dist = 0; phase = 0; run = 0; st.p = 0;
      if (water) water.drop(x, y, 20, 0.35);                             // the touch
      gsap.to(hint, { opacity: 0.35, duration: 0.4, overwrite: "auto" });
    };
    const move = (x, y) => {
      if (!drawing || done) return;
      const last = pts[pts.length - 1];
      const dx = x - last[0], dy = y - last[1], len = Math.hypot(dx, dy);
      if (len < 4) return;
      pts.push([x, y]);
      dist += len;
      ink(last, [x, y], 9);
      if (water && dist - lastDrop > 26) { lastDrop = dist; water.drop(x, y, 22, 0.05); }   // the wake
      // read the gesture: progress along the current stroke's direction; the next stroke takes over
      const ph = PHASES[phase];
      let diff = Math.atan2(dy, dx) - ph.ang;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      if (Math.abs(diff) < 0.6) run += len * Math.cos(diff);
      else if (run >= ph.need && phase < 2) {
        const nx = PHASES[phase + 1];
        let d2 = Math.atan2(dy, dx) - nx.ang;
        while (d2 > Math.PI) d2 -= Math.PI * 2;
        while (d2 < -Math.PI) d2 += Math.PI * 2;
        if (Math.abs(d2) < 0.6) { phase++; run = len * Math.cos(d2); }
      }
      st.p = Math.min(1, (phase + Math.min(1, run / PHASES[phase].need)) / 3);
      if (phase === 2 && run >= PHASES[2].need) open();
    };
    const end = () => {
      if (!drawing || done) return;
      drawing = false;
      st.p = 0;                                                          // let it go: the Z empties, the ink dissolves
      gsap.to(hint, { opacity: 1, duration: 0.6, overwrite: "auto" });
    };

    function open() {
      done = true; drawing = false;
      cleanup();
      st.p = 1;
      // the window opens at the heart of the Z
      cx = pts.reduce((n, p) => n + p[0], 0) / pts.length;
      cy = pts.reduce((n, p) => n + p[1], 0) / pts.length;
      if (water) water.drop(cx, cy, 60, 0.22);                          // broad and soft: a sharp drop on the ink read as a glitch
      const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) + 40;
      gsap.to([hint, guide], { opacity: 0, duration: 0.35, overwrite: "auto" });
      pondS.held = true;                                                 // the finished Z sends the pond into full rings
      pondS.t = 0;                                                       // the rings set off from the Z now
      gsap.timeline().to(pondS, { s: 1, duration: 0.3, ease: "power2.out" }).to(pondS, { s: 0, duration: 2.2, ease: "power2.inOut" }, 0.5);
      gsap.timeline({ onComplete: () => { gsap.ticker.remove(draw); if (water) water.dispose(); el.remove(); } })
        .to(box, { opacity: 0, duration: 0.5, ease: "power2.in" }, 0)
        .call(() => {
          enter();
          if (Liquid && Liquid.splash) Liquid.splash(cx, cy, 90, 0.06);
          const site = document.querySelector(".site");
          if (site) gsap.fromTo(site, { scale: 1.06, transformOrigin: `${cx}px ${cy}px` }, { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "transform,transformOrigin" });
        }, null, 0.25)
        .fromTo(st, { R: 1 }, { R: far, duration: 0.95, ease: "power1.inOut" }, 0);                  // the window opens straight out to the edges
    }

    // Enter / Space: the Z draws itself over the guide
    const drawForMe = () => {
      if (done || auto) return;
      const g = guide.getBoundingClientRect();
      const sx = g.width / 200, sy = g.height / 140, ox = g.left + g.width / 2, oy = g.top + g.height / 2;
      const P = [[-80, -55], [80, -55], [-80, 55], [80, 55]].map(([x, y]) => [ox + x * sx, oy + y * sy]);
      const segs = [0, 1, 2].map((i) => Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]));
      const total = segs.reduce((a, b) => a + b, 0);
      const at = (t) => { let d = t * total; for (let i = 0; i < 3; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k]; } d -= segs[i]; } return P[3]; };
      const o = { t: 0 };
      begin(P[0][0], P[0][1]);
      auto = gsap.to(o, { t: 1, duration: 1.1, ease: "power1.inOut", onUpdate: () => { const q = at(o.t); move(q[0], q[1]); } });
    };

    const onDown = (e) => { if (e.button === 0) { e.preventDefault(); el.setPointerCapture(e.pointerId); begin(e.clientX, e.clientY); } };
    const onMove = (e) => { if (drawing && !auto) (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach((c) => move(c.clientX, c.clientY)); };
    const onUp = () => { if (!auto) end(); };
    const onKey = (e) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { e.preventDefault(); drawForMe(); } };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    window.addEventListener("keydown", onKey);
    function cleanup() {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      window.removeEventListener("keydown", onKey);
    }
  }

  /* The loader's water: a full-screen wave simulation (same physics as the page's, but losing
     very little energy, so rings cross the whole screen and reflect off its edges) drawn over
     a picture of the sheet itself (white and the signature), which it refracts; the slopes are lit
     from the top left. Returns null without WebGL2 (the sheet then stays still). */
  function loaderWater(el, box, hint, how = {}) {
    if (!window.THREE) return null;
    const cv = document.createElement("canvas");
    cv.className = "loader__water";
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, premultipliedAlpha: true }); } catch (e) { return null; }
    const gl = renderer.getContext();
    if (!renderer.capabilities.isWebGL2 || (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float"))) { renderer.dispose(); return null; }
    let W = innerWidth, H = innerHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(W, H, false);

    const SW = 384, SH = Math.max(2, Math.round(SW * H / W));
    const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
    let rtA = new THREE.WebGLRenderTarget(SW, SH, opts), rtB = new THREE.WebGLRenderTarget(SW, SH, opts);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.PlaneGeometry(2, 2);
    const simU = {
      uPrev: { value: null }, uTexel: { value: new THREE.Vector2(1 / SW, 1 / SH) },
      uDrop: { value: new THREE.Vector4() }, uRect: { value: new THREE.Vector4() },
      uRectAmt: { value: 0 }, uShift: { value: 0 }, uAspect: { value: W / H }, uDamp: { value: 0.9978 },
    };
    const simScene = new THREE.Scene();
    simScene.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: simU, vertexShader: SIM_VERT, fragmentShader: SIM_FRAG })));

    // a picture of the sheet, for the water to bend (drawn once the signature has finished writing)
    const pic = document.createElement("canvas");
    const pr = renderer.getPixelRatio();
    pic.width = W * pr; pic.height = H * pr;
    const px = pic.getContext("2d");
    px.scale(pr, pr);
    px.fillStyle = "#fff"; px.fillRect(0, 0, W, H);
    const content = new THREE.CanvasTexture(pic);
    content.minFilter = THREE.LinearFilter;

    // ink: drawn at half size, dissolving a little every frame
    const inkCv = document.createElement("canvas");
    inkCv.width = Math.round(W / 2); inkCv.height = Math.round(H / 2);
    const ik = inkCv.getContext("2d");
    ik.scale(0.5, 0.5);
    ik.lineCap = ik.lineJoin = "round";
    const inkTex = new THREE.CanvasTexture(inkCv);
    inkTex.minFilter = THREE.LinearFilter;
    let inkLive = 0;
    const viewU = {
      uWater: { value: rtA.texture }, uContent: { value: content }, uTexel: simU.uTexel,
      uSink: { value: 0 }, uHole: { value: new THREE.Vector4() }, uRes: { value: new THREE.Vector2(W, H) },
      uInk: { value: inkTex }, uSwirl: { value: new THREE.Vector4() }, uPond: { value: new THREE.Vector4() },
    };
    const viewScene = new THREE.Scene();
    viewScene.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({ uniforms: viewU, vertexShader: SIM_VERT, fragmentShader: LOADER_WATER_FRAG })));

    [rtA, rtB].forEach((rt) => { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); });
    renderer.setRenderTarget(null);

    // swap the live signature for its picture only once the picture is ready
    let ready = false;
    (async () => {
      try {
        const sig = how.signature === false ? null : box.querySelector(".loader__fill") || box.querySelector("svg");
        if (sig) {                                                       // otherwise a plain sheet: the signature has already gone
        const r = sig.getBoundingClientRect();
        const clone = sig.cloneNode(true);
        clone.querySelectorAll(".signature__pen").forEach((n) => n.remove());
        clone.setAttribute("width", r.width); clone.setAttribute("height", r.height);
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.querySelectorAll("path").forEach((n) => n.setAttribute("fill", "#000"));
        const img = new Image();
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
        await img.decode();
        px.drawImage(img, r.left, r.top, r.width, r.height);
        }
        content.needsUpdate = true;
        ready = true;
        el.prepend(cv);
        el.style.background = "transparent";                             // the water draws the sheet now (and can wash it away)
        gsap.set(box, { opacity: 0 });                                   // the hint stays live, over the water
      } catch (e) { /* keep the live sheet */ }
    })();

    const drops = [];
    return {
      drop(x, y, radius, strength) { drops.push([x / W, 1 - y / H, radius / H, strength]); },
      ink(x0, y0, x1, y1, width) {
        ik.strokeStyle = "rgba(0,0,0,0.9)";
        ik.lineWidth = width;
        ik.beginPath(); ik.moveTo(x0, y0); ik.lineTo(x1, y1); ik.stroke();
        inkLive = 240;                                                   // keep uploading while it dissolves
      },
      swirl(cx, cy, reach, twist) { viewU.uSwirl.value.set(cx, H - cy, reach, twist); },
      pond(cx, cy, t, strength) { viewU.uPond.value.set(cx, H - cy, t, strength); },
      get ready() { return ready; },
      update(sink, hx, hy, R, edge) {
        if (!ready) { drops.length = 0; return false; }
        for (let i = 0; i < 3; i++) {
          const d = i === 0 && drops.shift();
          simU.uDrop.value.set(d ? d[0] : 0, d ? d[1] : 0, d ? d[2] : 1, d ? d[3] : 0);
          simU.uPrev.value = rtA.texture;
          renderer.setRenderTarget(rtB);
          renderer.render(simScene, cam);
          const t = rtA; rtA = rtB; rtB = t;
        }
        renderer.setRenderTarget(null);
        if (inkLive > 0) {
          inkLive--;
          ik.save(); ik.setTransform(1, 0, 0, 1, 0, 0);
          ik.globalCompositeOperation = "destination-out";
          ik.fillStyle = "rgba(0,0,0,0.018)";
          ik.fillRect(0, 0, inkCv.width, inkCv.height);
          ik.restore();
          inkTex.needsUpdate = true;
        }
        viewU.uWater.value = rtA.texture;
        viewU.uSink.value = sink;
        viewU.uHole.value.set(hx, H - hy, R, edge * Math.min(1, sink * 2));
        renderer.render(viewScene, cam);
        return true;
      },
      dispose() { rtA.dispose(); rtB.dispose(); content.dispose(); inkTex.dispose(); renderer.dispose(); },
    };
  }

  // Arriving on the case study: the loader element is already showing the sheet and count (via CSS)
  /* The liquid itself (WebGL): one full-screen shader drawn with signed distances, so the
     body, droplets and drips all melt into each other (smooth-min) like real ink.
       mode 0 "flood": the liquid rises from the bottom with a rolling surface; droplets leap
              off it in arcs and fall back in. p: 0 = empty → 1 = full screen.
       mode 1 "drain": the full screen pulls upward; its lower edge ripples, drips stretch
              down from it and loose drops break off and fall. p: 0 = full → 1 = gone.
     Returns null without WebGL (the caller then falls back to a plain sheet). */
  function liquidSheet(host) {
    const canvas = document.createElement("canvas");
    canvas.className = "page-cover__liquid";
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false, alpha: true });
    if (!gl) return null;
    const vs = "attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }";
    const fs = `precision highp float;
      uniform vec2 uRes; uniform float uTime, uP, uMode;
      float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
      float h1(float n){ return fract(sin(n * 12.9898 + 4.1) * 43758.5453); }
      float capsule(vec2 p, vec2 a, vec2 b, float r){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba * h) - r; }
      float surfaceWave(float x, float t){ return sin(x * 7.0 + t * 3.2) * 0.55 + sin(x * 13.0 - t * 4.1) * 0.3 + sin(x * 23.0 + t * 6.3) * 0.15; }
      float edgeWave(float x, float t){ return sin(x * 6.0 - t * 2.6) * 0.6 + sin(x * 15.0 + t * 3.7) * 0.4; }
      void main(){
        vec2 uv = gl_FragCoord.xy / uRes;                       // y = 0 at the bottom
        float asp = uRes.x / uRes.y;
        vec2 p = vec2(uv.x * asp, uv.y);
        float t = uTime, d;
        if (uMode < 0.5) {
          // FLOOD: a rolling surface rising up the screen, calming as it fills
          float amp = 0.055 * (1.0 - smoothstep(0.8, 1.0, uP));
          float level = mix(-0.14, 1.14, uP);
          d = uv.y - (level + amp * surfaceWave(uv.x, t));
          for (int i = 0; i < 8; i++) {                         // droplets leaping off the surface
            float fi = float(i);
            float x = h1(fi + 1.0);
            float ph = fract(uP * 1.5 + fi * 0.37);
            float hop = sin(ph * 3.14159) * (0.09 + 0.1 * h1(fi + 9.0)) * (1.0 - uP);
            float sx = level + amp * surfaceWave(x, t);
            float r = (0.014 + 0.022 * h1(fi + 3.0)) * (1.0 - smoothstep(0.75, 1.0, uP));
            d = smin(d, length(p - vec2(x * asp, sx + 0.015 + hop)) - r, 0.05);
          }
        } else {
          // DRAIN: the body pulls upward; drips hang from its edge, drops break off and fall
          float e = mix(-0.16, 1.28, uP);
          float amp = 0.035;
          d = (e + amp * edgeWave(uv.x, t)) - uv.y;
          float fade = 1.0 - smoothstep(0.82, 1.0, uP);
          for (int i = 0; i < 10; i++) {
            float fi = float(i);
            float x = h1(fi * 3.7 + 2.0);
            float ex = e + amp * edgeWave(x, t);
            float len = (0.04 + 0.2 * h1(fi + 5.0)) * smoothstep(0.0, 0.3, uP);
            float w = (0.01 + 0.014 * h1(fi + 7.0)) * fade;
            vec2 a = vec2(x * asp, ex), b = a - vec2(0.0, len);
            d = smin(d, capsule(p, a, b, w), 0.045);                    // the drip
            d = smin(d, length(p - b) - w * 1.35, 0.03);                // its bulb
            float fall = fract(uP * 1.4 + fi * 0.23);                  // a drop breaking off
            float rr = w * (1.0 - fall);
            if (rr > 0.0045) d = smin(d, length(p - (b - vec2(0.0, fall * 0.42))) - rr, 0.02);   // no dust-sized specks
          }
        }
        float px = 1.2 / uRes.y;
        float a = 1.0 - smoothstep(-px, px, d);
        float rim = (1.0 - smoothstep(0.0, 0.01, abs(d + 0.006))) * a;  // light catching the meniscus
        gl_FragColor = vec4(vec3(rim * 0.2), a);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "a");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const U = (n) => gl.getUniformLocation(prog, n);
    const uRes = U("uRes"), uTime = U("uTime"), uP = U("uP"), uMode = U("uMode");
    host.prepend(canvas);

    const state = { p: 0, mode: 0 };
    let raf = 0;
    const t0 = performance.now();
    function size() {
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const w = Math.round(innerWidth * dpr), h = Math.round(innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    }
    function render() {
      size();
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.uniform1f(uP, state.p);
      gl.uniform1f(uMode, state.mode);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    const loop = () => { render(); raf = requestAnimationFrame(loop); };
    return {
      state, render,
      start() { if (!raf) loop(); },
      stop() { cancelAnimationFrame(raf); raf = 0; },
    };
  }

  function arriveFrom(arrive, el) {
    el.classList.add("page-cover");
    el.querySelector(".loader__sig").remove();
    // the liquid takes over from the plain black stand-in: draw it full first, then drop the backdrop
    const liquid = liquidSheet(el);
    if (liquid) { liquid.state.mode = 1; liquid.state.p = 0; liquid.render(); el.classList.add("is-liquid"); liquid.start(); }
    const from = Math.max(0, Math.min(99, +arrive.count || 0));
    const word = coverWord(+arrive.word || 0);
    const count = coverCount(from);
    el.append(word, count);
    document.documentElement.classList.remove("is-arriving");   // the real elements take over from the CSS stand-in
    // hold the handed-over word a beat before it starts cycling again, so it reads as one continuous loader
    let cycle = { index: () => +arrive.word || 0, stop: () => clearTimeout(cycleWait) };
    const cycleWait = setTimeout(() => (cycle = cycleWords(word, +arrive.word || 0)), 700);

    // Start only once start-up work has settled (two on-time frames), so nothing skips a beat
    const settled = new Promise((r) => {
      const t0 = performance.now(); let last = t0, good = 0;
      const step = (now) => {
        good = now - last < 34 ? good + 1 : 0; last = now;
        if (good >= 2 || now - t0 > 1800) r(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    return new Promise((resolve) => {
      Promise.all([document.fonts.ready, settled]).then(() => {
        gsap.ticker.lagSmoothing(120, 33);                       // a late frame slows the motion instead of skipping it
        const n = { v: from };
        const tl = gsap.timeline({ onComplete: () => { if (liquid) liquid.stop(); el.remove(); gsap.ticker.lagSmoothing(0); } })
          // count on to 100 now the page is ready
          .to(n, { v: 100, duration: 0.6 + (100 - from) * 0.007, ease: "power2.inOut", onUpdate: () => (count.textContent = pad3(n.v)) }, 0)
          .call(() => cycle.stop())
          .to([word, count], { yPercent: -40, opacity: 0, duration: 0.45, ease: "power3.in" }, ">0.12");
        if (liquid) {
          // the liquid drains upward: rippling edge, stretching drips, drops breaking off
          tl.to(liquid.state, { p: 1, duration: 1.5, ease: "power2.inOut" }, "<0.15")
            .call(() => { root.classList.remove("is-loading"); resolve(); }, null, "<0.3");
        } else {
          tl.to(el, { yPercent: -100, borderBottomLeftRadius: coverEdge(), borderBottomRightRadius: coverEdge(), duration: 1.15, ease: "expo.inOut" }, "<0.2")
            .call(() => { root.classList.remove("is-loading"); resolve(); }, null, "<0.25");
        }
        tl.eventCallback("onStart", () => (el.dataset.lifting = "1"));
      });
    });
  }

  function setupLiquidNav() {
    let cover = null;
    const rows = [...document.querySelectorAll(".work[data-href]")].filter((row) => !row.hasAttribute("data-external"));
    /* Hold to open, in one continuous shot: the card becomes a drop of water and bursts. Where the
       pointer presses, the card draws itself together into a trembling drop (its corners round,
       surface tension makes it wobble more as it fills, a fisheye lens domes the picture, a glint
       and a darker meniscus make it read as water); letting go early lets it relax back. At the
       end of the hold it doesn't stop: the drop pops into droplets that fly outward carrying pieces
       of the picture, merging and stretching as they fall, a splash rings across the water, and
       underneath is the case study, which has been waiting behind the card all along (an iframe
       under the WebGL canvas, clipped to the card; it opens settled, as the real page will, so the
       hand-off is seamless and no loader shows). Without WebGL it falls back to the liquid
       transition (leave). The title runs the same shot. */
    rows.forEach((row) => {
      const media = row.querySelector(".work__media");
      const u = media && storyUniforms(media);
      row.setAttribute("data-cursor-pill", "Hold to open");
      row.setAttribute("data-hold", "");
      const HOLD = 1.1;
      const prog = { p: 0 };
      let shot = null, t0 = 0, committed = false, holding = false;
      const pill = () => document.querySelector(".cursor-pill");
      const around = () => [document.querySelector("main"), document.querySelector(".footer"), document.querySelector(".navbar"), document.querySelector(".cursor-trail")].filter(Boolean);

      let behind = null, dropBehind = null;
      const ensureBehind = () => {
        if (dropBehind) { dropBehind.kill(); dropBehind = null; }
        if (behind || !media) return;
        behind = document.createElement("iframe");
        behind.className = "tear-behind";
        behind.setAttribute("aria-hidden", "true");
        behind.tabIndex = -1;
        behind.src = row.dataset.href + (row.dataset.href.includes("?") ? "&" : "?") + "behind";   // opens settled, without touching the real hand-off
        document.body.appendChild(behind);
        // it stays out of sight on the landing page (no clipping to keep up with a fast scroll):
        // it's only shown at the moment the bubble bursts, when the bubble already covers the screen
      };
      const removeBehind = () => {
        if (!behind) return;
        behind.remove();
        behind = null;
      };

      // the whole shot, built when a press starts (it needs the card's place and the hold point)
      let rest = null;                                                   // the card's own transform, to return to
      function build(px, py) {
        // pressed while the video is still landing? the press takes over: it settles at once (otherwise
        // the landing would keep resizing the card and the bubble would stay boxed inside it)
        gsap.killTweensOf(media);
        gsap.killTweensOf(u.uFade);
        gsap.set(media, { x: 0, y: 0, scale: 1 });
        u.uFade.value = 1;
        const r = media.getBoundingClientRect();
        const W = innerWidth, H = innerHeight, sa = W / H;
        rest = { x: 0, y: 0, scale: 1 };
        const ow = media.offsetWidth, oh = media.offsetHeight;
        const ncx = r.left + r.width / 2 - rest.x, ncy = r.top + r.height / 2 - rest.y;   // its untransformed centre
        // the plane takes the whole screen; the shader keeps drawing the card exactly where it is
        gsap.set(media, { x: W / 2 - ncx, y: H / 2 - ncy, scaleX: W / ow, scaleY: H / oh });
        const c0 = [(r.left + r.width / 2) / H, (r.top + r.height / 2) / H], h0 = [r.width / 2 / H, r.height / 2 / H];
        const reach = Math.hypot(sa / 2, 0.5) + 0.02;                     // centre to corner: the bubble's final radius
        u.uPicAsp.value = r.width / r.height;
        u.uHoleC.value.set(px / H, py / H);
        u.uHold.value.set(gsap.utils.clamp(0.12, 0.88, (px - r.left) / r.width), gsap.utils.clamp(0.12, 0.88, (py - r.top) / r.height));
        const grow = { e: 0 };
        const r0 = Math.sqrt(h0[0] * h0[1]);                             // the card's own "radius"
        const shape = () => {
          const e = grow.e, round = gsap.parseEase("power2.out")(Math.min(1, prog.p * 2.4));   // a perfect circle early on
          const cx = c0[0] + (sa / 2 - c0[0]) * e, cy = c0[1] + (0.5 - c0[1]) * e;
          const R = r0 + (reach - r0) * e;                                 // then it simply inflates
          const hx = h0[0] + (R - h0[0]) * round, hy = h0[1] + (R - h0[1]) * round;
          u.uBub.value.set(cx, cy, hx, hy);
          u.uRound.value = Math.min(hx, hy) * round;
        };
        shape();
        u.uBubbleOn.value = 1;
        if (Liquid && Liquid.quiet) Liquid.quiet(true);                    // the page's water keeps still under a bubble
        const href = row.dataset.href;
        const colorsOf = () => ((row.querySelector("[data-colors]") || {}).dataset || {}).colors?.split(",").map((c) => c.trim()) || [];
        const fall = others().map((it) => it.uniforms.uFade);
        return gsap.timeline({ paused: true, onReverseComplete: settle })
          // the hold: the bubble inflates until it touches every corner, the page fading beneath it
          .to(prog, { p: 1, duration: HOLD, ease: "none", onUpdate: () => { const pl = pill(); if (pl) pl.style.setProperty("--hold", prog.p.toFixed(3)); } }, 0)
          .to(grow, { e: 1, duration: HOLD, ease: "power2.in", onUpdate: shape }, 0)
          .to(u.uDrop, { value: 1, duration: HOLD * 0.6, ease: "power2.out" }, 0)
          .to(u.uDome, { value: 0.3, duration: HOLD, ease: "power1.in" }, 0)
          .to(around(), { opacity: 0, duration: HOLD * 0.7, ease: "power1.in" }, HOLD * 0.3)
          .to(fall, { value: 0, duration: HOLD * 0.6, ease: "power1.in" }, HOLD * 0.3)
          // ...and the moment it fills the screen, it bursts
          .call(() => {
            if (shot && !shot.reversed()) { commit(px, py); burstMist(px, py, colorsOf(), 1.2); if (window.jrpSound) window.jrpSound.pop(); }
            else if (returning) {                                          // coming back: the film has closed over the case study
              if (behind) behind.classList.remove("is-shown");
              if (window.jrpSound) whoosh = window.jrpSound.swell(HOLD / BACK_SPEED, true);
            }
          }, null, HOLD)
          .to(u.uDome, { value: 0, duration: 0.3, ease: "power2.out" }, HOLD)
          .to(u.uPop, { value: 1, duration: 1.2, ease: "power1.out" }, HOLD)
          .call(() => {
            if (shot && shot.reversed()) return;
            if (promote(behind, href, comeBack)) return;                   // the page beneath simply becomes the page
            try { sessionStorage.setItem("jrp-arrive", JSON.stringify({ kind: "tear" })); } catch (e) {}
            location.href = href;
          }, null, HOLD + 1.25);
      }
      // let go early and it's all wound back: the card returns to its own place
      function settle() {
        gsap.ticker.lagSmoothing(0);                                       // back to Lenis' clock
        if (committed || !rest) return;
        if (lenis) lenis.start();
        if (returning) { returning = false; removeBehind(); }             // next time, a fresh page behind the card
        u.uBubbleOn.value = 0;
        if (Liquid && Liquid.quiet) Liquid.quiet(false);
        gsap.set(media, { x: rest.x, y: rest.y, scaleX: rest.scale, scaleY: rest.scale });
        if (shot) { shot.kill(); shot = null; }
      }
      // the other pictures are WebGL planes, not page content: they fall away with the page
      const others = () => (Liquid ? Liquid.items.filter((it) => it.el !== media && it.uniforms.uFade) : []);
      // Back from the case study: the same shot, run backwards. The burst closes into a whole bubble,
      // the bubble shrinks into its card, and the homepage is just as it was left.
      const BACK_SPEED = 1.25;
      let returning = false, whoosh = null;
      function comeBack() {
        if (!shot) return location.reload();
        committed = false; returning = true;
        gsap.ticker.wake();
        document.documentElement.classList.remove("is-promoted");
        if (behind) { behind.classList.remove("is-page"); behind.setAttribute("aria-hidden", "true"); behind.tabIndex = -1; }
        document.title = HOME_TITLE;
        const pl = pill();
        if (pl) gsap.to(pl, { scale: 1, autoAlpha: 1, duration: 0.3, delay: 1.4, ease: "power2.out" });
        if (window.jrpSound) window.jrpSound.unpop();
        shot.timeScale(BACK_SPEED).reverse();
      }
      function commit(px, py) {
        committed = true; holding = false;
        const pl = pill();
        if (pl) gsap.to(pl, { scale: 0, autoAlpha: 0, duration: 0.2, ease: "power3.in" });
        if (behind) behind.classList.add("is-shown");                    // the case study, all of it, beneath the bursting bubble
      }
      const press = (e) => {
        if (committed || e.button !== 0 || e.target.closest("a")) return;
        if (!media || !u) return;                                         // no WebGL: a plain press does nothing; the title still opens
        holding = true;
        t0 = performance.now();
        // while a hold runs, a stalled frame counts as one ordinary frame: the shot only advances while
        // the pointer is really held (a freeze, e.g. the page behind starting up, can't push it through)
        gsap.ticker.lagSmoothing(120, 33);
        ensureBehind();
        if (lenis) lenis.stop();
        if (!shot) shot = build(e.clientX, e.clientY);
        shot.timeScale(1).play();
        if (window.jrpSound) { if (whoosh) whoosh.stop(0.05); whoosh = window.jrpSound.swell(Math.max(0.2, HOLD - shot.time())); }   // the skin tightening
      };
      const release = () => {
        if (!holding || committed) return;
        holding = false;
        if (lenis) lenis.start();
        if (whoosh) { whoosh.stop(0.18); whoosh = null; }
        if (shot) shot.timeScale(1.8).reverse();                          // winds back along the same path
        if (performance.now() - t0 < 220) {                              // a click: hint that it wants a hold
          const pl = pill();
          if (pl) gsap.fromTo(pl, { scale: 1.18 }, { scale: 1, duration: 0.7, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
        }
      };
      // load the page behind early, while the pointer rests on the card, so the press itself stays smooth
      let warm = null;
      row.addEventListener("pointerenter", (e) => {
        if (e.pointerType !== "mouse" || !media || !u) return;
        if (dropBehind) { dropBehind.kill(); dropBehind = null; }
        warm = gsap.delayedCall(0.4, ensureBehind);
      });
      row.addEventListener("pointerleave", () => {
        if (warm) { warm.kill(); warm = null; }
        if (behind && !committed && !holding) { if (dropBehind) dropBehind.kill(); dropBehind = gsap.delayedCall(3, removeBehind); }
      });
      row.addEventListener("pointerdown", press);
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
      row.addEventListener("pointerleave", release);
      row.addEventListener("click", (e) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tabs as usual
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!e.target.closest("a") || committed) return;
        if (!media || !u) return leave(row.dataset.href);                // the title: straight in
        gsap.ticker.lagSmoothing(120, 33);
        ensureBehind();
        if (lenis) lenis.stop();
        const r = media.getBoundingClientRect();
        if (!shot) shot = build(r.left + r.width / 2, r.top + r.height / 2);
        shot.timeScale(2.2).play();                                      // the hold runs by itself, quickly
        if (window.jrpSound) { if (whoosh) whoosh.stop(0.05); whoosh = window.jrpSound.swell(Math.max(0.2, (HOLD - shot.time()) / 2.2)); }
        gsap.delayedCall(HOLD / 2.2, () => shot && shot.timeScale(1));
      }, true); // capture: runs before the row's own link handling
      // back from the case study (page restored from the cache): everything as it was
      window.addEventListener("pageshow", (e) => {
        if (!e.persisted) return;
        if (shot) { shot.kill(); shot = null; }
        committed = false; holding = false; prog.p = 0;
        gsap.ticker.lagSmoothing(0);
        removeBehind();
        if (u) { u.uBubbleOn.value = 0; u.uDrop.value = 0; u.uPop.value = 0; u.uDome.value = 0; }
        if (Liquid && Liquid.quiet) Liquid.quiet(false);
        others().forEach((it) => (it.uniforms.uFade.value = 1));
        others().forEach((it) => (it.uniforms.uFade.value = 1));
        if (media) gsap.set(media, { x: 0, y: 0, scaleX: 1, scaleY: 1, scale: 1 });
        gsap.set(around(), { opacity: 1, visibility: "visible" });
        if (lenis) lenis.start();
      });
    });

    // still: keep the page where it is (the hold-to-open has already filled the screen with the media)
    function leave(href, still = false) {
      if (cover) return;
      if (lenis) lenis.stop();
      cover = document.createElement("div");
      cover.className = "page-cover";
      cover.setAttribute("aria-hidden", "true");
      const startWord = Math.floor(Math.random() * coverWords().length);
      const word = coverWord(startWord);
      const count = coverCount(0);
      cover.append(word, count);
      document.body.appendChild(cover);
      const n = { v: 0 };
      let cycle = null;
      const liquid = liquidSheet(cover);
      if (liquid) { cover.classList.add("is-liquid"); liquid.state.mode = 0; liquid.state.p = 0; liquid.start(); }
      cover.liquid = liquid;

      const tl = gsap.timeline({ onComplete: () => {
        // hand the number over, so the case study carries on from exactly here
        const w = cycle ? cycle.index() : startWord;
        if (cycle) cycle.stop();
        try { sessionStorage.setItem("jrp-arrive", JSON.stringify({ kind: "cover", count: Math.round(n.v), word: w, wordText: coverWords()[w] })); } catch (e) {}
        location.href = href;
      } });
      if (liquid) {
        // the screen floods: a rolling surface rises, droplets leap off it
        tl.to(liquid.state, { p: 1, duration: 1.25, ease: "power2.inOut" }, 0);
        if (!still) tl.to(".site", { y: -70, scale: 0.975, transformOrigin: "50% 0%", duration: 1.25, ease: "power2.inOut" }, 0);
      } else {
        tl.fromTo(cover, { yPercent: 100, borderTopLeftRadius: coverEdge(), borderTopRightRadius: coverEdge() },
          { yPercent: 0, borderTopLeftRadius: "50% 0vh", borderTopRightRadius: "50% 0vh", duration: 1.0, ease: "expo.inOut" }, 0);
        if (!still) tl.to(".site", { y: -90, scale: 0.97, transformOrigin: "50% 0%", duration: 1.0, ease: "expo.inOut" }, 0);
      }
      tl.to(".cursor-pill, .cursor-trail", { autoAlpha: 0, duration: 0.25 }, 0)
        // the count sits on the liquid as soon as it covers the corner; the word once it passes the middle
        .fromTo(count, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.5, ease: "power3.out" }, 0.35)
        .fromTo(word, { opacity: 0, yPercent: 40 }, { opacity: 1, yPercent: 0, duration: 0.45, ease: "power3.out" }, liquid ? 0.75 : 0.45)
        // everything comes to rest before the browser freezes on navigation, so the hand-off frame is still
        .to(n, { v: 62, duration: 0.85, ease: "power2.out", onUpdate: () => (count.textContent = pad3(n.v)) }, 0.4);
    }

    // Back from the case study (page restored from the back/forward cache): the sheet lifts away
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted || !cover) return;
      const c = cover; cover = null;
      const liquid = c.liquid;
      const tl = gsap.timeline({ onComplete: () => { if (liquid) liquid.stop(); c.remove(); if (lenis) lenis.start(); } });
      tl.to(c.querySelectorAll(".page-cover__word, .page-cover__count"), { opacity: 0, duration: 0.3 }, 0);
      if (liquid) {
        liquid.state.mode = 1; liquid.state.p = 0; liquid.start();
        tl.to(liquid.state, { p: 1, duration: 1.4, ease: "power2.inOut" }, 0.1);
      } else {
        tl.to(c, { yPercent: -100, borderBottomLeftRadius: coverEdge(), borderBottomRightRadius: coverEdge(), duration: 1.1, ease: "expo.inOut" }, 0.1);
      }
      tl.to(".site", { y: 0, scale: 1, duration: 1.1, ease: "expo.inOut", clearProps: "transform" }, 0.1)
        .to(".cursor-pill, .cursor-trail", { autoAlpha: 1, duration: 0.3, clearProps: "opacity,visibility" }, 0.9);
    });
  }

  /* =========================================================
     Footer: the footnote rises in as it arrives; live Melbourne time,
     and "Back to top" glides home.
     ========================================================= */
  function setupFooter() {
    const footer = document.querySelector("[data-footer]");
    if (!footer) return;

    // live local time
    const timeEl = footer.querySelector("[data-local-time]");
    if (timeEl) {
      const fmt = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Melbourne", hour: "numeric", minute: "2-digit", hour12: true });
      const tick = () => (timeEl.textContent = "Melbourne, " + fmt.format(new Date()).toUpperCase());
      tick();
      setInterval(tick, 20000);
    }
    // back to top
    const top = footer.querySelector("[data-back-top]");
    if (top) top.addEventListener("click", (e) => {
      e.preventDefault();
      if (lenis) lenis.scrollTo(0, { duration: 1.8, easing: (t) => 1 - Math.pow(1 - t, 4) });
      else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });

    if (reduceMotion) return;
    const note = footer.querySelector(".footer__note");
    const meta = footer.querySelector(".footer__meta");
    // arrival: the line rises in, then the bottom row
    const tl = gsap.timeline({ paused: true })
      .fromTo(note, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, ease: "expo.out" }, 0)
      .fromTo(meta, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.3);
    ScrollTrigger.create({ trigger: footer, start: "top 92%", once: true, onEnter: () => tl.play() });
    if (footer.getBoundingClientRect().top < innerHeight * 0.92) tl.progress(1);
  }

  /* =========================================================
     Intro
     ========================================================= */
  function introTimeline() {
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".nav > *", { y: -20, autoAlpha: 0, duration: 1.1, stagger: 0.08, clearProps: "transform,opacity,visibility" }); // leave no inline transform behind (it fought the sound button)

    // Lede / subtitle lines rise out of a mask
    document.querySelectorAll("[data-intro-lines]").forEach((el) => {
      const split = SplitText.create(el, { type: "lines", mask: "lines" });
      el.removeAttribute("data-reveal");
      tl.set(el, { opacity: 1 }, 0).from(split.lines, { yPercent: 110, duration: 1.3, stagger: 0.09 }, 0.1);
    });

    const items = document.querySelectorAll("[data-intro-item]");
    if (items.length) tl.from(items, { y: 14, autoAlpha: 0, duration: 1, stagger: 0.05 }, 0.35);

    // Pixel titles: letters rise, starting as droplets and settling into squares
    document.querySelectorAll("[data-pixel-title]").forEach((el) => {
      const { chars } = SplitText.create(el, { type: "words,chars", wordsClass: "word", charsClass: "char", mask: "chars" });
      tl.from(chars, { yPercent: 105, duration: 1.5, stagger: 0.045 }, 0.3)
        .fromTo(chars, { "--elsh": 20 }, { "--elsh": 1, duration: 1.6, stagger: 0.045, ease: "power2.out" }, 0.45);
    });

    if (document.querySelector(".hero__linkedin")) {
      tl.fromTo(".hero__linkedin", { scale: 0 }, { scale: 1, duration: 1, ease: "back.out(2)" }, 1);
    }

    const heroLine = document.querySelector(".hero");
    if (heroLine) {
      gsap.set(heroLine, { "--draw": 0 });
      tl.to(heroLine, { "--draw": 1, duration: 1.6, ease: "expo.inOut" }, 0.6);
    }
    return tl;
  }

  /* =========================================================
     Scroll reveals + hairline drawing
     ========================================================= */
  function scrollReveals() {
    gsap.set("[data-reveal]", { y: 40, opacity: 0 });
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%",
      once: true,
      onEnter: (els) =>
        gsap.to(els, { y: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: 0.08, overwrite: "auto" }),
    });

    // Horizontal rules draw left→right as their band enters
    document.querySelectorAll(".band, .about").forEach((el) => {
      if (el.classList.contains("hero") || el.hasAttribute("data-story")) return;   // stories draw their own line
      gsap.fromTo(el, { "--draw": 0 }, {
        "--draw": 1,
        duration: 1.6,
        ease: "expo.inOut",
        scrollTrigger: { trigger: el, start: "bottom 95%", once: true },
      });
    });

    // Vertical dividers grow downward
    const verticals = [
      ...document.querySelectorAll(".pillar + .pillar"),
      ...document.querySelectorAll(".work__mid"),
      ...document.querySelectorAll(".quote + .quote"),
      ...document.querySelectorAll("[data-draw-v]"),
    ];
    verticals.forEach((el) => {
      gsap.fromTo(el, { "--draw": 0 }, {
        "--draw": 1,
        duration: 1.4,
        ease: "expo.inOut",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
      });
    });
  }

  /* =========================================================
     Hero name: pixels melt into droplets under the cursor
     (Geist Pixel ELSH axis: 1 = square, 20 = circle)
     ========================================================= */
  function liquidPixels() {
    const chars = document.querySelectorAll("[data-pixel-title] .char");
    chars.forEach((c) => {
      c.addEventListener("pointerenter", () => {
        gsap.to(c, { "--elsh": 20, duration: 0.5, ease: "power2.out", overwrite: "auto" });
        gsap.to(c, { "--elsh": 1, duration: 1.4, delay: 0.5, ease: "elastic.out(1, 0.4)" });
      });
    });
  }

  /* =========================================================
     Hero kinetics
     - The name melts toward the cursor: letters near it round into droplets
       (per-letter --field, added to the ELSH axis in CSS) and firm up behind it.
     - An idle ripple of melt drifts across the name every few seconds.
     - Scroll speed rounds every letter and leans it, each letter lagging the
       last, so the word sloshes like liquid and settles when scrolling stops.
     - The lede and meta drift up at different speeds as the hero leaves.
     ========================================================= */
  function heroKinetics() {
    const title = document.querySelector(".hero__name");
    const hero = document.querySelector(".hero");
    if (!title || !hero) return;
    const chars = [...title.querySelectorAll(".char")];
    if (!chars.length) return;

    let mx = -1e4, my = -1e4;
    window.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { mx = e.clientX; my = e.clientY; } }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { mx = my = -1e4; });

    const field = chars.map(() => 0);
    const lean = chars.map(() => ({ v: 0, x: 0 }));   // per-letter spring
    const RIPPLE_EVERY = 6.5;                          // seconds between idle ripples

    gsap.ticker.add((time, dt) => {
      const tr = title.getBoundingClientRect();
      if (tr.bottom < -200 || tr.top > innerHeight + 200) {          // off screen: rest upright and solid
        if (lean[0].x !== 0 || field[0] !== 0) {
          lean.forEach((s) => { s.x = 0; s.v = 0; });
          field.fill(0);
          chars.forEach((c) => { c.style.setProperty("--field", "0"); gsap.set(c, { skewX: 0 }); });
        }
        return;
      }
      const step = Math.min(dt, 50) / 1000;
      const vel = lenis ? gsap.utils.clamp(-60, 60, lenis.velocity) : 0;
      const ripple = ((time % RIPPLE_EVERY) / 1.6) * 1.5 - 0.25; // sweeps 0→1 over ~1.6s, then rests
      chars.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const d2 = (mx - cx) ** 2 + ((my - cy) * 1.3) ** 2;
        const u = (cx - tr.left) / tr.width;
        let target = 13 * Math.exp(-d2 / (2 * 170 * 170));                   // warmth of the cursor
        target += 6 * Math.exp(-((u - ripple) ** 2) / (2 * 0.07 * 0.07));      // idle ripple
        target += Math.min(9, Math.abs(vel) * 0.3);                           // speed rounds the pixels
        field[i] += (target - field[i]) * (1 - Math.exp(-step * 9));
        c.style.setProperty("--field", field[i].toFixed(2));
        // lean: a damped spring per letter, later letters respond a touch slower
        const s = lean[i], k = 70 - i * 4;
        s.v += (k * (gsap.utils.clamp(-9, 9, -vel * 0.22) - s.x) - 11 * s.v) * step;
        s.x += s.v * step;
        gsap.set(c, { skewX: Math.round(s.x * 100) / 100 });
      });
    });

    // Depth: lede and meta drift up at different rates as the hero scrolls away
    const scrub = { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 };
    gsap.to(".hero__lede", { y: -140, ease: "none", scrollTrigger: scrub });
    gsap.to(".hero__meta", { y: -70, ease: "none", scrollTrigger: { ...scrub } });
  }

  /* =========================================================
     Kinetic marquee: pixel type that runs on its own, speeds up with the
     scroll, flips direction with it, and melts (rounder pixels) the faster
     you go. Leans into the motion like the rest of the page.
     ========================================================= */
  function setupMarquee() {
    const root = document.querySelector("[data-marquee]");
    if (!root) return;
    const track = root.querySelector(".marquee__track");
    const group = track.querySelector(".marquee__group");
    // enough copies to cover the screen twice, so the loop never shows a gap
    const copies = Math.max(2, Math.ceil((innerWidth * 2) / group.offsetWidth) + 1);
    for (let i = 1; i < copies; i++) track.appendChild(group.cloneNode(true));
    const span = group.offsetWidth;

    let x = 0, dir = 1, speed = 0, lean = 0, leanV = 0;
    gsap.ticker.add((time, dt) => {
      const r = root.getBoundingClientRect();
      const step = Math.min(dt, 50) / 1000;
      const vel = lenis ? lenis.velocity : 0;
      if (Math.abs(vel) > 0.4) dir = vel > 0 ? 1 : -1;               // follow the scroll direction
      const targetSpeed = 70 + Math.min(1400, Math.abs(vel) * 38);   // px/s: drift, then rush
      speed += (targetSpeed - speed) * (1 - Math.exp(-step * 5));
      x -= dir * speed * step;
      x = ((x % span) - span) % span;                               // wrap within one copy
      leanV += (60 * (gsap.utils.clamp(-10, 10, -vel * 0.25) - lean) - 10 * leanV) * step;
      lean += leanV * step;
      if (r.bottom < 0 || r.top > innerHeight) return;               // off screen: keep time, skip paint
      gsap.set(track, { x, skewX: Math.round(lean * 100) / 100 });
      root.style.setProperty("--speed", Math.min(19, Math.abs(vel) * 0.45).toFixed(2));
    });
  }

  /* =========================================================
     Scroll lean: content tilts in the direction of travel with scroll
     speed and springs back when the page stops (matches the WebGL bend).
     ========================================================= */
  function scrollLean() {
    const els = [...document.querySelectorAll(".pillar, .work__intro, .quote, .award")];
    if (!els.length || !lenis) return;
    let lean = 0, leanV = 0, shown = null;
    gsap.ticker.add((time, dt) => {
      const step = Math.min(dt, 50) / 1000;
      const target = gsap.utils.clamp(-3.2, 3.2, -lenis.velocity * 0.09);
      leanV += (55 * (target - lean) - 10 * leanV) * step;
      lean += leanV * step;
      const next = Math.round(lean * 100) / 100;
      if (next === shown) return;
      shown = next;
      gsap.set(els, { skewY: next, transformOrigin: "50% 50%" });
    });
  }

  /* =========================================================
     The ball lens. The page reads as if wrapped on a slowly turning ball:
     things come up from the bottom small and squeezed, swell to full size
     in the middle of the screen, and curve away again at the top. Gentle
     at rest, deeper the faster you scroll. Pictures bend in their WebGL
     mesh (VERT, uLens); text blocks get the same curve as a shift and a
     scale (CSS translate / scale, so they never fight other transforms).
     ========================================================= */
  function setupBallLens() {
    if (reduceMotion) { BALL.value = 0; return; }
    const SEL = "main p, main li, main dt, main dd, main blockquote, main figcaption, .footer p, .footer__meta > *";   // not headings: their reveals key off their place
    let els = [], lastKey = "";
    const collect = () => {
      els = [...document.querySelectorAll(SEL)].filter((el) => !el.closest(".hero, .loader, .page-cover"));
      els = els.filter((el) => !els.some((o) => o !== el && el.contains(o)));   // leaves only: no doubled curves
      lastKey = "";
    };
    const clear = () => els.forEach((el) => { if (el._ball) { el.style.translate = el.style.scale = ""; el._ball = 0; el._dx = el._dy = 0; } });
    collect();
    window.addEventListener("load", collect, { once: true });
    if (window.ScrollTrigger) {
      ScrollTrigger.addEventListener("refreshInit", clear);                // measure the page without the curve
      ScrollTrigger.addEventListener("refresh", collect);
    }
    let speed = 0;
    gsap.ticker.add(() => {
      const v = lenis ? Math.abs(lenis.velocity) : 0;
      speed += (Math.min(1, v / 40) - speed) * 0.08;                         // eases in and settles out with the glide
      BALL.value = BALL.rest + BALL.scroll * speed;
      const L = BALL.value, W = innerWidth, H = innerHeight, y0 = window.scrollY;
      const key = `${y0}|${L.toFixed(4)}|${W}|${H}`;
      if (key === lastKey) return;
      lastKey = key;
      const rects = els.map((el) => el.getBoundingClientRect());            // read everything first…
      els.forEach((el, i) => {                                              // …then write
        const r = rects[i];
        if (r.bottom < -80 || r.top > H + 80 || r.height === 0) { if (el._ball) { el.style.translate = el.style.scale = ""; el._ball = 0; } return; }
        // undo the curve already applied, to work from the block's true place
        const cy = r.top + r.height / 2 - (el._dy || 0), cx = r.left + r.width / 2 - (el._dx || 0);
        const ny = 1 - (2 * cy) / H, k = L * ny * ny;                       // same curve as the pictures' mesh
        const dx = (cx - W / 2) * -0.55 * k, dy = ny * k * H / 2;
        el._dx = dx; el._dy = dy; el._ball = 1;
        el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
        el.style.scale = `${(1 - 0.55 * k).toFixed(4)} ${Math.max(0.85, 1 - 2 * k).toFixed(4)}`;   // never squashed past 85%
      });
    });
  }

  /* =========================================================
     Hero parallax. The headline, the details line and the name move at
     different rates as the hero scrolls away (the headline lags, the name
     leads), so they read as layers at different depths; while the hero is
     in view the pointer tilts them apart a touch, eased. Uses the CSS
     translate property, so it never fights the intro or the melt.
     ========================================================= */
  function heroParallax() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const layers = [[".hero__lede", 0.28, -12], [".hero__meta", 0.12, -6], [".hero__name-row", -0.1, 16]]   // + lags the scroll, - leads it
      .map(([q, k, m]) => [hero.querySelector(q), k, m]).filter(([el]) => el);
    if (!layers.length) return;
    const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    if (fine) window.addEventListener("pointermove", (e) => {
      tilt.tx = e.clientX / innerWidth * 2 - 1;
      tilt.ty = e.clientY / innerHeight * 2 - 1;
    }, { passive: true });
    let lastKey = "";
    gsap.ticker.add(() => {
      const y = window.scrollY, h = hero.offsetHeight + hero.offsetTop;
      if (y > h + 200) { if (lastKey !== "off") { layers.forEach(([el]) => (el.style.translate = "")); lastKey = "off"; } return; }
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;
      const near = Math.max(0, 1 - y / h);                                // the tilt fades as the hero leaves
      const key = `${y}|${tilt.x.toFixed(3)}|${tilt.y.toFixed(3)}`;
      if (key === lastKey) return;
      lastKey = key;
      layers.forEach(([el, k, m]) => {
        const tx = tilt.x * m * near, ty = y * k + tilt.y * m * 0.6 * near;
        el.style.translate = `${tx.toFixed(1)}px ${ty.toFixed(1)}px`;
      });
    });
  }

  /* =========================================================
     About: a trail of photos. Moving across the About section leaves a
     trail of moments behind the cursor (coffee, food, places, family),
     one after another every so often along its path. Each pops in at a
     slight angle, carries on a little in the direction you were moving,
     then sinks and fades. Desktop pointers only.
     ========================================================= */
  function setupAboutTrail() {
    const about = document.querySelector(".about");
    if (!about || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const SRC = [
      "assets/about-trail/1.webp", "assets/about-trail/2.webp", "assets/about-trail/3.webp",
      "assets/about-trail/4.webp", "assets/about-trail/5.webp", "assets/about-trail/6.webp",
    ];
    const layer = document.createElement("div");
    layer.className = "about-trail";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    // a small pool, reused round-robin (loaded the first time the pointer comes near)
    const pool = Array.from({ length: 12 }, () => {
      const img = document.createElement("img");
      img.alt = ""; img.decoding = "async";
      layer.appendChild(img);
      gsap.set(img, { opacity: 0 });
      return img;
    });
    let loaded = false, next = 0, pick = 0, z = 1, last = null, lastT = 0;
    const load = () => { if (loaded) return; loaded = true; SRC.forEach((src) => { const i = new Image(); i.src = src; }); };
    about.addEventListener("pointerenter", load, { passive: true });
    about.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      load();
      const now = performance.now();
      if (!last) { last = { x: e.clientX, y: e.clientY }; lastT = now; return; }
      const dx = e.clientX - last.x, dy = e.clientY - last.y, d = Math.hypot(dx, dy);
      if (d < 55) return;                                                   // one every so often along the path
      const v = d / Math.max(16, now - lastT);                              // px per ms: how fast you were moving
      last = { x: e.clientX, y: e.clientY }; lastT = now;
      const img = pool[next]; next = (next + 1) % pool.length;
      img.src = SRC[pick]; pick = (pick + 1) % SRC.length;
      const w = 170, h = 226, drift = Math.min(1.6, v) * 70;
      gsap.killTweensOf(img);
      gsap.set(img, { x: e.clientX - w / 2, y: e.clientY - h / 2, zIndex: ++z, rotation: gsap.utils.random(-9, 9), scale: 0.55, opacity: 0 });
      gsap.timeline()
        .to(img, { opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }, 0)
        .to(img, { x: `+=${(dx / d) * drift}`, y: `+=${(dy / d) * drift}`, duration: 0.8, ease: "power3.out" }, 0)    // carries on a little
        .to(img, { opacity: 0, scale: 0.86, y: "+=26", duration: 0.42, ease: "power2.in" }, 0.36);                 // then sinks and fades
    }, { passive: true });
    about.addEventListener("pointerleave", () => { last = null; }, { passive: true });
  }

  /* =========================================================
     Scroll stories (Apple-style: smooth, physical, unhurried)
     Works rows (played on entry, reversed when scrolling back past): the media
       pans out from close up into its frame and touches down on the water
       (createWater), rings running out from its edges; then the title,
       description and details rise in, one after another.
     The media are WebGL planes that follow their DOM boxes, so moving/scaling
     the box moves the plane and the picture stays sharp and correctly cropped.
     Without WebGL the DOM media moves the same way.
     ========================================================= */
  function storyUniforms(el) {
    const it = Liquid && Liquid.items.find((i) => i.el === el);
    return it ? it.uniforms : null;
  }

  /* =========================================================
     Reading progress: a quiet percentage on the right edge with a hairline that fills as you go.
     White + difference, so it reads on the page and over pictures alike.
     ========================================================= */
  function readingProgress() {
    const el = document.createElement("div");
    el.className = "progress";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = '<span class="progress__value">0%</span><span class="progress__line"><span class="progress__fill"></span></span>';
    document.body.appendChild(el);
    const value = el.querySelector(".progress__value");
    const fill = el.querySelector(".progress__fill");
    let shown = -1;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      fill.style.transform = `scaleY(${p.toFixed(4)})`;
      const pct = Math.round(p * 100);
      if (pct !== shown) { shown = pct; value.textContent = pct + "%"; }
    };
    update();
    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1, delay: 0.6, ease: "power2.out" });
  }

  /* =========================================================
     Selected Works, sideways: the section pins and the mouse wheel slides the case studies across,
     one screen each; after the last one the page carries on downward. Only scrolling moves it.
     The words lean with the motion like the testimonials do (a jelly skew that springs back).
     ========================================================= */
  let worksScroll = null, worksView = null;
  function horizontalWorks() {
    if (reduceMotion) return;
    const sec = document.querySelector("#works");
    const rows = sec ? [...sec.querySelectorAll(":scope > .work")] : [];
    if (rows.length < 2) return;
    const view = document.createElement("div");
    view.className = "works__view";
    worksView = view;
    const track = document.createElement("div");
    track.className = "works__track";
    rows[0].before(view);
    view.appendChild(track);
    rows.forEach((r) => track.appendChild(r));
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    worksScroll = gsap.to(track, {
      x: () => -dist(), ease: "none",
      scrollTrigger: { trigger: view, start: "top top", end: () => "+=" + dist(), pin: true, scrub: true, invalidateOnRefresh: true, anticipatePin: 1 },
    });
    // the jelly lean: the words trail the motion and settle with a little wobble
    const els = [...track.querySelectorAll(".work__intro, .work__col .fact")];
    const setSkew = els.map((el) => gsap.quickSetter(el, "skewX", "deg"));
    let last = 0, v = 0, lean = 0, leanV = 0, shown = 0;
    gsap.ticker.add((time, dt) => {
      const step = Math.min(dt, 50) / 1000;
      const x = gsap.getProperty(track, "x");
      v += ((x - last) / step - v) * (1 - Math.exp(-step * 10));
      last = x;
      const target = gsap.utils.clamp(-4, 4, v * 0.005);
      leanV += (45 * (target - lean) - 9 * leanV) * step;
      lean += leanV * step;
      const next = Math.round(lean * 100) / 100;
      if (next === shown) return;
      shown = next;
      setSkew.forEach((f) => f(shown));
    });
  }

  function setupStories() {
    // ---------- About: the photo is a screen ----------
    // It simply stays, shown as an image on a screen: a fine dot grid and scanlines, a glitch every
    // few seconds (slices slip sideways, a ghost offsets, a ripple runs through), and now and then it
    // breaks into big pixels for a moment before resolving. All in its shader (uGlitch).
    const aboutPhoto = document.querySelector(".about .about__photo");
    if (aboutPhoto) {
      const u = storyUniforms(aboutPhoto);
      if (u) u.uGlitch.value = 1;
    }

    // ---------- Works rows ----------
    document.querySelectorAll(".work").forEach((row, index) => {
      // in the sideways strip, every card after the first is revealed as it slides in from the right
      const side = worksScroll && index > 0 ? { containerAnimation: worksScroll } : null;
      const media = row.querySelector(".work__media[data-story-media]");
      const intro = row.querySelector(".work__intro");
      if (!media || !intro) return;
      const facts = [...row.querySelectorAll(".fact")];
      [intro, ...facts].forEach((e) => e.removeAttribute("data-reveal"));
      const u = storyUniforms(media);
      const tLines = SplitText.create(intro.querySelector(".work__title"), { type: "lines", mask: "lines" }).lines;
      // every paragraph of the intro rises with the rest (Community has two)
      const dLines = [...intro.querySelectorAll("p")].flatMap((p) => SplitText.create(p, { type: "lines", mask: "lines" }).lines);

      // 2–3. after the media: the words a line at a time, then the details
      const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
        .fromTo(tLines, { yPercent: 105 }, { yPercent: 0, duration: 0.9, stagger: 0.06 }, 0)
        .fromTo(dLines, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.035 }, 0.1)
        .fromTo(facts, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, ease: "power3.out" }, 0.22);

      // 1. the media pans out: it arrives close and large, pulls back into its frame and touches down
      // on the water just before it settles, so the rings start from its edges; then the words
      const HIDDEN = { y: 90, scale: 0.86 };
      gsap.set(media, HIDDEN);
      if (u) u.uFade.value = 0; else gsap.set(media, { opacity: 0 });
      let landing = null;
      const show = () => {
        if (landing) landing.kill();
        gsap.fromTo(media, { y: 0, scale: 1.3 }, { y: 0, scale: 1, duration: 1.5, ease: "power3.inOut", overwrite: "auto" });
        if (u) gsap.fromTo(u.uFade, { value: 0 }, { value: 1, duration: 0.7, ease: "power2.out", overwrite: "auto" });
        else gsap.fromTo(media, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: "power2.out", overwrite: "auto" });
        landing = gsap.delayedCall(1.18, () => { if (Liquid) Liquid.land(media, 0.09); });   // touchdown
      };
      const playText = () => { row._textOn = true; tl.timeScale(1).play(); };
      const rewindText = () => { row._textOn = false; tl.timeScale(1.8).reverse(); };
      const hide = () => {                                              // same path back (spatial consistency)
        if (landing) { landing.kill(); landing = null; }
        gsap.to(media, { ...HIDDEN, duration: 0.7, ease: "power2.in", overwrite: "auto" });
        if (u) gsap.to(u.uFade, { value: 0, duration: 0.6, ease: "power2.in", overwrite: "auto" });
        else gsap.to(media, { opacity: 0, duration: 0.6, overwrite: "auto" });
      };
      // the first card sits inside the pinned strip: its triggers must know, or a refresh pushes them past the pin
      const pinned = worksView ? { pinnedContainer: worksView } : {};
      ScrollTrigger.create(side ? { trigger: row, ...side, start: "left 72%", onEnter: show, onLeaveBack: hide }
                                : { trigger: row, ...pinned, start: "top 72%", onEnter: show, onLeaveBack: hide });
      // the words don't wait for the media: they rise as soon as the intro is on screen, so a fast scroll never lands on an empty column
      ScrollTrigger.create(side ? { trigger: row, ...side, start: "left 92%", onEnter: playText, onLeaveBack: rewindText }
                                : { trigger: intro, ...pinned, start: "top 94%", onEnter: playText, onLeaveBack: rewindText });
      // opened mid-page below this row: show it settled rather than hidden
      if (!side && row.getBoundingClientRect().top < innerHeight * 0.72) {
        gsap.set(media, { y: 0, scale: 1, opacity: 1 });
        if (u) u.uFade.value = 1;
        tl.progress(1); row._textOn = true;
      }
    });
  }

  /* =========================================================
     Liquid scroll-out for pixel titles ("Jithin RP", case study titles)
     As the title leaves, its pixels round into droplets (title-wide --melt,
     added to each letter's hover --elsh in CSS) and the letters sink into
     their masks at random, like melting into a surface. Scrubbed, so
     scrolling back up re-forms it.
     The sink runs on y (px), not yPercent: the intro owns yPercent, and when
     a page opens mid-scroll both run at once and the intro used to leave the
     name stuck below its mask. GSAP adds the two, so they never collide.
     ========================================================= */
  function liquidTitleExit() {
    document.querySelectorAll("[data-pixel-title]").forEach((title) => {
      const chars = title.querySelectorAll(".char");
      if (!chars.length) return;
      gsap.timeline({
        scrollTrigger: { trigger: title, start: "top 30%", end: "bottom 5%", scrub: 0.8 },
      })
        .fromTo(title, { "--melt": 0 }, { "--melt": 19, duration: 0.5, ease: "none", immediateRender: false }, 0)
        .fromTo(chars,
          { y: 0, opacity: 1, filter: "blur(0px)" },
          {
            y: (i, el) => el.offsetHeight * gsap.utils.random(0.7, 1.3), // 70–130% of a letter
            opacity: 0,
            filter: "blur(4px)",
            duration: 0.6,
            ease: "power2.in",
            stagger: { each: 0.06, from: "random" },
            immediateRender: false,
          }, 0.25);
    });
  }

  /* =========================================================
     Liquid headings: section titles coalesce as they enter (rising out of
     a stretched blur, letters settling at random) and melt the same way
     as they leave the top of the screen. Both halves are scrubbed.
     ========================================================= */
  const LIQUID_HEADINGS = ".site .display, .site .ce-title, .site .cs-heading";
  function liquidHeadings() {
    document.querySelectorAll(LIQUID_HEADINGS).forEach((h) => {
      if (h.closest("[data-story]")) return;  // scroll stories animate their own heading
      h.removeAttribute("data-reveal"); // this replaces the generic fade-up
      gsap.set(h, { opacity: 1, y: 0 });
      // line by line: each line condenses out of a blur (no masks, so the blur isn't clipped)
      const { lines } = SplitText.create(h, { type: "lines", linesClass: "lline" });
      gsap.set(lines, { transformOrigin: "50% 100%" });

      const liquid = { opacity: 0, yPercent: 35, scaleY: 1.25, filter: "blur(12px)" };
      const solid = { opacity: 1, yPercent: 0, scaleY: 1, filter: "blur(0px)" };

      // Played, not scrubbed: a fast flick can't strand a line half-melted. The lines condense in one
      // after another as the heading comes up into view and melt away as it leaves at the top (and
      // the reverse on the way back), always running to the end.
      gsap.set(lines, liquid);
      const condense = () => gsap.to(lines, { ...solid, duration: 1.1, ease: "power3.out", stagger: 0.12, overwrite: true });
      const melt = (up) => gsap.to(lines, { opacity: 0, yPercent: up ? -30 : 35, scaleY: up ? 1.2 : 1.25, filter: "blur(10px)", duration: 0.55, ease: "power2.in", stagger: { each: 0.08, from: up ? "start" : "end" }, overwrite: true });
      ScrollTrigger.create({ trigger: h, start: "top 92%", end: "bottom 8%",
        onEnter: condense, onEnterBack: condense, onLeave: () => melt(true), onLeaveBack: () => melt(false) });
      if (h.getBoundingClientRect().top < innerHeight * 0.92 && h.getBoundingClientRect().bottom > innerHeight * 0.08) gsap.set(lines, solid);
    });
  }

  /* =========================================================
     Cursor pill: over [data-cursor-pill] the pointer becomes a
     black pill that trails the mouse and leans into its motion
     ========================================================= */
  function setupCursorPill() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!document.querySelector("[data-cursor-pill]")) return;

    const pill = document.createElement("div");
    pill.className = "cursor-pill";
    pill.setAttribute("aria-hidden", "true");
    document.body.appendChild(pill);
    gsap.set(pill, { scale: 0, autoAlpha: 0 });

    const xTo = gsap.quickTo(pill, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(pill, "y", { duration: 0.35, ease: "power3" });
    const lean = gsap.utils.clamp(-10, 10);
    let current = null, lastX = 0, flipped = false;

    // Near the right edge the pill opens to the left of the pointer instead of running off-screen
    function side(x) {
      const flip = !!current && x + pill.offsetWidth + 16 > window.innerWidth;
      if (flip === flipped) return;
      flipped = flip;
      gsap.to(pill, { xPercent: flip ? -100 : 0, duration: 0.35, ease: "power3.out" });
      pill.style.transformOrigin = flip ? "100% 0" : "0 0";
    }

    window.addEventListener("pointermove", (e) => {
      side(e.clientX);
      xTo(e.clientX);
      yTo(e.clientY);
      if (current) gsap.to(pill, { skewX: lean((lastX - e.clientX) * 0.6), duration: 0.5, ease: "power3.out", overwrite: "auto" });
      lastX = e.clientX;
    }, { passive: true });

    // Nearest labelled ancestor wins, so a tool chip inside a card swaps the label and back
    function show(el, e) {
      if (el === current) return;
      if (!el) return hide();
      // Optional second line (e.g. what a tool is used for)
      const note = el.dataset.cursorNote;
      pill.textContent = el.dataset.cursorPill;
      pill.classList.toggle("has-note", !!note);
      if (note) {
        const small = document.createElement("span");
        small.className = "cursor-pill__note";
        small.textContent = note;
        pill.appendChild(small);
      }
      if (!current && gsap.getProperty(pill, "scale") < 0.05) gsap.set(pill, { x: e.clientX, y: e.clientY });
      current = el;
      side(e.clientX);
      cursor.pill = true;
      gsap.to(pill, { scale: 1, autoAlpha: 1, duration: reduceMotion ? 0 : 0.55, ease: "back.out(2.2)", overwrite: "auto" });
    }
    function hide() {
      if (!current) return;
      current = null;
      cursor.pill = false;
      gsap.to(pill, { scale: 0, autoAlpha: 0, skewX: 0, duration: reduceMotion ? 0 : 0.3, ease: "power3.in", overwrite: "auto" });
    }
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType === "mouse") show(e.target.closest("[data-cursor-pill]"), e);
    });
    document.documentElement.addEventListener("pointerleave", hide);
  }

  /* =========================================================
     Case study cards: the whole row opens the project.
     The title link stays the keyboard / screen-reader target.
     ========================================================= */
  function setupCardLinks() {
    document.querySelectorAll("[data-href]").forEach((card) => {
      const open = (newTab) => {
        if (newTab || card.hasAttribute("data-external")) window.open(card.dataset.href, "_blank", "noopener");
        else location.href = card.dataset.href;
      };
      card.addEventListener("click", (e) => {
        if (card.hasAttribute("data-hold")) return;          // hold-to-open cards open themselves (setupLiquidNav)
        if (e.target.closest("a, button")) return;           // real links handle themselves
        if (String(window.getSelection())) return;           // let people select text
        open(e.metaKey || e.ctrlKey || e.shiftKey);
      });
      card.addEventListener("auxclick", (e) => {
        if (e.button === 1 && !e.target.closest("a, button")) open(true);
      });
    });
  }

  /* =========================================================
     Cursor trail: a short tapered tail that stretches behind the
     pointer while it moves and retracts into it when it stops
     ========================================================= */
  function setupCursorTrail() {
    if (reduceMotion || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.className = "cursor-trail";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const COUNT = 14;       // segments in the tail
    const HEAD = 4;         // head radius in px
    const FOLLOW = 0.42;    // how tightly each segment chases the one ahead
    const pts = Array.from({ length: COUNT }, () => ({ x: -100, y: -100 }));
    const mouse = { x: -100, y: -100 };
    let alpha = 0, seen = false, drawn = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      mouse.x = e.clientX; mouse.y = e.clientY;
      if (!seen) { pts.forEach((p) => { p.x = mouse.x; p.y = mouse.y; }); seen = true; }
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { seen = false; alpha = 0; });

    gsap.ticker.add(() => {
      if (!seen && !drawn) return;

      pts[0].x += (mouse.x - pts[0].x) * 0.6;
      pts[0].y += (mouse.y - pts[0].y) * 0.6;
      for (let i = 1; i < COUNT; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * FOLLOW;
        pts[i].y += (pts[i - 1].y - pts[i].y) * FOLLOW;
      }

      // Visible only while the tail is stretched out, and never alongside the pill
      const tail = Math.hypot(pts[0].x - pts[COUNT - 1].x, pts[0].y - pts[COUNT - 1].y);
      const target = seen && !cursor.pill ? Math.min(1, tail / 40) : 0;
      alpha += (target - alpha) * 0.2;

      ctx.clearRect(0, 0, innerWidth, innerHeight);
      drawn = alpha > 0.01;
      if (!drawn) return;

      ctx.globalAlpha = alpha;
      ctx.strokeStyle = ctx.fillStyle = "#fff";
      ctx.lineCap = "round";
      for (let i = 0; i < COUNT - 1; i++) {
        ctx.lineWidth = HEAD * 2 * (1 - i / COUNT);
        ctx.beginPath();
        ctx.moveTo(pts[i].x, pts[i].y);
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
        ctx.stroke();
      }
    });
  }

  /* =========================================================
     Testimonials: seamless auto-scroll loop
     Cards are cloned so the strip can wrap without a jump.
     Hover, drag or an arrow/inertia glide takes over; the loop
     resumes from wherever the user left it.
     ========================================================= */
  function setupAutoScroll(track) {
    if (!track || reduceMotion) return;
    const SPEED = 40; // px per second

    const originals = [...track.children];
    for (let k = 0; k < 2; k++) {
      originals.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      });
    }

    let loopWidth = 0;
    const measure = () => { loopWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft; };
    measure();
    window.addEventListener("resize", measure);
    document.fonts.ready.then(measure);

    let hover = false, visible = false, pos = track.scrollLeft;
    track.addEventListener("pointerenter", () => (hover = true));
    track.addEventListener("pointerleave", () => (hover = false));
    track.addEventListener("focusin", () => (hover = true));
    track.addEventListener("focusout", () => (hover = false));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(track);

    // Liquid stop: speed eases toward its target like moving through thick liquid,
    // and the change in speed leans the cards (a damped spring), so a hover makes the
    // strip glide to a halt with a jelly wobble, and leaving eases it back up.
    const cards = [...track.children];
    let speed = SPEED;               // current px/s
    let lean = 0, leanV = 0;         // skew spring (deg, deg/s)
    let leanShown = 0;
    gsap.ticker.add((time, dt) => {
      if (!visible || !loopWidth) return;
      const step = Math.min(dt, 50) / 1000;
      const grabbed = track.classList.contains("is-dragging") || gsap.isTweening(track);
      if (grabbed) { pos = track.scrollLeft; speed = 0; return; }

      const target = hover ? 0 : SPEED;
      const prev = speed;
      speed += (target - speed) * (1 - Math.exp(-step * 3.2));   // ~0.6s viscous ease
      const accel = (speed - prev) / step;                        // px/s²

      // Spring: slowing down pushes the cards forward (content moves left, so the
      // tops lean left = positive skewX); speeding up leans them back. Then it settles.
      const push = gsap.utils.clamp(-4, 4, -accel * 0.028);       // target lean in degrees
      leanV += (70 * (push - lean) - 6 * leanV) * step;          // underdamped → a little wobble
      lean += leanV * step;
      const shown = Math.round(lean * 100) / 100;
      if (shown !== leanShown) {
        leanShown = shown;
        for (const c of cards) c.style.transform = shown ? `skewX(${shown}deg)` : "";
      }

      if (hover && speed < 0.5) { pos = track.scrollLeft; return; } // stopped: let people scroll it by hand
      pos += speed * step;
      if (pos >= loopWidth) pos -= loopWidth;
      if (pos < 0) pos += loopWidth;
      track.scrollLeft = pos;
    });
  }

  /* =========================================================
     Jelly lean for a horizontal track: text leans with the track's
     scroll speed (lags behind while moving, springs back with a little
     wobble when it stops). Images get the matching bend in the shader.
     ========================================================= */
  function setupTrackJelly(track, textSelector) {
    if (!track || reduceMotion) return;
    const els = [...track.querySelectorAll(textSelector)];
    let last = track.scrollLeft, v = 0, lean = 0, leanV = 0, shown = 0;
    gsap.ticker.add((time, dt) => {
      const step = Math.min(dt, 50) / 1000;
      const sl = track.scrollLeft;
      v += ((sl - last) / step - v) * (1 - Math.exp(-step * 10)); // smoothed px/s
      last = sl;
      const target = gsap.utils.clamp(-4, 4, -v * 0.005);        // top trails the motion
      leanV += (45 * (target - lean) - 9 * leanV) * step;       // soft, well-damped settle
      lean += leanV * step;
      const next = Math.round(lean * 100) / 100;
      if (next === shown) return;
      shown = next;
      for (const el of els) el.style.transform = shown ? `skewX(${shown}deg)` : "";
    });
  }

  /* =========================================================
     Liquid sounds (synthesised with Web Audio, no files)
     Hover:
     - "bubble": case studies / project cards (deep, double plop)
     - "drop":   links + buttons (single drip)
     - "tick":   tool chips (tiny high plink)
     Music: a looping lofi track (mp3/Lofi BGM.mp3) under the same switch.
     It fades in/out, pauses with the tab, and carries its position across
     pages within the session.
     Browsers keep audio locked until the first click or key press.
     Muted state is remembered per visitor; "M" toggles it too.
     ========================================================= */
  function setupSound() {
    const toggle = document.querySelector("[data-sound-toggle]");
    if (lite && toggle) { toggle.hidden = true; return; }                // the light version skips the music download
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!toggle || !AC) { if (toggle) toggle.hidden = true; return; }

    const KEY = "jrp-sound";
    // a page shown inside the homepage (the case study promoted after a burst) uses the homepage's
    // sound: its audio is already unlocked and its music already playing
    let host = null;
    try { if (window.top !== window && window.top.jrpSound) host = window.top.jrpSound; } catch (e) {}
    let enabled = true;
    try { enabled = localStorage.getItem(KEY) !== "off"; } catch (e) {}

    let ac = null, master = null, noise = null, lastAt = 0;
    const rand = (a, b) => a + Math.random() * (b - a);

    function unlock() {
      if (!ac) {
        ac = new AC();
        master = ac.createGain();
        master.gain.value = 0.3;

        // Dry path, softened so the highs never get shrill
        const soften = ac.createBiquadFilter();
        soften.type = "lowpass";
        soften.frequency.value = 4200;
        master.connect(soften).connect(ac.destination);

        // Wet path: a short generated room so drops ring like they hit water in a sink
        const room = ac.createConvolver();
        room.buffer = impulse(1.1, 3.2);
        const wet = ac.createGain();
        wet.gain.value = 0.22;
        master.connect(room).connect(wet).connect(ac.destination);

        // Shared white noise for the splash transient
        noise = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

        ac.addEventListener("statechange", render); // keep the switch honest about locked/unlocked
      }
      return ac.state === "suspended" ? ac.resume() : Promise.resolve();
    }
    // Browsers only let audio start after a click/tap/key press on *this* page — a new page
    // (e.g. after navigating) starts locked, so unlock on the very first gesture.
    // Until then the switch shows "off"; if that first gesture is on the switch (or "M"),
    // it should turn sound on rather than flip it off, so remember when it happened.
    let unlockedAt = -Infinity;
    const isLocked = () => (host ? host.locked : enabled && !(ac && ac.state === "running"));
    const onGesture = (e) => {
      if (!enabled) return;
      if (isLocked()) unlockedAt = e.timeStamp;
      unlock().then(render, render);
      startMusic();
    };
    const isUnlockGesture = (e) => e.timeStamp - unlockedAt < 1000;
    ["pointerdown", "mousedown", "click", "keydown", "touchend"].forEach((ev) =>
      window.addEventListener(ev, onGesture, { passive: true, capture: true }));

    function impulse(seconds, decay) {
      const len = ac.sampleRate * seconds;
      const buf = ac.createBuffer(2, len, ac.sampleRate);
      for (let c = 0; c < 2; c++) {
        const ch = buf.getChannelData(c);
        for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
      return buf;
    }

    /* One water drop. A falling drop traps an air bubble that rings as a
       sine whose pitch shoots upward as it collapses, plus a tiny splash. */
    function drip({ f0, len, level, delay = 0, rise = 2.6, pan = rand(-0.35, 0.35) }) {
      const t = ac.currentTime + delay;
      const out = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
      if (out.pan) out.pan.value = pan;
      out.connect(master);

      const osc = ac.createOscillator();
      const amp = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(f0 * rise, t + len * 0.45);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(level, t + 0.004);
      amp.gain.exponentialRampToValueAtTime(level * 0.35, t + len * 0.4);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
      osc.connect(amp).connect(out);
      osc.start(t);
      osc.stop(t + len + 0.03);

      const splash = ac.createBufferSource();
      splash.buffer = noise;
      const hp = ac.createBiquadFilter();
      hp.type = "bandpass";
      hp.frequency.value = f0 * 4;
      hp.Q.value = 1.2;
      const sg = ac.createGain();
      sg.gain.setValueAtTime(level * 0.25, t);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
      splash.connect(hp).connect(sg).connect(out);
      splash.start(t);
      splash.stop(t + 0.02);
    }

    const VOICES = {
      bubble() {
        const f = rand(230, 290);
        drip({ f0: f, len: 0.24, level: 0.6, rise: 3 });
        drip({ f0: f * 1.7, len: 0.11, level: 0.25, delay: 0.085 });
      },
      drop() { drip({ f0: rand(620, 820), len: 0.13, level: 0.5 }); },
      tick() { drip({ f0: rand(1150, 1400), len: 0.07, level: 0.3, rise: 2 }); },
    };

    const ready = () => enabled && ac && ac.state === "running" && !document.hidden;

    function play(kind) {
      if (host) { host.play(kind); return; }
      if (!ready()) return;
      const now = performance.now();
      if (now - lastAt < 70) return; // no machine-gunning across dense rows
      lastAt = now;
      VOICES[kind]();
    }

    /* ---- Background music ---- */
    const MUSIC_VOL = 0.22;
    const MUSIC_POS = "jrp-bgm-t";
    const music = new Audio();
    music.loop = true;
    music.preload = "none";      // muted visitors never download it
    music.volume = 0;
    let musicSrcSet = false, musicWanted = false, musicPlaying = false;
    // Track real playback: a blocked autoplay attempt on load can leave play() pending with
    // paused === false, which used to make the first click think music was already on.
    music.addEventListener("playing", () => { musicPlaying = true; });
    music.addEventListener("pause", () => { musicPlaying = false; });

    function startMusic() {
      if (host) return;                                                  // the homepage's music carries on
      musicWanted = true;
      if (!enabled || document.hidden) return;
      if (!musicSrcSet) {
        music.src = SITE_ROOT + "mp3/" + encodeURIComponent("Lofi BGM.mp3");
        musicSrcSet = true;
        // carry on from where the previous page left off
        let t = 0;
        try { t = parseFloat(sessionStorage.getItem(MUSIC_POS)) || 0; } catch (e) {}
        if (t) music.addEventListener("loadedmetadata", () => { music.currentTime = t % (music.duration || Infinity); }, { once: true });
      }
      if (musicPlaying) return;
      music.play().then(() => {
        if (enabled) gsap.to(music, { volume: MUSIC_VOL, duration: 2.4, ease: "power1.out", overwrite: true });
      }).catch(() => {}); // still locked: the first gesture calls startMusic again
    }
    function stopMusic(pauseAfter = true) {
      gsap.to(music, {
        volume: 0, duration: 0.8, ease: "power1.in", overwrite: true,
        onComplete: () => { if (pauseAfter) music.pause(); },
      });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { gsap.killTweensOf(music); music.pause(); }
      else if (enabled && musicWanted) { music.volume = 0; startMusic(); }
    });
    window.addEventListener("pagehide", () => {
      try { if (musicSrcSet) sessionStorage.setItem(MUSIC_POS, String(music.currentTime)); } catch (e) {}
    });

    // First matching rule wins, so cards beat the generic link rule
    const RULES = [
      [".tool", "tick"],
      ["[data-href], .ai-card", "bubble"],
      ["a, button", "drop"],
    ];
    let current = null;
    document.addEventListener("pointerover", (e) => {
      if (e.pointerType !== "mouse") return;
      let hit = null, kind = null;
      for (const [sel, k] of RULES) {
        const el = e.target.closest(sel);
        if (el) { hit = el; kind = k; break; }
      }
      if (hit === current) return;
      const backOut = hit && current && hit.contains(current); // e.g. tool chip → its card
      current = hit;
      if (hit && hit !== toggle && !backOut) play(kind);
    });

    // While the browser holds audio back, show the muted state; the wave appears once it can play
    function render() {
      const locked = isLocked();
      const audible = enabled && !locked;
      toggle.setAttribute("aria-pressed", String(audible));
      toggle.classList.toggle("is-waiting", locked);
      toggle.querySelector(".sound-toggle__label").textContent =
        audible ? "Sound on" : locked ? "Click for sound" : "Sound off";
      toggle.title = locked ? "Click anywhere to turn on music and sounds" : "Music and sounds (M)";
    }
    function set(on) {
      if (host) { host.set(on); enabled = on; render(); return; }
      enabled = on;
      try { localStorage.setItem(KEY, on ? "on" : "off"); } catch (e) {}
      render();
      if (on) { unlock().then(() => VOICES.drop()); startMusic(); }
      else stopMusic();
    }
    toggle.addEventListener("click", (e) => { if (!isUnlockGesture(e)) set(!enabled); });
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() !== "m" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest("input, textarea, [contenteditable]")) return;
      if (!isUnlockGesture(e)) set(!enabled);
    });
    /* The bubble: a swell while it grows (its skin tightening: a rising tone and a breath of air),
       a pop when it bursts (the film snapping, the pitch falling, a spray of tiny drops), and the
       same run backwards when you come back to the page. */
    function swell(dur, down = false) {
      if (!ready()) return null;
      const t = ac.currentTime;
      const out = ac.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(down ? 0.32 : 0.05, t + (down ? 0.08 : 0.15));
      out.gain.exponentialRampToValueAtTime(down ? 0.05 : 0.34, t + dur);
      const lp = ac.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(down ? 2600 : 380, t);
      lp.frequency.exponentialRampToValueAtTime(down ? 380 : 2600, t + dur);
      lp.Q.value = 2.2;
      out.connect(lp).connect(master);
      const [fa, fb] = down ? [520, 150] : [150, 520];
      const oscs = [["sine", 1, 0.5], ["triangle", 1.5, 0.18], ["sine", 2.01, 0.12]].map(([type, mul, lvl]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type;
        o.frequency.setValueAtTime(fa * mul, t);
        o.frequency.exponentialRampToValueAtTime(fb * mul, t + dur);
        g.gain.value = lvl;
        o.connect(g).connect(out);
        o.start(t);
        return o;
      });
      // air moving: noise through a band that sweeps with the tone
      const air = ac.createBufferSource();
      const buf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      air.buffer = buf; air.loop = true;
      const bp = ac.createBiquadFilter();
      bp.type = "bandpass"; bp.Q.value = 3;
      bp.frequency.setValueAtTime(down ? 3200 : 600, t);
      bp.frequency.exponentialRampToValueAtTime(down ? 600 : 3200, t + dur);
      const ag = ac.createGain(); ag.gain.value = 0.16;
      air.connect(bp).connect(ag).connect(out);
      air.start(t);
      const end = (fade) => {
        const n = ac.currentTime;
        out.gain.cancelScheduledValues(n);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), n);
        out.gain.exponentialRampToValueAtTime(0.0001, n + fade);
        oscs.forEach((o) => o.stop(n + fade + 0.05));
        air.stop(n + fade + 0.05);
      };
      const timer = setTimeout(() => end(0.12), dur * 1000 + 40);
      return { stop(fade = 0.15) { clearTimeout(timer); end(fade); } };
    }
    function pop() {
      if (!ready()) return;
      const t = ac.currentTime;
      // the film snapping: a bright, very short crack
      const crack = ac.createBufferSource();
      crack.buffer = noise;
      const hp = ac.createBiquadFilter();
      hp.type = "highpass"; hp.frequency.value = 1400;
      const cg = ac.createGain();
      cg.gain.setValueAtTime(0.9, t);
      cg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      crack.connect(hp).connect(cg).connect(master);
      crack.start(t); crack.stop(t + 0.06);
      // the body of it: a pitch that drops away
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(980, t);
      o.frequency.exponentialRampToValueAtTime(140, t + 0.16);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.7, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.25);
      // the spray landing: a scatter of tiny drops
      for (let i = 0; i < 9; i++) drip({ f0: rand(1300, 2700), len: rand(0.04, 0.08), level: rand(0.08, 0.18), delay: 0.03 + i * rand(0.02, 0.05), rise: 1.8 });
    }
    function unpop() {
      if (!ready()) return;
      // backwards: the drops gather first, then the bubble closes with a soft plop
      for (let i = 0; i < 7; i++) drip({ f0: rand(1300, 2400), len: 0.06, level: rand(0.06, 0.14), delay: i * 0.035, rise: 1.6 });
      drip({ f0: 260, len: 0.26, level: 0.55, delay: 0.32, rise: 3 });
    }
    if (!host) {
      window.jrpSound = {
        play: (kind) => play(kind),
        set: (on) => set(on),
        get locked() { return isLocked(); },
        swell, pop, unpop,
      };
    }

    render();
    // Try straight away: some browsers allow it (e.g. Chrome for sites you use often).
    // If not, the switch reads "Click for sound" until the first gesture unlocks it.
    if (enabled) { unlock().then(render, render); startMusic(); }
  }

  /* =========================================================
     Full-page lens (Lusion-style): text, rules and images all bend.
     A viewport-sized overlay runs an SVG displacement filter through
     backdrop-filter, so everything behind it is warped by one lens
     that stays aligned to the screen. Zero at rest (crisp text, exact
     clicks); strength follows scroll speed. Chromium only — other
     browsers keep the WebGL images-only lens. Returns true when active.
     ========================================================= */
  function setupPageLens() {
    const chromium = !!(navigator.userAgentData && navigator.userAgentData.brands.some((b) => /Chromium/.test(b.brand)));
    if (!chromium || reduceMotion || !lenis || document.body.dataset.lens === "off") return false;
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return false;

    const MAX = 150;          // px of displacement at the rim during a fast scroll
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML = `
      <filter id="page-lens" x="0" y="0" filterUnits="userSpaceOnUse" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feImage x="0" y="0" preserveAspectRatio="none" result="map" />
        <feDisplacementMap in="SourceGraphic" in2="map" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>`;
    document.body.appendChild(svg);
    const filter = svg.querySelector("filter");
    const feImage = svg.querySelector("feImage");
    const disp = svg.querySelector("feDisplacementMap");

    const layer = document.createElement("div");
    layer.className = "lens-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    // Displacement map: each pixel points outward by r², so sampling inward (negative
    // scale) stretches content near the rim outward like a bulging lens. Sampling stays
    // inside the viewport, so the edges never pull in empty space.
    function buildMap() {
      const W = window.innerWidth, H = window.innerHeight, a = W / H;
      const mw = Math.round(W / 4), mh = Math.round(H / 4);
      const cv = document.createElement("canvas");
      cv.width = mw; cv.height = mh;
      const ctx = cv.getContext("2d");
      const img = ctx.createImageData(mw, mh);
      for (let y = 0; y < mh; y++) {
        for (let x = 0; x < mw; x++) {
          const nx = (x / (mw - 1)) * 2 - 1, ny = (y / (mh - 1)) * 2 - 1;
          const r2 = (nx * nx * a * a + ny * ny) / (a * a + 1);
          const i = (y * mw + x) * 4;
          img.data[i] = 128 + 127 * nx * r2;
          img.data[i + 1] = 128 + 127 * ny * r2;
          img.data[i + 2] = 128;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      feImage.setAttribute("href", cv.toDataURL());
      for (const el of [filter, feImage]) { el.setAttribute("width", W); el.setAttribute("height", H); }
    }
    buildMap();
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(buildMap, 150); });

    let strength = 0, applied = -1, on = false;
    gsap.ticker.add(() => {
      const target = Math.min(1, Math.abs(lenis.velocity) / 40);
      strength += (target - strength) * 0.08;
      if (strength < 0.004) strength = 0;
      const scale = Math.round(-MAX * strength);
      if (scale === applied) return;
      applied = scale;
      disp.setAttribute("scale", scale);
      const want = scale !== 0;   // skip the filter entirely at rest
      if (want !== on) { on = want; layer.classList.toggle("is-on", on); }
    });
    return true;
  }

  /* =========================================================
     Carousel arrows
     ========================================================= */
  function setupCarousel() {
    const track = document.querySelector("[data-carousel]");
    const prev = document.querySelector("[data-carousel-prev]");
    const next = document.querySelector("[data-carousel-next]");
    if (!track) return;

    const step = () => {
      const card = track.firstElementChild;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max;
    };
    const go = (dir) => {
      // Aim inside the scrollable range: overshooting the end made the glide hit the wall
      const max = track.scrollWidth - track.clientWidth;
      const to = gsap.utils.clamp(0, max, Math.round(track.scrollLeft + dir * step()));
      // Gentle at both ends: speed builds and fades gradually, so the glide (and the
      // text lean that follows its speed) settles instead of braking
      gsap.to(track, { scrollLeft: to, duration: reduceMotion ? 0 : 1.5, ease: "power2.inOut", overwrite: true });
    };
    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* Mouse drag with inertial glide (touch keeps native scrolling) */
  function setupDragScroll(track) {
    let down = false, moved = false, startX = 0, startScroll = 0, lastX = 0, lastT = 0, v = 0;

    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false;
      startX = lastX = e.clientX; startScroll = track.scrollLeft; lastT = performance.now(); v = 0;
      gsap.killTweensOf(track);
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add("is-dragging"); }
      if (!moved) return;
      track.scrollLeft = startScroll - dx;
      const now = performance.now();
      v = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX; lastT = now;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      requestAnimationFrame(() => track.classList.remove("is-dragging"));
      const max = track.scrollWidth - track.clientWidth; // glide into the end softly, never into a wall
      gsap.to(track, { scrollLeft: gsap.utils.clamp(0, max, track.scrollLeft - v * 480), duration: 1.9, ease: "expo.out" });
    });
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
    track.addEventListener("dragstart", (e) => e.preventDefault());
  }

  /* =========================================================
     Three.js stage
     ========================================================= */
  function createLiquidStage() {
    const canvas = document.querySelector(".liquid-stage");
    const nodes = [...document.querySelectorAll("[data-liquid]")];

    // CSS gradient backdrop (shown while media loads, or if WebGL is unavailable)
    nodes.filter((n) => n.dataset.colors).forEach((n) => {
      const [a, b, c, d] = n.dataset.colors.split(",");
      n.style.background =
        `radial-gradient(90% 70% at 100% 0%, ${b}, transparent 70%),` +
        `radial-gradient(80% 60% at 0% 100%, ${c}, transparent 70%),` +
        `radial-gradient(80% 60% at 100% 100%, ${d}, transparent 70%), ${a}`;
    });

    if (!window.THREE || !nodes.length || lite) return null;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch (err) {
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));   // photos and video don't gain from more; it halves the fill cost on Retina
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
    const geometry = new THREE.PlaneGeometry(1, 1, 40, 40);
    const loader = new THREE.TextureLoader();

    const pointer = { x: -9999, y: -9999 };
    const state = { velocity: 0 };
    const waterU = {                       // shared by every plane and the surface
      uWater: { value: null },
      uWaterOn: { value: 0 },
      uWaterTexel: { value: new THREE.Vector2(1 / 288, 1 / 180) },
      uView: { value: new THREE.Vector3(innerWidth, innerHeight, renderer.getPixelRatio()) },
    };
    // Fish-eye lens (Lusion-style): shared by every plane. Faint at rest, swells with scroll speed.
    // Pages can opt out with data-lens="off" on <body>.
    const LENS_REST = 0.03, LENS_SCROLL = 0.22;
    // When the full-page lens runs (Chromium), it already bends the canvas — don't bend twice
    const lensOff = false;  // the ball lens (setupBallLens) drives it
    const lens = { value: BALL.value };
    const aspect = { value: window.innerWidth / window.innerHeight };
    const items = [];

    const CROPS = {
      // About: cover the box, zoomed 1.2058×, anchored right and centred vertically. Expressed as
      // a rule (not fixed numbers) so the framing holds at any box shape, e.g. full screen
      about: { zoom: 1.2058, ax: 1, ay: 0.5 },
      lead: { x: -0.019, y: 0, w: 1.1489, h: 1 },
    };

    nodes.forEach((el) => {
      const type = el.dataset.liquid;
      const uniforms = {
        uTime: { value: 0 },
        uSize: { value: new THREE.Vector2(1, 1) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uVelocity: { value: 0 },
        uHVel: { value: 0 },   // this plane's own sideways speed (px/frame, smoothed)
        uReveal: { value: reduceMotion ? 1 : 0 },
        uSeed: { value: Math.random() * 100 },
        // Scroll stories drive these; neutral defaults so nothing is ever stuck hidden
        uFade: { value: 1 },
        uGlitch: { value: 0 },   // the About photo's screen treatment
        uBubbleOn: { value: 0 }, uDrop: { value: 0 }, uPop: { value: 0 },   // hold to open (setupLiquidNav)
        uBub: { value: new THREE.Vector4(0, 0, 1, 1) }, uRound: { value: 0 }, uPicAsp: { value: 1 }, uHoleC: { value: new THREE.Vector2() }, uSpray: { value: 1 },
        uHold: { value: new THREE.Vector2(0.5, 0.5) }, uDome: { value: 0 },
        uSubmerge: { value: 0 },
        uSurface: { value: 0 },
        uWave: { value: 0 },
        uLens: lens,      // shared uniform objects: one update drives every plane
        uAspect: aspect,
        uWater: waterU.uWater, uWaterOn: waterU.uWaterOn, uWaterTexel: waterU.uWaterTexel, uView: waterU.uView,
      };

      let fragmentShader;
      if (type === "gradient") {
        const cols = el.dataset.colors.split(",").map(hexToVec3);
        uniforms.uC0 = { value: cols[0] };
        uniforms.uC1 = { value: cols[1] };
        uniforms.uC2 = { value: cols[2] };
        uniforms.uC3 = { value: cols[3] };
        fragmentShader = GRADIENT_FRAG;
      } else {
        uniforms.uTex = { value: null };
        uniforms.uCrop = { value: new THREE.Vector4(0, 0, 1, 1) };
        fragmentShader = IMAGE_FRAG;
      }

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERT,
        fragmentShader,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      scene.add(mesh);

      // data-crop is a named preset or Figma-style "left,top,width,height" fractions of the box
      const cropAttr = el.dataset.crop;
      let crop = CROPS[cropAttr];
      if (!crop && cropAttr && cropAttr.includes(",")) {
        const [x, y, w, h] = cropAttr.split(",").map(Number);
        crop = { x, y, w, h };
      }
      const item = { el, type, mesh, uniforms, ready: type === "gradient", img: null, crop };
      items.push(item);

      if (type === "gradient") {
        el.classList.add("is-gl");
      } else if (type === "video") {
        const video = el.querySelector("video");
        item.video = video;
        const tex = new THREE.VideoTexture(video);
        tex.minFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        uniforms.uTex.value = tex;
        video.addEventListener("loadeddata", () => {
          item.natural = { w: video.videoWidth, h: video.videoHeight };
          item.ready = true;
          el.classList.add("is-gl");
        }, { once: true });
        // Only decode while on screen
        new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting) {
            if (reduceMotion) { if (video.readyState === 0) video.load(); }
            else video.play().catch(() => {});
          } else video.pause();
        }, { rootMargin: "200px 0px" }).observe(el);
      } else {
        const img = el.querySelector("img");
        item.img = img;
        loader.load(img.currentSrc || img.src, (tex) => {
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          item.natural = { w: tex.image.width, h: tex.image.height };
          // Cap texture width: case studies upload many large screenshots and
          // full-size textures can exhaust GPU memory (planes then draw blank)
          const MAX_TEX = 1600;
          if (tex.image.width > MAX_TEX) {
            const k = MAX_TEX / tex.image.width;
            const cv = document.createElement("canvas");
            cv.width = MAX_TEX;
            cv.height = Math.round(tex.image.height * k);
            cv.getContext("2d").drawImage(tex.image, 0, 0, cv.width, cv.height);
            tex.image = cv;
            tex.needsUpdate = true;
          }
          uniforms.uTex.value = tex;
          item.ready = true;
          el.classList.add("is-gl");
        });
      }

      // Hover is owned by the nearest interactive parent so the whole card reacts.
      // A page (or block) can opt out with data-liquid-hover="off" — reveal and scroll wobble remain.
      if (!el.closest('[data-liquid-hover="off"]')) {
        const hoverTarget = el.closest("[data-href], .ai-card, a") || el;
        hoverTarget.addEventListener("pointerenter", () =>
          gsap.to(uniforms.uHover, { value: 1, duration: 1.1, ease: "expo.out", overwrite: true }));
        hoverTarget.addEventListener("pointerleave", () =>
          gsap.to(uniforms.uHover, { value: 0, duration: 1.4, ease: "expo.out", overwrite: true }));
      }

      // Reveal: noisy liquid wipe when the element scrolls in (scroll stories run their own entrance)
      if (el.hasAttribute("data-story-media")) uniforms.uReveal.value = 1;
      else if (!reduceMotion) {
        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: () => gsap.to(uniforms.uReveal, { value: 1, duration: 1.8, ease: "power3.out" }),
        });
      }
    });

    window.addEventListener("pointermove", (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.left = 0; camera.right = w; camera.top = 0; camera.bottom = -h;
      camera.updateProjectionMatrix();
      aspect.value = w / h;
    }
    resize();
    window.addEventListener("resize", resize);

    /* ---------- Water ----------
       A real wave simulation (ping-pong half-float targets, ~290 cells across) that the
       planes float on. Idle (and free) until something lands; it sleeps again once calm. */
    const water = createWater();

    // caustic light near the surface (homepage): at the top, and again as you resurface at the end
    const causticU = { uTime: { value: 0 }, uAmount: { value: 0 }, uRes: { value: new THREE.Vector2(innerWidth, innerHeight) } };
    const lowEnd = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
    const caustics = document.querySelector("#works .work") && !reduceMotion && !lowEnd ? new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      uniforms: causticU, vertexShader: PLAIN_VERT, fragmentShader: CAUSTIC_FRAG, transparent: true, depthTest: false, depthWrite: false,
    })) : null;
    if (caustics) { caustics.renderOrder = -2; caustics.visible = false; scene.add(caustics); }
    const surfaceness = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const y = window.scrollY;
      const top = 1 - Math.min(1, y / (innerHeight * 0.9));
      const end = max > 0 ? Math.max(0, 1 - (max - y) / (innerHeight * 1.1)) : 0;
      return Math.max(top, end);
    };
    function createWater() {
      if (!renderer.capabilities.isWebGL2) return null;
      const gl = renderer.getContext();
      if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float")) return null;
      const SW = 288;
      const opts = { type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, stencilBuffer: false };
      let SH = 0, rtA = null, rtB = null;
      const simU = {
        uPrev: { value: null }, uTexel: { value: new THREE.Vector2() },
        uDrop: { value: new THREE.Vector4() }, uRect: { value: new THREE.Vector4() },
        uRectAmt: { value: 0 }, uShift: { value: 0 }, uAspect: aspect, uDamp: { value: 0.9925 },
      };
      const simScene = new THREE.Scene();
      const simCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      simScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: simU, vertexShader: SIM_VERT, fragmentShader: SIM_FRAG })));
      const surf = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        uniforms: { uWater: waterU.uWater, uWaterTexel: waterU.uWaterTexel },
        vertexShader: PLAIN_VERT, fragmentShader: SURF_FRAG, transparent: true, depthTest: false, depthWrite: false,
      }));
      surf.renderOrder = -1;            // under the pictures
      surf.visible = false;
      scene.add(surf);

      function alloc() {
        const h = Math.max(2, Math.round(SW * innerHeight / innerWidth));
        if (h === SH && rtA) return;
        SH = h;
        if (rtA) { rtA.dispose(); rtB.dispose(); }
        rtA = new THREE.WebGLRenderTarget(SW, SH, opts);
        rtB = new THREE.WebGLRenderTarget(SW, SH, opts);
        simU.uTexel.value.set(1 / SW, 1 / SH);
        waterU.uWaterTexel.value.set(1 / SW, 1 / SH);
        clear();
      }
      function clear() {
        const prev = renderer.getRenderTarget();
        [rtA, rtB].forEach((rt) => { renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); });
        renderer.setRenderTarget(prev);
        renderer.setClearColor(0x000000, 0);
      }
      alloc();
      window.addEventListener("resize", alloc);

      let awakeUntil = 0, shift = 0, muted = false;
      const drops = [], rects = [];
      const wake = () => {
        const now = performance.now();
        if (now > awakeUntil) clear();                 // start from a calm surface
        awakeUntil = now + 5200;
      };
      function step() {
        simU.uPrev.value = rtA.texture;
        renderer.setRenderTarget(rtB);
        renderer.render(simScene, simCam);
        const t = rtA; rtA = rtB; rtB = t;
      }
      return {
        // px point, radius px, strength (~0.02 a touch, ~0.2 a splash)
        drop(x, y, radius, strength) { if (muted) return; wake(); drops.push([x / innerWidth, 1 - y / innerHeight, radius / innerHeight, strength]); },
        // a DOM rect landing on the surface
        rect(r, strength) { if (muted) return; wake(); rects.push([(r.left + r.width / 2) / innerWidth, 1 - (r.top + r.height / 2) / innerHeight, r.width / 2 / innerWidth, r.height / 2 / innerHeight, strength]); },
        scroll(dy) { shift += dy; },
        quiet(on) { muted = on; if (on) { awakeUntil = 0; drops.length = 0; rects.length = 0; } },
        update() {
          if (performance.now() > awakeUntil) {
            shift = 0;
            if (surf.visible) { surf.visible = false; waterU.uWaterOn.value = 0; }
            return false;
          }
          const prev = renderer.getRenderTarget();
          for (let i = 0; i < 2; i++) {
            simU.uShift.value = i === 0 ? shift / innerHeight : 0;
            const d = i === 0 && drops.shift();
            simU.uDrop.value.set(d ? d[0] : 0, d ? d[1] : 0, d ? d[2] : 1, d ? d[3] : 0);
            const r = i === 0 && rects.shift();
            if (r) simU.uRect.value.set(r[0], r[1], r[2], r[3]);
            simU.uRectAmt.value = r ? r[4] : 0;
            step();
          }
          shift = 0;
          renderer.setRenderTarget(prev);
          waterU.uWater.value = rtA.texture;
          waterU.uWaterOn.value = 1;
          waterU.uView.value.set(innerWidth, innerHeight, renderer.getPixelRatio());
          surf.position.set(innerWidth / 2, -innerHeight / 2, 0);
          surf.scale.set(innerWidth, innerHeight, 1);
          surf.visible = true;
          return true;
        },
      };
    }

    function coverCrop(item, rw, rh) {
      if (item.crop && item.crop.zoom) {
        if (!item.natural) return { x: 0, y: 0, w: 1, h: 1 };
        const boxA = rw / rh, imgA = item.natural.w / item.natural.h;
        const cw = imgA > boxA ? imgA / boxA : 1, ch = imgA > boxA ? 1 : boxA / imgA;   // plain cover
        const w = cw * item.crop.zoom, h = ch * item.crop.zoom;
        return { x: item.crop.ax * (1 - w), y: item.crop.ay * (1 - h), w, h };       // anchored zoom
      }
      if (item.crop) return item.crop;
      if (!item.natural) return { x: 0, y: 0, w: 1, h: 1 };
      const boxA = rw / rh, imgA = item.natural.w / item.natural.h;
      if (imgA > boxA) { const w = imgA / boxA; return { x: -(w - 1) / 2, y: 0, w, h: 1 }; }
      const h = boxA / imgA; return { x: 0, y: -(h - 1) / 2, w: 1, h };
    }

    const vh = () => window.innerHeight;
    let lastScrollY = window.scrollY, lastSig = -1, cleared = false, frameNo = 0, draws = 0;
    gsap.ticker.add((time) => {
      if (root.classList.contains("is-modal")) return;                     // a modal covers the page: nothing to draw beneath it
      if (water) { water.scroll(window.scrollY - lastScrollY); }
      lastScrollY = window.scrollY;
      const wet = water ? water.update() : false;
      let lit = false;
      if (caustics) {
        const amt = surfaceness();
        lit = amt > 0.01;
        caustics.visible = lit;
        if (lit) {
          causticU.uAmount.value = amt;
          causticU.uTime.value = time;
          causticU.uRes.value.set(innerWidth, innerHeight);
          caustics.position.set(innerWidth / 2, -innerHeight / 2, 0);
          caustics.scale.set(innerWidth, innerHeight, 1);
        }
      }
      const target = lenis ? gsap.utils.clamp(-60, 60, lenis.velocity) : 0;
      state.velocity += (target - state.velocity) * 0.12;
      lens.value = BALL.value;                                              // one curve for pictures and text

      let any = false, live = false, playing = false, sig = 0;
      for (const it of items) {
        const r = it.el.getBoundingClientRect();
        const onScreen = it.ready && r.bottom > -100 && r.top < vh() + 100 && r.width > 0
          && r.right > -100 && r.left < innerWidth + 100;                   // sideways too: carousels, the Works strip
        it.mesh.visible = onScreen;
        if (!onScreen) { it.prevLeft = null; it.hvel = 0; continue; }
        any = true;

        it.mesh.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0);
        // Sideways speed (carousels): the sheet's middle lags behind like liquid
        const dx = it.prevLeft == null ? 0 : r.left - it.prevLeft;
        it.prevLeft = r.left;
        it.hvel = (it.hvel || 0) + (gsap.utils.clamp(-30, 30, dx) - (it.hvel || 0)) * 0.18;
        it.mesh.scale.set(r.width, r.height, 1);

        const u = it.uniforms;
        u.uTime.value = time;
        u.uSize.value.set(r.width, r.height);
        u.uVelocity.value = state.velocity;
        u.uHVel.value = u.uBubbleOn.value > 0.5 ? 0 : it.hvel;               // a bubble keeps its own shape

        const mx = (pointer.x - r.left) / r.width;
        const my = (pointer.y - r.top) / r.height;
        u.uMouse.value.x += (mx - u.uMouse.value.x) * 0.1;
        u.uMouse.value.y += (my - u.uMouse.value.y) * 0.1;

        // does this frame look any different from the last? (a still page needn't be redrawn)
        if (it.video && !it.video.paused) playing = true;                 // video alone needs only its own 30 fps
        if (it.type === "gradient" || u.uHover.value > 0.001 || u.uBubbleOn.value > 0.5 || u.uGlitch.value > 0.5
          || (u.uReveal.value > 0.001 && u.uReveal.value < 0.999) || Math.abs(state.velocity) > 0.02 || Math.abs(it.hvel) > 0.02) live = true;
        sig += r.left * 1.3 + r.top * 1.7 + r.width * 2.3 + r.height * 2.9 + u.uFade.value * 97 + u.uReveal.value * 89
          + u.uMouse.value.x * 31 + u.uMouse.value.y * 37 + u.uDome.value * 71;

        if (it.type !== "gradient") {
          const bub = u.uBubbleOn && u.uBubbleOn.value > 0.5;              // a bubble shows the picture at its own proportions
          const c = coverCrop(it, bub ? u.uPicAsp.value * 1000 : r.width, bub ? 1000 : r.height);
          u.uCrop.value.set(c.x, c.y, c.w, c.h);
        }
      }
      // redraw only when something moves: video, hover, scroll, reveals, water, light, the bubble, or any
      // change in a picture's place or state. Otherwise the last frame simply stays on screen.
      const changed = Math.abs(sig - lastSig) > 0.01;
      lastSig = sig;
      frameNo++;
      const onlyLight = lit && !wet && !(any && (live || changed));        // just the caustic light moving: half rate is plenty
      const onlyVideo = any && playing && !live && !changed && !wet && !lit; // only video frames changing: draw at the videos' 30 fps
      if ((onlyLight ? frameNo % 2 === 0 : (wet || lit)) || renderer.info.render.frame === 0 || (any && (live || changed)) || (onlyVideo && frameNo % 2 === 0)) { renderer.render(scene, camera); cleared = false; draws++; }
      else if (!any && !lit && !wet && !cleared) { renderer.clear(); cleared = true; }   // only when there's truly nothing to show
    });

    return {
      revealAll() { items.forEach((it) => (it.uniforms.uReveal.value = 1)); },
      items,
      // water: splash(x, y, radius, strength) in CSS px; land(el, strength) rings out from a box's edges
      splash(x, y, radius, strength) { if (water) water.drop(x, y, radius, strength); },
      quiet(on) { if (water) water.quiet(on); },
      frames() { return draws; },                                         // how many times the stage has drawn to screen (profiling)
      land(el, strength = 0.22) { if (water && el) water.rect(el.getBoundingClientRect(), strength); },
    };
  }

  function hexToVec3(hex) {
    const n = parseInt(hex.trim().replace("#", ""), 16);
    return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
  }

  /* ---------------- Shaders ---------------- */
  const NOISE = /* glsl */ `
    // Ashima 3D simplex noise
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
  `;

  const VERT = /* glsl */ `
    uniform float uVelocity;
    uniform float uHVel;
    uniform float uHover;
    uniform vec2 uMouse;
    uniform vec2 uSize;
    uniform float uLens;
    uniform float uBubbleOn;
    uniform float uAspect;
    uniform float uTime;
    uniform float uSubmerge;
    uniform float uSurface;
    varying vec2 vUv;
    void main(){
      vUv = uv;
      vec4 world = modelMatrix * vec4(position, 1.0);
      // Water: the whole sheet ripples, so its edges and corners wave too. Strongest under water,
      // kicked by the burst as it breaks the surface, flat once it is clear
      float burstAmp = sin(clamp(uSurface, 0.0, 1.0) * 3.14159265);
      float frontV = mix(-0.25, 1.25, 1.0 - uSubmerge);                                   // waterline, from the bottom up
      float subV = smoothstep(frontV - 0.22, frontV + 0.22, uv.y + sin(uv.x * 9.0 + uTime * 2.0) * 0.05);
      float wamp = 16.0 * subV * step(0.001, uSubmerge) + 6.0 * burstAmp;
      if (wamp > 0.01) {
        world.x += (sin(uv.y * 7.0 + uTime * 1.9) * 0.6 + sin(uv.y * 13.0 - uTime * 2.7 + uv.x * 3.0) * 0.4) * wamp;
        world.y += (sin(uv.x * 6.0 - uTime * 1.6) * 0.6 + sin(uv.x * 11.0 + uTime * 2.3 + uv.y * 4.0) * 0.4) * wamp;
      }
      // Scroll velocity bends the sheet: the middle lags behind like a liquid surface
      float bend = sin(uv.x * 3.14159265);
      world.y -= bend * uVelocity * 0.45;
      // Sideways motion (carousels) bends it the other way: the vertical middle trails
      world.x -= sin(uv.y * 3.14159265) * uHVel * 0.7;
      vec4 clip = projectionMatrix * viewMatrix * world;

      // The ball: rows away from the middle of the screen squeeze towards it and narrow as they
      // turn away, so things swell into the middle and curve off at the top and bottom (w = 1)
      float k = uLens * clip.y * clip.y * (1.0 - uBubbleOn);
      clip.x *= 1.0 - 0.55 * k;
      clip.y *= 1.0 - k;
      gl_Position = clip;
    }
  `;

  const REVEAL = /* glsl */ `
    // 0 → hidden, 1 → fully shown; wipes upward with a wobbly liquid edge
    float revealMask(vec2 top, float reveal, float seed, float t){
      float n = snoise(vec3(top.x * 3.0, top.y * 1.5, t * 0.6 + seed)) * 0.12;
      float h = (1.0 - top.y) + n;
      float edge = reveal * 1.35 - 0.12;
      return smoothstep(edge, edge - 0.08, h);
    }
  `;

  // Water (see createWater): planes sit on the surface. waterAt() returns the surface slope (xy) at this
  // pixel and how much it catches or turns from the light (z, 0 when calm).
  const WATER = /* glsl */ `
    uniform sampler2D uWater;
    uniform float uWaterOn;
    uniform vec2 uWaterTexel;
    uniform vec3 uView;      // viewport width, height (CSS px), pixel ratio
    vec3 waterAt(){
      if (uWaterOn < 0.5) return vec3(0.0);
      vec2 s = gl_FragCoord.xy / (uView.xy * uView.z);
      float l = texture2D(uWater, s - vec2(uWaterTexel.x, 0.0)).r, r = texture2D(uWater, s + vec2(uWaterTexel.x, 0.0)).r;
      float d = texture2D(uWater, s - vec2(0.0, uWaterTexel.y)).r, u = texture2D(uWater, s + vec2(0.0, uWaterTexel.y)).r;
      vec2 g = vec2(r - l, u - d);
      vec3 n = normalize(vec3(-g, 0.12));
      vec3 L = normalize(vec3(-0.45, 0.7, 0.62));
      return vec3(g, dot(n, L) - L.z);
    }
  `;
  // The simulation: height in r, its velocity in g. Classic wave equation on a grid, lightly damped.
  // uShift carries the surface along with the page while it scrolls.
  const SIM_VERT = /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
  `;
  const SIM_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uPrev;
    uniform vec2 uTexel;
    uniform vec4 uDrop;      // x, y (uv), radius (screen heights), strength
    uniform vec4 uRect;      // centre x, y, half width, half height (uv)
    uniform float uRectAmt;
    uniform float uShift;
    uniform float uAspect;
    uniform float uDamp;     // energy kept per step (lower = calmer, shorter ripples)
    varying vec2 vUv;
    float h(vec2 p){ return (p.y < 0.0 || p.y > 1.0) ? 0.0 : texture2D(uPrev, p).r; }
    void main(){
      vec2 p = vUv - vec2(0.0, uShift);
      vec4 info = (p.y < 0.0 || p.y > 1.0) ? vec4(0.0) : texture2D(uPrev, p);
      float avg = (h(p - vec2(uTexel.x, 0.0)) + h(p + vec2(uTexel.x, 0.0)) + h(p - vec2(0.0, uTexel.y)) + h(p + vec2(0.0, uTexel.y))) * 0.25;
      info.g += (avg - info.r) * 2.0;
      info.g *= uDamp;
      info.r += info.g;
      info.r *= 0.998;
      vec2 asp = vec2(uAspect, 1.0);
      if (uDrop.w != 0.0) {
        float f = max(0.0, 1.0 - length((vUv - uDrop.xy) * asp) / uDrop.z);
        info.r -= (0.5 - cos(f * 3.14159265) * 0.5) * uDrop.w;
      }
      if (uRectAmt != 0.0) {
        // a frame settling onto the water presses its edges in: the rings start as its outline
        float rad = 0.05;                                                   // rounded corners: the rings soon turn circular
        vec2 q = abs(vUv - uRect.xy) * asp - uRect.zw * asp + rad;
        float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rad;
        info.r -= exp(-sd * sd / 0.0009) * uRectAmt;                        // a wide, soft band: long smooth waves, no ringing
      }
      gl_FragColor = info;
    }
  `;
  // The loader's water: refracts the picture of the sheet and lights the slopes; a soft dip
  // where the sheet meets the open window
  const LOADER_WATER_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uWater;
    uniform sampler2D uContent;
    uniform vec2 uTexel;
    uniform float uSink;
    uniform vec4 uHole;      // window centre x, y (px, from the bottom), radius, edge strength
    uniform vec2 uRes;
    uniform sampler2D uInk;  // what the visitor has drawn on the water
    uniform vec4 uSwirl;     // whirlpool: centre x, y (px, from the bottom), reach (px), twist (radians)
    uniform vec4 uPond;      // pond ripple: centre x, y (px, from the bottom), time (s), strength 0..1
    varying vec2 vUv;
    // "Pond ripples": concentric rings whose crests interlock in a zigzag, twisting the surface around the
    // centre. Returns the offset (px) to look through, and writes the slope into sl for the shading.
    vec2 pond(vec2 p, out float sl, out float env){
      vec2 q = p - uPond.xy;
      float r = length(q);
      float a = atan(q.y, q.x);
      float R0 = max(uRes.x, uRes.y);
      // a train of rings running outward, fading with distance; the wavelength opens a little as they travel,
      // and a slow, low-order wobble keeps them from being perfect circles
      float front = uPond.z * 260.0;                                       // px the leading ring has travelled
      env = uPond.w * exp(-r / (R0 * 0.45)) * smoothstep(front + 40.0, front - 120.0, r) * smoothstep(0.0, 30.0, r);
      float lam = 38.0 + r * 0.035;
      float wob = 0.18 * sin(a * 3.0 + uPond.z * 0.6) + 0.1 * sin(a * 5.0 - r * 0.004);
      float ph = 6.28318 * (r / lam - uPond.z * 1.1) + wob;
      sl = cos(ph) * env;                                                  // the slope of the surface along the ring
      vec2 dir = r > 0.001 ? q / r : vec2(0.0);
      return dir * sin(ph) * 5.0 * env;                                    // a gentle lensing of what is underneath
    }
    void main(){
      float l = texture2D(uWater, vUv - vec2(uTexel.x, 0.0)).r, r = texture2D(uWater, vUv + vec2(uTexel.x, 0.0)).r;
      float d = texture2D(uWater, vUv - vec2(0.0, uTexel.y)).r, u = texture2D(uWater, vUv + vec2(0.0, uTexel.y)).r;
      vec2 g = vec2(r - l, u - d);
      // the whirlpool twists everything towards its centre, harder the closer it is
      vec2 q = vUv * uRes - uSwirl.xy;
      float k = 1.0 - smoothstep(0.0, max(uSwirl.z, 1.0), length(q));
      float ang = uSwirl.w * k * k;
      vec2 sp = uSwirl.xy + mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * q * (1.0 + 0.1 * uSwirl.w * k);
      vec2 suv = mix(vUv, sp / uRes, step(0.001, abs(uSwirl.w))) - g * 0.06;   // seen through the moving surface
      float psl = 0.0, penv = 0.0;
      vec2 poff = uPond.w > 0.001 ? pond(vUv * uRes, psl, penv) : vec2(0.0);
      suv += poff / uRes;
      vec3 base = texture2D(uContent, suv).rgb;
      if (penv > 0.0005) {
        // lit from the top left like the rest of the water: each ring is a soft bright side and a faint
        // shaded side, only where the slope faces towards / away from the light
        vec2 q = vUv * uRes - uPond.xy;
        vec2 dir = length(q) > 0.001 ? normalize(q) : vec2(0.0);
        float facing = dot(dir, normalize(vec2(-0.6, 0.8)));
        float sh = psl * facing;
        base *= 1.0 - max(-sh, 0.0) * 0.10;
        base += vec3(max(sh, 0.0) * 0.05);
        base = clamp(base, 0.0, 1.0);
      }      base = mix(base, vec3(0.0), texture2D(uInk, suv).a * 0.88);
      base = mix(base, vec3(1.0), uSink * 0.6);                      // and sinking as the water opens
      vec3 n = normalize(vec3(-g * 9.0, 1.0));
      vec3 L = normalize(vec3(-0.45, 0.65, 0.62));
      float lit = dot(n, L) - L.z;
      vec3 col = base * (1.0 + clamp(lit, -1.0, 0.0) * 0.85);
      float dh = length(vUv * uRes - uHole.xy) - uHole.z;
      if (uHole.z > 0.5) col *= 1.0 - 0.16 * exp(-max(dh, 0.0) / 16.0) * uHole.w;
      gl_FragColor = vec4(col, 1.0);
    }
  `;
  // Light through a moving surface, as on a pool floor: a soft net of light. On the white page the
  // cells read as faint shade and the lines as light. uAmount follows how near the surface you are.
  const CAUSTIC_FRAG = /* glsl */ `
    precision highp float;
    uniform float uTime;
    uniform float uAmount;
    uniform vec2 uRes;
    varying vec2 vUv;
    float caustic(vec2 uv, float t){
      vec2 p = mod(uv * 6.28318, 6.28318) - 250.0;
      vec2 i = p;
      float c = 1.0;
      for (int n = 0; n < 3; n++) {
        float t2 = t * (1.0 - (3.5 / float(n + 1)));
        i = p + vec2(cos(t2 - i.x) + sin(t2 + i.y), sin(t2 - i.y) + cos(t2 + i.x));
        c += 1.0 / length(vec2(p.x / (sin(i.x + t2) / 0.005), p.y / (cos(i.y + t2) / 0.005)));
      }
      c /= 3.0;
      c = 1.17 - pow(c, 1.4);
      return clamp(pow(abs(c), 8.0), 0.0, 1.0);
    }
    void main(){
      vec2 uv = vUv * vec2(uRes.x / uRes.y, 1.0) * 0.55;
      float c = caustic(uv, uTime * 0.22);
      float fadeDown = smoothstep(0.0, 0.85, vUv.y);                  // strongest at the top, like light from above
      gl_FragColor = vec4(vec3(0.0), (1.0 - c) * 0.05 * uAmount * fadeDown);
    }
  `;
  const PLAIN_VERT = /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `;
  // The surface itself, over the white page: only the faces turned from the light show, as soft grey
  const SURF_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uWater;
    uniform vec2 uWaterTexel;
    varying vec2 vUv;
    void main(){
      float l = texture2D(uWater, vUv - vec2(uWaterTexel.x, 0.0)).r, r = texture2D(uWater, vUv + vec2(uWaterTexel.x, 0.0)).r;
      float d = texture2D(uWater, vUv - vec2(0.0, uWaterTexel.y)).r, u = texture2D(uWater, vUv + vec2(0.0, uWaterTexel.y)).r;
      vec3 n = normalize(vec3(r - l, d - u, 0.12) * vec3(-1.0, -1.0, 1.0));
      vec3 L = normalize(vec3(-0.45, 0.7, 0.62));
      float lit = dot(n, L) - L.z;
      gl_FragColor = vec4(vec3(0.0), smoothstep(0.0, 0.45, -lit) * 0.3);
    }
  `;
  // Hold to open: a bubble. While held (uBubbleOn: the plane covers the screen), the card inflates
  // into a trembling bubble (uBub: centre and half-size, uRound: corner radius, in screen heights),
  // drifting to the centre and rounding until its edge runs through all four corners, with a
  // meniscus rim, a glint and a fisheye lens (uDome). Then it bursts (uPop): the film ruptures at the
  // pointer (uHoleC) and the hole races outward, its bright edge shedding droplets that carry pieces
  // of the picture and fly off, merging and stretching like liquid (metaballs), until they're gone.
  const DROP = /* glsl */ `
    uniform float uBubbleOn;
    uniform float uDrop;
    uniform float uPop;
    uniform vec4 uBub;
    uniform float uRound;
    uniform float uPicAsp;
    uniform vec2 uHoleC;
    uniform vec2 uHold;
    uniform float uDome;
    uniform float uSpray;    // how far the burst's spray reaches (1 = a screen-sized bubble)
    vec3 bubN;        // the bubble's surface normal here (a sphere), for its light
    float bubK;       // how much of a bubble this pixel is (0 = plain picture)
    vec2 picHalf(){ float ph = max(uBub.w, uBub.z / uPicAsp); return vec2(ph * uPicAsp, ph); }   // the picture covers the bubble
    bool dropAt(vec2 t, out vec2 pic, out float rim, out float glint){
      rim = 0.0; glint = 0.0; bubN = vec3(0.0, 0.0, 1.0); bubK = 0.0;
      float sa = uSize.x / uSize.y;
      vec2 ts = t * vec2(sa, 1.0);
      vec2 q = ts - uBub.xy;
      float size = min(uBub.z, uBub.w);
      float ang = atan(q.y, q.x);
      float wob = uDrop * 0.012 * size * (sin(ang * 3.0 + uTime * 5.0) + 0.6 * sin(ang * 5.0 - uTime * 8.0));   // a faint tremble
      vec2 dq = abs(q) - (uBub.zw - uRound);
      float sd = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - uRound - wob;
      float hd = length(ts - uHoleC) - uPop * 2.6 * uSpray;              // the rupture, racing out from the pointer
      vec2 ph2 = picHalf();
      if (sd < 0.0 && (uPop <= 0.0 || hd > 0.0)) {
        vec2 nq = clamp(q / uBub.zw, -1.0, 1.0);
        bubN = normalize(vec3(nq, sqrt(max(1.0 - dot(nq, nq), 0.0)) + 0.02));
        bubK = uDrop;
        pic = q / (2.0 * ph2) + 0.5 - bubN.xy * vec2(1.0 / uPicAsp, 1.0) * 0.06 * uDrop;   // seen through a sphere
        if (uPop > 0.0) glint = smoothstep(0.018, 0.0, hd) * 0.9;                           // the film's bright torn edge
        return true;
      }
      if (uPop <= 0.0) return false;
      return false;                                                      // the spray itself is drawn as a fine mist (burstMist)
    }
  `;
  const IMAGE_FRAG = /* glsl */ `
    precision highp float;
    uniform sampler2D uTex;
    uniform vec4 uCrop;
    uniform vec2 uSize;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uVelocity;
    uniform float uTime;
    uniform float uReveal;
    uniform float uSeed;
    uniform float uFade;     // overall opacity for scroll stories (1 = normal)
    uniform float uGlitch;   // 1 = shown as a screen: dot grid, scanlines, glitches and pixel pulses
    uniform float uSubmerge; // 1 = the picture sits under water (blurred, murky, wavering); 0 = clear of it
    uniform float uSurface;  // 0..1 as it breaks the surface: one burst of rings spreads from the centre
    uniform float uWave;     // 1 = a soft wave rolls through it while it glides sideways
    uniform float uHVel;
    varying vec2 vUv;
    ${NOISE}
    ${REVEAL}
    ${WATER}
    ${DROP}
    vec4 sampleTex(vec2 top){
      vec2 t = (top - uCrop.xy) / uCrop.zw;
      return texture2D(uTex, vec2(t.x, 1.0 - t.y));
    }
    void main(){
      vec2 top = vec2(vUv.x, 1.0 - vUv.y);
      float aspect = uSize.x / uSize.y;
      float bulge = 0.0, dropRim = 0.0, dropGlint = 0.0;
      if (uBubbleOn > 0.5) {
        vec2 pic; if (!dropAt(top, pic, dropRim, dropGlint)) discard;
        top = pic; aspect = uPicAsp;                                       // from here on: the picture's own space
      }
      if (uDome > 0.0) {
        // fisheye around the hold point: the picture domes up towards you, magnified most at the centre
        vec2 q = (top - uHold) * vec2(aspect, 1.0);
        float rr = dot(q, q);
        float dome = exp(-rr / 0.16);
        top = uHold + q * (1.0 - uDome * dome) / vec2(aspect, 1.0);
        bulge = uDome * dome;
      }

      vec2 d = (top - uMouse) * vec2(aspect, 1.0);
      float dist = length(d);
      float n = snoise(vec3(top * 2.5, uTime * 0.3 + uSeed));

      // Liquid lens around the cursor + travelling ripple rings
      float lens = smoothstep(0.55, 0.0, dist) * uHover;
      // Displacement scales with d, so it fades to zero under the cursor (no pinch point)
      vec2 push = d / vec2(aspect, 1.0) * lens;
      vec2 uv = top;
      // sitting on the water: the picture refracts with the surface and catches its light
      vec3 wat = uBubbleOn > 0.5 ? vec3(0.0) : waterAt();                            // a bubble isn't on the water
      uv += vec2(wat.x, -wat.y) * 70.0 / uSize;
      uv -= push * 0.22;
      uv += push * sin(dist * 34.0 - uTime * 5.0) * 0.03;
      uv += vec2(n, snoise(vec3(top * 2.5 + 7.0, uTime * 0.3))) * 0.006 * uHover;

      // Scroll velocity smears vertically
      uv.y += n * uVelocity * 0.0007;

      // Water. Under the surface the picture wavers (refraction) and slow ripple rings pass over it
      vec2 wd = (top - vec2(0.5, 1.05)) * vec2(aspect, 1.0);               // rings start from the bottom edge
      float wr = length(wd);
      vec2 wdir = wd / max(wr, 1e-4) / vec2(aspect, 1.0);
      // a wavy waterline sweeps from the bottom up: clear below it, still under water above it
      float yb = 1.0 - top.y;
      float front = mix(-0.25, 1.25, 1.0 - uSubmerge);
      float sub = uSubmerge > 0.001 ? smoothstep(front - 0.22, front + 0.22, yb + sin(top.x * 9.0 + uTime * 2.0) * 0.05) : 0.0;
      if (sub > 0.001) {
        uv += vec2(snoise(vec3(top * 3.0, uTime * 0.35 + uSeed)), snoise(vec3(top * 3.0 + 7.0, uTime * 0.3))) * 0.02 * sub;
        uv += wdir * sin(wr * 34.0 - uTime * 2.4) * 0.006 * sub;
      }
      // Breaking the surface: one burst of rings spreads out from the centre
      float burst = sin(clamp(uSurface, 0.0, 1.0) * 3.14159265);
      float ring = exp(-abs(wr - uSurface * 1.35) * 3.6);
      uv += wdir * sin(wr * 30.0 - uSurface * 36.0) * ring * 0.034 * burst;
      // Floating sideways: a soft wave rolls through it
      uv.y += sin(top.x * 14.0 - uTime * 5.0) * uHVel * 0.0012 * uWave;

      // Zoom slightly while revealing
      uv = (uv - 0.5) * mix(1.12, 1.0, uReveal) + 0.5;

      // A screen: every few seconds a glitch (slices slip, a ripple runs through), and on a slower
      // beat the picture breaks into big pixels for a moment before resolving
      float gburst = 0.0;
      if (uGlitch > 0.5) {
        float gs = floor(uTime / 3.7), gp = fract(uTime / 3.7);
        gburst = step(0.3, hash(vec2(gs, 2.0))) * smoothstep(0.80, 0.81, gp) * (1.0 - smoothstep(0.86, 0.87, gp));
        float band = floor(top.y * 22.0 + hash(vec2(gs, 5.0)) * 9.0);
        float slip = step(0.55, hash(vec2(band, gs))) * (hash(vec2(band, gs + 3.0)) - 0.5);
        uv.x += slip * 0.09 * gburst;
        uv.x += sin(top.y * 46.0 + uTime * 24.0) * 0.004 * gburst;                    // a ripple through it
        float pp = fract(uTime / 6.1);
        float pulse = smoothstep(0.50, 0.53, pp) * (1.0 - smoothstep(0.58, 0.64, pp));
        float cell = mix(1.0, 22.0, pulse);
        if (cell > 1.5) uv = (floor(uv * uSize / cell) + 0.5) * cell / uSize;
      }

      // One sample (no colour split: the site stays black and white), softened under water
      vec4 mid = sampleTex(uv);
      vec3 col = mid.rgb;
      if (sub > 0.001) {
        float r = 0.024 * sub;
        vec3 acc = vec3(0.0);
        for (int i = 0; i < 8; i++) {
          float ang = float(i) * 0.785398 + 0.3;
          acc += sampleTex(uv + vec2(cos(ang) / aspect, sin(ang)) * r).rgb;
        }
        col = mix(col, (acc + col) / 9.0, smoothstep(0.0, 0.5, sub));
        col = mix(col, mix(vec3(0.55), col, 0.62) * 0.86, sub * 0.75);       // murk: lower contrast, a little darker
        col += smoothstep(0.72, 1.0, sin(wr * 34.0 - uTime * 2.4)) * 0.07 * sub;   // light glinting on the rings
      }
      col += smoothstep(0.7, 1.0, sin(wr * 30.0 - uSurface * 36.0)) * ring * 0.2 * burst;
      col *= 1.0 + wat.z * 0.45;
      if (bubK > 0.0) {
        // a liquid bubble, lit from the top left: darker towards its rim, a bright fresnel edge, a curved
        // window reflection, a sharp highlight, a faint bounce light below, and the film's thin dark outline
        vec3 n = bubN;
        float fres = pow(1.0 - clamp(n.z, 0.0, 1.0), 2.4);
        vec3 L = normalize(vec3(-0.5, -0.6, 0.65));
        float spec = pow(max(dot(reflect(vec3(0.0, 0.0, -1.0), n), L), 0.0), 70.0);
        vec2 wv = n.xy - vec2(-0.42, -0.46);
        float wbox = length(max(abs(wv * vec2(1.15, 1.7)) - 0.12, 0.0));                 // a rounded window, softly edged
        float win = smoothstep(0.16, 0.0, wbox) * smoothstep(0.05, 0.35, n.z) * (0.55 + 0.45 * smoothstep(0.1, -0.5, wv.y)) * 0.8;
        float bounce = pow(max(dot(n, normalize(vec3(0.55, 0.62, 0.5))), 0.0), 7.0);
        float edge = length(n.xy);
        col *= mix(1.0, 0.8, smoothstep(0.25, 1.0, edge) * bubK);
        col = mix(col, vec3(1.0), clamp(fres * 0.6 + win * 0.5 + spec * 0.95 + bounce * 0.2, 0.0, 1.0) * bubK);
        col = mix(col, col * 0.62, smoothstep(0.93, 1.0, edge) * 0.6 * bubK);
      }
      col = mix(col, vec3(1.0), dropGlint);                                            // the burst's bright film edge
      if (uGlitch > 0.5) {
        // a ghost of the picture slips aside during a glitch, then the screen's dot grid and scanlines
        float ghost = dot(sampleTex(uv + vec2(0.012, 0.0) * gburst).rgb, vec3(0.333));
        col = max(col, vec3(ghost) * 0.55 * gburst);
        vec2 fc = gl_FragCoord.xy / max(uView.z, 1.0);
        float dotm = smoothstep(0.95, 0.35, length(fract(fc / 3.0) - 0.5) * 2.0);
        float scan = 0.88 + 0.12 * step(0.5, fract(fc.y / 3.0));
        col *= mix(0.62, 1.18, dotm) * scan;
        col += (hash(fc + floor(uTime * 24.0)) - 0.5) * 0.05;                          // a little live noise
        col += step(0.985, hash(vec2(floor(top.y * 140.0), floor(uTime * 12.0)))) * 0.12 * gburst;   // stray bright lines
      }

      // Respect image transparency (e.g. phone mockups on transparent backgrounds)
      float a = revealMask(top, uReveal, uSeed, uTime) * mid.a * uFade * mix(1.0, 0.4, sub);   // still-submerged parts stay faint
      gl_FragColor = vec4(col, a);
    }
  `;

  const GRADIENT_FRAG = /* glsl */ `
    precision highp float;
    uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
    uniform vec2 uSize;
    uniform vec2 uMouse;
    uniform float uHover;
    uniform float uVelocity;
    uniform float uTime;
    uniform float uReveal;
    uniform float uSeed;
    varying vec2 vUv;
    ${NOISE}
    ${REVEAL}
    ${WATER}
    void main(){
      vec2 top = vec2(vUv.x, 1.0 - vUv.y);
      float aspect = uSize.x / uSize.y;
      float t = uTime * 0.07 + uSeed;

      // Domain-warped flow field
      vec2 p = top;
      vec2 q = vec2(snoise(vec3(p * 1.3, t)), snoise(vec3(p * 1.3 + 5.2, t)));
      vec2 r = vec2(snoise(vec3(p * 1.8 + q * 1.2 + 1.7, t * 1.3)), snoise(vec3(p * 1.8 + q * 1.2 + 9.2, t * 1.3)));
      p += q * 0.16 + r * 0.1;

      // Cursor pushes the fluid away
      vec2 d = (top - uMouse) * vec2(aspect, 1.0);
      float infl = smoothstep(0.6, 0.0, length(d)) * uHover;
      p += d / vec2(aspect, 1.0) * infl * 0.6; // smooth bulge, zero at the cursor
      p.y += uVelocity * 0.0015 * sin(top.x * 3.14159);

      vec3 topRow = mix(uC0, uC1, smoothstep(0.05, 0.95, p.x));
      vec3 botRow = mix(uC2, uC3, smoothstep(0.05, 0.95, p.x));
      vec3 col = mix(topRow, botRow, smoothstep(0.0, 1.0, p.y));

      // Soft caustic highlights + film grain
      float glow = snoise(vec3(p * 2.4, t * 1.6));
      col += glow * 0.035 + infl * 0.05;
      col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.035;

      col *= 1.0 + waterAt().z * 0.45;
      float a = revealMask(top, uReveal, uSeed, uTime);
      gl_FragColor = vec4(col, a);
    }
  `;

  Liquid = createLiquidStage();
  scriptReady = true;
  afterScript.splice(0).forEach((fn) => fn());
})();
