// Sticker library. Every sticker is drawn in code, inside a w×h box
// (h = w × ratio), so it stays crisp at any size and in the final print.
//
// { id, group, name, ratio, size, draw(ctx, w, h), fonts?, outline? }
//   size    default width as a fraction of the sheet's short side
//   fonts   [[fontSpec, text]] glyphs to load before the first draw
//   outline true → the editor adds a white die-cut edge

import { TAU, rng, canvas, lerp } from '../core/util.js';
import { font, FAMILY } from '../core/fonts.js';
import { fit } from '../core/text.js';
import { C } from './palette.js';
import { drawSpark, sparkPath } from './spark.js';
import { roundRect, heartPath, ink, roughEllipse, sparklePath } from './ink.js';
import { drawMascot } from './mascot.js';

export const GROUPS = [
  { id: 'spark', name: '星芒' },
  { id: 'chat', name: '对话' },
  { id: 'code', name: '终端' },
  { id: 'illo', name: '插画' },
  { id: 'badge', name: '徽章' },
];

// Shared helpers --------------------------------------------------------

const GOLD = '#f4c46b';
const HAND = '#fbe6d6';
const TERM = '#1b1a18';
const TERM_FG = '#efece4';
const TERM_DIM = '#8f8b82';

const italic = (weight, size, family) => `italic ${font(weight, size, family)}`;

// Rounded card with a soft shadow.
export function card(ctx, x, y, w, h, r, { fill = '#fff', stroke = C.light, lw = 0, shadow = true } = {}) {
  ctx.save();
  if (shadow) {
    ctx.shadowColor = 'rgba(20,20,19,0.16)';
    ctx.shadowBlur = h * 0.18;
    ctx.shadowOffsetY = h * 0.05;
  }
  ctx.fillStyle = fill;
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
  if (lw) {
    ctx.save();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lw;
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, r);
    ctx.stroke();
    ctx.restore();
  }
}

// The card box inside a sticker, inset (like replyCard's) so the shadow fits.
function inset(w, h) {
  const p = h * 0.07;
  return { x: p, y: p * 0.8, w: w - p * 2, h: h - p * 2.4 };
}

// A Claude reply card: spark + serif line. `family` 'serifCn' sets CJK
// punctuation (a centred ……) the Chinese way.
function replyCard(text, ratio = 0.3, family = 'serif') {
  return {
    ratio,
    fonts: [[font(500, 40, family), text]],
    draw(ctx, w, h) {
      const pad = h * 0.14;
      ctx.save();
      card(ctx, pad * 0.5, pad * 0.4, w - pad, h - pad * 1.2, h * 0.24, { lw: h * 0.02 });
      drawSpark(ctx, pad * 0.5 + h * 0.36, h / 2 - pad * 0.1, h * 0.17);
      ctx.fillStyle = C.ink;
      ctx.textBaseline = 'middle';
      fit(ctx, text, w - pad - h * 0.78, { max: h * 0.3, min: 6, weight: 500, family });
      ctx.fillText(text, pad * 0.5 + h * 0.62, h / 2 - pad * 0.08);
      ctx.restore();
    },
  };
}

// Dark Claude Code panel, with a faint rim so it still reads on dark photos.
function term(ctx, w, h, r = 0.22) {
  const b = inset(w, h);
  card(ctx, b.x, b.y, b.w, b.h, Math.min(b.w, b.h) * r, { fill: TERM, stroke: 'rgba(250,249,245,0.16)', lw: w * 0.004 });
  return b;
}

// Draw [text, colour] runs left to right; returns the x where they end.
function runs(ctx, parts, x, y) {
  for (const [t, color] of parts) {
    ctx.fillStyle = color;
    ctx.fillText(t, x, y);
    x += ctx.measureText(t).width;
  }
  return x;
}

// Line icons on the 20×20 grid of icons.js, stroked through Path2D.
const ICON = {
  copy: 'M7.5 7.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2zM12.5 5.5v-.5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h2.5',
  retry: 'M15.5 8A6 6 0 0 0 4.7 6.7M4.5 3.5v3.3h3.3M4.5 12a6 6 0 0 0 10.8 1.3M15.5 16.5v-3.3h-3.3',
  thumb: 'M6.2 9.5 9 4.3c.4-.8 1.4-1 2-.4.5.5.6 1.2.4 1.9l-.8 2.5h4.6a1.5 1.5 0 0 1 1.5 1.8l-1 5.2a1.5 1.5 0 0 1-1.5 1.2H6.2zM3.5 9.5h2.7v7H3.5z',
  up: 'M10 15.5V5M5.5 9.5 10 5l4.5 4.5',
  plus: 'M10 4.5v11M4.5 10h11',
  check: 'M5 10.5 8.5 14 15 6.8',
  down: 'M5.5 8 10 12.5 14.5 8',
  clock: 'M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10 6.5V10l2.5 1.5',
  download: 'M10 3.5v9M6 9l4 4 4-4M4 16.5h12',
};
const iconPaths = {};

// Icon centred at (x, y), s px square. `width` is in grid units.
function icon(ctx, name, x, y, s, { color = C.ink2, width = 1.6, fill = null, rot = 0 } = {}) {
  const p = (iconPaths[name] ||= new Path2D(ICON[name]));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s / 20, s / 20);
  ctx.translate(-10, -10);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill(p);
  }
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.stroke(p);
  ctx.restore();
}

// Offscreen layer at the current device scale, so knock-outs
// (destination-out) stay inside the sticker instead of punching the photo.
function layer(ctx, w, h, fn) {
  const m = ctx.getTransform();
  const k = Math.min(4, Math.max(1, Math.hypot(m.a, m.b)));
  const c = canvas(w * k, h * k);
  const g = c.getContext('2d');
  g.scale(c.width / w, c.height / h);
  fn(g);
  ctx.drawImage(c, 0, 0, w, h);
}

// Path2D helpers for the ink illustrations.
function shape(fn) {
  const p = new Path2D();
  fn(p);
  return p;
}

function capsule(p, x1, y1, x2, y2, r) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  p.moveTo(x1 + Math.cos(a + Math.PI / 2) * r, y1 + Math.sin(a + Math.PI / 2) * r);
  p.arc(x2, y2, r, a + Math.PI / 2, a - Math.PI / 2, true);
  p.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2, true);
  p.closePath();
}

function poly(p, pts) {
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
}

