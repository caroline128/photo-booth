// 手账插画: a planner page — oat paper with a dot grid, photos in wobbly ink
// frames over offset colour blocks, washi tape on the corners, handwritten
// captions, and little doodles tucked into whatever space is left.

import { font } from '../../core/fonts.js';
import { fit, wrap } from '../../core/text.js';
import { rng, TAU, shuffle } from '../../core/util.js';
import { C } from '../../art/palette.js';
import { paper, dotGrid, roughRect, roughEllipse, wobble, smoothPath, ink, offsetFill, heartPath, sparklePath } from '../../art/ink.js';
import { sparkPath, sparkRays } from '../../art/spark.js';
import { drawMascot } from '../../art/mascot.js';
import { place, isNarrow } from '../layouts.js';
import { dateText } from './common.js';

const INK = '#23201c';
const BLOCKS = [C.peach, C.sky, C.sage, C.sand, C.blush, C.oat];
const TAPES = [
  { base: 'rgba(217,119,87,0.6)', line: 'rgba(255,255,255,0.45)', kind: 'stripe' },
  { base: 'rgba(106,155,204,0.55)', line: 'rgba(255,255,255,0.6)', kind: 'dot' },
  { base: 'rgba(185,198,163,0.78)', line: 'rgba(120,140,93,0.45)', kind: 'grid' },
  { base: 'rgba(235,219,188,0.88)', line: 'rgba(217,119,87,0.55)', kind: 'dot' },
  { base: 'rgba(242,196,173,0.82)', line: 'rgba(255,255,255,0.6)', kind: 'stripe' },
];
const FALLBACK = '今日份的快乐';
const POSES = ['wave', 'peace', 'heart', 'cheer', 'wink'];

// Pose prompts carry symbols like ✌ and ✻; the canvas only gets plain text.
const clean = (t) => String(t || '').replace(/[\p{So}\p{Extended_Pictographic}\u{FE0F}]/gu, '').trim();
const captionOf = (info, i) => clean((info.poses || [])[i % Math.max(1, (info.poses || []).length)]);

// ------------------------------------------------------------- doodles

function leaf(ctx, x, y, len, a, w = 0.42) {
  const ux = Math.cos(a), uy = Math.sin(a);
  const mx = x + ux * len * 0.5, my = y + uy * len * 0.5;
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(mx - uy * len * w, my + ux * len * w, x + ux * len, y + uy * len);
  ctx.quadraticCurveTo(mx + uy * len * w, my - ux * len * w, x, y);
}

// A sprig: curved stem, alternating leaves.
function sprig(ctx, s, lw) {
  const stem = (t) => [Math.sin((t + 1) * 1.5) * s * 0.16, -t * s];
  const leaves = [[-0.35, -0.95], [0.05, 0.95], [0.42, -0.9], [0.75, 0.8]].map(([t, a]) => [...stem(t), s * (0.62 - t * 0.12), -Math.PI / 2 + a]);
  for (const [x, y, len, a] of leaves) offsetFill(ctx, (c) => leaf(c, x, y, len, a), C.sage, s * 0.08, s * 0.07);
  ink(ctx, (c) => smoothPath(c, [-1, -0.5, 0, 0.5, 1].map(stem)), { width: lw, color: INK });
  for (const [x, y, len, a] of leaves) ink(ctx, (c) => leaf(c, x, y, len, a), { width: lw, color: INK });
}

function sparkle(ctx, s, lw) {
  offsetFill(ctx, (c) => sparklePath(c, 0, 0, s, 0.3), C.peach, s * 0.1, s * 0.1);
  ink(ctx, (c) => sparklePath(c, 0, 0, s, 0.3), { width: lw, color: INK });
  ink(ctx, (c) => sparklePath(c, s * 0.95, -s * 0.72, s * 0.28, 0.3), { width: lw * 0.8, color: INK });
}

// The spark drawn by hand: orange fill, then ink rays like a pen asterisk.
function spark(ctx, s, lw) {
  ctx.fillStyle = C.orange;
  ctx.fill(sparkPath(s * 0.1, s * 0.1, s, { seed: 5 }));
  ink(ctx, (c) => {
    for (const ray of sparkRays(5)) {
      c.moveTo(Math.cos(ray.a) * s * 0.18, Math.sin(ray.a) * s * 0.18);
      c.lineTo(Math.cos(ray.a) * s * ray.len * 0.92, Math.sin(ray.a) * s * ray.len * 0.92);
    }
  }, { width: lw, color: INK });
}

