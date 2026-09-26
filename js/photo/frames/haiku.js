// 俳句: washi paper, photos in thin ink frames, and Claude's haiku set
// vertically, right to left — a small title column first, the poem in a
// gentle cascade, then the colophon (丙午年秋 Claude 题) and a red seal.

import { font } from '../../core/fonts.js';
import { fit, ellipsize } from '../../core/text.js';
import { rng, TAU } from '../../core/util.js';
import { paper } from '../../art/ink.js';
import { sparkPath } from '../../art/spark.js';
import { place, isNarrow, bounds } from '../layouts.js';
import { HAIKU } from '../../data/copy.js';

const INK = '#1f1e1c';
const SOFT = '#6b6860';
const SEAL = '#b9472d';
const WASHI = '#f8f4ea';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const SIDEWAYS = /[「」『』（）()《》〈〉【】〔〕—–…~～:：;；_-]/; // turned 90° in vertical text
const CORNER = /[，。、．]/; // set in the upper right of their cell
const LEAD = 1.14; // vertical advance of an upright character, in ems
const FALLBACK = '照相馆即景';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';
const SEASONS = '冬春春春夏夏夏秋秋秋冬冬';

// Colophon: the sexagenary year (turning at 立春) and the season.
function colophon(info) {
  const d = info.date || new Date();
  const early = d.getMonth() === 0 || (d.getMonth() === 1 && d.getDate() < 4);
  const i = (((d.getFullYear() - (early ? 1 : 0) - 4) % 60) + 60) % 60;
  return `${STEMS[i % 10]}${BRANCHES[i % 12]}年${early ? '冬' : SEASONS[d.getMonth()]}`;
}

const poemOf = (info) => (info.haiku?.length ? info.haiku : HAIKU[0]);
const titleOf = (info) => info.title || FALLBACK;

// Split text into vertical cells: CJK upright; Latin words and brackets
// turned sideways; spaces become small gaps.
function cells(ctx, text, fs) {
  const out = [];
  let run = '';
  const flush = () => {
    if (run) out.push({ t: run, side: true, h: ctx.measureText(run).width + fs * 0.16 });
    run = '';
  };
  const gap = (h) => out.length && !out[out.length - 1].gap && out.push({ t: '', gap: true, h });
  for (const ch of text) {
    if (SIDEWAYS.test(ch)) {
      flush();
      out.push({ t: ch, side: true, h: Math.max(ctx.measureText(ch).width, fs * 0.5) + fs * 0.08 });
    } else if (ch === '　' || ch === ' ') {
      flush();
      gap(fs * (ch === ' ' ? 0.3 : 0.6));
    } else if (CJK.test(ch)) {
      flush();
      out.push({ t: ch, h: fs * LEAD, corner: CORNER.test(ch) });
    } else run += ch;
  }
  flush();
  return out;
}

const colHeight = (cs) => cs.reduce((a, c) => a + c.h, 0);

// Draw one column of cells, top at y, centred on x.
function column(ctx, cs, x, y, fs) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let cy = y;
  for (const c of cs) {
    if (c.dots) {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.arc(x, cy + c.h / 2 + k * fs * 0.28, fs * 0.07, 0, TAU);
        ctx.fill();
      }
    } else if (c.side) {
      ctx.save();
      ctx.translate(x, cy + c.h / 2);
      ctx.rotate(Math.PI / 2);
      ctx.fillText(c.t, 0, fs * 0.04);
      ctx.restore();
    } else if (c.t) ctx.fillText(c.t, x + (c.corner ? fs * 0.58 : 0), cy + c.h / 2 - (c.corner ? fs * 0.5 : 0));
    cy += c.h;
  }
  return cy;
}

// Break cells into columns no taller than maxH (gaps never start a column).
function columns(cs, maxH) {
  const cols = [[]];
  let h = 0;
  for (const c of cs) {
    if (h + c.h > maxH && cols[cols.length - 1].length) {
      if (c.gap) continue;
      cols.push([]);
      h = 0;
    }
    cols[cols.length - 1].push(c);
    h += c.h;
  }
  return cols;
}

