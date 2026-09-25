// Art for the Y2K gyaru purikura: AR deco props (cat ears, tiara, heart
// shades...), a 落書き stamp pack (Heisei slang word art, holo hearts, a flip
// phone with charms, MBTI badges), six keyed backdrops, a peelable
// sticker-sheet layout and five frames. Everything is drawn in code; all
// sticker text is canvas so it can use the web fonts.

import { svg, heartD, starD, sparkleD, rng } from '../../art/kit.js';
import { stamp, rrect, canvas as mkCanvas, TAU } from '../../core/util.js';
import { stripLayout, gridLayout, slotPath, heartPath } from '../../engine/compose.js';

const PINK = '#ff4fa3';
const HOT = '#ff2e8f';
const LAV = '#c9a8ff';
const PURPLE = '#a259ff';
const SKY = '#8fd8ff';
const LEMON = '#fff27a';
const INK = '#1a1320';
const HOLO = ['#ff9ad8', '#d7a8ff', '#8fd8ff', '#b8ffe0', '#fff29a', '#ff9ad8'];

export const FONT = {
  pop: '"Mochiy Pop One", "ZCOOL KuaiLe", sans-serif',
  bold: '"Dela Gothic One", "Mochiy Pop One", sans-serif',
  block: '"Bungee", "Rubik Mono One", sans-serif',
  pixel: '"VT323", monospace',
};

/** SVG linear gradient (x1 y1 x2 y2 in bounding-box fractions). */
function lg(id, stops, [x1, y1, x2, y2] = [0, 0, 1, 1]) {
  const s = stops.map((c, i) => `<stop offset="${(i / (stops.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${s}</linearGradient>`;
}

// ----------------------------------------------------------------- canvas shapes

function starPath(ctx, x, y, r, n = 5, inner = 0.48, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / n;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function sparklePath(ctx, x, y, r, pinch = 0.16) {
  const p = r * pinch;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + p, y - p, x + r, y);
  ctx.quadraticCurveTo(x + p, y + p, x, y + r);
  ctx.quadraticCurveTo(x - p, y + p, x - r, y);
  ctx.quadraticCurveTo(x - p, y - p, x, y - r);
  ctx.closePath();
}

function butterflyPath(ctx, x, y, r) {
  const k = r / 50;
  const P = (px, py) => [x + (px - 50) * k, y + (py - 45) * k];
  const wing = (s) => {
    const q = (px, py) => P(50 + (px - 50) * s, py);
    ctx.moveTo(...q(50, 44));
    ctx.bezierCurveTo(...q(40, 16), ...q(12, 0), ...q(2, 12));
    ctx.bezierCurveTo(...q(-6, 24), ...q(6, 44), ...q(24, 48));
    ctx.bezierCurveTo(...q(8, 56), ...q(6, 80), ...q(20, 86));
    ctx.bezierCurveTo(...q(34, 92), ...q(48, 74), ...q(50, 58));
    ctx.closePath();
  };
  ctx.beginPath();
  wing(1);
  wing(-1);
}

function fillGrad(ctx, colors, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
  return g;
}

/** Fill the current path with a white die-cut rim and a soft drop shadow. */
function cutout(ctx, r, fill, rim = '#fff') {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = r * 0.32;
  ctx.strokeStyle = rim;
  ctx.shadowColor = 'rgba(110,30,90,0.3)';
  ctx.shadowBlur = r * 0.22;
  ctx.shadowOffsetY = r * 0.08;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = fill;
  ctx.fill();
}

// mini stamps for frames: (ctx, r, color) drawn around (0, 0)
const MINI = {
  heart(ctx, r, c) {
    heartPath(ctx, 0, r * 0.05, r);
    cutout(ctx, r, fillGrad(ctx, ['#fff', c, c], -r, -r, r * 0.6, r));
    ctx.beginPath();
    ctx.ellipse(-r * 0.42, -r * 0.3, r * 0.2, r * 0.12, -0.6, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  },
  star(ctx, r, c) {
    starPath(ctx, 0, r * 0.06, r);
    cutout(ctx, r, fillGrad(ctx, ['#fff', c, c], -r, -r, r, r));
  },
  sparkle(ctx, r, c) {
    sparklePath(ctx, 0, 0, r);
    cutout(ctx, r * 0.6, c, 'rgba(255,255,255,0.9)');
    sparklePath(ctx, 0, 0, r * 0.45);
    ctx.fillStyle = '#fff';
    ctx.fill();
  },
  butterfly(ctx, r, c) {
    butterflyPath(ctx, 0, 0, r);
    cutout(ctx, r * 0.8, fillGrad(ctx, [c, '#fff', SKY], -r, -r, r, r));
    ctx.fillStyle = PURPLE;
    rrect(ctx, -r * 0.08, -r * 0.3, r * 0.16, r * 0.8, r * 0.08);
    ctx.fill();
  },
  bow(ctx, r, c) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-r * 0.4, -r * 0.7, -r * 1.2, -r * 0.6, -r * 1.05, 0);
    ctx.bezierCurveTo(-r * 1.2, r * 0.6, -r * 0.4, r * 0.7, 0, 0);
    ctx.bezierCurveTo(r * 0.4, -r * 0.7, r * 1.2, -r * 0.6, r * 1.05, 0);
    ctx.bezierCurveTo(r * 1.2, r * 0.6, r * 0.4, r * 0.7, 0, 0);
    ctx.moveTo(-r * 0.1, r * 0.1);
    ctx.lineTo(-r * 0.45, r * 0.95);
    ctx.lineTo(-r * 0.15, r * 0.85);
    ctx.lineTo(0, r * 0.15);
    ctx.lineTo(r * 0.15, r * 0.85);
    ctx.lineTo(r * 0.45, r * 0.95);
    ctx.lineTo(r * 0.1, r * 0.1);
    cutout(ctx, r * 0.7, c);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.2, r * 0.24, 0, 0, TAU);
    ctx.fillStyle = '#fff';
    ctx.fill();
  },
  crown(ctx, r, c) {
    ctx.beginPath();
    ctx.moveTo(-r, r * 0.6);
    ctx.lineTo(-r * 1.05, -r * 0.45);
    ctx.lineTo(-r * 0.45, 0);
    ctx.lineTo(0, -r * 0.8);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(r * 1.05, -r * 0.45);
    ctx.lineTo(r, r * 0.6);
    ctx.closePath();
    cutout(ctx, r * 0.7, fillGrad(ctx, ['#fff', c], 0, -r, 0, r));
    heartPath(ctx, 0, r * 0.2, r * 0.22);
    ctx.fillStyle = PINK;
    ctx.fill();
  },
  lips(ctx, r, c) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.25);
    ctx.bezierCurveTo(-r * 0.2, -r * 0.6, -r * 0.6, -r * 0.62, -r * 1.05, -r * 0.02);
    ctx.bezierCurveTo(-r * 0.7, r * 0.62, r * 0.7, r * 0.62, r * 1.05, -r * 0.02);
    ctx.bezierCurveTo(r * 0.6, -r * 0.62, r * 0.2, -r * 0.6, 0, -r * 0.25);
    cutout(ctx, r * 0.7, c);
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, 0);
    ctx.quadraticCurveTo(0, r * 0.2, r * 0.9, 0);
    ctx.strokeStyle = 'rgba(90,0,40,0.45)';
    ctx.lineWidth = r * 0.08;
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.3, r * 0.25, r * 0.22, r * 0.07, -0.1, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  },
  cherry(ctx, r, c) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, r * 0.3);
    ctx.quadraticCurveTo(-r * 0.2, -r * 0.6, r * 0.25, -r * 0.95);
    ctx.moveTo(r * 0.5, r * 0.25);
    ctx.quadraticCurveTo(r * 0.4, -r * 0.4, r * 0.25, -r * 0.95);
    ctx.stroke();
    ctx.strokeStyle = '#3f9a45';
    ctx.lineWidth = r * 0.1;
    ctx.stroke();
    ctx.restore();
    for (const [x, y] of [[-r * 0.48, r * 0.45], [r * 0.52, r * 0.4]]) {
      ctx.beginPath();
      ctx.arc(x, y, r * 0.44, 0, TAU);
      cutout(ctx, r * 0.6, c);
      ctx.beginPath();
      ctx.arc(x - r * 0.14, y - r * 0.14, r * 0.1, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    }
  },
  strawberry(ctx, r, c) {
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.bezierCurveTo(-r * 0.7, r * 0.6, -r * 0.95, -r * 0.1, -r * 0.8, -r * 0.45);
    ctx.bezierCurveTo(-r * 0.5, -r * 0.8, r * 0.5, -r * 0.8, r * 0.8, -r * 0.45);
    ctx.bezierCurveTo(r * 0.95, -r * 0.1, r * 0.7, r * 0.6, 0, r);
    cutout(ctx, r * 0.7, c);
    ctx.fillStyle = '#fff3b0';
    for (const [x, y] of [[-0.4, -0.2], [0, -0.3], [0.4, -0.2], [-0.25, 0.15], [0.25, 0.15], [0, 0.5]]) {
      ctx.beginPath();
      ctx.ellipse(x * r, y * r, r * 0.05, r * 0.08, 0, 0, TAU);
      ctx.fill();
    }
    starPath(ctx, 0, -r * 0.62, r * 0.42, 5, 0.4, Math.PI / 2);
    ctx.fillStyle = '#4fbf5a';
    ctx.fill();
  },
  candy(ctx, r, c) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, 0);
    ctx.lineTo(-r * 1.1, -r * 0.45);
    ctx.lineTo(-r * 1.1, r * 0.45);
    ctx.closePath();
    ctx.moveTo(r * 0.5, 0);
    ctx.lineTo(r * 1.1, -r * 0.45);
    ctx.lineTo(r * 1.1, r * 0.45);
    ctx.closePath();
    ctx.moveTo(r * 0.55, 0);
    ctx.arc(0, 0, r * 0.55, 0, TAU);
    cutout(ctx, r * 0.6, c);
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, TAU);
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = r * 0.14;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * 0.35 - r, -r);
      ctx.lineTo(i * r * 0.35 + r, r);
      ctx.stroke();
    }
    ctx.restore();
  },
};

function mini(ctx, kind, x, y, r, color, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  (MINI[kind] || MINI.heart)(ctx, r, color);
  ctx.restore();
}

