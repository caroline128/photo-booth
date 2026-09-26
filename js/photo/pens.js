// Doodle pens. A stroke is { pen, color, size, pts: [[x, y], ...] } in sheet
// pixels and is always re-drawable, so prints are rendered at full size.

import { TAU, rng } from '../core/util.js';
import { C } from '../art/palette.js';
import { sparkPath } from '../art/spark.js';

export const PENS = [
  { id: 'ink', name: '墨水笔', size: 8 },
  { id: 'marker', name: '马克笔', size: 18 },
  { id: 'highlight', name: '荧光笔', size: 42 },
  { id: 'outline', name: '描边笔', size: 13 },
  { id: 'spark', name: '星芒笔', size: 32 },
  { id: 'dots', name: '点点笔', size: 15 },
  { id: 'dash', name: '虚线笔', size: 8 },
  { id: 'gradient', name: '渐变笔', size: 16 },
  { id: 'eraser', name: '橡皮', size: 44 },
];

export const penById = (id) => PENS.find((p) => p.id === id) || PENS[0];

const GRADIENT = [C.orange, C.kraft, C.green, C.blue, C.orange];

function path(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  if (pts.length === 1) {
    ctx.lineTo(pts[0][0] + 0.01, pts[0][1]);
    return;
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0], last[1]);
}

// Call fn(x, y, angle, n) every `step` px along the polyline.
function walk(pts, step, fn) {
  if (pts.length === 1) return fn(pts[0][0], pts[0][1], 0, 0);
  let n = 0, carry = 0;
  fn(pts[0][0], pts[0][1], 0, n++);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    if (!seg) continue;
    const a = Math.atan2(y1 - y0, x1 - x0);
    let d = step - carry;
    while (d <= seg) {
      fn(x0 + ((x1 - x0) * d) / seg, y0 + ((y1 - y0) * d) / seg, a, n++);
      d += step;
    }
    carry = seg - (d - step);
  }
}

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round((((pa >> s) & 255) * (1 - t)) + (((pb >> s) & 255) * t));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export function drawStroke(ctx, st) {
  const { pen, color, size, pts } = st;
  if (!pts?.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ctx.fillStyle = color;
  ctx.lineWidth = size;
  switch (pen) {
    case 'highlight':
      ctx.globalAlpha = 0.38;
      path(ctx, pts);
      ctx.stroke();
      break;
    case 'outline':
      ctx.strokeStyle = color === C.paper || color === '#ffffff' ? C.ink : '#ffffff';
      ctx.lineWidth = size * 2.3;
      path(ctx, pts);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.stroke();
      break;
    case 'dash':
      ctx.setLineDash([size * 2.2, size * 1.9]);
      path(ctx, pts);
      ctx.stroke();
      break;
    case 'gradient': {
      let total = 0;
      for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      let run = 0;
      const span = Math.max(600, total);
      if (pts.length === 1) {
        path(ctx, pts);
        ctx.strokeStyle = GRADIENT[0];
        ctx.stroke();
        break;
      }
      for (let i = 1; i < pts.length; i++) {
        const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        const t = ((run + seg / 2) / span) * (GRADIENT.length - 1);
        const k = Math.min(GRADIENT.length - 2, Math.floor(t));
        ctx.strokeStyle = mixHex(GRADIENT[k], GRADIENT[k + 1], t - k);
        ctx.beginPath();
        ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
        ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
        run += seg;
      }
      break;
    }
    case 'spark': {
      const r = rng(Math.round(pts[0][0] * 7 + pts[0][1] * 13));
      walk(pts, size * 1.15, (x, y, a, n) => {
        const s = size * 0.5 * (0.65 + r() * 0.55);
        ctx.fillStyle = n % 4 === 3 ? '#f4c46b' : color;
        ctx.fill(sparkPath(x, y, s, { seed: 3 + (n % 5), rot: r() * TAU }));
      });
      break;
    }
    case 'dots':
      walk(pts, size * 2.1, (x, y) => {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, TAU);
        ctx.fill();
      });
      break;
    case 'eraser':
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = '#000';
      path(ctx, pts);
      ctx.stroke();
      break;
    default:
      path(ctx, pts);
      ctx.stroke();
  }
  ctx.restore();
}

// Tiny preview of a pen for the tool palette.
export function penPreview(ctx, pen, color, w, h) {
  const pts = [];
  for (let i = 0; i <= 24; i++) pts.push([w * 0.12 + (w * 0.76 * i) / 24, h * 0.5 + Math.sin((i / 24) * Math.PI * 2) * h * 0.2]);
  const size = Math.max(2, Math.min(h * 0.32, penById(pen).size * (h / 90)));
  if (pen === 'eraser') {
    ctx.fillStyle = C.light;
    ctx.fillRect(0, 0, w, h);
  }
  drawStroke(ctx, { pen, color, size, pts });
}
