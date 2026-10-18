/* =========================================================
   Case study pages — page-specific behaviour on top of site.js
   - Contents index highlights the section being read
   - Headline metrics count up when they enter
   - Before / after comparison slider
   - Host interview audio player
   ========================================================= */
(() => {
  if (matchMedia("(max-width: 767px)").matches) return; // phones see the desktop note
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  setupIndex();
  setupCounters();
  setupSlider();
  setupAudioPlayer();

  /* ---------------- Contents index ---------------- */
  function setupIndex() {
    const links = [...document.querySelectorAll("[data-index] a")];
    const sections = [...document.querySelectorAll("[data-section]")];
    if (!links.length || !sections.length) return;

    let active = null;
    const update = () => {
      const line = window.innerHeight * 0.4;
      let id = sections[0].id;
      for (const s of sections) if (s.getBoundingClientRect().top <= line) id = s.id;
      if (id === active) return;
      active = id;
      links.forEach((a) => a.classList.toggle("is-active", a.dataset.target === id));
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ---------------- Count-up metrics ---------------- */
  function setupCounters() {
    if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
    if (window.jrpArrivedTorn) return;   // came through a tear: the numbers were already seen, settled, through the rip
    document.querySelectorAll("[data-count]").forEach((el) => {
      const to = parseFloat(el.dataset.count);
      const decimals = (el.dataset.count.split(".")[1] || "").length;
      const pre = el.dataset.prefix || "", post = el.dataset.suffix || "";
      const final = el.textContent;
      const state = { v: 0 };
      el.textContent = pre + (0).toFixed(decimals) + post;
      gsap.to(state, {
        v: to,
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => { el.textContent = pre + state.v.toFixed(decimals) + post; },
        onComplete: () => { el.textContent = final; },
      });
    });
  }

  /* ---------------- Before / after slider ---------------- */
  function setupSlider() {
    const slider = document.getElementById("shiftSlider");
    if (!slider) return;
    const after = slider.querySelector(".cs-slider__after");
    const handle = slider.querySelector(".cs-slider__handle");
    const labelBefore = slider.querySelector(".cs-slider__label--before");
    const labelAfter = slider.querySelector(".cs-slider__label--after");
    let dragging = false;

    const set = (pct) => {
      pct = Math.max(2, Math.min(98, pct));
      after.style.clipPath = `inset(0 0 0 ${pct}%)`;
      handle.style.left = pct + "%";
      labelBefore.style.opacity = pct < 15 ? "0" : "1";
      labelAfter.style.opacity = pct > 85 ? "0" : "1";
    };
    const at = (e) => {
      const r = slider.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    };

    slider.addEventListener("pointerdown", (e) => {
      dragging = true;
      slider.setPointerCapture(e.pointerId);
      set(at(e));
    });
    slider.addEventListener("pointermove", (e) => { if (dragging) set(at(e)); });
    const stop = () => { dragging = false; };
    slider.addEventListener("pointerup", stop);
    slider.addEventListener("pointercancel", stop);

    // Keyboard: arrows move the divider
    slider.tabIndex = 0;
    slider.setAttribute("role", "slider");
    slider.setAttribute("aria-label", "Before and after comparison");
    let pos = 50;
    slider.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      pos = Math.max(2, Math.min(98, pos + (e.key === "ArrowRight" ? 5 : -5)));
      set(pos);
    });

    set(50);
  }

  /* ---------------- Audio player ---------------- */
  function setupAudioPlayer() {
    const root = document.querySelector("[data-audio-player]");
    if (!root) return;
    const audio = root.querySelector("audio");
    const play = root.querySelector("[data-audio-play]");
    const bar = root.querySelector("[data-audio-bar]");
    const fill = root.querySelector("[data-audio-fill]");
    const time = root.querySelector("[data-audio-time]");
    const iconPlay = play.querySelector(".cs-player__icon--play");
    const iconPause = play.querySelector(".cs-player__icon--pause");
    let fallback = 118, seeking = false;

    const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const spoken = (s) => `${Math.floor(s / 60)} minutes ${Math.floor(s % 60)} seconds`;
    const dur = () => (audio.duration && isFinite(audio.duration) ? audio.duration : fallback);

    const paint = () => {
      const d = dur(), t = audio.currentTime || 0;
      fill.style.width = (d ? (t / d) * 100 : 0) + "%";
      time.textContent = `${fmt(t)} / ${fmt(d)}`;
      bar.setAttribute("aria-valuemax", String(Math.round(d)));
      bar.setAttribute("aria-valuenow", String(Math.round(t)));
      bar.setAttribute("aria-valuetext", `${spoken(t)} of ${spoken(d)}`);
    };
    const setPlaying = (on) => {
      // SVG elements have no .hidden property, so toggle the attribute itself
      iconPlay.toggleAttribute("hidden", on);
      iconPause.toggleAttribute("hidden", !on);
      play.setAttribute("aria-label", on ? "Pause host interview" : "Play host interview");
    };
    const seek = (e) => {
      const r = bar.getBoundingClientRect();
      audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * dur();
      paint();
    };

    play.addEventListener("click", () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
    audio.addEventListener("play", () => setPlaying(true));
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("ended", () => { setPlaying(false); audio.currentTime = 0; paint(); });
    audio.addEventListener("timeupdate", paint);
    audio.addEventListener("loadedmetadata", () => { if (isFinite(audio.duration)) fallback = audio.duration; paint(); });

    bar.addEventListener("pointerdown", (e) => { seeking = true; bar.setPointerCapture(e.pointerId); seek(e); });
    bar.addEventListener("pointermove", (e) => { if (seeking) seek(e); });
    bar.addEventListener("pointerup", () => (seeking = false));
    bar.addEventListener("pointercancel", () => (seeking = false));
    bar.addEventListener("keydown", (e) => {
      const d = dur(), step = e.shiftKey ? 10 : 5, t = audio.currentTime || 0;
      const moves = { ArrowRight: t + step, ArrowUp: t + step, ArrowLeft: t - step, ArrowDown: t - step, Home: 0, End: d };
      if (e.key in moves) {
        e.preventDefault();
        audio.currentTime = Math.min(d, Math.max(0, moves[e.key]));
        paint();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        play.click();
      }
    });
    paint();
  }
})();
