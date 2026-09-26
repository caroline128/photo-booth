// Small helpers shared across the app.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export const ease = {
  outCubic: (t) => 1 - (1 - t) ** 3,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
  outBack: (t, s = 1.70158) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2,
  outQuint: (t) => 1 - (1 - t) ** 5,
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};

// Deterministic PRNG (mulberry32) so drawings look the same every render.
export function rng(seed = 1) {
  let a = seed >>> 0 || 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];

export function shuffle(arr, r = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function abortError() {
  return new DOMException('Aborted', 'AbortError');
}

export const isAbort = (e) => e?.name === 'AbortError';

export function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const id = setTimeout(done, ms);
    function done() {
      signal?.removeEventListener('abort', stop);
      resolve();
    }
    function stop() {
      clearTimeout(id);
      reject(abortError());
    }
    signal?.addEventListener('abort', stop, { once: true });
  });
}

export const nextFrame = () => new Promise((r) => requestAnimationFrame(r));

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

export const dpr = () => Math.min(2, window.devicePixelRatio || 1);

export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const pad = (n, k = 2) => String(n).padStart(k, '0');

export function fmtDate(d = new Date(), sep = '.') {
  return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join(sep);
}

export function fmtTime(d = new Date()) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtClock(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

export function toBlob(c, type = 'image/png', quality) {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), type, quality),
  );
}

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Resolve when `type` fires on `target`, or reject when the signal aborts.
export function when(target, type, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const stop = () => {
      target.removeEventListener(type, go);
      reject(abortError());
    };
    const go = (e) => {
      signal?.removeEventListener('abort', stop);
      resolve(e);
    };
    target.addEventListener(type, go, { once: true });
    signal?.addEventListener('abort', stop, { once: true });
  });
}

// A promise with its resolve/reject exposed, rejected when `signal` aborts.
export function deferred(signal) {
  let resolve, reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  // Leftover deferreds (e.g. an unused "skip") must not surface as unhandled
  // rejections when the session is aborted; awaiting one still rejects.
  promise.catch(() => {});
  if (signal) {
    if (signal.aborted) reject(abortError());
    else signal.addEventListener('abort', () => reject(abortError()), { once: true });
  }
  return { promise, resolve, reject };
}

export function query() {
  return new URLSearchParams(location.search);
}

// Dev/test switch: ?fast=1 shortens countdowns and timers.
export const FAST = query().has('fast');