// Ink cut-out: an optional flat colour nudged off register (dx, dy), then
// every part stroked at 2× and filled, so overlaps merge into one silhouette
// and small gaps between parts read as ink lines.
function cutout(ctx, parts, { fill = C.paper, under = null, lw, dx = 0, dy = 0 }) {
  ctx.save();
  if (under) {
    ctx.fillStyle = under;
    ctx.translate(dx, dy);
    for (const p of parts) ctx.fill(p);
    ctx.translate(-dx, -dy);
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = lw * 2;
  ctx.strokeStyle = C.ink;
  for (const p of parts) ctx.stroke(p);
  if (fill) {
    ctx.fillStyle = fill;
    for (const p of parts) ctx.fill(p);
  }
  ctx.restore();
}

// A pen stroke along the quadratic (x1, y1) → (cx, cy) → (x2, y2) that throws
// one round loop (about 2b tall) mid-way; side ±1 picks which way it swings.
// Returns the end direction, for an arrowhead.
function loopPath(ctx, x1, y1, cx, cy, x2, y2, { b, span = 0.3, side = 1 }) {
  const n = 240, s0 = 0.5 - span / 2;
  for (let i = 0; i <= n; i++) {
    const s = i / n, q = 1 - s;
    let x = q * q * x1 + 2 * q * s * cx + s * s * x2;
    let y = q * q * y1 + 2 * q * s * cy + s * s * y2;
    if (s > s0 && s < s0 + span) {
      const dx = q * (cx - x1) + s * (x2 - cx), dy = q * (cy - y1) + s * (y2 - cy);
      const len = Math.hypot(dx, dy) || 1;
      const t = ((s - s0) / span) * TAU;
      const along = b * Math.sin(t), across = b * (1 - Math.cos(t)) * side;
      x += (dx * along - dy * across) / len;
      y += (dy * along + dx * across) / len;
    }
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  return Math.atan2(y2 - cy, x2 - cx);
}

// Text with a thick paper halo (a hand-cut edge), so ink reads on any photo.
// `bold` thickens a thin brush face with an extra ink stroke.
function haloText(ctx, text, x, y, { halo = C.paper, color = C.ink, width, bold = 0 }) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = width + bold;
  ctx.strokeStyle = halo;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  if (bold) {
    ctx.lineWidth = bold;
    ctx.strokeStyle = color;
    ctx.strokeText(text, x, y);
  }
  ctx.restore();
}

// A Claude model name chip (the booth's model picker, as a badge).
function modelChip(name, tag, { bg, fg = C.ink, accent, ratio }) {
  return {
    group: 'badge',
    name,
    ratio,
    size: 0.3,
    fonts: [
      [font(600, 40, 'serif'), name],
      [font(500, 40, 'sansCn'), tag],
    ],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h / 2, { fill: bg });
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(b.x + b.h / 2, cy, b.h * 0.34, 0, TAU);
      ctx.fill();
      drawSpark(ctx, b.x + b.h / 2, cy, b.h * 0.24, { color: C.paper });
      ctx.textBaseline = 'middle';
      // tag pill on the right
      ctx.font = font(500, b.h * 0.26, 'sansCn');
      const tw = ctx.measureText(tag).width + b.h * 0.34;
      const tx = b.x + b.w - b.h * 0.2 - tw;
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      roundRect(ctx, tx, cy - b.h * 0.24, tw, b.h * 0.48, b.h * 0.24);
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.fillText(tag, tx + tw / 2, cy + b.h * 0.01);
      ctx.textAlign = 'left';
      const nx = b.x + b.h * 0.98;
      fit(ctx, name, tx - nx - b.h * 0.14, { max: b.h * 0.46, min: 6, weight: 600, family: 'serif' });
      ctx.fillText(name, nx, cy + b.h * 0.02);
      ctx.restore();
    },
  };
}

