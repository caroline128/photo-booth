// AR props: where a prop sits on a face. A face is described in output
// pixels by its two eyes (left/right on screen) plus optional nose/mouth/ears.
// All offsets are in "eye distance" units in the face's own rotated frame
// (x → towards the right eye, y ↓ towards the chin).
//
// Prop definition (extends an art definition):
//   { anchor: 'eyes'|'head'|'crown'|'above'|'nose'|'lip'|'mouth'|'chin'|
//             'neck'|'cheeks'|'ears'|'side'|'forehead',
//     w: width in eye-distances, origin: [ox, oy] point of the art that
//     sits on the anchor (fractions), dx, dy: extra offset, rot: radians,
//     pair: true to draw on both sides (cheeks/ears), flipPair: mirror art }

import { artRatio } from '../art/render.js';

const ANCHORS = {
  eyes: [0, 0],
  forehead: [0, -0.62],
  head: [0, -1.02],
  crown: [0, -1.45],
  above: [0, -2.15],
  nose: [0, 0.62],
  lip: [0, 0.9],
  mouth: [0, 1.08],
  chin: [0, 1.62],
  neck: [0, 2.25],
  cheeks: [0.78, 0.78],
  ears: [1.12, 0.18],
  side: [1.95, 1.2],
};

export function faceGeom(f) {
  const dx = f.eyeR.x - f.eyeL.x;
  const dy = f.eyeR.y - f.eyeL.y;
  const d = Math.max(4, Math.hypot(dx, dy));
  const ang = Math.atan2(dy, dx);
  return {
    mid: { x: (f.eyeL.x + f.eyeR.x) / 2, y: (f.eyeL.y + f.eyeR.y) / 2 },
    d,
    ang,
    cos: Math.cos(ang),
    sin: Math.sin(ang),
    f,
  };
}

function toWorld(g, lx, ly) {
  return {
    x: g.mid.x + (lx * g.cos - ly * g.sin) * g.d,
    y: g.mid.y + (lx * g.sin + ly * g.cos) * g.d,
  };
}

function anchorPoint(g, anchor, side = 1) {
  const f = g.f;
  // Use detected keypoints when they exist: they follow expressions better.
  if (anchor === 'nose' && f.nose) return { ...f.nose };
  if (anchor === 'mouth' && f.mouth) return { ...f.mouth };
  if (anchor === 'lip' && f.nose && f.mouth) return { x: (f.nose.x * 0.45 + f.mouth.x * 0.55), y: (f.nose.y * 0.45 + f.mouth.y * 0.55) };
  const a = ANCHORS[anchor] || ANCHORS.eyes;
  return toWorld(g, a[0] * side, a[1]);
}

/**
 * Draw props for all faces. `bitmaps` maps prop id → canvas/image (ready).
 */
export function drawProps(ctx, faces, props, bitmaps) {
  for (const f of faces) {
    const g = faceGeom(f);
    for (const p of props) {
      const bmp = bitmaps.get(p.id);
      if (!bmp) continue;
      const sides = p.pair ? [-1, 1] : [p.anchor === 'side' ? 1 : 1];
      for (const s of sides) {
        const pt = anchorPoint(g, p.anchor, s);
        const w = (p.w || 1) * g.d;
        const ratio = artRatio(p);
        const hgt = w * ratio;
        const m = bmp.margin || 0;
        const scale = w / (bmp.width - m * 2);
        const [ox, oy] = p.origin || [0.5, 0.5];
        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(g.ang + (p.rot || 0) * (p.pair ? s : 1));
        ctx.translate(((p.dx || 0) * s) * g.d, (p.dy || 0) * g.d);
        if (p.pair && p.flipPair && s < 0) ctx.scale(-1, 1);
        ctx.drawImage(bmp, -ox * w - m * scale, -oy * hgt - m * scale, bmp.width * scale, bmp.height * scale);
        ctx.restore();
      }
    }
  }
}

/** A virtual face for manual mode (no face tracking): centre + size. */
export function virtualFace(cx, cy, d) {
  return {
    id: 'manual',
    eyeL: { x: cx - d / 2, y: cy },
    eyeR: { x: cx + d / 2, y: cy },
    nose: null,
    mouth: null,
    manual: true,
  };
}
