// 模型卡: a model card (and ID card) for the human in the photos — an ink
// header, the name, a tidy grid of fields with bilingual labels, and a
// passport-style machine-readable zone at the foot.

import { font } from '../../core/fonts.js';
import { fit, fitLines, spaced } from '../../core/text.js';
import { pad, rng, TAU } from '../../core/util.js';
import { paper, roundRect } from '../../art/ink.js';
import { drawSpark } from '../../art/spark.js';
import { place, isNarrow } from '../layouts.js';
import { dateText, serialText } from './common.js';

const INK = '#141413';
const PAPER = '#faf9f5';
const BODY = '#2b2a27';
const MUTED = '#8b877c';
const LINE = 'rgba(20,20,19,0.13)';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const ems = (t) => [...t].reduce((n, ch) => n + (CJK.test(ch) ? 1 : ch === ' ' ? 0.26 : 0.56), 0);

const SPEC = {
  wide: { M: 72, band: 136, label: 15, name: 58, sub: 22, value: 29, rowH: 102, cols: 3, mrz: 34, seal: 74, gap: 24, hgap: 24 },
  narrow: { M: 36, band: 100, label: 13, name: 36, sub: 15, value: 20.5, rowH: 74, cols: 2, mrz: 22, seal: 40, gap: 14, hgap: 14 },
};
const SEAL_TEXT = 'CLAUDE PHOTO BOOTH · EVALUATED · ';

function fields(L, info) {
  return [
    ['版本', 'VERSION', dateText(info)],
    ['上下文窗口', 'CONTEXT', `${L.count} 张照片`],
    ['温度', 'TEMPERATURE', '0.7（刚刚好）'],
    ['擅长', 'STRENGTHS', '比耶 · 眨眼 · 假装思考'],
    ['已知局限', 'LIMITATIONS', '早上起不来'],
    ['训练数据', 'TRAINING DATA', '咖啡、晚霞和朋友'],
  ];
}

// Two lines of machine-readable zone, padded with '<' like a passport.
function mrz(L, info) {
  const d = info.date || new Date();
  const ymd = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate());
  const len = isNarrow(L) ? 30 : 44;
  const model = String(info.modelName || 'CLAUDE').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return [`MC<HUMAN<<CLAUDE<PHOTO<BOOTH`, `${pad(info.serial || 1, 4)}<${ymd}<T07<CTX${L.count}<<${model}`].map((s) => s.padEnd(len, '<').slice(0, len));
}

const nameOf = (info) => info.title || '人类';

