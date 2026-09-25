// Print simulation helpers.
//  - Dye-sublimation (what modern booths use): the ribbon lays down Yellow,
//    then Magenta, then Cyan, then a clear overcoat — we pre-render the
//    partial prints so the animation can show each pass.
//  - Chemical (vintage analog booth): the strip comes out wet and the image
//    develops in; handled with CSS on the full print.

import { canvas as mkCanvas } from '../core/util.js';

/** Returns [yellowOnly, yellowMagenta, full] canvases (downscaled for speed). */
export function dyeSubPasses(src, maxSide = 900) {
  const s = Math.min(1, maxSide / Math.max(src.width, src.height));
  const w = Math.round(src.width * s);
  const hh = Math.round(src.height * s);
  const full = mkCanvas(w, hh);
  const fctx = full.getContext('2d');
  fctx.drawImage(src, 0, 0, w, hh);
  const data = fctx.getImageData(0, 0, w, hh);
  const y = new ImageData(w, hh);
  const ym = new ImageData(w, hh);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    // subtractive: yellow ink absorbs blue, magenta absorbs green, cyan absorbs red
    y.data[i] = 255;
    y.data[i + 1] = 255;
    y.data[i + 2] = d[i + 2];
    y.data[i + 3] = 255;
    ym.data[i] = 255;
    ym.data[i + 1] = d[i + 1];
    ym.data[i + 2] = d[i + 2];
    ym.data[i + 3] = 255;
  }
  const cy = mkCanvas(w, hh);
  cy.getContext('2d').putImageData(y, 0, 0);
  const cym = mkCanvas(w, hh);
  cym.getContext('2d').putImageData(ym, 0, 0);
  return [cy, cym, full];
}

/** Paper look for the finished print: slight warm white + fine texture. */
export function paperize(src, { gloss = true } = {}) {
  const c = mkCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(src, 0, 0);
  if (gloss) {
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, 'rgba(255,255,255,0.10)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
  }
  return c;
}
