// The spark: rounded rays of uneven length radiating from a solid hub.
// Drawn procedurally (canvas Path2D or SVG path data) so it can breathe,
// spin, grow an outline, or be stamped by the doodle pens.

import { rng, TAU, dpr } from '../core/util.js';
import { C } from './palette.js';

export const SPARK_SEED = 3;

const rayCache = new Map();

export function sparkRays(seed = SPARK_SEED, n = 12) {
  const key = `${seed}:${n}`;
  if (rayCache.has(key)) return rayCache.get(key);
  const r = rng(seed * 7919 + 101);
  const rays = [];
  const start = -Math.PI / 2 + (r() - 0.5) * 0.25;
  for (let i = 0; i < n; i++) {
    const a = start + (i / n) * TAU + (r() - 0.5) * (TAU / n) * 0.42;
    const len = 0.62 + r() * 0.38;
    rays.push({ a, len, w: 0.1 + r() * 0.035, tip: 0.078 + r() * 0.026, ph: r() * TAU });
  }
  rayCache.set(key, rays);
  return rays;
}

// Geometry of one frame of the spark: [{x, y, tx, ty, ...}] in pixels.
function rayGeometry(cx, cy, R, { seed = SPARK_SEED, n = 12, rot = 0, t = 0, breathe = 0, grow = 0 }) {
  return sparkRays(seed, n).map((ray) => {
    const a = ray.a + rot;
    const L = R * ray.len * (1 + breathe * Math.sin(t * 2.4 + ray.ph)) + grow;
    const wt = R * ray.tip + grow;
    const wb = R * ray.w + grow;
    return { a, L, wt, wb, cx, cy };
  });
}

export function sparkPath(cx, cy, R, opts = {}) {
  const p = new Path2D();
  const grow = opts.grow || 0;
  for (const { a, L, wt, wb } of rayGeometry(cx, cy, R, opts)) {
    const ux = Math.cos(a), uy = Math.sin(a);
    const px = -uy, py = ux; // a + 90°
    const tl = Math.max(L - wt, wt);
    p.moveTo(cx + px * wb, cy + py * wb);
    p.lineTo(cx + ux * tl + px * wt, cy + uy * tl + py * wt);
    p.arc(cx + ux * tl, cy + uy * tl, wt, a + Math.PI / 2, a - Math.PI / 2, true);
    p.lineTo(cx - px * wb, cy - py * wb);
    p.closePath();
  }
  const hub = R * 0.17 + grow;
  p.moveTo(cx + hub, cy);
  p.arc(cx, cy, hub, 0, TAU, true);
  return p;
}

// Fill a spark. `outline` draws a contour (e.g. ink or a white die-cut edge).
export function drawSpark(ctx, cx, cy, R, { color = C.orange, outline = null, outlineWidth = 0, ...opts } = {}) {
  if (outline && outlineWidth) {
    ctx.fillStyle = outline;
    ctx.fill(sparkPath(cx, cy, R, { ...opts, grow: outlineWidth }));
  }
  ctx.fillStyle = color;
  ctx.fill(sparkPath(cx, cy, R, opts));
}

// SVG path data for a spark centred in a size×size box.
export function sparkD(size = 24, opts = {}) {
  const c = size / 2;
  const R = c * (opts.scale ?? 0.96);
  const f = (v) => Math.round(v * 100) / 100;
  let d = '';
  for (const { a, L, wt, wb } of rayGeometry(c, c, R, opts)) {
    const ux = Math.cos(a), uy = Math.sin(a);
    const px = -uy, py = ux;
    const tl = Math.max(L - wt, wt);
    const tx = c + ux * tl, ty = c + uy * tl;
    d += `M${f(c + px * wb)} ${f(c + py * wb)}L${f(tx + px * wt)} ${f(ty + py * wt)}`;
    d += `A${f(wt)} ${f(wt)} 0 0 0 ${f(tx + ux * wt)} ${f(ty + uy * wt)}`;
    d += `A${f(wt)} ${f(wt)} 0 0 0 ${f(tx - px * wt)} ${f(ty - py * wt)}`;
    d += `L${f(c - px * wb)} ${f(c - py * wb)}Z`;
  }
  const hub = R * 0.17;
  d += `M${f(c - hub)} ${f(c)}A${f(hub)} ${f(hub)} 0 1 0 ${f(c + hub)} ${f(c)}A${f(hub)} ${f(hub)} 0 1 0 ${f(c - hub)} ${f(c)}Z`;
  return d;
}

export function sparkSVG(size = 24, { color = C.orange, title = '', ...opts } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"${
    title ? ` role="img" aria-label="${title}"` : ' aria-hidden="true"'
  }><path fill="${color}" d="${sparkD(size, opts)}"/></svg>`;
}

// ------------------------------------------------------------ live icon

const live = new Set();
let rafId = 0;

function loop(now) {
  rafId = 0;
  for (const icon of live) icon.render(now / 1000);
  if (live.size) rafId = requestAnimationFrame(loop);
}

// An animated spark on a canvas. mode: 'still' | 'breathe' | 'think' (spin + breathe)
export class SparkIcon {
  constructor({ size = 24, color = C.orange, mode = 'still', seed = SPARK_SEED, label = '' } = {}) {
    this.size = size;
    this.color = color;
    this.seed = seed;
    this.el = document.createElement('canvas');
    this.el.className = 'spark-icon';
    const k = dpr();
    this.el.width = this.el.height = Math.round(size * k);
    this.el.style.width = this.el.style.height = `${size}px`;
    if (label) {
      this.el.setAttribute('role', 'img');
      this.el.setAttribute('aria-label', label);
    } else this.el.setAttribute('aria-hidden', 'true');
    this.t0 = performance.now() / 1000;
    this.rot = 0;
    this.last = null;
    this.setMode(mode);
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'still' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      live.delete(this);
      this.render(performance.now() / 1000, true);
    } else {
      live.add(this);
      if (!rafId) rafId = requestAnimationFrame(loop);
    }
    return this;
  }

  render(t, still = false) {
    const ctx = this.el.getContext('2d');
    const W = this.el.width;
    ctx.clearRect(0, 0, W, W);
    const dt = this.last == null ? 0 : Math.min(0.05, t - this.last);
    this.last = t;
    const think = this.mode === 'think' && !still;
    if (think) this.rot += dt * 1.6;
    else if (this.mode === 'breathe' && !still) this.rot += dt * 0.25;
    ctx.fillStyle = this.color;
    ctx.fill(
      sparkPath(W / 2, W / 2, W * 0.48, {
        seed: this.seed,
        rot: this.rot,
        t: t - this.t0,
        breathe: still ? 0 : think ? 0.16 : 0.07,
      }),
    );
  }

  destroy() {
    live.delete(this);
  }
}

// Swap the favicon for a JS-drawn spark.
export function setFavicon() {
  const link = document.querySelector('link[rel="icon"]') || document.head.appendChild(document.createElement('link'));
  link.rel = 'icon';
  link.href = `data:image/svg+xml,${encodeURIComponent(sparkSVG(64))}`;
}
