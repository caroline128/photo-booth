// 来信: a letter from Claude on ruled paper — 亲爱的人类, a few warm lines,
// the photos taped in as white-bordered prints, the closing 祝 / 笑口常开,
// the signature with a spark, and a stamp with a postmark up in the corner.

import { font } from '../../core/fonts.js';
import { wrap, spaced } from '../../core/text.js';
import { rng, TAU } from '../../core/util.js';
import { paper, smoothPath } from '../../art/ink.js';
import { drawSpark, sparkPath } from '../../art/spark.js';
import { place, isNarrow } from '../layouts.js';

const INK = '#1f1e1c';
const BODY = '#34322e';
const MUTED = '#8b877c';
const RULE = 'rgba(198,97,63,0.2)';
const PAPER = '#fbf8f1';
const ORANGE = '#d97757';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const ems = (t) => [...t].reduce((n, ch) => n + (CJK.test(ch) ? 1 : ch === ' ' ? 0.26 : 0.56), 0);

const SPEC = {
  wide: { M: 92, lh: 60, y0: 176, hello: 46, body: 32, sign: 40, small: 26, stamp: [118, 146], border: 20, gap: 72, maxBody: 3 },
  narrow: { M: 40, lh: 40, y0: 104, hello: 30, body: 21, sign: 26, small: 17, stamp: [70, 88], border: 12, gap: 38, maxBody: 3 },
};

function copy(L, info) {
  const d = info.date || new Date();
  return {
    hello: '亲爱的人类：',
    body: `　　谢谢你今天来拍照。${info.title ? `「${info.title}」这` : '这'} ${L.count} 张我都认真看过了：光线很好，你也是。`,
    wish: '　　祝',
    wish2: '笑口常开！',
    sign: 'Claude',
    date: `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`,
    ps: 'P.S. 下次也来找我拍照吧。',
  };
}

function plan(L, info) {
  const n = isNarrow(L);
  const S = n ? SPEC.narrow : SPEC.wide;
  const t = copy(L, info);
  const w = L.W - S.M * 2;
  const bodyLines = Math.min(S.maxBody, Math.max(1, Math.ceil((ems(t.body) * S.body) / w - 0.04)));
  // baselines sit on the ruled lines: row k is at y0 + k·lh
  const last = Math.floor((L.H - (n ? 34 : 56) - S.y0) / S.lh);
  const rows = { body: 1, close: last - 2 };
  const top = S.y0 + bodyLines * S.lh + (n ? 18 : 30);
  const bottom = S.y0 + (rows.close - 1) * S.lh + (n ? 4 : 8);
  const b = S.border;
  const box = { x: S.M + b, y: top + b + (n ? 8 : 12), w: w - b * 2, h: bottom - top - b * 2 - (n ? 8 : 12) };
  return { S, w, bodyLines, rows, last, box };
}

// Masking tape: translucent, with torn ends.
function tape(ctx, cx, cy, w, h, a, seed) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 1; i <= 6; i++) ctx.lineTo(w / 2 + (r() - 0.5) * h * 0.22, -h / 2 + (i * h) / 6);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = 5; i >= 0; i--) ctx.lineTo(-w / 2 + (r() - 0.5) * h * 0.22, -h / 2 + (i * h) / 6);
  ctx.closePath();
  ctx.shadowColor = 'rgba(60,40,20,0.12)';
  ctx.shadowBlur = h * 0.2;
  ctx.shadowOffsetY = h * 0.05;
  ctx.fillStyle = 'rgba(232,220,192,0.86)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = h * 0.06;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 2, -h / 2 + h * 0.12);
  ctx.lineTo(w / 2 - 2, -h / 2 + h * 0.12);
  ctx.stroke();
  ctx.restore();
}

