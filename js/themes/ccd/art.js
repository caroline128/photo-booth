// Art for DIGI 2003 — a millennium Chinese mall booth with a 1.3-megapixel
// CCD camera: 非主流 dress-up props, 火星文 / GIF-glitter / gadget stickers,
// and five frames for three layouts (16 mini stickers, a 2×2 grid with
// burned-in dates, one photo on a flip phone's screen).

import { svg, heartD, starD, rng, speckle } from '../../art/kit.js';
import { stamp, rrect, canvas as mkCanvas, TAU } from '../../core/util.js';
import { gridLayout, heartPath } from '../../engine/compose.js';

// ----------------------------------------------------------------- fonts

const PIX = '"Press Start 2P", "VT323", monospace';
const LCD = '"VT323", "Press Start 2P", monospace';
const CUTE = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
const TECH = '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif';
const HAND = '"Caveat", "ZCOOL KuaiLe", cursive';
const SCRIPT = '"Pacifico", "ZCOOL KuaiLe", cursive';

// ----------------------------------------------------------------- drawing helpers

/** Fancy canvas text: gradient fill, outer stroke, inner stroke, glow. */
function label(ctx, str, x, y, { font, size, weight = 400, fill = '#fff', stroke, sw = 0.2, inner, glow, align = 'center', spacing = 0, alpha = 1 }) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.globalAlpha = alpha;
  if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.4;
  }
  if (stroke) {
    ctx.lineWidth = size * sw;
    ctx.strokeStyle = stroke;
    ctx.strokeText(str, x, y);
    ctx.shadowBlur = 0;
  }
  if (inner) {
    ctx.lineWidth = size * sw * 0.45;
    ctx.strokeStyle = inner;
    ctx.strokeText(str, x, y);
  }
  if (Array.isArray(fill)) {
    const g = ctx.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
    fill.forEach((c, i) => g.addColorStop(i / (fill.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = fill;
  ctx.fillText(str, x, y);
  ctx.restore();
}

/** Upright vertical text (one character under the other), centred on x. */
function column(ctx, str, x, y0, y1, { font, size, fill, stroke, glow }) {
  const chars = [...str];
  const step = size * 1.08;
  const n = Math.floor((y1 - y0) / step);
  const start = y0 + ((y1 - y0) - n * step) / 2 + step / 2;
  for (let i = 0; i < n; i++) label(ctx, chars[i % chars.length], x, start + i * step, { font, size, fill, stroke, sw: 0.26, glow });
}

/** Four-point twinkle. */
function twinkle(ctx, x, y, r, color = '#fff', glow) {
  const p = r * 0.16;
  ctx.save();
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = r * 0.9;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x + p, y - p, x + r, y);
  ctx.quadraticCurveTo(x + p, y + p, x, y + r);
  ctx.quadraticCurveTo(x - p, y + p, x - r, y);
  ctx.quadraticCurveTo(x - p, y - p, x, y - r);
  ctx.fill();
  ctx.restore();
}

function starPath(ctx, x, y, r, inner = 0.46, rot = -Math.PI / 2, n = 5) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / n;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}

/** Filled shape with a white sticker rim (hearts, stars on frames). */
function rimmed(ctx, pathFn, fill, rim = '#fff', rimW = 5) {
  pathFn();
  ctx.lineJoin = 'round';
  ctx.lineWidth = rimW;
  ctx.strokeStyle = rim;
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
}

function heart(ctx, x, y, r, fill, rim = '#fff') {
  rimmed(ctx, () => heartPath(ctx, x, y, r), fill, rim, Math.max(2, r * 0.3));
}

function star(ctx, x, y, r, fill, rim = '#fff', rot) {
  rimmed(ctx, () => starPath(ctx, x, y, r, 0.46, rot), fill, rim, Math.max(2, r * 0.22));
}

/** Pixel sprite: rows of palette keys ('.' = empty). */
function sprite(ctx, rows, x, y, px, pal) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const c = pal[row[i]];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(Math.floor(x + i * px), Math.floor(y + j * px), Math.ceil(px) + 0.5, Math.ceil(px) + 0.5);
    }
  });
}

const PX_HEART = [
  '.KKK.KKK.',
  'KPPWKPPPK',
  'KPWPPPPPK',
  'KPPPPPPDK',
  '.KPPPPDK.',
  '..KPPDK..',
  '...KDK...',
  '....K....',
];

const PX_SPARK = [
  '....Y....',
  '....Y....',
  '....Y....',
  '...YWY...',
  'YYYWWWYYY',
  '...YWY...',
  '....Y....',
  '....Y....',
  '....Y....',
];

const PX_TWINKLE = ['..Y..', '.YWY.', 'YWWWY', '.YWY.', '..Y..'];

const PX_STAR = [
  '.....K.....',
  '....KYK....',
  '....KYK....',
  'KKKKYYYKKKK',
  'KYYYYWYYYYK',
  '.KYYYYYYYK.',
  '..KYYYYYK..',
  '..KYYKYYK..',
  '.KYYK.KYYK.',
  '.KKK...KKK.',
];

const PX_FLOWER = ['..PPP..', '.PPWPP.', 'PPWYWPP', 'PWYYYWP', 'PPWYWPP', '.PPWPP.', '..PPP..'];

function pixHeart(ctx, x, y, size, pal) {
  const px = size / 9;
  sprite(ctx, PX_HEART, x - size / 2, y - (px * 8) / 2, px, pal);
}

function pixSpark(ctx, x, y, size, pal) {
  const px = size / 9;
  sprite(ctx, PX_SPARK, x - size / 2, y - size / 2, px, pal);
}

/** Signal-strength bars, bottom-aligned at (x, y+h). */
function signalBars(ctx, x, y, h, color, n = 5) {
  const bw = h * 0.22;
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const bh = h * ((i + 1) / n);
    ctx.fillRect(x + i * bw * 1.45, y + h - bh, bw, bh);
  }
}

/** Battery icon with `level` of 4 bars. */
function battery(ctx, x, y, w, h, color, level = 4, barColor = color) {
  const t = Math.max(1.5, h * 0.14);
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.strokeRect(x + t / 2, y + t / 2, w - t * 1.5 - h * 0.12, h - t);
  ctx.fillStyle = color;
  ctx.fillRect(x + w - t - h * 0.12, y + h * 0.3, t + h * 0.12, h * 0.4);
  const inner = w - t * 3.5 - h * 0.12;
  const bw = inner / 4;
  ctx.fillStyle = barColor;
  for (let i = 0; i < level; i++) ctx.fillRect(x + t * 1.6 + i * bw, y + t * 1.6, bw * 0.78, h - t * 3.2);
}

// ----------------------------------------------------------------- 7-segment date stamp

// Digicams burned the date into the corner of the photo in orange
// seven-segment digits, e.g. '05 08 23.
const SEVEN = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g' };

function hSeg(ctx, xa, xb, y, t, g) {
  ctx.moveTo(xa + g, y);
  ctx.lineTo(xa + g + t / 2, y - t / 2);
  ctx.lineTo(xb - g - t / 2, y - t / 2);
  ctx.lineTo(xb - g, y);
  ctx.lineTo(xb - g - t / 2, y + t / 2);
  ctx.lineTo(xa + g + t / 2, y + t / 2);
  ctx.closePath();
}

function vSeg(ctx, x, ya, yb, t, g) {
  ctx.moveTo(x, ya + g);
  ctx.lineTo(x + t / 2, ya + g + t / 2);
  ctx.lineTo(x + t / 2, yb - g - t / 2);
  ctx.lineTo(x, yb - g);
  ctx.lineTo(x - t / 2, yb - g - t / 2);
  ctx.lineTo(x - t / 2, ya + g + t / 2);
  ctx.closePath();
}

/** Adds seven-segment glyphs to the current path, baseline at y=0; returns the advance. */
function sevenPath(ctx, text, h, draw = true) {
  const w = h * 0.54;
  const t = h * 0.16;
  const g = t * 0.18;
  let x = 0;
  for (const ch of String(text)) {
    const segs = SEVEN[ch];
    if (segs) {
      if (draw) {
        const l = x + t / 2;
        const r = x + w - t / 2;
        const top = -h + t / 2;
        const mid = -h / 2;
        const bot = -t / 2;
        if (segs.includes('a')) hSeg(ctx, l, r, top, t, g);
        if (segs.includes('g')) hSeg(ctx, l, r, mid, t, g);
        if (segs.includes('d')) hSeg(ctx, l, r, bot, t, g);
        if (segs.includes('f')) vSeg(ctx, l, top, mid, t, g);
        if (segs.includes('b')) vSeg(ctx, r, top, mid, t, g);
        if (segs.includes('e')) vSeg(ctx, l, mid, bot, t, g);
        if (segs.includes('c')) vSeg(ctx, r, mid, bot, t, g);
      }
      x += w + h * 0.16;
    } else if (ch === "'") {
      if (draw) {
        ctx.moveTo(x + t * 0.8, -h);
        ctx.lineTo(x + t * 1.8, -h);
        ctx.lineTo(x + t * 1.0, -h * 0.68);
        ctx.lineTo(x + t * 0.2, -h * 0.68);
        ctx.closePath();
      }
      x += t * 2 + h * 0.08;
    } else if (ch === ':' || ch === '.') {
      if (draw) {
        ctx.rect(x + t * 0.3, -t * 1.2, t, t);
        if (ch === ':') ctx.rect(x + t * 0.3, -h * 0.72, t, t);
      }
      x += t * 1.9;
    } else x += w * 0.6;
  }
  return x - h * 0.16;
}

/** Orange burned-in date; (x, y) is the baseline end given by `align`. */
export function dateStamp(ctx, text, x, y, h, { align = 'right', color = '#ff7a12', glow = 'rgba(255,84,0,0.8)', alpha = 0.96 } = {}) {
  const width = sevenPath(ctx, text, h, false);
  ctx.save();
  ctx.translate(align === 'right' ? x - width : align === 'center' ? x - width / 2 : x, y);
  ctx.transform(1, 0, -0.1, 1, 0, 0);
  ctx.beginPath();
  sevenPath(ctx, text, h);
  ctx.globalAlpha = alpha;
  // soft bloom, then a crisp core with a faint burnt edge so it reads on bright skin too
  ctx.shadowColor = glow;
  ctx.shadowBlur = h * 0.32;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fill();
  ctx.lineWidth = Math.max(1, h * 0.035);
  ctx.strokeStyle = 'rgba(110,28,0,0.4)';
  ctx.stroke();
  ctx.restore();
  return width;
}

