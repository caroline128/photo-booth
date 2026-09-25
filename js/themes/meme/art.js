// Art for the meme booth (抽象表情包机): goofy dress-up props, hot-word /
// symbol / mascot stickers, three layouts that leave room for big captions and
// five meme-template frames. Everything is original and drawn in code — the
// 团子 mascot and the cartoon dog are our own characters, the captions are
// generic internet slang. Ids are prefixed "meme-" (bitmap caches are keyed
// by id, so they must not collide with other machines).

import { svg, sparkleD, burstD, textSticker, rng } from '../../art/kit.js';
import { stamp, rrect, canvas as mkCanvas, TAU } from '../../core/util.js';

// ----------------------------------------------------------------- type

/** The heavy caption face (Noto Sans SC 900 = the classic meme look). */
export const HEAVY = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
export const CAPTION_FONT = `900 100px ${HEAVY}`;
const PIXEL = '"Press Start 2P", "VT323", monospace';
const COMIC = '"Bangers", "Noto Sans SC", sans-serif';
const LED = '"VT323", "Press Start 2P", monospace';
const INK = '#141414';

/** Ask for glyphs the canvas is about to draw (CJK web fonts download per character range). */
export function warm(font, text) {
  const fonts = typeof document !== 'undefined' ? document.fonts : null;
  if (!fonts?.check || !text) return;
  try {
    if (!fonts.check(font, text)) fonts.load(font, text).catch(() => {});
  } catch {
    /* unsupported font string */
  }
}

const n1 = (v) => Math.round(v * 10) / 10;

// ----------------------------------------------------------------- captions

const BREAK = /[\s，,。！!？?、~～：:…]/;

/** Split a caption in two near the middle (after punctuation when there is some). */
function twoLines(text) {
  const ch = [...text];
  if (ch.length < 4) return null;
  const mid = ch.length / 2;
  let at = Math.round(mid);
  let best = Infinity;
  ch.forEach((c, i) => {
    const d = Math.abs(i + 1 - mid);
    if (BREAK.test(c) && d < best && d <= ch.length / 4) {
      best = d;
      at = i + 1;
    }
  });
  const a = ch.slice(0, at).join('').trim();
  const b = ch.slice(at).join('').trim();
  return a && b ? [a, b] : null;
}

/** One or two lines — whichever lets the text be biggest inside w×h (one line wins ties). */
function fitLines(ctx, text, w, h, font, { maxFs, lh, padEm }) {
  ctx.font = font(100);
  const em = (l) => ctx.measureText(l).width / 100;
  const forced = text.split('\n').filter(Boolean);
  const cands = forced.length > 1 ? [forced.slice(0, 2)] : [[text], twoLines(text)].filter(Boolean);
  let best = null;
  for (const lines of cands) {
    const fs = Math.min(maxFs, w / (Math.max(...lines.map(em)) + padEm), h / (lines.length * lh + padEm * 0.5));
    const score = lines.length === 1 ? fs * 1.2 : fs;
    if (!best || score > best.score) best = { lines, fs, score };
  }
  return best;
}

/**
 * The meme caption: heavy text with thick outline(s), shrunk to fit `box`,
 * one or two lines. st: { fill, gradient, stroke, strokeEm, outer: [[color, em]],
 * shadow: [color, dxEm, dyEm], family, weight, maxFs, lh, valign, rot }
 */
export function memeText(ctx, raw, box, st = {}) {
  const text = String(raw || '').replace(/\s*\n\s*/g, '\n').trim();
  if (!text) return null;
  const family = st.family || HEAVY;
  const weight = st.weight || 900;
  const font = (fs) => `${weight} ${fs}px ${family}`;
  warm(font(100), text);
  const strokeEm = st.stroke ? st.strokeEm ?? 0.2 : 0;
  const outer = [...(st.outer || [])].sort((a, b) => b[1] - a[1]);
  const padEm = Math.max(strokeEm, outer[0]?.[1] || 0);
  const lh = st.lh || 1.1;
  const fit = fitLines(ctx, text, box.w, box.h, font, { maxFs: st.maxFs || box.h, lh, padEm });
  const fs = Math.max(8, Math.floor(fit.fs));
  const { lines } = fit;
  const blockH = fs * lh * lines.length;
  const edge = (fs * padEm) / 2;
  let top = box.y + box.h - blockH - edge * 0.5;
  if (st.valign === 'top') top = box.y + edge;
  else if (st.valign === 'middle') top = box.y + (box.h - blockH) / 2;
  const cx = box.x + box.w / 2;
  const ys = lines.map((_, i) => top + fs * lh * (i + 0.5));
  ctx.save();
  if (st.rot) {
    const cy = top + blockH / 2;
    ctx.translate(cx, cy);
    ctx.rotate(st.rot);
    ctx.translate(-cx, -cy);
  }
  ctx.font = font(fs);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const each = (fn) => lines.forEach((l, i) => fn(l, ys[i]));
  if (st.shadow) {
    const [c, dx, dy] = st.shadow;
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    ctx.lineWidth = fs * padEm;
    each((l, y) => {
      if (padEm) ctx.strokeText(l, cx + fs * dx, y + fs * dy);
      ctx.fillText(l, cx + fs * dx, y + fs * dy);
    });
  }
  for (const [c, em] of outer) {
    ctx.strokeStyle = c;
    ctx.lineWidth = fs * em;
    each((l, y) => ctx.strokeText(l, cx, y));
  }
  if (strokeEm) {
    ctx.strokeStyle = st.stroke;
    ctx.lineWidth = fs * strokeEm;
    each((l, y) => ctx.strokeText(l, cx, y));
  }
  each((l, y) => {
    if (st.gradient) {
      const g = ctx.createLinearGradient(0, y - fs * 0.42, 0, y + fs * 0.42);
      st.gradient.forEach((c, j, a) => g.addColorStop(j / (a.length - 1), c));
      ctx.fillStyle = g;
    } else ctx.fillStyle = st.fill || '#fff';
    ctx.fillText(l, cx, y);
  });
  ctx.restore();
  return { fs, lines, top, bottom: top + blockH };
}

/** Chunky bitmap text: drawn tiny, alpha-thresholded, then blown up without smoothing. */
function pixelText(ctx, raw, box, { color = '#fff', shadow = null, family = HEAVY, weight = 700, maxScale = 8 } = {}) {
  const text = String(raw || '').trim();
  if (!text) return null;
  warm(`${weight} 16px ${family}`, text);
  const m = mkCanvas(4, 4).getContext('2d');
  let best = null;
  for (const glyph of [16, 14, 12]) {
    const font = `${weight} ${glyph}px ${family}`;
    m.font = font;
    for (const lines of [[text], twoLines(text)].filter(Boolean)) {
      const tw = Math.ceil(Math.max(...lines.map((l) => m.measureText(l).width))) + 2;
      const th = Math.ceil(glyph * 1.2 * lines.length) + 2;
      const scale = Math.min(maxScale, Math.floor(Math.min(box.w / tw, box.h / th)));
      if (scale < 1) continue;
      const size = glyph * scale * (lines.length === 1 ? 1.15 : 1);
      if (!best || size > best.size) best = { font, glyph, lines, tw, th, scale, size };
    }
  }
  if (!best) return null;
  const bake = (col) => {
    const c = mkCanvas(best.tw, best.th);
    const x = c.getContext('2d');
    x.font = best.font;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillStyle = col;
    best.lines.forEach((l, i) => x.fillText(l, best.tw / 2, 1 + best.glyph * 1.2 * (i + 0.5)));
    const img = x.getImageData(0, 0, c.width, c.height);
    for (let i = 3; i < img.data.length; i += 4) img.data[i] = img.data[i] > 110 ? 255 : 0;
    x.putImageData(img, 0, 0);
    return c;
  };
  const { tw, th, scale } = best;
  const dw = tw * scale;
  const dh = th * scale;
  const dx = Math.round(box.x + (box.w - dw) / 2);
  const dy = Math.round(box.y + (box.h - dh) / 2);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (shadow) ctx.drawImage(bake(shadow), dx + scale, dy + scale, dw, dh);
  ctx.drawImage(bake(color), dx, dy, dw, dh);
  ctx.restore();
  return { scale, x: dx, y: dy, w: dw, h: dh };
}

/** Caption for this photo; before the 配字 step (frame picker etc.) show the defaults. */
function captionFor(info) {
  const list = info.captions?.length ? info.captions : info.theme?.sampleCaptions || [];
  return list[info.photoIndex ?? 0] || '';
}

const dateText = (info) => stamp(info.date || new Date());
const serialText = (info) => `No.${String(info.serial || 0).padStart(6, '0')}`;

// ----------------------------------------------------------------- canvas bits

/** Scale unit: 1 for a 9-grid photo. */
const unit = (s) => s.w / 340;

/** Rounded-rect sub-path (no beginPath, so it can be combined for even-odd fills). */
function rpath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Comic halftone dots. */
function dots(ctx, x0, y0, w, h, step, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let y = y0, row = 0; y < y0 + h + step; y += step * 0.866, row++) {
    for (let x = x0 + ((row % 2) * step) / 2; x < x0 + w + step; x += step) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  }
  ctx.fill();
}

/** Diagonal stripes over the whole sheet. */
function stripes(ctx, W, H, colors, sw) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 4);
  const R = Math.hypot(W, H) / 2 + sw;
  for (let x = -R, k = 0; x < R; x += sw, k++) {
    ctx.fillStyle = colors[k % colors.length];
    ctx.fillRect(x, -R, sw + 1, R * 2);
  }
  ctx.restore();
}

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.fill(new Path2D(sparkleD(x, y, r)));
}

const GEMS = [
  ['#ffd1e8', '#ff3d9a'],
  ['#d4f6ff', '#1aa9e8'],
  ['#fff3b8', '#e3a600'],
  ['#eadcff', '#8b4dff'],
];

/** A rhinestone: shiny ball in a silver setting. */
function gem(ctx, x, y, r, [hi, lo]) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r * 1.05);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.4, hi);
  g.addColorStop(1, lo);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = r * 0.32;
  ctx.strokeStyle = '#cfd2dc';
  ctx.stroke();
}