function heart(ctx, s, lw) {
  offsetFill(ctx, (c) => heartPath(c, 0, 0, s * 0.8), C.orange, s * 0.12, s * 0.1);
  ink(ctx, (c) => heartPath(c, 0, -s * 0.04, s * 0.8), { width: lw, color: INK });
}

// A loopy arrow (a prolate cycloid with one loop) ending in a small head.
function arrow(ctx, s, lw, r) {
  const rr = s * 0.4;
  const pts = [];
  for (let i = 0; i <= 36; i++) {
    const u = i / 36, th = Math.PI / 2 + TAU * u;
    pts.push([-s + 2 * s * u - rr * Math.sin(th) + rr, -rr * Math.cos(th)]);
  }
  ink(ctx, (c) => smoothPath(c, wobble(pts, s * 0.015, Math.floor(r() * 1e6))), { width: lw, color: INK });
  const a = Math.atan2(TAU * rr, 2 * s), hl = s * 0.3;
  ink(ctx, (c) => {
    c.moveTo(s - Math.cos(a - 0.5) * hl, -Math.sin(a - 0.5) * hl);
    c.lineTo(s, 0);
    c.lineTo(s - Math.cos(a + 0.5) * hl, -Math.sin(a + 0.5) * hl);
  }, { width: lw, color: INK });
}

function squiggle(ctx, s, lw, r) {
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push([-s + (2 * s * i) / 8, (i % 2 ? -1 : 1) * s * 0.16]);
  ink(ctx, (c) => smoothPath(c, pts), { width: lw * 1.3, color: r() < 0.5 ? C.orange : C.blue });
}

function confetti(ctx, s, lw, r) {
  const cols = [C.blue, C.orange, C.green];
  for (const [x, y, k] of [[-0.55, 0.3, 0.2], [0.15, -0.45, 0.26], [0.6, 0.3, 0.16], [-0.1, 0.62, 0.12]]) {
    ctx.fillStyle = cols[Math.floor(r() * cols.length)];
    ctx.beginPath();
    ctx.arc(x * s, y * s, k * s, 0, TAU);
    ctx.fill();
  }
}

const DOODLES = { sprig, sparkle, spark, heart, arrow, squiggle, confetti };
const KINDS = ['sprig', 'sparkle', 'heart', 'spark', 'arrow', 'sparkle', 'heart', 'squiggle', 'spark', 'sprig', 'confetti'];

// Distance from a point to a box (negative inside).
function dist(x, y, b) {
  const dx = Math.max(b.x - x, 0, x - (b.x + b.w));
  const dy = Math.max(b.y - y, 0, y - (b.y + b.h));
  return dx || dy ? Math.hypot(dx, dy) : -1;
}

// Best-candidate scatter: each doodle goes into the roomiest spot left.
function scatter(L, keep, seed, { count, min, max, edge }) {
  const r = rng(seed);
  const out = [];
  const room = (x, y) => {
    let m = Math.min(max, x - edge * 0.5, L.W - edge * 0.5 - x, y - edge * 0.5, L.H - edge * 0.5 - y);
    for (const b of keep) m = Math.min(m, dist(x, y, b));
    for (const d of out) m = Math.min(m, Math.hypot(x - d.x, y - d.y) - d.s - min * 0.5);
    return m;
  };
  for (let k = 0; k < count; k++) {
    let best = null;
    for (let j = 0; j < 70; j++) {
      const x = edge + r() * (L.W - edge * 2), y = edge + r() * (L.H - edge * 2);
      const m = room(x, y);
      const score = m * (0.8 + r() * 0.4);
      if (m >= min && (!best || score > best.score)) best = { x, y, s: m, score };
    }
    if (!best) break;
    out.push(best);
  }
  return out;
}

// ------------------------------------------------------------ washi tape

