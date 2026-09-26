// Canvas text helpers: CJK-aware wrapping and fit-to-width sizing.

import { FAMILY } from './fonts.js';

const CJK = /[⺀-鿿豈-﫿＀-￯　-〿]/;
const NO_START = /^[，。！？、；：”’）》」』】〉…—,.!?;:)\]}%]/;

function tokens(text) {
  const out = [];
  let word = '';
  for (const ch of text) {
    if (CJK.test(ch) || ch === ' ') {
      if (word) out.push(word), (word = '');
      out.push(ch);
    } else word += ch;
  }
  if (word) out.push(word);
  return out;
}

export function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const tk of tokens(para)) {
      const next = line + tk;
      if (line && ctx.measureText(next).width > maxW) {
        if (NO_START.test(tk)) {
          // keep closing punctuation on the line it belongs to
          lines.push(next.trimEnd());
          line = '';
          continue;
        }
        lines.push(line.trimEnd());
        line = tk === ' ' ? '' : tk;
        // a single token wider than the line: hard-break it
        while (ctx.measureText(line).width > maxW && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxW) cut--;
          lines.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      } else line = next;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// Largest size in [min, max] that fits `text` on one line; sets ctx.font.
export function fit(ctx, text, maxW, { max, min = 8, weight = 400, family = 'serif' }) {
  const fam = FAMILY[family] || family;
  let size = max;
  ctx.font = `${weight} ${size}px ${fam}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) size = Math.max(min, Math.floor((size * maxW) / w));
  ctx.font = `${weight} ${size}px ${fam}`;
  return size;
}

// Wrap into at most `maxLines`, shrinking the font until it fits; sets ctx.font.
export function fitLines(ctx, text, maxW, maxLines, { max, min = 8, weight = 400, family = 'serif' }) {
  const fam = FAMILY[family] || family;
  for (let size = max; size >= min; size = Math.floor(size * 0.92)) {
    ctx.font = `${weight} ${size}px ${fam}`;
    const lines = wrap(ctx, text, maxW);
    if (lines.length <= maxLines) return { size, lines };
  }
  ctx.font = `${weight} ${min}px ${fam}`;
  const lines = wrap(ctx, text, maxW);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1] + '…', maxW);
  }
  return { size: min, lines };
}

export function ellipsize(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text.replace(/…$/, '');
  while (t.length && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

// Draw text with manual letter spacing (canvas letterSpacing is not everywhere).
export function spaced(ctx, text, x, y, spacing, align = 'left') {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
  return total;
}