/** Rhinestones all around a rectangle. */
function gemFrame(ctx, x, y, w, h, r, step, seed = 0) {
  const nx = Math.max(2, Math.round(w / step));
  const ny = Math.max(2, Math.round(h / step));
  let i = seed;
  for (let a = 0; a <= nx; a++) {
    gem(ctx, x + (w * a) / nx, y, r, GEMS[i++ % GEMS.length]);
    gem(ctx, x + (w * a) / nx, y + h, r, GEMS[i++ % GEMS.length]);
  }
  for (let b = 1; b < ny; b++) {
    gem(ctx, x, y + (h * b) / ny, r, GEMS[i++ % GEMS.length]);
    gem(ctx, x + w, y + (h * b) / ny, r, GEMS[i++ % GEMS.length]);
  }
}

/** Black/yellow hazard tape. */
function hazard(ctx, x, y, w, h, band, colors = ['#ffd400', INK]) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = colors[0];
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = colors[1];
  ctx.beginPath();
  for (let sx = x - h; sx < x + w + h; sx += band * 2) {
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + h, y);
    ctx.lineTo(sx + h + band, y);
    ctx.lineTo(sx + band, y + h);
    ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

/** ⚠ sign. */
function warnSign(ctx, cx, cy, s, fill = '#ffd400', ink = INK) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.48);
  ctx.lineTo(cx - s * 0.6, cy + s * 0.48);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = s * 0.1;
  ctx.strokeStyle = ink;
  ctx.stroke();
  ctx.fillStyle = ink;
  rrect(ctx, cx - s * 0.055, cy - s * 0.22, s * 0.11, s * 0.42, s * 0.05);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.32, s * 0.07, 0, TAU);
  ctx.fill();
  ctx.restore();
}

/** Pixel-art rectangle with stepped corners (1 or 2 steps). */
function pxRect(ctx, x, y, w, h, p, color, steps = 1) {
  ctx.fillStyle = color;
  if (steps > 1) {
    ctx.fillRect(x + p * 2, y, w - p * 4, h);
    ctx.fillRect(x + p, y + p, w - p * 2, h - p * 2);
    ctx.fillRect(x, y + p * 2, w, h - p * 4);
  } else {
    ctx.fillRect(x + p, y, w - p * 2, h);
    ctx.fillRect(x, y + p, w, h - p * 2);
  }
}

/** Pixel art from strings; `palette` maps characters to colours. */
function pxDraw(ctx, rows, x, y, p, palette) {
  rows.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (!palette[ch]) return;
      ctx.fillStyle = palette[ch];
      ctx.fillRect(Math.round(x + i * p), Math.round(y + j * p), Math.ceil(p), Math.ceil(p));
    });
  });
}

/** Same pixel art as SVG (one path per colour, merged runs). */
function pxSvg(rows, palette, u) {
  const paths = {};
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const ch = row[x];
      let len = 1;
      while (row[x + len] === ch) len++;
      if (palette[ch]) (paths[ch] ||= []).push(`M${x * u} ${y * u}h${len * u}v${u}h${-len * u}Z`);
      x += len;
    }
  });
  return Object.entries(paths)
    .map(([ch, d]) => `<path d="${d.join('')}" fill="${palette[ch]}" shape-rendering="crispEdges"/>`)
    .join('');
}

const PX_HEART = ['.BBB.BBB.', 'BRRWBRRRB', 'BRWRRRRRB', 'BRRRRRRRB', '.BRRRRRB.', '..BRRRB..', '...BRB...', '....B....'];
const PX_COIN = ['.BBBB.', 'BYYWYB', 'BYBBYB', 'BYBBYB', 'BYYYYB', '.BBBB.'];
const PX_STAR = ['..W..', '.WWW.', 'WWWWW', '.WWW.', '..W..'];

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js (units = eye distance d)

const AFRO_BANDS = [
  ['#ff4d6d', '#c21f45'],
  ['#ff9f1c', '#c96a00'],
  ['#ffd60a', '#c79f00'],
  ['#3ddc84', '#1c9c57'],
  ['#38b6ff', '#1a7cc2'],
  ['#9b5de5', '#6a31b3'],
];

/** Rainbow party afro: a cloud of curls with a face-shaped hole. 100 units = 1 d. */
function afroSvg() {
  const r = rng(7);
  const curls = [];
  for (let row = 0, y = 26; y < 350; y += 26, row++) {
    for (let x = 20 + (row % 2) * 13; x < 402; x += 26) {
      const cx = x + (r() - 0.5) * 8;
      const cy = y + (r() - 0.5) * 8;
      const blob = ((cx - 210) / 188) ** 2 + ((cy - 168) / 146) ** 2 < 1;
      const side = cy > 168 && cy < 338 && Math.abs(cx - 210) > 106 && Math.abs(cx - 210) < 176;
      if (blob || side) curls.push({ x: cx, y: cy, r: 19 + r() * 7, b: Math.min(5, Math.max(0, Math.floor((cy - 6) / 56))) });
    }
  }
  const outline = curls.map((c) => `<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(c.r + 5)}"/>`).join('');
  const body = curls
    .map((c) => `<circle cx="${n1(c.x)}" cy="${n1(c.y)}" r="${n1(c.r)}" fill="${AFRO_BANDS[c.b][0]}" stroke="${AFRO_BANDS[c.b][1]}" stroke-width="2.5"/>`)
    .join('');
  const swirls = curls
    .map((c) => `<path d="M${n1(c.x - c.r * 0.4)} ${n1(c.y + c.r * 0.05)}a${n1(c.r * 0.36)} ${n1(c.r * 0.36)} 0 1 1 ${n1(c.r * 0.36)} ${n1(c.r * 0.36)}" stroke="${AFRO_BANDS[c.b][1]}"/>`)
    .join('');
  const hole = 'M112 362 L112 292 C112 258 150 238 210 238 C270 238 308 258 308 292 L308 362 Z';
  return svg(
    420,
    360,
    `<g mask="url(#cut)"><g fill="#2b1433">${outline}</g>${body}<g fill="none" stroke-width="3.2" stroke-linecap="round">${swirls}</g>
      <g fill="#fff" opacity=".45"><circle cx="150" cy="60" r="7"/><circle cx="262" cy="78" r="5"/><circle cx="96" cy="126" r="5"/></g></g>
     <path d="M112 338 L112 292 C112 258 150 238 210 238 C270 238 308 258 308 292 L308 338" fill="none" stroke="#2b1433" stroke-width="7" stroke-linecap="round"/>`,
    `<mask id="cut"><rect width="420" height="360" fill="#fff"/><path d="${hole}" fill="#000"/></mask>`,
  );
}

const SHADES = [
  '#######################',
  '#WW#######...#WW#######',
  '.#WW#####.....#WW#####.',
  '..######.......######..',
];

/** Original cartoon dog (floppy ears, tongue out) — covers the whole head. 100 units = 1 d. */
const DOG_SVG = svg(
  360,
  380,
  `<g stroke="#4a2c14" stroke-width="7" stroke-linejoin="round">
    <path d="M92 66 C44 56 12 118 18 202 C22 248 54 264 74 236 C92 208 98 152 116 110 Z" fill="#8f5a2c"/>
    <path d="M268 66 C316 56 348 118 342 202 C338 248 306 264 286 236 C268 208 262 152 244 110 Z" fill="#8f5a2c"/>
    <path d="M180 8 C272 8 330 76 330 172 C330 256 302 310 268 340 C240 364 210 374 180 374 C150 374 120 364 92 340 C58 310 30 256 30 172 C30 76 88 8 180 8 Z" fill="#f2b660"/>
  </g>
  <path d="M60 110 C50 150 60 190 70 214" stroke="#fff" stroke-width="9" fill="none" opacity=".3" stroke-linecap="round"/>
  <ellipse cx="180" cy="116" rx="44" ry="72" fill="#f8d08f"/>
  <ellipse cx="180" cy="292" rx="94" ry="66" fill="#fff4df" stroke="#4a2c14" stroke-width="6"/>
  <g fill="#ff8fa3" opacity=".75"><ellipse cx="86" cy="262" rx="22" ry="12"/><ellipse cx="274" cy="262" rx="22" ry="12"/></g>
  <g stroke="#4a2c14" stroke-width="7" stroke-linecap="round" fill="none"><path d="M104 158 Q126 146 150 140"/><path d="M210 140 Q234 146 256 158"/></g>
  <g fill="#2b1a10"><ellipse cx="128" cy="198" rx="17" ry="22"/><ellipse cx="232" cy="198" rx="17" ry="22"/></g>
  <g fill="#fff"><circle cx="122" cy="189" r="6.5"/><circle cx="226" cy="189" r="6.5"/><circle cx="133" cy="208" r="3"/><circle cx="237" cy="208" r="3"/></g>
  <path d="M150 246 C150 228 210 228 210 246 C210 264 192 274 180 274 C168 274 150 264 150 246 Z" fill="#2b1a10"/>
  <ellipse cx="168" cy="240" rx="10" ry="5" fill="#fff" opacity=".8"/>
  <path d="M188 308 C186 344 228 348 228 314 C228 306 218 302 210 306 C204 302 194 302 188 308 Z" fill="#ff6f91" stroke="#4a2c14" stroke-width="5" stroke-linejoin="round"/>
  <path d="M209 309 L210 330" stroke="#d94a6c" stroke-width="3" stroke-linecap="round"/>
  <path d="M180 274 L180 298 M144 302 Q162 320 180 300 Q198 320 216 302" fill="none" stroke="#4a2c14" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
);

const DROP_D = 'M50 6 C58 30 92 62 92 94 C92 118 73 134 50 134 C27 134 8 118 8 94 C8 62 42 30 50 6 Z';

/** Blue manga sweat drop, 100×140 box. */
function dropSvg(x, y, s, rot = 0) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-50 -70)">
    <path d="${DROP_D}" fill="#8fd8ff" stroke="#1f6fb2" stroke-width="6" stroke-linejoin="round"/>
    <path d="M30 86 C28 100 34 112 46 117" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>
    <circle cx="64" cy="64" r="5" fill="#fff" opacity=".8"/></g>`;
}

