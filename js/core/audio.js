// Every sound is synthesised with WebAudio: soft marimba chimes for Claude,
// a mechanical shutter, a thermal-printer motor. Voice uses SpeechSynthesis.

import { settings } from './store.js';

let ac = null;
let out = null;

function audio() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 3;
    out = ac.createGain();
    out.gain.value = 0.55;
    out.connect(comp).connect(ac.destination);
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}

export function unlockAudio() {
  audio();
}

const enabled = () => settings.get('sound') !== false;

function env(g, t0, vol, attack, dur) {
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
}

function tone(f, { at = 0, dur = 0.3, vol = 0.12, type = 'sine', attack = 0.006, to = null, dest = null } = {}) {
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  env(g, t0, vol, attack, dur);
  o.connect(g).connect(dest || out);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

let noiseBuf = null;
function noise({ at = 0, dur = 0.1, vol = 0.2, type = 'bandpass', f = 1000, q = 1, to = null, attack = 0.002 } = {}) {
  const a = audio();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t0 = a.currentTime + at;
  const src = a.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const flt = a.createBiquadFilter();
  flt.type = type;
  flt.frequency.setValueAtTime(f, t0);
  if (to) flt.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  flt.Q.value = q;
  const g = a.createGain();
  env(g, t0, vol, attack, dur);
  src.connect(flt).connect(g).connect(out);
  src.start(t0, Math.random() * 0.5);
  src.stop(t0 + dur + 0.05);
}

// marimba-ish mallet: fundamental plus a quiet 4th harmonic, fast decay
function mallet(f, at = 0, vol = 0.1, dur = 0.55) {
  tone(f, { at, dur, vol, attack: 0.004 });
  tone(f * 4, { at, dur: dur * 0.25, vol: vol * 0.18, attack: 0.002 });
}

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);

export const sfx = {
  tick() {
    if (!enabled()) return;
    tone(2200, { dur: 0.03, vol: 0.035, type: 'triangle', attack: 0.001 });
  },
  select() {
    if (!enabled()) return;
    mallet(NOTE(79), 0, 0.07, 0.35);
    mallet(NOTE(86), 0.05, 0.05, 0.4);
  },
  chime() {
    if (!enabled()) return;
    mallet(NOTE(76), 0, 0.06, 0.6);
    mallet(NOTE(83), 0.09, 0.05, 0.8);
  },
  count(n) {
    if (!enabled()) return;
    const notes = { 5: 72, 4: 74, 3: 76, 2: 79, 1: 81 };
    mallet(NOTE(notes[n] || 74), 0, 0.11, 0.5);
  },
  shutter() {
    if (!enabled()) return;
    noise({ dur: 0.018, vol: 0.5, type: 'highpass', f: 2500 });
    noise({ at: 0.01, dur: 0.07, vol: 0.18, type: 'bandpass', f: 1400, q: 0.8 });
    tone(140, { at: 0, dur: 0.06, vol: 0.12, type: 'sine', to: 70 });
    noise({ at: 0.085, dur: 0.02, vol: 0.35, type: 'highpass', f: 3000 });
    noise({ at: 0.1, dur: 0.22, vol: 0.05, type: 'bandpass', f: 600, to: 2400, q: 1.2 });
  },
  pop() {
    if (!enabled()) return;
    tone(380, { dur: 0.09, vol: 0.1, to: 920, attack: 0.002 });
    tone(1600, { at: 0.02, dur: 0.05, vol: 0.02 });
  },
  whoosh() {
    if (!enabled()) return;
    noise({ dur: 0.35, vol: 0.06, type: 'bandpass', f: 300, to: 2600, q: 0.7, attack: 0.08 });
  },
  done() {
    if (!enabled()) return;
    [72, 76, 79, 84].forEach((n, i) => mallet(NOTE(n), i * 0.09, 0.08, 0.7));
    mallet(NOTE(88), 0.42, 0.05, 1.1);
  },
  error() {
    if (!enabled()) return;
    mallet(NOTE(67), 0, 0.08);
    mallet(NOTE(63), 0.12, 0.08);
  },
  // thermal printer motor; returns a stop() function
  printer() {
    const a = audio();
    if (!a || !enabled()) return () => {};
    const t0 = a.currentTime;
    const o = a.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 62;
    const lfo = a.createOscillator();
    lfo.frequency.value = 14;
    const lfoGain = a.createGain();
    lfoGain.gain.value = 0.02;
    const flt = a.createBiquadFilter();
    flt.type = 'lowpass';
    flt.frequency.value = 420;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.05, t0 + 0.15);
    lfo.connect(lfoGain).connect(g.gain);
    o.connect(flt).connect(g).connect(out);
    o.start(t0);
    lfo.start(t0);
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      const t = a.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(g.gain.value || 0.03, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.stop(t + 0.25);
      lfo.stop(t + 0.25);
    };
  },
};

// ------------------------------------------------------------------ voice

let voices = [];
function loadVoices() {
  voices = window.speechSynthesis?.getVoices?.() || [];
}
if (window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

export const voice = {
  available: () => !!window.speechSynthesis,
  speak(text) {
    if (!settings.get('voice') || !window.speechSynthesis) return;
    const clean = String(text)
      .replace(/[*`#>_]/g, '')
      .replace(/[\u{1F300}-\u{1FAFF}☀-➿✻✶✳✢]/gu, '')
      .trim();
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'zh-CN';
    u.rate = 1.04;
    u.pitch = 1;
    const v = voices.find((x) => /zh[-_]CN/i.test(x.lang)) || voices.find((x) => /^zh/i.test(x.lang));
    if (v) u.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  },
  cancel() {
    window.speechSynthesis?.cancel();
  },
};
