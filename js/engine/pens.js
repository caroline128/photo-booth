// Doodle pens for the decorate (落書き) step. Strokes are stored as points in
// print pixels so they can be replayed crisply at print resolution.
//
// stroke = { pen: 'neon', color: '#ff4fa3', width: 14, seed: 123, points: [[x,y],...] }

import { seeded, TAU } from '../core/util.js';
import { heartPath } from './compose.js';

function path(ctx, pts, k) {
  ctx.beginPath();
  if (pts.length === 1) {
    ctx.moveTo(pts[0][0] * k, pts[0][1] * k);
    ctx.lineTo(pts[0][0] * k + 0.01, pts[0][1] * k);
    return;
  }
  ctx.moveTo(pts[0][0] * k, pts[0][1] * k);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i][0] + pts[i + 1][0]) / 2) * k;
    const my = ((pts[i][1] + pts[i + 1][1]) / 2) * k;
    ctx.quadraticCurveTo(pts[i][0] * k, pts[i][1] * k, mx, my);
  }
  const last = pts[pts.length - 1];
  ctx.lineTo(last[0] * k, last[1] * k);
}

/** Resample points at a fixed spacing (for stamp brushes). */
function along(pts, spacing) {
  const out = [];
  if (!pts.length) return out;
  out.push(pts[0]);
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const seg = Math.hypot(x1 - x0, y1 - y0);
    let d = spacing - carry;
    while (d <= seg) {
      const t = d / seg;
      out.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, Math.atan2(y1 - y0, x1 - x0)]);
      d += spacing;
    }
    carry = seg - (d - spacing);
  }
  return out;
}

function starPath(ctx, x, y, r, spikes = 5, inner = 0.45, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i * Math.PI) / spikes;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

function sparkle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

const GLITTER = ['#ffffff', '#fff3a8', '#ffc2e6', '#bdf3ff', '#e4c9ff'];

export const PENS = {
  solid: { name: '圆头笔', draw(ctx, s, k) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * k;
    path(ctx, s.points, k);
    ctx.stroke();
  } },
  neon: { name: '霓虹笔', draw(ctx, s, k) {
    ctx.shadowColor = s.color;
    ctx.shadowBlur = s.width * 1.6 * k;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * k;
    path(ctx, s.points, k);
    ctx.stroke();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = s.width * 0.38 * k;
    ctx.stroke();
  } },
  double: { name: '描边笔', draw(ctx, s, k) {
    ctx.strokeStyle = s.outline || '#ffffff';
    ctx.lineWidth = s.width * 1.9 * k;
    path(ctx, s.points, k);
    ctx.stroke();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * k;
    ctx.stroke();
  } },
  glitter: { name: '亮片笔', draw(ctx, s, k) {
    const rnd = seeded(s.seed);
    ctx.strokeStyle = s.color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = s.width * 0.7 * k;
    path(ctx, s.points, k);
    ctx.stroke();
    ctx.globalAlpha = 1;
    for (const [x, y] of along(s.points, Math.max(3, s.width * 0.35))) {
      for (let j = 0; j < 2; j++) {
        const a = rnd() * TAU;
        const rr = rnd() * s.width * 0.75;
        ctx.fillStyle = rnd() < 0.5 ? GLITTER[Math.floor(rnd() * GLITTER.length)] : s.color;
        const px = (x + Math.cos(a) * rr) * k;
        const py = (y + Math.sin(a) * rr) * k;
        if (rnd() < 0.18) sparkle(ctx, px, py, (s.width * 0.45 + rnd() * s.width * 0.3) * k);
        else {
          ctx.beginPath();
          ctx.arc(px, py, (0.8 + rnd() * s.width * 0.14) * k, 0, TAU);
          ctx.fill();
        }
      }
    }
  } },
  hearts: { name: '爱心印章', draw(ctx, s, k) {
    const rnd = seeded(s.seed);
    for (const [x, y] of along(s.points, s.width * 2.2)) {
      const r = s.width * (0.75 + rnd() * 0.35) * k;
      ctx.save();
      ctx.translate(x * k, y * k);
      ctx.rotate((rnd() - 0.5) * 0.6);
      heartPath(ctx, 0, 0, r);
      ctx.fillStyle = '#fff';
      ctx.lineWidth = r * 0.35;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.restore();
    }
  } },
  stars: { name: '星星印章', draw(ctx, s, k) {
    const rnd = seeded(s.seed);
    for (const [x, y] of along(s.points, s.width * 2)) {
      const r = s.width * (0.7 + rnd() * 0.5) * k;
      starPath(ctx, x * k, y * k, r, 5, 0.45, -Math.PI / 2 + (rnd() - 0.5));
      ctx.fillStyle = s.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = r * 0.3;
      ctx.stroke();
      ctx.fill();
    }
  } },
  dots: { name: '波点笔', draw(ctx, s, k) {
    ctx.fillStyle = s.color;
    for (const [x, y] of along(s.points, s.width * 1.6)) {
      ctx.beginPath();
      ctx.arc(x * k, y * k, s.width * 0.5 * k, 0, TAU);
      ctx.fill();
    }
  } },
  spray: { name: '喷漆', draw(ctx, s, k) {
    const rnd = seeded(s.seed);
    ctx.fillStyle = s.color;
    for (const [x, y] of along(s.points, Math.max(2, s.width * 0.18))) {
      for (let j = 0; j < 7; j++) {
        const a = rnd() * TAU;
        const rr = Math.pow(rnd(), 1.6) * s.width * 1.1;
        ctx.globalAlpha = 0.25 + rnd() * 0.5;
        ctx.beginPath();
        ctx.arc((x + Math.cos(a) * rr) * k, (y + Math.sin(a) * rr) * k, (0.6 + rnd() * 1.4) * k * (s.width / 12), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width * 0.55 * k;
    path(ctx, s.points, k);
    ctx.stroke();
  } },
  chalk: { name: '粉笔', draw(ctx, s, k) {
    const rnd = seeded(s.seed);
    ctx.strokeStyle = s.color;
    for (let pass = 0; pass < 3; pass++) {
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = s.width * (0.45 + pass * 0.2) * k;
      ctx.beginPath();
      s.points.forEach(([x, y], i) => {
        const jx = (rnd() - 0.5) * s.width * 0.35;
        const jy = (rnd() - 0.5) * s.width * 0.35;
        if (i === 0) ctx.moveTo((x + jx) * k, (y + jy) * k);
        else ctx.lineTo((x + jx) * k, (y + jy) * k);
      });
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } },
  rainbow: { name: '彩虹笔', draw(ctx, s, k) {
    const pts = s.points;
    ctx.lineWidth = s.width * k;
    let hue = (s.seed % 360);
    let dist = 0;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      dist += Math.hypot(x1 - x0, y1 - y0);
      ctx.strokeStyle = `hsl(${(hue + dist * 0.6) % 360} 95% 62%)`;
      ctx.beginPath();
      ctx.moveTo(x0 * k, y0 * k);
      ctx.lineTo(x1 * k, y1 * k);
      ctx.stroke();
    }
    if (pts.length === 1) PENS.solid.draw(ctx, { ...s, color: `hsl(${hue} 95% 62%)` }, k);
  } },
  eraser: { name: '橡皮', draw(ctx, s, k) {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = s.width * 1.6 * k;
    path(ctx, s.points, k);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  } },
};

export function drawStroke(ctx, s, k = 1) {
  const pen = PENS[s.pen] || PENS.solid;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pen.draw(ctx, s, k);
  ctx.restore();
}