/** Outlined question mark centred at (x, y); s ≈ half its height. */
function qmarkSvg(x, y, s, rot, fill, line = INK) {
  const d = `M${n1(-0.55 * s)} ${n1(-0.42 * s)}C${n1(-0.55 * s)} ${n1(-1.12 * s)} ${n1(0.62 * s)} ${n1(-1.18 * s)} ${n1(0.6 * s)} ${n1(-0.5 * s)}C${n1(0.58 * s)} ${n1(-0.1 * s)} 0 ${n1(-0.06 * s)} 0 ${n1(0.3 * s)}`;
  const w = n1(0.34 * s);
  const dy = n1(0.9 * s);
  return `<g transform="translate(${x} ${y}) rotate(${rot})" stroke-linecap="round" stroke-linejoin="round">
    <path d="${d}" fill="none" stroke="${line}" stroke-width="${w + 10}"/><circle cy="${dy}" r="${n1(0.18 * s + 5)}" fill="${line}"/>
    <path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}"/><circle cy="${dy}" r="${n1(0.18 * s)}" fill="${fill}"/></g>`;
}

/** Outlined exclamation mark. */
function bangSvg(x, y, s, rot, fill, line = INK) {
  const bar = `M${n1(-0.22 * s)} ${n1(-1.1 * s)}L${n1(0.22 * s)} ${n1(-1.1 * s)}L${n1(0.11 * s)} ${n1(0.3 * s)}L${n1(-0.11 * s)} ${n1(0.3 * s)}Z`;
  return `<g transform="translate(${x} ${y}) rotate(${rot})" stroke-linejoin="round" stroke="${line}" stroke-width="8" fill="${fill}">
    <path d="${bar}"/><circle cy="${n1(0.72 * s)}" r="${n1(0.2 * s)}"/></g>`;
}

