// All sounds are synthesised with WebAudio (no audio files): coin drops,
// countdown beeps, the shutter, the flash charging whine, the printer motor
// and a tiny per-theme background-music sequencer. The machine "voice" uses
// the browser's SpeechSynthesis when available and always shows subtitles.

import { store } from './store.js';

let ctx = null;
let master = null;
let musicBus = null;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/** Call from the first user gesture so later sounds are allowed. */
export function unlockAudio() {
  ac();
}

const on = () => store.get('sfx') && ac();

function env(g, t, a, d, peak = 1, sustain = 0) {
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a);
  g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
}

function tone({ freq = 440, type = 'sine', t = 0, a = 0.005, d = 0.2, vol = 0.4, to = null, dest = null, detune = 0 }) {
  const c = ac();
  const start = c.currentTime + t;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  o.detune.value = detune;
  if (to) o.frequency.exponentialRampToValueAtTime(to, start + a + d);
  env(g, start, a, d, vol);
  o.connect(g).connect(dest || master);
  o.start(start);
  o.stop(start + a + d + 0.05);
  return o;
}

let noiseBuf = null;
function noise({ t = 0, a = 0.002, d = 0.15, vol = 0.4, filter = 'highpass', f = 1200, q = 0.7, dest = null }) {
  const c = ac();
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const start = c.currentTime + t;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const fl = c.createBiquadFilter();
  fl.type = filter;
  fl.frequency.value = f;
  fl.Q.value = q;
  const g = c.createGain();
  env(g, start, a, d, vol);
  src.connect(fl).connect(g).connect(dest || master);
  src.start(start, Math.random() * 0.5);
  src.stop(start + a + d + 0.05);
}

export const sfx = {
  click() {
    if (!on()) return;
    tone({ freq: 1400, type: 'square', d: 0.04, vol: 0.08 });
  },
  select() {
    if (!on()) return;
    tone({ freq: 880, type: 'triangle', d: 0.08, vol: 0.18 });
    tone({ freq: 1320, type: 'triangle', t: 0.06, d: 0.1, vol: 0.14 });
  },
  back() {
    if (!on()) return;
    tone({ freq: 660, type: 'triangle', d: 0.08, vol: 0.15, to: 440 });
  },
  coin() {
    if (!on()) return;
    // metallic clink = two inharmonic partials, then the coin rattling down
    tone({ freq: 2637, type: 'sine', d: 0.35, vol: 0.25 });
    tone({ freq: 3951, type: 'sine', d: 0.25, vol: 0.14 });
    for (let i = 0; i < 4; i++) noise({ t: 0.12 + i * 0.07 * (1 - i * 0.12), d: 0.03, vol: 0.12 - i * 0.02, f: 3000 });
    tone({ freq: 1568, type: 'square', t: 0.45, d: 0.08, vol: 0.06 });
    tone({ freq: 2093, type: 'square', t: 0.53, d: 0.14, vol: 0.06 });
  },
  denied() {
    if (!on()) return;
    tone({ freq: 220, type: 'square', d: 0.18, vol: 0.12 });
    tone({ freq: 196, type: 'square', t: 0.2, d: 0.25, vol: 0.12 });
  },
  beep(high = false) {
    if (!on()) return;
    tone({ freq: high ? 1318 : 988, type: 'sine', d: high ? 0.35 : 0.12, vol: 0.28 });
  },
  charge() {
    if (!on()) return;
    // the rising whine of an old flash capacitor charging
    tone({ freq: 1800, type: 'sine', a: 0.02, d: 1.1, vol: 0.03, to: 7200 });
  },
  shutter() {
    if (!on()) return;
    noise({ d: 0.05, vol: 0.5, f: 2500 });
    tone({ freq: 180, type: 'square', d: 0.03, vol: 0.2 });
    noise({ t: 0.07, d: 0.08, vol: 0.35, f: 1800, filter: 'bandpass', q: 1.2 });
    tone({ freq: 120, type: 'square', t: 0.08, d: 0.04, vol: 0.15 });
  },
  sparkle() {
    if (!on()) return;
    [1760, 2217, 2637, 3520].forEach((f, i) => tone({ freq: f, type: 'triangle', t: i * 0.05, d: 0.18, vol: 0.08 }));
  },
  pop() {
    if (!on()) return;
    tone({ freq: 420, type: 'sine', d: 0.09, vol: 0.25, to: 900 });
  },
  whoosh() {
    if (!on()) return;
    noise({ a: 0.08, d: 0.25, vol: 0.15, filter: 'bandpass', f: 900, q: 0.6 });
  },
  ding() {
    if (!on()) return;
    tone({ freq: 1568, type: 'sine', d: 0.9, vol: 0.2 });
    tone({ freq: 2349, type: 'sine', t: 0.12, d: 1.1, vol: 0.14 });
  },
  warn() {
    if (!on()) return;
    tone({ freq: 740, type: 'square', d: 0.1, vol: 0.08 });
    tone({ freq: 740, type: 'square', t: 0.16, d: 0.1, vol: 0.08 });
  },
  fanfare() {
    if (!on()) return;
    [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, type: 'square', t: i * 0.09, d: 0.2, vol: 0.07 }));
    tone({ freq: 1047, type: 'triangle', t: 0.4, d: 0.6, vol: 0.12 });
  },
  /** Printer motor: returns a stop() function. */
  printer() {
    if (!on()) return () => {};
    const c = ac();
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 96;
    const lfo = c.createOscillator();
    lfo.frequency.value = 11;
    const lfoG = c.createGain();
    lfoG.gain.value = 18;
    lfo.connect(lfoG).connect(o.frequency);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 600;
    const g = c.createGain();
    g.gain.value = 0.0001;
    g.gain.exponentialRampToValueAtTime(0.09, c.currentTime + 0.15);
    o.connect(f).connect(g).connect(master);
    o.start();
    lfo.start();
    const ticker = setInterval(() => noise({ d: 0.02, vol: 0.05, f: 4000 }), 140);
    return () => {
      clearInterval(ticker);
      const t = c.currentTime;
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.stop(t + 0.25);
      lfo.stop(t + 0.25);
    };
  },
};