/** The date a digicam would burn in: session date, optionally "time-travelled" to 2005 (month/day kept). */
export function shotDate(info = {}) {
  const d = new Date(info.date || Date.now());
  return { y: info.options?.year === '2005' ? 2005 : d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/** '05 08 23 */
const pad2 = (n) => String(n).padStart(2, '0');
export const stampText = (info) => {
  const t = shotDate(info);
  return `'${String(t.y).slice(2)} ${pad2(t.m)} ${pad2(t.d)}`;
};

const serialOf = (info) => `No.${String(info.serial || 0).padStart(6, '0')}`;

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js — 1 art unit ≈ w/100 d below.

const PHONE_SVG = svg(140, 320, `
  <defs>
    <linearGradient id="pb" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e493c1"/><stop offset=".45" stop-color="#ffe6f3"/><stop offset="1" stop-color="#d27aae"/></linearGradient>
    <linearGradient id="sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fe0ff"/><stop offset="1" stop-color="#c9a2ff"/></linearGradient>
  </defs>
  <path d="M40 24 C22 44 14 80 20 112" stroke="#ff5fa2" stroke-width="3" fill="none"/>
  <g stroke="#fff" stroke-width="2">
    <circle cx="36" cy="30" r="5" fill="#8fd8ff"/><circle cx="27" cy="46" r="5" fill="#fff27a"/><circle cx="21" cy="63" r="5" fill="#b9a2ff"/>
    <circle cx="19" cy="80" r="5" fill="#8fd8ff"/><circle cx="19" cy="97" r="5" fill="#fff27a"/>
  </g>
  <path d="${starD(21, 124, 17, 5, 0.48)}" fill="#fff27a" stroke="#ffb400" stroke-width="3" stroke-linejoin="round"/>
  <path d="${heartD(28, 156, 13)}" fill="#ff4fa3" stroke="#fff" stroke-width="3"/>
  <rect x="38" y="8" width="94" height="142" rx="20" fill="url(#pb)" stroke="#a84a7c" stroke-width="3"/>
  <rect x="48" y="30" width="74" height="96" rx="7" fill="#1d1a28"/>
  <rect x="53" y="36" width="64" height="82" rx="3" fill="url(#sc)"/>
  <path d="${heartD(85, 78, 19)}" fill="#ff4fa3"/>
  <path d="M77 66 L80 63" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  <rect x="70" y="16" width="30" height="5" rx="2.5" fill="#7a3a5c"/>
  <rect x="42" y="146" width="86" height="18" rx="9" fill="#c86aa0" stroke="#a84a7c" stroke-width="3"/>
  <rect x="38" y="162" width="94" height="150" rx="20" fill="url(#pb)" stroke="#a84a7c" stroke-width="3"/>
  <ellipse cx="85" cy="188" rx="17" ry="11" fill="#fff" stroke="#a84a7c" stroke-width="3"/>
  <circle cx="85" cy="188" r="5" fill="#ff8fc8"/>
  <rect x="48" y="182" width="16" height="9" rx="4.5" fill="#fff" stroke="#a84a7c" stroke-width="2"/>
  <rect x="106" y="182" width="16" height="9" rx="4.5" fill="#fff" stroke="#a84a7c" stroke-width="2"/>
  <g fill="#fff" stroke="#d98ab8" stroke-width="2">
    ${[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => `<rect x="${50 + c * 25}" y="${210 + r * 22}" width="20" height="13" rx="6.5"/>`).join('')).join('')}
  </g>
  <path d="M50 20 C60 14 74 12 86 12" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`);

function butterflySvg(x, y, s, rot, c1, c2) {
  return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <path d="M0 -2 C-8 -30 -44 -44 -50 -20 C-54 -2 -28 6 0 2 Z" fill="${c1}" stroke="#fff" stroke-width="3.5"/>
    <path d="M0 -2 C8 -30 44 -44 50 -20 C54 -2 28 6 0 2 Z" fill="${c1}" stroke="#fff" stroke-width="3.5"/>
    <path d="M0 2 C-14 6 -38 14 -32 32 C-26 44 -8 32 0 6 Z" fill="${c2}" stroke="#fff" stroke-width="3.5"/>
    <path d="M0 2 C14 6 38 14 32 32 C26 44 8 32 0 6 Z" fill="${c2}" stroke="#fff" stroke-width="3.5"/>
    <path d="M-6 -4 C-14 -22 -34 -30 -38 -18 M6 -4 C14 -22 34 -30 38 -18" stroke="#fff" stroke-width="2" fill="none" opacity=".55"/>
    <g fill="#fff" opacity=".9"><circle cx="-30" cy="-18" r="5"/><circle cx="30" cy="-18" r="5"/><circle cx="-18" cy="20" r="3.5"/><circle cx="18" cy="20" r="3.5"/><circle cx="-41" cy="-27" r="2.5"/><circle cx="41" cy="-27" r="2.5"/></g>
    <rect x="-4" y="-14" width="8" height="30" rx="4" fill="#5b3b7a"/>
    <path d="M-2 -12 C-8 -24 -12 -28 -18 -30 M2 -12 C8 -24 12 -28 18 -30" stroke="#5b3b7a" stroke-width="3" fill="none" stroke-linecap="round"/>
  </g>`;
}

export const props = [
  {
    id: 'fringe',
    name: '非主流斜刘海',
    anchor: 'head',
    w: 3.0,
    origin: [0.5, 0.361],
    svg: svg(300, 360, `
      <defs>
        <linearGradient id="hs" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#3d2733"/><stop offset="1" stop-color="#1b1016"/></linearGradient>
        <linearGradient id="pk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7ad9"/><stop offset="1" stop-color="#9b4dff"/></linearGradient>
      </defs>
      <g transform="translate(0 20)">
      <g stroke="#0e0709" stroke-width="3" stroke-linejoin="round">
        <path d="M84 40 L96 -4 L116 22 L136 -16 L152 16 L178 -12 L186 22 L214 0 L214 40 Z" fill="#2b1a24"/>
        <path d="M40 120 C18 170 14 232 22 300 L30 334 L40 292 L52 322 L58 270 C56 220 60 170 72 140 Z" fill="#26171f"/>
        <path d="M258 116 C282 148 292 190 286 234 L278 266 L270 228 L260 252 L254 204 C256 170 254 142 242 126 Z" fill="#26171f"/>
        <path d="M18 222 C-2 150 4 66 58 30 C100 4 198 -2 248 24 C294 52 306 138 284 218 C274 176 264 140 234 112 L70 112 C44 134 30 178 18 222 Z" fill="url(#hs)"/>
        <path d="M228 28 C180 28 110 48 70 98 C50 124 38 160 36 200 L44 262 L62 236 L74 282 L88 244 L104 288 L118 246 L134 264 L146 222 L158 240 L170 200 L178 206 L194 178 L210 190 L226 158 L246 166 C256 130 252 70 228 28 Z" fill="url(#hs)"/>
      </g>
      <path d="M214 40 C172 66 122 134 100 262 L112 244 C134 140 180 76 228 46 Z" fill="url(#pk)" opacity=".9"/>
      <g fill="none" stroke="#6a4458" stroke-width="3" stroke-linecap="round" opacity=".85">
        <path d="M206 44 C160 70 118 150 90 250"/><path d="M234 62 C222 100 208 140 188 186"/><path d="M180 48 C140 80 108 150 72 262"/>
        <path d="M60 140 C48 190 46 240 40 300"/><path d="M262 140 C274 170 278 200 276 240"/>
      </g>
      <path d="M84 44 C118 26 170 22 212 34" stroke="#fff" stroke-width="8" fill="none" opacity=".28" stroke-linecap="round"/>
      <path d="M150 72 C132 92 120 112 112 140" stroke="#fff" stroke-width="5" fill="none" opacity=".2" stroke-linecap="round"/>
      </g>`),
  },
  {
    id: 'butterfly',
    name: '蝴蝶发夹',
    anchor: 'head',
    pair: true,
    flipPair: true,
    w: 1.3,
    dx: 0.86,
    dy: -0.22,
    rot: 0.35,
    origin: [0.5, 0.6],
    svg: svg(170, 120, `
      ${butterflySvg(38, 84, 0.55, 18, '#9fd8ff', '#d6f0ff')}
      ${butterflySvg(140, 88, 0.5, -25, '#c9a6ff', '#e9ddff')}
      ${butterflySvg(90, 50, 0.95, -10, '#ff8fd0', '#ffc9e8')}
      <g fill="#fff"><circle cx="64" cy="102" r="3"/><circle cx="118" cy="62" r="2.5"/><circle cx="20" cy="60" r="2"/></g>`),
  },
  {
    id: 'headphones',
    name: 'MP3 大耳机',
    anchor: 'eyes',
    w: 3.1,
    origin: [0.5, 0.741],
    svg: svg(310, 270, `
      <defs>
        <linearGradient id="bd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#aeb8c6"/></linearGradient>
        <radialGradient id="cp" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#e3e8ef"/><stop offset="1" stop-color="#a3adbb"/></radialGradient>
      </defs>
      <path d="M40 196 C30 76 88 14 155 14 C222 14 280 76 270 196" fill="none" stroke="#65707e" stroke-width="26" stroke-linecap="round"/>
      <path d="M40 196 C30 76 88 14 155 14 C222 14 280 76 270 196" fill="none" stroke="url(#bd)" stroke-width="18" stroke-linecap="round"/>
      <path d="M96 36 C126 22 184 22 214 36" fill="none" stroke="#1f3f9a" stroke-width="12" stroke-linecap="round"/>
      <path d="M66 76 C84 48 116 32 146 30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      <g stroke="#5f6a79" stroke-width="4">
        <rect x="6" y="168" width="56" height="102" rx="28" fill="url(#cp)"/>
        <rect x="248" y="168" width="56" height="102" rx="28" fill="url(#cp)"/>
      </g>
      <rect x="15" y="184" width="38" height="70" rx="19" fill="#2f6bff"/>
      <rect x="257" y="184" width="38" height="70" rx="19" fill="#2f6bff"/>
      <circle cx="34" cy="219" r="10" fill="#bfe0ff"/><circle cx="276" cy="219" r="10" fill="#bfe0ff"/>
      <path d="M60 180 C72 200 72 238 60 258" stroke="#20242c" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M250 180 C238 200 238 238 250 258" stroke="#20242c" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M20 186 C24 180 30 178 36 178 M262 186 C266 180 272 178 278 178" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>
      <circle cx="48" cy="250" r="4" fill="#7dffb0"/>`),
  },
  {
    id: 'flipphone',
    name: '翻盖手机',
    anchor: 'side',
    w: 1.1,
    rot: 0.16,
    dx: -0.4,
    origin: [0.6, 0.55],
    svg: PHONE_SVG,
  },
  {
    id: 'starshades',
    name: '星星墨镜',
    anchor: 'eyes',
    w: 2.5,
    origin: [0.5, 0.5],
    svg: svg(260, 110, `
      <defs><linearGradient id="ls" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7ac8"/><stop offset="1" stop-color="#7b3dff"/></linearGradient></defs>
      <path d="M2 34 L30 42 M258 34 L230 42" stroke="#ff3fa0" stroke-width="7" stroke-linecap="round"/>
      <path d="M118 48 Q130 36 142 48" stroke="#ff3fa0" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="${starD(76, 58, 52, 5, 0.52)}" fill="url(#ls)" fill-opacity=".9" stroke="#ff3fa0" stroke-width="8" stroke-linejoin="round"/>
      <path d="${starD(184, 58, 52, 5, 0.52)}" fill="url(#ls)" fill-opacity=".9" stroke="#ff3fa0" stroke-width="8" stroke-linejoin="round"/>
      <path d="M60 44 L72 32 M168 44 L180 32" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
      <g fill="#fff"><circle cx="76" cy="8" r="4"/><circle cx="184" cy="8" r="4"/><circle cx="28" cy="42" r="3"/><circle cx="232" cy="42" r="3"/></g>`),
  },
  {
    id: 'buckethat',
    name: '渔夫帽',
    anchor: 'head',
    w: 3.2,
    dy: 0.08,
    origin: [0.5, 0.78],
    svg: svg(240, 156, `
      <defs><linearGradient id="dn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9dbef0"/><stop offset="1" stop-color="#5a82c4"/></linearGradient></defs>
      <path d="M36 116 C32 62 64 26 120 24 C176 26 208 62 204 116 Z" fill="url(#dn)" stroke="#34558c" stroke-width="3"/>
      <path d="M44 74 C84 62 156 62 196 74 M40 96 C84 84 156 84 200 96" stroke="#e3eeff" stroke-width="2.5" stroke-dasharray="7 5" fill="none"/>
      <ellipse cx="120" cy="30" rx="46" ry="8" fill="#a9c8f5" stroke="#34558c" stroke-width="2"/>
      <path d="M34 102 C80 114 160 114 206 102 L207 120 C160 132 80 132 33 120 Z" fill="#ff8fc8" stroke="#34558c" stroke-width="3"/>
      <path d="M30 118 C10 124 2 136 2 148 C60 156 180 156 238 148 C238 136 230 124 210 118 C160 130 80 130 30 118 Z" fill="url(#dn)" stroke="#34558c" stroke-width="3"/>
      <path d="M18 141 C70 148 170 148 222 141" stroke="#e3eeff" stroke-width="2.5" stroke-dasharray="7 5" fill="none"/>
      <path d="${starD(166, 82, 13)}" fill="#fff27a" stroke="#34558c" stroke-width="2" stroke-linejoin="round"/>
      <path d="M66 50 C84 38 104 34 122 34" stroke="#fff" stroke-width="5" fill="none" opacity=".45" stroke-linecap="round"/>`),
  },
  {
    id: 'kittyears',
    name: '猫耳发箍',
    anchor: 'crown',
    w: 2.7,
    origin: [0.5, 0.5],
    svg: svg(270, 200, `
      <path d="M26 172 C22 100 72 70 135 70 C198 70 248 100 244 172" stroke="#ff8fc8" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M40 124 L42 12 L112 80 Z" fill="#fff" stroke="#f08fc0" stroke-width="7" stroke-linejoin="round"/>
      <path d="M56 106 L56 46 L96 84 Z" fill="#ffb8dc"/>
      <path d="M230 124 L228 12 L158 80 Z" fill="#fff" stroke="#f08fc0" stroke-width="7" stroke-linejoin="round"/>
      <path d="M214 106 L214 46 L174 84 Z" fill="#ffb8dc"/>
      <g transform="translate(196 100) rotate(-18)">
        <path d="M0 0 C-12 -22 -40 -22 -38 0 C-40 22 -12 22 0 0 Z" fill="#ff5fa2" stroke="#fff" stroke-width="3"/>
        <path d="M0 0 C12 -22 40 -22 38 0 C40 22 12 22 0 0 Z" fill="#ff5fa2" stroke="#fff" stroke-width="3"/>
        <g fill="#fff"><circle cx="-24" cy="-6" r="3.5"/><circle cx="-18" cy="8" r="3"/><circle cx="24" cy="-6" r="3.5"/><circle cx="18" cy="8" r="3"/></g>
        <circle cx="0" cy="0" r="9" fill="#ffd23f" stroke="#e0a100" stroke-width="3"/>
        <path d="M-4 3 L4 3" stroke="#a36b00" stroke-width="2"/>
      </g>`),
  },
  {
    id: 'bigframes',
    name: '大黑框眼镜',
    anchor: 'eyes',
    w: 2.3,
    origin: [0.5, 0.5],
    svg: svg(240, 90, `
      <path d="M14 30 L1 24 M226 30 L239 24" stroke="#111" stroke-width="10" stroke-linecap="round"/>
      <rect x="18" y="12" width="100" height="66" rx="15" fill="#cfe3ff" fill-opacity=".16" stroke="#141414" stroke-width="12"/>
      <rect x="122" y="12" width="100" height="66" rx="15" fill="#cfe3ff" fill-opacity=".16" stroke="#141414" stroke-width="12"/>
      <path d="M110 30 L130 30" stroke="#141414" stroke-width="10"/>
      <path d="M36 62 L64 28 M140 62 L168 28" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>
      <path d="M22 18 L50 18 M126 18 L154 18" stroke="#555" stroke-width="3" stroke-linecap="round"/>`),
  },
];

// ----------------------------------------------------------------- stickers

const GLITTER = ['#ffffff', '#fff6c2', '#ffd6f2', '#d9f4ff'];

/**
 * 火星文 glitter text: gradient letters with a white inner rim, a dark outer
 * rim, glitter specks inside the letters and GIF-style twinkles.
 */
function glitterText({ id, name, text, size = 0.36, fill, stroke, inner = '#ffffff', glint = '#ffffff', glintGlow = 'rgba(255,110,200,0.95)', seed = 1, family = 'ZCOOL KuaiLe' }) {
  const fs = 100;
  const pad = fs * 0.36;
  const lh = fs * 1.14;
  const lines = String(text).split('\n');
  const css = `400 ${fs}px "${family}", "Noto Sans SC", sans-serif`;
  let dims = null;
  const measure = () => {
    const c = mkCanvas(8, 8).getContext('2d');
    c.font = css;
    const w = Math.max(...lines.map((l) => c.measureText(l).width));
    return { W: w + pad * 2, H: lh * lines.length + pad * 1.4 };
  };
  return {
    id,
    name: name || text,
    group: '火星文',
    size,
    outline: 0.045,
    fontSpec: { font: `400 ${fs}px "${family}", "Noto Sans SC"`, text },
    get ratio() {
      dims ||= measure();
      return dims.H / dims.W;
    },
    draw(ctx, w, h) {
      dims ||= measure();
      const k = w / dims.W;
      const cx = dims.W / 2;
      const ys = lines.map((_, i) => pad * 0.7 + lh * (i + 0.5));
      ctx.save();
      ctx.scale(k, k);
      ctx.font = css;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      lines.forEach((l, i) => {
        ctx.lineWidth = fs * 0.26;
        ctx.strokeStyle = stroke;
        ctx.strokeText(l, cx, ys[i]);
        ctx.lineWidth = fs * 0.11;
        ctx.strokeStyle = inner;
        ctx.strokeText(l, cx, ys[i]);
      });
      ctx.restore();
      // letters on their own layer so the glitter stays inside them
      const layer = mkCanvas(w, h);
      const lc = layer.getContext('2d');
      lc.save();
      lc.scale(k, k);
      lc.font = css;
      lc.textAlign = 'center';
      lc.textBaseline = 'middle';
      lines.forEach((l, i) => {
        const g = lc.createLinearGradient(0, ys[i] - fs * 0.42, 0, ys[i] + fs * 0.42);
        fill.forEach((c, j) => g.addColorStop(j / (fill.length - 1), c));
        lc.fillStyle = g;
        lc.fillText(l, cx, ys[i]);
      });
      lc.restore();
      lc.globalCompositeOperation = 'source-atop';
      const r = rng(seed);
      const dot = Math.max(1, w * 0.006);
      for (let i = 0, n = Math.round((w * h) / 70); i < n; i++) {
        lc.globalAlpha = 0.3 + r() * 0.6;
        lc.fillStyle = GLITTER[Math.floor(r() * GLITTER.length)];
        lc.fillRect(r() * w, r() * h, dot * (0.6 + r()), dot * (0.6 + r()));
      }
      ctx.drawImage(layer, 0, 0);
      const tr = Math.min(h * 0.2, w * 0.08);
      twinkle(ctx, w * 0.05 + tr * 0.4, h * 0.2, tr, glint, glintGlow);
      twinkle(ctx, w * 0.95 - tr * 0.3, h * 0.26, tr * 0.7, glint, glintGlow);
      twinkle(ctx, w * 0.9, h * 0.84, tr * 0.5, glint, glintGlow);
    },
  };
}

const PINK = ['#ffffff', '#ffc4ea', '#ff5fb8'];
const ROSE = ['#fff5fc', '#ff9ad5', '#e0409e'];
const GRAPE = ['#fbefff', '#e2a3ff', '#a646e8'];
const RAIN = ['#f3f0ff', '#b9abff', '#6b50e0'];
const SKY = ['#f0fbff', '#a3ddff', '#4f86ff'];
const SUN = ['#fffbe0', '#ffd95a', '#ff9a2e'];
const RAINBOW = ['#ff6b8b', '#ffb13d', '#ffe14a', '#6fe07a', '#5fb4ff', '#a879ff'];
const SAD_GLOW = { glint: '#e6ebff', glintGlow: 'rgba(120,140,255,0.95)' };

/** Pager/phone SMS code on a little LCD, e.g. 520 = 我爱你. */
function smsSticker(id, code, note) {
  return {
    id,
    name: `${code}（${note}）`,
    group: '暗号',
    size: 0.24,
    ratio: 0.84,
    outline: 0.05,
    fontSpec: { font: '400 100px "ZCOOL KuaiLe", "Noto Sans SC"', text: note },
    draw(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#f6f8fb');
      g.addColorStop(1, '#b3bcc9');
      rrect(ctx, w * 0.03, h * 0.03, w * 0.94, h * 0.94, w * 0.12);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = w * 0.025;
      ctx.strokeStyle = '#66717f';
      ctx.stroke();
      const lx = w * 0.1;
      const ly = h * 0.1;
      const lw = w * 0.8;
      const lh = h * 0.6;
      rrect(ctx, lx, ly, lw, lh, w * 0.05);
      ctx.fillStyle = '#aecb85';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(30,50,10,0.07)';
      for (let x = lx; x < lx + lw; x += w * 0.025) ctx.fillRect(x, ly, Math.max(1, w * 0.004), lh);
      for (let y = ly; y < ly + lh; y += w * 0.025) ctx.fillRect(lx, y, lw, Math.max(1, w * 0.004));
      const sh = ctx.createLinearGradient(0, ly, 0, ly + lh);
      sh.addColorStop(0, 'rgba(0,0,0,0.18)');
      sh.addColorStop(0.3, 'rgba(0,0,0,0)');
      ctx.fillStyle = sh;
      ctx.fillRect(lx, ly, lw, lh);
      ctx.restore();
      ctx.lineWidth = w * 0.02;
      ctx.strokeStyle = '#4d5a3a';
      rrect(ctx, lx, ly, lw, lh, w * 0.05);
      ctx.stroke();
      signalBars(ctx, lx + lw * 0.07, ly + lh * 0.08, lh * 0.16, '#1f2a14');
      battery(ctx, lx + lw * 0.74, ly + lh * 0.09, lw * 0.18, lh * 0.14, '#1f2a14', 3);
      ctx.fillStyle = '#1f2a14';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `400 ${Math.min(lh * 0.36, (lw * 0.84) / code.length)}px ${PIX}`;
      ctx.fillText(code, w / 2, ly + lh * 0.62);
      ctx.fillStyle = '#3a4352';
      ctx.font = `400 ${h * 0.15}px ${CUTE}`;
      ctx.fillText(note, w / 2, h * 0.84);
    },
  };
}

function spriteSticker({ id, name, rows, pal, size = 0.2, group = '闪图' }) {
  const cols = Math.max(...rows.map((r) => r.length));
  return { id, name, group, size, ratio: rows.length / cols, outline: 0.07, draw: (ctx, w) => sprite(ctx, rows, 0, 0, w / cols, pal) };
}

const CLOUD = ['...KKK....', '..KWWWK.K.', '.KWWWWWKWK', 'KWWWWWWWWK', 'KGGGGGGGGK', '.KKKKKKKK.'];

export const stickers = [
  // ---- 火星文
  glitterText({ id: 'mars-love', text: 'ωǒ嗳伱', name: 'ωǒ嗳伱（我爱你）', size: 0.34, fill: PINK, stroke: '#6a1257', seed: 3 }),
  glitterText({ id: 'mars-only', text: '伱是莪の唯①', name: '伱是莪の唯①（你是我的唯一）', size: 0.44, fill: ROSE, stroke: '#5c0f4a', seed: 5 }),
  glitterText({ id: 'mars-know', text: '晓嘚嘛～', name: '晓嘚嘛～（晓得嘛）', size: 0.34, fill: GRAPE, stroke: '#3e0f5c', seed: 7 }),
  glitterText({ id: 'mars-lonely', text: '莪の寂寞\n伱不懂', name: '莪の寂寞伱不懂', size: 0.34, fill: RAIN, stroke: '#1f1650', seed: 9, ...SAD_GLOW }),
  glitterText({ id: 'mars-45', text: '45°仰望天空', name: '45° 仰望天空', size: 0.44, fill: SKY, stroke: '#12306e', seed: 11, ...SAD_GLOW }),
  glitterText({ id: 'mars-hurt', text: '伤不起', name: '伤不起', size: 0.28, fill: RAIN, stroke: '#1f1650', seed: 13, ...SAD_GLOW }),
  glitterText({ id: 'mars-bff', text: '╰☆好朋友一辈子☆╮', name: '好朋友一辈子', size: 0.5, fill: SUN, stroke: '#7a3b00', seed: 15, glintGlow: 'rgba(255,190,40,0.95)' }),
  glitterText({ id: 'qingchun', text: '青春', name: '青春', size: 0.24, fill: RAINBOW, stroke: '#2a2466', seed: 17 }),
  glitterText({ id: 'feizhuliu', text: '非主流', name: '非主流', size: 0.28, fill: ['#5a5a66', '#1b1b1f'], stroke: '#ff4fa3', inner: '#ffffff', seed: 19 }),

  // ---- 暗号 (number slang typed on phone keypads)
  smsSticker('sms-520', '520', '我爱你'),
  smsSticker('sms-1314', '1314', '一生一世'),
  smsSticker('sms-886', '886', '拜拜啦'),
  smsSticker('sms-3q', '3Q', '谢谢你'),

  // ---- 闪图 (sparkly GIF-style pixel art)
  {
    id: 'bubbles',
    name: '粉红泡泡',
    group: '闪图',
    size: 0.3,
    svg: svg(200, 180, `
      <defs><radialGradient id="bb" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#ffd1ec" stop-opacity=".35"/><stop offset="1" stop-color="#ff5fb0" stop-opacity=".75"/></radialGradient></defs>
      ${[[72, 104, 56], [142, 58, 36], [152, 132, 26], [36, 38, 18], [112, 158, 13], [180, 22, 10], [20, 150, 9]]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#bb)" stroke="#fff" stroke-width="${Math.max(2, r * 0.07).toFixed(1)}"/>
        <path d="M${x - r * 0.62} ${y - r * 0.12} A${r * 0.66} ${r * 0.66} 0 0 1 ${x - r * 0.18} ${y - r * 0.62}" stroke="#fff" stroke-width="${(r * 0.14).toFixed(1)}" stroke-linecap="round" fill="none"/>
        <circle cx="${x + r * 0.4}" cy="${y + r * 0.42}" r="${(r * 0.08).toFixed(1)}" fill="#fff"/>`)
        .join('')}`),
  },
  {
    id: 'twinkle',
    name: '闪闪星',
    group: '闪图',
    size: 0.24,
    ratio: 0.9,
    outline: 0.035,
    draw(ctx, w) {
      const Y = { Y: '#ffe14a', W: '#ffffff' };
      const P = { Y: '#ff7ad9', W: '#ffffff' };
      const C = { Y: '#6fe3ff', W: '#ffffff' };
      sprite(ctx, PX_SPARK, w * 0.3, w * 0.06, w * 0.055, Y);
      sprite(ctx, PX_SPARK, w * 0.04, w * 0.42, w * 0.036, P);
      sprite(ctx, PX_TWINKLE, w * 0.7, w * 0.52, w * 0.05, C);
      sprite(ctx, PX_TWINKLE, w * 0.08, w * 0.1, w * 0.03, C);
      sprite(ctx, PX_TWINKLE, w * 0.82, w * 0.12, w * 0.03, P);
      sprite(ctx, PX_TWINKLE, w * 0.46, w * 0.7, w * 0.028, Y);
    },
  },
  spriteSticker({ id: 'pixheart', name: '像素爱心', rows: PX_HEART, pal: { K: '#3a0f2e', P: '#ff4f9a', D: '#c21d6b', W: '#ffffff' }, size: 0.18 }),
  {
    id: 'heartchain',
    name: '爱心串',
    group: '闪图',
    size: 0.3,
    ratio: 0.42,
    outline: 0.04,
    draw(ctx, w, h) {
      const s = w * 0.3;
      pixHeart(ctx, w * 0.17, h * 0.58, s, { K: '#3a0f2e', P: '#ff7ad9', D: '#d14aa8', W: '#fff' });
      pixHeart(ctx, w * 0.5, h * 0.44, s, { K: '#3a0f2e', P: '#ff4f6d', D: '#c2203f', W: '#fff' });
      pixHeart(ctx, w * 0.83, h * 0.58, s, { K: '#3a0f2e', P: '#a879ff', D: '#7445d6', W: '#fff' });
    },
  },
  spriteSticker({ id: 'pixstar', name: '像素星星', rows: PX_STAR, pal: { K: '#4a2a00', Y: '#ffd23f', W: '#fffbe0' }, size: 0.2 }),
  {
    id: 'butterfly',
    name: '闪光蝴蝶',
    group: '闪图',
    size: 0.28,
    svg: svg(200, 160, `
      <defs>
        <linearGradient id="w1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fe0ff"/><stop offset="1" stop-color="#7b5cff"/></linearGradient>
        <linearGradient id="w2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6a8ff"/><stop offset="1" stop-color="#ff7ad9"/></linearGradient>
      </defs>
      ${butterflySvg(100, 82, 1.7, -8, 'url(#w1)', 'url(#w2)')}
      <g fill="#fff">${[[40, 30, 3], [160, 24, 2.5], [22, 110, 2], [178, 120, 3], [100, 150, 2]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`),
  },
  {
    id: 'rainbow',
    name: '像素彩虹',
    group: '闪图',
    size: 0.32,
    ratio: 15 / 26,
    outline: 0.05,
    draw(ctx, w) {
      const px = w / 26;
      const bands = ['#ff4f6d', '#ff9a3c', '#ffe14a', '#5fe07a', '#4fb4ff', '#9b6bff'];
      for (let j = 0; j < 15; j++) {
        for (let i = 0; i < 26; i++) {
          const band = Math.floor(12.6 - Math.hypot(i + 0.5 - 13, j + 0.5 - 14.5));
          if (band < 0 || band > 5) continue;
          ctx.fillStyle = bands[band];
          ctx.fillRect(Math.floor(i * px), Math.floor(j * px), Math.ceil(px) + 0.5, Math.ceil(px) + 0.5);
        }
      }
      sprite(ctx, CLOUD, 0, px * 9, px, { W: '#ffffff', G: '#dbe6f7', K: '#7f95c4' });
      sprite(ctx, CLOUD, px * 16, px * 9, px, { W: '#ffffff', G: '#dbe6f7', K: '#7f95c4' });
    },
  },
  {
    id: 'lovegif',
    name: 'LOVE 闪字',
    group: '闪图',
    size: 0.34,
    ratio: 0.4,
    outline: 0.04,
    draw(ctx, w, h) {
      const fills = [['#ffffff', '#ff7ad9'], ['#ffffff', '#ff4f6d'], ['#ffffff', '#b86bff'], ['#ffffff', '#ff7ad9']];
      [...'LOVE'].forEach((l, i) => {
        label(ctx, l, w * (0.155 + i * 0.23), h * (0.56 + (i % 2 ? -0.07 : 0.05)), { font: PIX, size: w * 0.17, fill: fills[i], stroke: '#3a1050', sw: 0.34, inner: '#ffffff' });
      });
      sprite(ctx, PX_TWINKLE, w * 0.02, h * 0.04, w * 0.024, { Y: '#ffe14a', W: '#fff' });
      sprite(ctx, PX_TWINKLE, w * 0.88, h * 0.66, w * 0.022, { Y: '#6fe3ff', W: '#fff' });
      sprite(ctx, PX_TWINKLE, w * 0.47, h * 0.02, w * 0.016, { Y: '#ff7ad9', W: '#fff' });
    },
  },
  {
    id: 'bow',
    name: '蝴蝶结',
    group: '闪图',
    size: 0.24,
    svg: svg(200, 140, `
      <g stroke="#d6468f" stroke-width="5" stroke-linejoin="round">
        <path d="M92 66 L64 128 L82 120 L92 136 L106 72 Z" fill="#ff5fa2"/>
        <path d="M108 66 L136 128 L118 120 L108 136 L94 72 Z" fill="#ff5fa2"/>
        <path d="M100 60 C70 18 16 12 14 46 C12 80 60 88 100 64 Z" fill="#ff7ab8"/>
        <path d="M100 60 C130 18 184 12 186 46 C188 80 140 88 100 64 Z" fill="#ff7ab8"/>
        <rect x="86" y="44" width="28" height="32" rx="11" fill="#ff5fa2"/>
      </g>
      <g fill="#fff"><circle cx="46" cy="40" r="6"/><circle cx="66" cy="62" r="5"/><circle cx="34" cy="64" r="4"/><circle cx="154" cy="40" r="6"/><circle cx="134" cy="62" r="5"/><circle cx="166" cy="64" r="4"/><circle cx="96" cy="54" r="3"/></g>
      <path d="M30 34 C40 24 54 22 66 26" stroke="#fff" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`),
  },

  // ---- 千禧物件 (millennium gadgets)
  { id: 'phone', name: '翻盖手机', group: '千禧物件', size: 0.2, svg: PHONE_SVG },
  {
    id: 'mp3',
    name: 'MP3',
    group: '千禧物件',
    size: 0.22,
    svg: svg(170, 210, `
      <defs><linearGradient id="mp" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dfe5ee"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#c7cfdb"/></linearGradient></defs>
      <g fill="none" stroke-linecap="round">
        <path d="M92 156 C92 178 84 186 66 190 C46 194 30 188 28 172" stroke="#aab4c2" stroke-width="7"/>
        <path d="M92 156 C94 182 112 192 132 190 C148 188 152 180 150 168" stroke="#aab4c2" stroke-width="7"/>
        <path d="M92 156 C92 178 84 186 66 190 C46 194 30 188 28 172" stroke="#fff" stroke-width="4"/>
        <path d="M92 156 C94 182 112 192 132 190 C148 188 152 180 150 168" stroke="#fff" stroke-width="4"/>
      </g>
      <g stroke="#aab4c2" stroke-width="3">
        <circle cx="28" cy="160" r="15" fill="#fff"/><circle cx="150" cy="156" r="15" fill="#fff"/>
      </g>
      <circle cx="28" cy="160" r="8" fill="#e3e8ef"/><circle cx="150" cy="156" r="8" fill="#e3e8ef"/>
      <rect x="62" y="12" width="60" height="146" rx="16" fill="url(#mp)" stroke="#7a8595" stroke-width="3"/>
      <rect x="70" y="26" width="44" height="38" rx="4" fill="#10286e"/>
      <g fill="#7fd0ff">${[12, 22, 16, 28, 20, 10, 18].map((hh, i) => `<rect x="${74 + i * 5.4}" y="${59 - hh}" width="4" height="${hh}"/>`).join('')}</g>
      <circle cx="92" cy="100" r="19" fill="#eef2f7" stroke="#7a8595" stroke-width="3"/>
      <circle cx="92" cy="100" r="7.5" fill="#2f6bff"/>
      <path d="M89 84 L96 87.5 L89 91 Z M74 97 L74 103 M110 97 L110 103" fill="#7a8595" stroke="#7a8595" stroke-width="2"/>
      <rect x="84" y="134" width="16" height="10" rx="3" fill="#2f6bff"/>
      <path d="M70 20 C80 16 96 16 110 18" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'cd',
    name: '光盘',
    group: '千禧物件',
    size: 0.24,
    ratio: 1,
    outline: 0.035,
    draw(ctx, w) {
      const c = w / 2;
      const R = w * 0.48;
      const disc = () => {
        ctx.beginPath();
        ctx.arc(c, c, R, 0, TAU);
        ctx.arc(c, c, R * 0.15, 0, TAU, true);
      };
      const g = ctx.createConicGradient ? ctx.createConicGradient(0.5, c, c) : ctx.createLinearGradient(0, 0, w, w);
      ['#dfe6ee', '#ffb3e6', '#fff2a8', '#b3ffe0', '#a8d8ff', '#e0b3ff', '#f4f6fa', '#ffffff', '#ffb3e6', '#a8d8ff', '#dfe6ee'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
      disc();
      ctx.fillStyle = g;
      ctx.fill('evenodd');
      ctx.save();
      disc();
      ctx.clip('evenodd');
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (const a of [-0.9, 2.2]) {
        ctx.beginPath();
        ctx.moveTo(c, c);
        ctx.arc(c, c, R, a, a + 0.35);
        ctx.fill();
      }
      ctx.restore();
      ctx.beginPath();
      ctx.arc(c, c, R * 0.33, 0, TAU);
      ctx.arc(c, c, R * 0.15, 0, TAU, true);
      ctx.fillStyle = 'rgba(236,241,248,0.9)';
      ctx.fill('evenodd');
      ctx.lineWidth = w * 0.012;
      ctx.strokeStyle = '#9aa6b5';
      for (const rr of [R, R * 0.33, R * 0.15]) {
        ctx.beginPath();
        ctx.arc(c, c, rr, 0, TAU);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(c, c - R * 0.62);
      ctx.rotate(-0.12);
      ctx.fillStyle = '#e0247a';
      ctx.font = `700 ${w * 0.13}px ${HAND}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOVE MIX', 0, 0);
      ctx.restore();
      heartPath(ctx, c + R * 0.52, c + R * 0.5, w * 0.05);
      ctx.fillStyle = '#e0247a';
      ctx.fill();
    },
  },
  {
    id: 'cassette',
    name: '磁带',
    group: '千禧物件',
    size: 0.3,
    ratio: 0.64,
    outline: 0.035,
    fontSpec: { font: '400 100px "ZCOOL KuaiLe", "Noto Sans SC"', text: '情歌精选' },
    draw(ctx, w, h) {
      rrect(ctx, w * 0.02, h * 0.03, w * 0.96, h * 0.94, w * 0.06);
      ctx.fillStyle = '#ff9fcf';
      ctx.fill();
      ctx.lineWidth = w * 0.015;
      ctx.strokeStyle = '#a8457a';
      ctx.stroke();
      for (const [x, y] of [[0.07, 0.1], [0.93, 0.1], [0.07, 0.9], [0.93, 0.9]]) {
        ctx.beginPath();
        ctx.arc(w * x, h * y, w * 0.018, 0, TAU);
        ctx.fillStyle = '#e7e7ee';
        ctx.fill();
        ctx.stroke();
      }
      rrect(ctx, w * 0.1, h * 0.1, w * 0.8, h * 0.54, w * 0.03);
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
      ctx.fillStyle = '#ff5fa2';
      ctx.fillRect(w * 0.1, h * 0.52, w * 0.8, h * 0.035);
      ctx.fillStyle = '#5fb4ff';
      ctx.fillRect(w * 0.1, h * 0.575, w * 0.8, h * 0.035);
      ctx.fillStyle = '#e0247a';
      ctx.font = `400 ${h * 0.07}px ${PIX}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('A', w * 0.14, h * 0.19);
      ctx.fillStyle = '#3b3b8a';
      ctx.font = `400 ${h * 0.14}px ${CUTE}`;
      ctx.textAlign = 'center';
      ctx.fillText('情歌精选', w * 0.52, h * 0.2);
      rrect(ctx, w * 0.24, h * 0.3, w * 0.52, h * 0.18, h * 0.09);
      ctx.fillStyle = '#3b3340';
      ctx.fill();
      ctx.fillStyle = '#6b3f2a';
      ctx.fillRect(w * 0.37, h * 0.36, w * 0.26, h * 0.06);
      for (const x of [0.35, 0.65]) {
        ctx.beginPath();
        ctx.arc(w * x, h * 0.39, h * 0.07, 0, TAU);
        ctx.fillStyle = '#f4f4f8';
        ctx.fill();
        ctx.fillStyle = '#3b3340';
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU;
          ctx.fillRect(w * x + Math.cos(a) * h * 0.045 - h * 0.008, h * 0.39 + Math.sin(a) * h * 0.045 - h * 0.008, h * 0.016, h * 0.016);
        }
      }
      ctx.beginPath();
      ctx.moveTo(w * 0.2, h * 0.97);
      ctx.lineTo(w * 0.26, h * 0.72);
      ctx.lineTo(w * 0.74, h * 0.72);
      ctx.lineTo(w * 0.8, h * 0.97);
      ctx.fillStyle = '#f27ab5';
      ctx.fill();
      ctx.stroke();
      for (const x of [0.33, 0.43, 0.57, 0.67]) {
        ctx.beginPath();
        ctx.arc(w * x, h * 0.85, h * 0.035, 0, TAU);
        ctx.fillStyle = '#a8457a';
        ctx.fill();
      }
    },
  },
  {
    id: 'lowbatt',
    name: '电量低',
    group: '千禧物件',
    size: 0.24,
    ratio: 0.66,
    outline: 0.05,
    fontSpec: { font: '400 100px "ZCOOL QingKe HuangYou", "Noto Sans SC"', text: '电量低' },
    draw(ctx, w, h) {
      rrect(ctx, w * 0.04, h * 0.05, w * 0.92, h * 0.9, w * 0.08);
      ctx.fillStyle = '#16246b';
      ctx.fill();
      ctx.lineWidth = w * 0.03;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      battery(ctx, w * 0.24, h * 0.16, w * 0.52, h * 0.34, '#ffffff', 1, '#ff3b4f');
      ctx.fillStyle = '#ffffff';
      ctx.font = `400 ${h * 0.26}px ${TECH}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('电量低', w * 0.5, h * 0.72);
    },
  },
  {
    id: 'signal',
    name: '信号满格',
    group: '千禧物件',
    size: 0.2,
    ratio: 0.72,
    outline: 0.06,
    draw(ctx, w, h) {
      ctx.strokeStyle = '#1f47b8';
      ctx.lineWidth = w * 0.05;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.92);
      ctx.lineTo(w * 0.12, h * 0.3);
      ctx.moveTo(w * 0.02, h * 0.1);
      ctx.lineTo(w * 0.12, h * 0.34);
      ctx.lineTo(w * 0.22, h * 0.1);
      ctx.stroke();
      const cols = ['#6fe3ff', '#4fc4ff', '#3a9dff', '#2f7bff', '#2f5bff'];
      for (let i = 0; i < 5; i++) {
        const bh = h * (0.22 + i * 0.17);
        rrect(ctx, w * (0.3 + i * 0.14), h * 0.92 - bh, w * 0.1, bh, w * 0.02);
        ctx.fillStyle = cols[i];
        ctx.fill();
        ctx.lineWidth = w * 0.02;
        ctx.strokeStyle = '#1f47b8';
        ctx.stroke();
      }
    },
  },
  {
    id: 'loading',
    name: 'LOADING…',
    group: '千禧物件',
    size: 0.36,
    ratio: 0.42,
    outline: 0.04,
    draw(ctx, w, h) {
      rrect(ctx, w * 0.02, h * 0.04, w * 0.96, h * 0.92, w * 0.03);
      ctx.fillStyle = '#e8ecf2';
      ctx.fill();
      ctx.lineWidth = w * 0.012;
      ctx.strokeStyle = '#4d5a6e';
      ctx.stroke();
      const tb = ctx.createLinearGradient(0, 0, w, 0);
      tb.addColorStop(0, '#1f47b8');
      tb.addColorStop(1, '#6fb6ff');
      ctx.fillStyle = tb;
      ctx.fillRect(w * 0.035, h * 0.08, w * 0.93, h * 0.2);
      ctx.fillStyle = '#fff';
      ctx.fillRect(w * 0.9, h * 0.12, w * 0.045, h * 0.12);
      ctx.fillStyle = '#1b1f2a';
      ctx.font = `400 ${w * 0.06}px ${PIX}`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOADING...', w * 0.08, h * 0.45);
      const n = 10;
      const bw = (w * 0.84) / n;
      ctx.strokeStyle = '#4d5a6e';
      ctx.lineWidth = w * 0.008;
      ctx.strokeRect(w * 0.08, h * 0.6, w * 0.84, h * 0.22);
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = i % 2 ? '#2f7bff' : '#4fc4ff';
        ctx.fillRect(w * 0.08 + i * bw + w * 0.008, h * 0.62, bw - w * 0.012, h * 0.18);
      }
    },
  },
  {
    id: 'datestamp',
    name: '橙色日期戳',
    group: '千禧物件',
    size: 0.34,
    ratio: 0.24,
    draw(ctx, w, h) {
      dateStamp(ctx, stamp(new Date(), 'ccd'), w * 0.97, h * 0.82, h * 0.62);
    },
  },
  {
    id: 'digicam',
    name: '卡片机',
    group: '千禧物件',
    size: 0.26,
    svg: svg(200, 140, `
      <defs><linearGradient id="cm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".55" stop-color="#d3d9e2"/><stop offset="1" stop-color="#9aa4b2"/></linearGradient></defs>
      <rect x="30" y="10" width="38" height="16" rx="5" fill="#c5ccd6" stroke="#5f6a79" stroke-width="3"/>
      <rect x="8" y="22" width="184" height="110" rx="18" fill="url(#cm)" stroke="#5f6a79" stroke-width="4"/>
      <rect x="128" y="34" width="48" height="22" rx="4" fill="#f7f9fc" stroke="#5f6a79" stroke-width="3"/>
      <path d="M136 38 L136 52 M144 38 L144 52 M152 38 L152 52 M160 38 L160 52 M168 38 L168 52" stroke="#c9d1dc" stroke-width="2"/>
      <rect x="22" y="36" width="30" height="18" rx="4" fill="#1c2233"/>
      <circle cx="100" cy="82" r="41" fill="#d6dce5" stroke="#5f6a79" stroke-width="4"/>
      <circle cx="100" cy="82" r="31" fill="#2f6bff"/>
      <circle cx="100" cy="82" r="22" fill="#0f1320"/>
      <circle cx="100" cy="82" r="11" fill="#1f2a4a"/>
      <circle cx="92" cy="74" r="6" fill="#fff" opacity=".75"/>
      <circle cx="162" cy="112" r="5" fill="#ff8a1c"/>
      <path d="M18 30 C40 26 70 26 96 28" stroke="#fff" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>`),
  },
];