export const props = [
  {
    id: 'meme-afro',
    name: '彩虹爆炸头',
    anchor: 'crown',
    w: 3.9,
    dy: 0.02,
    origin: [0.5, 0.52],
    svg: afroSvg(),
  },
  {
    id: 'meme-shades',
    name: '像素墨镜',
    anchor: 'eyes',
    w: 2.15,
    dy: 0.02,
    origin: [0.5, 0.5],
    svg: svg(460, 80, pxSvg(SHADES, { '#': '#111111', W: '#ffffff' }, 20)),
  },
  {
    id: 'meme-dog',
    name: '狗头头套',
    anchor: 'eyes',
    w: 3.6,
    origin: [0.5, 0.52],
    svg: DOG_SVG,
  },
  {
    id: 'meme-clownnose',
    name: '小丑鼻',
    anchor: 'nose',
    w: 0.62,
    dy: 0.02,
    origin: [0.5, 0.55],
    svg: svg(
      100,
      100,
      `<circle cx="50" cy="52" r="44" fill="url(#g)" stroke="#6e0000" stroke-width="5"/>
      <ellipse cx="34" cy="34" rx="13" ry="8" fill="#fff" opacity=".85" transform="rotate(-35 34 34)"/>
      <circle cx="56" cy="27" r="4" fill="#fff" opacity=".7"/>`,
      `<radialGradient id="g" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ff8080"/><stop offset=".6" stop-color="#ee1c25"/><stop offset="1" stop-color="#a30010"/></radialGradient>`,
    ),
  },
  {
    id: 'meme-sweat',
    name: '大汗珠',
    anchor: 'forehead',
    w: 0.46,
    dx: 1.02,
    dy: -0.08,
    rot: 0.25,
    origin: [0.5, 0.5],
    svg: svg(100, 140, dropSvg(50, 70, 1)),
  },
  {
    id: 'meme-qmarks',
    name: '头顶问号',
    anchor: 'above',
    w: 2.3,
    dy: 0.08,
    origin: [0.5, 0.78],
    svg: svg(300, 220, qmarkSvg(58, 142, 44, -18, '#38b6ff') + qmarkSvg(246, 136, 46, 16, '#ffd60a') + qmarkSvg(152, 120, 66, 0, '#ff3b3b')),
  },
  {
    id: 'meme-steam',
    name: '气到冒烟',
    anchor: 'ears',
    pair: true,
    flipPair: true,
    w: 1.25,
    dx: 0.05,
    dy: -0.1,
    origin: [0.1, 0.92],
    svg: (() => {
      const puffs = [
        [20, 150, 12],
        [46, 114, 15],
        [62, 100, 13],
        [60, 124, 12],
        [92, 60, 24],
        [116, 42, 22],
        [130, 66, 18],
        [106, 80, 18],
        [80, 78, 15],
      ];
      const c = (d = 0) => puffs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + d}"/>`).join('');
      return svg(
        150,
        170,
        `<g fill="#7d879c">${c(5)}</g><g fill="#fff">${c()}</g>
        <g fill="none" stroke="#b7bfd0" stroke-width="4" stroke-linecap="round"><path d="M86 52 Q96 44 108 48"/><path d="M110 34 Q120 28 130 34"/><path d="M42 108 Q48 102 56 104"/></g>`,
      );
    })(),
  },
  {
    id: 'meme-tears',
    name: '宽面条泪',
    anchor: 'cheeks',
    pair: true,
    flipPair: true,
    w: 0.62,
    dx: -0.28,
    dy: -0.7,
    origin: [0.5, 0],
    svg: svg(
      70,
      220,
      `<path d="M13 0 L57 0 C60 40 51 80 57 120 C61 150 59 176 55 192 L17 192 C13 176 11 150 15 120 C21 80 11 40 13 0 Z" fill="#8fdcff" stroke="#2a8fd6" stroke-width="5" stroke-linejoin="round"/>
      <path d="M26 12 C29 52 22 92 28 134 C31 156 30 170 28 180" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>
      <g fill="#8fdcff" stroke="#2a8fd6" stroke-width="4"><circle cx="24" cy="205" r="8"/><circle cx="50" cy="212" r="6"/></g>`,
    ),
  },
  {
    id: 'meme-badge',
    name: '打工人工牌',
    anchor: 'neck',
    w: 1.25,
    dy: -0.5,
    origin: [0.5, 0],
    ratio: 1.2,
    fontSpec: { font: `900 100px ${HEAVY}`, text: '打工人工作证' },
    draw(ctx, w) {
      ctx.scale(w / 100, w / 100);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      // lanyard
      ctx.strokeStyle = '#1b3f99';
      ctx.lineWidth = 11;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(50, 36);
      ctx.lineTo(91, 0);
      ctx.stroke();
      ctx.strokeStyle = '#2f6bff';
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.fillStyle = '#c3c9d2';
      ctx.strokeStyle = '#4b4f57';
      ctx.lineWidth = 1.5;
      rrect(ctx, 44, 31, 12, 12, 2.5);
      ctx.fill();
      ctx.stroke();
      // card
      rrect(ctx, 14, 40, 72, 78, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = '#2f6bff';
      ctx.fillRect(14, 40, 72, 17);
      ctx.restore();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = INK;
      rrect(ctx, 14, 40, 72, 78, 6);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.font = `900 9px ${HEAVY}`;
      ctx.fillText('工作证', 50, 49);
      // photo + name bars
      ctx.fillStyle = '#dfe7f3';
      ctx.fillRect(20, 62, 24, 28);
      ctx.fillStyle = '#8fa3c2';
      ctx.beginPath();
      ctx.arc(32, 72, 5.5, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(32, 90, 10, 8, 0, Math.PI, TAU);
      ctx.fill();
      ctx.fillStyle = '#c9d3e3';
      ctx.fillRect(49, 64, 30, 5);
      ctx.fillRect(49, 74, 22, 5);
      ctx.fillRect(49, 84, 27, 5);
      ctx.fillStyle = INK;
      ctx.font = `900 17px ${HEAVY}`;
      ctx.fillText('打工人', 50, 103);
      for (let i = 0; i < 18; i++) ctx.fillRect(22 + i * 3.1, 111, i % 3 ? 1.2 : 2, 4);
    },
  },
  {
    id: 'meme-sprout',
    name: '头顶长草',
    anchor: 'crown',
    w: 0.95,
    dy: -0.28,
    rot: 0.18,
    origin: [0.5, 1],
    svg: svg(
      120,
      150,
      `<path d="M60 146 C58 120 64 100 58 72" stroke="#1f7a33" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M58 76 C46 44 18 36 8 44 C14 70 38 84 58 76 Z" fill="#6fdc5a" stroke="#1f7a33" stroke-width="5" stroke-linejoin="round"/>
      <path d="M60 70 C66 30 98 16 114 22 C112 52 86 72 60 70 Z" fill="#8ff06e" stroke="#1f7a33" stroke-width="5" stroke-linejoin="round"/>
      <path d="M22 50 C34 54 44 62 52 72 M104 28 C90 36 76 50 66 64" stroke="#1f7a33" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="38" y="134" width="44" height="11" rx="5.5" fill="#ff4f9a" stroke="${INK}" stroke-width="3"/>`,
    ),
  },
];

// ----------------------------------------------------------------- stickers

/** Hot-word text sticker: heavy face, fat outline, white die-cut. */
function word(id, text, o = {}) {
  return textSticker({
    id: `meme-w-${id}`,
    name: o.name || text,
    text,
    font: o.font || HEAVY,
    weight: o.weight || 900,
    color: o.color || '#ffffff',
    gradient: o.gradient,
    stroke: o.stroke === undefined ? INK : o.stroke,
    strokeWidth: o.sw ?? 0.2,
    shadowColor: o.shadowColor,
    bg: o.bg,
    bgRadius: o.bgRadius,
    bgStroke: o.bgStroke,
    pad: o.pad ?? 0.3,
    letterSpacing: o.ls,
    italic: o.italic,
    size: o.size || 0.22,
    outline: o.outline ?? 0.04,
    outlineColor: o.outlineColor,
    group: '热梗字',
  });
}

/** 团子 — our mochi mascot. `face` is SVG drawn over the body (200×190 box). */
const MOCHI_BODY = 'M100 20 C152 20 188 60 188 110 C188 150 154 172 100 172 C46 172 12 150 12 110 C12 60 48 20 100 20 Z';
const mochiBody = (fill = '#fffaf0') => `<path d="${MOCHI_BODY}" fill="${fill}" stroke="#2b2b2b" stroke-width="6"/>
  <path d="M46 152 C76 164 124 164 154 152" fill="none" stroke="#efe2cc" stroke-width="7" stroke-linecap="round"/>`;
const BLUSH = '<g fill="#ffb3c1" opacity=".85"><ellipse cx="50" cy="124" rx="13" ry="8"/><ellipse cx="150" cy="124" rx="13" ry="8"/></g>';

function mochi(id, name, face, defs = '') {
  return { id: `meme-mochi-${id}`, name, group: '表情', size: 0.2, outline: 0.045, svg: svg(200, 190, mochiBody() + BLUSH + face, defs) };
}

/** Brilliant-cut gem seen from above (for the rhinestone sticker). */
function gemSvg(cx, cy, r, c1, c2, id) {
  const pt = (a, rr) => `${n1(cx + Math.cos(a) * rr)} ${n1(cy + Math.sin(a) * rr)}`;
  const outer = Array.from({ length: 8 }, (_, i) => pt((i * Math.PI) / 4 + Math.PI / 8, r));
  const inner = Array.from({ length: 8 }, (_, i) => pt((i * Math.PI) / 4 + Math.PI / 8, r * 0.55));
  return {
    defs: `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`,
    body: `<path d="M${outer.join('L')}Z" fill="url(#${id})" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M${inner.join('L')}Z" fill="#fff" fill-opacity=".45" stroke="${c2}" stroke-width="2"/>
      <path d="${outer.map((o, i) => `M${o}L${inner[i]}`).join('')}" stroke="${c2}" stroke-width="2" opacity=".75"/>`,
  };
}

const GEM_STICKER = [gemSvg(62, 70, 44, '#ffc2e0', '#ff2e8a', 'a'), gemSvg(128, 96, 30, '#c9f3ff', '#12a5e0', 'b'), gemSvg(126, 34, 20, '#fff2b0', '#e0a100', 'c')];

export const stickers = [
  // --- 热梗字
  word('xiaosi', '笑死', { color: '#ffe600', size: 0.2 }),
  word('emo', 'emo了', { color: '#8fa2ff', size: 0.22 }),
  {
    id: 'meme-w-liekai',
    name: '裂开',
    group: '热梗字',
    size: 0.22,
    outline: 0.04,
    ratio: 0.64,
    fontSpec: { font: `900 100px ${HEAVY}`, text: '裂开' },
    draw(ctx, w, h) {
      const zig = [[0.52, 0], [0.4, 0.2], [0.58, 0.4], [0.42, 0.6], [0.6, 0.8], [0.5, 1]].map(([x, y]) => [x * w, y * h]);
      const text = () => {
        ctx.font = `900 ${h * 0.56}px ${HEAVY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = h * 0.12;
        ctx.strokeStyle = INK;
        ctx.strokeText('裂开', w / 2, h * 0.53);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('裂开', w / 2, h * 0.53);
      };
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(side < 0 ? 0 : w, 0);
        zig.forEach(([x, y]) => ctx.lineTo(x, y));
        ctx.lineTo(side < 0 ? 0 : w, h);
        ctx.closePath();
        ctx.clip();
        ctx.translate(side * w * 0.03, side * h * 0.035);
        ctx.rotate(side * 0.035);
        text();
        ctx.restore();
      }
    },
  },
  word('juele', '绝了', { color: '#ff2d55', stroke: '#fff', sw: 0.16, shadowColor: INK, size: 0.2 }),
  word('male', '麻了', { color: '#c7f0ff', size: 0.2 }),
  word('shuidong', '谁懂啊', { color: '#ff7ab8', size: 0.24 }),
  word('pofang', '破防', { color: '#ff8a00', shadowColor: INK, size: 0.2 }),
  word('iren', 'i人', { color: '#ffffff', stroke: null, bg: '#1d1d1f', bgRadius: 0.5, bgStroke: '#fff', pad: 0.36, size: 0.15 }),
  word('eren', 'e人', { color: '#ffffff', stroke: null, bg: '#ff5a1f', bgRadius: 0.5, bgStroke: INK, pad: 0.36, size: 0.15 }),
  word('dagong', '打工人', { color: '#ffffff', stroke: null, bg: '#2f6bff', bgRadius: 0.22, bgStroke: INK, pad: 0.32, size: 0.22 }),
  {
    id: 'meme-w-moyu',
    name: '摸鱼中',
    group: '热梗字',
    size: 0.26,
    outline: 0.035,
    ratio: 0.36,
    fontSpec: { font: `900 100px ${HEAVY}`, text: '摸鱼中' },
    draw(ctx, w, h) {
      rrect(ctx, h * 0.05, h * 0.05, w - h * 0.1, h * 0.9, h * 0.45);
      ctx.fillStyle = '#16b3a4';
      ctx.fill();
      ctx.lineWidth = h * 0.07;
      ctx.strokeStyle = INK;
      ctx.stroke();
      const fx = h * 0.72;
      const fy = h * 0.5;
      const fr = h * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(fx, fy, fr * 1.3, fr * 0.82, 0, 0, TAU);
      ctx.moveTo(fx - fr * 1.05, fy);
      ctx.lineTo(fx - fr * 1.9, fy - fr * 0.8);
      ctx.lineTo(fx - fr * 1.9, fy + fr * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(fx + fr * 0.62, fy - fr * 0.18, fr * 0.2, 0, TAU);
      ctx.fill();
      ctx.font = `900 ${h * 0.46}px ${HEAVY}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('摸鱼中', h * 1.12, h * 0.53);
    },
  },
  word('yidu', '已读不回', { color: '#5f5f66', stroke: null, bg: '#f1f1f4', bgRadius: 0.3, bgStroke: INK, pad: 0.3, size: 0.26 }),
  {
    id: 'meme-w-status',
    name: '精神状态：良好',
    group: '热梗字',
    size: 0.3,
    outline: 0.035,
    ratio: 0.46,
    fontSpec: { font: `900 100px ${HEAVY}`, text: '精神状态：良好' },
    draw(ctx, w, h) {
      const lw = h * 0.05;
      rrect(ctx, lw, lw, w - lw * 2, h - lw * 2, h * 0.14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = lw;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      ctx.font = `900 100px ${HEAVY}`;
      const a = ctx.measureText('精神状态：').width;
      const b = ctx.measureText('良好').width;
      const fs = Math.min(h * 0.3, (w * 0.84 * 100) / (a + b));
      ctx.font = `900 ${fs}px ${HEAVY}`;
      const x0 = (w - ((a + b) * fs) / 100) / 2;
      ctx.fillStyle = INK;
      ctx.fillText('精神状态：', x0, h * 0.33);
      ctx.fillStyle = '#12b85c';
      ctx.fillText('良好', x0 + (a * fs) / 100, h * 0.33);
      // …but the battery says otherwise
      const bx = w * 0.14;
      const by = h * 0.56;
      const bw = w * 0.56;
      const bh = h * 0.24;
      ctx.lineWidth = h * 0.04;
      rrect(ctx, bx, by, bw, bh, bh * 0.22);
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.fillRect(bx + bw + h * 0.02, by + bh * 0.3, h * 0.05, bh * 0.4);
      ctx.fillStyle = '#ff2d2d';
      ctx.fillRect(bx + h * 0.05, by + h * 0.05, bw * 0.07, bh - h * 0.1);
      ctx.font = `900 ${h * 0.2}px ${HEAVY}`;
      ctx.fillText('1%', bx + bw + h * 0.12, by + bh * 0.54);
    },
  },
  word('666', '666', { font: COMIC, weight: 400, gradient: ['#fff7b0', '#ffd000', '#ff8a00'], sw: 0.14, shadowColor: INK, ls: 0.03, size: 0.2 }),
  word('ok', 'OK', { font: COMIC, weight: 400, color: '#35d45a', sw: 0.14, shadowColor: INK, size: 0.15 }),
  {
    id: 'meme-w-wow',
    name: 'WOW',
    group: '热梗字',
    size: 0.24,
    outline: 0.03,
    ratio: 0.8,
    fontSpec: { font: `400 100px ${COMIC}`, text: 'WOW!' },
    draw(ctx, w, h) {
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(w / 210, h / 170);
      const p = new Path2D(burstD(0, 0, 100, 13, 0.7, 0.2, 5));
      ctx.scale(1, 0.8);
      ctx.fillStyle = '#ffe600';
      ctx.fill(p);
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#e8112d';
      ctx.stroke(p);
      ctx.restore();
      ctx.save();
      ctx.translate(w / 2, h * 0.53);
      ctx.rotate(-0.1);
      ctx.font = `400 ${h * 0.4}px ${COMIC}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = h * 0.07;
      ctx.strokeStyle = INK;
      ctx.strokeText('WOW!', 0, 0);
      ctx.fillStyle = '#ff2d55';
      ctx.fillText('WOW!', 0, 0);
      ctx.restore();
    },
  },

  // --- 符号
  {
    id: 'meme-qqq',
    name: '？？？',
    group: '符号',
    size: 0.2,
    outline: 0.04,
    svg: svg(250, 170, qmarkSvg(50, 96, 48, -14, '#38b6ff') + qmarkSvg(200, 98, 48, 14, '#ffd60a') + qmarkSvg(126, 86, 60, 0, '#ff3b3b')),
  },
  {
    id: 'meme-bang',
    name: '！！！',
    group: '符号',
    size: 0.18,
    outline: 0.04,
    svg: svg(220, 170, bangSvg(48, 104, 56, -14, '#ff3b3b') + bangSvg(172, 104, 56, 14, '#ff3b3b') + bangSvg(110, 96, 66, 0, '#ffd60a')),
  },
  {
    id: 'meme-sweats',
    name: '汗珠',
    group: '符号',
    size: 0.14,
    outline: 0.04,
    svg: svg(160, 170, dropSvg(46, 60, 0.62, -20) + dropSvg(112, 90, 0.8, 12) + dropSvg(52, 132, 0.42, -6)),
  },
  {
    id: 'meme-circle',
    name: '红圈重点',
    group: '符号',
    size: 0.22,
    svg: svg(240, 150, `<path d="M26 76 C22 36 96 14 146 18 C196 22 222 48 216 78 C210 110 154 130 104 128 C52 126 16 106 20 76 C22 58 44 42 72 34" fill="none" stroke="#ff1a1a" stroke-width="10" stroke-linecap="round"/>`),
  },
  {
    id: 'meme-arrow',
    name: '红箭头',
    group: '符号',
    size: 0.18,
    svg: svg(
      200,
      160,
      `<g fill="none" stroke="#ff1a1a" stroke-width="13" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 138 C52 132 92 110 118 84 C136 66 150 48 160 30"/><path d="M124 30 L162 24 L166 62"/></g>`,
    ),
  },
  {
    id: 'meme-fire',
    name: '火',
    group: '符号',
    size: 0.14,
    outline: 0.05,
    svg: svg(
      120,
      160,
      `<path d="M60 6 C70 40 104 56 104 100 C104 136 84 156 60 156 C36 156 16 136 16 102 C16 76 30 62 38 48 C42 70 50 76 56 78 C52 52 50 30 60 6 Z" fill="#ff5a1f" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M62 60 C70 84 88 96 88 118 C88 138 76 148 60 148 C44 148 32 138 32 120 C32 106 40 98 46 90 C48 104 54 108 58 110 C56 92 56 76 62 60 Z" fill="#ffb800"/>
      <path d="M60 100 C66 114 74 122 74 132 C74 142 68 146 60 146 C52 146 46 142 46 132 C46 124 52 118 56 112 Z" fill="#fff3a0"/>`,
    ),
  },
  {
    id: 'meme-bolt',
    name: '闪电',
    group: '符号',
    size: 0.13,
    outline: 0.05,
    svg: svg(
      120,
      170,
      `<path d="M76 6 L22 96 L60 96 L40 164 L104 62 L64 62 L90 6 Z" fill="#ffe600" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M72 18 L40 76" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`,
    ),
  },
  {
    id: 'meme-gems',
    name: '水钻',
    group: '符号',
    size: 0.16,
    outline: 0.05,
    svg: svg(
      180,
      150,
      GEM_STICKER.map((g) => g.body).join('') +
        `<g fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"><path d="${sparkleD(156, 30, 17)}"/><path d="${sparkleD(24, 128, 13)}"/></g>`,
      GEM_STICKER.map((g) => g.defs).join(''),
    ),
  },
  {
    id: 'meme-pxheart',
    name: '像素爱心',
    group: '符号',
    size: 0.13,
    outline: 0.05,
    svg: svg(144, 128, pxSvg(PX_HEART, { B: INK, R: '#ff2d55', W: '#ffffff' }, 16)),
  },
  {
    id: 'meme-bubble',
    name: '对话框',
    group: '符号',
    size: 0.18,
    outline: 0.04,
    svg: svg(
      200,
      150,
      `<path d="M30 12 H170 C186 12 194 20 194 36 V88 C194 104 186 112 170 112 H88 L52 142 L60 112 H30 C14 112 6 104 6 88 V36 C6 20 14 12 30 12 Z" fill="#fff" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <g fill="${INK}"><circle cx="62" cy="62" r="11"/><circle cx="100" cy="62" r="11"/><circle cx="138" cy="62" r="11"/></g>`,
    ),
  },
  {
    id: 'meme-tv',
    name: '复古电视',
    group: '符号',
    size: 0.18,
    outline: 0.045,
    svg: svg(
      180,
      176,
      `<g stroke="${INK}" stroke-width="6" stroke-linecap="round"><path d="M90 42 L56 8"/><path d="M90 42 L126 12"/></g>
      <g fill="#ff4f6d" stroke="${INK}" stroke-width="4"><circle cx="56" cy="8" r="6"/><circle cx="126" cy="12" r="6"/></g>
      <g fill="${INK}"><rect x="32" y="152" width="18" height="16" rx="3"/><rect x="130" y="152" width="18" height="16" rx="3"/></g>
      <rect x="8" y="40" width="164" height="118" rx="22" fill="#ff8a3d" stroke="${INK}" stroke-width="7"/>
      <rect x="22" y="54" width="106" height="88" rx="16" fill="${INK}"/>
      <g clip-path="url(#scr)">${['#ffffff', '#ffe600', '#19d3ff', '#27d36b', '#ff4fd8', '#ff2d2d', '#2f6bff']
        .map((c, i) => `<rect x="${26 + i * 14.3}" y="58" width="15" height="62" fill="${c}"/>`)
        .join('')}<rect x="26" y="120" width="100" height="18" fill="#2a2a2a"/><rect x="26" y="120" width="30" height="18" fill="#fff"/></g>
      <g fill="#ffe0c7" stroke="${INK}" stroke-width="5"><circle cx="150" cy="78" r="11"/><circle cx="150" cy="114" r="11"/></g>
      <g stroke="${INK}" stroke-width="4" stroke-linecap="round"><path d="M150 78 L156 72"/><path d="M150 114 L144 120"/><path d="M140 140 H160"/></g>`,
      `<clipPath id="scr"><rect x="26" y="58" width="100" height="80" rx="12"/></clipPath>`,
    ),
  },

  // --- 表情 (original characters)
  (() => {
    const face = `<g fill="none" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M58 88 L80 100 L58 112"/><path d="M142 88 L120 100 L142 112"/>
        <path d="M78 136 q7 -9 14 0 q7 9 14 0 q7 -9 14 0"/></g>`;
    const cutL = 'M0 0 H104 L92 40 L112 72 L90 104 L112 140 L96 200 H0 Z';
    const cutR = 'M220 0 H104 L92 40 L112 72 L90 104 L112 140 L96 200 H220 Z';
    const inner = mochiBody() + BLUSH + face;
    return {
      id: 'meme-mochi-crack',
      name: '裂开团子',
      group: '表情',
      size: 0.2,
      outline: 0.045,
      svg: svg(
        224,
        200,
        `<g transform="translate(6 4)"><g clip-path="url(#l)" transform="rotate(-6 100 172) translate(-6 0)">${inner}</g>
        <g clip-path="url(#r)" transform="rotate(7 100 172) translate(12 4)">${inner}</g>
        <g fill="#2b2b2b"><path d="M104 12 l6 -10 l4 12 Z"/><path d="M92 184 l-8 10 l12 2 Z"/></g></g>`,
        `<clipPath id="l"><path d="${cutL}"/></clipPath><clipPath id="r"><path d="${cutR}"/></clipPath>`,
      ),
    };
  })(),
  mochi(
    'eyeroll',
    '无语团子',
    `<g stroke="#2b2b2b" stroke-width="5"><ellipse cx="70" cy="98" rx="20" ry="14" fill="#fff"/><ellipse cx="130" cy="98" rx="20" ry="14" fill="#fff"/></g>
    <g fill="#2b2b2b"><path d="M58 92 A12 8 0 0 1 82 92 Z"/><path d="M118 92 A12 8 0 0 1 142 92 Z"/></g>
    <path d="M84 134 H116" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round"/>
    <g stroke="#7b8bb5" stroke-width="5" stroke-linecap="round"><path d="M64 34 V58"/><path d="M80 30 V54"/><path d="M96 28 V50"/></g>
    ${dropSvg(168, 70, 0.26, 10)}`,
  ),
  mochi(
    'cry',
    '泪目团子',
    `<g fill="#2b2b2b"><ellipse cx="70" cy="100" rx="17" ry="20"/><ellipse cx="130" cy="100" rx="17" ry="20"/></g>
    <g fill="#fff"><circle cx="64" cy="92" r="6.5"/><circle cx="124" cy="92" r="6.5"/><circle cx="75" cy="108" r="3.5"/><circle cx="135" cy="108" r="3.5"/></g>
    <g stroke="#2b2b2b" stroke-width="5" stroke-linecap="round" fill="none"><path d="M50 72 Q62 64 78 70"/><path d="M122 70 Q138 64 150 72"/><path d="M86 140 Q100 128 114 140"/></g>
    <g fill="#8fdcff" stroke="#2a8fd6" stroke-width="3.5"><path d="M58 118 C56 136 60 150 54 166 L68 166 C70 150 72 136 74 118 Z"/><path d="M126 118 C128 136 124 150 130 166 L144 166 C142 150 142 136 140 118 Z"/></g>`,
  ),
  mochi(
    'shock',
    '震惊团子',
    `<path d="${MOCHI_BODY}" fill="url(#sh)"/>
    <g stroke="#4b5bd6" stroke-width="4" stroke-linecap="round" opacity=".8"><path d="M60 30 V54"/><path d="M76 26 V50"/><path d="M92 24 V46"/><path d="M108 24 V46"/><path d="M124 26 V50"/><path d="M140 30 V54"/></g>
    <g fill="#fff" stroke="#2b2b2b" stroke-width="5"><circle cx="70" cy="96" r="18"/><circle cx="130" cy="96" r="18"/></g>
    <g fill="#2b2b2b"><circle cx="70" cy="96" r="4"/><circle cx="130" cy="96" r="4"/></g>
    <ellipse cx="100" cy="140" rx="14" ry="19" fill="#3a1a1a" stroke="#2b2b2b" stroke-width="4"/>
    <ellipse cx="100" cy="150" rx="8" ry="6" fill="#ff7a93"/>`,
    `<linearGradient id="sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b6cff" stop-opacity=".6"/><stop offset=".5" stop-color="#5b6cff" stop-opacity="0"/></linearGradient>`,
  ),
  { id: 'meme-doghead', name: '狗头', group: '表情', size: 0.18, outline: 0.04, svg: DOG_SVG },
  {
    id: 'meme-melon',
    name: '吃瓜',
    group: '表情',
    size: 0.18,
    outline: 0.045,
    svg: svg(
      200,
      124,
      `<g mask="url(#bite)">
        <path d="M8 18 A92 92 0 0 0 192 18 Z" fill="#1f8a3a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
        <path d="M20 18 A80 80 0 0 0 180 18 Z" fill="#c4f59a"/>
        <path d="M28 18 A72 72 0 0 0 172 18 Z" fill="#ff4d5e"/>
        <g fill="${INK}">${[[62, 40, 20], [100, 48, 0], [138, 40, -20], [80, 70, 12], [120, 70, -12], [100, 88, 0]]
          .map(([x, y, a]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="7.5" transform="rotate(${a} ${x} ${y})"/>`)
          .join('')}</g>
        <path d="M11 18 H189" stroke="${INK}" stroke-width="6" stroke-linecap="round"/></g>`,
      `<mask id="bite"><rect width="200" height="124" fill="#fff"/><circle cx="150" cy="12" r="17" fill="#000"/><circle cx="174" cy="20" r="15" fill="#000"/><circle cx="128" cy="10" r="12" fill="#000"/></mask>`,
    ),
  },
  {
    id: 'meme-thumb',
    name: '点赞',
    group: '表情',
    size: 0.16,
    outline: 0.045,
    svg: svg(
      160,
      160,
      `<path d="M16 150 C12 150 10 146 10 140 V86 C10 80 13 76 18 76 H42 V150 Z" fill="#2f6bff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M42 80 L66 74 C74 60 76 42 74 24 C73 12 88 8 94 18 C104 34 102 56 96 74 L128 74 C141 74 147 84 142 94 C151 98 151 113 142 117 C149 123 147 135 138 137 C143 145 136 154 126 154 L66 154 C54 154 46 150 42 146 Z" fill="#ffcf9e" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <g stroke="${INK}" stroke-width="5" stroke-linecap="round"><path d="M104 94 H140"/><path d="M104 116 H141"/><path d="M102 136 H136"/></g>
      <path d="M82 22 C86 30 88 44 84 56" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>
      <g fill="#ffe600" stroke="${INK}" stroke-width="3" stroke-linejoin="round"><path d="${sparkleD(132, 30, 16)}"/><path d="${sparkleD(24, 44, 11)}"/></g>`,
    ),
  },
];

// ----------------------------------------------------------------- layouts

/** A grid of square photos, each with a caption band underneath. */
function memeLayout({ id, name, desc, cols, rows, W, H, head, foot, pad, gap, capH, rowGap }) {
  const cw = (W - pad * 2 - gap * (cols - 1)) / cols;
  const pitch = cw + capH + rowGap;
  const used = pitch * rows - rowGap;
  const y0 = head + (H - head - foot - used) / 2;
  const slots = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) slots.push({ x: pad + c * (cw + gap), y: y0 + r * pitch, w: cw, h: cw, capH });
  }
  return { id, name, desc, size: [W, H], photos: cols * rows, slots, head: { y: 0, h: head }, footer: { y: H - foot, h: foot } };
}

export const layouts = [
  memeLayout({ id: 'grid9', name: '九宫格表情包', desc: '9 张连拍全上 · 每张配一句热梗', cols: 3, rows: 3, W: 1200, H: 1800, head: 200, foot: 150, pad: 60, gap: 30, capH: 96, rowGap: 44 }),
  memeLayout({ id: 'grid4', name: '四宫格大字报', desc: '从 9 张里挑 4 张 · 配字更大', cols: 2, rows: 2, W: 1200, H: 1800, head: 200, foot: 150, pad: 70, gap: 40, capH: 130, rowGap: 50 }),
  memeLayout({ id: 'single', name: '单张表情包', desc: '挑最抽象的 1 张 · 超大配字', cols: 1, rows: 1, W: 1200, H: 1440, head: 150, foot: 130, pad: 110, gap: 0, capH: 150, rowGap: 0 }),
];

// ----------------------------------------------------------------- frames

// --- ① 糖果色综艺: candy stripes, rhinestone cards, variety-show 花字
const CANDY_BG = ['#ff9ccb', '#ffe45c', '#7fe0ff', '#b8f27a', '#c9a6ff'];
const CANDY = ['#ff4f9a', '#ffc400', '#19c3ff', '#5ee04a', '#ff7a1a', '#a35cff'];
const PLUM = '#2a0b3d';

/** Title with every character in its own colour, bouncing like a variety-show logo. */
function bouncyText(ctx, text, cx, cy, fs, { family = HEAVY, weight = 900, colors = CANDY, stroke = PLUM, outer = '#fff', shadow = PLUM } = {}) {
  const font = `${weight} ${fs}px ${family}`;
  warm(font, text);
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const chars = [...text];
  const ws = chars.map((c) => ctx.measureText(c).width);
  const gap = fs * 0.03;
  let x = cx - (ws.reduce((a, b) => a + b, 0) + gap * (chars.length - 1)) / 2;
  const pos = chars.map((c, i) => {
    const p = { c, x: x + ws[i] / 2, y: cy + (i % 2 ? 1 : -1) * fs * 0.05, r: (i % 2 ? 1 : -1) * 0.07, col: colors[i % colors.length] };
    x += ws[i] + gap;
    return p;
  });
  const each = (fn) =>
    pos.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      fn(p);
      ctx.restore();
    });
  if (shadow) {
    ctx.strokeStyle = shadow;
    ctx.lineWidth = fs * 0.36;
    each((p) => ctx.strokeText(p.c, fs * 0.05, fs * 0.08));
  }
  if (outer) {
    ctx.strokeStyle = outer;
    ctx.lineWidth = fs * 0.36;
    each((p) => ctx.strokeText(p.c, 0, 0));
  }
  ctx.strokeStyle = stroke;
  ctx.lineWidth = fs * 0.17;
  each((p) => ctx.strokeText(p.c, 0, 0));
  each((p) => {
    ctx.fillStyle = p.col;
    ctx.fillText(p.c, 0, 0);
  });
  ctx.restore();
}

/** Text in a rounded pill; returns its width. */
function pill(ctx, text, cx, cy, fs, { font = `700 ${fs}px ${HEAVY}`, fill = '#fff', color = INK, stroke = INK, lw = fs * 0.12, padX = fs * 0.9, h = fs * 1.9 } = {}) {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(text).width + padX * 2;
  rrect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + fs * 0.04);
  ctx.restore();
  return w;
}

function confetti(ctx, W, H, count, seed) {
  const r = rng(seed);
  const k = W / 1200;
  for (let i = 0; i < count; i++) {
    const x = r() * W;
    const y = r() * H;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(r() * TAU);
    ctx.fillStyle = CANDY[i % CANDY.length];
    if (i % 3 === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, 7 * k, 0, TAU);
      ctx.fill();
    } else ctx.fillRect(-10 * k, -4 * k, 20 * k, 8 * k);
    ctx.restore();
  }
}

const candy = {
  id: 'candy',
  name: '糖果色综艺',
  paint: {
    under(ctx, L) {
      const k = L.W / 1200;
      stripes(ctx, L.W, L.H, CANDY_BG, 74 * k);
      dots(ctx, 0, 0, L.W, L.H, 30 * k, 4 * k, 'rgba(255,255,255,0.33)');
      confetti(ctx, L.W, L.H, 70, 11);
      for (const s of L.slots) {
        const u = unit(s);
        const m = 14 * u;
        ctx.fillStyle = 'rgba(42,11,61,0.3)';
        rrect(ctx, s.x - m + 7 * u, s.y - m + 9 * u, s.w + m * 2, s.h + m * 2, 20 * u);
        ctx.fill();
        rrect(ctx, s.x - m, s.y - m, s.w + m * 2, s.h + m * 2, 20 * u);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.lineWidth = 4 * u;
        ctx.strokeStyle = PLUM;
        ctx.stroke();
        gemFrame(ctx, s.x - m / 2, s.y - m / 2, s.w + m, s.h + m, 4.4 * Math.min(u, 2), 24 * Math.min(u, 2), Math.round(s.x + s.y));
      }
    },
    slot(ctx, s, i, info) {
      const u = unit(s);
      ctx.lineWidth = 3 * u;
      ctx.strokeStyle = PLUM;
      ctx.stroke();
      memeText(ctx, captionFor(info), { x: s.x - 10 * u, y: s.y + s.h * 0.55, w: s.w + 20 * u, h: s.h * 0.45 + s.capH * 0.55 }, {
        gradient: ['#ffffff', '#ffffff', '#fff06a'],
        stroke: PLUM,
        strokeEm: 0.2,
        outer: [['#ff3d9a', 0.38]],
        shadow: [PLUM, 0.05, 0.08],
        maxFs: s.w * 0.17,
        rot: i % 2 ? 0.035 : -0.035,
      });
    },
    over(ctx, L, info) {
      const k = L.W / 1200;
      const hh = L.head.h;
      bouncyText(ctx, '抽象表情包机', L.W / 2, hh * 0.44, hh * 0.44);
      for (const [x, y, r, c] of [[0.12, 0.3, 22, '#fff'], [0.88, 0.56, 26, '#fff'], [0.18, 0.72, 12, '#ffe45c'], [0.83, 0.2, 13, '#ffe45c']]) sparkle(ctx, L.W * x, hh * y, r * k, c);
      const f = L.footer;
      const cy = f.y + f.h * 0.45;
      const w = pill(ctx, `${dateText(info)}  ·  ${serialText(info)}`, L.W / 2, cy, 28 * k, { color: PLUM, stroke: PLUM, lw: 5 * k });
      pill(ctx, '不求好看 只求好玩', L.W / 2 - w / 2 - 150 * k, cy, 22 * k, { font: `900 ${22 * k}px ${HEAVY}`, fill: '#ff4f9a', color: '#fff', stroke: PLUM, lw: 4 * k, padX: 18 * k, h: 50 * k });
      sparkle(ctx, L.W / 2 + w / 2 + 50 * k, cy, 24 * k, '#fff');
      sparkle(ctx, L.W / 2 + w / 2 + 92 * k, cy - 14 * k, 13 * k, '#ffe45c');
    },
  },
};

// --- ② 复古电视: every photo on a CRT set, a wall of TVs at night
const TV_BODY = [
  ['#f2e6c9', '#d8c69c'],
  ['#ff6b5a', '#d9432f'],
  ['#43c6b8', '#2a978b'],
  ['#ffb03b', '#e08a12'],
  ['#b7a4ff', '#8c75e6'],
];

function knob(ctx, x, y, r, a) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = '#f4efe6';
  ctx.fill();
  ctx.lineWidth = r * 0.3;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75);
  ctx.lineWidth = r * 0.26;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function tvSet(ctx, s, n) {
  const k = Math.min(2, unit(s));
  const m = 13 * k;
  const top = 14 * k;
  const panel = 58 * k;
  const x = s.x - m;
  const y = s.y - top;
  const w = s.w + m * 2;
  const h = s.h + top + panel;
  const [body, shade] = TV_BODY[n % TV_BODY.length];
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // glow the screen throws on the wall
  const g = ctx.createRadialGradient(x + w / 2, y + h / 2, w * 0.3, x + w / 2, y + h / 2, w * 0.95);
  g.addColorStop(0, 'rgba(140,210,255,0.22)');
  g.addColorStop(1, 'rgba(140,210,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - w * 0.5, y - w * 0.5, w * 2, h + w);
  // rabbit-ear antenna
  const ax = x + w / 2;
  const al = 46 * k;
  const tips = [[ax - al * 0.8, y - al], [ax + al * 0.7, y - al * 0.92]];
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4 * k;
  ctx.beginPath();
  for (const [tx, ty] of tips) {
    ctx.moveTo(ax, y);
    ctx.lineTo(tx, ty);
  }
  ctx.stroke();
  for (const [tx, ty] of tips) {
    ctx.beginPath();
    ctx.arc(tx, ty, 5.5 * k, 0, TAU);
    ctx.fillStyle = '#ff4f6d';
    ctx.fill();
    ctx.lineWidth = 2.5 * k;
    ctx.stroke();
  }
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.ellipse(ax, y + k, 17 * k, 10 * k, 0, Math.PI, TAU);
  ctx.fill();
  // feet
  ctx.fillStyle = INK;
  for (const fx of [x + w * 0.14, x + w * 0.86 - 18 * k]) {
    rrect(ctx, fx, y + h - 6 * k, 18 * k, 15 * k, 3 * k);
    ctx.fill();
  }
  // cabinet: body colour, darker control strip
  rrect(ctx, x, y, w, h, 24 * k);
  ctx.fillStyle = body;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.fillStyle = shade;
  ctx.fillRect(x, s.y + s.h + 14 * k, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(x, y, w, 5 * k);
  ctx.restore();
  rrect(ctx, x, y, w, h, 24 * k);
  ctx.lineWidth = 5 * k;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // screen recess
  rrect(ctx, s.x - 7 * k, s.y - 7 * k, s.w + 14 * k, s.h + 14 * k, 22 * k);
  ctx.fillStyle = '#0d0d0d';
  ctx.fill();
  // speaker grille, channel LED, knobs
  const py = s.y + s.h + 14 * k;
  const ph = y + h - py;
  ctx.fillStyle = 'rgba(0,0,0,0.38)';
  for (let i = 0; i < 4; i++) {
    rrect(ctx, x + 18 * k, py + ph * 0.2 + i * ph * 0.17, w * 0.34, 4.5 * k, 2.2 * k);
    ctx.fill();
  }
  const lx = x + w * 0.6;
  const lw = 66 * k;
  const lh = 24 * k;
  rrect(ctx, lx - lw / 2, py + ph / 2 - lh / 2 - 2 * k, lw, lh, 5 * k);
  ctx.fillStyle = '#240707';
  ctx.fill();
  ctx.fillStyle = '#ff4b3a';
  ctx.font = `400 ${22 * k}px ${LED}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`CH-${String(n + 1).padStart(2, '0')}`, lx, py + ph / 2 - k);
  knob(ctx, x + w - 26 * k, py + ph / 2 - 2 * k, 12 * k, 0.6 + n);
  knob(ctx, x + w - 58 * k, py + ph / 2 - 2 * k, 12 * k, 2.2 + n * 1.3);
  ctx.restore();
}

/** Retro TV-logo lettering: stacked colour shadows under white. */
function retroTitle(ctx, text, x, y, fs, align = 'left') {
  const font = `900 ${fs}px ${HEAVY}`;
  warm(font, text);
  ctx.save();
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const layers = ['#ff4b3a', '#ff9d2e', '#ffe14d'];
  layers.forEach((c, i) => {
    const o = (layers.length - i) * fs * 0.06;
    ctx.fillStyle = c;
    ctx.fillText(text, x + o, y + o);
  });
  ctx.lineWidth = fs * 0.08;
  ctx.strokeStyle = INK;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fffaf0';
  ctx.fillText(text, x, y);
  ctx.restore();
}

const tv = {
  id: 'tv',
  name: '复古电视',
  paint: {
    under(ctx, L) {
      const k = L.W / 1200;
      const g = ctx.createLinearGradient(0, 0, 0, L.H);
      g.addColorStop(0, '#222a4a');
      g.addColorStop(1, '#161b33');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, L.W, L.H);
      // 70s wallpaper: soft diamonds
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 3 * k;
      ctx.beginPath();
      const st = 64 * k;
      for (let x = -L.H; x < L.W + L.H; x += st) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x + L.H, L.H);
        ctx.moveTo(x, L.H);
        ctx.lineTo(x + L.H, 0);
      }
      ctx.stroke();
      L.slots.forEach((s, i) => tvSet(ctx, s, i));
    },
    slot(ctx, s, i, info) {
      const k = Math.min(2, unit(s));
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      const step = Math.max(3, 4 * k);
      for (let y = s.y; y < s.y + s.h; y += step) ctx.fillRect(s.x, y, s.w, step * 0.42);
      const cx = s.x + s.w / 2;
      const cy = s.y + s.h / 2;
      const v = ctx.createRadialGradient(cx, cy, s.w * 0.38, cx, cy, s.w * 0.78);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx.fillStyle = v;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      const gl = ctx.createLinearGradient(s.x, s.y, s.x + s.w * 0.55, s.y + s.h * 0.55);
      gl.addColorStop(0, 'rgba(255,255,255,0.26)');
      gl.addColorStop(0.45, 'rgba(255,255,255,0.05)');
      gl.addColorStop(0.46, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.restore();
      // rounded CRT corners
      ctx.beginPath();
      ctx.rect(s.x - 1, s.y - 1, s.w + 2, s.h + 2);
      rpath(ctx, s.x, s.y, s.w, s.h, 30 * k);
      ctx.fillStyle = '#0d0d0d';
      ctx.fill('evenodd');
      // subtitle
      memeText(ctx, captionFor(info), { x: s.x + 12 * k, y: s.y + s.h * 0.6, w: s.w - 24 * k, h: s.h * 0.36 }, { fill: '#fff15a', stroke: INK, strokeEm: 0.22, maxFs: s.w * 0.155, shadow: ['rgba(0,0,0,0.5)', 0.03, 0.06] });
    },
    over(ctx, L, info) {
      const k = L.W / 1200;
      const hh = L.head.h;
      const x0 = L.slots[0].x - 4 * k;
      retroTitle(ctx, '抽象表情包机', x0, hh * 0.4, hh * 0.34);
      // "on air" badge
      const bw = 190 * k;
      const bh = 54 * k;
      const bx = L.W - x0 - bw;
      const by = hh * 0.4 - bh / 2;
      rrect(ctx, bx, by, bw, bh, 12 * k);
      ctx.fillStyle = '#ff3b30';
      ctx.fill();
      ctx.lineWidth = 4 * k;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bx + 30 * k, by + bh / 2, 9 * k, 0, TAU);
      ctx.fill();
      ctx.font = `900 ${27 * k}px ${HEAVY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('正在播出', bx + bw / 2 + 16 * k, by + bh / 2 + k);
      const f = L.footer;
      ctx.fillStyle = '#ffe14d';
      ctx.font = `400 ${36 * k}px ${LED}`;
      ctx.fillText(`${dateText(info)}  ${serialText(info)}`, L.W / 2, f.y + f.h * 0.42);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = `700 ${20 * k}px ${HEAVY}`;
      ctx.fillText('抽象频道 · 全天候播出 · 不求好看 只求好玩', L.W / 2, f.y + f.h * 0.72);
    },
  },
};

// --- ③ 像素风: 8-bit borders and RPG dialog boxes
const pixel = {
  id: 'pixel',
  name: '像素风',
  paint: {
    under(ctx, L) {
      const k = L.W / 1200;
      const p = Math.round(6 * k);
      const cell = p * 10;
      for (let y = 0, j = 0; y < L.H; y += cell, j++) {
        for (let x = 0, i = 0; x < L.W; x += cell, i++) {
          ctx.fillStyle = (i + j) % 2 ? '#2a1f5c' : '#251a52';
          ctx.fillRect(x, y, cell, cell);
        }
      }
      const r = rng(9);
      const cols = ['#ffffff', '#ffd400', '#7ff3ff', '#ff7ab8'];
      for (let i = 0; i < 80; i++) {
        const x = Math.round((r() * L.W) / p) * p;
        const y = Math.round((r() * L.H) / p) * p;
        const c = cols[i % cols.length];
        if (i % 5 === 0) pxDraw(ctx, PX_STAR, x, y, p, { W: c });
        else {
          ctx.fillStyle = c;
          ctx.fillRect(x, y, p, p);
        }
      }
      for (const s of L.slots) {
        const q = Math.max(3, Math.round(5 * Math.min(unit(s), 2)));
        pxRect(ctx, s.x - q * 3 + q, s.y - q * 3 + q, s.w + q * 6, s.h + q * 6, q, '#120c2e', 2);
        pxRect(ctx, s.x - q * 3, s.y - q * 3, s.w + q * 6, s.h + q * 6, q, '#0b0b0b', 2);
        pxRect(ctx, s.x - q * 2, s.y - q * 2, s.w + q * 4, s.h + q * 4, q, '#ffffff', 1);
        ctx.fillStyle = '#0b0b0b';
        ctx.fillRect(s.x - q, s.y - q, s.w + q * 2, s.h + q * 2);
      }
    },
    slot(ctx, s, i, info) {
      const q = Math.max(3, Math.round(5 * Math.min(unit(s), 2)));
      ctx.fillStyle = '#0b0b0b';
      for (const [x, y] of [[s.x, s.y], [s.x + s.w - q, s.y], [s.x, s.y + s.h - q], [s.x + s.w - q, s.y + s.h - q]]) ctx.fillRect(x, y, q, q);
      // RPG dialog box
      const by = s.y + s.h + q * 5;
      const bh = s.capH - q * 5;
      pxRect(ctx, s.x - q, by, s.w + q * 2, bh, q, '#ffffff', 2);
      pxRect(ctx, s.x, by + q, s.w, bh - q * 2, q, '#0b0b0b', 1);
      pixelText(ctx, captionFor(info), { x: s.x + q * 3, y: by + q * 2, w: s.w - q * 7, h: bh - q * 4 }, { color: '#ffffff', shadow: '#5a4bd6' });
      pxDraw(ctx, ['WWW', '.W.'], s.x + s.w - q * 5, by + bh - q * 4, q, { W: '#ffd400' });
      // player tag
      pxRect(ctx, s.x + q * 2, s.y + q * 2, q * 13, q * 6, q, '#0b0b0b', 1);
      pixelText(ctx, `P${i + 1}`, { x: s.x + q * 3, y: s.y + q * 3, w: q * 11, h: q * 4 }, { color: '#ffd400', family: PIXEL, weight: 400, maxScale: Math.max(1, Math.round(q / 3)) });
    },
    over(ctx, L, info) {
      const k = L.W / 1200;
      const hh = L.head.h;
      const p = Math.round(6 * k);
      pixelText(ctx, '抽象表情包机', { x: L.W * 0.15, y: hh * 0.1, w: L.W * 0.7, h: hh * 0.56 }, { color: '#ffd400', shadow: '#ff3d7f', weight: 900 });
      ctx.fillStyle = '#7ff3ff';
      ctx.font = `400 ${Math.round(20 * k)}px ${PIXEL}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MEME BOOTH  -  STAGE 9', L.W / 2, hh * 0.8);
      // HUD: lives + coins
      for (let i = 0; i < 3; i++) pxDraw(ctx, PX_HEART, 40 * k + i * p * 10.5, 34 * k, p, { B: '#0b0b0b', R: '#ff2d55', W: '#fff' });
      pxDraw(ctx, PX_COIN, L.W - 212 * k, 34 * k, p, { B: '#0b0b0b', Y: '#ffd400', W: '#fff' });
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.font = `400 ${Math.round(22 * k)}px ${PIXEL}`;
      ctx.fillText('x99', L.W - 166 * k, 34 * k + p * 3.2);
      const f = L.footer;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = `400 ${Math.round(22 * k)}px ${PIXEL}`;
      ctx.fillText(`${dateText(info)}  ${serialText(info)}`, L.W / 2, f.y + f.h * 0.4);
      ctx.fillStyle = '#ffd400';
      ctx.font = `400 ${Math.round(18 * k)}px ${PIXEL}`;
      ctx.fillText('PRESS START TO 抽象', L.W / 2, f.y + f.h * 0.7);
    },
  },
};