// Postage stamp with a perforated edge, and a postmark over its corner.
function stamp(ctx, x, y, w, h, info, n) {
  const hole = n ? 3.2 : 5.2;
  ctx.save();
  ctx.shadowColor = 'rgba(60,40,20,0.16)';
  ctx.shadowBlur = n ? 6 : 10;
  ctx.shadowOffsetY = n ? 2 : 3;
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
  // perforations: bite semicircles out of the edge in paper colour
  ctx.fillStyle = PAPER;
  const step = hole * 2.7;
  for (let px = x + step / 2; px < x + w; px += step)
    for (const py of [y, y + h]) {
      ctx.beginPath();
      ctx.arc(px, py, hole, 0, TAU);
      ctx.fill();
    }
  for (let py = y + step / 2; py < y + h; py += step)
    for (const px of [x, x + w]) {
      ctx.beginPath();
      ctx.arc(px, py, hole, 0, TAU);
      ctx.fill();
    }
  const p = n ? 8 : 13;
  ctx.fillStyle = ORANGE;
  ctx.fillRect(x + p, y + p, w - p * 2, h - p * 2);
  ctx.fillStyle = PAPER;
  ctx.fill(sparkPath(x + w / 2, y + h * 0.46, w * 0.27));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = font(600, n ? 8.5 : 14, 'sans');
  spaced(ctx, 'CLAUDE', x + w / 2, y + p + (n ? 12 : 20), n ? 1 : 2, 'center');
  ctx.font = font(500, n ? 8 : 13, 'sans');
  spaced(ctx, String(info.modelName || '').toUpperCase(), x + w / 2, y + h - p - (n ? 5 : 9), n ? 0.8 : 1.6, 'center');
}

function postmark(ctx, cx, cy, r, info, n) {
  const d = info.date || new Date();
  ctx.save();
  ctx.strokeStyle = ctx.fillStyle = 'rgba(40,38,34,0.55)';
  ctx.lineWidth = n ? 1.6 : 2.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = n ? 1 : 1.4;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.8, 0, TAU);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font(500, r * 0.26, 'mono');
  ctx.fillText(`${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`, cx, cy);
  ctx.font = font(500, r * 0.17, 'sans');
  spaced(ctx, 'PHOTO BOOTH', cx, cy - r * 0.42, r * 0.02, 'center');
  spaced(ctx, 'CLAUDE', cx, cy + r * 0.44, r * 0.04, 'center');
  // wavy cancellation lines running off to the left
  ctx.lineWidth = n ? 1.4 : 2.2;
  ctx.lineCap = 'round';
  for (let k = -1; k <= 1; k++) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
      const x = cx - r * 1.05 - i * r * 0.16;
      pts.push([x, cy + k * r * 0.34 + Math.sin(i * 0.9) * r * 0.08]);
    }
    ctx.beginPath();
    smoothPath(ctx, pts);
    ctx.stroke();
  }
  ctx.restore();
}

