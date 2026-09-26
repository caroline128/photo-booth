// 小芒 (Xiao Mang): the booth's spark-shaped plush mascot. It stands in as
// the model when there is no camera (demo mode) and appears on stickers.

import { TAU, lerp, clamp, rng, canvas, ease } from '../core/util.js';
import { C } from './palette.js';
import { sparkPath } from './spark.js';
import { heartPath, sparklePath, noiseTile } from './ink.js';

const EYE = '#2a1b15';
const HAND = '#fbe6d6';
const HAND_EDGE = '#e7b597';

// Floating mitten hands, in body-radius units relative to the body centre.
export const POSES = {
  idle: { hands: [[-1.14, 0.56], [1.14, 0.56]], eyes: 'open', mouth: 'smile' },
  wave: { hands: [[-1.14, 0.56], [1.2, -0.42]], eyes: 'open', mouth: 'open', wave: 1 },
  peace: { hands: [[-1.14, 0.56], [0.98, -0.18]], eyes: 'wink', mouth: 'smile', peace: 1, tilt: -0.08 },
  heart: { hands: [[-0.42, 0.74], [0.42, 0.74]], eyes: 'happy', mouth: 'cat', heart: 1 },
  think: { hands: [[-0.62, 0.86], [0.34, 0.66]], eyes: 'up', mouth: 'o', tilt: 0.12, bubble: 1 },
  wink: { hands: [[-1.14, 0.5], [1.14, 0.5]], eyes: 'wink', mouth: 'tongue', tilt: 0.06 },
  surprise: { hands: [[-1.3, 0.02], [1.3, 0.02]], eyes: 'big', mouth: 'O', open: 1 },
  laugh: { hands: [[-0.58, 0.82], [0.58, 0.82]], eyes: 'happy', mouth: 'open', bounce: 1 },
  cool: { hands: [[-1.14, 0.56], [0.74, -0.1]], eyes: 'shades', mouth: 'smirk', tilt: -0.05 },
  shy: { hands: [[-0.66, 0.32], [0.66, 0.32]], eyes: 'side', mouth: 'wavy', blush: 1.5, tilt: -0.1 },
  cheer: { hands: [[-1.16, -0.98], [1.16, -0.98]], eyes: 'happy', mouth: 'open', bounce: 1, open: 1 },
  spark: { hands: [[-1.58, -0.22], [1.58, -0.22]], eyes: 'star', mouth: 'open', sparkles: 1, open: 1 },
};

export const POSE_IDS = Object.keys(POSES).filter((p) => p !== 'idle');

function capsule(ctx, x1, y1, x2, y2, r) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.moveTo(x1 + Math.cos(a + Math.PI / 2) * r, y1 + Math.sin(a + Math.PI / 2) * r);
  ctx.arc(x2, y2, r, a + Math.PI / 2, a - Math.PI / 2, true);
  ctx.arc(x1, y1, r, a - Math.PI / 2, a + Math.PI / 2, true);
  ctx.closePath();
}