export const STICKERS = [
  // ---------------------------------------------------------------- spark
  {
    id: 'spark',
    group: 'spark',
    name: '星芒',
    ratio: 1,
    size: 0.2,
    draw(ctx, w, h) {
      ctx.save();
      drawSpark(ctx, w / 2, h / 2, w * 0.48);
      ctx.restore();
    },
  },
  {
    id: 'spark-print',
    group: 'spark',
    name: '印刷星芒',
    ratio: 1,
    size: 0.22,
    draw(ctx, w, h) {
      const R = w * 0.42;
      ctx.save();
      drawSpark(ctx, w / 2 + w * 0.045, h / 2 + w * 0.045, R, { seed: 5, color: C.orange });
      drawSpark(ctx, w / 2, h / 2, R, { seed: 5, color: C.paper, outline: C.ink, outlineWidth: w * 0.022 });
      ctx.restore();
    },
  },
  {
    id: 'mascot',
    group: 'spark',
    name: '小芒',
    ratio: 1,
    size: 0.26,
    draw(ctx, w, h) {
      drawMascot(ctx, w / 2, h * 0.53, w * 0.27, { pose: 'idle', style: 'ink', t: 0.5 });
    },
  },
  {
    id: 'spark-trio',
    group: 'spark',
    name: '三颗星芒',
    ratio: 0.86,
    size: 0.24,
    draw(ctx, w, h) {
      ctx.save();
      drawSpark(ctx, w * 0.37, h * 0.6, w * 0.33, { color: C.orange });
      drawSpark(ctx, w * 0.79, h * 0.25, w * 0.18, { seed: 6, color: C.blue, rot: 0.3 });
      drawSpark(ctx, w * 0.83, h * 0.78, w * 0.11, { seed: 9, color: C.kraft, rot: -0.2 });
      ctx.restore();
    },
  },
  {
    id: 'halo',
    group: 'spark',
    name: '星芒光环',
    ratio: 0.34,
    size: 0.42,
    draw(ctx, w, h) {
      const cx = w / 2, cy = h * 0.47, rx = w * 0.39, ry = h * 0.22;
      const n = 9;
      const stars = Array.from({ length: n }, (_, i) => {
        const a = (i / n) * TAU + 0.35;
        return { i, z: (Math.sin(a) + 1) / 2, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry };
      }).sort((p, q) => p.z - q.z);
      const star = (s) =>
        drawSpark(ctx, s.x, s.y, h * lerp(0.12, 0.23, s.z), { seed: s.i % 2 ? 5 : 3, color: s.i % 2 ? GOLD : C.orange, rot: s.i * 0.7 });
      // ring: kraft edge with a gold core, so it reads on light paper too
      const ring = (a0, a1, k) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, a0, a1);
        ctx.strokeStyle = C.kraft;
        ctx.lineWidth = h * 0.05 * k;
        ctx.stroke();
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = h * 0.025 * k;
        ctx.stroke();
      };
      ctx.save();
      ctx.lineCap = 'round';
      // back half of the ring (behind the head), then the front half
      ring(Math.PI, TAU, 0.7);
      stars.filter((s) => s.z < 0.5).forEach(star);
      ring(0, Math.PI, 1);
      stars.filter((s) => s.z >= 0.5).forEach(star);
      ctx.restore();
    },
  },
  {
    id: 'sparkles',
    group: 'spark',
    name: '闪闪',
    ratio: 1,
    size: 0.2,
    draw(ctx, w, h) {
      const o = w * 0.03;
      const star = (x, y, s, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        sparklePath(ctx, x, y, s, 0.62);
        ctx.fill();
      };
      ctx.save();
      star(w * 0.42 + o, h * 0.56 + o, w * 0.34, C.orange);
      star(w * 0.42, h * 0.56, w * 0.34, GOLD);
      star(w * 0.8, h * 0.2, w * 0.15, C.orange);
      star(w * 0.83 + o * 0.6, h * 0.82 + o * 0.6, w * 0.1, C.orange);
      star(w * 0.83, h * 0.82, w * 0.1, GOLD);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(w * 0.13, h * 0.16, w * 0.035, 0, TAU);
      ctx.fill();
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      ctx.arc(w * 0.93, h * 0.47, w * 0.028, 0, TAU);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'mascot-peace',
    group: 'spark',
    name: '小芒比耶',
    ratio: 1,
    size: 0.26,
    draw(ctx, w, h) {
      drawMascot(ctx, w / 2, h * 0.53, w * 0.27, { pose: 'peace', style: 'ink', t: 0.5 });
    },
  },
  {
    id: 'mascot-heart',
    group: 'spark',
    name: '小芒比心',
    ratio: 1,
    size: 0.26,
    draw(ctx, w, h) {
      drawMascot(ctx, w * 0.47, h * 0.55, w * 0.26, { pose: 'heart', style: 'ink', t: 0.5 });
      const lw = w * 0.018;
      ctx.save();
      for (const [x, y, s, r] of [[0.86, 0.14, 0.07, 0.25], [0.95, 0.33, 0.045, -0.2]]) {
        ctx.save();
        ctx.translate(w * x, h * y);
        ctx.rotate(r);
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        heartPath(ctx, w * 0.01, w * 0.012, w * s);
        ctx.fill();
        ink(ctx, (c) => heartPath(c, 0, 0, w * s), { width: lw });
        ctx.restore();
      }
      ctx.restore();
    },
  },
  {
    id: 'mascot-think',
    group: 'spark',
    name: '小芒想一想',
    ratio: 0.88,
    size: 0.3,
    draw(ctx, w, h) {
      drawMascot(ctx, w * 0.42, h * 0.56, w * 0.24, { pose: 'think', style: 'ink', t: 0.5 });
    },
  },

  // ----------------------------------------------------------------- chat
  { id: 'right', group: 'chat', name: '你说得完全正确', size: 0.6, ...replyCard('你说得完全正确！') },
  { id: 'good-question', group: 'chat', name: '好问题', size: 0.38, ...replyCard('好问题！', 0.47) },
  { id: 'let-me-think', group: 'chat', name: '让我想想', size: 0.44, ...replyCard('让我想想……', 0.36, 'serifCn') },
  {
    id: 'user-msg',
    group: 'chat',
    name: '帮我拍好看一点',
    ratio: 0.26,
    size: 0.56,
    fonts: [
      [font(400, 40, 'sansCn'), '帮我拍好看一点'],
      [font(500, 40, 'sansCn'), '我'],
    ],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h * 0.42, { fill: C.cream });
      ctx.fillStyle = C.ink2;
      ctx.beginPath();
      ctx.arc(b.x + b.h * 0.5, cy, b.h * 0.29, 0, TAU);
      ctx.fill();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = C.paper;
      ctx.font = font(500, b.h * 0.28, 'sansCn');
      ctx.fillText('我', b.x + b.h * 0.5, cy + b.h * 0.01);
      ctx.textAlign = 'left';
      ctx.fillStyle = C.ink;
      const tx = b.x + b.h * 0.98;
      fit(ctx, '帮我拍好看一点', b.x + b.w - b.h * 0.42 - tx, { max: b.h * 0.36, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('帮我拍好看一点', tx, cy + b.h * 0.01);
      ctx.restore();
    },
  },
  {
    id: 'typing',
    group: 'chat',
    name: '正在输入',
    ratio: 0.6,
    size: 0.18,
    draw(ctx, w, h) {
      const bx = w * 0.1, by = h * 0.1, bw = w * 0.84, bh = h * 0.6;
      ctx.save();
      ctx.shadowColor = 'rgba(20,20,19,0.16)';
      ctx.shadowBlur = bh * 0.2;
      ctx.shadowOffsetY = bh * 0.05;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      roundRect(ctx, bx, by, bw, bh, bh / 2);
      // tail: two trailing puffs
      for (const [x, y, r] of [[bx + bh * 0.2, by + bh * 1.02, bh * 0.14], [bx + bh * 0.02, by + bh * 1.3, bh * 0.07]]) {
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
      ctx.shadowColor = 'transparent';
      [C.peach, C.blush, C.orange].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(bx + bw / 2 + (i - 1) * bh * 0.42, by + bh / 2 - (i === 1 ? bh * 0.06 : 0), bh * 0.12, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    },
  },
  {
    id: 'thought',
    group: 'chat',
    name: '思考了 3 秒',
    ratio: 0.22,
    size: 0.34,
    fonts: [[font(400, 40, 'sansCn'), '思考了 3 秒']],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h / 2, { lw: w * 0.004 });
      drawSpark(ctx, b.x + b.h * 0.56, cy, b.h * 0.25);
      ctx.fillStyle = C.ink2;
      ctx.textBaseline = 'middle';
      const tx = b.x + b.h * 0.98;
      fit(ctx, '思考了 3 秒', b.x + b.w - b.h * 0.95 - tx, { max: b.h * 0.36, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('思考了 3 秒', tx, cy + b.h * 0.02);
      icon(ctx, 'down', b.x + b.w - b.h * 0.55, cy, b.h * 0.46, { color: C.muted, width: 1.8 });
      ctx.restore();
    },
  },
  {
    id: 'actions',
    group: 'chat',
    name: '复制点赞重试',
    ratio: 0.24,
    size: 0.32,
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2, s = b.h * 0.52;
      const step = (b.w - b.h * 0.3) / 4;
      const at = (i) => b.x + b.h * 0.15 + step * (i + 0.5);
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h / 2, { lw: w * 0.004 });
      icon(ctx, 'copy', at(0), cy, s);
      icon(ctx, 'thumb', at(1), cy, s, { color: C.orange, fill: C.peach });
      icon(ctx, 'thumb', at(2), cy, s, { rot: Math.PI });
      icon(ctx, 'retry', at(3), cy, s);
      ctx.restore();
    },
  },
  {
    id: 'composer',
    group: 'chat',
    name: '回复 Claude',
    ratio: 0.24,
    size: 0.5,
    fonts: [[font(400, 40, 'sansCn'), '回复 Claude…']],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      const bs = b.h * 0.58;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h * 0.3, { lw: w * 0.004 });
      // "+" button
      const px = b.x + b.h * 0.2;
      ctx.strokeStyle = C.light;
      ctx.lineWidth = w * 0.004;
      ctx.beginPath();
      roundRect(ctx, px, cy - bs / 2, bs, bs, bs * 0.28);
      ctx.stroke();
      icon(ctx, 'plus', px + bs / 2, cy, bs * 0.62, { color: C.muted, width: 1.8 });
      // caret + placeholder
      const tx = px + bs + b.h * 0.24;
      ctx.fillStyle = C.orange;
      ctx.fillRect(tx - b.h * 0.08, cy - b.h * 0.19, b.h * 0.035, b.h * 0.38);
      ctx.fillStyle = C.muted;
      ctx.textBaseline = 'middle';
      fit(ctx, '回复 Claude…', b.x + b.w - b.h * 0.5 - bs - tx, { max: b.h * 0.3, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('回复 Claude…', tx, cy + b.h * 0.01);
      // send
      const sx = b.x + b.w - b.h * 0.2 - bs;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      roundRect(ctx, sx, cy - bs / 2, bs, bs, bs * 0.28);
      ctx.fill();
      icon(ctx, 'up', sx + bs / 2, cy, bs * 0.72, { color: '#fff', width: 2.2 });
      ctx.restore();
    },
  },
  {
    id: 'disclaimer',
    group: 'chat',
    name: '请核对笑容',
    ratio: 0.12,
    size: 0.5,
    fonts: [[font(400, 40, 'sansCn'), 'Claude 也会犯错，请核对笑容。']],
    draw(ctx, w, h) {
      const b = inset(w, h);
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h / 2, { fill: C.paper, lw: w * 0.003 });
      ctx.fillStyle = C.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fit(ctx, 'Claude 也会犯错，请核对笑容。', b.w - b.h * 0.9, { max: b.h * 0.44, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('Claude 也会犯错，请核对笑容。', w / 2, b.y + b.h / 2 + b.h * 0.02);
      ctx.restore();
    },
  },

  // ----------------------------------------------------------------- code
  {
    id: 'prompt',
    group: 'code',
    name: '提示符',
    ratio: 0.26,
    size: 0.55,
    fonts: [
      [font(500, 40, 'mono'), '> 拍一张大头贴'],
      [font(600, 40, 'mono'), '>'],
    ],
    draw(ctx, w, h) {
      ctx.save();
      card(ctx, 0, 0, w, h, h * 0.2, { fill: '#1b1a18', shadow: true });
      ctx.textBaseline = 'middle';
      ctx.font = font(600, h * 0.34, 'mono');
      ctx.fillStyle = C.orange;
      ctx.fillText('>', h * 0.3, h / 2);
      ctx.fillStyle = '#efece4';
      fit(ctx, '拍一张大头贴', w - h * 1.3, { max: h * 0.32, min: 6, weight: 500, family: 'mono' });
      ctx.fillText('拍一张大头贴', h * 0.68, h / 2);
      ctx.fillRect(w - h * 0.5, h * 0.28, h * 0.16, h * 0.44);
      ctx.restore();
    },
  },
  {
    id: 'spinner',
    group: 'code',
    name: 'Smiling…',
    ratio: 0.15,
    size: 0.58,
    fonts: [[font(500, 40, 'mono'), 'Smiling… (esc to interrupt)']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h);
      const cy = b.y + b.h / 2;
      const parts = [['Smiling…', C.orange], [' (esc to interrupt)', TERM_DIM]];
      ctx.save();
      drawSpark(ctx, b.x + b.h * 0.56, cy, b.h * 0.26);
      ctx.textBaseline = 'middle';
      const tx = b.x + b.h;
      fit(ctx, parts.map((p) => p[0]).join(''), b.x + b.w - b.h * 0.4 - tx, { max: b.h * 0.36, min: 6, weight: 500, family: 'mono' });
      runs(ctx, parts, tx, cy);
      ctx.restore();
    },
  },
  {
    id: 'tests-pass',
    group: 'code',
    name: '测试通过',
    ratio: 0.2,
    size: 0.4,
    fonts: [[font(500, 40, 'mono'), '测试通过 3/3 个笑容']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      ctx.fillStyle = C.green;
      ctx.beginPath();
      ctx.arc(b.x + b.h * 0.52, cy, b.h * 0.26, 0, TAU);
      ctx.fill();
      icon(ctx, 'check', b.x + b.h * 0.52, cy, b.h * 0.4, { color: C.paper, width: 2.6 });
      ctx.textBaseline = 'middle';
      const parts = [['测试通过', '#c5d6a8'], ['  3/3 个笑容', TERM_DIM]];
      const tx = b.x + b.h * 0.96;
      fit(ctx, parts.map((p) => p[0]).join(''), b.x + b.w - b.h * 0.36 - tx, { max: b.h * 0.34, min: 6, weight: 500, family: 'mono' });
      runs(ctx, parts, tx, cy + b.h * 0.01);
      ctx.restore();
    },
  },
  {
    id: 'compact',
    group: 'code',
    name: '/compact',
    ratio: 0.34,
    size: 0.42,
    fonts: [[font(500, 40, 'mono'), '> /compact 今天已压缩成一张照片']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h, 0.16);
      const x0 = b.x + b.h * 0.2;
      const y1 = b.y + b.h * 0.34, y2 = b.y + b.h * 0.68;
      ctx.save();
      ctx.textBaseline = 'middle';
      fit(ctx, '> /compact', b.w * 0.8, { max: b.h * 0.22, min: 6, weight: 500, family: 'mono' });
      runs(ctx, [['> ', C.orange], ['/compact', TERM_FG]], x0, y1);
      // "⎿" elbow, drawn (the glyph is missing from most fonts)
      const ex = x0 + b.h * 0.1;
      ctx.strokeStyle = TERM_DIM;
      ctx.lineWidth = b.h * 0.028;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ex, y2 - b.h * 0.14);
      ctx.lineTo(ex, y2);
      ctx.lineTo(ex + b.h * 0.12, y2);
      ctx.stroke();
      ctx.fillStyle = TERM_DIM;
      const tx = ex + b.h * 0.22;
      fit(ctx, '今天已压缩成一张照片', b.x + b.w - b.h * 0.2 - tx, { max: b.h * 0.2, min: 6, weight: 500, family: 'mono' });
      ctx.fillText('今天已压缩成一张照片', tx, y2);
      ctx.restore();
    },
  },
  {
    id: 'ultrathink',
    group: 'code',
    name: 'ultrathink',
    ratio: 0.3,
    size: 0.38,
    fonts: [[font(700, 40, 'mono'), 'ultrathink']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      fit(ctx, 'ultrathink', b.w - b.h * 0.9, { max: b.h * 0.4, min: 6, weight: 700, family: 'mono' });
      const tw = ctx.measureText('ultrathink').width;
      const g = ctx.createLinearGradient(w / 2 - tw / 2, 0, w / 2 + tw / 2, 0);
      g.addColorStop(0, C.orange);
      g.addColorStop(0.35, '#eba36b');
      g.addColorStop(0.6, GOLD);
      g.addColorStop(1, C.blush);
      ctx.shadowColor = 'rgba(217,119,87,0.55)';
      ctx.shadowBlur = b.h * 0.2;
      ctx.fillStyle = g;
      ctx.fillText('ultrathink', w / 2, cy);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = GOLD;
      for (const [x, y, s] of [[0.1, 0.3, 0.09], [0.9, 0.72, 0.07], [0.83, 0.24, 0.045]]) {
        ctx.beginPath();
        sparklePath(ctx, b.x + b.w * x, b.y + b.h * y, b.h * s * 1.4, 0.5);
        ctx.fill();
      }
      ctx.restore();
    },
  },
  {
    id: 'brackets',
    group: 'code',
    name: '</>',
    ratio: 0.62,
    size: 0.24,
    draw(ctx, w, h) {
      const glyph = () => {
        ctx.beginPath();
        ctx.moveTo(w * 0.29, h * 0.2);
        ctx.lineTo(w * 0.1, h * 0.5);
        ctx.lineTo(w * 0.29, h * 0.8);
        ctx.moveTo(w * 0.57, h * 0.12);
        ctx.lineTo(w * 0.43, h * 0.88);
        ctx.moveTo(w * 0.71, h * 0.2);
        ctx.lineTo(w * 0.9, h * 0.5);
        ctx.lineTo(w * 0.71, h * 0.8);
        ctx.stroke();
      };
      ctx.save();
      ctx.lineWidth = w * 0.085;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.translate(w * 0.025, w * 0.03);
      ctx.strokeStyle = C.ink;
      glyph();
      ctx.translate(-w * 0.025, -w * 0.03);
      ctx.strokeStyle = C.orange;
      glyph();
      ctx.restore();
    },
  },
  {
    id: 'commit',
    group: 'code',
    name: 'git commit',
    ratio: 0.13,
    size: 0.6,
    fonts: [[font(500, 40, 'mono'), '$ git commit -m "最好看的一天"']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h, 0.3);
      const cy = b.y + b.h / 2;
      const parts = [['$ ', TERM_DIM], ['git commit -m ', TERM_FG], ['"最好看的一天"', '#c5d6a8']];
      ctx.save();
      ctx.textBaseline = 'middle';
      const tx = b.x + b.h * 0.42;
      fit(ctx, parts.map((p) => p[0]).join(''), b.w - b.h * 0.84, { max: b.h * 0.4, min: 6, weight: 500, family: 'mono' });
      runs(ctx, parts, tx, cy + b.h * 0.02);
      ctx.restore();
    },
  },
  {
    id: 'diff',
    group: 'code',
    name: '笑容 diff',
    ratio: 0.5,
    size: 0.3,
    fonts: [[font(500, 40, 'mono'), '@@ 今天 @@ 12 - 烦恼 + 笑容']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h, 0.1);
      const rh = b.h * 0.25;
      const rows = [
        { y: b.y + b.h * 0.2, text: '@@ 今天 @@', color: '#9dbbe0' },
        { y: b.y + b.h * 0.5, n: '12', sign: '-', text: '烦恼', color: '#f2a58f', bg: 'rgba(217,119,87,0.22)' },
        { y: b.y + b.h * 0.78, n: '12', sign: '+', text: '笑容', color: '#c5d6a8', bg: 'rgba(120,140,93,0.34)' },
      ];
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.font = font(500, rh * 0.62, 'mono');
      for (const r of rows) {
        if (r.bg) {
          ctx.fillStyle = r.bg;
          ctx.fillRect(b.x, r.y - rh / 2, b.w, rh);
        }
        let x = b.x + b.w * 0.07;
        if (r.n) {
          ctx.fillStyle = TERM_DIM;
          ctx.fillText(r.n, x, r.y);
          x += b.w * 0.15;
          ctx.fillStyle = r.color;
          ctx.fillText(r.sign, x, r.y);
          x += b.w * 0.12;
        }
        ctx.fillStyle = r.color;
        ctx.fillText(r.text, x, r.y);
      }
      ctx.restore();
    },
  },
  {
    id: 'context',
    group: 'code',
    name: '上下文 96%',
    ratio: 0.36,
    size: 0.34,
    fonts: [[font(500, 40, 'mono'), '上下文 96% 快乐快要装不下了']],
    draw(ctx, w, h) {
      const b = term(ctx, w, h, 0.14);
      const x0 = b.x + b.h * 0.16, x1 = b.x + b.w - b.h * 0.16;
      const y1 = b.y + b.h * 0.25, yb = b.y + b.h * 0.52, y3 = b.y + b.h * 0.77;
      ctx.save();
      ctx.textBaseline = 'middle';
      ctx.font = font(500, b.h * 0.17, 'mono');
      ctx.fillStyle = TERM_FG;
      ctx.fillText('上下文', x0, y1);
      ctx.textAlign = 'right';
      ctx.fillStyle = C.orange;
      ctx.fillText('96%', x1, y1);
      ctx.textAlign = 'left';
      // bar
      const bh = b.h * 0.13;
      ctx.fillStyle = '#34322e';
      ctx.beginPath();
      roundRect(ctx, x0, yb - bh / 2, x1 - x0, bh, bh / 2);
      ctx.fill();
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, GOLD);
      g.addColorStop(0.55, C.orange);
      g.addColorStop(1, C.clay);
      ctx.fillStyle = g;
      ctx.beginPath();
      roundRect(ctx, x0, yb - bh / 2, (x1 - x0) * 0.96, bh, bh / 2);
      ctx.fill();
      ctx.fillStyle = TERM_DIM;
      fit(ctx, '快乐快要装不下了', x1 - x0, { max: b.h * 0.15, min: 6, weight: 500, family: 'mono' });
      ctx.fillText('快乐快要装不下了', x0, y3);
      ctx.restore();
    },
  },

  // ---------------------------------------------------------------- illo
  {
    id: 'heart',
    group: 'illo',
    name: '爱心',
    ratio: 0.92,
    size: 0.18,
    draw(ctx, w, h) {
      const s = w * 0.36;
      ctx.save();
      ctx.translate(w * 0.035, h * 0.04);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      heartPath(ctx, w / 2, h * 0.5, s);
      ctx.fill();
      ctx.restore();
      ink(ctx, (c) => heartPath(c, w / 2, h * 0.47, s), { width: w * 0.035 });
    },
  },
  {
    id: 'wave',
    group: 'illo',
    name: '挥挥手',
    ratio: 1,
    size: 0.2,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.03;
      ctx.save();
      // motion marks
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      for (const [r, a0, a1] of [[0.4, -1.22, -0.82], [0.47, -1.16, -0.9], [0.4, -2.46, -2.06], [0.47, -2.4, -2.14]]) {
        ctx.beginPath();
        ctx.arc(w * 0.5, h * 0.56, u * r, a0, a1);
        ctx.stroke();
      }
      ctx.translate(w * 0.5, h * 0.6);
      ctx.rotate(-0.22);
      // fingers sit a hair apart, so the ink shows between them
      const fr = u * 0.037;
      const palm = shape((p) => roundRect(p, -u * 0.19, -u * 0.1, u * 0.38, u * 0.32, u * 0.13));
      const fingers = [[-0.15, 0.22], [-0.05, 0.27], [0.05, 0.26], [0.15, 0.2]].map(([x, len]) =>
        shape((p) => capsule(p, x * u, 0, x * u * 1.06, -len * u, fr)),
      );
      const thumb = shape((p) => capsule(p, -u * 0.12, u * 0.1, -u * 0.29, -u * 0.02, fr * 1.12));
      const cuff = shape((p) => roundRect(p, -u * 0.17, u * 0.2, u * 0.34, u * 0.12, u * 0.03));
      cutout(ctx, [palm, ...fingers, thumb], { fill: HAND, under: C.orange, lw, dx: u * 0.03, dy: u * 0.03 });
      cutout(ctx, [cuff], { fill: C.orange, lw });
      ctx.restore();
    },
  },
  {
    id: 'bulb',
    group: 'illo',
    name: '灵感',
    ratio: 1.05,
    size: 0.19,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.03, cx = w / 2, cy = h * 0.4, r = u * 0.25;
      const nb = u * 0.12, ny = cy + r * 1.28, bh = u * 0.055;
      const k = Math.cos(Math.PI * 0.26), q = Math.sin(Math.PI * 0.26);
      const glass = shape((p) => {
        p.arc(cx, cy, r, Math.PI * 0.74, Math.PI * 0.26);
        p.quadraticCurveTo(cx + r * 0.42, cy + r * 1.0, cx + nb, ny);
        p.lineTo(cx - nb, ny);
        p.quadraticCurveTo(cx - r * 0.42, cy + r * 1.0, cx - r * k, cy + r * q);
        p.closePath();
      });
      ctx.save();
      // rays
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.06 + (i / 6) * 0.88);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * r * 1.28, cy + Math.sin(a) * r * 1.28);
        ctx.lineTo(cx + Math.cos(a) * r * (i % 2 ? 1.45 : 1.55), cy + Math.sin(a) * r * (i % 2 ? 1.45 : 1.55));
        ctx.stroke();
      }
      // glass: gold off register, then the ink line
      ctx.fillStyle = GOLD;
      ctx.translate(u * 0.03, u * 0.03);
      ctx.fill(glass);
      ctx.translate(-u * 0.03, -u * 0.03);
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = C.ink;
      ctx.stroke(glass);
      // filament
      ctx.lineWidth = lw * 0.6;
      ctx.beginPath();
      ctx.moveTo(cx - nb * 0.45, ny);
      ctx.lineTo(cx - r * 0.3, cy + r * 0.12);
      for (let i = 0; i < 3; i++) {
        const x = cx - r * 0.3 + (i + 0.5) * r * 0.2;
        ctx.quadraticCurveTo(x, cy - r * 0.2, x + r * 0.1, cy + r * 0.12);
      }
      ctx.lineTo(cx + nb * 0.45, ny);
      ctx.stroke();
      // highlight
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.7, Math.PI * 1.1, Math.PI * 1.36);
      ctx.stroke();
      // screw base
      const bands = [0, 1, 2].map((i) => shape((p) => roundRect(p, cx - nb * 1.05, ny + i * bh, nb * 2.1, bh, bh * 0.45)));
      const tip = shape((p) => {
        p.moveTo(cx - nb * 0.55, ny + 3 * bh);
        p.arc(cx, ny + 3 * bh, nb * 0.55, Math.PI, 0, true);
        p.closePath();
      });
      cutout(ctx, [tip], { fill: C.ink2, lw: lw * 0.5 });
      cutout(ctx, bands, { fill: C.oat, lw: lw * 0.5 });
      ctx.restore();
    },
  },
  {
    id: 'books',
    group: 'illo',
    name: '书堆',
    ratio: 0.76,
    size: 0.22,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.026, o = u * 0.025;
      const books = [
        { x: 0.08, y: 0.5, w: 0.84, h: 0.2, rot: 0, color: C.green, spine: true },
        { x: 0.14, y: 0.31, w: 0.72, h: 0.19, rot: -0.035, color: C.orange },
        { x: 0.2, y: 0.13, w: 0.6, h: 0.18, rot: 0.045, color: C.blue, spine: true },
      ];
      ctx.save();
      for (const bk of books) {
        const x = bk.x * u, y = bk.y * u, bw = bk.w * u, bh = bk.h * u;
        ctx.save();
        ctx.translate(x + bw / 2, y + bh / 2);
        ctx.rotate(bk.rot);
        ctx.translate(-bw / 2, -bh / 2);
        const body = shape((p) => roundRect(p, 0, 0, bw, bh, bh * 0.16));
        if (bk.spine) {
          cutout(ctx, [body], { fill: null, under: bk.color, lw: lw / 2, dx: o, dy: o * 0.8 });
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = lw;
          ctx.lineCap = 'round';
          ctx.beginPath();
          for (const fx of [0.1, 0.9]) {
            ctx.moveTo(bw * fx, bh * 0.12);
            ctx.lineTo(bw * fx, bh * 0.88);
          }
          ctx.stroke();
          const label = shape((p) => roundRect(p, bw * 0.3, bh * 0.3, bw * 0.4, bh * 0.4, bh * 0.08));
          cutout(ctx, [label], { fill: C.paper, lw: lw / 2 });
        } else {
          // pages facing out: covers top and bottom, paper in between
          ctx.fillStyle = bk.color;
          ctx.save();
          ctx.translate(o, o * 0.8);
          ctx.fill(body);
          ctx.restore();
          const pages = shape((p) => roundRect(p, bw * 0.03, bh * 0.2, bw * 0.94, bh * 0.6, bh * 0.1));
          ctx.fillStyle = C.paper;
          ctx.fill(pages);
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = lw;
          ctx.lineJoin = 'round';
          ctx.stroke(body);
          ctx.lineWidth = lw * 0.5;
          ctx.stroke(pages);
          ctx.beginPath();
          for (const fy of [0.4, 0.6]) {
            ctx.moveTo(bw * 0.12, bh * fy);
            ctx.lineTo(bw * 0.9, bh * fy);
          }
          ctx.stroke();
          // bookmark ribbon slipping out of the pages
          const rib = shape((p) =>
            poly(p, [[bw * 0.74, bh * 0.45], [bw * 0.81, bh * 0.45], [bw * 0.81, bh * 1.55], [bw * 0.775, bh * 1.4], [bw * 0.74, bh * 1.55]]),
          );
          cutout(ctx, [rib], { fill: GOLD, lw: lw / 2 });
        }
        ctx.restore();
      }
      ctx.restore();
    },
  },
  {
    id: 'coffee',
    group: 'illo',
    name: '咖啡',
    ratio: 1,
    size: 0.2,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.03, o = u * 0.028;
      const saucer = shape((p) => p.ellipse(u * 0.47, u * 0.86, u * 0.38, u * 0.075, 0, 0, TAU));
      const cup = shape((p) => {
        p.moveTo(u * 0.18, u * 0.47);
        p.lineTo(u * 0.74, u * 0.47);
        p.bezierCurveTo(u * 0.74, u * 0.64, u * 0.7, u * 0.84, u * 0.58, u * 0.85);
        p.lineTo(u * 0.34, u * 0.85);
        p.bezierCurveTo(u * 0.22, u * 0.84, u * 0.18, u * 0.64, u * 0.18, u * 0.47);
        p.closePath();
      });
      const rim = shape((p) => p.ellipse(u * 0.46, u * 0.47, u * 0.28, u * 0.055, 0, 0, TAU));
      const coffee = shape((p) => p.ellipse(u * 0.46, u * 0.475, u * 0.22, u * 0.034, 0, 0, TAU));
      ctx.save();
      // steam
      ctx.strokeStyle = C.mid;
      ctx.lineWidth = lw * 0.9;
      ctx.lineCap = 'round';
      for (const [x, top] of [[0.35, 0.18], [0.46, 0.1], [0.57, 0.2]]) {
        ctx.beginPath();
        ctx.moveTo(u * x, u * 0.38);
        ctx.bezierCurveTo(u * (x - 0.06), u * 0.32, u * (x + 0.06), u * 0.26, u * x, u * (top + 0.04));
        ctx.stroke();
      }
      // handle (tube: ink under paper)
      ctx.save();
      ctx.lineCap = 'round';
      ctx.translate(o, o);
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = u * 0.06;
      ctx.beginPath();
      ctx.arc(u * 0.73, u * 0.61, u * 0.085, -1.3, 1.25);
      ctx.stroke();
      ctx.restore();
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = u * 0.06 + lw * 2;
      ctx.beginPath();
      ctx.arc(u * 0.73, u * 0.61, u * 0.085, -1.3, 1.25);
      ctx.stroke();
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = u * 0.06;
      ctx.stroke();
      cutout(ctx, [saucer], { fill: C.paper, under: C.orange, lw, dx: o, dy: o * 0.6 });
      cutout(ctx, [cup], { fill: C.paper, under: C.orange, lw, dx: o, dy: o });
      cutout(ctx, [rim], { fill: C.paper, lw: lw * 0.7 });
      ctx.fillStyle = C.rust;
      ctx.fill(coffee);
      drawSpark(ctx, u * 0.46, u * 0.66, u * 0.1, { color: C.orange });
      ctx.restore();
    },
  },
  {
    id: 'plane',
    group: 'illo',
    name: '纸飞机',
    ratio: 0.66,
    size: 0.3,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.022;
      ctx.save();
      // dashed trail that throws a loop
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.setLineDash([u * 0.028, u * 0.03]);
      ctx.beginPath();
      loopPath(ctx, u * 0.52, u * 0.42, u * 0.28, u * 0.38, u * 0.04, u * 0.6, { b: u * 0.09, span: 0.36, side: 1 });
      ctx.stroke();
      ctx.setLineDash([]);
      // the plane
      ctx.translate(u * 0.69, u * 0.25);
      ctx.rotate(-0.36);
      const N = [u * 0.27, 0], A = [-u * 0.27, -u * 0.14], F = [-u * 0.1, u * 0.04], B = [-u * 0.16, u * 0.18], K = [-u * 0.02, u * 0.095];
      const top = shape((p) => poly(p, [N, A, F]));
      const keel = shape((p) => poly(p, [N, F, K]));
      const low = shape((p) => poly(p, [N, K, B, F]));
      ctx.save();
      ctx.translate(u * 0.03, u * 0.03);
      ctx.fillStyle = C.blue;
      for (const p of [top, keel, low]) ctx.fill(p);
      ctx.restore();
      ctx.fillStyle = C.paper;
      ctx.fill(top);
      ctx.fill(low);
      ctx.fillStyle = C.sky;
      ctx.fill(keel);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      for (const p of [low, keel, top]) ctx.stroke(p);
      ctx.restore();
    },
  },
  {
    id: 'camera',
    group: 'illo',
    name: '相机',
    ratio: 0.82,
    size: 0.24,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.026, o = u * 0.025;
      const hump = shape((p) => roundRect(p, u * 0.33, u * 0.14, u * 0.32, u * 0.16, u * 0.04));
      const btn = shape((p) => roundRect(p, u * 0.71, u * 0.19, u * 0.12, u * 0.09, u * 0.025));
      const body = shape((p) => roundRect(p, u * 0.07, u * 0.26, u * 0.86, u * 0.5, u * 0.08));
      const flash = shape((p) => roundRect(p, u * 0.14, u * 0.32, u * 0.13, u * 0.07, u * 0.015));
      const ring = shape((p) => p.arc(u * 0.5, u * 0.52, u * 0.2, 0, TAU));
      const lens = shape((p) => p.arc(u * 0.5, u * 0.52, u * 0.13, 0, TAU));
      ctx.save();
      cutout(ctx, [btn], { fill: C.clay, lw });
      cutout(ctx, [hump], { fill: C.paper, under: C.orange, lw, dx: o, dy: o });
      cutout(ctx, [body], { fill: C.orange, under: C.clay, lw, dx: o, dy: o });
      // top plate
      ctx.save();
      ctx.clip(body);
      ctx.fillStyle = C.paper;
      ctx.fillRect(0, 0, u, u * 0.42);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, u * 0.42);
      ctx.lineTo(u, u * 0.42);
      ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      ctx.stroke(body);
      cutout(ctx, [flash], { fill: GOLD, lw: lw / 2 });
      cutout(ctx, [ring], { fill: C.paper, lw });
      ctx.fillStyle = C.ink2;
      ctx.fill(lens);
      ctx.fillStyle = '#4a5a6e';
      ctx.beginPath();
      ctx.arc(u * 0.5, u * 0.52, u * 0.075, 0, TAU);
      ctx.fill();
      ctx.fillStyle = C.paper;
      for (const [x, y, r] of [[0.455, 0.475, 0.03], [0.54, 0.565, 0.012]]) {
        ctx.beginPath();
        ctx.arc(u * x, u * y, u * r, 0, TAU);
        ctx.fill();
      }
      // flash pop
      ctx.fillStyle = GOLD;
      ctx.beginPath();
      sparklePath(ctx, u * 0.12, u * 0.12, u * 0.08, 0.5);
      ctx.fill();
      ctx.restore();
    },
  },
  {
    id: 'look-here',
    group: 'illo',
    name: '看这里',
    ratio: 0.8,
    size: 0.3,
    fonts: [[font(400, 40, 'handCn'), '看这里']],
    draw(ctx, w, h) {
      const u = w, lw = u * 0.03;
      ctx.save();
      // arrow with a pen loop, on a paper halo
      const ex = u * 0.26, ey = u * 0.7;
      const arrow = () => {
        ctx.beginPath();
        const a = loopPath(ctx, u * 0.7, u * 0.34, u * 0.6, u * 0.62, ex, ey, { b: u * 0.075, side: -1 });
        for (const s of [-1, 1]) {
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex - Math.cos(a + s * 0.55) * u * 0.1, ey - Math.sin(a + s * 0.55) * u * 0.1);
        }
        ctx.stroke();
      };
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = C.paper;
      ctx.lineWidth = lw * 3;
      arrow();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = lw;
      arrow();
      // lettering
      ctx.translate(u * 0.06, u * 0.19);
      ctx.rotate(-0.08);
      ctx.textBaseline = 'middle';
      fit(ctx, '看这里', u * 0.74, { max: u * 0.27, min: 6, weight: 400, family: 'handCn' });
      haloText(ctx, '看这里', 0, 0, { width: u * 0.05, bold: u * 0.008 });
      ctx.restore();
    },
  },
  {
    id: 'flower',
    group: 'illo',
    name: '小花',
    ratio: 1.3,
    size: 0.16,
    outline: true,
    draw(ctx, w, h) {
      const u = w, lw = u * 0.03, o = u * 0.03;
      const cx = u * 0.5, cy = u * 0.38;
      ctx.save();
      // stem + leaves
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + u * 0.06, u * 0.75, cx - u * 0.1, u * 0.95, cx - u * 0.04, h * 0.97);
      ctx.stroke();
      const leaf = (bx, by, tx, ty, bend) =>
        shape((p) => {
          p.moveTo(bx, by);
          p.quadraticCurveTo((bx + tx) / 2 + bend, (by + ty) / 2 - bend, tx, ty);
          p.quadraticCurveTo((bx + tx) / 2 - bend * 0.6, (by + ty) / 2 + bend * 0.6, bx, by);
          p.closePath();
        });
      const l1 = leaf(cx + u * 0.01, u * 0.88, cx + u * 0.34, u * 0.7, u * 0.06);
      const l2 = leaf(cx - u * 0.05, u * 1.05, cx - u * 0.32, u * 0.9, -u * 0.05);
      cutout(ctx, [l1, l2], { fill: C.sage, under: C.green, lw: lw * 0.7, dx: o, dy: o });
      // petals, each inked on top of the last
      const petals = Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * TAU + 0.2;
        return shape((p) => p.ellipse(cx + Math.cos(a) * u * 0.19, cy + Math.sin(a) * u * 0.19, u * 0.145, u * 0.085, a, 0, TAU));
      });
      ctx.save();
      ctx.translate(o, o);
      ctx.fillStyle = C.orange;
      for (const p of petals) ctx.fill(p);
      ctx.restore();
      ctx.lineWidth = lw;
      ctx.lineJoin = 'round';
      for (const p of petals) {
        ctx.fillStyle = C.paper;
        ctx.fill(p);
        ctx.stroke(p);
      }
      const disc = shape((p) => p.arc(cx, cy, u * 0.1, 0, TAU));
      cutout(ctx, [disc], { fill: GOLD, lw: lw / 2 });
      // a small smile
      ctx.fillStyle = C.ink;
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx + s * u * 0.036, cy - u * 0.012, u * 0.013, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = lw * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy + u * 0.006, u * 0.03, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.restore();
    },
  },

  // ---------------------------------------------------------------- badge
  {
    id: 'stamp',
    group: 'badge',
    name: '笑容合格',
    ratio: 1,
    size: 0.26,
    fonts: [[font(700, 40, 'sansCn'), '笑容合格CLAUDE 认证']],
    draw(ctx, w, h) {
      // drawn on its own layer so the worn specks only erase the stamp
      layer(ctx, w, h, (ctx) => {
        const cx = w / 2, cy = h / 2, r = w * 0.44;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.16);
        ctx.strokeStyle = C.clay;
        ctx.fillStyle = C.clay;
        ctx.lineWidth = w * 0.03;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TAU);
        ctx.stroke();
        ctx.lineWidth = w * 0.012;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.84, 0, TAU);
        ctx.stroke();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = font(700, w * 0.17, 'sansCn');
        ctx.fillText('笑容', 0, -w * 0.07);
        ctx.fillText('合格', 0, w * 0.12);
        ctx.font = font(700, w * 0.07, 'sansCn');
        ctx.fillText('CLAUDE 认证', 0, -w * 0.27);
        drawSpark(ctx, 0, w * 0.3, w * 0.05, { color: C.clay });
        // worn ink: knock out a few specks
        ctx.globalCompositeOperation = 'destination-out';
        const rr = rng(9);
        for (let i = 0; i < 70; i++) {
          ctx.globalAlpha = 0.3 + rr() * 0.6;
          ctx.beginPath();
          ctx.arc((rr() - 0.5) * w, (rr() - 0.5) * h, w * (0.004 + rr() * 0.012), 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      });
    },
  },
  { id: 'haiku', ...modelChip('Haiku', '最快', { bg: C.sage, accent: C.green, ratio: 0.3 }) },
  { id: 'sonnet', ...modelChip('Sonnet', '均衡', { bg: C.sky, accent: C.blue, ratio: 0.28 }) },
  { id: 'opus', ...modelChip('Opus', '最强', { bg: C.peach, accent: C.orange, ratio: 0.32 }) },
  {
    id: 'hhh',
    group: 'badge',
    name: 'HHH 缎带',
    ratio: 0.3,
    size: 0.55,
    fonts: [[italic(500, 40, 'serif'), 'Helpful Honest Harmless']],
    draw(ctx, w, h) {
      const bt = h * 0.4; // band thickness
      const R = w * 1.6, cx = w / 2, cy = h * 0.3 + R;
      const half = Math.asin((w * 0.38) / R);
      const a0 = -Math.PI / 2 - half, a1 = -Math.PI / 2 + half;
      const at = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
      ctx.save();
      // tails behind the band ends
      for (const s of [-1, 1]) {
        const a = s < 0 ? a0 : a1;
        const [ex, ey] = at(a, R);
        const t = a + Math.PI / 2; // tangent angle
        ctx.save();
        ctx.translate(ex, ey);
        ctx.rotate(t);
        const L = w * 0.095 * s;
        ctx.fillStyle = C.clay;
        ctx.beginPath();
        ctx.moveTo(-L * 0.4, -bt * 0.3);
        ctx.lineTo(L, -bt * 0.3);
        ctx.lineTo(L * 0.72, bt * 0.3);
        ctx.lineTo(L, bt * 0.9);
        ctx.lineTo(-L * 0.4, bt * 0.9);
        ctx.closePath();
        ctx.fill();
        // fold shadow
        ctx.fillStyle = C.rust;
        ctx.beginPath();
        ctx.moveTo(0, bt * 0.5);
        ctx.lineTo(-L * 0.4, bt * 0.9);
        ctx.lineTo(0, bt * 0.9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      // band
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, R + bt / 2, a0, a1);
      ctx.arc(cx, cy, R - bt / 2, a1, a0, true);
      ctx.closePath();
      ctx.fill();
      // stitching
      ctx.strokeStyle = 'rgba(250,249,245,0.55)';
      ctx.lineWidth = h * 0.012;
      ctx.setLineDash([h * 0.035, h * 0.03]);
      for (const k of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(cx, cy, R + k * bt * 0.36, a0 + 0.004, a1 - 0.004);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      // words along the arc, with sparks between
      const words = ['Helpful', 'Honest', 'Harmless'];
      const size = bt * 0.44;
      ctx.font = italic(500, size, 'serif');
      const gap = size * 1.3;
      const widths = words.map((t) => ctx.measureText(t).width);
      const total = widths.reduce((s, v) => s + v, 0) + gap * 2;
      let x = -total / 2;
      ctx.fillStyle = C.paper;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      words.forEach((word, wi) => {
        for (const ch of word) {
          const cw = ctx.measureText(ch).width;
          const a = -Math.PI / 2 + (x + cw / 2) / R;
          const [px, py] = at(a, R);
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(a + Math.PI / 2);
          ctx.fillText(ch, 0, size * 0.04);
          ctx.restore();
          x += cw;
        }
        if (wi < 2) {
          const a = -Math.PI / 2 + (x + gap / 2) / R;
          const [px, py] = at(a, R);
          drawSpark(ctx, px, py, size * 0.3, { color: C.paper });
          x += gap;
        }
      });
      ctx.restore();
    },
  },
  {
    id: 'artifact',
    group: 'badge',
    name: '大头贴.png',
    ratio: 0.28,
    size: 0.46,
    fonts: [
      [font(500, 40, 'sansCn'), '大头贴.png'],
      [font(400, 40, 'sansCn'), '图片·点击打开'],
    ],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const t = b.h * 0.66, tx = b.x + b.h * 0.17, ty = b.y + (b.h - t) / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h * 0.2, { lw: w * 0.004 });
      // icon tile: a tiny photo strip
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      roundRect(ctx, tx, ty, t, t, t * 0.2);
      ctx.fill();
      const sw = t * 0.34, sh = t * 0.76, sx = tx + (t - sw) / 2, sy = ty + (t - sh) / 2;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.ink2;
      ctx.lineWidth = t * 0.035;
      ctx.beginPath();
      roundRect(ctx, sx, sy, sw, sh, t * 0.03);
      ctx.fill();
      ctx.stroke();
      for (let i = 0; i < 3; i++) {
        const fy = sy + sh * (0.07 + i * 0.3);
        ctx.fillStyle = i === 1 ? C.orange : C.peach;
        ctx.fillRect(sx + sw * 0.16, fy, sw * 0.68, sh * 0.25);
      }
      // text
      const x0 = tx + t + b.h * 0.2;
      const maxW = b.x + b.w - b.h * 0.72 - x0;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      fit(ctx, '大头贴.png', maxW, { max: b.h * 0.27, min: 6, weight: 500, family: 'sansCn' });
      ctx.fillText('大头贴.png', x0, b.y + b.h * 0.36);
      ctx.fillStyle = C.muted;
      fit(ctx, '图片·点击打开', maxW, { max: b.h * 0.2, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('图片·点击打开', x0, b.y + b.h * 0.66);
      icon(ctx, 'download', b.x + b.w - b.h * 0.42, b.y + b.h / 2, b.h * 0.4, { color: C.muted, width: 1.7 });
      ctx.restore();
    },
  },
  {
    id: 'fig-1',
    group: 'badge',
    name: 'Fig. 1',
    ratio: 0.15,
    size: 0.42,
    fonts: [
      [italic(500, 40, 'serif'), 'Fig. 1'],
      [font(400, 40, 'serifCn'), '一个开心的人类'],
    ],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h * 0.1, { fill: C.paper, lw: w * 0.003 });
      ctx.textBaseline = 'middle';
      const size = b.h * 0.46;
      ctx.font = italic(500, size, 'serif');
      const f = 'Fig. 1';
      const fw = ctx.measureText(f).width;
      ctx.font = font(400, size, 'serifCn');
      const cap = '一个开心的人类';
      const cwid = ctx.measureText(cap).width;
      const gap = size * 0.7;
      const k = Math.min(1, (b.w - b.h * 0.8) / (fw + gap + cwid));
      let x = w / 2 - ((fw + gap + cwid) * k) / 2;
      ctx.fillStyle = C.ink;
      ctx.font = italic(500, size * k, 'serif');
      ctx.fillText(f, x, cy);
      x += (fw + gap) * k;
      ctx.fillStyle = C.ink2;
      ctx.font = font(400, size * k, 'serifCn');
      ctx.fillText(cap, x, cy + b.h * 0.02);
      ctx.restore();
    },
  },
  {
    id: 'today',
    group: 'badge',
    name: '今日份开心',
    ratio: 0.42,
    size: 0.34,
    fonts: [[font(400, 40, 'handCn'), '今日份开心']],
    draw(ctx, w, h) {
      ctx.save();
      ctx.translate(w / 2, h * 0.47);
      ctx.rotate(-0.05);
      // marker underline
      ctx.lineCap = 'round';
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = h * 0.07;
      ctx.beginPath();
      ctx.moveTo(-w * 0.4, h * 0.3);
      ctx.bezierCurveTo(-w * 0.1, h * 0.22, w * 0.15, h * 0.36, w * 0.4, h * 0.24);
      ctx.stroke();
      ctx.lineWidth = h * 0.035;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, h * 0.42);
      ctx.bezierCurveTo(-w * 0.05, h * 0.36, w * 0.12, h * 0.44, w * 0.3, h * 0.37);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      fit(ctx, '今日份开心', w * 0.84, { max: h * 0.6, min: 6, weight: 400, family: 'handCn' });
      haloText(ctx, '今日份开心', 0, -h * 0.06, { width: w * 0.035, bold: w * 0.006 });
      ctx.restore();
      // a little heart
      ctx.save();
      ctx.translate(w * 0.9, h * 0.14);
      ctx.rotate(0.25);
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      heartPath(ctx, w * 0.008, w * 0.01, w * 0.05);
      ctx.fill();
      ink(ctx, (c) => heartPath(c, 0, 0, w * 0.05), { width: w * 0.012 });
      ctx.restore();
    },
  },
  {
    id: 'limit',
    group: 'badge',
    name: '拍照上限',
    ratio: 0.22,
    size: 0.5,
    fonts: [
      [font(500, 40, 'sansCn'), '已达今日拍照上限'],
      [font(400, 40, 'sansCn'), '明天再来笑'],
    ],
    draw(ctx, w, h) {
      const b = inset(w, h);
      const cy = b.y + b.h / 2;
      ctx.save();
      card(ctx, b.x, b.y, b.w, b.h, b.h * 0.24, { fill: C.paper, lw: w * 0.004 });
      ctx.fillStyle = C.cream;
      ctx.beginPath();
      ctx.arc(b.x + b.h * 0.52, cy, b.h * 0.3, 0, TAU);
      ctx.fill();
      icon(ctx, 'clock', b.x + b.h * 0.52, cy, b.h * 0.42, { color: C.ink2, width: 1.7 });
      const x0 = b.x + b.h;
      const maxW = b.x + b.w - b.h * 0.3 - x0;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.ink;
      fit(ctx, '已达今日拍照上限', maxW, { max: b.h * 0.26, min: 6, weight: 500, family: 'sansCn' });
      ctx.fillText('已达今日拍照上限', x0, b.y + b.h * 0.34);
      ctx.fillStyle = C.orange;
      const s = fit(ctx, '明天再来笑', maxW, { max: b.h * 0.22, min: 6, weight: 400, family: 'sansCn' });
      ctx.fillText('明天再来笑', x0, b.y + b.h * 0.68);
      ctx.fillRect(x0, b.y + b.h * 0.68 + s * 0.62, ctx.measureText('明天再来笑').width, s * 0.07);
      ctx.restore();
    },
  },
];

export const stickerById = (id) => STICKERS.find((s) => s.id === id);

// Unused-import guard for helpers other sticker modules may want.
export { sparkPath, roughEllipse, FAMILY };