// Tape pieces for one photo: one or two opposite corners, seeded per slot,
// each slid into the photo until it clears every caption.
function tapesFor(ctx, s, i, L, G, info) {
  const n = isNarrow(L);
  const r = rng(info.seed + 100 + i);
  const w = n ? 84 : 132, h = n ? 24 : 36;
  const style = TAPES[Math.floor(r() * TAPES.length)];
  const corners = [
    [s.x + w * 0.16, s.y + h * 0.1, -0.64, 1, 1],
    [s.x + s.w - w * 0.16, s.y + h * 0.1, 0.64, -1, 1],
    [s.x + s.w - w * 0.16, s.y + s.h - h * 0.1, -0.64, -1, -1],
    [s.x + w * 0.16, s.y + s.h - h * 0.1, 0.64, 1, -1],
  ];
  const first = Math.floor(r() * 4);
  const picks = r() < 0.55 ? [first, (first + 2) % 4] : [first];
  const caps = G.slots.map((q, j) => captionOf(info, j) && caption(ctx, q, j, L, G, info).box).filter(Boolean);
  const hits = (t) => caps.some((b) => overlaps(tapeBox(t), b));
  return picks
    .map((k) => {
      const [x, y, a, ix, iy] = corners[k];
      const t = { x, y, w: w * (0.88 + r() * 0.22), h, a: a + (r() - 0.5) * 0.2, style, seed: info.seed + i * 13 + k };
      for (let step = 0; step < 8 && hits(t); step++) {
        t.x += ix * 4;
        t.y += iy * 5;
      }
      return hits(t) ? null : t;
    })
    .filter(Boolean);
}

const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function tape(ctx, { x: cx, y: cy, w, h, a, style, seed }) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  const teeth = 5, tw = h / teeth;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 1; i <= teeth; i++) ctx.lineTo(w / 2 + (i % 2 ? tw * 0.35 : 0) + (r() - 0.5) * 2, -h / 2 + i * tw);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = teeth - 1; i >= 0; i--) ctx.lineTo(-w / 2 - (i % 2 ? tw * 0.35 : 0) + (r() - 0.5) * 2, -h / 2 + i * tw);
  ctx.closePath();
  ctx.fillStyle = style.base;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = ctx.strokeStyle = style.line;
  ctx.lineWidth = h * 0.12;
  if (style.kind === 'stripe') {
    for (let x = -w; x < w; x += h * 0.45) {
      ctx.beginPath();
      ctx.moveTo(x, -h / 2);
      ctx.lineTo(x + h * 0.6, h / 2);
      ctx.stroke();
    }
  } else if (style.kind === 'dot') {
    for (let y = -h / 2 + h * 0.25, row = 0; y < h / 2; y += h * 0.5, row++)
      for (let x = -w / 2 + (row % 2) * h * 0.25; x < w / 2 + h; x += h * 0.5) {
        ctx.beginPath();
        ctx.arc(x, y, h * 0.08, 0, TAU);
        ctx.fill();
      }
  } else {
    ctx.lineWidth = Math.max(1, h * 0.05);
    for (let x = -w / 2; x < w / 2; x += h * 0.33) ctx.strokeRect(x, -h / 2 - 2, h * 0.33, h + 4);
    ctx.beginPath();
    ctx.moveTo(-w / 2, 0);
    ctx.lineTo(w / 2, 0);
    ctx.stroke();
  }
  ctx.restore();
}

// Axis-aligned box around a rotated tape piece.
function tapeBox(t) {
  const c = Math.abs(Math.cos(t.a)), s = Math.abs(Math.sin(t.a));
  const w = t.w * c + t.h * s, h = t.w * s + t.h * c;
  return { x: t.x - w / 2, y: t.y - h / 2, w, h };
}

// ---------------------------------------------------------------- captions

// Caption under a photo: text, size (sets ctx.font) and its box.
function caption(ctx, s, i, L, G, info) {
  const n = isNarrow(L);
  const text = captionOf(info, i);
  const size = fit(ctx, text, Math.min(s.w, L.W - 40), { max: n ? 30 : 40, min: 14, weight: 400, family: 'handCn' });
  const w = ctx.measureText(text).width;
  const y = s.y + s.h + G.below * 0.72;
  return { text, size, x: s.x + s.w / 2, y, box: { x: s.x + s.w / 2 - w / 2 - 8, y: y - size, w: w + 16, h: size * 1.3 } };
}

