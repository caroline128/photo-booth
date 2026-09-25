// Lays photos into a print layout and paints the frame around them.
//
// Layout:  { id, name, size: [W, H] (print px @300dpi), slots: [{x,y,w,h,
//            shape?: 'rect'|'round'|'circle', r?, src?: photoIndex, rot?}],
//            photos: number of distinct photos needed, cut?: [...] }
// Frame:   { id, name, swatch, paint: { under(ctx, L, info), over(ctx, L, info),
//            slot?(ctx, slot, i, info) } }
//
// `info` carries the theme, date, serial number, captions, options etc.

import { canvas as mkCanvas, rrect } from '../core/util.js';

export function slotPath(ctx, s) {
  const shape = s.shape || 'rect';
  if (shape === 'circle') {
    ctx.beginPath();
    ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, Math.PI * 2);
  } else if (shape === 'round') {
    rrect(ctx, s.x, s.y, s.w, s.h, s.r ?? Math.min(s.w, s.h) * 0.08);
  } else if (shape === 'heart') {
    heartPath(ctx, s.x + s.w / 2, s.y + s.h * 0.52, s.w * 0.52);
  } else {
    ctx.beginPath();
    ctx.rect(s.x, s.y, s.w, s.h);
  }
}

export function heartPath(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.9);
  ctx.bezierCurveTo(cx - r * 1.6, cy - r * 0.1, cx - r * 0.75, cy - r * 1.25, cx, cy - r * 0.55);
  ctx.bezierCurveTo(cx + r * 0.75, cy - r * 1.25, cx + r * 1.6, cy - r * 0.1, cx, cy + r * 0.9);
  ctx.closePath();
}

/** Draw `img` into rect with object-fit: cover. */
export function drawCover(ctx, img, x, y, w, h) {
  const iw = img.width;
  const ih = img.height;
  const s = Math.max(w / iw, h / ih);
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/** Aspect ratio (w/h) of a layout's photo slots. */
export function slotAspect(layout) {
  const s = layout.slots[0];
  return s.w / s.h;
}

/**
 * Compose the print. `photos` are canvases (already filtered) in slot order;
 * null photos render as placeholders (used for frame thumbnails).
 */
export function compose(layout, frame, photos, info = {}) {
  const [W, H] = layout.size;
  const c = mkCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const L = { ...layout, W, H };
  frame.paint.under?.(ctx, L, info);
  layout.slots.forEach((s, i) => {
    const idx = s.src ?? i;
    const img = photos[idx];
    ctx.save();
    if (s.rot) {
      ctx.translate(s.x + s.w / 2, s.y + s.h / 2);
      ctx.rotate(s.rot);
      ctx.translate(-(s.x + s.w / 2), -(s.y + s.h / 2));
    }
    slotPath(ctx, s);
    ctx.save();
    ctx.clip();
    if (img) drawCover(ctx, img, s.x, s.y, s.w, s.h);
    else placeholder(ctx, s, idx, info);
    ctx.restore();
    frame.paint.slot?.(ctx, s, i, { ...info, photoIndex: idx });
    ctx.restore();
  });
  frame.paint.over?.(ctx, L, info);
  return c;
}

/** Silhouette placeholder used in the frame picker before any shot exists. */
function placeholder(ctx, s, i, info) {
  const tint = info.placeholderTint || ['#d9d4cc', '#cfc8bd'];
  ctx.fillStyle = tint[i % 2];
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  const cx = s.x + s.w / 2;
  const u = Math.min(s.w, s.h);
  ctx.beginPath();
  ctx.arc(cx, s.y + s.h * 0.42, u * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, s.y + s.h * 0.95, u * 0.34, u * 0.3, 0, Math.PI, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Layout factories (print pixels at 300 dpi)

/** 2×6 inch strip with N stacked photos (Life4Cuts / analog booth style). */
export function stripLayout({ id = 'strip', name = '竖条四格', n = 4, W = 600, H = 1800, side = 36, top = 40, gap = 22, bottom = 230, aspect = 4 / 3, shape, r } = {}) {
  const sw = W - side * 2;
  const avail = H - top - bottom - gap * (n - 1);
  let sh = sw / aspect;
  if (sh * n > avail) sh = avail / n;
  const slots = [];
  const used = sh * n + gap * (n - 1);
  const y0 = top + (H - top - bottom - used) / 2;
  for (let i = 0; i < n; i++) slots.push({ x: side, y: y0 + i * (sh + gap), w: sw, h: sh, shape, r });
  return { id, name, size: [W, H], slots, photos: n, footer: { y: H - bottom, h: bottom } };
}

/** 4×6 inch sheet with a cols×rows grid. */
export function gridLayout({ id = 'grid', name = '四宫格', cols = 2, rows = 2, W = 1200, H = 1800, pad = 70, gap = 34, top = 70, bottom = 300, aspect, shape, r } = {}) {
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  let chh = (H - top - bottom - gap * (rows - 1)) / rows;
  if (aspect) chh = Math.min(chh, cw / aspect);
  const used = chh * rows + gap * (rows - 1);
  const y0 = top + (H - top - bottom - used) / 2;
  const slots = [];
  for (let rr = 0; rr < rows; rr++) {
    for (let cc = 0; cc < cols; cc++) slots.push({ x: pad + cc * (cw + gap), y: y0 + rr * (chh + gap), w: cw, h: chh, shape, r });
  }
  return { id, name, size: [W, H], slots, photos: cols * rows, footer: { y: H - bottom, h: bottom } };
}