// ----------------------------------------------------------------- layouts

// 16 mini stickers: each of the 4 photos fills one row and repeats in four
// kitsch mini-frames (a column each), like a 2000s purikura sticker sheet.
const MINI_DECOS = ['stars', 'hearts', 'lace', 'flowers'];
const MINI_SHAPE = { hearts: 'heart', flowers: 'circle', stars: 'round', lace: 'round' };

function miniSheet() {
  const W = 1200;
  const H = 1800;
  const side = 44;
  const top = 176;
  const bottom = 196;
  const gap = 14;
  const cw = (W - side * 2 - gap * 3) / 4;
  const ch = (H - top - bottom - gap * 3) / 4;
  const slots = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const deco = MINI_DECOS[col];
      const cell = { x: side + col * (cw + gap), y: top + row * (ch + gap), w: cw, h: ch };
      // the heart shape only uses the middle of its box: let the box overhang so the heart is centred
      const [ix, iy, dy] = { hearts: [6, 6, -12], flowers: [26, 24, 0], stars: [24, 26, 0], lace: [28, 30, 0] }[deco];
      slots.push({ x: cell.x + ix, y: cell.y + iy + dy, w: cw - ix * 2, h: ch - iy * 2, shape: MINI_SHAPE[deco], r: 18, src: row, kind: 'mini', deco, cell, row, col });
    }
  }
  return {
    id: 'mini16',
    name: '十六连小贴纸',
    desc: '4 张照片 × 4 种小花边 · 千禧年大头贴贴纸',
    size: [W, H],
    photos: 4,
    slots,
    sheet: 'sticker',
    header: { y: 0, h: top },
    footer: { y: H - bottom, h: bottom },
  };
}