// ---------------------------------------------------------------------------
// Background music: a small step sequencer with a few styles per theme.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
let bgmTimer = null;
let bgmStep = 0;

const STYLES = {
  // bpm, bass pattern, chord voicings and a drum pattern per style
  lounge: { bpm: 104, swing: 0.22, wave: 'triangle', drums: 'brush' },
  kpop: { bpm: 118, swing: 0, wave: 'square', drums: 'four' },
  hiphop: { bpm: 88, swing: 0.18, wave: 'sawtooth', drums: 'boombap' },
  eurobeat: { bpm: 150, swing: 0, wave: 'sawtooth', drums: 'four' },
  chip: { bpm: 132, swing: 0, wave: 'square', drums: 'chip' },
  bounce: { bpm: 112, swing: 0.1, wave: 'square', drums: 'bounce' },
};

/**
 * Start a looping tune. `song` = { style, key (midi root), prog: [degrees...] }
 * Progression degrees are semitone offsets of the chord roots.
 */
export function playBgm(song) {
  stopBgm();
  if (!song || !store.get('bgm') || !ac()) return;
  const st = STYLES[song.style] || STYLES.kpop;
  const root = song.key ?? 57;
  const prog = song.prog || [0, 5, 7, 3];
  const minor = song.minor ?? false;
  const stepDur = 60 / st.bpm / 4;
  bgmStep = 0;
  let nextTime = ctx.currentTime + 0.1;
  const tick = () => {
    if (!store.get('bgm')) return stopBgm();
    while (nextTime < ctx.currentTime + 0.25) {
      scheduleStep(bgmStep, nextTime, st, root, prog, minor, stepDur);
      // swing: long-short pairs of 16th notes
      nextTime += stepDur * (bgmStep % 2 === 0 ? 1 + st.swing : 1 - st.swing);
      bgmStep++;
    }
  };
  bgmTimer = setInterval(tick, 60);
  tick();
}

export function stopBgm() {
  if (bgmTimer) clearInterval(bgmTimer);
  bgmTimer = null;
}