// --- ④ 黑白表情包: plain white, black words under the picture
const plain = {
  id: 'plain',
  name: '黑白表情包',
  paint: {
    under(ctx, L) {
      const k = L.W / 1200;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, L.W, L.H);
      // dashed cut lines, like a sheet of stickers to cut apart
      if (L.slots.length > 1) {
        ctx.save();
        ctx.strokeStyle = '#c9c9c9';
        ctx.lineWidth = 2 * k;
        ctx.setLineDash([12 * k, 10 * k]);
        ctx.beginPath();
        const xs = [...new Set(L.slots.map((s) => s.x))].sort((a, b) => a - b);
        const ys = [...new Set(L.slots.map((s) => s.y))].sort((a, b) => a - b);
        const s0 = L.slots[0];
        for (let i = 1; i < xs.length; i++) {
          const x = (xs[i - 1] + s0.w + xs[i]) / 2;
          ctx.moveTo(x, ys[0] - 20 * k);
          ctx.lineTo(x, ys[ys.length - 1] + s0.h + s0.capH);
        }
        for (let j = 1; j < ys.length; j++) {
          const y = (ys[j - 1] + s0.h + s0.capH + ys[j]) / 2;
          ctx.moveTo(xs[0] - 20 * k, y);
          ctx.lineTo(xs[xs.length - 1] + s0.w + 20 * k, y);
        }
        ctx.stroke();
        ctx.restore();
      }
    },
    slot(ctx, s, i, info) {
      const u = unit(s);
      ctx.lineWidth = 2.5 * u;
      ctx.strokeStyle = INK;
      ctx.stroke();
      memeText(ctx, captionFor(info), { x: s.x - 4 * u, y: s.y + s.h + 8 * u, w: s.w + 8 * u, h: s.capH - 12 * u }, { fill: INK, maxFs: s.w * 0.15, valign: 'middle' });
      // the "@" watermark every reposted meme picks up
      const fs = Math.max(11, 12 * u);
      ctx.save();
      ctx.font = `700 ${fs}px ${HEAVY}`;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = fs * 0.3;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText('@抽象表情包机', s.x + s.w - fs * 0.6, s.y + s.h - fs * 0.6);
      ctx.restore();
    },
    over(ctx, L, info) {
      const k = L.W / 1200;
      const hh = L.head.h;
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `900 ${hh * 0.3}px ${HEAVY}`;
      ctx.fillText('抽象表情包机', L.W / 2, hh * 0.42);
      ctx.fillStyle = '#8a8a8a';
      ctx.font = `700 ${hh * 0.1}px ${HEAVY}`;
      ctx.fillText('表情包专用 · 可 以 随 便 发', L.W / 2, hh * 0.72);
      const f = L.footer;
      ctx.font = `400 ${22 * k}px ${HEAVY}`;
      ctx.fillText(`${dateText(info)}  ·  ${serialText(info)}  ·  不求好看 只求好玩`, L.W / 2, f.y + f.h * 0.45);
    },
  },
};

