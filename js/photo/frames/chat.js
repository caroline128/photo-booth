// 聊天截图: the print looks like a claude.ai conversation — you send the
// photos, Claude replies under each one, with the composer at the bottom.

import { font } from '../../core/fonts.js';
import { fit, ellipsize } from '../../core/text.js';
import { roundRect } from '../../art/ink.js';
import { drawSpark } from '../../art/spark.js';
import { place, isNarrow } from '../layouts.js';
import { infoText } from './common.js';

const BG = '#faf9f5';
const BUBBLE = '#f0eee6';
const INK = '#141413';
const MUTED = '#73726c';
const LINE = '#e3e0d6';

function arrowUp(ctx, cx, cy, s) {
  ctx.save();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = s * 0.16;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.5);
  ctx.lineTo(cx, cy - s * 0.45);
  ctx.moveTo(cx - s * 0.4, cy - s * 0.05);
  ctx.lineTo(cx, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.4, cy - s * 0.05);
  ctx.stroke();
  ctx.restore();
}

export default {
  id: 'chat',
  name: '聊天截图',
  desc: '你发照片，Claude 在每张下面回你一句',

  geometry(L) {
    const narrow = isNarrow(L);
    const head = narrow ? 92 : 124;
    const foot = narrow ? 150 : 190;
    const below = narrow ? 54 : 74;
    const side = narrow ? 30 : 64;
    const box = { x: side, y: head + 16, w: L.W - side * 2, h: L.H - head - foot - 24 };
    let slots = place(L, box, { gap: narrow ? 16 : 30, below, hgap: narrow ? 22 : 40 });
    if (narrow) {
      // user photos are right-aligned bubbles, a little narrower than the column
      const k = 0.9;
      slots = slots.map((s) => ({ ...s, x: L.W - side - 8 - s.w * k, y: s.y, w: s.w * k, h: s.h * k }));
    } else slots = slots.map((s) => ({ ...s, x: s.x + 8, y: s.y + 8, w: s.w - 16, h: s.h - 16 }));
    return { slots: slots.map((s) => ({ ...s, r: narrow ? 16 : 20 })), head, foot, below };
  },

  fonts(L, info) {
    return [
      [font(500, 22, 'sans'), (info.title || '拍一组大头贴') + info.modelName + 'Claude'],
      [font(400, 24, 'serif'), infoText(info)],
      [font(400, 18, 'sans'), '回复 Claude…也会犯错，请核对照片中的笑容。'],
    ];
  },

  under(ctx, L, G, info) {
    const narrow = isNarrow(L);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, L.W, L.H);
    // title bar
    const hy = G.head / 2;
    drawSpark(ctx, narrow ? 44 : 78, hy, narrow ? 16 : 22);
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.font = font(500, narrow ? 21 : 28, 'sans');
    const chipW = narrow ? 104 : 136;
    const titleX = narrow ? 70 : 112;
    ctx.fillText(ellipsize(ctx, info.title || '拍一组大头贴', L.W - titleX - chipW - 44), titleX, hy + 1);
    // model chip
    const cw = chipW, ch = narrow ? 36 : 46, cx = L.W - (narrow ? 22 : 56) - cw;
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, cx, hy - ch / 2, cw, ch, 10);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.font = font(400, narrow ? 17 : 22, 'serif');
    ctx.textAlign = 'center';
    ctx.fillText(info.modelName, cx + cw / 2, hy + 1);
    ctx.textAlign = 'left';
    ctx.fillStyle = LINE;
    ctx.fillRect(0, G.head, L.W, 2);
    ctx.textBaseline = 'alphabetic';
    // bubbles behind the photos
    ctx.fillStyle = BUBBLE;
    for (const s of G.slots) {
      ctx.beginPath();
      roundRect(ctx, s.x - 8, s.y - 8, s.w + 16, s.h + 16, s.r + 8);
      ctx.fill();
    }
  },

  slot(ctx, s, i, L, G, info) {
    const narrow = isNarrow(L);
    const reply = info.replies[i % info.replies.length];
    const x = narrow ? 30 : s.x - 8;
    const y = s.y + s.h + 8 + G.below * 0.62;
    drawSpark(ctx, x + 14, y - (narrow ? 7 : 9), narrow ? 13 : 16);
    ctx.fillStyle = INK;
    const maxW = narrow ? L.W - 2 * 30 - 40 : s.w - 24;
    fit(ctx, reply, maxW, { max: narrow ? 23 : 28, min: 14, weight: 400, family: 'serif' });
    ctx.fillText(reply, x + (narrow ? 38 : 44), y);
  },

  over(ctx, L, G) {
    const narrow = isNarrow(L);
    const side = narrow ? 22 : 56;
    const h = narrow ? 76 : 96;
    const y = L.H - G.foot + (narrow ? 16 : 26);
    ctx.save();
    ctx.shadowColor = 'rgba(20,20,19,0.08)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    roundRect(ctx, side, y, L.W - side * 2, h, narrow ? 20 : 26);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, side, y, L.W - side * 2, h, narrow ? 20 : 26);
    ctx.stroke();
    ctx.fillStyle = '#a19e95';
    ctx.textBaseline = 'middle';
    ctx.font = font(400, narrow ? 19 : 24, 'sans');
    ctx.fillText('回复 Claude…', side + (narrow ? 22 : 30), y + h / 2);
    const bs = narrow ? 44 : 56;
    const bx = L.W - side - (narrow ? 16 : 20) - bs, by = y + (h - bs) / 2;
    ctx.fillStyle = '#d97757';
    ctx.beginPath();
    roundRect(ctx, bx, by, bs, bs, narrow ? 11 : 14);
    ctx.fill();
    arrowUp(ctx, bx + bs / 2, by + bs / 2, bs * 0.46);
    ctx.fillStyle = '#9c998f';
    ctx.textAlign = 'center';
    ctx.font = font(400, narrow ? 14 : 18, 'sans');
    ctx.fillText('Claude 也会犯错，请核对照片中的笑容。', L.W / 2, y + h + (narrow ? 30 : 42));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  },
};
