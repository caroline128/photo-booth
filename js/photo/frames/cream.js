// 奶油纸: warm paper, hairlines, a small spark and the title in serif.

import { font } from '../../core/fonts.js';
import { fitLines, fit, spaced } from '../../core/text.js';
import { paper, roundRect } from '../../art/ink.js';
import { drawSpark } from '../../art/spark.js';
import { place, isNarrow } from '../layouts.js';
import { serialText, dateText, DIGITS } from './common.js';

const INK = '#2a2926';
const META = '#8b877c';

export default {
  id: 'cream',
  name: '奶油纸',
  desc: '暖白纸、细线和一枚小星芒',

  geometry(L) {
    const r = (s) => ({ ...s, r: 10 });
    if (isNarrow(L)) {
      const bottom = L.count === 3 ? 470 : 184;
      return { slots: place(L, { x: 38, y: 64, w: L.W - 76, h: L.H - 64 - bottom }, { gap: 18 }).map(r), bottom };
    }
    return { slots: place(L, { x: 72, y: 176, w: L.W - 144, h: L.H - 176 - 222 }, { gap: 30 }).map(r), bottom: 222 };
  },

  fonts(L, info) {
    return [
      [font(500, 40, 'serif'), (info.title || 'Claude 照相馆') + (info.haiku || []).join('')],
      [font('italic 400', 30, 'serif'), (info.haiku || []).join('') + 'Claude 照相馆'],
      [font(500, 18, 'mono'), DIGITS + info.modelName + 'shots'],
      [font(500, 13, 'sans'), 'CLAUDE PHOTO BOOTH'],
    ];
  },

  under(ctx, L, G, info) {
    paper(ctx, L.W, L.H, { base: '#fbf8f1', grain: 0.05, mottle: 0.03, seed: info.seed });
  },

  slot(ctx, s) {
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(40,30,20,0.12)';
    ctx.beginPath();
    roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
    ctx.stroke();
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const title = info.title;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    if (isNarrow(L)) {
      const cx = L.W / 2;
      ctx.fillStyle = META;
      ctx.font = font(500, 13, 'sans');
      spaced(ctx, 'CLAUDE PHOTO BOOTH', cx, 42, 4, 'center');
      const top = L.H - G.bottom;
      if (L.count === 3) {
        drawSpark(ctx, cx, top + 72, 30);
        ctx.fillStyle = INK;
        ctx.textAlign = 'center';
        const t = fitLines(ctx, title || 'Claude 照相馆', L.W - 90, 2, { max: 40, min: 24, weight: 500, family: 'serif' });
        t.lines.forEach((ln, i) => ctx.fillText(ln, cx, top + 158 + i * t.size * 1.3));
        const hy = top + 158 + t.lines.length * t.size * 1.3 + 22;
        ctx.fillStyle = '#5c5a54';
        ctx.font = font('italic 400', 25, 'serif');
        (info.haiku || []).forEach((ln, i) => ctx.fillText(ln, cx, hy + i * 40));
        ctx.fillStyle = META;
        ctx.font = font(500, 16, 'mono');
        ctx.fillText(`${dateText(info)} · ${info.modelName} · ${serialText(info)}`, cx, L.H - 34);
      } else {
        drawSpark(ctx, cx, top + 40, 17);
        ctx.fillStyle = INK;
        ctx.textAlign = 'center';
        const t = fitLines(ctx, title || 'Claude 照相馆', L.W - 80, 2, { max: 32, min: 17, weight: 500, family: 'serif' });
        const lh = t.size * 1.25;
        const y0 = top + 108 - ((t.lines.length - 1) * lh) / 2;
        t.lines.forEach((ln, i) => ctx.fillText(ln, cx, y0 + i * lh));
        ctx.fillStyle = META;
        ctx.font = font(500, 15, 'mono');
        ctx.fillText(`${dateText(info)} · ${info.modelName} · ${serialText(info)}`, cx, L.H - 22);
      }
    } else {
      // header
      drawSpark(ctx, 96, 96, 22);
      ctx.fillStyle = INK;
      ctx.font = font(500, 32, 'serif');
      ctx.fillText('Claude 照相馆', 130, 107);
      ctx.fillStyle = META;
      ctx.font = font(500, 19, 'mono');
      ctx.textAlign = 'right';
      ctx.fillText(dateText(info), L.W - 72, 106);
      ctx.fillStyle = 'rgba(40,30,20,0.14)';
      ctx.fillRect(72, 146, L.W - 144, 1.5);
      // footer
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      const t = title || '今天的我们';
      fit(ctx, t, L.W - 200, { max: 50, min: 26, weight: 500, family: 'serif' });
      ctx.fillText(t, L.W / 2, L.H - 112);
      ctx.fillStyle = META;
      ctx.font = font(500, 18, 'mono');
      ctx.fillText(`${info.modelName} · ${L.count} shots · ${serialText(info)}`, L.W / 2, L.H - 66);
    }
    ctx.restore();
  },
};