const grid4 = gridLayout({ id: 'grid4', name: '四宫格', cols: 2, rows: 2, W: 1200, H: 1800, pad: 64, gap: 32, top: 150, bottom: 250, aspect: 0.75 });
grid4.desc = '6 寸四宫格 · 每张都烧上橙色日期';
grid4.header = { y: 0, h: 150 };
grid4.slots = grid4.slots.map((s) => ({ ...s, kind: 'grid' }));

// An open clamshell phone; the photo is on its 4:5 screen (176×220 era).
const PHONE = {
  lid: { x: 186, y: 40, w: 828, h: 1086, r: 78 },
  bezel: { x: 248, y: 110, w: 704, h: 968, r: 26 },
  screen: { x: 262, y: 124, w: 676, h: 940 },
  hinge: { x: 214, y: 1120, w: 772, h: 64 },
  base: { top: 1180, bottom: 1476, t0: 204, t1: 996, b0: 150, b1: 1050 },
};

export const layouts = [
  miniSheet(),
  grid4,
  {
    id: 'flip',
    name: '翻盖手机',
    desc: '一张照片 · 显示在翻盖手机屏幕里',
    size: [1200, 1500],
    photos: 1,
    // status bar above (48 px) and soft keys below (47 px) stay on the screen
    slots: [{ x: 262, y: 172, w: 676, h: 845, kind: 'phone' }],
    footer: { y: 1476, h: 24 },
    phone: PHONE,
  },
];