// ----------------------------------------------------------------- patterns

/** One tapered blob along an ellipse arc (a piece of a leopard rosette). */
function crescent(ctx, rx, ry, a0, a1, w) {
  const n = 12;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = a0 + (a1 - a0) * u;
    const t = w * Math.pow(Math.sin(Math.PI * u), 0.45);
    pts.push([Math.cos(a), Math.sin(a), t]);
  }
  ctx.beginPath();
  for (const [c, s, t] of pts) ctx.lineTo(c * (rx + t * 0.55), s * (ry + t * 0.55));
  for (let i = n; i >= 0; i--) ctx.lineTo(pts[i][0] * (rx - pts[i][2] * 0.45), pts[i][1] * (ry - pts[i][2] * 0.45));
  ctx.closePath();
  ctx.fill();
}

/** Leopard print: broken rings of tapered blobs around a tinted core, plus loose spots. */
function leopard(ctx, W, H, { base, ring, core, cell = 90, seed = 1, wrap = false }) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const r = rng(seed);
  const cols = Math.ceil(W / cell) + (wrap ? 0 : 1);
  const rows = Math.ceil(H / (cell * 0.8)) + (wrap ? 0 : 1);
  const spots = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      spots.push({
        x: (i + (j % 2) * 0.5) * cell + (r() - 0.5) * cell * 0.3,
        y: (j + 0.5) * cell * 0.8 + (r() - 0.5) * cell * 0.26,
        s: cell * (0.21 + r() * 0.1),
        e: 0.7 + r() * 0.22,
        rot: r() * TAU,
        a0: r() * TAU,
        blobs: Array.from({ length: 2 + Math.floor(r() * 3) }, () => [r(), r(), r()]),
        dots: Array.from({ length: 1 + Math.floor(r() * 2) }, () => [r(), r(), r()]),
      });
    }
  }
  const offs = wrap ? [-1, 0, 1] : [0];
  for (const sp of spots) {
    for (const ox of offs) {
      for (const oy of offs) {
        ctx.save();
        ctx.translate(sp.x + ox * W, sp.y + oy * H);
        ctx.rotate(sp.rot);
        const rx = sp.s;
        const ry = sp.s * sp.e;
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 0.88, ry * 0.86, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = ring;
        let a = sp.a0;
        for (const [q1, q2, q3] of sp.blobs) {
          const len = (TAU / sp.blobs.length) * (0.5 + q1 * 0.32);
          crescent(ctx, rx, ry, a, a + len, sp.s * (0.26 + q2 * 0.24));
          a += TAU / sp.blobs.length + (q3 - 0.5) * 0.3;
        }
        for (const [d1, d2, d3] of sp.dots) {
          const dd = sp.s * (1.45 + d1 * 0.5);
          ctx.beginPath();
          ctx.ellipse(dd * Math.cos(d2 * TAU), dd * Math.sin(d2 * TAU), sp.s * (0.12 + d3 * 0.12), sp.s * (0.09 + d3 * 0.08), d2 * 5, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }
  }
}

/** Zebra print: near-parallel wavy stripes that drift, pinch and fork (never cross). */
function zebra(ctx, W, H, { base, ink, band = 80, seed = 1, tilt = 0.4 }) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  const r = rng(seed);
  ctx.fillStyle = ink;
  const step = Math.max(6, W / 140);
  const f1 = TAU / (W * 0.9);
  const f2 = TAU / (W * 0.33);
  let p1 = r() * TAU;
  let p2 = r() * TAU;
  let amp = band * 0.6;
  const count = Math.ceil((H + W * Math.abs(tilt)) / band) + 4;
  for (let k = -2; k < count; k++) {
    // each stripe is a slightly drifted copy of the previous one
    p1 += (r() - 0.5) * 0.24;
    p2 += (r() - 0.5) * 0.5;
    amp = Math.min(band * 0.85, Math.max(band * 0.3, amp + (r() - 0.5) * band * 0.12));
    const y0 = k * band - W * Math.max(0, tilt);
    const thick = band * (0.42 + r() * 0.12);
    const pf = TAU / (W * (0.25 + r() * 0.45));
    const pp = r() * TAU;
    const depth = r() < 0.55 ? 0.95 : 0.45;
    const [a1, a2] = [p1, p2];
    const A = amp;
    const mid = (x) => y0 + x * tilt + Math.sin(x * f1 + a1) * A + Math.sin(x * f2 + a2) * A * 0.28;
    const th = (x) => thick * (1 - depth * Math.pow(Math.max(0, Math.sin(x * pf + pp)), 4));
    const xs = [];
    for (let x = -step; x <= W + step; x += step) xs.push(x);
    ctx.beginPath();
    for (const x of xs) ctx.lineTo(x, mid(x) - th(x) / 2);
    for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(xs[i], mid(xs[i]) + th(xs[i]) / 2);
    ctx.closePath();
    ctx.fill();
    if (r() < 0.6) {
      // a thin tapered branch peeling off into the gap
      const fx = r() * W;
      const len = band * (1.2 + r() * 1.4);
      const dir = r() < 0.5 ? -1 : 1;
      const side = r() < 0.5 ? -1 : 1;
      const w0 = thick * (0.3 + r() * 0.2);
      const us = Array.from({ length: 13 }, (_, i) => i / 12);
      // the root starts hidden inside the stripe, then the branch curls out and tapers
      const cy = (u) => {
        const x = fx + dir * len * u;
        return mid(x) + side * (th(x) / 2 - w0 * 0.6 + (band * 0.3 + w0 * 0.6) * Math.pow(u, 1.5));
      };
      const hw = (u) => (w0 / 2) * Math.pow(1 - u, 0.8);
      ctx.beginPath();
      for (const u of us) ctx.lineTo(fx + dir * len * u, cy(u) - hw(u));
      for (let i = us.length - 1; i >= 0; i--) ctx.lineTo(fx + dir * len * us[i], cy(us[i]) + hw(us[i]));
      ctx.closePath();
      ctx.fill();
    }
  }
}

function gingham(ctx, W, H, { base, band, size }) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = band;
  for (let x = 0; x < W; x += size * 2) ctx.fillRect(x, 0, size, H);
  for (let y = 0; y < H; y += size * 2) ctx.fillRect(0, y, W, size);
}

/** Pastel holographic foil: iridescent gradient + soft diagonal light bands. */
function holoFoil(ctx, W, H, { seed = 5 } = {}) {
  ctx.fillStyle = fillGrad(ctx, ['#ffc6ec', '#e3c8ff', '#bfe9ff', '#c9ffe9', '#fff5c2', '#ffc6ec'], 0, 0, W, H);
  ctx.fillRect(0, 0, W, H);
  const r = rng(seed);
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light';
  for (let i = 0; i < 7; i++) {
    const x = (r() * 1.4 - 0.2) * W;
    const g = ctx.createLinearGradient(x, 0, x + W * 0.3, H * 0.4);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.35 + r() * 0.4})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}

