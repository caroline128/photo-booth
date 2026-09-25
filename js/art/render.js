// Turns art definitions (SVG strings or canvas painters) into bitmaps at any
// size, with an optional white die-cut border + shadow like a real sticker.
//
// Art definition:
//   { id, name, svg?: '<svg viewBox=...>', draw?: (ctx, w, h) => void,
//     ratio?: h / w, outline?: 0.06 (fraction of width), outlineColor?,
//     shadow?: true, holo?: true }

import { canvas as mkCanvas, loadImage, svgUrl, TAU } from '../core/util.js';

const imgCache = new Map();
const bmpCache = new Map();

export function artRatio(def) {
  if (def.ratio) return def.ratio;
  if (def.svg) {
    const m = def.svg.match(/viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/);
    if (m) return parseFloat(m[2]) / parseFloat(m[1]);
  }
  return 1;
}

function svgWithSize(svg) {
  if (/<svg[^>]*\swidth=/.test(svg)) return svg;
  const m = svg.match(/viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)\s*"/);
  const w = m ? m[1] : 100;
  const hh = m ? m[2] : 100;
  let s = svg.replace('<svg', `<svg width="${w}" height="${hh}"`);
  if (!/xmlns=/.test(s)) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return s;
}

async function svgImage(def) {
  let p = imgCache.get(def);
  if (!p) {
    p = loadImage(svgUrl(svgWithSize(def.svg)));
    imgCache.set(def, p);
  }
  return p;
}

/** Raw art (no border) at `w` px wide. */
async function rawArt(def, w) {
  const ratio = artRatio(def);
  const c = mkCanvas(w, w * ratio);
  const ctx = c.getContext('2d');
  if (def.svg) {
    const img = await svgImage(def);
    ctx.drawImage(img, 0, 0, c.width, c.height);
  } else if (def.draw) {
    ctx.save();
    def.draw(ctx, c.width, c.height);
    ctx.restore();
  }
  if (def.holo) holo(ctx, c.width, c.height);
  return c;
}

/** Rainbow holographic sheen clipped to the art (Y2K stickers). */
function holo(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  const g = ctx.createLinearGradient(0, 0, w, h);
  ['#ff9ad5', '#9ae7ff', '#fff59a', '#b89aff', '#9affc8', '#ff9ad5'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** White die-cut border + soft shadow around the silhouette of `src`. */
export function dieCut(src, pad, color = '#fff', shadow = true) {
  const m = Math.ceil(pad + (shadow ? pad * 0.8 + 4 : 0));
  const c = mkCanvas(src.width + m * 2, src.height + m * 2);
  const ctx = c.getContext('2d');
  const sil = mkCanvas(c.width, c.height);
  const sctx = sil.getContext('2d');
  const steps = pad > 6 ? 28 : 16;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TAU;
    sctx.drawImage(src, m + Math.cos(a) * pad, m + Math.sin(a) * pad);
  }
  sctx.drawImage(src, m, m);
  sctx.globalCompositeOperation = 'source-in';
  sctx.fillStyle = color;
  sctx.fillRect(0, 0, sil.width, sil.height);
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(40,20,30,0.35)';
    ctx.shadowBlur = pad * 0.9 + 2;
    ctx.shadowOffsetY = pad * 0.35 + 1;
    ctx.drawImage(sil, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(sil, 0, 0);
  }
  ctx.drawImage(src, m, m);
  c.margin = m;
  return c;
}

/**
 * Bitmap for `def` whose *art* is `w` px wide. If the def has an outline the
 * returned canvas is larger; `canvas.margin` tells by how much on each side.
 */
export async function artBitmap(def, w) {
  w = Math.max(8, Math.round(w));
  const key = `${def.id}@${w}`;
  if (bmpCache.has(key)) return bmpCache.get(key);
  const p = (async () => {
    const raw = await rawArt(def, w);
    if (!def.outline) {
      raw.margin = 0;
      return raw;
    }
    return dieCut(raw, Math.max(2, def.outline * w), def.outlineColor || '#fff', def.shadow !== false);
  })();
  bmpCache.set(key, p);
  // keep the cache from growing without bound during long decorate sessions
  if (bmpCache.size > 400) bmpCache.delete(bmpCache.keys().next().value);
  return p;
}

/** Data URL thumbnail for palettes (cached). */
const thumbCache = new Map();
export async function artThumb(def, w = 160) {
  const key = `${def.id}@${w}`;
  if (!thumbCache.has(key)) thumbCache.set(key, artBitmap(def, w).then((c) => c.toDataURL('image/png')));
  return thumbCache.get(key);
}