// Title lines: one line if it fits at a decent size, else two balanced lines.
function titleLines(ctx, text, maxW, max, min) {
  const f = (size) => font(400, size, 'handCn');
  ctx.font = f(max);
  const w = ctx.measureText(text).width;
  if (w <= maxW) return { size: max, lines: [text] };
  if (w * (min / max) * 1.35 <= maxW) {
    const size = Math.floor((max * maxW) / w);
    ctx.font = f(size);
    return { size, lines: [text] };
  }
  for (let size = max; size >= min; size = Math.floor(size * 0.93)) {
    ctx.font = f(size);
    let lines = wrap(ctx, text, maxW);
    if (lines.length > 2) continue;
    // balance the two lines
    for (let bw = maxW * 0.5; bw < maxW; bw += 8) {
      const b = wrap(ctx, text, bw);
      if (b.length <= 2) {
        lines = b;
        break;
      }
    }
    return { size, lines };
  }
  ctx.font = f(min);
  const lines = wrap(ctx, text, maxW).slice(0, 2);
  if (wrap(ctx, text, maxW).length > 2) {
    let l = lines[1];
    while (l.length && ctx.measureText(l + '…').width > maxW) l = l.slice(0, -1);
    lines[1] = l + '…';
  }
  return { size: min, lines };
}

// ------------------------------------------------------------------ frame

