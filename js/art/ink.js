// Hand-drawn kit: slightly wobbly ink lines, rough circles, offset colour
// fills (like a two-pass print), paper grain and washi fibres.

import { rng, TAU, canvas } from '../core/util.js';
import { C } from './palette.js';

// Wobbly polyline through points, drawn as a smooth quadratic path.
export function wobble(points, amp, seed = 1) {
  const r = rng(seed);
  return points.map(([x, y], i) => (i === 0 || i === points.length - 1 ? [x, y] : [x + (r() - 0.5) * amp * 2, y + (r() - 0.5) * amp * 2]));
}

export function smoothPath(ctx, pts, closed = false) {
  if (pts.length < 2) return;
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 2) return void ctx.lineTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  const last = pts[pts.length - 1];
  if (closed) {
    const [fx, fy] = pts[0];
    ctx.quadraticCurveTo(last[0], last[1], (last[0] + fx) / 2, (last[1] + fy) / 2);
    ctx.closePath();
  } else ctx.lineTo(last[0], last[1]);
}

export function roughLine(ctx, x1, y1, x2, y2, { amp = 1.2, seed = 1, seg = 0 } = {}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = seg || Math.max(2, Math.round(len / 40));
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  smoothPath(ctx, wobble(pts, amp, seed));
}

// A hand-drawn ellipse that overshoots where the pen lifts.
export function roughEllipse(ctx, cx, cy, rx, ry, { amp = 0.03, seed = 1, overshoot = 0.12, start = -2.2 } = {}) {
  const r = rng(seed);
  const n = 28;
  const f1 = r() * TAU, f2 = r() * TAU;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = start + (i / n) * (TAU + overshoot);
    const k = 1 + amp * (Math.sin(t * 2 + f1) * 0.6 + Math.sin(t * 3 + f2) * 0.4) + (i / n) * amp * 0.8;
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]);
  }
  smoothPath(ctx, pts);
}

export function roughRect(ctx, x, y, w, h, { amp = 1.4, seed = 1, over = 3 } = {}) {
  const r = rng(seed);
  const o = () => (r() - 0.5) * over * 2;
  roughLine(ctx, x + o(), y + o(), x + w + o(), y + o(), { amp, seed: seed + 1 });
  roughLine(ctx, x + w + o(), y + o(), x + w + o(), y + h + o(), { amp, seed: seed + 2 });
  roughLine(ctx, x + w + o(), y + h + o(), x + o(), y + h + o(), { amp, seed: seed + 3 });
  roughLine(ctx, x + o(), y + h + o(), x + o(), y + o(), { amp, seed: seed + 4 });
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Ink stroke helper: sets style, builds path via fn, strokes.
export function ink(ctx, fn, { width = 3, color = C.ink, cap = 'round', alpha = 1 } = {}) {
  ctx.save();
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  fn(ctx);
  ctx.stroke();
  ctx.restore();
}

// Flat colour fill, nudged off the ink line like a misregistered print.
export function offsetFill(ctx, fn, color, dx = 0, dy = 0) {
  ctx.save();
  ctx.translate(dx, dy);
  ctx.fillStyle = color;
  ctx.beginPath();
  fn(ctx);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------- textures

const tiles = new Map();

// Grayscale noise tile; drawn with low alpha it reads as paper grain.
export function noiseTile(size = 192, seed = 5) {
  const key = `n${size}:${seed}`;
  if (tiles.has(key)) return tiles.get(key);
  const c = canvas(size, size);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  const r = rng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = 110 + r() * 145;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  tiles.set(key, c);
  return c;
}

// Paper: base colour + grain (+ optional washi fibres and soft mottling).
export function paper(ctx, w, h, { base = C.paper, grain = 0.06, fibers = 0, mottle = 0.04, seed = 3, x = 0, y = 0 } = {}) {
  ctx.save();
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  const r = rng(seed);
  if (mottle) {
    for (let i = 0; i < 7; i++) {
      const gx = x + r() * w, gy = y + r() * h, gr = (0.25 + r() * 0.45) * Math.max(w, h);
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      const dark = r() < 0.5;
      g.addColorStop(0, dark ? `rgba(120,95,60,${mottle})` : `rgba(255,255,255,${mottle * 1.6})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
    }
  }
  if (grain) {
    ctx.globalAlpha = grain;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = ctx.createPattern(noiseTile(192, seed), 'repeat');
    ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'source-over';
  }
  if (fibers) {
    ctx.lineCap = 'round';
    const n = Math.round(((w * h) / 9000) * fibers);
    for (let i = 0; i < n; i++) {
      const fx = x + r() * w, fy = y + r() * h, len = 6 + r() * 26, a = r() * TAU;
      ctx.globalAlpha = 0.08 + r() * 0.12;
      ctx.strokeStyle = r() < 0.7 ? '#b9ab8e' : '#ffffff';
      ctx.lineWidth = 0.6 + r() * 1.2;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(fx + Math.cos(a + 0.6) * len * 0.5, fy + Math.sin(a + 0.6) * len * 0.5, fx + Math.cos(a) * len, fy + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// Dotted grid (cutting-mat / notebook feel).
export function dotGrid(ctx, x, y, w, h, { gap = 24, r = 1.2, color = 'rgba(20,20,19,0.12)' } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap)
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, TAU);
      ctx.fill();
    }
  ctx.restore();
}

// Soft drop shadow under a rectangle-ish thing.
export function softShadow(ctx, fn, { blur = 18, y = 6, color = 'rgba(40,30,20,0.18)' } = {}) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetY = y;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  fn(ctx);
  ctx.fill();
  ctx.restore();
}

// Common tiny shapes -------------------------------------------------------

export function heartPath(ctx, cx, cy, s) {
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.25, cy + s * 0.05, cx - s * 0.95, cy - s * 0.95, cx, cy - s * 0.35);
  ctx.bezierCurveTo(cx + s * 0.95, cy - s * 0.95, cx + s * 1.25, cy + s * 0.05, cx, cy + s * 0.9);
  ctx.closePath();
}

export function sparklePath(ctx, cx, cy, s, thin = 0.28) {
  ctx.moveTo(cx, cy - s);
  ctx.quadraticCurveTo(cx + s * thin * 0.35, cy - s * thin * 0.35, cx + s, cy);
  ctx.quadraticCurveTo(cx + s * thin * 0.35, cy + s * thin * 0.35, cx, cy + s);
  ctx.quadraticCurveTo(cx - s * thin * 0.35, cy + s * thin * 0.35, cx - s, cy);
  ctx.quadraticCurveTo(cx - s * thin * 0.35, cy - s * thin * 0.35, cx, cy - s);
  ctx.closePath();
}