function eye(ctx, x, y, s, kind, side) {
  ctx.save();
  ctx.fillStyle = EYE;
  ctx.strokeStyle = EYE;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.05;
  const rx = s * 0.1, ry = s * 0.135;
  const arc = (up) => {
    ctx.beginPath();
    if (up) ctx.arc(x, y + ry * 0.45, rx * 1.1, Math.PI * 1.15, Math.PI * 1.85);
    else ctx.arc(x, y - ry * 0.5, rx * 1.05, Math.PI * 0.18, Math.PI * 0.82);
    ctx.stroke();
  };
  const oval = (ox = 0, oy = 0, k = 1, star = false) => {
    ctx.beginPath();
    ctx.ellipse(x + ox, y + oy, rx * k, ry * k, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    if (star) {
      ctx.beginPath();
      sparklePath(ctx, x + ox - rx * 0.12, y + oy - ry * 0.22, rx * 0.66 * k, 0.2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(x + ox - rx * 0.3, y + oy - ry * 0.36, rx * 0.38 * k, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + ox + rx * 0.32, y + oy + ry * 0.34, rx * 0.17 * k, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = EYE;
  };
  switch (kind) {
    case 'closed':
      arc(false);
      break;
    case 'happy':
      arc(true);
      break;
    case 'wink':
      if (side > 0) {
        ctx.beginPath();
        ctx.moveTo(x + rx * 0.95, y - ry * 0.5);
        ctx.lineTo(x - rx * 0.65, y + ry * 0.02);
        ctx.lineTo(x + rx * 0.95, y + ry * 0.54);
        ctx.stroke();
      } else oval();
      break;
    case 'big':
      oval(0, 0, 1.25);
      break;
    case 'star':
      oval(0, 0, 1.12, true);
      break;
    case 'up':
      oval(rx * 0.14, -ry * 0.14);
      break;
    case 'side':
      oval(-rx * 0.28, ry * 0.08, 0.95);
      break;
    default:
      oval();
  }
  ctx.restore();
}

function mouth(ctx, s, kind) {
  const y = s * 0.34;
  ctx.save();
  ctx.strokeStyle = EYE;
  ctx.fillStyle = EYE;
  ctx.lineWidth = s * 0.045;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  switch (kind) {
    case 'cat': {
      const w = s * 0.075;
      ctx.moveTo(-w * 2, y - w * 0.3);
      ctx.quadraticCurveTo(-w, y + w * 1.4, 0, y);
      ctx.quadraticCurveTo(w, y + w * 1.4, w * 2, y - w * 0.3);
      ctx.stroke();
      break;
    }
    case 'open': {
      const w = s * 0.14, hh = s * 0.15;
      ctx.moveTo(-w, y - hh * 0.2);
      ctx.quadraticCurveTo(0, y - hh * 0.4, w, y - hh * 0.2);
      ctx.quadraticCurveTo(w * 0.9, y + hh * 1.1, 0, y + hh * 1.05);
      ctx.quadraticCurveTo(-w * 0.9, y + hh * 1.1, -w, y - hh * 0.2);
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#ea7a6e';
      ctx.beginPath();
      ctx.ellipse(0, y + hh * 1.05, w * 0.62, hh * 0.58, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      break;
    }
    case 'tongue': {
      const w = s * 0.13, hh = s * 0.1;
      ctx.moveTo(-w, y - hh * 0.1);
      ctx.quadraticCurveTo(0, y + hh * 1.2, w, y - hh * 0.1);
      ctx.stroke();
      ctx.fillStyle = '#ea7a6e';
      ctx.beginPath();
      ctx.ellipse(w * 0.22, y + hh * 0.55, w * 0.36, hh * 0.85, -0.15, 0, Math.PI);
      ctx.fill();
      break;
    }
    case 'O':
      ctx.ellipse(0, y + s * 0.04, s * 0.075, s * 0.1, 0, 0, TAU);
      ctx.fill();
      break;
    case 'o':
      ctx.ellipse(s * 0.03, y + s * 0.02, s * 0.048, s * 0.043, 0, 0, TAU);
      ctx.fill();
      break;
    case 'smirk':
      ctx.moveTo(-s * 0.1, y + s * 0.03);
      ctx.quadraticCurveTo(s * 0.02, y + s * 0.08, s * 0.13, y - s * 0.03);
      ctx.stroke();
      break;
    case 'wavy': {
      const w = s * 0.16;
      ctx.moveTo(-w, y);
      for (let i = 1; i <= 4; i++) ctx.quadraticCurveTo(-w + (i - 0.5) * (w / 2), y + (i % 2 ? -1 : 1) * s * 0.045, -w + i * (w / 2), y);
      ctx.stroke();
      break;
    }
    default: {
      const w = s * 0.12;
      ctx.moveTo(-w, y - s * 0.01);
      ctx.quadraticCurveTo(0, y + s * 0.12, w, y - s * 0.01);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function shades(ctx, s) {
  ctx.save();
  const y = s * 0.02;
  const g = ctx.createLinearGradient(0, y - s * 0.15, 0, y + s * 0.16);
  g.addColorStop(0, '#3a3836');
  g.addColorStop(1, '#0d0d0c');
  ctx.fillStyle = g;
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * s * 0.31, y, s * 0.21, s * 0.155, sx * -0.08, 0, TAU);
    ctx.fill();
  }
  ctx.fillRect(-s * 0.14, y - s * 0.07, s * 0.28, s * 0.055);
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = s * 0.028;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * s * 0.31 - s * 0.11, y - s * 0.04);
    ctx.lineTo(sx * s * 0.31 - s * 0.04, y - s * 0.1);
    ctx.stroke();
  }
  ctx.restore();
}

// A floating mitten; `peace` adds two fingers, `open` spreads a thumb.
function hand(ctx, x, y, r, { ink, rot = 0, peace = false, open = false }) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const edge = ink ? C.ink : HAND_EDGE;
  const lw = ink ? r * 0.28 : r * 0.12;
  const blob = () => {
    ctx.beginPath();
    if (peace) {
      capsule(ctx, -r * 0.2, -r * 0.2, -r * 0.5, -r * 1.55, r * 0.3);
      capsule(ctx, r * 0.22, -r * 0.2, r * 0.48, -r * 1.5, r * 0.3);
    }
    ctx.ellipse(0, 0, r * (open ? 1.08 : 1), r * (open ? 0.98 : 0.9), 0, 0, TAU);
  };
  blob();
  ctx.lineWidth = lw * 2;
  ctx.strokeStyle = edge;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = HAND;
  blob();
  ctx.fill();
  if (open) {
    ctx.strokeStyle = edge;
    ctx.lineWidth = lw * 0.9;
    ctx.lineCap = 'round';
    for (const fx of [-0.3, 0.05, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(r * fx, -r * 0.95);
      ctx.lineTo(r * fx * 0.9, -r * 0.45);
      ctx.stroke();
    }
  }
  if (!ink) {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0, 0, 0, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(1, 'rgba(230,170,140,0.25)');
    ctx.fillStyle = g;
    blob();
    ctx.fill();
  }
  ctx.restore();
}

const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

// Draw the mascot centred at (x, y) with body radius s.
// o: { pose, from (previous pose), k (0..1 blend), t (seconds), blink, style: 'plush'|'ink' }
export function drawMascot(ctx, x, y, s, o = {}) {
  const P = POSES[o.pose] || POSES.idle;
  const F = POSES[o.from] || P;
  const k = o.k == null ? 1 : ease.outBack(clamp(o.k, 0, 1), 1.4);
  const t = o.t || 0;
  const ink = o.style === 'ink';
  const bounce = P.bounce ? Math.abs(Math.sin(t * 7)) * s * 0.08 : Math.sin(t * 2.2) * s * 0.03;
  const tilt = lerp(F.tilt || 0, P.tilt || 0, k) + Math.sin(t * 1.3) * 0.025;
  const mane = { seed: 8, n: 11, t, breathe: 0.03, rot: 0.08 };
  const R = s * 1.6;

  ctx.save();
  ctx.translate(x, y - bounce);
  ctx.rotate(tilt);

  // mane (the spark) + face
  if (ink) {
    ctx.fillStyle = C.ink;
    ctx.fill(sparkPath(0, 0, R, { ...mane, grow: s * 0.075 }));
    ctx.beginPath();
    ctx.arc(0, 0, s * 1.075, 0, TAU);
    ctx.fill();
    ctx.fillStyle = C.orange;
  } else {
    const mg = ctx.createLinearGradient(0, -R, 0, R);
    mg.addColorStop(0, '#e08361');
    mg.addColorStop(1, '#c3603e');
    ctx.fillStyle = mg;
  }
  ctx.fill(sparkPath(0, 0, R, mane));
  if (ink) ctx.fillStyle = '#ec9a78';
  else {
    const body = ctx.createRadialGradient(-s * 0.35, -s * 0.45, s * 0.05, 0, 0, s * 1.02);
    body.addColorStop(0, '#f6b08f');
    body.addColorStop(0.6, '#e8906b');
    body.addColorStop(1, '#d97757');
    ctx.fillStyle = body;
  }
  ctx.beginPath();
  ctx.arc(0, 0, s, 0, TAU);
  ctx.fill();

  // cheeks
  const blush = P.blush || 1;
  ctx.fillStyle = 'rgba(236,120,110,0.45)';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * s * 0.56, s * 0.25, s * 0.13 * blush, s * 0.085 * Math.sqrt(blush), 0, 0, TAU);
    ctx.fill();
  }
  if (P.blush) {
    ctx.strokeStyle = 'rgba(190,70,55,0.55)';
    ctx.lineWidth = s * 0.02;
    ctx.lineCap = 'round';
    for (const sx of [-1, 1])
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(sx * s * (0.47 + i * 0.075), s * 0.2);
        ctx.lineTo(sx * s * (0.43 + i * 0.075), s * 0.3);
        ctx.stroke();
      }
  }

  // eyes + mouth
  let eyes = P.eyes;
  if (o.blink && ['open', 'up', 'side', 'big', 'star'].includes(eyes)) eyes = 'closed';
  if (eyes === 'shades') shades(ctx, s);
  else {
    eye(ctx, -s * 0.3, s * 0.05, s, eyes === 'wink' ? 'open' : eyes, -1);
    eye(ctx, s * 0.3, s * 0.05, s, eyes, 1);
  }
  mouth(ctx, s, P.mouth);

  // props held in front
  if (P.heart) {
    const hs = s * 0.36 * (1 + Math.sin(t * 6) * 0.05);
    ctx.beginPath();
    heartPath(ctx, 0, s * 0.66, hs);
    ctx.lineWidth = ink ? s * 0.06 : s * 0.02;
    ctx.strokeStyle = ink ? C.ink : '#b93c34';
    ctx.stroke();
    ctx.fillStyle = '#e0524a';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-hs * 0.45, s * 0.66 - hs * 0.28, hs * 0.16, hs * 0.1, -0.6, 0, TAU);
    ctx.fill();
  }

  // hands
  [0, 1].forEach((i) => {
    let [hx, hy] = mix(F.hands[i], P.hands[i], k).map((v) => v * s);
    let rot = i ? 0.2 : -0.2;
    if (i === 1 && P.wave) {
      hx += Math.sin(t * 9) * s * 0.1;
      rot = Math.sin(t * 9) * 0.45;
    }
    if (i === 1 && P.peace) rot = 0.12;
    if (P.open) rot = i ? 0.5 : -0.5;
    ctx.save();
    if (P.open && i === 1) {
      ctx.translate(hx, hy);
      ctx.scale(-1, 1);
      ctx.translate(-hx, -hy);
    }
    hand(ctx, hx, hy, s * 0.2, { ink, rot, peace: i === 1 && P.peace, open: P.open });
    ctx.restore();
  });

  if (P.sparkles) {
    ctx.fillStyle = '#f4c46b';
    const r = rng(4);
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1;
      const px = side * s * (1.45 + r() * 0.5), py = -s * (0.75 + r() * 0.8);
      const ss = s * (0.09 + r() * 0.08) * (0.8 + 0.3 * Math.sin(t * 5 + i));
      ctx.beginPath();
      sparklePath(ctx, px, py, ss, 0.25);
      ctx.fill();
    }
  }
  ctx.restore();

  if (P.bubble) {
    // thought bubble, not tilted with the body
    ctx.save();
    ctx.translate(x, y - bounce);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.strokeStyle = ink ? C.ink : 'rgba(20,20,19,0.16)';
    ctx.lineWidth = s * (ink ? 0.05 : 0.02);
    const bx = s * 1.55, by = -s * 1.55;
    [[s * 0.98, -s * 0.92, s * 0.07], [s * 1.18, -s * 1.14, s * 0.11]].forEach(([px, py, pr]) => {
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, TAU);
      ctx.fill();
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.ellipse(bx, by, s * 0.5, s * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = C.orange;
    for (let i = 0; i < 3; i++) {
      const a = (Math.sin(t * 5 - i * 0.8) + 1) / 2;
      ctx.globalAlpha = 0.35 + a * 0.65;
      ctx.beginPath();
      ctx.arc(bx + (i - 1) * s * 0.2, by, s * 0.055, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------ demo scene

// A little photo set: backdrop, desk, a plant and a mug; the mascot poses
// in front. Used as a stand-in camera (same interface as the webcam).
export class DemoScene {
  constructor(w = 1280, h = 960) {
    this.w = w;
    this.h = h;
    this.el = canvas(w, h);
    this.bg = this.paintBackground();
    this.pose = 'idle';
    this.from = 'idle';
    this.poseAt = -10;
    this.offset = 0;
    this.t0 = performance.now() / 1000;
  }

  setPose(pose, t = performance.now() / 1000) {
    if (pose === this.pose) return;
    this.from = this.pose;
    this.pose = pose;
    this.poseAt = t;
    const r = rng(Object.keys(POSES).indexOf(pose) * 31 + 7);
    this.targetOffset = (r() - 0.5) * 0.14;
  }

  paintBackground() {
    const { w, h } = this;
    const c = canvas(w, h);
    const ctx = c.getContext('2d');
    // seamless paper backdrop
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#e9dfcf');
    g.addColorStop(0.55, '#f2eadd');
    g.addColorStop(1, '#e3d5bf');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const key = ctx.createRadialGradient(w * 0.52, h * 0.38, 0, w * 0.52, h * 0.38, w * 0.62);
    key.addColorStop(0, 'rgba(255,250,240,0.95)');
    key.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, w, h);

    const blur = (px) => {
      try {
        ctx.filter = `blur(${px}px)`;
      } catch {
        /* no canvas filter support */
      }
    };
    // bokeh fairy lights
    blur(w * 0.004);
    const r = rng(12);
    for (let i = 0; i < 16; i++) {
      const bx = (i / 15) * w * 1.1 - w * 0.05;
      const by = h * (0.1 + Math.sin(i * 0.9) * 0.035 + (i / 15) * 0.05);
      const br = w * (0.012 + r() * 0.012);
      const bg = ctx.createRadialGradient(bx, by, 0, bx, by, br * 2.4);
      bg.addColorStop(0, 'rgba(255,214,150,0.9)');
      bg.addColorStop(0.35, 'rgba(255,196,120,0.4)');
      bg.addColorStop(1, 'rgba(255,196,120,0)');
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(bx, by, br * 2.4, 0, TAU);
      ctx.fill();
    }
    // framed spark print on the wall, out of focus
    blur(w * 0.006);
    ctx.fillStyle = '#d8cbb6';
    ctx.fillRect(w * 0.72, h * 0.2, w * 0.19, h * 0.3);
    ctx.fillStyle = '#f7f1e6';
    ctx.fillRect(w * 0.735, h * 0.22, w * 0.16, h * 0.26);
    ctx.fillStyle = 'rgba(217,119,87,0.75)';
    ctx.fill(sparkPath(w * 0.815, h * 0.35, w * 0.05, { seed: 3 }));

    // plant on the left
    blur(w * 0.007);
    const leaves = rng(31);
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (leaves() - 0.5) * 1.9;
      const len = h * (0.22 + leaves() * 0.2);
      const bx = w * 0.07, by = h * 0.74;
      const lx = bx + Math.cos(a) * len, ly = by + Math.sin(a) * len;
      ctx.strokeStyle = '#6f7f55';
      ctx.lineWidth = w * 0.004;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + Math.cos(a) * len * 0.5 + 20, by + Math.sin(a) * len * 0.5, lx, ly);
      ctx.stroke();
      ctx.fillStyle = i % 3 ? '#7f915f' : '#93a672';
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(a + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.028, h * 0.075, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#b86447';
    ctx.beginPath();
    ctx.moveTo(w * 0.01, h * 0.72);
    ctx.lineTo(w * 0.13, h * 0.72);
    ctx.lineTo(w * 0.115, h * 0.84);
    ctx.lineTo(w * 0.025, h * 0.84);
    ctx.fill();

    // desk
    blur(0);
    ctx.filter = 'none';
    const desk = ctx.createLinearGradient(0, h * 0.8, 0, h);
    desk.addColorStop(0, '#d5b08b');
    desk.addColorStop(0.08, '#caa17b');
    desk.addColorStop(1, '#a97f5b');
    ctx.fillStyle = desk;
    ctx.fillRect(0, h * 0.8, w, h * 0.2);
    ctx.fillStyle = 'rgba(255,240,220,0.5)';
    ctx.fillRect(0, h * 0.8, w, h * 0.006);
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 9; i++) {
      ctx.strokeStyle = '#6b4a2f';
      ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath();
      const yy = h * (0.83 + i * 0.019);
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(w * 0.3, yy + 6, w * 0.6, yy - 6, w, yy + 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // mug on the right
    blur(w * 0.003);
    const mx = w * 0.84, my = h * 0.66, mw = w * 0.09, mh = h * 0.17;
    ctx.fillStyle = 'rgba(80,50,30,0.18)';
    ctx.beginPath();
    ctx.ellipse(mx + mw / 2, my + mh, mw * 0.7, h * 0.015, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#efe7da';
    ctx.lineWidth = w * 0.012;
    ctx.beginPath();
    ctx.arc(mx + mw, my + mh * 0.45, mh * 0.22, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    const mg = ctx.createLinearGradient(mx, 0, mx + mw, 0);
    mg.addColorStop(0, '#e3dacb');
    mg.addColorStop(0.35, '#fbf7f0');
    mg.addColorStop(1, '#d9cfbf');
    ctx.fillStyle = mg;
    ctx.fillRect(mx, my, mw, mh);
    ctx.fillStyle = '#d97757';
    ctx.fill(sparkPath(mx + mw / 2, my + mh * 0.48, mw * 0.3, { seed: 3 }));
    ctx.filter = 'none';
    return c;
  }

  update(now = performance.now()) {
    const t = now / 1000 - this.t0;
    const { w, h } = this;
    const ctx = this.el.getContext('2d');
    ctx.drawImage(this.bg, 0, 0);
    this.offset = lerp(this.offset, this.targetOffset || 0, 0.08);
    const k = clamp((now / 1000 - this.poseAt) / 0.35, 0, 1);
    const s = h * 0.2;
    const cx = w * (0.5 + this.offset), cy = h * 0.555;
    // contact shadow
    const sh = ctx.createRadialGradient(cx, h * 0.815, 0, cx, h * 0.815, s * 1.3);
    sh.addColorStop(0, 'rgba(70,40,20,0.35)');
    sh.addColorStop(1, 'rgba(70,40,20,0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(cx, h * 0.815, s * 1.3, s * 0.22, 0, 0, TAU);
    ctx.fill();
    const blink = t % 3.3 < 0.13;
    drawMascot(ctx, cx, cy, s, { pose: this.pose, from: this.from, k, t, blink });
    // lens vignette + grain
    const v = ctx.createRadialGradient(w / 2, h / 2, h * 0.45, w / 2, h / 2, h * 0.95);
    v.addColorStop(0, 'rgba(40,25,10,0)');
    v.addColorStop(1, 'rgba(40,25,10,0.28)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(noiseTile(192, (Math.floor(t * 24) % 5) + 1), 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

// A still "photo" of the mascot, for frame previews and the gallery.
export function mascotPhoto(pose = 'idle', w = 800, h = 600, t = 1.2) {
  const scene = sharedScene();
  scene.pose = scene.from = pose;
  scene.poseAt = -100;
  scene.offset = scene.targetOffset = 0;
  scene.update(scene.t0 * 1000 + t * 1000);
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const sa = scene.w / scene.h, da = w / h;
  let sw = scene.w, sh = scene.h;
  if (da > sa) sh = sw / da;
  else sw = sh * da;
  ctx.drawImage(scene.el, (scene.w - sw) / 2, (scene.h - sh) / 2, sw, sh, 0, 0, w, h);
  return c;
}

let scene0 = null;
function sharedScene() {
  if (!scene0) scene0 = new DemoScene(960, 720);
  return scene0;
}