// Small vertical text in at most `max` columns: shrink first, then cut with an ellipsis.
function fitColumns(ctx, text, size, min, maxH, max) {
  for (let fs = size; fs >= min; fs--) {
    ctx.font = font(400, fs, 'serif');
    const cols = columns(cells(ctx, text, fs), maxH);
    if (cols.length <= max) return { fs, cols };
  }
  ctx.font = font(400, min, 'serif');
  const cs = cells(ctx, text, min);
  const dots = { t: '', dots: true, h: min * LEAD };
  while (cs.length && columns([...cs, dots], maxH).length > max) cs.pop();
  while (cs.length && (cs[cs.length - 1].gap || cs[cs.length - 1].corner)) cs.pop();
  return { fs: min, cols: columns([...cs, dots], maxH) };
}

// Square seal with rough edges and a spark knocked out in paper colour.
function seal(ctx, cx, cy, s, seed) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((r() - 0.5) * 0.07);
  const j = s * 0.014;
  const edge = [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]];
  ctx.beginPath();
  edge.forEach(([x0, y0, x1, y1]) => {
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      ctx.lineTo(((x0 + (x1 - x0) * t) * s) / 2 + (r() - 0.5) * j * 2, ((y0 + (y1 - y0) * t) * s) / 2 + (r() - 0.5) * j * 2);
    }
  });
  ctx.closePath();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = SEAL;
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = WASHI;
  ctx.globalAlpha = 0.94;
  ctx.fill(sparkPath(0, 0, s * 0.3, { rot: 0.1 }));
  ctx.lineWidth = s * 0.035;
  ctx.strokeStyle = WASHI;
  ctx.strokeRect(-s * 0.39, -s * 0.39, s * 0.78, s * 0.78);
  // worn ink
  for (let i = 0; i < 36; i++) {
    ctx.globalAlpha = 0.25 + r() * 0.6;
    ctx.beginPath();
    ctx.arc((r() - 0.5) * s, (r() - 0.5) * s, s * (0.006 + r() * 0.02), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

export default {
  id: 'haiku',
  name: '俳句',
  desc: '和纸、细墨线，Claude 竖写一首小诗',

  geometry(L) {
    const n = isNarrow(L);
    const band = n ? (L.count > 3 ? 410 : 480) : 540;
    const top = n ? 54 : 84, side = n ? 52 : 84;
    const box = { x: side, y: top, w: L.W - side * 2, h: L.H - top - band };
    let slots = place(L, box, { gap: n ? 30 : 48, hgap: n ? 30 : 48 });
    const dy = top - bounds(slots).y;
    slots = slots.map((s) => ({ ...s, y: s.y + dy }));
    const b = bounds(slots);
    const py = b.y + b.h + (n ? 50 : 70);
    return { slots, poem: { x: side, y: py, w: L.W - side * 2, h: L.H - py - (n ? 50 : 76) } };
  },

  fonts(L, info) {
    return [
      [font(400, 60, 'serif'), poemOf(info).join('') + titleOf(info) + colophon(info) + 'Claude 题'],
      [font(400, 30, 'serif'), titleOf(info) + '—　' + poemOf(info).join(' ')],
    ];
  },

  under(ctx, L, G, info) {
    paper(ctx, L.W, L.H, { base: WASHI, grain: 0.045, fibers: 1.8, mottle: 0.03, seed: info.seed });
  },

  slot(ctx, s, i, L) {
    const n = isNarrow(L);
    const o = n ? 7 : 10;
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = n ? 1.5 : 2;
    ctx.strokeRect(s.x - o, s.y - o, s.w + o * 2, s.h + o * 2);
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.strokeRect(s.x - 0.5, s.y - 0.5, s.w + 1, s.h + 1);
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const P = G.poem;
    const lines = poemOf(info);
    const n = isNarrow(L);
    ctx.save();
    ctx.fillStyle = INK;

    // Size the poem so the longest line (plus the cascade) fills the band.
    const maxChars = Math.max(...lines.map((l) => [...l].length));
    const drop = 0.55; // each column starts a little lower than the last
    let fs = Math.min(n ? 50 : 60, P.h / (maxChars * LEAD + drop * (lines.length - 1)));
    const vertical = fs >= (n ? 30 : 38);

    if (vertical) {
      const step = fs * 1.85;
      const ts = Math.max(n ? 15 : 20, fs * 0.42);
      const title = fitColumns(ctx, titleOf(info), ts, n ? 12 : 16, P.h, 2);
      ctx.font = font(400, ts, 'serif');
      const ccols = columns(cells(ctx, `${colophon(info)}　Claude 题`, ts), P.h * 0.72);
      const sealS = Math.max(ts * 2.4, fs * 1.02);
      const tw = title.cols.length * title.fs * 1.5;
      const cw = ccols.length * ts * 1.5;
      const total = tw + fs * 0.7 + lines.length * step + fs * 0.1 + Math.max(cw, sealS);
      let x = P.x + P.w / 2 + total / 2; // right edge of the group

      // title, top right
      ctx.fillStyle = SOFT;
      ctx.font = font(400, title.fs, 'serif');
      title.cols.forEach((c, i) => column(ctx, c, x - title.fs * 0.75 - i * title.fs * 1.5, P.y, title.fs));
      x -= tw + fs * 0.7;

      // the poem, right to left
      ctx.fillStyle = INK;
      ctx.font = font(400, fs, 'serif');
      let bottom = P.y;
      lines.forEach((ln, i) => {
        bottom = Math.max(bottom, column(ctx, cells(ctx, ln, fs), x - step * (i + 0.5), P.y + fs * (0.35 + drop * i), fs));
      });
      x -= lines.length * step + fs * 0.1;

      // colophon ending near the foot of the poem, seal beneath it
      ctx.fillStyle = SOFT;
      ctx.font = font(400, ts, 'serif');
      const ch = Math.max(...ccols.map(colHeight));
      const cx = x - Math.max(cw, sealS) / 2;
      const cy = Math.max(P.y + fs * 1.4, Math.min(bottom - ch - sealS * 0.6, P.y + P.h - ch - sealS * 1.25));
      ccols.forEach((c, i) => column(ctx, c, cx + (ccols.length - 1) * ts * 0.75 - i * ts * 1.5, cy, ts));
      seal(ctx, cx, cy + ch + sealS * 0.72, sealS, info.seed);
    } else {
      // too long for columns: centred lines, then the colophon and the seal
      fs = Math.min(n ? 30 : 40, P.h / (lines.length * 1.7 + 3.4));
      const lh = fs * 1.7;
      const cx = L.W / 2;
      const y0 = P.y + (P.h - fs * (lines.length * 1.7 + 2.4)) / 2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = SOFT;
      const t = `— ${titleOf(info)} —`;
      fit(ctx, t, P.w, { max: fs * 0.62, min: 10, weight: 400, family: 'serif' });
      ctx.fillText(ellipsize(ctx, t, P.w), cx, y0 + fs * 0.6);
      ctx.fillStyle = INK;
      lines.forEach((ln, i) => {
        fit(ctx, ln, P.w, { max: fs, min: 10, weight: 400, family: 'serif' });
        ctx.fillText(ln, cx, y0 + fs * 2 + i * lh);
      });
      const sy = y0 + fs * 2 + (lines.length - 0.2) * lh;
      ctx.fillStyle = SOFT;
      ctx.font = font(400, fs * 0.6, 'serif');
      ctx.textAlign = 'right';
      ctx.fillText(`${colophon(info)}　Claude 题`, cx + fs * 2.4, sy);
      seal(ctx, cx + fs * 3.5, sy - fs * 0.22, fs * 1.3, info.seed);
    }
    ctx.restore();
  },
};
