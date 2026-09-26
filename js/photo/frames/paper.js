// 论文插图: page one of a very serious paper. Your title, you and Claude as
// authors, an abstract, the photos as Figure 1 (an ablation study, naturally)
// and a sideways arXiv-style stamp in the margin.

import { font } from '../../core/fonts.js';
import { fitLines, wrap } from '../../core/text.js';
import { pad } from '../../core/util.js';
import { paper } from '../../art/ink.js';
import { drawSpark } from '../../art/spark.js';
import { place, isNarrow, bounds } from '../layouts.js';

const INK = '#141413';
const BODY = '#2e2d2a';
const MUTED = '#73726c';
const STAMP = '#a3a097';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL = '完整方法';

// Type sizes (sheet px) for wide sheets and for 2-inch strips.
const SPEC = {
  wide: { M: 100, head: 17, title: 50, author: 27, affil: 18, absHead: 22, abs: 21, absIn: 64, cap: 21, label: 19, page: 20, stamp: 30, gap: 26, hgap: 30, below: 44 },
  narrow: { M: 50, head: 13, title: 31, author: 19, affil: 14, absHead: 15, abs: 15, absIn: 0, cap: 15, label: 14, page: 16, stamp: 20, gap: 14, hgap: 14, below: 30 },
};

// Rough width in ems, so the page can be planned before web fonts load.
const ems = (t) => [...t].reduce((n, ch) => n + (CJK.test(ch) ? 1 : ch === ' ' ? 0.26 : 0.56), 0);

// Sub-figure captions: an ablation, from baseline to the full method.
function subLabels(L) {
  const steps = { 3: ['+ 倒数'], 4: ['+ 倒数', '+ 比耶'], 6: ['+ 倒数', '+ 暖光', '+ 比耶', '+ 朋友'] }[L.count] || [];
  const list = ['基线', ...steps, FULL].slice(0, L.count);
  // the hero shot is the result; the small ones are the ablation
  return L.kind === 'hero' ? [FULL, ...list.slice(0, -1)] : list;
}

