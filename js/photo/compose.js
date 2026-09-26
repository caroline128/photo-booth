// Compose a print: frame background → photos clipped into slots → frame
// decorations on top. Everything is drawn in sheet pixels (300 dpi) and
// scaled once, so previews and the final print are the same drawing.

import { canvas, TAU } from '../core/util.js';
import { needAll } from '../core/fonts.js';
import { roundRect } from '../art/ink.js';
import { drawSpark } from '../art/spark.js';

export function slotPath(ctx, s) {
  ctx.beginPath();
  if (s.shape === 'circle') ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, TAU);
  else roundRect(ctx, s.x, s.y, s.w, s.h, s.r || 0);
}

export function drawCover(ctx, img, x, y, w, h) {
  const iw = img.width, ih = img.height;
  const k = Math.max(w / iw, h / ih);
  const sw = w / k, sh = h / k;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

function placeholder(ctx, s, i) {
  ctx.fillStyle = '#ebe7dc';
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.globalAlpha = 0.35;
  drawSpark(ctx, s.x + s.w / 2, s.y + s.h / 2, Math.min(s.w, s.h) * 0.16, { color: '#c9c3b3' });
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#a8a292';
  ctx.font = `600 ${Math.round(Math.min(s.w, s.h) * 0.08)}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(i + 1), s.x + s.w / 2, s.y + s.h / 2 + Math.min(s.w, s.h) * 0.3);
  ctx.textAlign = 'left';
}

export function fontsFor(frame, L, info) {
  return needAll(frame.fonts?.(L, info) || []);
}

export function composeSync({ L, frame, photos = [], info, scale = 1, target = null }) {
  const G = frame.geometry(L, info);
  const W = Math.max(1, Math.round(L.W * scale)), H = Math.max(1, Math.round(L.H * scale));
  const c = target || canvas(W, H);
  if (c.width !== W) c.width = W;
  if (c.height !== H) c.height = H;
  const ctx = c.getContext('2d');
  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingQuality = 'high';
  frame.under?.(ctx, L, G, info);
  G.slots.forEach((s, i) => {
    ctx.save();
    slotPath(ctx, s);
    ctx.clip();
    if (photos[i]) drawCover(ctx, photos[i], s.x, s.y, s.w, s.h);
    else placeholder(ctx, s, i);
    ctx.restore();
    frame.slot?.(ctx, s, i, L, G, info);
  });
  frame.over?.(ctx, L, G, info);
  ctx.restore();
  return { canvas: c, G };
}

export async function compose(opts) {
  await fontsFor(opts.frame, opts.L, opts.info);
  return composeSync(opts);
}
