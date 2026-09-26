// 拍摄道具: overlays drawn over the viewfinder and baked into each shot,
// like the prop boards in a real booth. Positions are fractions of the photo.

import { needAll } from '../core/fonts.js';
import { stickerById } from '../art/stickers.js';
import { renderDef } from '../photo/editor.js';

export const PROPS = [
  { id: 'none', name: '不用道具' },
  { id: 'halo', name: '星芒光环', items: [{ s: 'halo', x: 0.5, y: 0.14, w: 0.58 }] },
  { id: 'bubble', name: '思考泡泡', items: [{ s: 'typing', x: 0.8, y: 0.17, w: 0.3 }] },
  { id: 'praise', name: '夸夸卡片', items: [{ s: 'right', x: 0.5, y: 0.87, w: 0.78 }] },
  { id: 'term', name: '终端字幕', items: [{ s: 'spinner', x: 0.5, y: 0.9, w: 0.84 }] },
  { id: 'buddy', name: '和小芒合影', items: [{ s: 'mascot', x: 0.83, y: 0.75, w: 0.34 }] },
].filter((p) => !p.items || p.items.every((it) => stickerById(it.s)));

export const propById = (id) => PROPS.find((p) => p.id === id) || PROPS[0];

export function propFonts(prop) {
  return needAll((prop.items || []).flatMap((it) => stickerById(it.s)?.fonts || []));
}

const cache = new Map();

// Draw the prop's stickers onto a w×h photo (or viewfinder) context.
export function drawProp(ctx, prop, w, h, { live = false } = {}) {
  for (const it of prop?.items || []) {
    const def = stickerById(it.s);
    if (!def) continue;
    const pw = Math.round(it.w * w), ph = Math.round(pw * def.ratio);
    const key = `${it.s}|${pw}`;
    let b = live ? cache.get(key) : null;
    if (!b) {
      b = renderDef(def, pw, ph);
      if (live) {
        cache.set(key, b);
        if (cache.size > 24) cache.delete(cache.keys().next().value);
      }
    }
    ctx.drawImage(b.img, it.x * w - pw / 2 - b.pad, it.y * h - ph / 2 - b.pad);
  }
}