// ----------------------------------------------------------------- frame parts: mini stickers

function around(x, y, w, h, step) {
  const pts = [];
  const nx = Math.max(1, Math.round(w / step));
  const ny = Math.max(1, Math.round(h / step));
  for (let i = 0; i < nx; i++) pts.push([x + (w * i) / nx, y], [x + w - (w * i) / nx, y + h]);
  for (let j = 0; j < ny; j++) pts.push([x + w, y + (h * j) / ny], [x, y + h - (h * j) / ny]);
  return pts;
}

/** White lace with scalloped edge and punched eyelets around a rect slot. */
function laceMat(ctx, s, color) {
  const pad = 34;
  const c = mkCanvas(s.w + pad * 2, s.h + pad * 2);
  const x = c.getContext('2d');
  x.fillStyle = color;
  rrect(x, pad - 14, pad - 14, s.w + 28, s.h + 28, 10);
  x.fill();
  for (const [px, py] of around(pad - 14, pad - 14, s.w + 28, s.h + 28, 18)) {
    x.beginPath();
    x.arc(px, py, 10.5, 0, TAU);
    x.fill();
  }
  x.globalCompositeOperation = 'destination-out';
  for (const [px, py] of around(pad - 6, pad - 6, s.w + 12, s.h + 12, 16)) {
    x.beginPath();
    x.arc(px, py, 3.2, 0, TAU);
    x.fill();
  }
  for (const [px, py] of around(pad - 20, pad - 20, s.w + 40, s.h + 40, 18)) {
    x.beginPath();
    x.arc(px, py, 2.4, 0, TAU);
    x.fill();
  }
  ctx.drawImage(c, s.x - pad, s.y - pad);
}

function decoHeart(ctx, x, y, r, color, sk) {
  if (sk.pixel) pixHeart(ctx, x, y, r * 2.3, { K: sk.pixInk, P: color, D: sk.heartShade || color, W: '#ffffff' });
  else heart(ctx, x, y, r, color);
}

function decoStar(ctx, x, y, r, color, sk, rot) {
  if (sk.pixel) sprite(ctx, PX_STAR, x - r, y - r, (r * 2) / 11, { K: sk.pixInk, Y: color, W: '#ffffff' });
  else star(ctx, x, y, r, color, '#fff', rot);
}

function decoSpark(ctx, x, y, r, sk) {
  if (sk.pixel) pixSpark(ctx, x, y, r * 2, { Y: sk.star, W: '#ffffff' });
  else twinkle(ctx, x, y, r, sk.spark, sk.sparkGlow);
}

function decoFlower(ctx, x, y, r, sk) {
  if (sk.pixel) {
    sprite(ctx, PX_FLOWER, x - r, y - r, (r * 2) / 7, { P: sk.petal, W: '#ffffff', Y: sk.center });
    return;
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = sk.petal;
  ctx.strokeStyle = sk.petalEdge;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  for (let k = 0; k < 6; k++) {
    ctx.save();
    ctx.rotate((k / 6) * TAU + r);
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.55, r * 0.36, r * 0.52, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.36, 0, TAU);
  ctx.fillStyle = sk.center;
  ctx.fill();
  ctx.lineWidth = r * 0.08;
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.stroke();
  ctx.restore();
}

/** Ribbon bow centred at (x, y), s ≈ half width. */
function bow(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, s * 0.1);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = color;
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(d * s * 0.05, s * 0.05);
    ctx.lineTo(d * s * 0.5, s * 0.95);
    ctx.lineTo(d * s * 0.28, s * 0.84);
    ctx.lineTo(d * s * 0.18, s * 1.05);
    ctx.lineTo(-d * s * 0.08, s * 0.12);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
  for (const d of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(d * s * 0.35, -s * 0.75, d * s * 1.1, -s * 0.55, d * s * 0.98, 0);
    ctx.bezierCurveTo(d * s * 1.05, s * 0.45, d * s * 0.4, s * 0.38, 0, 0);
    ctx.stroke();
    ctx.fill();
  }
  rrect(ctx, -s * 0.2, -s * 0.22, s * 0.4, s * 0.44, s * 0.14);
  ctx.stroke();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [dx, dy] of [[-0.6, -0.15], [0.6, -0.15], [-0.45, 0.12], [0.45, 0.12]]) {
    ctx.beginPath();
    ctx.arc(dx * s, dy * s, s * 0.06, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function miniUnder(ctx, L, sk) {
  for (const s of L.slots) {
    const c = s.cell;
    if (sk.cellFill) {
      rrect(ctx, c.x, c.y, c.w, c.h, 22);
      ctx.fillStyle = sk.cellFill;
      ctx.fill();
    }
    ctx.save();
    ctx.shadowColor = sk.matShadow;
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = sk.mat;
    const cx = s.x + s.w / 2;
    if (s.deco === 'hearts') {
      heartPath(ctx, cx, s.y + s.h * 0.52 + 2, s.w * 0.52 + 13);
      ctx.fill();
    } else if (s.deco === 'flowers') {
      ctx.beginPath();
      ctx.ellipse(cx, s.y + s.h / 2, s.w / 2 + 11, s.h / 2 + 11, 0, 0, TAU);
      ctx.fill();
    } else if (s.deco === 'stars') {
      rrect(ctx, s.x - 11, s.y - 11, s.w + 22, s.h + 22, 28);
      ctx.fill();
    } else laceMat(ctx, s, sk.lace);
    ctx.restore();
  }
}

function miniSlot(ctx, s, info, sk) {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = sk.rim;
  ctx.stroke();
  ctx.restore();
  const cx = s.x + s.w / 2;
  if (s.deco === 'hearts') {
    const cy = s.y + s.h * 0.52;
    const r = s.w * 0.52;
    decoHeart(ctx, cx + r * 0.8, cy - r * 0.64, r * 0.2, sk.heart, sk);
    decoHeart(ctx, cx - r * 0.98, cy + r * 0.1, r * 0.13, sk.heart2, sk);
    decoHeart(ctx, cx - r * 0.4, cy + r * 0.78, r * 0.1, sk.heart, sk);
    decoSpark(ctx, cx - r * 0.74, cy - r * 0.86, r * 0.15, sk);
    decoSpark(ctx, cx + r * 0.66, cy + r * 0.52, r * 0.09, sk);
  } else if (s.deco === 'flowers') {
    const cy = s.y + s.h / 2;
    const flowers = [[-2.25, 25], [-1.55, 17], [-0.95, 21], [-0.2, 15], [0.55, 23], [1.3, 16], [2.0, 22], [2.75, 15]];
    for (const [a, fr] of flowers) decoFlower(ctx, cx + Math.cos(a) * s.w * 0.5, cy + Math.sin(a) * s.h * 0.5, fr, sk);
  } else if (s.deco === 'stars') {
    decoStar(ctx, s.x + 8, s.y + 10, 30, sk.star, sk, -0.25);
    decoStar(ctx, s.x + 2, s.y + s.h - 12, 20, sk.star2, sk, 0.2);
    decoStar(ctx, s.x + s.w * 0.66, s.y - 2, 12, sk.star2, sk, 0.1);
    decoStar(ctx, s.x + s.w + 2, s.y + s.h * 0.56, 11, sk.star, sk, -0.1);
    decoSpark(ctx, s.x + s.w - 20, s.y + 26, 14, sk);
    decoSpark(ctx, s.x + 28, s.y + s.h - 46, 10, sk);
  } else {
    bow(ctx, cx, s.y + 4, 30, sk.ribbon);
    decoHeart(ctx, s.x + 16, s.y + s.h - 16, 12, sk.heart, sk);
  }
  // rectangular stickers keep the camera's burned-in date (hearts / ovals crop that corner away)
  if (s.deco === 'stars' || s.deco === 'lace') dateStamp(ctx, stampText(info), s.x + s.w - 12, s.y + s.h - 12, 19);
}

function miniOver(ctx, L, info, sk) {
  ctx.save();
  ctx.setLineDash([]);
  for (const s of L.slots) {
    rrect(ctx, s.cell.x, s.cell.y, s.cell.w, s.cell.h, 22);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = sk.cut;
    ctx.stroke();
  }
  ctx.restore();
  const hy = L.header.h / 2 + 4;
  sk.logo(ctx, 50, hy, 46, 'left');
  sk.tag(ctx, L.W - 50, hy + 2, 40, 'right');
  sk.slogan(ctx, L.W / 2, L.footer.y + 70, 50, info);
  footLine(ctx, L.W / 2, L.footer.y + 148, info, sk);
}

// ----------------------------------------------------------------- frame parts: 2×2 grid

/** Date + serial on a small dark LCD chip, centred at (x, y). */
function footLine(ctx, x, y, info, sk) {
  const date = stampText(info);
  const serial = serialOf(info);
  ctx.save();
  ctx.font = `400 46px ${LCD}`;
  const sw = ctx.measureText(serial).width;
  ctx.restore();
  const dw = sevenPath(ctx, date, 32, false);
  const gap = 30;
  const x0 = x - (dw + gap + sw) / 2;
  rrect(ctx, x0 - 26, y - 31, dw + gap + sw + 52, 62, 31);
  ctx.fillStyle = sk.chip;
  ctx.fill();
  if (sk.chipEdge) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = sk.chipEdge;
    ctx.stroke();
  }
  dateStamp(ctx, date, x0, y + 16, 32, { align: 'left' });
  label(ctx, serial, x0 + dw + gap, y + 1, { font: LCD, size: 46, fill: '#d8ffe9', align: 'left' });
}

function gridUnder(ctx, L, sk) {
  for (const s of L.slots) sk.gridMat(ctx, s);
}

function gridSlot(ctx, s, info, sk) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = sk.photoLine;
  ctx.stroke();
  ctx.restore();
  dateStamp(ctx, stampText(info), s.x + s.w - 24, s.y + s.h - 24, 36);
}