// --- ⑤ 黄色警告: hazard tape and a "mental state" notice board
const warning = {
  id: 'warning',
  name: '黄色警告',
  paint: {
    under(ctx, L) {
      const k = L.W / 1200;
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(0, 0, L.W, L.H);
      dots(ctx, 0, 0, L.W, L.H, 22 * k, 2.4 * k, 'rgba(0,0,0,0.08)');
      hazard(ctx, 0, 0, L.W, 30 * k, 26 * k);
      hazard(ctx, 0, L.H - 30 * k, L.W, 30 * k, 26 * k);
      const hh = L.head.h;
      const bh = hh * 0.5;
      const by = 30 * k + (hh - 30 * k - bh) * 0.42;
      rrect(ctx, L.W * 0.1, by, L.W * 0.8, bh, 16 * k);
      ctx.fillStyle = INK;
      ctx.fill();
    },
    slot(ctx, s, i, info) {
      const u = unit(s);
      ctx.lineWidth = 8 * u;
      ctx.strokeStyle = INK;
      ctx.lineJoin = 'miter';
      ctx.stroke();
      // status tag on the corner
      const tw = 96 * Math.min(u, 2);
      const th = 30 * Math.min(u, 2);
      ctx.fillStyle = INK;
      ctx.fillRect(s.x - 4 * u, s.y - 4 * u, tw, th);
      ctx.fillStyle = '#ffd400';
      ctx.font = `900 ${th * 0.62}px ${HEAVY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`状态 ${String(i + 1).padStart(2, '0')}`, s.x - 4 * u + tw / 2, s.y - 4 * u + th / 2 + u);
      // caption plate
      const by = s.y + s.h + 12 * u;
      const bh = s.capH - 16 * u;
      rrect(ctx, s.x - 4 * u, by, s.w + 8 * u, bh, 12 * u);
      ctx.fillStyle = INK;
      ctx.fill();
      const ic = bh * 0.62;
      warnSign(ctx, s.x + 8 * u + ic / 2, by + bh / 2, ic);
      memeText(ctx, captionFor(info), { x: s.x + 14 * u + ic, y: by + 5 * u, w: s.w - 24 * u - ic, h: bh - 10 * u }, { fill: '#ffd400', maxFs: s.w * 0.14, valign: 'middle' });
    },
    over(ctx, L, info) {
      const k = L.W / 1200;
      const hh = L.head.h;
      const bh = hh * 0.5;
      const by = 30 * k + (hh - 30 * k - bh) * 0.42;
      const cy = by + bh / 2;
      ctx.fillStyle = '#ffd400';
      ctx.font = `900 ${bh * 0.56}px ${HEAVY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('精神状态提示', L.W / 2, cy + k);
      warnSign(ctx, L.W * 0.1 + bh * 0.6, cy, bh * 0.62);
      warnSign(ctx, L.W * 0.9 - bh * 0.6, cy, bh * 0.62);
      ctx.fillStyle = INK;
      ctx.font = `700 ${hh * 0.09}px ${HEAVY}`;
      ctx.fillText('抽象表情包机 · 本机检测结果仅供娱乐', L.W / 2, by + bh + (hh - by - bh) * 0.5);
      const f = L.footer;
      pill(ctx, `${dateText(info)}  ·  ${serialText(info)}`, L.W / 2, f.y + f.h * 0.42, 26 * k, { fill: INK, color: '#ffd400', stroke: null });
    },
  },
};

export const frames = [candy, tv, pixel, plain, warning];

/** Every CJK string the frames draw on canvas (for fonts.text). */
export const FRAME_TEXT = '抽象表情包机不求好看只求好玩正在播出抽象频道全天候播出表情包专用可以随便发精神状态提示状态本机检测结果仅供娱乐@打工人工作证';