/** Scatter of stars / sparkles / dots on a jittered grid. */
function starfield(ctx, W, H, { cell, seed, colors, rim = '#fff' }) {
  const r = rng(seed);
  ctx.lineJoin = 'round';
  for (let y = cell * 0.4; y < H + cell; y += cell) {
    for (let x = cell * 0.4; x < W + cell; x += cell) {
      const cx = x + (r() - 0.5) * cell * 0.8;
      const cy = y + (r() - 0.5) * cell * 0.8;
      const s = cell * (0.1 + r() * 0.2);
      const color = colors[Math.floor(r() * colors.length)];
      const kind = r();
      const rot = (r() - 0.5) * 0.8;
      if (kind < 0.5) {
        starPath(ctx, cx, cy, s, 5, 0.5, -Math.PI / 2 + rot);
        if (rim) {
          ctx.lineWidth = s * 0.3;
          ctx.strokeStyle = rim;
          ctx.stroke();
        }
        ctx.fillStyle = color;
        ctx.fill();
      } else if (kind < 0.8) {
        sparklePath(ctx, cx, cy, s * 1.1);
        ctx.fillStyle = color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.22, 0, TAU);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
  }
}

function heartfield(ctx, W, H, { cell, seed, colors }) {
  const r = rng(seed);
  let row = 0;
  for (let y = cell * 0.4; y < H + cell; y += cell * 0.8, row++) {
    for (let x = (row % 2) * cell * 0.5; x < W + cell; x += cell) {
      const s = cell * (0.2 + r() * 0.12);
      const c = colors[Math.floor(r() * colors.length)];
      ctx.save();
      ctx.translate(x + (r() - 0.5) * cell * 0.2, y + (r() - 0.5) * cell * 0.2);
      ctx.rotate((r() - 0.5) * 0.7);
      heartPath(ctx, 0, 0, s);
      if (r() < 0.25) {
        ctx.lineWidth = s * 0.22;
        ctx.strokeStyle = c;
        ctx.stroke();
      } else {
        ctx.lineWidth = s * 0.22;
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.stroke();
        ctx.fillStyle = c;
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function butterflyfield(ctx, W, H, { cell, seed }) {
  const r = rng(seed);
  const cols = [['#ffb3e6', '#fff'], [LAV, '#fff'], [SKY, '#fff']];
  for (let y = cell * 0.5; y < H; y += cell) {
    for (let x = cell * 0.5; x < W; x += cell) {
      if (r() < 0.45) continue;
      const rr = cell * (0.16 + r() * 0.12);
      const cx = x + (r() - 0.5) * cell * 0.6;
      const cy = y + (r() - 0.5) * cell * 0.6;
      const [a, b] = cols[Math.floor(r() * cols.length)];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((r() - 0.5) * 0.9);
      ctx.globalAlpha = 0.9;
      butterflyPath(ctx, 0, 0, rr);
      ctx.fillStyle = fillGrad(ctx, [a, b], -rr, -rr, rr, rr);
      ctx.fill();
      ctx.lineWidth = rr * 0.06;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.restore();
    }
  }
}

// cached pattern tiles / backdrops (drawn once per size)
const tiles = new Map();
function cached(key, w, h, draw) {
  const k = `${key}:${Math.round(w)}x${Math.round(h)}`;
  let c = tiles.get(k);
  if (!c) {
    c = mkCanvas(w, h);
    draw(c.getContext('2d'), c.width, c.height);
    tiles.set(k, c);
    if (tiles.size > 10) tiles.delete(tiles.keys().next().value);
  }
  return c;
}

const leopardTile = () =>
  cached('leo-tile', 180, 192, (ctx, w, h) => leopard(ctx, w, h, { base: '#ffb3d9', ring: INK, core: '#ff7cc0', cell: 60, seed: 3, wrap: true }));

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js (units = eye distance d)

const WHISKERS = svg(280, 110, `
  <g stroke="${INK}" stroke-width="5" stroke-linecap="round" fill="none">
    <path d="M100 50 Q56 36 10 30"/><path d="M100 62 Q54 58 6 64"/><path d="M102 74 Q58 82 14 98"/>
    <path d="M180 50 Q224 36 270 30"/><path d="M180 62 Q226 58 274 64"/><path d="M178 74 Q222 82 266 98"/>
  </g>
  <path d="M124 32 C124 23 156 23 156 32 C156 42 145 50 140 50 C135 50 124 42 124 32 Z" fill="${PINK}"/>
  <path d="M140 50 L140 58 M125 60 Q132.5 71 140 58 Q147.5 71 155 60" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="134" cy="30" rx="6" ry="3.5" fill="#fff" opacity=".75"/>`);

const BOW_BODY = (c1, c2) => `
  <path d="M112 84 L84 142 L99 136 L107 147 L122 92 Z" fill="${c2}"/>
  <path d="M128 84 L156 142 L141 136 L133 147 L118 92 Z" fill="${c2}"/>
  <path d="M120 70 C96 40 46 8 20 26 C2 40 8 96 32 112 C56 126 98 100 120 80 Z" fill="${c1}"/>
  <path d="M120 70 C144 40 194 8 220 26 C238 40 232 96 208 112 C184 126 142 100 120 80 Z" fill="${c1}"/>
  <path d="M116 74 C92 58 56 44 36 52 C56 58 86 70 110 82 Z M124 74 C148 58 184 44 204 52 C184 58 154 70 130 82 Z" fill="${c2}" opacity=".5"/>
  <g fill="#fff" opacity=".92">
    <circle cx="40" cy="42" r="7"/><circle cx="70" cy="56" r="6"/><circle cx="30" cy="80" r="6"/><circle cx="58" cy="96" r="7"/><circle cx="92" cy="80" r="5"/>
    <circle cx="200" cy="42" r="7"/><circle cx="170" cy="56" r="6"/><circle cx="210" cy="80" r="6"/><circle cx="182" cy="96" r="7"/><circle cx="148" cy="80" r="5"/>
  </g>
  <path d="M34 34 C44 26 58 26 70 32" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".6"/>
  <rect x="104" y="56" width="32" height="38" rx="13" fill="${c1}" stroke="${c2}" stroke-width="4"/>
  <path d="M112 64 Q118 60 126 62" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/>`;

export const props = [
  {
    id: 'y2k-neko',
    name: '猫耳发箍',
    anchor: 'crown',
    w: 2.75,
    origin: [0.5, 0.66],
    svg: svg(260, 170, `
      <path d="M30 132 C28 92 38 46 56 14 C60 7 67 7 72 13 C90 36 106 68 114 104 Z" fill="${INK}"/>
      <path d="M47 116 C47 88 53 58 61 38 C72 55 84 78 92 104 Z" fill="#ff8cc6"/>
      <path d="M230 132 C232 92 222 46 204 14 C200 7 193 7 188 13 C170 36 154 68 146 104 Z" fill="${INK}"/>
      <path d="M213 116 C213 88 207 58 199 38 C188 55 176 78 168 104 Z" fill="#ff8cc6"/>
      <path d="M12 164 C36 116 82 98 130 98 C178 98 224 116 248 164" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>
      <path d="M26 148 C52 116 90 105 130 105 C170 105 208 116 234 148" fill="none" stroke="${PINK}" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(200 112) rotate(16)">
        <path d="M0 0 L-24 -15 L-24 15 Z M0 0 L24 -15 L24 15 Z" fill="${HOT}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
        <circle r="7" fill="${HOT}" stroke="#fff" stroke-width="3"/>
      </g>
      <path d="${sparkleD(62, 80, 10)}" fill="#fff"/>
      <circle cx="194" cy="62" r="3.5" fill="#fff"/>`),
  },
  {
    id: 'y2k-usagi',
    name: '兔耳朵',
    anchor: 'crown',
    w: 2.5,
    origin: [0.5, 0.8],
    svg: svg(240, 256, `
      <g transform="rotate(-14 92 200)">
        <path d="M92 204 C70 172 62 104 68 54 C72 26 82 10 94 10 C106 10 114 26 116 54 C120 104 112 172 92 204 Z" fill="#fff" stroke="#f0c2d8" stroke-width="4"/>
        <path d="M93 178 C81 152 77 104 81 64 C83 42 88 30 94 30 C100 30 103 42 104 64 C107 104 103 152 93 178 Z" fill="#ffb3d6"/>
      </g>
      <g transform="rotate(10 150 200)">
        <path d="M150 204 C128 172 122 124 126 88 C128 76 136 68 150 68 C164 68 172 76 174 88 C178 124 172 172 150 204 Z" fill="#fff" stroke="#f0c2d8" stroke-width="4"/>
        <path d="M150 176 C140 152 137 120 139 96 C141 86 145 82 150 82 C155 82 159 86 161 96 C163 120 160 152 150 176 Z" fill="#ffb3d6"/>
        <path d="M128 84 C128 60 146 44 170 46 C194 48 206 66 198 78 C190 88 168 82 150 88 C140 91 129 92 128 84 Z" fill="#fff" stroke="#f0c2d8" stroke-width="4"/>
      </g>
      <path d="M10 246 C32 204 78 190 120 190 C162 190 208 204 230 246" fill="none" stroke="#ff8cc6" stroke-width="14" stroke-linecap="round"/>
      <path d="M28 228 C54 204 88 197 120 197 C152 197 186 204 212 228" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>
      <g transform="translate(66 204) rotate(-24)">
        <path d="M0 0 L-18 -12 L-18 12 Z M0 0 L18 -12 L18 12 Z" fill="${PINK}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
        <circle r="6" fill="${PINK}" stroke="#fff" stroke-width="2.5"/>
      </g>`),
  },
  {
    id: 'y2k-chou',
    name: '蝴蝶发夹',
    anchor: 'head',
    pair: true,
    flipPair: true,
    w: 0.82,
    dx: 0.72,
    dy: -0.42,
    rot: 0.25,
    origin: [0.5, 0.5],
    svg: svg(128, 104, `
      <g transform="translate(4 2)">
        <path d="M60 46 C50 18 22 2 9 12 C-1 21 8 44 30 50 C12 56 7 78 20 88 C34 97 54 80 60 60 Z" fill="url(#w)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
        <path d="M60 46 C70 18 98 2 111 12 C121 21 112 44 90 50 C108 56 113 78 100 88 C86 97 66 80 60 60 Z" fill="url(#w)" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
        <path d="M58 48 C50 36 34 24 20 22 M62 48 C70 36 86 24 100 22" stroke="#fff" stroke-width="2.5" opacity=".7" fill="none"/>
        <g fill="#fff"><circle cx="28" cy="30" r="4.5"/><circle cx="92" cy="30" r="4.5"/><circle cx="26" cy="74" r="3.5"/><circle cx="94" cy="74" r="3.5"/></g>
        <rect x="55" y="32" width="10" height="44" rx="5" fill="${PURPLE}"/>
        <circle cx="60" cy="37" r="3" fill="#fff" opacity=".85"/>
      </g>`, lg('w', ['#ffb3e6', '#c9a8ff', '#8fd8ff'])),
  },
  {
    id: 'y2k-heart-shades',
    name: '爱心墨镜',
    anchor: 'eyes',
    w: 2.3,
    origin: [0.5, 0.5],
    svg: svg(260, 110, `
      <path d="M8 40 L28 46 M252 40 L232 46" stroke="${HOT}" stroke-width="8" stroke-linecap="round"/>
      <path d="M104 22 Q130 8 156 22" stroke="${HOT}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="${heartD(73.5, 52, 50)}" fill="url(#l)" fill-opacity=".86" stroke="${HOT}" stroke-width="8" stroke-linejoin="round"/>
      <path d="${heartD(186.5, 52, 50)}" fill="url(#l)" fill-opacity=".86" stroke="${HOT}" stroke-width="8" stroke-linejoin="round"/>
      <path d="M44 38 Q50 24 64 24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="M157 38 Q163 24 177 24" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>
      <path d="${sparkleD(96, 74, 8)}" fill="#fff"/><path d="${sparkleD(209, 74, 8)}" fill="#fff"/>`,
    lg('l', ['#ff8cc8', '#c05cff'], [0, 0, 0, 1])),
  },
  {
    id: 'y2k-tiara',
    name: '公主皇冠',
    anchor: 'crown',
    w: 2.1,
    dy: 0.06,
    origin: [0.5, 0.86],
    svg: svg(240, 140, `
      <path d="M16 126 C24 100 40 90 60 96 C64 74 80 62 98 68 C100 44 110 24 120 10 C130 24 140 44 142 68 C160 62 176 74 180 96 C200 90 216 100 224 126 C176 110 64 110 16 126 Z" fill="url(#s)" stroke="#7d88b3" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M40 114 C48 102 60 100 70 106 M170 106 C180 100 192 102 200 114 M84 100 C90 86 104 84 110 94 M130 94 C136 84 150 86 156 100" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
      <g><circle cx="40" cy="114.3" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/><circle cx="56" cy="111.3" r="4" fill="#ff7cc4" stroke="#c9cfe0" stroke-width="1"/><circle cx="72" cy="109.0" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/><circle cx="88" cy="107.3" r="4" fill="#ff7cc4" stroke="#c9cfe0" stroke-width="1"/><circle cx="104" cy="106.3" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/><circle cx="120" cy="106.0" r="4" fill="#ff7cc4" stroke="#c9cfe0" stroke-width="1"/><circle cx="136" cy="106.3" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/><circle cx="152" cy="107.3" r="4" fill="#ff7cc4" stroke="#c9cfe0" stroke-width="1"/><circle cx="168" cy="109.0" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/><circle cx="184" cy="111.3" r="4" fill="#ff7cc4" stroke="#c9cfe0" stroke-width="1"/><circle cx="200" cy="114.3" r="4" fill="#fff" stroke="#c9cfe0" stroke-width="1"/></g>
      <path d="${heartD(120, 74, 21)}" fill="url(#p)" stroke="#fff" stroke-width="3.5"/>
      <path d="M110 64 Q115 58 122 60" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="80" cy="92" r="9" fill="${SKY}" stroke="#fff" stroke-width="3"/>
      <circle cx="160" cy="92" r="9" fill="${LAV}" stroke="#fff" stroke-width="3"/>
      <g fill="#fff" stroke="#b5bdd8" stroke-width="1.5"><circle cx="60" cy="94" r="6"/><circle cx="98" cy="66" r="6"/><circle cx="142" cy="66" r="6"/><circle cx="180" cy="94" r="6"/></g>
      <path d="${sparkleD(120, 14, 15)}" fill="#fff" stroke="#b5bdd8" stroke-width="1.5"/>`,
    lg('s', ['#ffffff', '#d3daee', '#98a3c8'], [0, 0, 0, 1]) + lg('p', ['#ffd1ea', PINK, '#d61f7a'], [0, 0, 0, 1])),
  },
  {
    id: 'y2k-ribbon',
    name: '大蝴蝶结',
    anchor: 'crown',
    w: 1.9,
    dx: 0.55,
    dy: 0.08,
    rot: 0.28,
    origin: [0.5, 0.52],
    svg: svg(240, 150, BOW_BODY('#ff7cc0', '#e0438f')),
  },
  {
    id: 'y2k-whiskers',
    name: '猫咪胡须',
    anchor: 'nose',
    w: 2.4,
    origin: [0.5, 0.36],
    svg: WHISKERS,
  },
  {
    id: 'y2k-blush',
    name: '腮红亮片',
    anchor: 'cheeks',
    pair: true,
    flipPair: true,
    w: 1.05,
    dx: -0.12,
    dy: -0.28,
    origin: [0.45, 0.56],
    svg: svg(140, 100, `
      <ellipse cx="62" cy="56" rx="58" ry="38" fill="url(#g)"/>
      <g stroke="#ff3d8e" stroke-width="4" stroke-linecap="round" opacity=".55"><path d="M38 68 L50 46"/><path d="M58 70 L70 48"/><path d="M78 70 L90 48"/></g>
      <path d="${sparkleD(114, 22, 18)}" fill="#fff"/><path d="${sparkleD(114, 22, 8)}" fill="#fff6a8"/>
      <circle cx="130" cy="44" r="3.5" fill="#fff"/>
      <path d="${heartD(22, 24, 9)}" fill="${PINK}" stroke="#fff" stroke-width="2"/>`,
    `<radialGradient id="g"><stop offset="0" stop-color="#ff5fa8" stop-opacity=".62"/><stop offset=".6" stop-color="#ff7cb8" stop-opacity=".32"/><stop offset="1" stop-color="#ff9ccb" stop-opacity="0"/></radialGradient>`),
  },
  {
    id: 'y2k-wanko',
    name: '小狗鼻子',
    anchor: 'nose',
    w: 0.72,
    dy: -0.04,
    origin: [0.5, 0.5],
    svg: svg(120, 90, `
      <path d="M60 80 C44 80 14 64 12 38 C10 18 30 8 60 8 C90 8 110 18 108 38 C106 64 76 80 60 80 Z" fill="#2b1d26"/>
      <path d="M60 80 C50 80 40 76 32 70 C44 74 76 74 88 70 C80 76 70 80 60 80 Z" fill="#000" opacity=".3"/>
      <ellipse cx="42" cy="26" rx="17" ry="8" fill="#fff" opacity=".55" transform="rotate(-12 42 26)"/>
      <ellipse cx="80" cy="22" rx="7" ry="4" fill="#fff" opacity=".4"/>
      <path d="M44 52 Q52 58 60 54 Q68 58 76 52" stroke="#0d070b" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>`),
  },
  {
    id: 'y2k-star-pins',
    name: '星星发夹',
    anchor: 'head',
    pair: true,
    flipPair: true,
    w: 0.64,
    dx: 0.5,
    dy: -0.32,
    rot: 0.4,
    origin: [0.5, 0.5],
    svg: svg(120, 120, `
      <rect x="22" y="84" width="84" height="11" rx="5.5" fill="#e6eaf5" stroke="#9aa3bf" stroke-width="2" transform="rotate(-32 64 90)"/>
      <path d="${starD(56, 52, 44, 5, 0.5)}" fill="url(#y)" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>
      <path d="${starD(96, 88, 20, 5, 0.5, -70)}" fill="#ff7cc4" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
      <path d="M36 42 Q44 32 56 32" stroke="#fff" stroke-width="5" opacity=".85" fill="none" stroke-linecap="round"/>`,
    lg('y', ['#fffbd6', '#ffe45c', '#ffb3e6'])),
  },
];

// ----------------------------------------------------------------- stickers

/** Paint for word art: colour, vertical gradient, or a named pattern. */
function wordPaint(ctx, fill, fs) {
  if (fill === 'leopard') return ctx.createPattern(leopardTile(), 'repeat');
  if (fill === 'chrome') return fillGrad(ctx, ['#ffffff', '#dfe6f7', '#9aa6c8', '#f4f7ff', '#b6bfdc'], 0, -fs * 0.45, 0, fs * 0.45);
  if (Array.isArray(fill)) return fillGrad(ctx, fill, 0, -fs * 0.45, 0, fs * 0.45);
  return fill;
}

/**
 * Canvas word-art sticker: stacked outlines (outermost first), a fill that can
 * be a colour, gradient or pattern, optional neon glow and decorations.
 */
function wordArt({ id, name, text, font = FONT.pop, size = 0.34, group, fill = PINK, rings = [['#fff', 0.2]], glow, deco, pad = 0.34, lh = 1.08, outline = 0.05, outlineColor, holo }) {
  const fs = 100;
  const css = `400 ${fs}px ${font}`;
  const lines = text.split('\n');
  let dims = null;
  const widest = (ctx) => {
    ctx.font = css;
    return Math.max(...lines.map((l) => ctx.measureText(l).width));
  };
  const measure = (ctx) => {
    const tw = widest(ctx);
    return { tw, W: tw + pad * fs * 2, H: fs * lh * lines.length + pad * fs * 1.7 };
  };
  return {
    id,
    name: name || lines.join(''),
    group,
    size,
    outline,
    outlineColor,
    holo,
    fontSpec: { font: css, text: lines.join('') },
    get ratio() {
      dims ||= measure(mkCanvas(4, 4).getContext('2d'));
      return dims.H / dims.W;
    },
    draw(ctx, w) {
      dims ||= measure(ctx);
      const k = w / dims.W;
      ctx.scale(k, k);
      // squeeze if the real font turned out wider than the first measurement
      const sx = Math.min(1, dims.tw / widest(ctx));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const y0 = dims.H / 2 - (fs * lh * (lines.length - 1)) / 2 + fs * 0.03;
      lines.forEach((l, i) => {
        ctx.save();
        ctx.translate(dims.W / 2, y0 + i * fs * lh);
        ctx.scale(sx, 1);
        for (const [color, width] of rings) {
          ctx.lineWidth = width * fs;
          ctx.strokeStyle = color;
          ctx.strokeText(l, 0, 0);
        }
        if (glow) {
          ctx.shadowColor = glow;
          ctx.shadowBlur = fs * 0.3 * k;
        }
        ctx.fillStyle = wordPaint(ctx, fill, fs);
        ctx.fillText(l, 0, 0);
        ctx.restore();
      });
      deco?.(ctx, dims.W, dims.H, fs);
    },
  };
}

/** Decorations for word art. */
const sparkles = (...pts) => (ctx, W, H, fs) => {
  for (const [x, y, s, c = '#fff'] of pts) {
    sparklePath(ctx, x * W, y * H, s * fs);
    ctx.lineWidth = s * fs * 0.22;
    ctx.strokeStyle = c === '#fff' ? PINK : '#fff';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.fill();
  }
};
const hearts = (...pts) => (ctx, W, H, fs) => {
  for (const [x, y, s, c = PINK] of pts) {
    heartPath(ctx, x * W, y * H, s * fs);
    ctx.lineWidth = s * fs * 0.3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.fill();
  }
};

function mbti(code, [c1, c2, ink]) {
  const css = `400 100px ${FONT.block}`;
  return {
    id: `y2k-mbti-${code.toLowerCase()}`,
    name: `${code} 徽章`,
    group: 'MBTI',
    size: 0.3,
    ratio: 0.58,
    outline: 0.045,
    fontSpec: { font: css, text: `${code}MBTI` },
    draw(ctx, w, h) {
      rrect(ctx, w * 0.03, h * 0.2, w * 0.94, h * 0.76, h * 0.38);
      ctx.fillStyle = fillGrad(ctx, [c1, c2], 0, h * 0.2, 0, h);
      ctx.fill();
      ctx.lineWidth = h * 0.045;
      ctx.strokeStyle = ink;
      ctx.stroke();
      rrect(ctx, w * 0.1, h * 0.27, w * 0.8, h * 0.17, h * 0.085);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
      ctx.font = css;
      const tw = ctx.measureText(code).width;
      const fs = Math.min(h * 0.46, ((w * 0.78) / tw) * 100);
      ctx.font = `400 ${fs}px ${FONT.block}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = fs * 0.22;
      ctx.strokeStyle = ink;
      ctx.strokeText(code, w / 2, h * 0.61);
      ctx.fillStyle = '#fff';
      ctx.fillText(code, w / 2, h * 0.61);
      // "MBTI" tab
      rrect(ctx, w * 0.07, h * 0.02, w * 0.36, h * 0.28, h * 0.14);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.lineWidth = h * 0.035;
      ctx.strokeStyle = ink;
      ctx.stroke();
      ctx.font = `400 ${h * 0.2}px ${FONT.pixel}`;
      ctx.fillStyle = ink;
      ctx.fillText('MBTI', w * 0.25, h * 0.165);
      sparklePath(ctx, w * 0.88, h * 0.2, h * 0.16);
      ctx.fillStyle = '#fff';
      ctx.lineWidth = h * 0.03;
      ctx.stroke();
      ctx.fill();
    },
  };
}

export const stickers = [
  // --- Heisei slang (FuRyu 2025: pink/purple/black neon + 平成 words)
  wordArt({ id: 'y2k-zuttomo', text: 'ズッ友', group: '平成语', fill: HOT, rings: [[INK, 0.34], ['#fff', 0.18]], size: 0.34, deco: sparkles([0.9, 0.2, 0.2], [0.08, 0.84, 0.13]) }),
  wordArt({ id: 'y2k-nikoichi', text: 'ニコイチ', group: '平成语', fill: ['#dcbcff', '#8a3dff'], rings: [['#4a1a8f', 0.3], ['#fff', 0.16]], size: 0.38, deco: hearts([0.95, 0.22, 0.13, PINK], [0.05, 0.8, 0.1, PURPLE]) }),
  wordArt({ id: 'y2k-shinyu', text: '心友', group: '平成语', fill: ['#ff9fd2', HOT], rings: [['#fff', 0.24]], size: 0.28, deco: hearts([0.9, 0.18, 0.18, PURPLE], [0.1, 0.86, 0.11, PINK]) }),
  wordArt({ id: 'y2k-isshou', text: '一生\n仲良し', group: '平成语', fill: ['#ff7cc4', PURPLE], rings: [[INK, 0.3], ['#fff', 0.16]], size: 0.32, lh: 1.14 }),
  wordArt({ id: 'y2k-moreta', text: '盛れた', group: '平成语', fill: ['#fff27a', '#ffb13d'], rings: [[HOT, 0.3], ['#fff', 0.16]], size: 0.32, deco: sparkles([0.93, 0.18, 0.22, '#fff'], [0.06, 0.2, 0.14, LEMON], [0.95, 0.85, 0.11, '#fff']) }),
  wordArt({ id: 'y2k-saikyou', text: '最強', font: FONT.bold, group: '平成语', fill: INK, rings: [[HOT, 0.32], ['#fff', 0.16]], size: 0.28, deco: sparkles([0.9, 0.16, 0.2, LEMON]) }),
  wordArt({ id: 'y2k-arigato', text: 'ありがと', group: '平成语', fill: ['#9ae2ff', '#3aa8ff'], rings: [['#fff', 0.24]], size: 0.36, deco: hearts([0.96, 0.3, 0.12, PINK], [0.04, 0.74, 0.1, '#ffb3dc']) }),
  wordArt({ id: 'y2k-zutto', text: 'ずっといっしょ', group: '平成语', fill: ['#ff9fd2', HOT], rings: [['#b0126a', 0.28], ['#fff', 0.15]], size: 0.46 }),
  // --- gyaru words
  wordArt({ id: 'y2k-gal', text: 'ギャル', font: FONT.bold, group: '辣妹', fill: 'leopard', rings: [[INK, 0.3], ['#fff', 0.14]], size: 0.34, deco: sparkles([0.94, 0.16, 0.18, '#fff']) }),
  wordArt({ id: 'y2k-age', text: 'アゲ↑↑', group: '辣妹', fill: ['#ff9fd2', HOT], rings: [[INK, 0.3], [LEMON, 0.15]], size: 0.36 }),
  wordArt({ id: 'y2k-love', text: 'LOVE', group: '辣妹', fill: ['#ff9fd2', HOT], rings: [['#fff', 0.22]], size: 0.34, holo: true, deco: hearts([0.94, 0.2, 0.14, HOT]) }),
  wordArt({ id: 'y2k-bff', text: 'BFF', font: FONT.block, group: '辣妹', fill: 'chrome', rings: [[PURPLE, 0.3], ['#fff', 0.14]], size: 0.3, deco: sparkles([0.92, 0.18, 0.17, '#fff']) }),
  wordArt({ id: 'y2k-y2k', text: 'Y2K', font: FONT.block, group: '辣妹', fill: 'chrome', rings: [[HOT, 0.3], ['#fff', 0.14]], size: 0.3, holo: true }),
  {
    id: 'y2k-lips',
    name: '亮晶晶嘴唇',
    group: '辣妹',
    size: 0.24,
    outline: 0.05,
    svg: svg(160, 92, `
      <path d="M80 30 C70 12 50 6 34 16 C22 24 12 34 4 44 C30 40 56 42 80 48 C104 42 130 40 156 44 C148 34 138 24 126 16 C110 6 90 12 80 30 Z" fill="url(#l)"/>
      <path d="M4 46 C30 44 58 48 80 52 C102 48 130 44 156 46 C146 72 116 88 80 88 C44 88 14 72 4 46 Z" fill="url(#l)"/>
      <path d="M16 46 C46 50 64 54 80 54 C96 54 114 50 144 46" stroke="#a3104f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="98" cy="70" rx="20" ry="6" fill="#fff" opacity=".65" transform="rotate(-8 98 70)"/>
      <ellipse cx="54" cy="26" rx="11" ry="4" fill="#fff" opacity=".5" transform="rotate(-18 54 26)"/>
      <path d="${sparkleD(128, 66, 8)}" fill="#fff"/>`,
    lg('l', ['#ff7cc0', '#e0217a'], [0, 0, 0, 1])),
  },
  {
    id: 'y2k-garake',
    name: '翻盖手机',
    group: '辣妹',
    size: 0.26,
    outline: 0.05,
    svg: svg(150, 230, `
      <path d="M84 18 C104 16 120 24 128 40" stroke="#fff" stroke-width="3" fill="none"/>
      <path d="M124 42 C120 60 114 76 112 92" stroke="#fff" stroke-width="3" fill="none"/>
      <g stroke="#fff" stroke-width="1.5">
        <circle cx="95" cy="17" r="5" fill="${PINK}"/><circle cx="107" cy="20" r="5" fill="${LAV}"/><circle cx="117" cy="26" r="5" fill="${SKY}"/><circle cx="124" cy="35" r="5" fill="#fff"/>
        <circle cx="120" cy="58" r="4.5" fill="${LEMON}"/><circle cx="116" cy="72" r="4.5" fill="${PINK}"/>
      </g>
      <path d="${starD(131, 58, 16, 5, 0.5)}" fill="${LEMON}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
      <path d="${heartD(112, 102, 13)}" fill="${HOT}" stroke="#fff" stroke-width="3"/>
      <rect x="14" y="8" width="74" height="100" rx="16" fill="url(#b)" stroke="#e36aa6" stroke-width="3"/>
      <rect x="23" y="24" width="56" height="64" rx="7" fill="url(#s)" stroke="#fff" stroke-width="3"/>
      <path d="${heartD(51, 58, 15)}" fill="${PINK}"/>
      <path d="${sparkleD(68, 70, 6)}" fill="#fff"/><path d="${sparkleD(34, 48, 4)}" fill="#fff"/>
      <g fill="#7a5ab8"><rect x="28" y="30" width="3" height="4"/><rect x="33" y="28" width="3" height="6"/><rect x="38" y="26" width="3" height="8"/></g>
      <rect x="62" y="28" width="11" height="6" rx="1.5" fill="none" stroke="#7a5ab8" stroke-width="1.6"/>
      <rect x="43" y="13" width="16" height="4" rx="2" fill="#e36aa6"/>
      <rect x="18" y="104" width="66" height="14" rx="7" fill="#eef0f8" stroke="#b9c0d6" stroke-width="2"/>
      <rect x="14" y="114" width="74" height="108" rx="16" fill="url(#b)" stroke="#e36aa6" stroke-width="3"/>
      <circle cx="51" cy="137" r="11" fill="#fff" stroke="#e9a4c9" stroke-width="2"/>
      <circle cx="51" cy="137" r="4" fill="${PINK}"/>
      <g fill="#fff" stroke="#f2b8d6" stroke-width="1">${Array.from({ length: 12 }, (_, i) => `<rect x="${24 + (i % 3) * 19}" y="${157 + Math.floor(i / 3) * 15}" width="16" height="10" rx="5"/>`).join('')}</g>
      <g fill="#fff"><circle cx="24" cy="98" r="2.5"/><circle cx="32" cy="99" r="2.5"/><circle cx="40" cy="99.5" r="2.5"/></g>`,
    lg('b', ['#ffe3f2', '#ffb0da'], [0, 0, 0, 1]) + lg('s', ['#f1e6ff', '#c2ecff'], [0, 0, 0, 1])),
  },
  // --- stamps (FuRyu: sparkles, hearts, stars, animal ears, cat whiskers)
  {
    id: 'y2k-neko-mimi',
    name: '猫耳朵',
    group: '印章',
    size: 0.34,
    outline: 0.05,
    svg: svg(220, 110, `
      <path d="M14 104 C14 70 26 34 44 8 C48 3 54 3 58 8 C74 30 86 60 92 96 Z" fill="${INK}"/>
      <path d="M30 92 C31 70 38 46 47 30 C57 46 67 68 72 90 Z" fill="#ff8cc6"/>
      <path d="M206 104 C206 70 194 34 176 8 C172 3 166 3 162 8 C146 30 134 60 128 96 Z" fill="${INK}"/>
      <path d="M190 92 C189 70 182 46 173 30 C163 46 153 68 148 90 Z" fill="#ff8cc6"/>
      <path d="${sparkleD(110, 40, 14)}" fill="${LEMON}"/><circle cx="110" cy="78" r="4" fill="#fff"/>`),
  },
  {
    id: 'y2k-usa-mimi',
    name: '兔耳朵',
    group: '印章',
    size: 0.26,
    outline: 0.05,
    svg: svg(190, 184, `
      <g transform="translate(15 4)">
        <g transform="rotate(-12 50 170)">
          <path d="M50 172 C30 140 26 80 32 44 C36 20 44 8 54 8 C64 8 72 20 74 44 C78 80 72 140 50 172 Z" fill="#fff" stroke="#f0c2d8" stroke-width="4"/>
          <path d="M51 148 C41 122 39 82 42 54 C44 38 48 28 54 28 C60 28 63 38 64 54 C66 82 62 122 51 148 Z" fill="#ffb3d6"/>
        </g>
        <g transform="rotate(12 110 170)">
          <path d="M110 172 C90 140 86 80 92 44 C96 20 104 8 114 8 C124 8 132 20 134 44 C138 80 132 140 110 172 Z" fill="#fff" stroke="#f0c2d8" stroke-width="4"/>
          <path d="M111 148 C101 122 99 82 102 54 C104 38 108 28 114 28 C120 28 123 38 124 54 C126 82 122 122 111 148 Z" fill="#ffb3d6"/>
        </g>
      </g>`),
  },
  { id: 'y2k-hige', name: '猫咪胡须', group: '印章', size: 0.34, outline: 0.04, svg: WHISKERS },
  { id: 'y2k-bow', name: '蝴蝶结', group: '印章', size: 0.28, outline: 0.05, svg: svg(240, 150, BOW_BODY('#ff9fd2', '#e0438f')) },
  {
    id: 'y2k-crown',
    name: '小皇冠',
    group: '印章',
    size: 0.24,
    outline: 0.05,
    svg: svg(140, 112, `
      <path d="M16 90 L8 30 L42 58 L70 14 L98 58 L132 30 L124 90 Z" fill="url(#g)" stroke="#d98e0e" stroke-width="4" stroke-linejoin="round"/>
      <rect x="12" y="84" width="116" height="20" rx="10" fill="#ffc93d" stroke="#d98e0e" stroke-width="4"/>
      <g fill="#fff" stroke="#e8b04a" stroke-width="2"><circle cx="8" cy="28" r="7"/><circle cx="70" cy="12" r="8"/><circle cx="132" cy="28" r="7"/></g>
      <path d="${heartD(70, 60, 13)}" fill="${PINK}" stroke="#fff" stroke-width="3"/>
      <circle cx="38" cy="72" r="6" fill="${SKY}" stroke="#fff" stroke-width="2"/><circle cx="102" cy="72" r="6" fill="${LAV}" stroke="#fff" stroke-width="2"/>
      <g fill="#fff"><circle cx="34" cy="94" r="3"/><circle cx="52" cy="94" r="3"/><circle cx="70" cy="94" r="3"/><circle cx="88" cy="94" r="3"/><circle cx="106" cy="94" r="3"/></g>
      <path d="M30 44 L38 64" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>`,
    lg('g', ['#fff7c2', '#ffd23f', '#f2a91e'], [0, 0, 0, 1])),
  },
  {
    id: 'y2k-cherry',
    name: '樱桃',
    group: '印章',
    size: 0.24,
    outline: 0.05,
    svg: svg(130, 132, `
      <path d="M44 92 C50 60 62 34 84 16" stroke="#3f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M94 88 C92 60 88 38 84 16" stroke="#3f8a3a" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M84 16 C98 2 120 6 126 20 C110 28 96 26 84 16 Z" fill="#5cc05a"/>
      <circle cx="40" cy="100" r="27" fill="url(#c)"/><circle cx="96" cy="96" r="27" fill="url(#c)"/>
      <ellipse cx="30" cy="88" rx="9" ry="6" fill="#fff" opacity=".75" transform="rotate(-30 30 88)"/>
      <ellipse cx="86" cy="84" rx="9" ry="6" fill="#fff" opacity=".75" transform="rotate(-30 86 84)"/>`,
    lg('c', ['#ff6f9f', '#e0144f'])),
  },
  {
    id: 'y2k-ichigo',
    name: '草莓',
    group: '印章',
    size: 0.22,
    outline: 0.05,
    svg: svg(110, 132, `
      <path d="M55 126 C28 112 8 82 10 58 C12 40 30 32 55 36 C80 32 98 40 100 58 C102 82 82 112 55 126 Z" fill="url(#s)"/>
      <g fill="#fff4b8">${[[34, 56], [55, 50], [76, 56], [26, 76], [46, 72], [66, 72], [84, 76], [36, 94], [56, 92], [74, 94], [46, 110], [64, 110]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="4"/>`)
        .join('')}</g>
      <path d="M55 40 L34 26 L46 36 L40 14 L55 30 L70 14 L64 36 L76 26 Z" fill="#4fbf5a" stroke="#3a9c46" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="30" cy="62" rx="6" ry="12" fill="#fff" opacity=".4" transform="rotate(20 30 62)"/>`,
    lg('s', ['#ff8fb3', '#ff3d6e'], [0, 0, 0, 1])),
  },
  // --- sparkly (holo foil, rhinestones)
  {
    id: 'y2k-holo-heart',
    name: '镭射爱心',
    group: '亮晶晶',
    size: 0.26,
    outline: 0.06,
    holo: true,
    svg: svg(120, 112, `
      <path d="${heartD(60, 60, 52)}" fill="url(#g)"/>
      <path d="${heartD(60, 60, 44)}" fill="none" stroke="#fff" stroke-width="3" opacity=".55"/>
      <path d="M28 44 C30 30 42 22 54 26" stroke="#fff" stroke-width="8" stroke-linecap="round" fill="none" opacity=".85"/>
      <circle cx="82" cy="36" r="5" fill="#fff" opacity=".9"/>
      <path d="${sparkleD(84, 78, 11)}" fill="#fff"/>`, lg('g', HOLO)),
  },
  {
    id: 'y2k-gem-heart',
    name: '水钻爱心',
    group: '亮晶晶',
    size: 0.26,
    outline: 0.05,
    svg: svg(120, 112, `
      <path d="${heartD(60, 60, 50)}" fill="#ff8cc6"/>
      <g clip-path="url(#c)">${(() => {
        let s = '';
        for (let row = 0; row < 11; row++) {
          for (let col = 0; col < 12; col++) {
            const x = 6 + col * 10.5 + (row % 2) * 5.25;
            const y = 12 + row * 9.4;
            s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.6" fill="url(#gem)" stroke="#fff" stroke-width=".8"/>`;
          }
        }
        return s;
      })()}</g>
      <path d="${heartD(60, 60, 50)}" fill="none" stroke="#eef0f8" stroke-width="6"/>
      <path d="${heartD(60, 60, 50)}" fill="none" stroke="#a9b2cc" stroke-width="1.5"/>
      <path d="${sparkleD(34, 34, 12)}" fill="#fff"/><path d="${sparkleD(80, 76, 8)}" fill="#fff"/>`,
    `<clipPath id="c"><path d="${heartD(60, 60, 50)}"/></clipPath>
     <radialGradient id="gem" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="#ffc2e2"/><stop offset="1" stop-color="#ff3d9a"/></radialGradient>`),
  },
  {
    id: 'y2k-holo-star',
    name: '镭射星星',
    group: '亮晶晶',
    size: 0.24,
    outline: 0.06,
    holo: true,
    svg: svg(120, 116, `
      <path d="${starD(60, 62, 52, 5, 0.5)}" fill="url(#g)" stroke="url(#g)" stroke-width="10" stroke-linejoin="round"/>
      <path d="M40 50 Q48 36 60 34" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>
      <circle cx="74" cy="46" r="4" fill="#fff"/>`, lg('g', ['#fff9c4', '#ffe45c', '#ffb3e6', '#c9a8ff'])),
  },
  {
    id: 'y2k-kira',
    name: '闪光キラキラ',
    group: '亮晶晶',
    size: 0.26,
    outline: 0.035,
    outlineColor: '#ffd6ec',
    svg: svg(140, 120, `
      <path d="${sparkleD(56, 62, 50, 0.16)}" fill="#fff" stroke="#ff8cc6" stroke-width="3"/>
      <path d="${sparkleD(56, 62, 22, 0.16)}" fill="#fff6a8"/>
      <path d="${sparkleD(112, 28, 22)}" fill="#ffb3e6" stroke="#fff" stroke-width="3"/>
      <path d="${sparkleD(114, 94, 16)}" fill="#aee6ff" stroke="#fff" stroke-width="3"/>
      <circle cx="22" cy="18" r="5" fill="#fff" stroke="#ff8cc6" stroke-width="2"/><circle cx="100" cy="62" r="4" fill="#fff"/>`),
  },
  {
    id: 'y2k-chouchou',
    name: '镭射蝴蝶',
    group: '亮晶晶',
    size: 0.28,
    outline: 0.05,
    holo: true,
    svg: svg(128, 104, `
      <g transform="translate(4 2)">
        <path d="M60 46 C50 18 22 2 9 12 C-1 21 8 44 30 50 C12 56 7 78 20 88 C34 97 54 80 60 60 Z" fill="url(#w)"/>
        <path d="M60 46 C70 18 98 2 111 12 C121 21 112 44 90 50 C108 56 113 78 100 88 C86 97 66 80 60 60 Z" fill="url(#w)"/>
        <path d="M60 46 C50 26 30 14 18 18 C12 26 20 40 36 46 Z M60 46 C70 26 90 14 102 18 C108 26 100 40 84 46 Z" fill="#fff" opacity=".35"/>
        <g fill="#fff"><circle cx="24" cy="28" r="5"/><circle cx="96" cy="28" r="5"/><circle cx="22" cy="74" r="4"/><circle cx="98" cy="74" r="4"/><circle cx="36" cy="64" r="2.5"/><circle cx="84" cy="64" r="2.5"/></g>
        <rect x="55" y="30" width="10" height="48" rx="5" fill="${PURPLE}"/>
        <path d="M58 32 Q50 16 40 12 M62 32 Q70 16 80 12" stroke="${PURPLE}" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`, lg('w', ['#ff9ad8', '#c9a8ff', '#7fd4ff', '#c9a8ff'])),
  },
  // --- MBTI (FuRyu 2025: #2 doodle trend)
  mbti('ENFP', ['#b4f5d4', '#35c98a', '#1c6b4c']),
  mbti('INFJ', ['#c8f2e6', '#2fb39a', '#155e52']),
  mbti('ESTP', ['#fff0b3', '#ffb13d', '#8a4b00']),
  mbti('ISFJ', ['#cbe8ff', '#4aa8ff', '#1a4f8a']),
];

// ----------------------------------------------------------------- backgrounds
// Purikura green-screen backdrops (piemo: stars, leopard, zebra...). Static
// parts are cached per size; only a few twinkles move with `t`.

function twinkles(ctx, w, h, t, seed, n = 12) {
  const r = rng(seed);
  const u = Math.min(w, h);
  for (let i = 0; i < n; i++) {
    const x = r() * w;
    const y = r() * h;
    const s = u * (0.02 + r() * 0.03);
    const a = 0.5 + 0.5 * Math.sin(t * (1.6 + r()) + i * 1.9);
    ctx.globalAlpha = a;
    sparklePath(ctx, x, y, s * (0.7 + a * 0.4));
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function vgrad(ctx, W, H, stops) {
  ctx.fillStyle = fillGrad(ctx, stops, 0, 0, 0, H);
  ctx.fillRect(0, 0, W, H);
}

export const backgrounds = [
  {
    id: 'y2k-bg-stars',
    name: '星星',
    swatch: 'radial-gradient(circle at 30% 35%, #fff 0 2px, transparent 3px) 0 0 / 14px 14px, radial-gradient(circle at 70% 70%, #fff27a 0 2px, transparent 3px) 0 0 / 18px 18px, linear-gradient(#c9b2ff, #ffc2e2)',
    paint(ctx, w, h, t) {
      ctx.drawImage(cached('bg-stars', w, h, (c, W, H) => {
        vgrad(c, W, H, ['#b9a4ff', '#e7b8ff', '#ffc2e2']);
        starfield(c, W, H, { cell: Math.min(W, H) * 0.17, seed: 21, colors: ['#fff', LEMON, '#ffd1ec', '#fff6c2'] });
      }), 0, 0, w, h);
      twinkles(ctx, w, h, t, 5);
    },
  },
  {
    id: 'y2k-bg-leopard',
    name: '豹纹',
    swatch: 'radial-gradient(ellipse at 40% 45%, #ff6fb5 0 3px, #2a1624 3.5px 5px, transparent 6px) 0 0 / 18px 16px, #ffc0df',
    paint(ctx, w, h) {
      ctx.drawImage(cached('bg-leopard', w, h, (c, W, H) => leopard(c, W, H, { base: '#ffc0df', ring: '#2a1624', core: '#ff9fce', cell: Math.min(W, H) * 0.19, seed: 9 })), 0, 0, w, h);
    },
  },
  {
    id: 'y2k-bg-zebra',
    name: '斑马纹',
    swatch: 'repeating-linear-gradient(55deg, #1d1420 0 5px, #fff5fa 5px 12px)',
    paint(ctx, w, h) {
      ctx.drawImage(cached('bg-zebra', w, h, (c, W, H) => zebra(c, W, H, { base: '#fff5fa', ink: '#1d1420', band: Math.min(W, H) * 0.12, seed: 4, tilt: 0.45 })), 0, 0, w, h);
    },
  },
  {
    id: 'y2k-bg-hearts',
    name: '爱心',
    swatch: 'radial-gradient(circle at 35% 40%, #ff2e8f 0 3px, transparent 4px) 0 0 / 16px 16px, radial-gradient(circle at 70% 75%, #fff 0 3px, transparent 4px) 0 0 / 16px 16px, #ffb8dc',
    paint(ctx, w, h, t) {
      ctx.drawImage(cached('bg-hearts', w, h, (c, W, H) => {
        vgrad(c, W, H, ['#ffb0d8', '#ffd4ea']);
        heartfield(c, W, H, { cell: Math.min(W, H) * 0.2, seed: 13, colors: [HOT, '#fff', '#ff7cc4', PINK, '#ffe3f1'] });
      }), 0, 0, w, h);
      twinkles(ctx, w, h, t, 8, 8);
    },
  },
  {
    id: 'y2k-bg-gingham',
    name: '粉色格纹',
    swatch: 'repeating-linear-gradient(0deg, rgba(255,110,180,.38) 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, rgba(255,110,180,.38) 0 6px, transparent 6px 12px), #fff',
    paint(ctx, w, h) {
      ctx.drawImage(cached('bg-gingham', w, h, (c, W, H) => gingham(c, W, H, { base: '#fff6fa', band: 'rgba(255,110,180,0.34)', size: Math.round(Math.min(W, H) * 0.055) })), 0, 0, w, h);
    },
  },
  {
    id: 'y2k-bg-holo',
    name: '镭射渐变',
    swatch: 'linear-gradient(135deg, #ffc6ec, #e3c8ff, #bfe9ff, #c9ffe9, #fff5c2)',
    paint(ctx, w, h, t) {
      ctx.drawImage(cached('bg-holo', w, h, (c, W, H) => {
        holoFoil(c, W, H, { seed: 3 });
        starfield(c, W, H, { cell: Math.min(W, H) * 0.24, seed: 7, colors: ['rgba(255,255,255,0.9)'], rim: null });
      }), 0, 0, w, h);
      // a slow rainbow sheen sweeping across the foil
      const x = ((t * 0.12) % 1.6 - 0.3) * w;
      const g = ctx.createLinearGradient(x - w * 0.25, 0, x + w * 0.25, h * 0.3);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      twinkles(ctx, w, h, t, 11, 10);
    },
  },
];

// ----------------------------------------------------------------- layouts
// A FuRyu-style sticker sheet: 1 big + 4 medium + a strip of mini seals, all
// 6 shots used (small ones repeat photos via `src`). Extra fields (logo,
// date, spots, cut) tell the frames where the logo and gap stamps go.

const mini6 = (y) =>
  [0, 1, 2, 3, 4].map((src, i) => ({ x: 56 + i * 223, y, w: 196, h: i % 2 ? 202 : 196, shape: i % 2 ? 'heart' : 'circle', src }));

export const layouts = [
  {
    id: 'sheet',
    name: '贴纸大张',
    desc: '1 大 + 4 中 + 迷你贴 · 6 张全用上',
    size: [1200, 1800],
    photos: 6,
    sheet: 'sticker',
    slots: [
      { x: 56, y: 176, w: 664, h: 830, shape: 'round', r: 46, src: 0 },
      { x: 744, y: 172, w: 400, h: 412, shape: 'heart', src: 1 },
      { x: 744, y: 606, w: 400, h: 400, shape: 'circle', src: 2 },
      { x: 56, y: 1036, w: 420, h: 420, shape: 'round', r: 40, src: 3 },
      { x: 500, y: 1036, w: 420, h: 420, shape: 'round', r: 40, src: 4 },
      { x: 944, y: 1036, w: 200, h: 200, shape: 'circle', src: 5 },
      { x: 944, y: 1252, w: 200, h: 204, shape: 'heart', src: 5 },
      ...mini6(1500),
    ],
    footer: { y: 1716, h: 84 },
    logo: { x: 600, y: 90, size: 84 },
    date: { x: 64, y: 1756, size: 38, align: 'left' },
    serial: { x: 1136, y: 1756, size: 30, align: 'right' },
    cut: { y: 1478, label: 'ミニシール' },
    // [x, y, r, kind]: kind indexes the frame's stamp set (0 main, 1 second, 2 light sparkle, 3 accent, 4 extra)
    spots: [
      [118, 92, 46, 0],
      [1082, 92, 46, 1],
      [262, 46, 20, 2],
      [944, 204, 24, 2],
      [772, 548, 32, 3],
      [1118, 552, 30, 0],
      [770, 632, 26, 1],
      [1120, 980, 30, 4],
      [700, 198, 32, 0],
      [600, 1756, 22, 0],
    ],
  },
  {
    ...gridLayout({ id: 'grid6', name: '六宫格', cols: 2, rows: 3, W: 1200, H: 1800, pad: 70, gap: 50, top: 176, bottom: 140, shape: 'round', r: 36 }),
    desc: '2×3 · 6 张全用上',
    logo: { x: 600, y: 92, size: 80 },
    date: { x: 64, y: 1732, size: 38, align: 'left' },
    serial: { x: 1136, y: 1732, size: 30, align: 'right' },
    spots: [
      [116, 92, 44, 0],
      [1084, 92, 44, 1],
      [600, 662, 30, 3],
      [600, 1174, 30, 0],
      [600, 1732, 24, 0],
      [36, 662, 20, 2],
      [1164, 1174, 20, 2],
      [1164, 420, 18, 2],
    ],
  },
  {
    ...stripLayout({ id: 'strip4', name: '竖条四格', n: 4, W: 600, H: 1800, side: 56, top: 140, gap: 40, bottom: 150, aspect: 1.4, shape: 'round', r: 26 }),
    desc: '6 选 4 · 2×6 英寸长条',
    logo: { x: 300, y: 72, size: 52 },
    date: { x: 300, y: 1708, size: 32, align: 'center' },
    serial: { x: 300, y: 1754, size: 24, align: 'center' },
    spots: [
      [52, 72, 26, 0],
      [548, 72, 26, 1],
      [74, 1730, 26, 3],
      [526, 1730, 26, 4],
      [566, 506, 16, 2],
      [34, 1282, 16, 2],
    ],
  },
];

// ----------------------------------------------------------------- frames

const borderFor = (s) => Math.max(9, Math.min(20, Math.min(s.w, s.h) * 0.045));

function inSlot(ctx, s, fn) {
  ctx.save();
  if (s.rot) {
    ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
    ctx.rotate(s.rot);
    ctx.translate(-(s.x + s.w / 2), -(s.y + s.h / 2));
  }
  fn();
  ctx.restore();
}

/** Slot outline grown by `m` px: the die-cut line around each photo. */
function grownPath(ctx, s, m) {
  if (s.shape === 'heart') heartPath(ctx, s.x + s.w / 2, s.y + s.h * 0.52 + m * 0.08, s.w * 0.52 + m * 1.1);
  else slotPath(ctx, { ...s, x: s.x - m, y: s.y - m, w: s.w + m * 2, h: s.h + m * 2, r: (s.r ?? Math.min(s.w, s.h) * 0.08) + m });
}

/** White die-cut borders with a soft lift shadow and a hairline cut. */
function dieCuts(ctx, L, st) {
  for (const s of L.slots) {
    const m = borderFor(s);
    inSlot(ctx, s, () => {
      grownPath(ctx, s, m);
      ctx.save();
      ctx.shadowColor = st.shadow || 'rgba(110,30,90,0.32)';
      ctx.shadowBlur = m * 1.3;
      ctx.shadowOffsetY = m * 0.4;
      ctx.fillStyle = st.die || '#fff';
      ctx.fill();
      ctx.restore();
      ctx.lineWidth = 2;
      ctx.strokeStyle = st.cut || 'rgba(90,40,80,0.25)';
      ctx.stroke();
      if (st.stitch) {
        grownPath(ctx, s, m * 0.5);
        ctx.save();
        ctx.setLineDash([m * 0.7, m * 0.55]);
        ctx.lineWidth = Math.max(2, m * 0.16);
        ctx.strokeStyle = st.stitch;
        ctx.stroke();
        ctx.restore();
      }
    });
  }
}

function logo(ctx, { x, y, size }, st) {
  const fs = size;
  ctx.save();
  ctx.font = `400 ${fs}px ${FONT.pop}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const a = ctx.measureText('PURI').width;
  const b = ctx.measureText('PARA').width;
  const sr = fs * 0.44;
  const gap = fs * 0.06;
  const x0 = x - (a + b + sr * 2 + gap * 2) / 2;
  const sx = x0 + a + gap + sr;
  const x1 = sx + sr + gap;
  const ty = y + fs * 0.04;
  const shapes = () => {
    starPath(ctx, sx, y - fs * 0.02, sr, 5, 0.5, -Math.PI / 2 + 0.2);
  };
  ctx.lineJoin = 'round';
  for (const [color, lw] of [[st.outer, 0.36], [st.stroke, 0.18]]) {
    if (!color) continue;
    ctx.lineWidth = fs * lw;
    ctx.strokeStyle = color;
    ctx.strokeText('PURI', x0, ty);
    ctx.strokeText('PARA', x1, ty);
    shapes();
    ctx.stroke();
  }
  if (st.glow) {
    ctx.shadowColor = st.glow;
    ctx.shadowBlur = fs * 0.4;
  }
  ctx.fillStyle = fillGrad(ctx, st.fill, 0, y - fs * 0.45, 0, y + fs * 0.45);
  ctx.fillText('PURI', x0, ty);
  ctx.fillText('PARA', x1, ty);
  shapes();
  ctx.fillStyle = st.star || LEMON;
  ctx.fill();
  ctx.shadowBlur = 0;
  sparklePath(ctx, sx + sr * 0.35, y - sr * 0.3, sr * 0.3);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.restore();
}

function label(ctx, text, { x, y, size, align = 'center' }, st, font = FONT.pixel) {
  ctx.save();
  ctx.font = `400 ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (st.textBg) {
    const w = ctx.measureText(text).width;
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    rrect(ctx, left - size * 0.45, y - size * 0.72, w + size * 0.9, size * 1.44, size * 0.72);
    ctx.fillStyle = st.textBg;
    ctx.fill();
  }
  ctx.fillStyle = st.text;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Perforation line above the mini seals, with a little tab label. */
function perforation(ctx, L, st) {
  const { y, label: txt } = L.cut;
  ctx.save();
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = st.perf || 'rgba(90,40,80,0.45)';
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(L.W - 40, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `400 26px ${FONT.pop}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(txt).width + 44;
  rrect(ctx, L.W / 2 - w / 2, y - 20, w, 40, 20);
  ctx.fillStyle = st.tabBg || '#fff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = st.tab || PINK;
  ctx.stroke();
  ctx.fillStyle = st.tab || PINK;
  ctx.fillText(txt, L.W / 2, y + 1);
  ctx.restore();
}

/**
 * Frame factory: `paper` paints the sheet, then every slot gets a die-cut
 * sticker border; `over` adds the logo, date, gap stamps and (sticker sheet)
 * the perforation above the mini seals.
 */
function frame({ id, name, paper, style }) {
  return {
    id,
    name,
    paint: {
      under(ctx, L) {
        paper(ctx, L.W, L.H);
        dieCuts(ctx, L, style);
      },
      slot(ctx) {
        ctx.lineWidth = 4;
        ctx.strokeStyle = style.rim;
        ctx.stroke();
      },
      over(ctx, L, info) {
        if (L.cut) perforation(ctx, L, style);
        (L.spots || []).forEach(([x, y, r, k], i) => {
          const [kind, color] = style.stamps[k % style.stamps.length];
          mini(ctx, kind, x, y, r, color, ((i * 37) % 9 - 4) * 0.06);
        });
        if (L.logo) logo(ctx, L.logo, style.logo);
        if (L.date) label(ctx, stamp(info.date || new Date()), L.date, style);
        if (L.serial) label(ctx, `No.${String(info.serial || 0).padStart(4, '0')}`, L.serial, style);
      },
    },
  };
}

export const frames = [
  frame({
    id: 'leopard',
    name: '辣妹豹纹',
    paper(ctx, W, H) {
      leopard(ctx, W, H, { base: '#ffc3e0', ring: '#2a1624', core: '#ffa3d1', cell: W * 0.12, seed: 11 });
    },
    style: {
      rim: HOT,
      cut: 'rgba(42,22,36,0.35)',
      text: INK,
      textBg: 'rgba(255,255,255,0.88)',
      logo: { fill: ['#ffa3d6', HOT], stroke: '#fff', outer: INK, star: LEMON },
      stamps: [['heart', HOT], ['heart', INK], ['sparkle', '#fff'], ['lips', HOT], ['crown', '#ffe45c']],
    },
  }),
  frame({
    id: 'holo',
    name: '镭射糖果',
    paper(ctx, W, H) {
      holoFoil(ctx, W, H, { seed: 8 });
      const r = rng(4);
      const cell = W * 0.075;
      let row = 0;
      for (let y = cell * 0.5; y < H; y += cell * 0.87, row++) {
        for (let x = (row % 2) * cell * 0.5; x < W + cell; x += cell) {
          ctx.beginPath();
          ctx.arc(x, y, cell * 0.16, 0, TAU);
          ctx.fillStyle = ['rgba(255,255,255,0.75)', 'rgba(255,150,210,0.45)', 'rgba(160,210,255,0.5)'][Math.floor(r() * 3)];
          ctx.fill();
        }
      }
    },
    style: {
      rim: '#b98aff',
      cut: 'rgba(120,80,160,0.3)',
      text: '#6a3fc0',
      textBg: 'rgba(255,255,255,0.8)',
      tab: '#a06bff',
      perf: 'rgba(120,80,160,0.5)',
      logo: { fill: ['#ff8ccc', '#b98aff', '#6fcfff'], stroke: '#fff', outer: '#7a4fd0', star: LEMON },
      stamps: [['heart', '#ff8ccc'], ['star', LEMON], ['sparkle', '#fff'], ['candy', '#b98aff'], ['candy', '#ff8ccc']],
    },
  }),
  frame({
    id: 'gingham',
    name: '平成少女',
    paper(ctx, W, H) {
      gingham(ctx, W, H, { base: '#fff6fa', band: 'rgba(255,122,182,0.3)', size: W * 0.03 });
      // lace scallops along the edges
      const r = W * 0.022;
      ctx.fillStyle = '#fff';
      for (let x = r; x < W; x += r * 2) {
        for (const y of [0, H]) {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.3, 0, TAU);
          ctx.fill();
        }
      }
      for (let y = r; y < H; y += r * 2) {
        for (const x of [0, W]) {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.3, 0, TAU);
          ctx.fill();
        }
      }
      ctx.fillStyle = 'rgba(255,122,182,0.45)';
      for (let x = r; x < W; x += r * 2) {
        for (const y of [r * 0.45, H - r * 0.45]) {
          ctx.beginPath();
          ctx.arc(x, y, r * 0.22, 0, TAU);
          ctx.fill();
        }
      }
    },
    style: {
      rim: '#ff8cc6',
      cut: 'rgba(200,70,130,0.3)',
      stitch: 'rgba(255,110,176,0.8)',
      text: '#e0438f',
      textBg: 'rgba(255,255,255,0.9)',
      logo: { fill: ['#ffa3d6', PINK], stroke: '#fff', outer: '#e0438f', star: LEMON },
      stamps: [['heart', '#ff4f7b'], ['bow', '#ff7cc0'], ['sparkle', '#fff'], ['strawberry', '#ff5f8a'], ['cherry', '#ff3d6e']],
    },
  }),
  frame({
    id: 'noir',
    name: '黑粉辣妹',
    paper(ctx, W, H) {
      zebra(ctx, W, H, { base: '#150f17', ink: 'rgba(255,46,143,0.5)', band: W * 0.075, seed: 17, tilt: 0.5 });
      const r = rng(19);
      for (let i = 0; i < 90; i++) {
        const s = W * (0.004 + r() * 0.01);
        sparklePath(ctx, r() * W, r() * H, s * 1.6);
        ctx.fillStyle = r() < 0.7 ? 'rgba(255,255,255,0.85)' : 'rgba(255,160,210,0.9)';
        ctx.fill();
      }
    },
    style: {
      rim: HOT,
      cut: 'rgba(255,255,255,0.5)',
      shadow: 'rgba(255,46,143,0.45)',
      text: '#ffb3dc',
      textBg: 'rgba(21,15,23,0.92)',
      tab: HOT,
      tabBg: '#150f17',
      perf: 'rgba(255,140,200,0.7)',
      logo: { fill: ['#ffffff', '#ffd6ec'], stroke: HOT, outer: '#150f17', glow: HOT, star: '#ff8ccc' },
      stamps: [['heart', HOT], ['crown', '#e6eaf5'], ['sparkle', '#fff'], ['lips', HOT], ['star', '#e6eaf5']],
    },
  }),
  frame({
    id: 'butterfly',
    name: '蝴蝶星星',
    paper(ctx, W, H) {
      vgrad(ctx, W, H, ['#c4eaff', '#e4d6ff', '#ffd9ef']);
      starfield(ctx, W, H, { cell: W * 0.11, seed: 31, colors: ['#fff', LEMON, '#fff'], rim: null });
      butterflyfield(ctx, W, H, { cell: W * 0.2, seed: 12 });
    },
    style: {
      rim: '#7cc8ff',
      cut: 'rgba(80,90,170,0.3)',
      text: '#5b4fc0',
      textBg: 'rgba(255,255,255,0.85)',
      tab: '#7a6bff',
      perf: 'rgba(90,80,190,0.45)',
      logo: { fill: ['#8fd8ff', '#a98bff'], stroke: '#fff', outer: '#5b4fc0', star: LEMON },
      stamps: [['butterfly', '#ffb3e6'], ['star', LEMON], ['sparkle', '#fff'], ['butterfly', LAV], ['heart', '#ff8cc6']],
    },
  }),
];
