(function () {
  "use strict";

  var STORAGE_KEY = "jrp-sound"; // shared with site.js
  var FLIP_EASE = "power3.out";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof gsap !== "undefined";
  var hasThree = typeof THREE !== "undefined";
  var TOTAL_PAIRS = 10;

  /* ── Abstract shapes (10 pairs = 20 cards) ─────────── */
  var skills = [
    { id: "airplane", title: "Flight" },
    { id: "car", title: "Car" },
    { id: "rocket", title: "Rocket" },
    { id: "bicycle", title: "Bicycle" },
    { id: "sailboat", title: "Sailboat" },
    { id: "train", title: "Train" },
    { id: "balloon", title: "Balloon" },
    { id: "motorcycle", title: "Motorcycle" },
    { id: "helicopter", title: "Helicopter" },
    { id: "star", title: "Star" }
  ];

  var game = {
    firstCard: null,
    secondCard: null,
    locked: false,
    matchedPairs: 0,
    moves: 0,
    started: false,
    finished: false,
    startTime: null,
    elapsed: 0
  };

  var els = {};
  var timerId = null;
  var winTimers = [];
  var audioCtx = null;
  var soundOn = false;
  var bound = false;
  var introTl = null;
  var webgl = null;
  var confetti = { bits: [], raf: 0, running: false };

  function skillById(id) {
    for (var i = 0; i < skills.length; i++) if (skills[i].id === id) return skills[i];
    return skills[0];
  }

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  function formatTime(s) {
    return pad(Math.floor(s / 60)) + ":" + pad(s % 60);
  }

  function announce(t) { if (els.live) els.live.textContent = t; }

  function iconFrame(inner) {
    return '<svg class="icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + inner + "</svg>";
  }

  /* ── Abstract shape icons ──────────────────────────── */
  function iconFor(id) {
    if (id === "airplane") return iconFrame(
      '<path d="M22 2L11 13"/>' +
      '<path d="M22 2l-7 20-3-9-9-3 20-7z" fill="currentColor" fill-opacity="0.06"/>'
    );
    if (id === "car") return iconFrame(
      '<path d="M5 17h14"/>' +
      '<path d="M6 17l1-4h10l1 4"/>' +
      '<path d="M7 13l1.5-4h7L17 13"/>' +
      '<circle cx="8" cy="17" r="1.5"/>' +
      '<circle cx="16" cy="17" r="1.5"/>'
    );
    if (id === "rocket") return iconFrame(
      '<path d="M12 2c-2 4-2 8 0 14"/>' +
      '<path d="M12 2c2 4 2 8 0 14"/>' +
      '<path d="M7 16c-1 2-1 4 0 5l5-3 5 3c1-1 1-3 0-5"/>' +
      '<circle cx="12" cy="10" r="1.5"/>'
    );
    if (id === "bicycle") return iconFrame(
      '<circle cx="7" cy="16" r="3"/>' +
      '<circle cx="17" cy="16" r="3"/>' +
      '<path d="M7 16l3-6h4l3 6"/>' +
      '<path d="M10 10l2-4"/>'
    );
    if (id === "sailboat") return iconFrame(
      '<path d="M3 20h18"/>' +
      '<path d="M5 20l2-6h10l2 6"/>' +
      '<path d="M12 14V4"/>' +
      '<path d="M12 4l6 10"/>' +
      '<path d="M12 6l-4 8"/>'
    );
    if (id === "train") return iconFrame(
      '<rect x="5" y="4" width="14" height="14" rx="3"/>' +
      '<path d="M5 14h14"/>' +
      '<circle cx="9" cy="9" r="2"/>' +
      '<circle cx="15" cy="9" r="2"/>' +
      '<path d="M9 20l-2-2M15 20l2-2"/>'
    );
    if (id === "balloon") return iconFrame(
      '<path d="M12 2a7 7 0 0 0-7 7c0 5 7 9 7 9s7-4 7-9a7 7 0 0 0-7-7z"/>' +
      '<path d="M10 18h4v2h-4z"/>' +
      '<path d="M12 2v7"/>'
    );
    if (id === "motorcycle") return iconFrame(
      '<circle cx="6" cy="17" r="3"/>' +
      '<circle cx="18" cy="17" r="3"/>' +
      '<path d="M6 17l4-7h3l2 3h3"/>' +
      '<path d="M13 13l2-5h2"/>' +
      '<path d="M10 10l-2-3"/>'
    );
    if (id === "helicopter") return iconFrame(
      '<path d="M4 10h16"/>' +
      '<path d="M12 10v-4"/>' +
      '<rect x="6" y="10" width="10" height="6" rx="3"/>' +
      '<path d="M16 16l4 2"/>' +
      '<path d="M20 17v2"/>'
    );
    /* star */
    return iconFrame(
      '<path d="M12 2l3 6.5L22 10l-5 5 1.2 7L12 18.5 5.8 22 7 15l-5-5 7-1.5z" fill="currentColor" fill-opacity="0.06"/>'
    );
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function createDeck() {
    var deck = [];
    for (var i = 0; i < skills.length; i++) {
      for (var c = 0; c < 2; c++) {
        deck.push({
          uid: skills[i].id + "-" + c + "-" + Math.random().toString(36).slice(2, 7),
          pairId: skills[i].id
        });
      }
    }
    return shuffle(deck);
  }

  function cacheDom() {
    els.app = document.getElementById("app");
    els.board = document.getElementById("board");
    els.timeVal = document.getElementById("timeVal");
    els.matchVal = document.getElementById("matchVal");
    els.moveVal = document.getElementById("moveVal");
    // Game sounds follow the site-wide Sound switch in the nav (site.js owns the button)
    els.soundBtn = document.querySelector("[data-sound-toggle]");
    els.win = document.getElementById("win");
    els.winMeta = document.getElementById("winMeta");
    els.playAgain = document.getElementById("playAgain");
    els.live = document.getElementById("live");
    els.webgl = document.getElementById("webgl");
    els.confetti = document.getElementById("confetti");
    els.connect = document.getElementById("connect");

  }

  /* ── Audio ─────────────────────────────────────────── */
  // Same key and default as the site (on unless the visitor muted it)
  function restoreSound() {
    try { soundOn = localStorage.getItem(STORAGE_KEY) !== "off"; } catch (e) { soundOn = true; }
  }
  function ensureAudio() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") audioCtx.resume();
      return;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = new AC();
  }
  function tone(freq, dur, type, gain, slide) {
    if (!soundOn || !audioCtx) return;
    var t = audioCtx.currentTime;
    var o = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(gain || 0.035, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function playSound(kind) {
    if (!soundOn) return;
    ensureAudio();
    if (kind === "flip") tone(1640, 0.04, "triangle", 0.028);
    else if (kind === "match") {
      tone(523, 0.08, "sine", 0.04);
      window.setTimeout(function () { tone(784, 0.11, "sine", 0.035); }, 90);
    } else if (kind === "mismatch") tone(180, 0.07, "sine", 0.03);
    else if (kind === "win") {
      tone(523, 0.11, "sine", 0.04);
      window.setTimeout(function () { tone(659, 0.11, "sine", 0.035); }, 120);
      window.setTimeout(function () { tone(784, 0.16, "sine", 0.03); }, 240);
    }
  }

  /* ── Timer / stats ─────────────────────────────────── */
  function startTimer() {
    if (game.started) return;
    game.started = true;
    game.elapsed = 0;
    els.timeVal.textContent = "00:00";
    timerId = window.setInterval(function () {
      if (!game.started || game.finished) return;
      game.elapsed += 1;
      els.timeVal.textContent = formatTime(game.elapsed);
    }, 1000);
  }
  function stopTimer() {
    if (timerId) { window.clearInterval(timerId); timerId = null; }
  }

  function rollNumber(span, next) {
    if (!span) return;
    if (reduce || !hasGsap) { span.textContent = String(next); return; }
    var wrap = span.parentNode;
    wrap.style.overflow = "hidden";
    gsap.to(span, { y: -10, opacity: 0, duration: 0.12, ease: "power2.in", onComplete: function () {
      span.textContent = String(next);
      gsap.fromTo(span, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.18, ease: "power2.out" });
    }});
  }

  function updateMatched() {
    var num = els.matchVal.querySelector(".stat-num");
    rollNumber(num, game.matchedPairs);
  }
  function updateMoves() {
    var num = els.moveVal.querySelector(".stat-num");
    rollNumber(num, game.moves);
  }

  /* ── Render ────────────────────────────────────────── */
  function labelCard(btn) {
    var skill = skillById(btn.dataset.pair);
    if (btn.classList.contains("is-matched")) btn.setAttribute("aria-label", skill.title + " - matched");
    else if (btn.classList.contains("is-flipped")) btn.setAttribute("aria-label", skill.title);
    else btn.setAttribute("aria-label", "Reveal card");
  }

  function renderCards(deck) {
    els.board.innerHTML = "";
    for (var i = 0; i < deck.length; i++) {
      var card = deck[i];
      var skill = skillById(card.pairId);
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "card";
      btn.dataset.uid = card.uid;
      btn.dataset.pair = card.pairId;
      btn.setAttribute("aria-label", "Reveal card");
      btn.innerHTML =
        '<span class="card-inner">' +
          '<span class="card-face card-back"></span>' +
          '<span class="card-face card-front">' +
            '<svg class="check" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.2 8.2l3.1 3.1 6.5-6.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<span class="shine"></span>' +
            iconFor(skill.id) +
            '<span class="skill">' + skill.title + "</span>" +
          "</span>" +
        "</span>";
      els.board.appendChild(btn);
    }
  }

  function playIntro() {
    var cards = els.board.querySelectorAll(".card");
    if (reduce || !hasGsap) {
      if (hasGsap) {
        gsap.set("[data-enter]", { opacity: 1, y: 0 });
        gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
      }
      return;
    }
    if (introTl) introTl.kill();
    gsap.set("[data-enter]", { opacity: 0, y: 12 });
    gsap.set(cards, { opacity: 0, y: 20, scale: 0.96 });
    introTl = gsap.timeline({ defaults: { ease: "power3.out" } });
    introTl.to(".title", { opacity: 1, y: 0, duration: 0.5 }, 0.08);
    introTl.to(".lede", { opacity: 1, y: 0, duration: 0.45 }, 0.16);
    introTl.to(".stats", { opacity: 1, y: 0, duration: 0.4 }, 0.22);
    introTl.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03 }, 0.26);
  }

  function gsapSet(t, vars) {
    if (hasGsap) gsap.set(t, vars);
  }

  /* ── Flip ──────────────────────────────────────────── */
  function innerOf(card) { return card.querySelector(".card-inner"); }

  function animateFlip(card, faceUp) {
    return new Promise(function (resolve) {
      var inner = innerOf(card);
      var shine = card.querySelector(".shine");
      if (faceUp) card.classList.add("is-flipped");
      else card.classList.remove("is-flipped");
      labelCard(card);

      if (!hasGsap) {
        inner.style.transition = reduce ? "transform .2s ease" : "transform .65s cubic-bezier(.22,1,.36,1)";
        inner.style.transform = faceUp ? "rotateY(180deg)" : "rotateY(0deg)";
        window.setTimeout(resolve, reduce ? 200 : 650);
        return;
      }

      // Reset gyro tilt on flip
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.15, overwrite: "auto" });

      var tl = gsap.timeline({ onComplete: resolve });
      if (faceUp && !reduce) {
        tl.to(card, { y: -4, scale: 1.02, duration: 0.14, ease: "power2.out" }, 0);
      }
      tl.to(inner, {
        rotateY: faceUp ? 180 : 0,
        duration: reduce ? 0.2 : 0.58,
        ease: FLIP_EASE
      }, 0.02);
      if (faceUp && !reduce) {
        tl.to(card, { y: 0, scale: 1, duration: 0.28, ease: "power2.out" }, 0.32);
        if (shine) {
          tl.fromTo(shine, { xPercent: -120, opacity: 0.0 }, { xPercent: 120, opacity: 0.55, duration: 0.3, ease: "none" }, 0.42);
          tl.to(shine, { opacity: 0, duration: 0.12 }, 0.68);
        }
      } else {
        tl.to(card, { y: 0, scale: 1, duration: 0.2 }, 0.1);
      }
    });
  }

  function shakeCard(card) {
    if (reduce || !hasGsap) return Promise.resolve();
    return new Promise(function (resolve) {
      gsap.fromTo(card, { x: 0 }, {
        keyframes: [{ x: -3 }, { x: 3 }, { x: -2 }, { x: 0 }],
        duration: 0.25,
        ease: "power1.inOut",
        onComplete: resolve
      });
    });
  }

  /* ── Connect line ──────────────────────────────────── */
  function drawMatchLine(a, b) {
    if (!els.connect) return;
    var ra = a.getBoundingClientRect();
    var rb = b.getBoundingClientRect();
    var x1 = ra.left + ra.width / 2;
    var y1 = ra.top + ra.height / 2;
    var x2 = rb.left + rb.width / 2;
    var y2 = rb.top + rb.height / 2;
    els.connect.setAttribute("viewBox", "0 0 " + window.innerWidth + " " + window.innerHeight);
    els.connect.innerHTML = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#34C759" stroke-width="1.5" stroke-linecap="round" pathLength="1" />';
    var line = els.connect.querySelector("line");
    if (hasGsap && !reduce) {
      gsap.fromTo(line, { attr: { "stroke-dasharray": "0 1" }, opacity: 0.9 }, {
        attr: { "stroke-dasharray": "1 0" },
        duration: 0.45,
        ease: "power2.out"
      });
      gsap.to(line, { opacity: 0, duration: 0.35, delay: 0.45, onComplete: function () { els.connect.innerHTML = ""; } });
    } else {
      window.setTimeout(function () { els.connect.innerHTML = ""; }, 700);
    }
  }

  /* ── Gameplay ──────────────────────────────────────── */
  function resetSelection() {
    game.firstCard = null;
    game.secondCard = null;
    game.locked = false;
  }

  function onCardActivate(card) {
    if (game.locked || game.finished) return;
    if (!card || card.classList.contains("is-matched") || card.classList.contains("is-flipped")) return;
    if (game.firstCard === card) return;

    if (!game.started) startTimer();
    playSound("flip");
    animateFlip(card, true);

    if (!game.firstCard) {
      game.firstCard = card;
      return;
    }

    game.secondCard = card;
    game.locked = true;
    game.moves += 1;
    updateMoves();
    window.setTimeout(checkMatch, reduce ? 220 : 620);
  }

  function checkMatch() {
    var a = game.firstCard;
    var b = game.secondCard;
    if (!a || !b) { resetSelection(); return; }
    if (a.dataset.pair === b.dataset.pair) handleMatch(a, b);
    else handleMismatch(a, b);
  }

  function handleMatch(a, b) {
    a.classList.add("is-matched");
    b.classList.add("is-matched");
    labelCard(a); labelCard(b);
    game.matchedPairs += 1;
    updateMatched();
    playSound("match");
    announce(skillById(a.dataset.pair).title + " matched. " + game.matchedPairs + " of " + TOTAL_PAIRS + ".");

    if (hasGsap && !reduce) {
      gsap.to([a, b], { scale: 1.035, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
    }
    drawMatchLine(a, b);
    if (webgl) webgl.rippleFromCards(a, b);

    if (game.matchedPairs >= TOTAL_PAIRS) {
      endGame();
      return;
    }
    resetSelection();
  }

  function handleMismatch(a, b) {
    a.classList.add("is-mismatch");
    b.classList.add("is-mismatch");
    playSound("mismatch");
    announce("No match.");
    shakeCard(a); shakeCard(b);

    window.setTimeout(function () {
      a.classList.remove("is-mismatch");
      b.classList.remove("is-mismatch");
      Promise.all([animateFlip(a, false), animateFlip(b, false)]).then(resetSelection);
    }, 800);
  }

  function later(fn, ms) {
    var id = window.setTimeout(fn, ms);
    winTimers.push(id);
  }
  function clearWinTimers() {
    for (var i = 0; i < winTimers.length; i++) window.clearTimeout(winTimers[i]);
    winTimers = [];
  }

  function endGame() {
    if (game.finished) return;
    game.finished = true;
    game.locked = true;
    stopTimer();
    showWin();
  }

  /* ── Badge image paths ──────────────────────────────── */
  var BADGE_IMAGES = {
    3: "../Images/Badges/Golden Badge.webp",
    2: "../Images/Badges/Silver Badge.webp",
    1: "../Images/Badges/Bronze Badge.webp"
  };

  // Preload badge images
  var badgeImgCache = {};
  function preloadBadges() {
    [1, 2, 3].forEach(function (s) {
      var img = new Image();
      img.src = BADGE_IMAGES[s];
      badgeImgCache[s] = img;
    });
  }

  function getBadgeImage(stars) {
    return badgeImgCache[stars] || badgeImgCache[1];
  }

  /* ── Badge canvas (download) ───────────────────────── */
  function generateBadge(timeStr, moves, rating, callback) {
    var w = 600, h = 720;
    var c = document.createElement("canvas");
    c.width = w * 2; c.height = h * 2;
    var ctx = c.getContext("2d");
    ctx.scale(2, 2);

    var img = getBadgeImage(rating.stars);

    function draw() {
      roundRect(ctx, 0, 0, w, h, 28, "#f7f7f7");
      roundRect(ctx, 28, 28, w - 56, h - 56, 16, "#ffffff");

      var imgSize = 180;
      var imgX = (w - imgSize) / 2;
      var imgY = 64;
      ctx.drawImage(img, imgX, imgY, imgSize, imgSize);

      ctx.textAlign = "center";
      ctx.fillStyle = "#000000";
      ctx.font = "500 44px Aeonik, -apple-system, sans-serif";
      ctx.fillText(rating.title, w / 2, 330);

      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "400 16px Aeonik, -apple-system, sans-serif";
      ctx.fillText(TOTAL_PAIRS + " / " + TOTAL_PAIRS + " shapes matched", w / 2, 372);

      var pillY = 420;
      ctx.strokeStyle = "rgba(0,0,0,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, pillY);
      ctx.lineTo(w - 80, pillY);
      ctx.stroke();

      ctx.fillStyle = "#000000";
      ctx.font = "500 22px Aeonik, -apple-system, sans-serif";
      ctx.fillText(timeStr, w / 2 - 80, pillY + 40);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "500 12px Aeonik, -apple-system, sans-serif";
      ctx.fillText("TIME", w / 2 - 80, pillY + 62);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.font = "400 16px Aeonik, -apple-system, sans-serif";
      ctx.fillText("+", w / 2, pillY + 48);

      ctx.fillStyle = "#000000";
      ctx.font = "500 22px Aeonik, -apple-system, sans-serif";
      ctx.fillText(String(moves), w / 2 + 80, pillY + 40);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.font = "500 12px Aeonik, -apple-system, sans-serif";
      ctx.fillText("MOVES", w / 2 + 80, pillY + 62);

      ctx.fillStyle = "#000000";
      ctx.font = "500 14px Aeonik, -apple-system, sans-serif";
      ctx.fillText(rating.label, w / 2, 540);

      for (var s = 0; s < 3; s++) {
        drawCanvasStar(ctx, w / 2 - 24 + s * 24, 572, 8, s < rating.stars ? "#34C759" : "rgba(0,0,0,0.12)");
      }

      var tierLabel = rating.stars === 3 ? "Gold" : rating.stars === 2 ? "Silver" : "Bronze";
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.font = "400 12px Aeonik, -apple-system, sans-serif";
      ctx.fillText(tierLabel, w / 2, 608);

      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.font = "400 12px Aeonik, -apple-system, sans-serif";
      ctx.fillText("jithinrp.com", w / 2, 668);

      if (callback) callback(c);
    }

    if (img.complete && img.naturalWidth > 0) {
      draw();
      return c;
    }
    img.onload = draw;
    img.onerror = draw;
    return c;
  }

  function getRating(moves) {
    if (moves <= 14) return { stars: 3, label: "Perfect memory", title: "Perfect!" };
    if (moves <= 20) return { stars: 3, label: "Sharp mind", title: "Brilliant!" };
    if (moves <= 30) return { stars: 2, label: "Well played", title: "Well played!" };
    if (moves <= 45) return { stars: 1, label: "Nice try", title: "Not bad!" };
    return { stars: 1, label: "Keep going", title: "Keep going!" };
  }

  function roundRect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (typeof fill === "object" || typeof fill === "string") { ctx.fillStyle = fill; ctx.fill(); }
  }

  function roundRectStroke(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.stroke();
  }

  function drawCanvasStar(ctx, cx, cy, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (var i = 0; i < 5; i++) {
      var a = (i * 72 - 90) * Math.PI / 180;
      var ai = ((i * 72) + 36 - 90) * Math.PI / 180;
      var ox = cx + Math.cos(a) * size;
      var oy = cy + Math.sin(a) * size;
      var ix = cx + Math.cos(ai) * size * 0.4;
      var iy = cy + Math.sin(ai) * size * 0.4;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function downloadBadge() {
    var timeStr = formatTime(game.elapsed);
    var rating = getRating(game.moves);
    generateBadge(timeStr, game.moves, rating, function (canvas) {
      canvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "memory-badge.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
      }, "image/png");
    });
  }

  /* ── Win screen ────────────────────────────────────── */
  function showWin() {
    var t = formatTime(game.elapsed);
    var rating = getRating(game.moves);

    // Populate title + stats
    var winTitle = document.getElementById("winTitle");
    if (winTitle) winTitle.textContent = rating.title;
    els.winMeta.textContent = TOTAL_PAIRS + " / " + TOTAL_PAIRS + " shapes matched";
    var winTime = document.getElementById("winTime");
    var winMoves = document.getElementById("winMoves");
    var winRating = document.getElementById("winRating");
    if (winTime) winTime.textContent = t;
    if (winMoves) winMoves.textContent = game.moves;
    if (winRating) winRating.textContent = rating.stars + "★";

    // Insert badge image
    var badgeVisual = document.getElementById("badgeVisual");
    if (badgeVisual) {
      var img = getBadgeImage(rating.stars);
      var badgeImg = document.createElement("img");
      badgeImg.src = img.src;
      badgeImg.alt = (rating.stars === 3 ? "Gold" : rating.stars === 2 ? "Silver" : "Bronze") + " badge";
      badgeImg.className = "badge-img";
      badgeImg.onerror = function () { badgeVisual.innerHTML = ""; };
      badgeVisual.innerHTML = "";
      badgeVisual.appendChild(badgeImg);
    }

    announce("All " + TOTAL_PAIRS + " pairs matched in " + t + ".");
    playSound("win");

    var cards = els.board.querySelectorAll(".card");
    if (webgl) webgl.win();
    launchConfetti();

    if (hasGsap && !reduce) {
      gsap.to(cards, { scale: 1.02, duration: 0.28, stagger: 0.03, yoyo: true, repeat: 1, ease: "power2.out" });
      later(function () {
        gsap.to(cards, { x: function (i) { return (i % 2 === 0 ? -4 : 4); }, duration: 0.45, ease: "power2.out" });
      }, 360);
      later(function () {
        gsap.to(els.board, { scale: 0.96, opacity: 0.42, duration: 0.55, ease: "power2.inOut" });
      }, 620);
    } else {
      els.board.style.opacity = "0.45";
    }

    later(function () {
      els.win.hidden = false;
      if (hasGsap && !reduce) {
        gsap.set(els.win, { opacity: 0 });
        gsap.to(els.win, { opacity: 1, duration: 0.4, ease: "power2.out" });
        // Badge entrance
        gsap.fromTo("#badgeVisual", { scale: 0.5, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.65, ease: "back.out(1.4)", delay: 0.1 });
        gsap.fromTo(".win-title", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", delay: 0.25 });
        gsap.fromTo(".win-meta", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", delay: 0.35 });
        gsap.fromTo(".win-stats", { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out", delay: 0.45 });
        gsap.fromTo("#downloadBadge", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.55 });
        gsap.fromTo("#playAgain", { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.6 });
        els.win.classList.add("is-in");
      } else {
        els.win.classList.add("is-in");
      }
      els.playAgain.focus();
    }, reduce ? 280 : 980);
  }

  function restartGame() {
    stopTimer();
    clearWinTimers();
    stopConfetti();
    if (introTl) introTl.kill();
    if (hasGsap) gsap.killTweensOf([els.board, ".card", ".card-inner", ".win-panel", "#badgeVisual", ".win-title", ".win-meta", ".win-stats", "#downloadBadge", "#playAgain"]);
    game.firstCard = null;
    game.secondCard = null;
    game.locked = false;
    game.matchedPairs = 0;
    game.moves = 0;
    game.started = false;
    game.finished = false;
    game.startTime = null;
    game.elapsed = 0;
    els.timeVal.textContent = "Ready";
    var mn = els.matchVal.querySelector(".stat-num");
    var mv = els.moveVal.querySelector(".stat-num");
    if (mn) mn.textContent = "0";
    if (mv) mv.textContent = "0";
    els.win.classList.remove("is-in");
    els.win.hidden = true;
    els.board.style.opacity = "";
    gsapSet(els.board, { scale: 1, opacity: 1, x: 0 });
    if (els.connect) els.connect.innerHTML = "";
    if (webgl) webgl.reset();
    var badgeVisual = document.getElementById("badgeVisual");
    if (badgeVisual) badgeVisual.innerHTML = "";
    renderCards(createDeck());
    playIntro();
    announce("New game. Match " + TOTAL_PAIRS + " shape pairs.");
  }

  /* ── Confetti ──────────────────────────────────────── */
  function resizeConfetti() {
    if (!els.confetti) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    els.confetti.width = Math.floor(window.innerWidth * dpr);
    els.confetti.height = Math.floor(window.innerHeight * dpr);
    els.confetti.style.width = "100%";
    els.confetti.style.height = "100%";
    var ctx = els.confetti.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    confetti.ctx = ctx;
  }

  function launchConfetti() {
    resizeConfetti();
    stopConfetti();
    var n = reduce ? 18 : 70;
    var colors = ["#000000", "#ffffff", "#ebebeb", "#34C759"];
    confetti.bits = [];
    for (var i = 0; i < n; i++) {
      confetti.bits.push({
        x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 180,
        y: window.innerHeight * 0.62,
        vx: (Math.random() - 0.5) * 7,
        vy: -8 - Math.random() * 6,
        w: 3 + Math.random() * 4,
        h: 6 + Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.2,
        life: 1,
        color: colors[i % colors.length]
      });
    }
    confetti.running = true;
    tickConfetti();
  }

  function stopConfetti() {
    confetti.running = false;
    if (confetti.raf) cancelAnimationFrame(confetti.raf);
    confetti.raf = 0;
    if (confetti.ctx) confetti.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  function tickConfetti() {
    if (!confetti.running || !confetti.ctx) return;
    var ctx = confetti.ctx;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    var live = 0;
    for (var i = 0; i < confetti.bits.length; i++) {
      var p = confetti.bits[i];
      if (p.life <= 0) continue;
      p.vy += 0.17;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 0.009;
      live++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (!live) { stopConfetti(); return; }
    confetti.raf = requestAnimationFrame(tickConfetti);
  }

  /* ── WebGL ─────────────────────────────────────────── */
  function initWebGL() {
    if (!hasThree || !els.webgl) return null;
    var renderer = new THREE.WebGLRenderer({ canvas: els.webgl, antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf7f7f7, 1);
    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uBright: { value: 0 },
      uR0: { value: new THREE.Vector3(0.5, 0.5, 10) },
      uR1: { value: new THREE.Vector3(0.5, 0.5, 10) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: "void main(){ gl_Position=vec4(position.xy,0.0,1.0); }",
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse;",
        "uniform float uBright; uniform vec3 uR0; uniform vec3 uR1;",
        "float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }",
        "float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);",
        "  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }",
        "float ring(vec2 uv, vec3 r){",
        "  float d=length(uv-r.xy); float a=r.z;",
        "  return smoothstep(0.04,0.0, abs(d-a*0.22))*exp(-a*1.6);",
        "}",
        "void main(){",
        "  vec2 uv=gl_FragCoord.xy/uRes;",
        "  vec2 p=uv; p.x*=uRes.x/uRes.y;",
        "  vec2 m=uMouse; m.x*=uRes.x/uRes.y;",
        "  vec2 off=(p-m)*0.012*exp(-length(p-m)*6.0);",
        "  float n=noise((uv+off)*9.0 + uTime*0.018);",
        "  vec3 col=vec3(0.969) + n*0.012;",
        "  col-=vec3(0.02)*exp(-length(p-m)*10.0);",
        "  col+=vec3(0.204,0.780,0.349)*0.28*(ring(uv,uR0)+ring(uv,uR1));",
        "  col=mix(col, vec3(0.969), uBright*0.35);",
        "  gl_FragColor=vec4(col,1.0);",
        "}"
      ].join("\n")
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    var mouse = { x: 0.5, y: 0.5 };
    var rippleSlot = 0;
    var running = true;

    function onMove(e) {
      var x = e.clientX, y = e.clientY;
      if (e.touches && e.touches[0]) { x = e.touches[0].clientX; y = e.touches[0].clientY; }
      mouse.x = x / window.innerWidth;
      mouse.y = 1 - y / window.innerHeight;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    function loop(t) {
      requestAnimationFrame(loop);
      if (!running) return;
      uniforms.uTime.value = t * 0.001;
      uniforms.uMouse.value.set(mouse.x, mouse.y);
      uniforms.uR0.value.z += 0.016;
      uniforms.uR1.value.z += 0.016;
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);

    return {
      resize: function () {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uRes.value.set(window.innerWidth, window.innerHeight);
      },
      rippleFromCards: function (a, b) {
        var ra = a.getBoundingClientRect();
        var rb = b.getBoundingClientRect();
        var x = ((ra.left + ra.width / 2) + (rb.left + rb.width / 2)) / 2 / window.innerWidth;
        var y = 1 - ((ra.top + ra.height / 2) + (rb.top + rb.height / 2)) / 2 / window.innerHeight;
        var u = rippleSlot ? uniforms.uR1 : uniforms.uR0;
        u.value.set(x, y, 0);
        rippleSlot = 1 - rippleSlot;
      },
      win: function () {
        if (hasGsap) gsap.to(uniforms.uBright, { value: 1, duration: 1.35, ease: "power2.inOut" });
        else uniforms.uBright.value = 1;
      },
      reset: function () {
        uniforms.uBright.value = 0;
        uniforms.uR0.value.z = 10;
        uniforms.uR1.value.z = 10;
      }
    };
  }

  /* ── Gyroscopic hover + card chrome ───────────────── */
  function bindCardChrome(card) {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (fine) {
      card.addEventListener("mouseenter", function () {
        if (game.locked || game.finished || card.classList.contains("is-matched")) return;
        if (hasGsap) gsap.to(card, { y: -5, scale: 1.015, duration: 0.2, ease: "power2.out", overwrite: "auto" });
      });
      card.addEventListener("mouseleave", function () {
        if (card.classList.contains("is-matched")) return;
        if (hasGsap) gsap.to(card, { y: 0, scale: 1, rotateX: 0, rotateY: 0, duration: 0.35, ease: "power2.out", overwrite: "auto" });
      });
      // Gyroscopic 3D tilt on hover
      card.addEventListener("pointermove", function (e) {
        if (game.locked || game.finished || card.classList.contains("is-matched") || card.classList.contains("is-flipped")) return;
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var tiltY = (x - 0.5) * 16;
        var tiltX = (0.5 - y) * 16;
        // spotlight position for card back
        card.style.setProperty("--mx", (x * 100) + "%");
        card.style.setProperty("--my", (y * 100) + "%");
        if (hasGsap) {
          gsap.to(card, {
            rotateX: tiltX,
            rotateY: tiltY,
            duration: 0.25,
            ease: "power2.out",
            overwrite: "auto"
          });
        }
      });
    }
    card.addEventListener("pointerdown", function () {
      if (game.locked || card.classList.contains("is-matched")) return;
      if (hasGsap) gsap.to(card, { scale: 0.97, duration: 0.1, ease: "power2.out", overwrite: "auto" });
    });
    card.addEventListener("pointerup", function () {
      if (hasGsap && !card.classList.contains("is-flipped")) {
        gsap.to(card, { scale: 1, duration: 0.18, ease: "power2.out", overwrite: "auto" });
      }
    });
  }

  function bindOnce() {
    if (bound) return;
    bound = true;
    els.board.addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (!card || !els.board.contains(card)) return;
      onCardActivate(card);
    });
    // The nav switch (click or "M") flips aria-pressed; mirror it
    if (els.soundBtn && "MutationObserver" in window) {
      new MutationObserver(function () {
        soundOn = els.soundBtn.getAttribute("aria-pressed") === "true";
        if (soundOn) ensureAudio();
      }).observe(els.soundBtn, { attributes: true, attributeFilter: ["aria-pressed"] });
    }
    els.playAgain.addEventListener("click", restartGame);
    // Download badge button
    document.addEventListener("click", function (e) {
      if (e.target.id === "downloadBadge" || e.target.closest("#downloadBadge")) {
        downloadBadge();
      }
    });
    window.addEventListener("resize", function () {
      resizeConfetti();
      if (webgl) webgl.resize();
    });
  }

  var origRender = renderCards;
  renderCards = function (deck) {
    origRender(deck);
    var cards = els.board.querySelectorAll(".card");
    for (var i = 0; i < cards.length; i++) bindCardChrome(cards[i]);
    if (hasGsap) gsap.set(".card-inner", { transformStyle: "preserve-3d", rotateY: 0 });
  };

  function init() {
    cacheDom();
    restoreSound();
    preloadBadges();
    bindOnce();
    resizeConfetti();
    webgl = initWebGL();
    restartGame();
  }

  // Wait for the site loader to lift so the board deals in on screen
  function boot() { (window.siteReady || Promise.resolve()).then(init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
