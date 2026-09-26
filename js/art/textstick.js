// Text stickers: the doodle tool's text becomes a sticker drawn in one of
// a few Claude-ish styles. Glyphs are fetched first, then measured.

import { font, need } from '../core/fonts.js';
import { wrap } from '../core/text.js';
import { canvas } from '../core/util.js';
import { C } from './palette.js';
import { drawSpark } from './spark.js';
import { roundRect } from './ink.js';

export const TEXT_STYLES = [
  { id: 'serif', name: '衬线', family: 'serifCn', weight: 600, color: C.ink },
  { id: 'reply', name: 'Claude 说', family: 'serifCn', weight: 500, color: C.ink, card: 'reply' },
  { id: 'hand', name: '手写', family: 'handCn', weight: 400, color: C.orange, halo: '#ffffff' },
  { id: 'term', name: '终端', family: 'mono', weight: 500, color: '#efece4', card: 'term' },
  { id: 'bold', name: '粗体', family: 'sansCn', weight: 700, color: '#ffffff', halo: C.orange, shadow: C.ink },
];

export const textStyleById = (id) => TEXT_STYLES.find((s) => s.id === id) || TEXT_STYLES[0];

const REF = 100; // layout at 100px font size, scale when drawing

export async function makeTextSticker(styleId, raw) {
  const st = textStyleById(styleId);
  const text = raw.trim().slice(0, 60);
  const spec = font(st.weight, REF, st.family);
  await need(spec, text + '>');
  const probe = canvas(4, 4).getContext('2d');
  probe.font = spec;
  const lines = wrap(probe, text, REF * 9).slice(0, 4);
  const lh = REF * 1.28;
  const tw = Math.max(...lines.map((l) => probe.measureText(l).width), REF * 0.6);
  const padX = st.card ? REF * 0.55 : REF * 0.22;
  const padY = st.card ? REF * 0.4 : REF * 0.16;
  const lead = st.card === 'reply' ? REF * 0.72 : st.card === 'term' ? REF * 0.8 : 0;
  const W = tw + padX * 2 + lead;
  const H = lines.length * lh + padY * 2;

  const draw = (ctx, w, h) => {
    const k = w / W;
    ctx.save();
    ctx.scale(k, h / H);
    ctx.font = spec;
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    if (st.card === 'reply') {
      ctx.save();
      ctx.shadowColor = 'rgba(20,20,19,0.18)';
      ctx.shadowBlur = REF * 0.3;
      ctx.shadowOffsetY = REF * 0.08;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      roundRect(ctx, REF * 0.08, REF * 0.08, W - REF * 0.16, H - REF * 0.16, REF * 0.42);
      ctx.fill();
      ctx.restore();
      drawSpark(ctx, padX + REF * 0.22, padY + lh / 2, REF * 0.3);
    } else if (st.card === 'term') {
      ctx.fillStyle = '#1b1a18';
      ctx.beginPath();
      roundRect(ctx, 0, 0, W, H, REF * 0.32);
      ctx.fill();
      ctx.fillStyle = C.orange;
      ctx.fillText('>', padX, padY + lh / 2);
    }
    lines.forEach((ln, i) => {
      const x = padX + lead, y = padY + lh * (i + 0.5);
      if (st.shadow) {
        ctx.fillStyle = st.shadow;
        ctx.fillText(ln, x + REF * 0.06, y + REF * 0.07);
      }
      if (st.halo) {
        ctx.strokeStyle = st.halo;
        ctx.lineWidth = REF * 0.2;
        ctx.strokeText(ln, x, y);
      }
      ctx.fillStyle = st.color;
      ctx.fillText(ln, x, y);
    });
    ctx.restore();
  };

  return {
    id: `text:${styleId}:${text}`,
    name: text,
    ratio: H / W,
    size: Math.min(0.9, 0.12 * (W / REF)),
    fonts: [[spec, text + '>']],
    text,
    style: styleId,
    draw,
  };
}