function voice(freq, t, dur, type, vol) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function drum(kind, t) {
  if (kind === 'kick') {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(musicBus);
    o.start(t);
    o.stop(t + 0.2);
  } else {
    if (!noiseBuf) return;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = kind === 'snare' ? 'bandpass' : 'highpass';
    f.frequency.value = kind === 'snare' ? 1800 : 7000;
    const g = ctx.createGain();
    const d = kind === 'snare' ? 0.14 : kind === 'brush' ? 0.09 : 0.035;
    const v = kind === 'snare' ? 0.5 : kind === 'brush' ? 0.12 : 0.18;
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f).connect(g).connect(musicBus);
    src.start(t, Math.random());
    src.stop(t + d + 0.02);
  }
}

function scheduleStep(step, t, st, root, prog, minor, sd) {
  const bar = Math.floor(step / 16) % prog.length;
  const s = step % 16;
  const chordRoot = root + prog[bar];
  const third = minor ? 3 : 4;
  const chord = [0, third, 7, 11];
  if (!noiseBuf) noise({ vol: 0.0001, d: 0.01 }); // lazily create the noise buffer
  // drums
  const dp = st.drums;
  if (dp === 'four') {
    if (s % 4 === 0) drum('kick', t);
    if (s % 8 === 4) drum('snare', t);
    if (s % 2 === 1) drum('hat', t);
  } else if (dp === 'boombap') {
    if (s === 0 || s === 7 || s === 10) drum('kick', t);
    if (s === 4 || s === 12) drum('snare', t);
    if (s % 2 === 0) drum('hat', t);
  } else if (dp === 'brush') {
    if (s % 4 === 0) drum('brush', t);
    if (s % 4 === 3) drum('brush', t);
    if (s === 0 || s === 8) drum('kick', t);
  } else if (dp === 'chip') {
    if (s % 8 === 0) drum('kick', t);
    if (s % 8 === 4) drum('hat', t);
  } else if (dp === 'bounce') {
    if (s % 4 === 0) drum('kick', t);
    if (s % 4 === 2) drum('snare', t);
  }
  // bass
  const bassPat = st.drums === 'four' && st.bpm > 140 ? [0, 12, 0, 12] : [0, null, null, 0];
  const b = bassPat[s % 4];
  if (b !== null && (st.bpm > 140 || s % 4 === 0 || s === 14)) {
    voice(NOTE(chordRoot - 24 + b), t, sd * 1.6, st.wave === 'square' ? 'triangle' : 'sawtooth', 0.22);
  }
  // chords / arpeggio
  if (st.drums === 'chip' || st.drums === 'four') {
    const n = chord[s % 4];
    voice(NOTE(chordRoot + 12 + n), t, sd * 0.9, st.wave, 0.06);
  } else if (s === 0 || s === 6 || s === 10) {
    for (const n of chord.slice(0, 3)) voice(NOTE(chordRoot + 12 + n), t, sd * 3, st.wave, 0.05);
  }
  // simple melody sprinkle
  if (s === 0 || s === 3 || s === 8 || s === 11 || s === 14) {
    const scale = minor ? [0, 3, 5, 7, 10, 12] : [0, 4, 7, 9, 12, 14];
    const n = scale[(step * 7 + bar * 3) % scale.length];
    voice(NOTE(chordRoot + 24 + n), t, sd * 1.8, 'triangle', 0.05);
  }
}

// ---------------------------------------------------------------------------
// Machine voice (SpeechSynthesis) + subtitle callback.

let subtitleSink = null;
export function setSubtitleSink(fn) {
  subtitleSink = fn;
}

function findVoice(lang) {
  const vs = window.speechSynthesis?.getVoices?.() || [];
  const base = lang.split('-')[0];
  return vs.find((v) => v.lang === lang) || vs.find((v) => v.lang?.startsWith(base));
}

/**
 * Speak a line. `line` may be a string or { text, lang, sub } where `sub` is
 * the Chinese subtitle shown when the spoken text is in another language.
 */
export function say(line, opts = {}) {
  if (!line) return;
  const l = typeof line === 'string' ? { text: line } : line;
  const lang = l.lang || opts.lang || 'zh-CN';
  subtitleSink?.(l.sub ? `${l.text}（${l.sub}）` : l.text);
  if (!store.get('voice') || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(l.text);
    u.lang = lang;
    const v = findVoice(lang);
    if (v) u.voice = v;
    u.rate = opts.rate ?? 1.05;
    u.pitch = opts.pitch ?? 1.2;
    u.volume = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* speech not available */
  }
}

export function hush() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* ignore */
  }
}