function gridOver(ctx, L, info, sk) {
  sk.logo(ctx, 64, 76, 42, 'left');
  sk.tag(ctx, L.W - 64, 78, 38, 'right');
  sk.slogan(ctx, L.W / 2, L.footer.y + 96, 56, info);
  footLine(ctx, L.W / 2, L.footer.y + 180, info, sk);
}

/** Photo mat: rounded plate behind a photo (optionally glowing / shadowed). */
function mat(ctx, s, { pad = 14, bottom = pad, r = 18, fill = '#fff', stroke, strokeW = 3, glow, shadow = 'rgba(0,0,0,0.25)' }) {
  ctx.save();
  ctx.shadowColor = glow || shadow;
  ctx.shadowBlur = glow ? 34 : 18;
  ctx.shadowOffsetY = glow ? 0 : 6;
  rrect(ctx, s.x - pad, s.y - pad, s.w + pad * 2, s.h + pad + bottom, r);
  ctx.fillStyle = typeof fill === 'function' ? fill(s) : fill;
  ctx.fill();
  ctx.restore();
  if (stroke) {
    rrect(ctx, s.x - pad, s.y - pad, s.w + pad * 2, s.h + pad + bottom, r);
    ctx.lineWidth = strokeW;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// ----------------------------------------------------------------- frame parts: flip phone

function basePath(ctx, b) {
  const r = 46;
  const edge = (x0, x1, y) => x0 + ((x1 - x0) * (y - b.top)) / (b.bottom - b.top);
  ctx.beginPath();
  ctx.moveTo(b.t0, b.top);
  ctx.lineTo(b.t1, b.top);
  ctx.lineTo(edge(b.t1, b.b1, b.bottom - r), b.bottom - r);
  ctx.quadraticCurveTo(b.b1, b.bottom, b.b1 - r, b.bottom);
  ctx.lineTo(b.b0 + r, b.bottom);
  ctx.quadraticCurveTo(b.b0, b.bottom, edge(b.t0, b.b0, b.bottom - r), b.bottom - r);
  ctx.closePath();
}

function keypad(ctx, b, ph) {
  const at = (t, u) => {
    const y = b.top + (b.bottom - b.top) * t;
    const x0 = b.t0 + (b.b0 - b.t0) * t;
    const x1 = b.t1 + (b.b1 - b.t1) * t;
    return [(x0 + x1) / 2 + (u * (x1 - x0)) / 2, y];
  };
  const key = (t, u, kw, kh, fill, text, color = ph.keyText) => {
    const [x, y] = at(t, u);
    const s = 0.78 + 0.3 * t;
    const w = kw * s;
    const hh = kh * s;
    ctx.save();
    ctx.shadowColor = ph.glow;
    ctx.shadowBlur = 10;
    rrect(ctx, x - w / 2, y - hh / 2, w, hh, hh / 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = ph.edge;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    rrect(ctx, x - w / 2 + hh * 0.35, y - hh / 2 + 3, w - hh * 0.7, hh * 0.22, hh * 0.1);
    ctx.fill();
    if (text) label(ctx, text, x, y + 1, { font: LCD, size: hh * 0.9, fill: color });
  };
  const [nx, ny] = at(0.21, 0);
  ctx.save();
  ctx.shadowColor = ph.glow;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.ellipse(nx, ny, 118, 50, 0, 0, TAU);
  ctx.fillStyle = ph.key;
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ph.edge;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(nx, ny, 50, 21, 0, 0, TAU);
  ctx.fillStyle = ph.glow;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ph.edge;
  for (const [dx, dy, a] of [[0, -36, 0], [0, 36, Math.PI], [-86, 0, -Math.PI / 2], [86, 0, Math.PI / 2]]) {
    ctx.save();
    ctx.translate(nx + dx, ny + dy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(7, 4);
    ctx.lineTo(-7, 4);
    ctx.fill();
    ctx.restore();
  }
  key(0.1, -0.72, 118, 30, ph.key);
  key(0.1, 0.72, 118, 30, ph.key);
  key(0.31, -0.74, 118, 32, '#6fe08a');
  key(0.31, 0.74, 118, 32, '#ff6b7a');
  const labels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  [0.49, 0.635, 0.78, 0.92].forEach((t, r) => [-0.6, 0, 0.6].forEach((u, c) => key(t, u, 176, 32, ph.key, labels[r * 3 + c])));
}

function phoneUnder(ctx, L, sk) {
  const P = L.phone;
  const ph = sk.phone;
  const ld = P.lid;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.42)';
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = ph.mid;
  rrect(ctx, ld.x, ld.y, ld.w, ld.h, ld.r);
  ctx.fill();
  basePath(ctx, P.base);
  ctx.fill();
  ctx.restore();
  // keypad half, tilted towards us
  basePath(ctx, P.base);
  let g = ctx.createLinearGradient(0, P.base.top, 0, P.base.bottom);
  g.addColorStop(0, ph.lo);
  g.addColorStop(0.3, ph.mid);
  g.addColorStop(1, ph.hi);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = ph.edge;
  ctx.stroke();
  keypad(ctx, P.base, ph);
  // hinge
  const hg = P.hinge;
  g = ctx.createLinearGradient(0, hg.y, 0, hg.y + hg.h);
  g.addColorStop(0, ph.lo);
  g.addColorStop(0.35, ph.hi);
  g.addColorStop(0.6, ph.mid);
  g.addColorStop(1, ph.lo);
  rrect(ctx, hg.x, hg.y, hg.w, hg.h, hg.h / 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = ph.edge;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(hg.x + hg.w * 0.22, hg.y + 4);
  ctx.lineTo(hg.x + hg.w * 0.22, hg.y + hg.h - 4);
  ctx.moveTo(hg.x + hg.w * 0.78, hg.y + 4);
  ctx.lineTo(hg.x + hg.w * 0.78, hg.y + hg.h - 4);
  ctx.stroke();
  // lid: brushed metal with a sheen
  g = ctx.createLinearGradient(ld.x, 0, ld.x + ld.w, 0);
  [[0, ph.lo], [0.07, ph.mid], [0.2, ph.hi], [0.5, ph.mid], [0.8, ph.hi], [0.93, ph.mid], [1, ph.lo]].forEach(([o, c]) => g.addColorStop(o, c));
  rrect(ctx, ld.x, ld.y, ld.w, ld.h, ld.r);
  ctx.fillStyle = g;
  ctx.fill();
  g = ctx.createLinearGradient(0, ld.y, 0, ld.y + ld.h);
  g.addColorStop(0, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.16, 'rgba(255,255,255,0)');
  g.addColorStop(0.85, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.2)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = ph.edge;
  ctx.stroke();
  rrect(ctx, ld.x + 8, ld.y + 8, ld.w - 16, ld.h - 16, ld.r - 8);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.stroke();
  // earpiece + sensor
  rrect(ctx, 520, ld.y + 28, 160, 18, 9);
  ctx.fillStyle = '#23262e';
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 534; x < 670; x += 12) ctx.fillRect(x, ld.y + 35, 5, 4);
  ctx.beginPath();
  ctx.arc(724, ld.y + 37, 8, 0, TAU);
  ctx.fillStyle = '#10141f';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(722, ld.y + 35, 3, 0, TAU);
  ctx.fillStyle = '#6fb6ff';
  ctx.fill();
  // glass + screen
  const bz = P.bezel;
  rrect(ctx, bz.x, bz.y, bz.w, bz.h, bz.r);
  ctx.fillStyle = '#0b0d12';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.stroke();
  const sc = P.screen;
  ctx.fillStyle = ph.ui;
  ctx.fillRect(sc.x, sc.y, sc.w, sc.h);
  // engraved name under the screen
  label(ctx, 'DIGI 2003', 601, ld.y + ld.h - 22, { font: PIX, size: 20, fill: 'rgba(255,255,255,0.8)', spacing: 6 });
  label(ctx, 'DIGI 2003', 600, ld.y + ld.h - 23, { font: PIX, size: 20, fill: ph.edge, spacing: 6 });
}

function phoneSlot(ctx, s, info) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.stroke();
  ctx.restore();
  dateStamp(ctx, stampText(info), s.x + s.w - 26, s.y + s.h - 24, 42);
}

function envelope(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w / 2, y + h * 0.6);
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.restore();
}

function charms(ctx, P, colors) {
  const [c1, c2, c3] = colors;
  const x0 = P.hinge.x + 30;
  const y0 = P.hinge.y + 42;
  const pts = [[x0, y0], [x0 - 36, y0 + 44], [x0 - 104, y0 + 56], [x0 - 116, y0 + 150]];
  const bez = (t) => {
    const u = 1 - t;
    const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    return [k.reduce((a, kk, i) => a + kk * pts[i][0], 0), k.reduce((a, kk, i) => a + kk * pts[i][1], 0)];
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  ctx.bezierCurveTo(...pts[1], ...pts[2], ...pts[3]);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = c1;
  ctx.stroke();
  [0.18, 0.3, 0.42, 0.54, 0.66, 0.78, 0.9].forEach((t, i) => {
    const [x, y] = bez(t);
    ctx.beginPath();
    ctx.arc(x, y, i % 2 ? 9 : 12, 0, TAU);
    ctx.fillStyle = [c1, c2, c3][i % 3];
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 3, y - 3, 3, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
  });
  const [ex, ey] = pts[3];
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - 24, ey + 30);
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex + 22, ey + 22);
  ctx.stroke();
  star(ctx, ex - 28, ey + 58, 32, c2, '#ffffff', -0.2);
  heart(ctx, ex + 30, ey + 46, 24, c1, '#ffffff');
  ctx.restore();
}