// Round rubber stamp: two rings, text around the rim, a spark in the middle.
function seal(ctx, cx, cy, r, seed) {
  const col = 'rgba(201,100,68,0.88)';
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.22);
  ctx.strokeStyle = col;
  ctx.lineWidth = r * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = r * 0.022;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, TAU);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.font = font(600, r * 0.19, 'sans');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = [...SEAL_TEXT];
  const ws = chars.map((c) => ctx.measureText(c).width);
  const total = ws.reduce((a, b) => a + b, 0);
  let a = -Math.PI / 2 - Math.PI * 0.02;
  chars.forEach((c, i) => {
    const da = (ws[i] / total) * TAU;
    ctx.save();
    ctx.rotate(a + da / 2 + Math.PI / 2);
    ctx.fillText(c, 0, -r * 0.83);
    ctx.restore();
    a += da;
  });
  drawSpark(ctx, 0, 0, r * 0.44, { color: col });
  // worn ink
  const rr = rng(seed);
  ctx.fillStyle = PAPER;
  for (let i = 0; i < 46; i++) {
    const ang = rr() * TAU, d = Math.sqrt(rr()) * r * 1.05;
    ctx.globalAlpha = 0.4 + rr() * 0.6;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * d, Math.sin(ang) * d, r * (0.012 + rr() * 0.03), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function plan(L, info) {
  const n = isNarrow(L);
  const S = n ? SPEC.narrow : SPEC.wide;
  const w = L.W - S.M * 2;
  const nameW = w - S.seal * 2.3; // room left of the seal
  const nameLines = Math.min(2, Math.max(1, Math.ceil((ems(nameOf(info)) * S.name) / nameW - 0.04)));
  const y = {};
  y.label = S.band + (n ? 40 : 56);
  y.name = y.label + S.name * (n ? 1.28 : 1.2);
  y.sub = y.name + (nameLines - 1) * S.name * 1.22 + S.sub * (n ? 2.1 : 2.2);
  y.mrz = L.H - (n ? 34 : 50);
  const rows = Math.ceil(6 / S.cols);
  y.grid = y.mrz - S.mrz * 2.2 - (n ? 24 : 36) - rows * S.rowH;
  const top = y.sub + (n ? 28 : 40);
  const box = { x: S.M, y: top, w, h: y.grid - top - (n ? 24 : 36) };
  return { S, w, nameW, nameLines, rows, y, box };
}

export default {
  id: 'card',
  name: '模型卡',
  desc: '给照片里的人类发一张模型卡',

  geometry(L, info) {
    const P = plan(L, info);
    const slots = place(L, P.box, { gap: P.S.gap, hgap: P.S.hgap });
    return { slots: slots.map((s) => ({ ...s, r: isNarrow(L) ? 6 : 8 })), ...P };
  },

  fonts(L, info) {
    const S = isNarrow(L) ? SPEC.narrow : SPEC.wide;
    const f = fields(L, info);
    return [
      [font(600, 40, 'sans'), 'MODEL CARD' + SEAL_TEXT],
      [font(400, 18, 'sansCn'), '模型卡 · Claude 照相馆'],
      [font(500, 18, 'mono'), serialText(info) + mrz(L, info).join('')],
      [font(500, S.label, 'sansCn'), '名称 · NAME' + f.map((x) => x[0] + x[1]).join('')],
      [font(600, S.name, 'serif'), nameOf(info) + '…'],
      [font('italic 400', S.sub, 'serif'), 'Homo sapiens'],
      [font(400, S.sub, 'serif'), ` · 由 Claude ${info.modelName} 评估`],
      [font(400, S.value, 'serif'), f.map((x) => x[2]).join('')],
    ];
  },

  under(ctx, L, G, info) {
    const { S } = G;
    const n = isNarrow(L);
    paper(ctx, L.W, L.H, { base: PAPER, grain: 0.04, mottle: 0.015, seed: info.seed });
    // faint guilloche behind the name, like the security print on a card
    ctx.save();
    ctx.strokeStyle = 'rgba(217,119,87,0.13)';
    ctx.lineWidth = n ? 1 : 1.4;
    const gy = S.band, gh = G.box.y - S.band - (n ? 10 : 16);
    for (let k = 0; k < 9; k++) {
      ctx.beginPath();
      for (let x = 0; x <= L.W; x += 6) {
        const t = x / L.W;
        const yy = gy + gh * (0.5 + 0.36 * Math.sin(t * Math.PI * (n ? 3 : 4) + k * 0.7) * Math.cos(t * Math.PI * 1.3 - k * 0.35));
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
    // ink header band
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, L.W, S.band);
  },

  slot(ctx, s) {
    ctx.save();
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
    ctx.stroke();
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const { S, y, w } = G;
    const n = isNarrow(L);
    const x0 = S.M;
    ctx.save();
    ctx.textBaseline = 'alphabetic';

    // header: spark · MODEL CARD · 模型卡 · serial
    const hy = S.band / 2;
    drawSpark(ctx, x0 + (n ? 16 : 24), hy, n ? 17 : 26);
    ctx.fillStyle = PAPER;
    ctx.font = font(600, n ? 25 : 40, 'sans');
    spaced(ctx, 'MODEL CARD', x0 + (n ? 44 : 68), hy + (n ? 1 : 2), n ? 3 : 5);
    ctx.fillStyle = 'rgba(250,249,245,0.62)';
    ctx.font = font(400, n ? 13 : 18, 'sansCn');
    ctx.fillText('模型卡 · Claude 照相馆', x0 + (n ? 45 : 70), hy + (n ? 27 : 42));
    ctx.textAlign = 'right';
    ctx.font = font(500, n ? 14 : 20, 'mono');
    ctx.fillText(serialText(info), L.W - x0, hy + (n ? 1 : 2));
    ctx.textAlign = 'left';

    // name block
    ctx.fillStyle = MUTED;
    ctx.font = font(500, S.label, 'sansCn');
    spaced(ctx, '名称 · NAME', x0, y.label, n ? 1.5 : 2.5);
    ctx.fillStyle = INK;
    const t = fitLines(ctx, nameOf(info), G.nameW, G.nameLines, { max: S.name, min: Math.round(S.name * 0.6), weight: 600, family: 'serif' });
    t.lines.forEach((ln, i) => ctx.fillText(ln, x0, y.name + i * S.name * 1.22));
    seal(ctx, L.W - x0 - S.seal * 1.08, (S.band + G.box.y) / 2 + (n ? 2 : 4), S.seal, info.seed);
    ctx.fillStyle = MUTED;
    ctx.font = font('italic 400', S.sub, 'serif');
    ctx.fillText('Homo sapiens', x0, y.sub);
    const hw = ctx.measureText('Homo sapiens').width;
    ctx.font = font(400, S.sub, 'serif');
    ctx.fillText(` · 由 Claude ${info.modelName} 评估`, x0 + hw, y.sub);

    // field grid
    const cols = S.cols, cw = w / cols;
    ctx.fillStyle = INK;
    ctx.fillRect(x0, y.grid, w, n ? 2 : 3);
    fields(L, info).forEach(([cn, en, value], i) => {
      const c = i % cols, r = Math.floor(i / cols);
      const cx = x0 + c * cw + (c ? (n ? 14 : 22) : 0);
      const top = y.grid + r * S.rowH;
      if (r) {
        ctx.fillStyle = LINE;
        ctx.fillRect(x0, top, w, 1.5);
      }
      if (c) {
        ctx.fillStyle = LINE;
        ctx.fillRect(x0 + c * cw, top + (n ? 12 : 18), 1.5, S.rowH - (n ? 24 : 36));
      }
      const pad = n ? 14 : 22;
      ctx.fillStyle = MUTED;
      ctx.font = font(500, S.label, 'sansCn');
      const lw = spaced(ctx, cn, cx, top + pad + S.label, n ? 1 : 2);
      if (!n) {
        ctx.font = font(500, S.label * 0.86, 'sansCn');
        spaced(ctx, en, cx + lw + 10, top + pad + S.label, 1.6);
      }
      ctx.fillStyle = BODY;
      const room = cw - (c ? (n ? 14 : 22) : 0) - (n ? 8 : 14);
      fit(ctx, value, room, { max: S.value, min: Math.round(S.value * 0.6), weight: 400, family: 'serif' });
      ctx.fillText(value, cx, top + S.rowH - (n ? 18 : 28));
    });
    ctx.fillStyle = INK;
    ctx.fillRect(x0, y.grid + G.rows * S.rowH, w, n ? 2 : 3);

    // machine-readable zone
    ctx.fillStyle = '#6f6c64';
    const lines = mrz(L, info);
    ctx.font = font(500, S.mrz, 'mono');
    const k = w / ctx.measureText(lines[0]).width;
    ctx.font = font(500, S.mrz * Math.min(1, k), 'mono');
    const sp = k > 1 ? (w - ctx.measureText(lines[0]).width) / (lines[0].length - 1) : 0;
    lines.forEach((ln, i) => spaced(ctx, ln, x0, y.mrz - (1 - i) * S.mrz * 1.35, sp));
    ctx.restore();
  },
};