export default {
  id: 'letter',
  name: '来信',
  desc: 'Claude 写给你的一封信，照片用胶带贴在信纸上',

  geometry(L, info) {
    const P = plan(L, info);
    return { slots: place(L, P.box, { gap: P.S.gap, hgap: P.S.gap }), ...P };
  },

  fonts(L, info) {
    const t = copy(L, info);
    const S = isNarrow(L) ? SPEC.narrow : SPEC.wide;
    return [
      [font(600, S.hello, 'serif'), t.hello],
      [font(400, S.body, 'serif'), t.body + t.wish + t.wish2 + t.date + t.ps + '…'],
      [font('italic 500', S.sign, 'serif'), t.sign],
      [font(600, 14, 'sans'), 'CLAUDE'],
      [font(500, 14, 'sans'), String(info.modelName || '').toUpperCase() + 'CLAUDE PHOTO BOOTH'],
      [font(500, 14, 'mono'), '0123456789.'],
    ];
  },

  under(ctx, L, G, info) {
    const { S } = G;
    const n = isNarrow(L);
    paper(ctx, L.W, L.H, { base: PAPER, grain: 0.045, mottle: 0.025, seed: info.seed });
    // ruled lines, a double rule on top like a letter pad
    ctx.fillStyle = RULE;
    for (let k = 0; k <= G.last; k++) ctx.fillRect(S.M * 0.6, S.y0 + k * S.lh + (n ? 7 : 10), L.W - S.M * 1.2, n ? 1.2 : 1.6);
    ctx.fillRect(S.M * 0.6, S.y0 - S.lh + (n ? 7 : 10) - (n ? 4 : 6), L.W - S.M * 1.2, n ? 1.2 : 1.6);
    // prints: white border and a soft shadow
    const b = S.border;
    const r = rng(info.seed + 5);
    for (const s of G.slots) {
      ctx.save();
      ctx.shadowColor = 'rgba(60,40,20,0.22)';
      ctx.shadowBlur = n ? 12 : 22;
      ctx.shadowOffsetX = (r() - 0.5) * (n ? 4 : 8);
      ctx.shadowOffsetY = n ? 4 : 7;
      ctx.fillStyle = '#fffdf9';
      ctx.fillRect(s.x - b, s.y - b, s.w + b * 2, s.h + b * 2);
      ctx.restore();
    }
  },

  slot(ctx, s, i, L, G, info) {
    const n = isNarrow(L);
    const b = G.S.border;
    const r = rng(info.seed + 40 + i);
    ctx.save();
    ctx.strokeStyle = 'rgba(40,30,20,0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - 0.5, s.y - 0.5, s.w + 1, s.h + 1);
    ctx.restore();
    const tw = n ? 76 : 128, th = n ? 22 : 36;
    if (r() < 0.5) tape(ctx, s.x + s.w / 2 + (r() - 0.5) * s.w * 0.2, s.y - b * 0.6, tw * 1.1, th, (r() - 0.5) * 0.2, info.seed + i);
    else {
      tape(ctx, s.x - b * 0.3, s.y - b * 0.3, tw, th, -0.72 + (r() - 0.5) * 0.2, info.seed + i);
      tape(ctx, s.x + s.w + b * 0.3, s.y + s.h + b * 0.3, tw, th, -0.72 + (r() - 0.5) * 0.2, info.seed + i + 50);
    }
  },

  over(ctx, L, G, info) {
    const { S, w } = G;
    const n = isNarrow(L);
    const t = copy(L, info);
    const x0 = S.M;
    const row = (k) => S.y0 + k * S.lh;
    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // stamp and postmark, top right
    const [sw, sh] = S.stamp;
    const sx = L.W - x0 - sw + (n ? 8 : 10), sy = n ? 16 : 30;
    ctx.save();
    stamp(ctx, sx, sy, sw, sh, info, n);
    ctx.restore();
    postmark(ctx, sx + sw * 0.05, sy + sh * 0.68, n ? 30 : 52, info, n);

    // salutation + body
    ctx.fillStyle = INK;
    ctx.font = font(600, S.hello, 'serif');
    ctx.fillText(t.hello, x0, row(0));
    ctx.fillStyle = BODY;
    ctx.font = font(400, S.body, 'serif');
    let lines = wrap(ctx, t.body, w);
    if (lines.length > G.bodyLines) {
      // a very long title: shrink until the letter fits its lines
      for (let size = S.body - 1; size >= S.body * 0.7 && lines.length > G.bodyLines; size--) {
        ctx.font = font(400, size, 'serif');
        lines = wrap(ctx, t.body, w);
      }
      if (lines.length > G.bodyLines) {
        lines = lines.slice(0, G.bodyLines);
        let l = lines[G.bodyLines - 1];
        while (l.length && ctx.measureText(l + '…').width > w) l = l.slice(0, -1);
        lines[G.bodyLines - 1] = l + '…';
      }
    }
    lines.forEach((ln, i) => ctx.fillText(ln, x0, row(G.rows.body + i)));

    // closing: 祝 / 笑口常开！, signature and date on the right, then the P.S.
    const c = G.rows.close;
    ctx.font = font(400, S.body, 'serif');
    ctx.fillText(t.wish, x0, row(c));
    ctx.fillText(t.wish2, x0, row(c + 1));
    ctx.fillStyle = MUTED;
    ctx.font = font(400, S.small, 'serif');
    ctx.fillText(t.ps, x0, row(c + 2));

    const right = L.W - x0;
    const sp = n ? 13 : 20;
    ctx.fillStyle = INK;
    ctx.textAlign = 'right';
    ctx.font = font('italic 500', S.sign, 'serif');
    const nx = right - sp * 2.4;
    ctx.fillText(t.sign, nx, row(c + 1));
    // the Chinese dash "——" as one unbroken stroke
    const dx = nx - ctx.measureText(t.sign).width - S.sign * 0.3;
    ctx.fillRect(dx - S.sign * 1.7, row(c + 1) - S.sign * 0.3, S.sign * 1.7, n ? 1.6 : 2.4);
    drawSpark(ctx, right - sp, row(c + 1) - S.sign * 0.34, sp);
    ctx.fillStyle = MUTED;
    ctx.font = font(400, S.small, 'serif');
    ctx.fillText(t.date, right, row(c + 2));
    ctx.restore();
  },
};
