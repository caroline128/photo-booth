// Dev-only frame source: a plain human-proportioned mannequin head, used by
// the gallery page to check where AR props land on a real-ish face.

import { canvas as mkCanvas, TAU } from '../core/util.js';

export function createMannequinSource({ tilt = 0.08 } = {}) {
  const W = 1280;
  const H = 960;
  const c = mkCanvas(W, H);
  const ctx = c.getContext('2d');
  const d = 150; // eye distance in px
  const cx = W / 2;
  const ey = H * 0.46; // eye line
  ctx.fillStyle = '#dfe6ea';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(cx, ey);
  ctx.rotate(tilt);
  // shoulders + neck
  ctx.fillStyle = '#6c7a89';
  ctx.beginPath();
  ctx.ellipse(0, d * 3.6, d * 2.6, d * 1.3, 0, Math.PI, TAU);
  ctx.lineTo(d * 2.6, H);
  ctx.lineTo(-d * 2.6, H);
  ctx.fill();
  ctx.fillStyle = '#e8b896';
  ctx.fillRect(-d * 0.55, d * 1.3, d * 1.1, d * 1.4);
  // head: top of skull ≈ 1.8 d above the eyes, chin ≈ 1.75 d below
  ctx.beginPath();
  ctx.ellipse(0, -0.05 * d, d * 1.2, d * 1.8, 0, 0, TAU);
  ctx.fill();
  // ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(s * d * 1.18, d * 0.15, d * 0.18, d * 0.34, 0, 0, TAU);
    ctx.fill();
  }
  // hair
  ctx.fillStyle = '#3b2a22';
  ctx.beginPath();
  ctx.ellipse(0, -d * 0.95, d * 1.28, d * 0.95, 0, Math.PI * 1.02, Math.PI * 1.98);
  ctx.quadraticCurveTo(d * 0.6, -d * 1.2, 0, -d * 1.05);
  ctx.quadraticCurveTo(-d * 0.7, -d * 1.2, -d * 1.27, -d * 0.8);
  ctx.fill();
  // eyes
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse((s * d) / 2, 0, d * 0.19, d * 0.1, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#2d1f1a';
    ctx.beginPath();
    ctx.arc((s * d) / 2, 0, d * 0.08, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3b2a22';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo((s * d) / 2 - d * 0.22, -d * 0.28);
    ctx.lineTo((s * d) / 2 + d * 0.22, -d * 0.3);
    ctx.stroke();
  }
  // nose + mouth
  ctx.strokeStyle = '#b77f63';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(0, d * 0.15);
  ctx.lineTo(-d * 0.1, d * 0.62);
  ctx.lineTo(d * 0.08, d * 0.66);
  ctx.stroke();
  ctx.strokeStyle = '#b3525a';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, d * 0.82, d * 0.32, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();

  const rot = (x, y) => ({
    x: (cx + x * Math.cos(tilt) - y * Math.sin(tilt)) / W,
    y: (ey + x * Math.sin(tilt) + y * Math.cos(tilt)) / H,
  });
  const faces = [
    {
      id: 'mannequin',
      eyeL: rot(-d / 2, 0),
      eyeR: rot(d / 2, 0),
      nose: rot(0, d * 0.62),
      mouth: rot(0, d * 1.08),
      earL: rot(-d * 1.18, d * 0.15),
      earR: rot(d * 1.18, d * 0.15),
      score: 1,
    },
  ];
  return { kind: 'demo', el: c, width: W, height: H, ready: () => true, getFaces: () => faces, stop() {} };
}