export default {
  id: 'doodle',
  name: '手账插画',
  desc: '点阵纸、胶带和手写小字，边上画满小涂鸦',

  geometry(L) {
    const n = isNarrow(L);
    const head = n ? 200 : 250, foot = n ? 86 : 118, side = n ? 46 : 96;
    const below = n ? 52 : 70;
    const box = { x: side, y: head, w: L.W - side * 2, h: L.H - head - foot };
    const slots = place(L, box, { gap: n ? 22 : 34, below, hgap: n ? 30 : 64 });
    return { slots, head, foot, below };
  },

  fonts(L, info) {
    const caps = Array.from({ length: L.count }, (_, i) => captionOf(info, i)).join('');
    return [
      [font(400, 80, 'handCn'), (info.title || FALLBACK) + caps + '…'],
      [font(700, 40, 'hand'), dateText(info) + `with Claude ${info.modelName}`],
    ];
  },

  under(ctx, L, G, info) {
    const n = isNarrow(L);
    paper(ctx, L.W, L.H, { base: '#f6f0e3', grain: 0.05, mottle: 0.03, seed: info.seed });
    dotGrid(ctx, 0, 0, L.W, L.H, { gap: n ? 30 : 38, r: n ? 1.6 : 2, color: 'rgba(60,50,40,0.16)' });
    // colour blocks behind the photos, nudged off like a second print pass
    const cols = shuffle(BLOCKS, rng(info.seed + 11));
    const d = n ? 9 : 14;
    G.slots.forEach((s, i) => {
      ctx.fillStyle = cols[i % cols.length];
      ctx.fillRect(s.x + d, s.y + d, s.w, s.h);
    });
  },

  slot(ctx, s, i, L, G, info) {
    const n = isNarrow(L);
    const o = n ? 5 : 7;
    ink(ctx, (c) => roughRect(c, s.x - o, s.y - o, s.w + o * 2, s.h + o * 2, { amp: n ? 1.4 : 2, seed: info.seed + i * 7, over: n ? 3 : 4 }), { width: n ? 2.2 : 3, color: INK });
    for (const t of tapesFor(ctx, s, i, L, G, info)) tape(ctx, t);
    const cap = caption(ctx, s, i, L, G, info);
    if (!cap.text) return;
    ctx.save();
    ctx.translate(cap.x, cap.y);
    ctx.rotate((rng(info.seed + 300 + i)() - 0.5) * 0.05);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(cap.text, 0, 0);
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const n = isNarrow(L);
    const r = rng(info.seed + 7);
    const side = n ? 46 : 96;
    const keep = [];
    G.slots.forEach((s, i) => {
      keep.push({ x: s.x - 12, y: s.y - 12, w: s.w + 30, h: s.h + 30 });
      for (const t of tapesFor(ctx, s, i, L, G, info)) keep.push(tapeBox(t));
      if (captionOf(info, i)) keep.push(caption(ctx, s, i, L, G, info).box);
    });
    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // the date, circled like a planner entry (top right on sheets)
    const date = dateText(info);
    ctx.font = font(700, n ? 26 : 38, 'hand');
    const dw = ctx.measureText(date).width;
    const rx = dw / 2 + (n ? 14 : 20), ry = n ? 20 : 30;

    // title in handwriting over a marker swash
    const title = info.title || FALLBACK;
    const maxW = n ? L.W - 100 : L.W - side * 2 - rx * 2 - 60;
    const t = titleLines(ctx, title, maxW, n ? 62 : 92, n ? 30 : 44);
    const lh = t.size * 1.08;
    const ty = (n ? 106 : 150) - (t.lines.length - 1) * lh * (n ? 0.6 : 0.5);
    const tx = n ? L.W / 2 : side;
    ctx.textAlign = n ? 'center' : 'left';
    t.lines.forEach((ln, i) => {
      const w = ctx.measureText(ln).width;
      const x0 = n ? tx - w / 2 : tx, y = ty + i * lh;
      ink(ctx, (c) => {
        c.moveTo(x0 - 10, y - t.size * 0.12);
        c.quadraticCurveTo(x0 + w / 2, y - t.size * 0.2, x0 + w + 12, y - t.size * 0.1);
      }, { width: t.size * 0.34, color: 'rgba(242,196,173,0.85)' });
      keep.push({ x: x0 - 22, y: y - t.size * 0.95, w: w + 44, h: t.size * 1.25 });
    });
    ctx.fillStyle = INK;
    t.lines.forEach((ln, i) => ctx.fillText(ln, tx, ty + i * lh));

    const dx = n ? L.W / 2 : L.W - side - rx, dy = n ? ty + (t.lines.length - 1) * lh + 56 : ty - t.size * 0.3 + ry * 0.4;
    ctx.textAlign = 'center';
    ctx.font = font(700, n ? 26 : 38, 'hand');
    ctx.fillStyle = C.clay;
    ctx.fillText(date, dx, dy);
    ink(ctx, (c) => roughEllipse(c, dx, dy - (n ? 9 : 13), rx, ry, { seed: info.seed + 3, amp: 0.05 }), { width: n ? 2 : 2.6, color: C.clay });
    keep.push({ x: dx - rx - 12, y: dy - (n ? 9 : 13) - ry - 12, w: rx * 2 + 24, h: ry * 2 + 24 });

    // sign-off with a little spark
    const sign = `with Claude ${info.modelName}`;
    ctx.font = font(700, n ? 26 : 36, 'hand');
    const sw = ctx.measureText(sign).width;
    const ss = n ? 12 : 17;
    const sx = n ? L.W / 2 - ss : L.W - side - sw / 2 - ss * 3, sy = L.H - (n ? 34 : 50);
    ctx.fillStyle = INK;
    ctx.fillText(sign, sx, sy);
    ctx.save();
    ctx.translate(sx + sw / 2 + ss * 1.7, sy - ss * 0.8);
    spark(ctx, ss, n ? 1.6 : 2);
    ctx.restore();
    keep.push({ x: sx - sw / 2 - 16, y: sy - (n ? 32 : 44), w: sw + ss * 3 + 32, h: n ? 46 : 64 });

    // doodles in the gaps; 小芒 takes the roomiest one if it is big enough
    const spots = scatter(L, keep, info.seed + 21, n ? { count: 10, min: 15, max: 48, edge: 18 } : { count: 16, min: 20, max: 78, edge: 26 });
    const kinds = shuffle(KINDS, r);
    let k = 0;
    spots.forEach((p, i) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      if (i === 0 && p.s >= (n ? 40 : 62)) {
        drawMascot(ctx, 0, p.s * 0.08, p.s * 0.52, { pose: POSES[info.seed % POSES.length], style: 'ink', t: 0.4 });
      } else {
        const kind = kinds[k++ % kinds.length];
        const wide = kind === 'arrow' || kind === 'squiggle';
        ctx.rotate((r() - 0.5) * (wide ? 1 : 0.6));
        DOODLES[kind](ctx, p.s * (wide ? 0.9 : 0.72), n ? 2 : 2.8, r);
      }
      ctx.restore();
    });
    ctx.restore();
  },
};