function copy(L, info) {
  const d = info.date || new Date();
  const labels = subLabels(L).map((t, i) => `(${String.fromCharCode(97 + i)}) ${t}`);
  const best = String.fromCharCode(97 + subLabels(L).indexOf(FULL));
  const narrow = isNarrow(L);
  return {
    head: narrow ? '预印本 · 尚未经过同行评审' : '预印本 · 尚未经过同行评审（但朋友们都说好看）',
    title: info.title || '论大头贴中微笑的涌现',
    you: '你',
    claude: 'Claude',
    affil: ['地球', '一个很长的上下文窗口'],
    absHead: '摘要',
    abs: !narrow
      ? `我们提出一种在「三、二、一」倒数之后稳定诱发人类笑容的方法。在 ${L.count} 张照片上的实验表明，该方法显著优于「说茄子」基线（p < 0.05）。代码与笑容均已开源。`
      : L.count > 3
        ? `我们在 ${L.count} 张照片中观察到了笑容的涌现（p < 0.05）。`
        : `我们提出一种在倒数之后稳定诱发笑容的方法。在 ${L.count} 张照片上，它显著优于「说茄子」基线（p < 0.05）。`,
    capHead: '图 1：',
    cap: narrow
      ? `消融实验。每加入一个组件，笑容都会更明显一些；完整方法 (${best}) 的笑容最为灿烂。`
      : `消融实验。从「说茄子」基线出发，逐一加入各个组件，笑容随之单调增加；完整方法 (${best}) 效果最好，且未观察到过拟合。`,
    labels,
    // "smile/" is not a real arXiv archive, so the number can never point at an actual paper
    stamp: `arXiv:smile/${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(info.serial || 1, 3)}v1   [cs.SMILE]   ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    page: '1',
  };
}

// Vertical plan of the page; everything below the abstract is the figure.
function plan(L, info) {
  const n = isNarrow(L);
  const S = n ? SPEC.narrow : SPEC.wide;
  const t = copy(L, info);
  const colW = L.W - S.M * 2;
  const titleLines = Math.min(3, Math.max(1, Math.ceil((ems(t.title) * S.title) / colW - 0.04)));
  const absW = colW - S.absIn * 2;
  const absLines = Math.max(1, Math.ceil(((ems(t.abs) + (n ? 3 : 0)) * S.abs) / absW - 0.04));
  const capLines = Math.max(1, Math.ceil(((ems(t.cap) + 4) * S.cap) / colW - 0.04));
  const lh = { title: S.title * 1.28, abs: S.abs * 1.65, cap: S.cap * 1.6 };

  const y = {};
  y.head = n ? 40 : 64;
  y.title = y.head + (n ? 60 : 88);
  y.author = y.title + (titleLines - 1) * lh.title + (n ? 44 : 68);
  y.affil = y.author + (n ? 26 : 38);
  if (n) {
    y.absHead = null;
    y.abs = y.affil + 40;
  } else {
    y.absHead = y.affil + 70;
    y.abs = y.absHead + 42;
  }
  const figTop = y.abs + (absLines - 1) * lh.abs + (n ? 34 : 54);
  y.page = L.H - (n ? 36 : 56);
  const capGap = n ? 22 : 30;
  const figBottom = y.page - (n ? 40 : 56) - capLines * lh.cap - capGap;
  const box = { x: S.M, y: figTop, w: colW, h: figBottom - figTop };
  return { S, colW, titleLines, absLines, capLines, lh, y, box, capGap };
}

// Draw [text, font, dy] runs on one line; returns the x where each run starts.
function runs(ctx, parts, x, y, align = 'left') {
  const ws = parts.map(([t, f]) => ((ctx.font = f), ctx.measureText(t).width));
  const total = ws.reduce((a, b) => a + b, 0);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const xs = [];
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  parts.forEach(([t, f, dy = 0], i) => {
    ctx.font = f;
    xs.push(cx);
    ctx.fillText(t, cx, y + dy);
    cx += ws[i];
  });
  ctx.textAlign = prev;
  return { xs, end: cx };
}

// Set a line flush to both edges by spreading the gaps between CJK characters.
function justify(ctx, line, x, y, w, last = false) {
  const tks = line.match(/[⺀-鿿豈-﫿＀-￯　-〿]|[^⺀-鿿豈-﫿＀-￯　-〿]+/g) || [];
  const ws = tks.map((t) => ctx.measureText(t).width);
  const extra = tks.length > 1 ? (w - ws.reduce((a, b) => a + b, 0)) / (tks.length - 1) : 0;
  if (last || extra < 0 || extra > ctx.measureText('中').width * 0.4) return void ctx.fillText(line, x, y);
  let cx = x;
  tks.forEach((t, i) => {
    ctx.fillText(t, cx, y);
    cx += ws[i] + extra;
  });
}

// Wrap with the first line shortened by `indent` (for an inline bold label).
function wrapIndent(ctx, text, maxW, indent) {
  const first = wrap(ctx, text, maxW - indent)[0] || '';
  const rest = text.slice(first.length).trimStart();
  return [first, ...(rest ? wrap(ctx, rest, maxW) : [])];
}

// A paragraph led by a bold label; justified, at most `max` lines.
function para(ctx, label, text, x, y, w, lh, size, max, center = false) {
  const bold = font(600, size, 'serif');
  const reg = font(400, size, 'serif');
  ctx.font = bold;
  const lw = ctx.measureText(label).width;
  ctx.font = reg;
  let lines = wrapIndent(ctx, text, w, lw);
  if (lines.length > max) {
    lines = lines.slice(0, max);
    let l = lines[max - 1];
    while (l && ctx.measureText(l + '…').width > w - (max === 1 ? lw : 0)) l = l.slice(0, -1);
    lines[max - 1] = l + '…';
  }
  let x0 = x;
  if (center && lines.length === 1) x0 = x + (w - lw - ctx.measureText(lines[0]).width) / 2;
  ctx.fillStyle = INK;
  ctx.font = bold;
  ctx.fillText(label, x0, y);
  ctx.fillStyle = BODY;
  ctx.font = reg;
  lines.forEach((ln, i) => {
    const ix = i === 0 ? lw : 0;
    justify(ctx, ln, x0 + ix, y + i * lh, w - ix, i === lines.length - 1);
  });
}

export default {
  id: 'paper',
  name: '论文插图',
  desc: '你和 Claude 合写的论文，照片是图 1',

  geometry(L, info) {
    const P = plan(L, info);
    const { gap, hgap, below } = P.S;
    // the figure sits right under the abstract; spare room goes to the page foot
    let slots = place(L, P.box, { gap, hgap, below });
    const dy = P.box.y - bounds(slots).y;
    slots = slots.map((s) => ({ ...s, y: s.y + dy }));
    const fig = bounds(slots);
    return { slots, ...P, capY: fig.y + fig.h + below + P.capGap + P.S.cap * 0.9 };
  },

  fonts(L, info) {
    const t = copy(L, info);
    const S = isNarrow(L) ? SPEC.narrow : SPEC.wide;
    return [
      [font(600, S.title, 'serif'), t.title + t.absHead + t.capHead + '…'],
      [font(500, S.author, 'serif'), t.you + t.claude + '12·'],
      [font(400, S.cap, 'serif'), t.head + t.affil.join('') + '12' + t.abs + t.cap + t.labels.join('') + t.page + '…'],
      [font(400, S.stamp, 'serif'), t.stamp],
    ];
  },

  under(ctx, L, G, info) {
    paper(ctx, L.W, L.H, { base: '#fdfcf8', grain: 0.035, mottle: 0.012, seed: info.seed });
  },

  slot(ctx, s, i, L, G, info) {
    const t = copy(L, info);
    ctx.save();
    ctx.strokeStyle = 'rgba(20,20,19,0.16)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(s.x - 0.75, s.y - 0.75, s.w + 1.5, s.h + 1.5);
    ctx.fillStyle = BODY;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = font(400, G.S.label, 'serif');
    ctx.fillText(t.labels[i] || '', s.x + s.w / 2, s.y + s.h + G.S.below * 0.68);
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const { S, y, colW, lh } = G;
    const n = isNarrow(L);
    const t = copy(L, info);
    const cx = L.W / 2;
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'center';

    // running head
    ctx.fillStyle = MUTED;
    ctx.font = font(400, S.head, 'serif');
    ctx.fillText(t.head, cx, y.head);

    // title
    ctx.fillStyle = INK;
    const tl = fitLines(ctx, t.title, colW, G.titleLines, { max: S.title, min: Math.round(S.title * 0.62), weight: 600, family: 'serif' });
    tl.lines.forEach((ln, i) => ctx.fillText(ln, cx, y.title + i * lh.title));

    // authors, with a small spark where an ORCID badge would go
    const name = font(500, S.author, 'serif');
    const sup = font(400, Math.round(S.author * 0.6), 'serif');
    const up = -S.author * 0.42;
    const sp = S.author * 0.62;
    ctx.fillStyle = INK;
    const a = runs(ctx, [[t.you, name], ['1', sup, up], ['  ·  ', name], [t.claude, name], ['2', sup, up], [' '.repeat(n ? 4 : 5), name]], cx + sp * 0.5, y.author, 'center');
    drawSpark(ctx, a.end - sp * 0.55, y.author - S.author * 0.34, sp * 0.5);

    // affiliations
    ctx.fillStyle = MUTED;
    const af = font(400, S.affil, 'serif');
    const afs = font(400, Math.round(S.affil * 0.68), 'serif');
    const aup = -S.affil * 0.4;
    runs(ctx, [['1', afs, aup], [t.affil[0] + '    ', af], ['2', afs, aup], [t.affil[1], af]], cx, y.affil, 'center');

    // abstract
    ctx.textAlign = 'left';
    if (n) para(ctx, t.absHead + '　', t.abs, S.M, y.abs, colW, lh.abs, S.abs, 2);
    else {
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      ctx.font = font(600, S.absHead, 'serif');
      ctx.fillText(t.absHead, cx, y.absHead);
      ctx.textAlign = 'left';
      ctx.fillStyle = BODY;
      ctx.font = font(400, S.abs, 'serif');
      const w = colW - S.absIn * 2;
      const lines = wrap(ctx, t.abs, w).slice(0, G.absLines + 1);
      lines.forEach((ln, i) => justify(ctx, ln, S.M + S.absIn, y.abs + i * lh.abs, w, i === lines.length - 1));
    }

    // caption under the figure
    para(ctx, t.capHead, t.cap, S.M, G.capY, colW, lh.cap, S.cap, G.capLines + 1, true);

    // page number
    ctx.textAlign = 'center';
    ctx.fillStyle = BODY;
    ctx.font = font(400, S.page, 'serif');
    ctx.fillText(t.page, cx, y.page);

    // the arXiv-ish stamp, reading upwards in the left margin
    ctx.translate(S.M * 0.5 + S.stamp * 0.34, L.H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = STAMP;
    ctx.font = font(400, S.stamp, 'serif');
    ctx.fillText(t.stamp, 0, 0);
    ctx.restore();
  },
};
