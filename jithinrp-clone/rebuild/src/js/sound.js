import { gsap } from 'gsap';

/* Liquid sounds, synthesised with Web Audio (no files): hover "bubble" on cards, "drop" on links/buttons,
   "tick" on tool chips. Music: a looping lofi track under the same switch (fades in/out, pauses with the tab).
   Browsers keep audio locked until the first gesture; the switch reads "Click for sound" until then.
   The muted state is remembered; "M" toggles it too. */
export function setupSound() {
  const toggle = document.querySelector('[data-sound-toggle]');
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!toggle || !AC) { if (toggle) toggle.hidden = true; return; }

  const KEY = 'jrp-sound';
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch {}

  let ac = null, master = null, noise = null, lastAt = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  function impulse(seconds, decay) {
    const len = ac.sampleRate * seconds;
    const buf = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function unlock() {
    if (!ac) {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.3;
      const soften = ac.createBiquadFilter(); // dry path, softened so the highs never get shrill
      soften.type = 'lowpass';
      soften.frequency.value = 4200;
      master.connect(soften).connect(ac.destination);
      const room = ac.createConvolver();      // wet path: a short generated room
      room.buffer = impulse(1.1, 3.2);
      const wet = ac.createGain();
      wet.gain.value = 0.22;
      master.connect(room).connect(wet).connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate * 0.05, ac.sampleRate); // shared noise for the splash transient
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      ac.addEventListener('statechange', render);
    }
    return ac.state === 'suspended' ? ac.resume() : Promise.resolve();
  }

  // The switch shows "off" until the browser allows audio; if the first gesture is on the switch it turns sound ON
  let unlockedAt = -Infinity;
  const isLocked = () => enabled && !(ac && ac.state === 'running');
  const onGesture = (e) => {
    if (!enabled) return;
    if (isLocked()) unlockedAt = e.timeStamp;
    unlock().then(render, render);
    startMusic();
  };
  const isUnlockGesture = (e) => e.timeStamp - unlockedAt < 1000;
  ['pointerdown', 'mousedown', 'click', 'keydown', 'touchend'].forEach((ev) => addEventListener(ev, onGesture, { passive: true, capture: true }));

  /* One water drop: a falling drop traps an air bubble that rings as a sine whose pitch shoots up as it collapses, plus a splash. */
  function drip({ f0, len, level, delay = 0, rise = 2.6, pan = rand(-0.35, 0.35) }) {
    const t = ac.currentTime + delay;
    const out = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    if (out.pan) out.pan.value = pan;
    out.connect(master);

    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = 'sine';
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
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f0 * 4;
    bp.Q.value = 1.2;
    const sg = ac.createGain();
    sg.gain.setValueAtTime(level * 0.25, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.012);
    splash.connect(bp).connect(sg).connect(out);
    splash.start(t);
    splash.stop(t + 0.02);
  }
  const VOICES = {
    bubble() { const f = rand(230, 290); drip({ f0: f, len: 0.24, level: 0.6, rise: 3 }); drip({ f0: f * 1.7, len: 0.11, level: 0.25, delay: 0.085 }); },
    drop() { drip({ f0: rand(620, 820), len: 0.13, level: 0.5 }); },
    tick() { drip({ f0: rand(1150, 1400), len: 0.07, level: 0.3, rise: 2 }); },
  };
  const ready = () => enabled && ac && ac.state === 'running' && !document.hidden;
  function play(kind) {
    if (!ready()) return;
    const now = performance.now();
    if (now - lastAt < 70) return; // no machine-gunning across dense rows
    lastAt = now;
    VOICES[kind]();
  }

  /* ---- background music ---- */
  const MUSIC_VOL = 0.22;
  const music = new Audio();
  music.loop = true;
  music.preload = 'none'; // muted visitors never download it
  music.volume = 0;
  let musicSrcSet = false, musicWanted = false, musicPlaying = false;
  music.addEventListener('playing', () => { musicPlaying = true; });
  music.addEventListener('pause', () => { musicPlaying = false; });

  function startMusic() {
    musicWanted = true;
    if (!enabled || document.hidden) return;
    if (!musicSrcSet) { music.src = '/mp3/' + encodeURIComponent('Lofi BGM.mp3'); musicSrcSet = true; }
    if (musicPlaying) return;
    music.play().then(() => {
      if (enabled) gsap.to(music, { volume: MUSIC_VOL, duration: 2.4, ease: 'power1.out', overwrite: true });
    }).catch(() => {}); // still locked: the first gesture calls startMusic again
  }
  function stopMusic() {
    gsap.to(music, { volume: 0, duration: 0.8, ease: 'power1.in', overwrite: true, onComplete: () => music.pause() });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { gsap.killTweensOf(music); music.pause(); }
    else if (enabled && musicWanted) { music.volume = 0; startMusic(); }
  });

  // first matching rule wins, so cards beat the generic link rule
  const RULES = [['.tool', 'tick'], ['[data-href], .ai-card', 'bubble'], ['a, button', 'drop']];
  let current = null;
  document.addEventListener('pointerover', (e) => {
    if (e.pointerType !== 'mouse') return;
    let hit = null, kind = null;
    for (const [sel, k] of RULES) { const el = e.target.closest(sel); if (el) { hit = el; kind = k; break; } }
    if (hit === current) return;
    const backOut = hit && current && hit.contains(current); // e.g. tool chip → its card
    current = hit;
    if (hit && hit !== toggle && !backOut) play(kind);
  });

  function render() {
    const locked = isLocked();
    const audible = enabled && !locked;
    toggle.setAttribute('aria-pressed', String(audible));
    toggle.classList.toggle('is-waiting', locked);
    toggle.querySelector('.sound-toggle__label').textContent = audible ? 'Sound on' : locked ? 'Click for sound' : 'Sound off';
    toggle.title = locked ? 'Click anywhere to turn on music and sounds' : 'Music and sounds (M)';
  }
  function set(on) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch {}
    render();
    if (on) { unlock().then(() => VOICES.drop()); startMusic(); } else stopMusic();
  }
  toggle.addEventListener('click', (e) => { if (!isUnlockGesture(e)) set(!enabled); });
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'm' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest('input, textarea, [contenteditable]')) return;
    if (!isUnlockGesture(e)) set(!enabled);
  });

  render();
  if (enabled) { unlock().then(render, render); startMusic(); } // some browsers allow it straight away
}