function phoneOver(ctx, L, info, sk) {
  const P = L.phone;
  const ph = sk.phone;
  const sc = P.screen;
  // status bar
  const d = new Date(info.date || Date.now());
  signalBars(ctx, sc.x + 18, sc.y + 10, 28, ph.uiText);
  envelope(ctx, sc.x + 76, sc.y + 14, 34, 22, ph.uiText);
  battery(ctx, sc.x + sc.w - 70, sc.y + 12, 52, 24, ph.uiText, 3);
  label(ctx, `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, sc.x + sc.w / 2, sc.y + 25, { font: LCD, size: 40, fill: ph.uiText });
  // soft keys
  const ky = sc.y + sc.h - 23;
  label(ctx, '选项', sc.x + 22, ky, { font: TECH, size: 32, fill: ph.uiText, align: 'left' });
  label(ctx, '返回', sc.x + sc.w - 22, ky, { font: TECH, size: 32, fill: ph.uiText, align: 'right' });
  rrect(ctx, sc.x + sc.w / 2 - 22, ky - 13, 44, 26, 6);
  ctx.lineWidth = 3;
  ctx.strokeStyle = ph.uiText;
  ctx.stroke();
  // glass glare
  const bz = P.bezel;
  ctx.save();
  rrect(ctx, bz.x, bz.y, bz.w, bz.h, bz.r);
  ctx.clip();
  const g = ctx.createLinearGradient(bz.x, bz.y, bz.x + bz.w * 0.6, bz.y + bz.h * 0.5);
  g.addColorStop(0, 'rgba(255,255,255,0.2)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.05)');
  g.addColorStop(0.46, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(bz.x, bz.y, bz.w, bz.h);
  ctx.restore();
  charms(ctx, P, ph.charm);
  // maker's line down the right margin
  ctx.save();
  ctx.translate(L.W - 44, 1460);
  ctx.rotate(-Math.PI / 2);
  label(ctx, `DIGI 2003 · ${serialOf(info)}`, 0, 0, { font: LCD, size: 38, fill: sk.ink, stroke: sk.inkStroke, sw: 0.16, align: 'left' });
  ctx.restore();
}

// ----------------------------------------------------------------- skins: backgrounds

function bgDreamy(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, '#26093f');
  g.addColorStop(0.5, '#7a2790');
  g.addColorStop(1, '#ff79c1');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const r = rng(77);
  for (let i = 0; i < 30; i++) {
    const x = r() * W;
    const y = r() * H;
    const rad = 40 + r() * 140;
    const b = ctx.createRadialGradient(x, y, 0, x, y, rad);
    b.addColorStop(0, `rgba(255,200,240,${(0.08 + r() * 0.16).toFixed(3)})`);
    b.addColorStop(1, 'rgba(255,200,240,0)');
    ctx.fillStyle = b;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let k = -H; k < W; k += 70) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + H, H);
    ctx.moveTo(k + H, 0);
    ctx.lineTo(k, H);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = `rgba(255,255,255,${(0.2 + r() * 0.6).toFixed(2)})`;
    const s = 1 + r() * 2.5;
    ctx.fillRect(r() * W, r() * H, s, s);
  }
  for (let i = 0; i < 46; i++) twinkle(ctx, r() * W, r() * H, 5 + r() * 14, '#ffffff', 'rgba(255,130,215,0.9)');
}

function bgChrome(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04103a');
  g.addColorStop(0.55, '#1540c0');
  g.addColorStop(1, '#5d9bff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const hy = H * 0.62;
  const hg = ctx.createLinearGradient(0, hy - 140, 0, hy + 30);
  hg.addColorStop(0, 'rgba(120,220,255,0)');
  hg.addColorStop(0.85, 'rgba(170,240,255,0.5)');
  hg.addColorStop(1, 'rgba(170,240,255,0)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, hy - 140, W, 170);
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(150,225,255,0.42)';
  ctx.beginPath();
  for (let i = 1; i < 18; i++) {
    const t = i / 17;
    const y = hy + (H - hy) * t * t;
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  for (let i = -14; i <= 14; i++) {
    ctx.moveTo(W / 2 + i * 34, hy);
    ctx.lineTo(W / 2 + i * 190, H);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(150,225,255,0.09)';
  ctx.beginPath();
  for (let x = 30; x < W; x += 60) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, hy);
  }
  for (let y = 30; y < hy; y += 60) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,20,0.12)';
  for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
  const r = rng(31);
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = r() < 0.5 ? 'rgba(160,240,255,0.5)' : 'rgba(255,255,255,0.35)';
    ctx.fillRect(Math.round((r() * W) / 6) * 6, Math.round((r() * hy) / 6) * 6, 4, 4);
  }
  for (let i = 0; i < 14; i++) twinkle(ctx, r() * W, r() * hy, 6 + r() * 14, '#ffffff', 'rgba(90,190,255,0.95)');
}

function doodles(ctx, W, H, seed) {
  const r = rng(seed);
  const inks = ['#3b5bdb', '#ff6f9f', '#2fb37a', '#ff9f1c'];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  for (let i = 0; i < 40; i++) {
    const x = r() * W;
    const y = r() * H;
    const s = 14 + r() * 24;
    const ink = inks[Math.floor(r() * inks.length)];
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    const kind = Math.floor(r() * 5);
    if (kind === 0) {
      starPath(ctx, x, y, s, 0.45, -Math.PI / 2 + (r() - 0.5) * 0.6);
      ctx.stroke();
    } else if (kind === 1) {
      heartPath(ctx, x, y, s * 0.8);
      ctx.stroke();
    } else if (kind === 2) {
      ctx.beginPath();
      for (let a = 0; a < TAU * 2.2; a += 0.2) ctx.lineTo(x + Math.cos(a) * a * s * 0.08, y + Math.sin(a) * a * s * 0.08);
      ctx.stroke();
    } else if (kind === 3) {
      ctx.beginPath();
      ctx.arc(x, y, s * 0.7, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y + s * 0.05, s * 0.4, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
      ctx.fillRect(x - s * 0.3, y - s * 0.28, 5, 8);
      ctx.fillRect(x + s * 0.2, y - s * 0.28, 5, 8);
    } else {
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.5, s * 0.28, s * 0.2, -0.4, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.25, y + s * 0.45);
      ctx.lineTo(x + s * 0.25, y - s * 0.6);
      ctx.quadraticCurveTo(x + s * 0.6, y - s * 0.3, x + s * 0.7, y - s * 0.05);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function bgDiary(ctx, W, H) {
  ctx.fillStyle = '#fffaf0';
  ctx.fillRect(0, 0, W, H);
  speckle(ctx, 0, 0, W, H, { n: 2400, color: 'rgba(120,100,60,0.05)', size: 2, seed: 12 });
  ctx.fillStyle = '#c6dcf4';
  for (let y = 70; y < H; y += 58) ctx.fillRect(0, y, W, 2);
  ctx.fillStyle = '#f4a9a9';
  ctx.fillRect(104, 0, 2.5, H);
  ctx.fillRect(110, 0, 2.5, H);
  for (let y = 150; y < H; y += 300) {
    ctx.beginPath();
    ctx.arc(26, y, 14, 0, TAU);
    ctx.fillStyle = '#e8dfcb';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(120,100,60,0.3)';
    ctx.stroke();
  }
  doodles(ctx, W, H, 5);
}

function bubble(ctx, x, y, rad, tint = '255,120,190') {
  const g = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.35, rad * 0.1, x, y, rad);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.55, `rgba(${tint},0.12)`);
  g.addColorStop(1, `rgba(${tint},0.45)`);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, rad, 0, TAU);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, rad * 0.05);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, rad * 0.7, Math.PI * 1.08, Math.PI * 1.42);
  ctx.lineWidth = rad * 0.12;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + rad * 0.42, y + rad * 0.4, rad * 0.07, 0, TAU);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}

function bgBubble(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#ffe8f4');
  g.addColorStop(1, '#ffbddd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let y = 20, row = 0; y < H + 40; y += 56, row++) {
    for (let x = (row % 2) * 28; x < W + 40; x += 56) {
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, TAU);
      ctx.fill();
    }
  }
  const r = rng(21);
  for (let i = 0; i < 34; i++) bubble(ctx, r() * W, r() * H, 18 + r() * 90);
}

function bgPixel(ctx, W, H) {
  ctx.fillStyle = '#150f3a';
  ctx.fillRect(0, 0, W, H);
  const B = 24;
  ctx.fillStyle = '#1c154c';
  for (let y = 0; y < H; y += B) for (let x = ((y / B) % 2) * B; x < W; x += B * 2) ctx.fillRect(x, y, B, B);
  const r = rng(44);
  const cols = ['#ffffff', '#6fe3ff', '#ffe14a', '#ff7ad9'];
  for (let i = 0; i < 140; i++) {
    ctx.fillStyle = cols[Math.floor(r() * 4)];
    ctx.fillRect(Math.floor((r() * W) / 8) * 8, Math.floor((r() * H) / 8) * 8, 8, 8);
  }
  for (let i = 0; i < 26; i++) sprite(ctx, r() < 0.5 ? PX_TWINKLE : PX_SPARK, Math.floor((r() * W) / 6) * 6, Math.floor((r() * H) / 6) * 6, 6, { Y: cols[1 + Math.floor(r() * 3)], W: '#ffffff' });
  const bands = ['#ff4f6d', '#ff9a3c', '#ffe14a', '#5fe07a', '#4fb4ff', '#9b6bff'];
  bands.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, i * 6, W, 6);
    ctx.fillRect(0, H - (i + 1) * 6, W, 6);
  });
}

// ----------------------------------------------------------------- skins

const MARS_A = '伱是莪の唯①☆ωǒ嗳伱☆莪の寂寞伱不懂☆';
const MARS_B = '45°仰望天空☆ゞ青春ゞ☆好朋友一辈子☆';
const TXT = {
  dreamyTag: '╰☆ 非主流の小幸福 ☆╮',
  dreamySlogan: '伱是莪の唯①  ωǒ嗳伱',
  chromeTag: '数码 · 1.3M CCD',
  chromeSlogan: '★ 数码青春 · 永不断电 ★',
  diaryTag: '青春纪念册',
  diarySlogan: '年月日 晴 · 好朋友一辈子',
  bubbleTag: '泡泡少女',
  bubbleSlogan: '☆ 粉红泡泡 · 少女心 ☆',
  pixelTag: '像素闪图',
  pixelSlogan: 'LOADING 青春... 99%',
  phone: '选项返回',
};

/** Every CJK string the frames draw on canvas (→ `fonts.text`). */
export const FRAME_TEXT = [MARS_A, MARS_B, ...Object.values(TXT)].join('');

function metal(ctx, y0, y1) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  [[0, '#ffffff'], [0.3, '#b9c6d8'], [0.5, '#eef4fb'], [0.72, '#8595ad'], [1, '#dfe7f2']].forEach(([o, c]) => g.addColorStop(o, c));
  return g;
}

function pixelShadow(ctx, text, x, y, size, align, font, colors) {
  const d = Math.max(2, Math.round(size / 12));
  label(ctx, text, x + d * 2, y + d * 2, { font, size, fill: colors[2], align });
  label(ctx, text, x + d, y + d, { font, size, fill: colors[1], align });
  label(ctx, text, x, y, { font, size, fill: colors[0], align });
}

function tape(ctx, x, y, w, h, rot, color, stripe) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  for (let i = 1; i <= 6; i++) ctx.lineTo(w / 2 + (i % 2 ? 6 : 0), -h / 2 + (h * i) / 6);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = 5; i >= 0; i--) ctx.lineTo(-w / 2 - (i % 2 ? 6 : 0), -h / 2 + (h * i) / 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = stripe;
  for (let k = -w; k < w; k += 24) {
    ctx.beginPath();
    ctx.moveTo(k, -h / 2);
    ctx.lineTo(k + 10, -h / 2);
    ctx.lineTo(k + 10 + h, h / 2);
    ctx.lineTo(k + h, h / 2);
    ctx.fill();
  }
  ctx.restore();
}

const SKINS = {
  dreamy: {
    mat: '#ffffff',
    matShadow: 'rgba(60,0,60,0.35)',
    cellFill: 'rgba(255,255,255,0.12)',
    cut: 'rgba(255,255,255,0.7)',
    rim: '#ff8fd0',
    heart: '#ff4fa3',
    heart2: '#ffb3e0',
    petal: '#ffffff',
    petalEdge: '#ff9ad5',
    center: '#ffd23f',
    star: '#fff27a',
    star2: '#ff9ad5',
    lace: '#ffffff',
    ribbon: '#ff5fb0',
    spark: '#ffffff',
    sparkGlow: 'rgba(255,110,210,0.95)',
    ink: '#ffe6f7',
    inkStroke: '#4a0f5c',
    chip: 'rgba(38,8,62,0.82)',
    chipEdge: 'rgba(255,190,235,0.6)',
    photoLine: 'rgba(255,255,255,0.9)',
    phone: { hi: '#ffffff', mid: '#d9dee6', lo: '#9aa3b0', edge: '#6e7886', key: '#fff4fb', keyText: '#b0407f', glow: '#ff9ad5', ui: '#2a0f45', uiText: '#ffd6f0', charm: ['#ff5fb0', '#fff27a', '#b9a2ff'] },
    bg: bgDreamy,
    gridMat: (ctx, s) => mat(ctx, s, { pad: 12, r: 20, fill: '#ffffff', glow: 'rgba(255,90,200,0.9)' }),
    logo: (ctx, x, y, size, align) => label(ctx, 'DIGI 2003', x, y, { font: PIX, size, fill: ['#ffffff', '#ffd1f0', '#ff7ac8'], stroke: '#3d0f55', sw: 0.34, glow: 'rgba(255,111,194,0.9)', align }),
    tag: (ctx, x, y, size, align) => label(ctx, TXT.dreamyTag, x, y, { font: CUTE, size, fill: ['#ffffff', '#ffc2ea'], stroke: '#5a1a70', sw: 0.24, align }),
    slogan: (ctx, x, y, size) => label(ctx, TXT.dreamySlogan, x, y, { font: CUTE, size, fill: ['#ffffff', '#ffb3e0', '#ff5fb8'], stroke: '#4a0f5c', sw: 0.26, inner: '#ffffff', glow: 'rgba(255,90,190,0.8)' }),
    extra(ctx, L) {
      const col = { font: CUTE, fill: '#ffe6f7', stroke: '#4a0f5c' };
      const r = rng(7);
      if (L.id === 'grid4') {
        column(ctx, MARS_A, 32, 160, 1540, { ...col, size: 34 });
        column(ctx, MARS_B, L.W - 32, 160, 1540, { ...col, size: 34 });
        for (const s of L.slots) {
          twinkle(ctx, s.x + 6, s.y + 8, 30, '#ffffff', 'rgba(255,110,210,0.95)');
          twinkle(ctx, s.x + s.w - 10, s.y + 40, 14, '#ffffff', 'rgba(255,110,210,0.95)');
        }
      } else if (L.id === 'flip') {
        column(ctx, MARS_A, 93, 50, 1100, { ...col, size: 54 });
        column(ctx, MARS_B, L.W - 93, 50, 1060, { ...col, size: 54 });
        for (let i = 0; i < 10; i++) twinkle(ctx, 20 + r() * 150, 40 + r() * 1400, 6 + r() * 14, '#ffffff', 'rgba(255,110,210,0.95)');
      } else {
        for (let i = 0; i < 14; i++) twinkle(ctx, r() * L.W, 10 + r() * 34, 4 + r() * 9, '#ffffff', 'rgba(255,110,210,0.95)');
      }
    },
  },

  chrome: {
    mat: '#eef4fb',
    matShadow: 'rgba(0,10,50,0.5)',
    cellFill: 'rgba(150,210,255,0.14)',
    cut: 'rgba(200,240,255,0.85)',
    rim: '#6fd0ff',
    heart: '#6fe3ff',
    heart2: '#d6f6ff',
    petal: '#eaf6ff',
    petalEdge: '#6fb6ff',
    center: '#2f6bff',
    star: '#8fd8ff',
    star2: '#2f6bff',
    lace: '#e9f1fb',
    ribbon: '#2f6bff',
    spark: '#ffffff',
    sparkGlow: 'rgba(80,180,255,0.95)',
    ink: '#d8f2ff',
    inkStroke: '#061a4a',
    chip: 'rgba(3,12,48,0.86)',
    chipEdge: 'rgba(150,225,255,0.7)',
    photoLine: 'rgba(10,26,74,0.9)',
    phone: { hi: '#ffffff', mid: '#c8d3e2', lo: '#7d8ba0', edge: '#4d5a6e', key: '#eef6ff', keyText: '#1f47b8', glow: '#6fd0ff', ui: '#061a4a', uiText: '#bfe6ff', charm: ['#2f6bff', '#dff3ff', '#6fe3ff'] },
    bg: bgChrome,
    gridMat: (ctx, s) => mat(ctx, s, { pad: 16, r: 12, fill: (q) => metal(ctx, q.y - 16, q.y + q.h + 16), stroke: '#0a1a4a', shadow: 'rgba(0,10,50,0.55)' }),
    logo: (ctx, x, y, size, align) => label(ctx, 'DIGI 2003', x, y, { font: PIX, size, fill: ['#ffffff', '#cfdcee', '#6f82a0', '#eef5ff', '#9fb1ca'], stroke: '#061a4a', sw: 0.34, glow: 'rgba(90,190,255,0.95)', align }),
    tag: (ctx, x, y, size, align) => label(ctx, TXT.chromeTag, x, y, { font: TECH, size, fill: ['#ffffff', '#a9e4ff'], stroke: '#061a4a', sw: 0.22, glow: 'rgba(90,190,255,0.8)', align }),
    slogan: (ctx, x, y, size) => label(ctx, TXT.chromeSlogan, x, y, { font: TECH, size, fill: ['#ffffff', '#cfdcee', '#7f93b3', '#eef5ff'], stroke: '#061a4a', sw: 0.24, glow: 'rgba(90,190,255,0.9)' }),
    extra(ctx, L) {
      const m = 20;
      const len = 64;
      ctx.save();
      ctx.strokeStyle = 'rgba(210,245,255,0.95)';
      ctx.lineWidth = 6;
      ctx.lineCap = 'square';
      for (const [x, y, dx, dy] of [[m, m, 1, 1], [L.W - m, m, -1, 1], [m, L.H - m, 1, -1], [L.W - m, L.H - m, -1, -1]]) {
        ctx.beginPath();
        ctx.moveTo(x, y + dy * len);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * len, y);
        ctx.stroke();
      }
      ctx.restore();
      if (L.id === 'flip') {
        label(ctx, '● REC', 40, 40, { font: LCD, size: 44, fill: '#ff5a5a', align: 'left', glow: 'rgba(255,60,60,0.8)' });
        label(ctx, '1.3M', L.W - 40, 40, { font: LCD, size: 44, fill: '#d8f2ff', align: 'right', glow: 'rgba(90,190,255,0.9)' });
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(1080 - i * 70, 170 + i * 60, 10 + (i % 3) * 12, 0, TAU);
          ctx.fillStyle = `rgba(180,235,255,${0.12 + (i % 2) * 0.1})`;
          ctx.fill();
        }
      }
    },
  },

  diary: {
    mat: '#ffffff',
    matShadow: 'rgba(80,60,30,0.25)',
    cellFill: 'rgba(255,255,255,0.55)',
    cut: 'rgba(110,130,170,0.5)',
    rim: '#ffb3c8',
    heart: '#ff7aa2',
    heart2: '#ffc4d6',
    petal: '#ffffff',
    petalEdge: '#ffb13d',
    center: '#ffd23f',
    star: '#ffe14a',
    star2: '#8fd0ff',
    lace: '#ffffff',
    ribbon: '#ff8fb1',
    spark: '#ffcf3a',
    sparkGlow: null,
    ink: '#3b5bdb',
    inkStroke: null,
    chip: '#39406a',
    chipEdge: null,
    photoLine: 'rgba(0,0,0,0.15)',
    phone: { hi: '#ffffff', mid: '#e6e9ef', lo: '#b3bac6', edge: '#8a93a2', key: '#ffffff', keyText: '#3b5bdb', glow: '#9fd0ff', ui: '#fffaf0', uiText: '#3b5bdb', charm: ['#ff8fb1', '#ffe14a', '#8fd0ff'] },
    bg: bgDiary,
    gridMat: (ctx, s) => mat(ctx, s, { pad: 16, bottom: 16, r: 4, fill: '#ffffff', shadow: 'rgba(80,60,30,0.3)' }),
    logo(ctx, x, y, size, align) {
      label(ctx, 'DIGI 2003', x, y, { font: HAND, weight: 700, size: size * 1.5, fill: '#3b5bdb', align });
      ctx.save();
      ctx.font = `700 ${size * 1.5}px ${HAND}`;
      const w = ctx.measureText('DIGI 2003').width;
      const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
      ctx.strokeStyle = '#ff6f9f';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) ctx.lineTo(x0 + (w * i) / 24, y + size * 0.62 + Math.sin(i * 1.3) * 4);
      ctx.stroke();
      ctx.restore();
    },
    tag: (ctx, x, y, size, align) => label(ctx, TXT.diaryTag, x, y, { font: CUTE, size: size * 1.1, fill: '#ff6f9f', stroke: '#ffffff', sw: 0.3, align }),
    slogan(ctx, x, y, size, info) {
      const d = shotDate(info);
      const t = `${d.y}年${d.m}月${d.d}日 晴 · 好朋友一辈子`;
      label(ctx, t, x, y, { font: CUTE, size: size * 0.86, fill: '#3b5bdb', stroke: '#ffffff', sw: 0.2 });
    },
    extra(ctx, L) {
      const pink = 'rgba(255,160,195,0.82)';
      const blue = 'rgba(140,200,255,0.82)';
      const stripe = 'rgba(255,255,255,0.45)';
      if (L.id === 'grid4') {
        L.slots.forEach((s, i) => {
          tape(ctx, s.x + 34, s.y + 8, 128, 40, -0.62, i % 2 ? blue : pink, stripe);
          tape(ctx, s.x + s.w - 34, s.y + 8, 128, 40, 0.62, i % 2 ? pink : blue, stripe);
        });
      } else if (L.id === 'flip') {
        tape(ctx, 220, 70, 190, 56, -0.7, pink, stripe);
        tape(ctx, 980, 70, 190, 56, 0.7, blue, stripe);
        label(ctx, 'my phone ~', 100, 1080, { font: HAND, weight: 700, size: 50, fill: '#ff6f9f' });
      } else {
        tape(ctx, L.W / 2, 22, 220, 50, -0.04, pink, stripe);
      }
    },
  },

  bubble: {
    mat: '#ffffff',
    matShadow: 'rgba(200,60,130,0.3)',
    cellFill: 'rgba(255,255,255,0.35)',
    cut: 'rgba(255,255,255,0.95)',
    rim: '#ff8fc8',
    heart: '#ff5fa2',
    heart2: '#ffffff',
    petal: '#ffffff',
    petalEdge: '#ff8fc8',
    center: '#ff5fa2',
    star: '#ff8fc8',
    star2: '#ffe14a',
    lace: '#ffffff',
    ribbon: '#ff5fa2',
    spark: '#ffffff',
    sparkGlow: 'rgba(255,100,180,0.8)',
    ink: '#ff4f9a',
    inkStroke: '#ffffff',
    chip: 'rgba(122,24,78,0.82)',
    chipEdge: '#ffffff',
    photoLine: 'rgba(255,143,200,0.9)',
    phone: { hi: '#fff6fb', mid: '#f3d3e4', lo: '#d69ab9', edge: '#a8577f', key: '#ffffff', keyText: '#d6468f', glow: '#ff8fc8', ui: '#ffe3f1', uiText: '#b8558c', charm: ['#ff5fa2', '#ffe14a', '#8fd8ff'] },
    bg: bgBubble,
    gridMat(ctx, s) {
      mat(ctx, s, { pad: 16, r: 34, fill: '#ffffff', shadow: 'rgba(200,60,130,0.3)' });
      ctx.save();
      ctx.setLineDash([2, 16]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 9;
      ctx.strokeStyle = '#ff8fc8';
      rrect(ctx, s.x - 30, s.y - 30, s.w + 60, s.h + 60, 46);
      ctx.stroke();
      ctx.restore();
    },
    logo: (ctx, x, y, size, align) => label(ctx, 'DIGI 2003', x, y - size * 0.12, { font: SCRIPT, size: size * 1.25, fill: '#ffffff', stroke: '#ff5fa2', sw: 0.3, glow: 'rgba(255,255,255,0.9)', align }),
    tag: (ctx, x, y, size, align) => label(ctx, TXT.bubbleTag, x, y, { font: CUTE, size: size * 1.15, fill: ['#ffffff', '#ffe0f0'], stroke: '#ff5fa2', sw: 0.28, align }),
    slogan: (ctx, x, y, size) => label(ctx, TXT.bubbleSlogan, x, y, { font: CUTE, size, fill: ['#ffffff', '#ffd6ea'], stroke: '#ff4f9a', sw: 0.28 }),
    extra(ctx, L) {
      if (L.id === 'grid4') {
        L.slots.forEach((s, i) => {
          bubble(ctx, s.x + s.w - 8, s.y + 10, i % 2 ? 40 : 54);
          bubble(ctx, s.x + 6, s.y + s.h - 90, i % 2 ? 30 : 22);
        });
      } else if (L.id === 'flip') {
        const r = rng(3);
        for (let i = 0; i < 9; i++) bubble(ctx, r() < 0.5 ? 40 + r() * 120 : L.W - 40 - r() * 120, 60 + r() * 1300, 20 + r() * 50);
        bubble(ctx, 1012, 640, 56);
      } else {
        for (const [x, y, rad] of [[40, 40, 30], [L.W - 60, 36, 26], [L.W - 20, 150, 16], [30, L.H - 60, 34], [L.W - 50, L.H - 40, 30]]) bubble(ctx, x, y, rad);
      }
    },
  },

  pixel: {
    pixel: true,
    pixInk: '#1b1030',
    heartShade: '#c21d6b',
    mat: '#ffffff',
    matShadow: 'rgba(0,0,0,0.45)',
    cellFill: 'rgba(255,255,255,0.07)',
    cut: 'rgba(255,255,255,0.6)',
    rim: '#ff4f9a',
    heart: '#ff4f9a',
    heart2: '#6fe3ff',
    petal: '#ff9ad5',
    petalEdge: '#ff4f9a',
    center: '#ffe14a',
    star: '#ffe14a',
    star2: '#6fe3ff',
    lace: '#ffffff',
    ribbon: '#ff4f9a',
    spark: '#ffffff',
    sparkGlow: null,
    ink: '#6fe3ff',
    inkStroke: '#1b1030',
    chip: '#0d0b2a',
    chipEdge: '#ffffff',
    photoLine: '#1b1030',
    phone: { hi: '#e9edf5', mid: '#aab3c4', lo: '#5d6780', edge: '#2c3348', key: '#e3e9ff', keyText: '#1b1030', glow: '#6fe3ff', ui: '#0d0b2a', uiText: '#6fe3ff', charm: ['#ff4f9a', '#ffe14a', '#6fe3ff'] },
    bg: bgPixel,
    gridMat(ctx, s) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowOffsetX = 12;
      ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#1b1030';
      ctx.fillRect(s.x - 18, s.y - 18, s.w + 36, s.h + 36);
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x - 12, s.y - 12, s.w + 24, s.h + 24);
      ctx.fillStyle = '#ff4f9a';
      ctx.fillRect(s.x - 6, s.y - 6, s.w + 12, s.h + 12);
    },
    logo: (ctx, x, y, size, align) => pixelShadow(ctx, 'DIGI 2003', x, y, size, align, PIX, ['#ffffff', '#6fe3ff', '#ff4f9a']),
    tag: (ctx, x, y, size, align) => pixelShadow(ctx, TXT.pixelTag, x, y, size * 1.1, align, TECH, ['#ffe14a', '#ff4f9a', '#1b1030']),
    slogan(ctx, x, y, size) {
      // "LOADING 青春... 99%": pixel font for Latin, a CJK font (a bit larger) for 青春
      const parts = [['LOADING ', PIX, size * 0.62], ['青春', TECH, size * 0.95], ['... 99%', PIX, size * 0.62]];
      const widths = parts.map(([t, f, sz]) => {
        ctx.font = `400 ${sz}px ${f}`;
        return ctx.measureText(t).width;
      });
      let cx = x - widths.reduce((a, b) => a + b, 0) / 2;
      parts.forEach(([t, f, sz], i) => {
        pixelShadow(ctx, t, cx, y, sz, 'left', f, ['#ffffff', '#ff4f9a', '#1b1030']);
        cx += widths[i];
      });
    },
    extra(ctx, L) {
      const r = rng(12);
      const pal = [{ Y: '#ffe14a', W: '#ffffff' }, { Y: '#6fe3ff', W: '#ffffff' }, { Y: '#ff7ad9', W: '#ffffff' }];
      if (L.id === 'grid4') {
        L.slots.forEach((s, i) => {
          sprite(ctx, PX_SPARK, s.x - 30, s.y - 30, 7, pal[i % 3]);
          pixHeart(ctx, s.x + s.w - 2, s.y + 26, 54, { K: '#1b1030', P: '#ff4f9a', D: '#c21d6b', W: '#ffffff' });
        });
      } else if (L.id === 'flip') {
        for (let i = 0; i < 12; i++) {
          const x = r() < 0.5 ? 20 + r() * 120 : L.W - 150 + r() * 110;
          sprite(ctx, i % 3 ? PX_TWINKLE : PX_SPARK, x, 40 + r() * 1080, 6 + Math.floor(r() * 3), pal[i % 3]);
        }
        pixHeart(ctx, 1104, 1010, 84, { K: '#1b1030', P: '#ff4f9a', D: '#c21d6b', W: '#ffffff' });
      }
    },
  },
};

function makeFrame(id, name, sk) {
  return {
    id,
    name,
    paint: {
      under(ctx, L) {
        sk.bg(ctx, L.W, L.H);
        if (L.id === 'mini16') miniUnder(ctx, L, sk);
        else if (L.id === 'grid4') gridUnder(ctx, L, sk);
        else if (L.id === 'flip') phoneUnder(ctx, L, sk);
      },
      slot(ctx, s, i, info) {
        if (s.kind === 'mini') miniSlot(ctx, s, info, sk);
        else if (s.kind === 'grid') gridSlot(ctx, s, info, sk);
        else if (s.kind === 'phone') phoneSlot(ctx, s, info);
      },
      over(ctx, L, info) {
        if (L.id === 'mini16') miniOver(ctx, L, info, sk);
        else if (L.id === 'grid4') gridOver(ctx, L, info, sk);
        else if (L.id === 'flip') phoneOver(ctx, L, info, sk);
        sk.extra?.(ctx, L, info);
      },
    },
  };
}

export const frames = [
  makeFrame('dreamy', '非主流粉紫', SKINS.dreamy),
  makeFrame('chrome', '蓝色科技', SKINS.chrome),
  makeFrame('diary', '青春纪念册', SKINS.diary),
  makeFrame('bubble', '泡泡少女', SKINS.bubble),
  makeFrame('pixel', '像素闪图', SKINS.pixel),
];
