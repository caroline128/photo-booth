// Art for STAR 4CUT, a Korean self-photo studio (셀프사진관): headbands and
// plush toys from the free prop basket, fandom stickers for decorating
// photocard sleeves (탑꾸), Photoism-style colour backdrops, and frames for
// the 4-cut strip, the MULTI grid and a 55×85 mm photocard — including a
// 「和偶像合照」frame starring STARRY, an original idol drawn in code.

import { svg, heartD, starD, sparkleD, burstD, textSticker, rng } from '../../art/kit.js';
import { stamp, rrect, canvas as mkCanvas, TAU } from '../../core/util.js';
import { stripLayout, gridLayout, slotPath } from '../../engine/compose.js';
import { dieCut } from '../../art/render.js';

const HOT = '#ff4fa3';
const PINK = '#ff8cc6';
const LAV = '#b9a2ff';
const SKY = '#8fd3ff';
const LEMON = '#ffe45c';
const INK = '#1f1a24';
const JUA = '"Jua", "ZCOOL KuaiLe", sans-serif';
const BOLD = '"Black Han Sans", "Dela Gothic One", sans-serif';
const MONO = '"Rubik Mono One", "Black Han Sans", monospace';
const SCRIPT = '"Pacifico", "Caveat", cursive';

const P = (d) => new Path2D(d);

/** '#rrggbb' + alpha → rgba() */
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** Centered canvas text, shrunk to fit `maxW`. */
function label(ctx, text, x, y, maxW, px, font, color) {
  ctx.font = `400 ${px}px ${font}`;
  const w = ctx.measureText(text).width;
  if (w > maxW) ctx.font = `400 ${(px * maxW) / w}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// ----------------------------------------------------------------- shared art

function lightstickSvg(halo) {
  return svg(120, 300, `
    ${halo ? '<circle cx="60" cy="62" r="60" fill="url(#halo)"/>' : ''}
    <circle cx="60" cy="62" r="44" fill="url(#globe)" stroke="#fff" stroke-width="4"/>
    <path d="${starD(60, 65, 28, 5, 0.52)}" fill="${HOT}" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>
    <path d="${heartD(60, 67, 8)}" fill="#fff"/>
    <ellipse cx="42" cy="40" rx="13" ry="7" transform="rotate(-35 42 40)" fill="#fff" opacity=".9"/>
    <rect x="36" y="103" width="48" height="19" rx="8" fill="${HOT}"/>
    <rect x="41" y="106" width="38" height="4" rx="2" fill="#fff" opacity=".5"/>
    <path d="M42 122 L78 122 L73 268 Q72 282 60 282 Q48 282 47 268Z" fill="url(#grip)" stroke="#d7d0e2" stroke-width="3"/>
    <circle cx="60" cy="150" r="8" fill="${HOT}" stroke="#fff" stroke-width="3"/>
    <rect x="55" y="172" width="10" height="58" rx="5" fill="#ffd1e6"/>
    <path d="M54 280 C38 288 40 298 52 298 C62 298 64 290 60 282" fill="none" stroke="${PINK}" stroke-width="4"/>`, `
    <radialGradient id="halo"><stop offset=".62" stop-color="#ff9fd0" stop-opacity=".6"/><stop offset="1" stop-color="#ff9fd0" stop-opacity="0"/></radialGradient>
    <radialGradient id="globe" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffe3f1"/><stop offset="1" stop-color="#ff9fd0"/></radialGradient>
    <linearGradient id="grip" x1="0" x2="1"><stop offset="0" stop-color="#e9e4f1"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#d5cde2"/></linearGradient>`);
}

/** Headband strokes that fade out at the sides, as if tucked behind the ears. */
function bandDefs(color, shine) {
  const fade = (id, c) => `<linearGradient id="${id}" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${c}" stop-opacity="0"/><stop offset=".17" stop-color="${c}"/><stop offset=".83" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></linearGradient>`;
  return fade('band', color) + fade('shine', shine);
}

/** Satin bow as [path, colour role] so it can be drawn in SVG and on canvas. */
const BOW_PARTS = [
  ['M112 100 L78 176 L98 168 L108 186 L128 106Z', 'dark'],
  ['M128 100 L162 176 L142 168 L132 186 L112 106Z', 'dark'],
  ['M116 92 C92 52 50 22 22 36 C2 48 6 98 22 120 C42 146 92 126 116 102Z', 'main'],
  ['M124 92 C148 52 190 22 218 36 C238 48 234 98 218 120 C198 146 148 126 124 102Z', 'main'],
  ['M110 94 C90 72 62 58 44 64 C58 74 80 88 104 102Z', 'fold'],
  ['M130 94 C150 72 178 58 196 64 C182 74 160 88 136 102Z', 'fold'],
  ['M118 76 L122 76 C132 76 137 82 137 92 L137 102 C137 112 132 118 122 118 L118 118 C108 118 103 112 103 102 L103 92 C103 82 108 76 118 76Z', 'dark'],
];
const BOW_PINK = { main: '#ff7eb6', dark: '#ff5fa8', fold: 'rgba(214,52,128,0.42)' };
const BOW_LAV = { main: '#c7b2ff', dark: '#a78bff', fold: 'rgba(110,80,200,0.35)' };

function bowSvg(c, dots) {
  const body = BOW_PARTS.map(([d, role]) => `<path d="${d}" fill="${c[role]}"/>${dots && role === 'main' ? `<path d="${d}" fill="url(#dot)"/>` : ''}`).join('');
  return svg(240, 190, `${body}
    <path d="M34 56 C52 42 76 46 94 62" stroke="#fff" stroke-width="6" fill="none" opacity=".55" stroke-linecap="round"/>
    <path d="M206 56 C190 46 172 46 160 54" stroke="#fff" stroke-width="5" fill="none" opacity=".4" stroke-linecap="round"/>
    <path d="M112 84 Q120 80 128 84" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`,
  dots ? '<pattern id="dot" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="3.2" fill="#fff" opacity=".85"/><circle cx="14" cy="14" r="3.2" fill="#fff" opacity=".85"/></pattern>' : '');
}

/** The same bow painted straight onto a canvas (frames are synchronous). */
function paintBow(ctx, x, y, w, c, rot = 0) {
  const k = w / 240;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(k, k);
  ctx.translate(-120, -95);
  ctx.shadowColor = 'rgba(80,20,50,0.25)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  for (const [d, role] of BOW_PARTS) {
    ctx.fillStyle = c[role];
    ctx.fill(P(d));
  }
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke(P('M34 56 C52 42 76 46 94 62'));
  ctx.restore();
}

const PEARL_DEF = '<radialGradient id="pearl" cx=".35" cy=".32" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f4eff8"/><stop offset="1" stop-color="#cfc4de"/></radialGradient>';

function pearl(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.55, '#f4eff8');
  g.addColorStop(1, '#cbbfdc');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js (units: eye distance d)

export const props = [
  {
    id: 'bunny',
    name: '兔耳发箍',
    anchor: 'crown',
    w: 2.6,
    origin: [0.5, 0.585],
    svg: svg(260, 260, `
      <g transform="rotate(-13 92 158)">
        <path d="M70 162 C58 114 60 46 80 16 C86 7 98 7 104 16 C124 46 126 114 114 162Z" fill="#fff" stroke="#f2bfd5" stroke-width="5"/>
        <path d="M81 150 C74 112 76 62 88 36 C90 31 94 31 96 36 C108 62 110 112 103 150Z" fill="#ffb3cf"/>
      </g>
      <g transform="rotate(14 168 158)">
        <path d="M146 162 C134 114 136 46 156 16 C162 7 174 7 180 16 C200 46 202 114 190 162Z" fill="#fff" stroke="#f2bfd5" stroke-width="5"/>
        <path d="M157 150 C150 112 152 62 164 36 C166 31 170 31 172 36 C184 62 186 112 179 150Z" fill="#ffb3cf"/>
      </g>
      <path d="M10 252 A120 100 0 0 1 250 252" fill="none" stroke="url(#band)" stroke-width="16" stroke-linecap="round"/>
      <path d="M8 246 A122 98 0 0 1 252 246" fill="none" stroke="url(#shine)" stroke-width="3.5" stroke-linecap="round"/>
      <path d="${heartD(130, 154, 14)}" fill="${HOT}" stroke="#fff" stroke-width="3"/>`, bandDefs('#ff7eb6', '#ffd3e6')),
  },
  {
    id: 'kitty',
    name: '猫耳发箍',
    anchor: 'crown',
    w: 2.6,
    origin: [0.5, 0.56],
    svg: svg(260, 230, `
      <g transform="rotate(-18 72 142)">
        <path d="M36 150 Q46 86 66 54 Q72 45 80 54 Q100 86 110 150Z" fill="#2b2530"/>
        <path d="M52 142 Q58 102 69 80 Q73 74 77 80 Q88 102 94 142Z" fill="#ffadc9"/>
      </g>
      <g transform="rotate(18 188 142)">
        <path d="M150 150 Q160 86 180 54 Q186 45 194 54 Q214 86 224 150Z" fill="#2b2530"/>
        <path d="M166 142 Q172 102 183 80 Q187 74 191 80 Q202 102 208 142Z" fill="#ffadc9"/>
      </g>
      <path d="M10 224 A120 96 0 0 1 250 224" fill="none" stroke="url(#band)" stroke-width="15" stroke-linecap="round"/>
      <path d="M7 219 A123 99 0 0 1 253 219" fill="none" stroke="url(#shine)" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(206 124) rotate(20)">
        <path d="M0 0 L-20 -12 Q-27 0 -20 12Z M0 0 L20 -12 Q27 0 20 12Z" fill="#ff5fa8"/>
        <circle r="6.5" fill="${HOT}"/>
      </g>`, bandDefs('#2b2530', '#6b6373')),
  },
  {
    id: 'bear-ears',
    name: '小熊耳发箍',
    anchor: 'crown',
    w: 2.6,
    origin: [0.5, 0.514],
    svg: svg(260, 210, `
      <circle cx="58" cy="96" r="44" fill="#9b6444" stroke="#7a4b33" stroke-width="4"/>
      <circle cx="58" cy="96" r="24" fill="#f2c29d"/>
      <circle cx="202" cy="96" r="44" fill="#9b6444" stroke="#7a4b33" stroke-width="4"/>
      <circle cx="202" cy="96" r="24" fill="#f2c29d"/>
      <path d="M40 72 Q48 62 60 60" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M184 72 Q192 62 204 60" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M10 200 A120 92 0 0 1 250 200" fill="none" stroke="url(#band)" stroke-width="15" stroke-linecap="round"/>
      <path d="M7 195 A123 95 0 0 1 253 195" fill="none" stroke="url(#shine)" stroke-width="3" stroke-linecap="round"/>
      <g transform="translate(130 108)">
        <path d="M0 0 L-24 -14 Q-31 0 -24 14Z M0 0 L24 -14 Q31 0 24 14Z" fill="${PINK}" stroke="#ff5fa8" stroke-width="2.5"/>
        <circle r="7" fill="#ff5fa8"/>
      </g>`, bandDefs('#7a4b33', '#b0805f')),
  },
  {
    id: 'ribbon',
    name: '大蝴蝶结',
    anchor: 'crown',
    w: 1.55,
    dx: 0.62,
    dy: 0,
    rot: 0.28,
    origin: [0.5, 0.5],
    svg: bowSvg(BOW_PINK, true),
  },
  {
    id: 'heart-shades',
    name: '爱心墨镜',
    anchor: 'eyes',
    w: 2.2,
    origin: [0.5, 0.5],
    svg: svg(260, 110, `
      <path d="M108 44 Q130 30 152 44" stroke="${HOT}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M26 40 L4 30 M234 40 L256 30" stroke="${HOT}" stroke-width="7" stroke-linecap="round"/>
      <path d="${heartD(70, 58, 46)}" fill="url(#lens)" stroke="${HOT}" stroke-width="7" stroke-linejoin="round"/>
      <path d="${heartD(190, 58, 46)}" fill="url(#lens)" stroke="${HOT}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M40 46 Q46 32 60 30" stroke="#fff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="M160 46 Q166 32 180 30" stroke="#fff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>
      <circle cx="88" cy="80" r="4" fill="#fff" opacity=".7"/><circle cx="208" cy="80" r="4" fill="#fff" opacity=".7"/>`,
    '<linearGradient id="lens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9ccd" stop-opacity=".92"/><stop offset="1" stop-color="#ff2f8e" stop-opacity=".86"/></linearGradient>'),
  },
  {
    id: 'star-pins',
    name: '星星发夹',
    anchor: 'head',
    pair: true,
    flipPair: true,
    w: 0.86,
    dx: 0.8,
    dy: -0.02,
    rot: 0.3,
    origin: [0.45, 0.55],
    svg: svg(120, 110, `
      <path d="${starD(54, 60, 42, 5, 0.5)}" fill="#ffd84a" stroke="#f4b21f" stroke-width="6" stroke-linejoin="round"/>
      <path d="M40 46 Q46 37 56 36" stroke="#fff" stroke-width="5" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="${starD(98, 24, 17, 5, 0.5)}" fill="${PINK}" stroke="#ff5fa8" stroke-width="4" stroke-linejoin="round"/>
      <path d="${sparkleD(104, 84, 11)}" fill="#fff" stroke="${SKY}" stroke-width="2"/>`),
  },
  {
    id: 'tiara',
    name: '公主皇冠',
    anchor: 'crown',
    w: 1.85,
    dy: 0.1,
    origin: [0.5, 0.9],
    svg: svg(220, 130, `
      <path d="M22 104 L30 66 L50 88 L70 42 L90 82 L110 12 L130 82 L150 42 L170 88 L190 66 L198 104Z" fill="url(#sil)" stroke="#a79cc4" stroke-width="4" stroke-linejoin="round"/>
      <path d="M14 104 Q110 88 206 104 L204 118 Q110 102 16 118Z" fill="url(#sil)" stroke="#a79cc4" stroke-width="4" stroke-linejoin="round"/>
      <path d="${heartD(110, 58, 15)}" fill="${HOT}" stroke="#fff" stroke-width="3"/>
      <circle cx="70" cy="60" r="8" fill="${LAV}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="150" cy="60" r="8" fill="${LAV}" stroke="#fff" stroke-width="2.5"/>
      <circle cx="32" cy="82" r="5.5" fill="${SKY}" stroke="#fff" stroke-width="2"/>
      <circle cx="188" cy="82" r="5.5" fill="${SKY}" stroke="#fff" stroke-width="2"/>
      <circle cx="110" cy="12" r="7" fill="url(#pearl)" stroke="#a79cc4" stroke-width="2"/>
      ${Array.from({ length: 12 }, (_, i) => {
        const t = (i + 0.5) / 12;
        const x = 18 + t * 184;
        const y = 111 - 16 * 2 * t * (1 - t) * 2 + 1;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="url(#pearl)"/>`;
      }).join('')}`,
    `<linearGradient id="sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#e6e0f2"/><stop offset="1" stop-color="#bdb3d3"/></linearGradient>${PEARL_DEF}`),
  },
  {
    id: 'blush',
    name: '腮红贴',
    anchor: 'cheeks',
    pair: true,
    flipPair: true,
    w: 0.92,
    dx: -0.06,
    dy: -0.1,
    origin: [0.47, 0.53],
    svg: svg(140, 90, `
      <ellipse cx="66" cy="48" rx="62" ry="36" fill="url(#b)"/>
      <g stroke="#ff4f8b" stroke-width="5" stroke-linecap="round" opacity=".75"><path d="M38 60 L48 36"/><path d="M58 60 L68 36"/><path d="M78 60 L88 36"/></g>
      <path d="${heartD(118, 22, 10)}" fill="${HOT}"/>`,
    '<radialGradient id="b"><stop offset="0" stop-color="#ff7aa6" stop-opacity=".75"/><stop offset=".7" stop-color="#ff8fb5" stop-opacity=".35"/><stop offset="1" stop-color="#ff8fb5" stop-opacity="0"/></radialGradient>'),
  },
  {
    id: 'plush',
    name: '小熊玩偶',
    anchor: 'side',
    w: 1.85,
    dx: -0.05,
    dy: -0.4,
    origin: [0.5, 0.34],
    svg: svg(200, 250, `
      <g stroke="#b98459" stroke-width="5">
        <circle cx="52" cy="40" r="24" fill="#e8b98f"/><circle cx="148" cy="40" r="24" fill="#e8b98f"/>
        <ellipse cx="100" cy="182" rx="62" ry="58" fill="#e8b98f"/>
        <ellipse cx="62" cy="230" rx="25" ry="16" fill="#e8b98f"/><ellipse cx="138" cy="230" rx="25" ry="16" fill="#e8b98f"/>
        <ellipse cx="42" cy="160" rx="18" ry="30" transform="rotate(35 42 160)" fill="#e8b98f"/>
        <ellipse cx="158" cy="160" rx="18" ry="30" transform="rotate(-35 158 160)" fill="#e8b98f"/>
        <ellipse cx="100" cy="84" rx="64" ry="56" fill="#e8b98f"/>
      </g>
      <circle cx="52" cy="40" r="11" fill="#ffc9d6"/><circle cx="148" cy="40" r="11" fill="#ffc9d6"/>
      <ellipse cx="100" cy="190" rx="34" ry="32" fill="#fbe3cc"/>
      <ellipse cx="62" cy="233" rx="12" ry="7" fill="#ffc9d6"/><ellipse cx="138" cy="233" rx="12" ry="7" fill="#ffc9d6"/>
      <ellipse cx="100" cy="100" rx="26" ry="19" fill="#fbe3cc"/>
      <ellipse cx="100" cy="92" rx="9" ry="7" fill="#4a3226"/>
      <path d="M100 99 L100 106 M100 106 Q93 112 87 106 M100 106 Q107 112 113 106" stroke="#4a3226" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="74" cy="78" r="6.5" fill="#4a3226"/><circle cx="126" cy="78" r="6.5" fill="#4a3226"/>
      <circle cx="76" cy="76" r="2" fill="#fff"/><circle cx="128" cy="76" r="2" fill="#fff"/>
      <ellipse cx="62" cy="100" rx="11" ry="7" fill="#ff9fb8" opacity=".7"/><ellipse cx="138" cy="100" rx="11" ry="7" fill="#ff9fb8" opacity=".7"/>
      <path d="M100 138 L74 124 Q66 140 74 154Z M100 138 L126 124 Q134 140 126 154Z" fill="#ff5fa8" stroke="#e0418a" stroke-width="2.5"/>
      <circle cx="100" cy="138" r="9" fill="${HOT}"/>`),
  },
  {
    id: 'lightstick',
    name: '应援棒',
    anchor: 'side',
    w: 1.05,
    dx: 0.05,
    dy: -0.35,
    rot: -0.2,
    origin: [0.5, 0.5],
    svg: lightstickSvg(true),
  },
];

// ----------------------------------------------------------------- stickers

function bubble(ctx, shapes, fill, line, t) {
  // union outline: stroke everything twice as thick, then fill on top
  ctx.lineJoin = 'round';
  ctx.lineWidth = t * 2;
  ctx.strokeStyle = line;
  for (const s of shapes) ctx.stroke(s);
  ctx.fillStyle = fill;
  for (const s of shapes) ctx.fill(s);
}

function ellipseP(x, y, rx, ry) {
  const p = new Path2D();
  p.ellipse(x, y, rx, ry, 0, 0, TAU);
  return p;
}

function polyP(pts) {
  const p = new Path2D();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

const koText = (id, text, opts) => textSticker({ id, text, name: text.replace('\n', ' '), group: '韩文', size: 0.34, outline: 0.035, ...opts });

export const stickers = [
  // --- 爱心
  {
    id: 'finger-heart',
    name: '手指比心',
    group: '爱心',
    size: 0.3,
    outline: 0.05,
    svg: svg(200, 220, `
      <path d="M112 132 L99 46" stroke="#e8a68a" stroke-width="37" stroke-linecap="round"/>
      <path d="M112 132 L99 46" stroke="#ffdcc7" stroke-width="30" stroke-linecap="round"/>
      <ellipse cx="98" cy="40" rx="9" ry="7" fill="#fff1f1" opacity=".9"/>
      <path d="M60 122 C60 100 78 90 100 92 L144 96 C166 98 176 114 174 138 L170 172 C166 198 144 212 114 212 C82 212 62 194 60 166Z" fill="#ffdcc7" stroke="#e8a68a" stroke-width="6"/>
      <g stroke="#e8a68a" stroke-width="5" fill="none" stroke-linecap="round">
        <path d="M118 128 C134 124 150 126 166 132"/><path d="M120 156 C136 152 152 154 168 160"/><path d="M122 184 C136 180 148 182 160 188"/>
      </g>
      <path d="M70 152 L120 74" stroke="#e8a68a" stroke-width="39" stroke-linecap="round"/>
      <path d="M70 152 L120 74" stroke="#ffdcc7" stroke-width="32" stroke-linecap="round"/>
      <ellipse cx="119" cy="76" rx="10" ry="13" transform="rotate(33 119 76)" fill="#fff0f0" stroke="#efb9a4" stroke-width="3"/>
      <path d="${heartD(156, 38, 26)}" fill="${HOT}" stroke="#fff" stroke-width="4"/>
      <path d="M146 30 Q150 24 158 24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>
      <g stroke="${HOT}" stroke-width="5" stroke-linecap="round"><path d="M190 22 L198 16"/><path d="M188 48 L198 50"/><path d="M168 6 L170 0"/></g>`),
  },
  {
    id: 'heart-jelly',
    name: '果冻爱心',
    group: '爱心',
    size: 0.24,
    outline: 0.05,
    svg: svg(160, 150, `
      <path d="${heartD(80, 70, 72)}" fill="url(#j)"/>
      <path d="M36 50 C38 32 56 22 70 30" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" opacity=".85"/>
      <circle cx="86" cy="36" r="5" fill="#fff" opacity=".8"/>
      <ellipse cx="104" cy="106" rx="16" ry="6" transform="rotate(-35 104 106)" fill="#fff" opacity=".3"/>`,
    '<linearGradient id="j" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffa3d2"/><stop offset="1" stop-color="#ff2f8e"/></linearGradient>'),
  },
  {
    id: 'heart-line',
    name: '双线爱心',
    group: '爱心',
    size: 0.26,
    outline: 0.04,
    svg: svg(160, 150, `
      <path d="${heartD(80, 70, 66)}" fill="none" stroke="${HOT}" stroke-width="12" stroke-linejoin="round"/>
      <path d="${heartD(80, 72, 48)}" fill="none" stroke="${LAV}" stroke-width="5" stroke-linejoin="round" stroke-dasharray="14 8"/>
      <path d="${sparkleD(138, 22, 14)}" fill="${LEMON}"/>
      <circle cx="22" cy="118" r="5" fill="${SKY}"/>`),
  },
  {
    id: 'heart-3d',
    name: '立体爱心',
    group: '爱心',
    size: 0.24,
    outline: 0.05,
    holo: true,
    svg: svg(160, 150, `
      <path d="${heartD(80, 72, 70)}" fill="#c81e6c" transform="translate(4 6)" opacity=".5"/>
      <path d="${heartD(80, 70, 70)}" fill="url(#p)"/>
      <ellipse cx="50" cy="44" rx="20" ry="10" transform="rotate(-35 50 44)" fill="#fff" opacity=".9"/>
      <circle cx="74" cy="34" r="4.5" fill="#fff"/>`,
    '<radialGradient id="p" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#ffe0ef"/><stop offset=".45" stop-color="#ff86c0"/><stop offset="1" stop-color="#e0287a"/></radialGradient>'),
  },
  {
    id: 'heart-trio',
    name: '爱心三连',
    group: '爱心',
    size: 0.28,
    outline: 0.05,
    svg: svg(180, 150, `
      <g transform="rotate(-12 70 82)"><path d="${heartD(70, 82, 48)}" fill="${HOT}"/><path d="M40 70 Q44 56 56 54" stroke="#fff" stroke-width="7" fill="none" opacity=".8" stroke-linecap="round"/></g>
      <g transform="rotate(16 140 48)"><path d="${heartD(140, 48, 28)}" fill="${LAV}"/><path d="M124 42 Q127 34 134 33" stroke="#fff" stroke-width="5" fill="none" opacity=".8" stroke-linecap="round"/></g>
      <g transform="rotate(-8 146 116)"><path d="${heartD(146, 116, 20)}" fill="${SKY}"/></g>`),
  },

  // --- 偶像
  { id: 'lightstick', name: '应援棒', group: '偶像', size: 0.2, outline: 0.06, svg: lightstickSvg(false) },
  {
    id: 'bias',
    name: 'MY BIAS 徽章',
    group: '偶像',
    size: 0.38,
    ratio: 0.34,
    outline: 0.035,
    fontSpec: { font: `400 100px ${BOLD}`, text: 'MY BIAS' },
    draw(ctx, w, h) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#ff7ac0');
      g.addColorStop(1, '#ff3d95');
      rrect(ctx, 0, 0, w, h, h / 2);
      ctx.fillStyle = g;
      ctx.fill();
      rrect(ctx, h * 0.09, h * 0.09, w - h * 0.18, h * 0.82, h * 0.41);
      ctx.setLineDash([h * 0.09, h * 0.07]);
      ctx.lineWidth = h * 0.035;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fff';
      ctx.fill(P(starD(h * 0.58, h * 0.5, h * 0.25, 5, 0.5)));
      label(ctx, 'MY BIAS', (w + h * 0.95) / 2, h * 0.53, w - h * 1.3, h * 0.48, BOLD, '#fff');
    },
  },
  {
    id: 'love',
    name: 'LOVE 爱心章',
    group: '偶像',
    size: 0.28,
    ratio: 0.9,
    outline: 0.04,
    fontSpec: { font: `400 100px ${BOLD}`, text: 'LOVE' },
    draw(ctx, w) {
      const r = w * 0.52;
      const cx = w / 2;
      const cy = w * 0.415;
      const g = ctx.createLinearGradient(0, 0, 0, w * 0.9);
      g.addColorStop(0, '#c9a8ff');
      g.addColorStop(1, '#8a5cff');
      ctx.fillStyle = g;
      ctx.fill(P(heartD(cx, cy, r)));
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = w * 0.028;
      ctx.stroke(P(heartD(cx, cy + w * 0.01, r * 0.82)));
      ctx.save();
      ctx.translate(cx, cy + w * 0.02);
      ctx.rotate(-0.12);
      label(ctx, 'LOVE', 0, 0, w * 0.6, w * 0.26, BOLD, '#fff');
      ctx.restore();
      ctx.fillStyle = LEMON;
      ctx.fill(P(sparkleD(w * 0.8, w * 0.14, w * 0.09)));
    },
  },
  {
    id: 'onair',
    name: 'ON AIR 灯牌',
    group: '偶像',
    size: 0.4,
    ratio: 0.34,
    outline: 0.03,
    fontSpec: { font: `400 100px ${MONO}`, text: 'ON AIR' },
    draw(ctx, w, h) {
      rrect(ctx, 0, 0, w, h, h * 0.24);
      ctx.fillStyle = '#1b1620';
      ctx.fill();
      ctx.shadowColor = '#ff2d55';
      ctx.shadowBlur = h * 0.18;
      rrect(ctx, h * 0.1, h * 0.1, w - h * 0.2, h * 0.8, h * 0.16);
      ctx.lineWidth = h * 0.05;
      ctx.strokeStyle = '#ff5c7a';
      ctx.stroke();
      ctx.fillStyle = '#ff2d55';
      ctx.beginPath();
      ctx.arc(h * 0.52, h * 0.5, h * 0.14, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = h * 0.14;
      label(ctx, 'ON AIR', (w + h * 0.72) / 2, h * 0.53, w - h * 1.1, h * 0.36, MONO, '#fff');
    },
  },
  {
    id: 'first-win',
    name: '1st WIN 奖章',
    group: '偶像',
    size: 0.26,
    ratio: 1.3,
    outline: 0.035,
    holo: true,
    fontSpec: { font: `400 100px ${BOLD}`, text: '1st WIN' },
    draw(ctx, w, h) {
      const cx = w / 2;
      const cy = w * 0.47;
      const R = w * 0.44;
      ctx.fillStyle = '#ff5fa8';
      ctx.fill(polyP([[cx - 0.3 * w, cy + 0.12 * w], [cx - 0.02 * w, cy + 0.16 * w], [cx - 0.08 * w, h - 0.01 * w], [cx - 0.2 * w, h - 0.14 * w], [cx - 0.34 * w, h - 0.03 * w]]));
      ctx.fillStyle = '#9a7bff';
      ctx.fill(polyP([[cx + 0.3 * w, cy + 0.12 * w], [cx + 0.02 * w, cy + 0.16 * w], [cx + 0.08 * w, h - 0.01 * w], [cx + 0.2 * w, h - 0.14 * w], [cx + 0.34 * w, h - 0.03 * w]]));
      const ros = new Path2D();
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        ros.moveTo(cx + Math.cos(a) * R * 0.82 + R * 0.2, cy + Math.sin(a) * R * 0.82);
        ros.arc(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82, R * 0.2, 0, TAU);
      }
      ros.moveTo(cx + R * 0.86, cy);
      ros.arc(cx, cy, R * 0.86, 0, TAU);
      const g = ctx.createLinearGradient(0, cy - R, 0, cy + R);
      g.addColorStop(0, '#ffe98a');
      g.addColorStop(1, '#f5b82e');
      ctx.fillStyle = g;
      ctx.fill(ros);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.66, 0, TAU);
      ctx.fillStyle = '#fffaf0';
      ctx.fill();
      ctx.lineWidth = R * 0.06;
      ctx.strokeStyle = '#f0b429';
      ctx.stroke();
      label(ctx, '1st', cx, cy - R * 0.1, R * 1.1, R * 0.62, BOLD, HOT);
      label(ctx, 'WIN', cx, cy + R * 0.38, R * 0.9, R * 0.3, BOLD, '#8a63ff');
    },
  },
  {
    id: 'ticket',
    name: '演唱会门票',
    group: '偶像',
    size: 0.52,
    ratio: 0.42,
    outline: 0.03,
    fontSpec: { font: `400 100px ${BOLD}`, text: 'STARLIGHT' },
    draw(ctx, w, h) {
      const cut = w * 0.72;
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#ffd3e8');
      g.addColorStop(1, '#dccfff');
      rrect(ctx, 0, 0, w, h, h * 0.12);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(cut, 0, w - cut - h * 0.12, h);
      ctx.fillRect(w - h * 0.12, h * 0.12, h * 0.12, h * 0.76);
      ctx.setLineDash([h * 0.05, h * 0.05]);
      ctx.strokeStyle = '#b38ad8';
      ctx.lineWidth = h * 0.02;
      ctx.beginPath();
      ctx.moveTo(cut, h * 0.14);
      ctx.lineTo(cut, h * 0.86);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalCompositeOperation = 'destination-out';
      for (const y of [0, h]) {
        ctx.beginPath();
        ctx.arc(cut, y, h * 0.1, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = HOT;
      ctx.font = `400 ${h * 0.25}px ${BOLD}`;
      const maxW = cut - w * 0.065 - h * 0.36;
      const tw = ctx.measureText('STARLIGHT').width;
      if (tw > maxW) ctx.font = `400 ${(h * 0.25 * maxW) / tw}px ${BOLD}`;
      ctx.fillText('STARLIGHT', w * 0.065, h * 0.42);
      ctx.fillStyle = '#8a63ff';
      ctx.font = `400 ${h * 0.1}px ${MONO}`;
      ctx.fillText('CONCERT 2026', w * 0.068, h * 0.6);
      ctx.fillStyle = '#6d5a86';
      ctx.font = `400 ${h * 0.075}px ${MONO}`;
      ctx.fillText('SEAT A-07 · GATE 3', w * 0.068, h * 0.8);
      ctx.fillStyle = HOT;
      ctx.fill(P(heartD(cut - h * 0.2, h * 0.31, h * 0.09)));
      // stub: ADMIT ONE + barcode
      ctx.save();
      ctx.translate(cut + (w - cut) * 0.3, h / 2);
      ctx.rotate(-Math.PI / 2);
      label(ctx, 'ADMIT ONE', 0, 0, h * 0.74, h * 0.1, MONO, '#8a63ff');
      ctx.restore();
      const r = rng(19);
      ctx.fillStyle = '#3a2f48';
      let y = h * 0.18;
      while (y < h * 0.82) {
        const t = h * (0.008 + r() * 0.02);
        ctx.fillRect(cut + (w - cut) * 0.52, y, (w - cut) * 0.3, t);
        y += t + h * (0.01 + r() * 0.015);
      }
    },
  },
  {
    id: 'dday',
    name: 'D-DAY 日历',
    group: '偶像',
    size: 0.26,
    ratio: 1.06,
    outline: 0.04,
    fontSpec: { font: `400 100px ${BOLD}`, text: 'D-DAY' },
    draw(ctx, w, h) {
      const top = h * 0.12;
      const card = () => rrect(ctx, w * 0.04, top, w * 0.92, h - top - h * 0.02, w * 0.1);
      card();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.fillStyle = HOT;
      ctx.fillRect(0, top, w, h * 0.3);
      ctx.restore();
      card();
      ctx.lineWidth = w * 0.03;
      ctx.strokeStyle = HOT;
      ctx.stroke();
      for (const x of [0.28, 0.72]) {
        rrect(ctx, w * x - w * 0.045, h * 0.03, w * 0.09, h * 0.19, w * 0.045);
        ctx.fillStyle = LAV;
        ctx.fill();
        ctx.lineWidth = w * 0.02;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }
      label(ctx, 'COMEBACK', w / 2, h * 0.33, w * 0.7, h * 0.085, MONO, '#fff');
      label(ctx, 'D-DAY', w / 2, h * 0.645, w * 0.8, h * 0.28, BOLD, HOT);
      ctx.fillStyle = LAV;
      ctx.fill(P(heartD(w * 0.24, h * 0.86, w * 0.05)));
      ctx.fill(P(heartD(w * 0.76, h * 0.86, w * 0.05)));
      ctx.fillStyle = PINK;
      ctx.fill(P(heartD(w * 0.5, h * 0.87, w * 0.06)));
    },
  },
  {
    id: 'album',
    name: '迷你专辑',
    group: '偶像',
    size: 0.34,
    outline: 0.04,
    svg: svg(200, 160, `
      <circle cx="130" cy="80" r="64" fill="url(#cd)" stroke="#cfc8de" stroke-width="3"/>
      <circle cx="130" cy="80" r="42" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
      <circle cx="130" cy="80" r="20" fill="#fff" stroke="#cfc8de" stroke-width="3"/>
      <circle cx="130" cy="80" r="8" fill="#e9e5f2"/>
      <path d="M150 30 A54 54 0 0 1 182 70" stroke="#fff" stroke-width="5" fill="none" opacity=".8" stroke-linecap="round"/>
      <rect x="8" y="14" width="118" height="132" rx="6" fill="url(#cover)" stroke="#fff" stroke-width="4"/>
      <path d="${starD(67, 68, 30, 5, 0.5)}" fill="#fff"/>
      <path d="${sparkleD(102, 34, 10)}" fill="#fff"/>
      <path d="${sparkleD(30, 36, 6)}" fill="#fff"/>
      <rect x="24" y="112" width="62" height="8" rx="4" fill="#fff" opacity=".9"/>
      <rect x="24" y="125" width="40" height="6" rx="3" fill="#fff" opacity=".6"/>`,
    `<linearGradient id="cd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4fb"/><stop offset=".3" stop-color="#ffd6f0"/><stop offset=".5" stop-color="#d8f3ff"/><stop offset=".7" stop-color="#fff5c9"/><stop offset="1" stop-color="#e2dcf2"/></linearGradient>
     <linearGradient id="cover" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9b6ff"/><stop offset="1" stop-color="#ff9fcf"/></linearGradient>`),
  },

  // --- 韩文
  koText('ko-love', '사랑해', { font: JUA, color: '#ff4f9a', stroke: '#fff', strokeWidth: 0.2, outlineColor: '#ffc2dc' }),
  koText('ko-bias', '최애', { font: BOLD, gradient: ['#ff7ac0', '#a47bff'], stroke: '#fff', strokeWidth: 0.18, size: 0.26, holo: true }),
  koText('ko-cute', '귀여워', { font: JUA, color: '#3aa8f5', stroke: '#fff', strokeWidth: 0.2, outlineColor: '#cfeaff' }),
  koText('ko-happy', '오늘도\n행복', { font: JUA, color: '#9a78ff', stroke: '#fff', strokeWidth: 0.2, lineHeight: 1.02, outlineColor: '#e6dcff' }),
  {
    id: 'ko-jjang',
    name: '짱！',
    group: '韩文',
    size: 0.26,
    ratio: 1,
    outline: 0.035,
    fontSpec: { font: `400 100px ${BOLD}`, text: '짱!' },
    draw(ctx, w) {
      const b = P(burstD(w / 2, w / 2, w * 0.46, 12, 0.76, 0.1, 7));
      ctx.fillStyle = LEMON;
      ctx.fill(b);
      ctx.lineJoin = 'round';
      ctx.lineWidth = w * 0.035;
      ctx.strokeStyle = HOT;
      ctx.stroke(b);
      ctx.font = `400 ${w * 0.44}px ${BOLD}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = w * 0.07;
      ctx.strokeStyle = '#fff';
      ctx.strokeText('짱!', w / 2, w * 0.53);
      ctx.fillStyle = HOT;
      ctx.fillText('짱!', w / 2, w * 0.53);
    },
  },
  {
    id: 'bubble-happy',
    name: '행복해 对话框',
    group: '韩文',
    size: 0.34,
    ratio: 0.72,
    outline: 0.03,
    fontSpec: { font: `400 100px ${JUA}`, text: '행복해' },
    draw(ctx, w, h) {
      bubble(ctx, [ellipseP(w / 2, h * 0.43, w * 0.45, h * 0.37), polyP([[w * 0.24, h * 0.66], [w * 0.13, h * 0.96], [w * 0.42, h * 0.76]])], '#fff', HOT, w * 0.028);
      label(ctx, '행복해', w * 0.47, h * 0.45, w * 0.62, h * 0.34, JUA, HOT);
      ctx.fillStyle = PINK;
      ctx.fill(P(heartD(w * 0.82, h * 0.34, w * 0.05)));
    },
  },
  {
    id: 'bubble-thanks',
    name: '고마워 云朵框',
    group: '韩文',
    size: 0.34,
    ratio: 0.7,
    outline: 0.03,
    fontSpec: { font: `400 100px ${JUA}`, text: '고마워' },
    draw(ctx, w, h) {
      const puffs = [[0.3, 0.46, 0.2], [0.5, 0.34, 0.24], [0.7, 0.44, 0.21], [0.42, 0.6, 0.18], [0.62, 0.6, 0.18], [0.2, 0.6, 0.12], [0.82, 0.58, 0.12]]
        .map(([x, y, r]) => ellipseP(w * x, h * y, w * r, w * r * 0.9));
      puffs.push(polyP([[w * 0.66, h * 0.7], [w * 0.86, h * 0.97], [w * 0.52, h * 0.76]]));
      bubble(ctx, puffs, '#e3f4ff', '#57b5f2', w * 0.024);
      label(ctx, '고마워', w / 2, h * 0.5, w * 0.6, h * 0.3, JUA, '#2b8fd8');
    },
  },

  // --- 装饰 (탑꾸)
  { id: 'bow', name: '缎带蝴蝶结', group: '装饰', size: 0.3, outline: 0.04, svg: bowSvg(BOW_LAV, false) },
  {
    id: 'pearls',
    name: '珍珠链',
    group: '装饰',
    size: 0.46,
    outline: 0.03,
    svg: svg(260, 96, Array.from({ length: 15 }, (_, i) => {
      const t = i / 14;
      const x = 14 + t * 232;
      const y = 18 + Math.sin(t * Math.PI) * 58;
      const r = i % 2 ? 8.5 : 11;
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="url(#pearl)" stroke="#d7cde4" stroke-width="1.5"/>`;
    }).join(''), PEARL_DEF),
  },
  {
    id: 'charm',
    name: '爱心吊坠',
    group: '装饰',
    size: 0.2,
    outline: 0.05,
    svg: svg(120, 200, `
      ${Array.from({ length: 6 }, (_, i) => `<ellipse cx="60" cy="${10 + i * 15}" rx="${i % 2 ? 4 : 6}" ry="8" fill="none" stroke="#e7bf55" stroke-width="3.5"/>`).join('')}
      <circle cx="60" cy="102" r="8" fill="none" stroke="#e7bf55" stroke-width="4"/>
      <path d="${heartD(60, 146, 40)}" fill="url(#ch)" stroke="#e7bf55" stroke-width="6" stroke-linejoin="round"/>
      <path d="M36 134 Q40 122 52 120" stroke="#fff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="${sparkleD(90, 174, 9)}" fill="#fff"/>`,
    '<linearGradient id="ch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9fd0"/><stop offset="1" stop-color="#ff3d95"/></linearGradient>'),
  },
  {
    id: 'sparkles',
    name: '闪闪',
    group: '装饰',
    size: 0.24,
    outline: 0.05,
    svg: svg(160, 160, `
      <path d="${sparkleD(68, 82, 56, 0.16)}" fill="${LEMON}" stroke="#ffc21f" stroke-width="3" stroke-linejoin="round"/>
      <path d="${sparkleD(128, 34, 22, 0.2)}" fill="${PINK}"/>
      <path d="${sparkleD(132, 124, 16, 0.2)}" fill="${SKY}"/>
      <circle cx="26" cy="28" r="7" fill="${LAV}"/>`),
  },
  {
    id: 'stars',
    name: '星星',
    group: '装饰',
    size: 0.26,
    outline: 0.05,
    svg: svg(170, 150, `
      <path d="${starD(70, 82, 56, 5, 0.52)}" fill="#ffe066" stroke="#f6b930" stroke-width="7" stroke-linejoin="round"/>
      <path d="M52 66 Q58 55 70 53" stroke="#fff" stroke-width="6" fill="none" opacity=".85" stroke-linecap="round"/>
      <path d="${starD(138, 40, 26, 5, 0.52)}" fill="#ff9fd0" stroke="#ff6fb5" stroke-width="5" stroke-linejoin="round"/>
      <path d="${starD(140, 116, 18, 5, 0.52)}" fill="${LAV}" stroke="#9a7bff" stroke-width="4" stroke-linejoin="round"/>`),
  },
  {
    id: 'bear',
    name: '小熊',
    group: '装饰',
    size: 0.24,
    outline: 0.06,
    svg: svg(160, 140, `
      <g stroke="#8a5a3c" stroke-width="5">
        <circle cx="38" cy="38" r="26" fill="#c48a60"/><circle cx="122" cy="38" r="26" fill="#c48a60"/>
        <ellipse cx="80" cy="80" rx="64" ry="54" fill="#c48a60"/>
      </g>
      <circle cx="38" cy="38" r="13" fill="#f3c7a5"/><circle cx="122" cy="38" r="13" fill="#f3c7a5"/>
      <ellipse cx="80" cy="97" rx="25" ry="18" fill="#f7dcc2"/>
      <ellipse cx="80" cy="89" rx="9" ry="6.5" fill="#3b2a22"/>
      <path d="M80 95 L80 101 M80 101 Q73 107 67 101 M80 101 Q87 107 93 101" stroke="#3b2a22" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="56" cy="74" r="6.5" fill="#3b2a22"/><circle cx="104" cy="74" r="6.5" fill="#3b2a22"/>
      <circle cx="58" cy="72" r="2" fill="#fff"/><circle cx="106" cy="72" r="2" fill="#fff"/>
      <ellipse cx="40" cy="96" rx="11" ry="7" fill="#ff9fb8" opacity=".75"/><ellipse cx="120" cy="96" rx="11" ry="7" fill="#ff9fb8" opacity=".75"/>`),
  },
  {
    id: 'bunny',
    name: '小兔',
    group: '装饰',
    size: 0.22,
    outline: 0.06,
    svg: svg(150, 170, `
      <g stroke="#e6c3d3" stroke-width="5">
        <ellipse cx="50" cy="48" rx="17" ry="44" transform="rotate(-10 50 48)" fill="#fff"/>
        <ellipse cx="100" cy="48" rx="17" ry="44" transform="rotate(10 100 48)" fill="#fff"/>
        <ellipse cx="75" cy="118" rx="62" ry="48" fill="#fff"/>
      </g>
      <ellipse cx="50" cy="52" rx="7" ry="30" transform="rotate(-10 50 52)" fill="#ffc2d8"/>
      <ellipse cx="100" cy="52" rx="7" ry="30" transform="rotate(10 100 52)" fill="#ffc2d8"/>
      <circle cx="53" cy="112" r="6.5" fill="#3b2a33"/><circle cx="97" cy="112" r="6.5" fill="#3b2a33"/>
      <circle cx="55" cy="110" r="2" fill="#fff"/><circle cx="99" cy="110" r="2" fill="#fff"/>
      <path d="${heartD(75, 124, 6)}" fill="#ff7aa6"/>
      <path d="M75 128 Q68 136 62 130 M75 128 Q82 136 88 130" stroke="#3b2a33" stroke-width="3" fill="none" stroke-linecap="round"/>
      <ellipse cx="34" cy="130" rx="11" ry="7" fill="#ffb3cb" opacity=".8"/><ellipse cx="116" cy="130" rx="11" ry="7" fill="#ffb3cb" opacity=".8"/>
      <g transform="translate(108 18) rotate(18)"><path d="M0 0 L-16 -10 Q-21 0 -16 10Z M0 0 L16 -10 Q21 0 16 10Z" fill="${HOT}"/><circle r="5" fill="#ff5fa8"/></g>`),
  },
  {
    id: 'cloud',
    name: '云朵',
    group: '装饰',
    size: 0.28,
    outline: 0.05,
    svg: svg(180, 120, `
      <path d="M40 104 C14 104 6 74 28 62 C22 34 56 18 78 36 C88 12 128 12 138 40 C164 34 180 60 166 80 C180 96 164 108 148 104Z" fill="#fff" stroke="${SKY}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="74" cy="72" r="5" fill="#3b2a33"/><circle cx="110" cy="72" r="5" fill="#3b2a33"/>
      <path d="M84 82 Q92 90 100 82" stroke="#3b2a33" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="62" cy="84" rx="9" ry="5.5" fill="#ffb3cb" opacity=".85"/><ellipse cx="122" cy="84" rx="9" ry="5.5" fill="#ffb3cb" opacity=".85"/>`),
  },
  {
    id: 'notes',
    name: '音符',
    group: '装饰',
    size: 0.24,
    outline: 0.05,
    svg: svg(150, 150, `
      <path d="M50 34 L118 18 L118 36 L50 52Z" fill="#9a7bff"/>
      <rect x="44" y="34" width="10" height="84" rx="4" fill="#9a7bff"/>
      <rect x="112" y="18" width="10" height="84" rx="4" fill="#9a7bff"/>
      <ellipse cx="36" cy="118" rx="22" ry="16" transform="rotate(-22 36 118)" fill="#9a7bff"/>
      <ellipse cx="104" cy="102" rx="22" ry="16" transform="rotate(-22 104 102)" fill="#9a7bff"/>
      <ellipse cx="28" cy="112" rx="7" ry="4" transform="rotate(-22 28 112)" fill="#fff" opacity=".7"/>
      <ellipse cx="96" cy="96" rx="7" ry="4" transform="rotate(-22 96 96)" fill="#fff" opacity=".7"/>
      <path d="${sparkleD(134, 128, 12)}" fill="${PINK}"/>
      <path d="${heartD(20, 22, 9)}" fill="${PINK}"/>`),
  },
];

// ----------------------------------------------------------------- layouts
// 2×6" strip (two per 4×6 sheet), the wider MULTI 2×2 sheet, and a 55×85 mm
// photocard (650×1004 px @300 dpi) with a single photo.

export const layouts = [
  {
    ...stripLayout({ id: 'strip', name: '人生四格竖条', n: 4, W: 600, H: 1800, side: 36, top: 44, gap: 20, bottom: 250, aspect: 4 / 3, shape: 'round', r: 10 }),
    desc: '2×6 英寸 · 一次打印两条',
    sheet: 'strip-pair',
  },
  {
    ...gridLayout({ id: 'multi', name: 'MULTI 四宫格', cols: 2, rows: 2, W: 1200, H: 1800, pad: 56, gap: 28, top: 90, bottom: 290, aspect: 0.76, shape: 'round', r: 14 }),
    desc: '4×6 英寸 · 2×2 大格',
  },
  {
    id: 'photocard',
    name: '偶像小卡',
    desc: '55×85mm 小卡 · 从 8 张里挑 1 张',
    size: [650, 1004],
    photos: 1,
    slots: [{ x: 38, y: 38, w: 574, h: 766, shape: 'round', r: 30 }],
    footer: { y: 820, h: 184 },
  },
];

// ----------------------------------------------------------------- frame helpers

/** Footer scale: 1 on the 2×6 strip, larger on the 4×6 sheet, smaller on the card. */
const fk = (L) => Math.min(L.W / 600, L.footer.h / 220);
/** Paper scale for patterns and strokes. */
const pk = (L) => L.W / 600;

function wordmark(ctx, x, y, px, { color = INK, accent = HOT, stroke = null, glow = null } = {}) {
  ctx.save();
  ctx.font = `400 ${px}px ${BOLD}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText('STAR 4CUT').width;
  if (stroke) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = px * 0.18;
    ctx.strokeStyle = stroke;
    ctx.strokeText('STAR 4CUT', x, y);
  }
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = px * 0.4;
  }
  ctx.fillStyle = color;
  ctx.fillText('STAR 4CUT', x, y);
  ctx.fillStyle = accent;
  ctx.fill(P(sparkleD(x + tw / 2 + px * 0.3, y - px * 0.32, px * 0.24)));
  ctx.fill(P(sparkleD(x - tw / 2 - px * 0.24, y + px * 0.24, px * 0.13)));
  ctx.restore();
}

function infoLine(ctx, info, x, y, px, color, font = MONO) {
  ctx.save();
  ctx.font = `400 ${px}px ${font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(`${stamp(info.date || new Date())}  ·  No.${String(info.serial || 0).padStart(6, '0')}`, x, y);
  ctx.restore();
}

/** Tiny white hearts in offset rows (pastel paper). */
function heartGrid(ctx, W, H, cell, color) {
  ctx.fillStyle = color;
  for (let row = 0, y = cell * 0.5; y < H + cell; row++, y += cell * 0.86) {
    for (let x = (row % 2) * cell * 0.5; x < W + cell; x += cell) ctx.fill(P(heartD(x, y, cell * 0.12)));
  }
}

/** Little hearts/sparkles overlapping a few photo corners (deterministic). */
function cornerDeco(ctx, L, seed, colors) {
  const r = rng(seed);
  const u = pk(L);
  L.slots.forEach((s, i) => {
    if (r() < 0.35 && i) return;
    const right = r() < 0.5;
    const top = r() < 0.5;
    const x = right ? s.x + s.w - 6 * u : s.x + 6 * u;
    const y = top ? s.y + 6 * u : s.y + s.h - 6 * u;
    ctx.fillStyle = colors[i % colors.length];
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 5 * u;
    ctx.lineJoin = 'round';
    const shape = P(i % 2 ? sparkleD(x, y, 26 * u, 0.2) : heartD(x, y, 22 * u));
    ctx.stroke(shape);
    ctx.fill(shape);
    ctx.fill(P(sparkleD(x + (right ? -34 : 34) * u, y + (top ? 26 : -26) * u, 9 * u)));
  });
}

// ----------------------------------------------------------------- STARRY
// A made-up idol drawn as a cardboard cut-out (등신대) for the「和偶像合照」
// frame: a bust in a 600×760 box, one pose per photo.

const IDOL_W = 600;
const IDOL_H = 760;
const IDOL_POSES = ['heart', 'v', 'cheek', 'wave'];
const IDOL_SAYS = ['사랑해', '최고!', '귀여워', '안녕!'];
const SKIN = '#ffe6da';
const SKIN_LN = '#e7a791';
const HAIR = '#6a4690';
const HAIR_HI = '#9d7ccb';
const COAT = '#ffa3cf';
const COAT_LN = '#ee7fb5';
const idolCache = new Map();

function capsule(ctx, x0, y0, x1, y1, w, fill = SKIN, line = SKIN_LN) {
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = line;
  ctx.lineWidth = w + 7;
  ctx.stroke();
  ctx.strokeStyle = fill;
  ctx.lineWidth = w;
  ctx.stroke();
}

function blob(ctx, x, y, rx, ry, rot = 0, fill = SKIN, line = SKIN_LN) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = line;
  ctx.stroke();
}

function sleeve(ctx, x0, y0, x1, y1) {
  capsule(ctx, x0, y0, x1, y1, 86, COAT, COAT_LN);
  const a = Math.atan2(y1 - y0, x1 - x0);
  capsule(ctx, x1 - Math.cos(a) * 22, y1 - Math.sin(a) * 22, x1 - Math.cos(a) * 8, y1 - Math.sin(a) * 8, 86, '#fff', COAT_LN);
}

function fan(ctx, x, y, fingers) {
  for (const [deg, len, w] of fingers) {
    const a = (deg * Math.PI) / 180;
    capsule(ctx, x + Math.cos(a) * 18, y + Math.sin(a) * 18, x + Math.cos(a) * len, y + Math.sin(a) * len, w);
  }
}

function idolHands(ctx, pose) {
  if (pose === 'heart') {
    sleeve(ctx, 486, 800, 468, 560);
    capsule(ctx, 466, 486, 458, 420, 25);
    blob(ctx, 460, 512, 40, 44);
    ctx.strokeStyle = SKIN_LN;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(470, 506);
    ctx.quadraticCurveTo(488, 510, 496, 520);
    ctx.moveTo(468, 530);
    ctx.quadraticCurveTo(486, 534, 494, 544);
    ctx.stroke();
    capsule(ctx, 430, 520, 476, 440, 27);
    blob(ctx, 474, 442, 9, 12, 0.5, '#fff1f1', '#efb9a4');
    ctx.fillStyle = HOT;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 6;
    const hp = P(heartD(500, 372, 30));
    ctx.stroke(hp);
    ctx.fill(hp);
  } else if (pose === 'v') {
    sleeve(ctx, 486, 800, 470, 580);
    capsule(ctx, 452, 500, 424, 396, 26);
    capsule(ctx, 480, 500, 500, 398, 26);
    blob(ctx, 466, 530, 42, 44);
    capsule(ctx, 438, 540, 478, 520, 24);
  } else if (pose === 'cheek') {
    sleeve(ctx, 150, 800, 226, 590);
    sleeve(ctx, 450, 800, 374, 590);
    fan(ctx, 250, 500, [[-150, 70, 22], [-128, 76, 22], [-106, 74, 22], [-84, 64, 21]]);
    fan(ctx, 350, 500, [[-30, 70, 22], [-52, 76, 22], [-74, 74, 22], [-96, 64, 21]]);
    blob(ctx, 250, 512, 40, 32, 0.35);
    blob(ctx, 350, 512, 40, 32, -0.35);
  } else {
    sleeve(ctx, 492, 800, 480, 590);
    fan(ctx, 482, 480, [[-122, 74, 22], [-102, 84, 23], [-82, 82, 23], [-62, 70, 21], [-168, 58, 24]]);
    blob(ctx, 482, 494, 42, 46);
    ctx.strokeStyle = PINK;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(482, 470, 118, -1.25, -0.75);
    ctx.moveTo(482 + Math.cos(-1.3) * 142, 470 + Math.sin(-1.3) * 142);
    ctx.arc(482, 470, 142, -1.3, -0.95);
    ctx.stroke();
  }
}

function drawIdol(ctx, pose) {
  ctx.lineJoin = 'round';
  // long hair behind the shoulders
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(300, 118);
  ctx.bezierCurveTo(166, 118, 120, 226, 128, 360);
  ctx.bezierCurveTo(134, 470, 112, 560, 146, 650);
  ctx.lineTo(454, 650);
  ctx.bezierCurveTo(488, 560, 466, 470, 472, 360);
  ctx.bezierCurveTo(480, 226, 434, 118, 300, 118);
  ctx.fill();
  ctx.strokeStyle = '#583879';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(300 + s * 150, 300);
    ctx.bezierCurveTo(300 + s * 164, 420, 300 + s * 150, 520, 300 + s * 162, 630);
    ctx.moveTo(300 + s * 132, 420);
    ctx.bezierCurveTo(300 + s * 140, 500, 300 + s * 132, 560, 300 + s * 140, 630);
    ctx.stroke();
  }
  // neck with a soft shadow under the chin
  ctx.fillStyle = '#f9d3c4';
  ctx.fillRect(266, 420, 68, 140);
  ctx.fillStyle = '#efb8a4';
  ctx.beginPath();
  ctx.ellipse(300, 452, 40, 34, 0, 0, Math.PI);
  ctx.fill();
  // stage jacket with a white top and a big bow
  ctx.beginPath();
  ctx.moveTo(92, 770);
  ctx.bezierCurveTo(96, 632, 150, 566, 248, 540);
  ctx.lineTo(352, 540);
  ctx.bezierCurveTo(450, 566, 504, 632, 508, 770);
  ctx.closePath();
  ctx.fillStyle = COAT;
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = COAT_LN;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(246, 540);
  ctx.lineTo(300, 684);
  ctx.lineTo(354, 540);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = HOT;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(240, 542);
  ctx.lineTo(300, 696);
  ctx.lineTo(360, 542);
  ctx.stroke();
  ctx.fillStyle = HOT;
  ctx.fill(P('M300 570 L258 546 Q248 570 258 594Z M300 570 L342 546 Q352 570 342 594Z'));
  ctx.beginPath();
  ctx.arc(300, 570, 12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd84a';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  const badge = P(starD(410, 660, 22, 5, 0.5));
  ctx.stroke(badge);
  ctx.fill(badge);
  // ears + face
  blob(ctx, 184, 336, 20, 30);
  blob(ctx, 416, 336, 20, 30);
  ctx.beginPath();
  ctx.moveTo(300, 462);
  ctx.bezierCurveTo(238, 462, 186, 410, 182, 330);
  ctx.bezierCurveTo(178, 242, 232, 192, 300, 192);
  ctx.bezierCurveTo(368, 192, 422, 242, 418, 330);
  ctx.bezierCurveTo(414, 410, 362, 462, 300, 462);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = SKIN_LN;
  ctx.stroke();
  // blush, eyes, nose, smile
  ctx.fillStyle = 'rgba(255,140,170,0.45)';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(300 + s * 70, 398, 28, 15, 0, 0, TAU);
    ctx.fill();
  }
  for (const s of [-1, 1]) {
    const ex = 300 + s * 54;
    const ey = 346;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 30, 27, 0, 0, TAU);
    ctx.fill();
    const g = ctx.createLinearGradient(0, ey - 28, 0, ey + 26);
    g.addColorStop(0, '#2e1a36');
    g.addColorStop(1, '#8a5aa6');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(ex, ey + 2, 21, 26, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + 7, ey - 9, 8, 0, TAU);
    ctx.arc(ex - 7, ey + 11, 4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = '#3a2238';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(ex, ey + 6, 33, 32, 0, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex + s * 30, ey - 14);
    ctx.lineTo(ex + s * 42, ey - 22);
    ctx.stroke();
  }
  ctx.strokeStyle = '#6b4a78';
  ctx.lineWidth = 6;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(300 + s * 30, 300);
    ctx.quadraticCurveTo(300 + s * 54, 290, 300 + s * 78, 298);
    ctx.stroke();
  }
  ctx.strokeStyle = '#e39a86';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(298, 384);
  ctx.quadraticCurveTo(302, 392, 306, 386);
  ctx.stroke();
  ctx.fillStyle = '#ff6f91';
  ctx.strokeStyle = '#c94a6a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(278, 414);
  ctx.quadraticCurveTo(300, 444, 322, 414);
  ctx.quadraticCurveTo(300, 422, 278, 414);
  ctx.fill();
  ctx.stroke();
  // bangs + side locks over the face
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.moveTo(166, 420);
  ctx.bezierCurveTo(146, 262, 196, 138, 300, 134);
  ctx.bezierCurveTo(404, 138, 454, 262, 434, 420);
  ctx.bezierCurveTo(424, 360, 414, 318, 398, 290);
  ctx.bezierCurveTo(384, 294, 364, 276, 356, 256);
  ctx.bezierCurveTo(342, 284, 318, 290, 302, 266);
  ctx.bezierCurveTo(288, 290, 262, 288, 248, 258);
  ctx.bezierCurveTo(236, 280, 216, 298, 202, 290);
  ctx.bezierCurveTo(186, 318, 176, 360, 166, 420);
  ctx.fill();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(300 + s * 118, 300);
    ctx.bezierCurveTo(300 + s * 142, 380, 300 + s * 150, 470, 300 + s * 132, 560);
    ctx.bezierCurveTo(300 + s * 120, 500, 300 + s * 112, 420, 300 + s * 104, 330);
    ctx.fill();
  }
  ctx.strokeStyle = '#583879';
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (const [x0, x1] of [[262, 250], [300, 302], [338, 354]]) {
    ctx.moveTo(300 + (x0 - 300) * 0.4, 150);
    ctx.quadraticCurveTo(x0, 190, x1, 246);
  }
  ctx.stroke();
  ctx.strokeStyle = HAIR_HI;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(214, 196);
  ctx.quadraticCurveTo(252, 164, 300, 160);
  ctx.moveTo(334, 164);
  ctx.quadraticCurveTo(362, 170, 382, 186);
  ctx.stroke();
  // star hair pin
  ctx.fillStyle = '#ffd84a';
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 5;
  const pin = P(starD(388, 222, 26, 5, 0.5));
  ctx.stroke(pin);
  ctx.fill(pin);
  idolHands(ctx, pose);
}

/** STARRY as a die-cut standee bitmap `width` px wide (cached). */
function idolBitmap(pose, width) {
  const key = `${pose}@${Math.round(width)}`;
  if (!idolCache.has(key)) {
    const k = Math.round(width) / IDOL_W;
    const c = mkCanvas(IDOL_W * k, IDOL_H * k);
    const ctx = c.getContext('2d');
    ctx.scale(k, k);
    drawIdol(ctx, pose);
    idolCache.set(key, dieCut(c, Math.max(3, width * 0.024), '#fff', true));
  }
  return idolCache.get(key);
}

/** Paint STARRY beside the guest inside photo slot `s` (clipped to it). */
function idolInSlot(ctx, s, i) {
  const pose = IDOL_POSES[i % IDOL_POSES.length];
  const right = i % 2 === 0;
  const bh = Math.min(s.h * 0.92, s.w * 0.62 * (IDOL_H / IDOL_W));
  const bw = bh * (IDOL_W / IDOL_H);
  const bmp = idolBitmap(pose, bw);
  const m = bmp.margin;
  const x = right ? s.x + s.w - bw * 0.86 : s.x - bw * 0.14;
  const y = s.y + s.h - bh + bh * 0.03;
  ctx.save();
  slotPath(ctx, s);
  ctx.clip();
  ctx.save();
  // her gesture hand is drawn on her left; mirror so it points at the guest
  if (right) {
    ctx.translate(x + bw / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(x + bw / 2), 0);
  }
  ctx.drawImage(bmp, x - m, y - m);
  ctx.restore();
  // speech bubble next to her head, on the guest's side
  const px = bh * 0.07;
  const text = IDOL_SAYS[i % IDOL_SAYS.length];
  ctx.font = `400 ${px}px ${JUA}`;
  const tw = ctx.measureText(text).width;
  const bwid = tw + px * 1.2;
  const bht = px * 1.55;
  const hx = right ? x + bw * 0.24 : x + bw * 0.76;
  const bx = right ? hx - bwid : hx;
  const by = y + bh * 0.08;
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = HOT;
  ctx.lineWidth = px * 0.1;
  rrect(ctx, bx, by, bwid, bht, bht / 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  const tx = right ? bx + bwid - bht * 0.5 : bx + bht * 0.5;
  ctx.moveTo(tx - px * 0.25, by + bht - px * 0.06);
  ctx.lineTo(tx + (right ? px * 0.45 : -px * 0.45), by + bht + px * 0.45);
  ctx.lineTo(tx + px * 0.25, by + bht - px * 0.06);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(tx - px * 0.2, by + bht - px * 0.2, px * 0.4, px * 0.16);
  label(ctx, text, bx + bwid / 2, by + bht * 0.52, tw, px, JUA, HOT);
  ctx.restore();
}

// ----------------------------------------------------------------- frames

function stageBg(ctx, W, H, u, seed) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#140b26');
  g.addColorStop(1, '#2c0f3e');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [x, col, spread] of [[0.12, '#ff5fb0', 0.22], [0.88, '#5fc8ff', 0.22], [0.5, '#b58cff', 0.14]]) {
    const ox = W * x;
    const len = H * 1.1;
    const lg = ctx.createLinearGradient(ox, 0, ox, len);
    lg.addColorStop(0, rgba(col, 0.42));
    lg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(ox - 8 * u, -10);
    ctx.lineTo(ox + 8 * u, -10);
    ctx.lineTo(ox + (0.5 - x) * W * 0.6 + len * spread, len);
    ctx.lineTo(ox + (0.5 - x) * W * 0.6 - len * spread, len);
    ctx.fill();
  }
  const r = rng(seed);
  const cols = ['255,95,176', '185,162,255', '120,200,255', '255,255,255'];
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(${cols[i % 4]},${(0.08 + r() * 0.22).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(r() * W, r() * H, (3 + r() * 14) * u, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

/** Rows of glowing light sticks — the fan "ocean" at a concert. */
function lightstickSea(ctx, W, y0, y1, u, seed) {
  const r = rng(seed);
  const cols = [HOT, '#ffffff', LAV, PINK];
  ctx.save();
  for (let row = 0; row < 3; row++) {
    const y = y0 + (y1 - y0) * (0.22 + row * 0.32);
    const step = (30 - row * 4) * u;
    for (let x = step * (row % 2 ? 0.5 : 0.2); x < W; x += step) {
      const jx = x + (r() - 0.5) * step * 0.4;
      const jy = y + (r() - 0.5) * 10 * u;
      const tilt = (r() - 0.5) * 0.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3 * u;
      ctx.beginPath();
      ctx.moveTo(jx, jy);
      ctx.lineTo(jx - Math.sin(tilt) * 26 * u, jy + 26 * u);
      ctx.stroke();
      const c = cols[Math.floor(r() * cols.length)];
      ctx.shadowColor = c;
      ctx.shadowBlur = 12 * u;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(jx, jy, (5.5 - row * 0.8) * u, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.restore();
}

/** Puffy clouds along the bottom edge of the paper. */
function cloudBank(ctx, L, seed) {
  const u = pk(L);
  const r = rng(seed);
  for (const [alpha, lift, size] of [[0.6, 0.55, 1], [0.95, 0.12, 0.8]]) {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.beginPath();
    for (let x = -20 * u; x < L.W + 60 * u; x += 52 * u * size) {
      const rad = (30 + r() * 26) * u * size;
      const y = L.H - L.footer.h * 0.18 * lift - rad * 0.2;
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
    ctx.fill();
  }
}

/** Photocard sleeve deco: pearl drape with a heart charm. */
function pearlDrape(ctx, x0, x1, y, sag, u) {
  const n = 17;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const yy = y + Math.sin(t * Math.PI) * sag;
    pearl(ctx, x, yy, (i % 2 ? 8 : 10.5) * u);
  }
  const cx = (x0 + x1) / 2;
  const cy = y + sag;
  ctx.strokeStyle = '#e7bf55';
  ctx.lineWidth = 3.5 * u;
  ctx.beginPath();
  ctx.arc(cx, cy + 16 * u, 7 * u, 0, TAU);
  ctx.stroke();
  const g = ctx.createLinearGradient(0, cy + 20 * u, 0, cy + 76 * u);
  g.addColorStop(0, '#ff9fd0');
  g.addColorStop(1, '#ff3d95');
  const hp = P(heartD(cx, cy + 50 * u, 28 * u));
  ctx.lineWidth = 5 * u;
  ctx.stroke(hp);
  ctx.fillStyle = g;
  ctx.fill(hp);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - 16 * u, cy + 44 * u);
  ctx.quadraticCurveTo(cx - 13 * u, cy + 34 * u, cx - 4 * u, cy + 33 * u);
  ctx.stroke();
}

function holoFill(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  ['#ffd6f0', '#d9ecff', '#fff6c9', '#e4d6ff', '#d4fff0', '#ffd6f0'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
  return g;
}

export const frames = [
  {
    id: 'idol',
    name: '和偶像合照 · 限定',
    layouts: ['strip', 'multi'],
    paint: {
      under(ctx, L) {
        const u = pk(L);
        ctx.fillStyle = '#fff3f8';
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,160,205,0.2)';
        ctx.lineWidth = 16 * u;
        for (let x = -L.H; x < L.W; x += 40 * u) {
          ctx.beginPath();
          ctx.moveTo(x, L.H);
          ctx.lineTo(x + L.H, 0);
          ctx.stroke();
        }
        ctx.restore();
        const top = L.slots[0].y;
        if (top >= 36) label(ctx, 'LIMITED FRAME  ·  with STARRY', L.W / 2, top * 0.5, L.W * 0.9, Math.min(top * 0.4, 30 * u), MONO, '#e0609f');
      },
      slot(ctx, s, i) {
        idolInSlot(ctx, s, i);
        slotPath(ctx, s);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        ctx.stroke();
      },
      over(ctx, L, info) {
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.34;
        wordmark(ctx, L.W / 2, y, 54 * k, { color: INK, accent: HOT });
        label(ctx, 'with STARRY', L.W / 2, y + 50 * k, L.W * 0.8, 30 * k, SCRIPT, HOT);
        infoLine(ctx, info, L.W / 2, y + 94 * k, 15 * k, '#b07a9a');
      },
    },
  },
  {
    id: 'black',
    name: '经典黑框',
    paint: {
      under(ctx, L) {
        ctx.fillStyle = '#121014';
        ctx.fillRect(0, 0, L.W, L.H);
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 2;
        ctx.stroke();
      },
      over(ctx, L, info) {
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.42;
        wordmark(ctx, L.W / 2, y, 64 * k, { color: '#fff', accent: HOT });
        infoLine(ctx, info, L.W / 2, y + 64 * k, 18 * k, '#a9a2b3');
      },
    },
  },
  {
    id: 'white',
    name: '纯白简约',
    paint: {
      under(ctx, L) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, L.W, L.H);
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.strokeStyle = 'rgba(30,20,40,0.08)';
        ctx.lineWidth = 2;
        ctx.stroke();
      },
      over(ctx, L, info) {
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.42;
        wordmark(ctx, L.W / 2, y, 64 * k, { color: INK, accent: HOT });
        infoLine(ctx, info, L.W / 2, y + 64 * k, 18 * k, '#9a93a3');
      },
    },
  },
  {
    id: 'pink',
    name: '樱花粉',
    paint: {
      under(ctx, L) {
        const g = ctx.createLinearGradient(0, 0, 0, L.H);
        g.addColorStop(0, '#ffe4f0');
        g.addColorStop(1, '#ffc6dd');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L.W, L.H);
        heartGrid(ctx, L.W, L.H, 48 * pk(L), 'rgba(255,255,255,0.75)');
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 12;
        ctx.stroke();
      },
      over(ctx, L, info) {
        cornerDeco(ctx, L, 5, [HOT, LAV, '#ff7eb6', SKY]);
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.42;
        wordmark(ctx, L.W / 2, y, 60 * k, { color: HOT, accent: '#fff', stroke: '#fff' });
        infoLine(ctx, info, L.W / 2, y + 64 * k, 17 * k, '#d04f8c');
      },
    },
  },
  {
    id: 'dream',
    name: '薰衣草天空',
    paint: {
      under(ctx, L) {
        const u = pk(L);
        const g = ctx.createLinearGradient(0, 0, 0, L.H);
        g.addColorStop(0, '#e6d8ff');
        g.addColorStop(0.55, '#d9e2ff');
        g.addColorStop(1, '#c6e8ff');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L.W, L.H);
        const r = rng(23);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 9; i++) {
          const x = r() * L.W;
          const y = r() * L.H;
          const s = (26 + r() * 30) * u;
          for (const [dx, dy, k] of [[0, 0, 1], [s * 0.9, s * 0.2, 0.75], [-s * 0.9, s * 0.25, 0.7]]) {
            ctx.beginPath();
            ctx.arc(x + dx, y + dy, s * k, 0, TAU);
            ctx.fill();
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for (let i = 0; i < 26; i++) ctx.fill(P(sparkleD(r() * L.W, r() * L.H, (4 + r() * 9) * u)));
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10;
        ctx.stroke();
      },
      over(ctx, L, info) {
        cornerDeco(ctx, L, 8, [LEMON, '#ffffff', LAV, SKY]);
        cloudBank(ctx, L, 12);
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.42;
        wordmark(ctx, L.W / 2, y, 60 * k, { color: '#fff', accent: LEMON, stroke: '#a58cf5' });
        infoLine(ctx, info, L.W / 2, y + 64 * k, 17 * k, '#7a67d6');
      },
    },
  },
  {
    id: 'stage',
    name: '演唱会舞台',
    paint: {
      under(ctx, L) {
        stageBg(ctx, L.W, L.H, pk(L), 9);
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.save();
        ctx.shadowColor = HOT;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#ff9ad2';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      },
      over(ctx, L, info) {
        const k = fk(L);
        const y = L.footer.y + L.footer.h * 0.28;
        lightstickSea(ctx, L.W, L.footer.y + L.footer.h * 0.62, L.H, k, 4);
        wordmark(ctx, L.W / 2, y, 58 * k, { color: '#fff', accent: LEMON, glow: HOT });
        ctx.save();
        ctx.shadowColor = HOT;
        ctx.shadowBlur = 10 * k;
        label(ctx, 'LIVE ON STAGE', L.W / 2, y + 48 * k, L.W * 0.8, 17 * k, MONO, '#ffb8de');
        ctx.restore();
        infoLine(ctx, info, L.W / 2, y + 78 * k, 14 * k, '#bfaee6');
      },
    },
  },
  {
    id: 'toploader',
    name: '탑꾸 小卡套',
    layouts: ['photocard'],
    paint: {
      under(ctx, L) {
        const u = L.W / 650;
        ctx.clearRect(0, 0, L.W, L.H);
        ctx.save();
        rrect(ctx, 0, 0, L.W, L.H, 40 * u);
        ctx.clip();
        ctx.fillStyle = holoFill(ctx, 0, 0, L.W, L.H);
        ctx.fillRect(0, 0, L.W, L.H);
        const r = rng(31);
        for (let i = 0; i < 160; i++) {
          ctx.fillStyle = i % 3 ? 'rgba(255,255,255,0.8)' : 'rgba(255,170,215,0.7)';
          ctx.beginPath();
          ctx.arc(r() * L.W, r() * L.H, (0.8 + r() * 2.2) * u, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = '#fff';
        for (let i = 0; i < 14; i++) ctx.fill(P(sparkleD(r() * L.W, r() * L.H, (5 + r() * 8) * u)));
        ctx.restore();
      },
      slot(ctx, s) {
        slotPath(ctx, s);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 10;
        ctx.stroke();
      },
      over(ctx, L, info) {
        const u = L.W / 650;
        const s = L.slots[0];
        // stickers the owner stuck on the sleeve
        pearlDrape(ctx, s.x + 60 * u, s.x + s.w - 60 * u, 22 * u, 44 * u, u);
        paintBow(ctx, s.x + 40 * u, s.y + 34 * u, 150 * u, BOW_PINK, -0.35);
        for (const [x, y, rad, c] of [[s.x + s.w - 40 * u, s.y + s.h - 60 * u, 34, LEMON], [s.x + s.w - 90 * u, s.y + s.h - 22 * u, 20, PINK]]) {
          const st = P(starD(x, y, rad * u, 5, 0.5));
          ctx.lineJoin = 'round';
          ctx.lineWidth = 7 * u;
          ctx.strokeStyle = '#fff';
          ctx.stroke(st);
          ctx.fillStyle = c;
          ctx.fill(st);
        }
        // name label
        const ly = L.footer.y + L.footer.h * 0.36;
        ctx.font = `400 ${44 * u}px ${BOLD}`;
        const wB = ctx.measureText('BIAS').width;
        const wM = ctx.measureText('ME').width;
        const gap = 46 * u;
        const lw = wB + wM + gap + 64 * u;
        rrect(ctx, L.W / 2 - lw / 2, ly - 34 * u, lw, 68 * u, 34 * u);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 4 * u;
        ctx.strokeStyle = PINK;
        ctx.stroke();
        const x0 = L.W / 2 - (wB + wM + gap) / 2;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = INK;
        ctx.fillText('BIAS', x0, ly + 2 * u);
        ctx.fillStyle = HOT;
        ctx.fillText('ME', x0 + wB + gap, ly + 2 * u);
        ctx.fill(P(heartD(x0 + wB + gap / 2, ly + 1 * u, 14 * u)));
        infoLine(ctx, info, L.W / 2, ly + 62 * u, 15 * u, '#8f79b8');
        // the rigid sleeve: edge shine, thumb notch, diagonal gloss
        ctx.save();
        rrect(ctx, 0, 0, L.W, L.H, 40 * u);
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 4 * u;
        rrect(ctx, 12 * u, 12 * u, L.W - 24 * u, L.H - 24 * u, 30 * u);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(L.W / 2, 12 * u, 40 * u, 0.1, Math.PI - 0.1);
        ctx.stroke();
        for (const [x, w] of [[0.18, 70], [0.34, 26]]) {
          const gx = L.W * x;
          const g = ctx.createLinearGradient(gx, 0, gx + w * u, 0);
          g.addColorStop(0, 'rgba(255,255,255,0)');
          g.addColorStop(0.5, 'rgba(255,255,255,0.22)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.save();
          ctx.translate(gx, 0);
          ctx.transform(1, 0, -0.35, 1, 0, 0);
          ctx.fillRect(0, 0, w * u, L.H);
          ctx.restore();
        }
        ctx.restore();
      },
    },
  },
];

// ----------------------------------------------------------------- backdrops
// Photoism-style seamless colour paper, painted on canvas.

/** Cache static backdrops per size (they are redrawn every preview frame). */
function cached(draw) {
  const cache = new Map();
  return (ctx, w, h) => {
    const key = `${w}x${h}`;
    let c = cache.get(key);
    if (!c) {
      c = mkCanvas(w, h);
      draw(c.getContext('2d'), w, h);
      cache.set(key, c);
      if (cache.size > 4) cache.delete(cache.keys().next().value);
    }
    ctx.drawImage(c, 0, 0, w, h);
  };
}

function studio(top, mid, floor) {
  return cached((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(0.72, mid);
    g.addColorStop(1, floor);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.hypot(w, h) * 0.55);
    r.addColorStop(0, 'rgba(255,255,255,0.55)');
    r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, w, h);
  });
}

function stageBackdrop(ctx, w, h, t = 0) {
  const u = w / 600;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#170c2c');
  g.addColorStop(1, '#3a1247');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  [[0.15, '#ff5fb0', 0], [0.5, '#b58cff', 2], [0.85, '#5fc8ff', 4]].forEach(([x, col, ph]) => {
    const ox = w * x;
    const a = Math.PI / 2 + Math.sin(t * 0.9 + ph) * 0.35 + (0.5 - x) * 0.6;
    const len = h * 1.3;
    const lg = ctx.createLinearGradient(ox, 0, ox + Math.cos(a) * len, Math.sin(a) * len);
    lg.addColorStop(0, rgba(col, 0.55));
    lg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(ox, -4);
    ctx.lineTo(ox + Math.cos(a - 0.17) * len, Math.sin(a - 0.17) * len);
    ctx.lineTo(ox + Math.cos(a + 0.17) * len, Math.sin(a + 0.17) * len);
    ctx.fill();
  });
  const r = rng(42);
  for (let i = 0; i < 44; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = (4 + r() * 18) * u;
    const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.7);
    ctx.fillStyle = `rgba(${['255,120,190', '190,160,255', '120,210,255'][i % 3]},${(0.05 + tw * 0.2).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

const heartDots = cached((ctx, w, h) => {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ffd3e6');
  g.addColorStop(1, '#ffb7d4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  heartGrid(ctx, w, h, w / 7, 'rgba(255,255,255,0.85)');
});

export const backgrounds = [
  { id: 'white', name: '纯白', swatch: 'linear-gradient(#ffffff, #e9e4ee)', paint: studio('#ffffff', '#f4f2f6', '#e4dfe9') },
  { id: 'sakura', name: '樱花粉', swatch: 'linear-gradient(#ffe6f0, #ffbcd6)', paint: studio('#ffe8f1', '#ffd0e3', '#ffbcd6') },
  { id: 'sky', name: '天空蓝', swatch: 'linear-gradient(#e6f5ff, #b2dbff)', paint: studio('#e8f6ff', '#c9e8ff', '#b2dbff') },
  { id: 'taro', name: '香芋紫', swatch: 'linear-gradient(#f1e9ff, #cfbaff)', paint: studio('#f2eaff', '#decdff', '#cfbaff') },
  {
    id: 'stage',
    name: '舞台灯光',
    swatch: 'radial-gradient(circle at 25% 0, #ff5fb0 0 12%, transparent 45%), radial-gradient(circle at 75% 0, #5fc8ff 0 12%, transparent 45%), linear-gradient(#170c2c, #3a1247)',
    paint: stageBackdrop,
  },
  { id: 'hearts', name: '爱心波点', swatch: 'radial-gradient(circle, #fff 0 3px, transparent 3.5px) 0 0 / 12px 12px, #ffc2dc', paint: heartDots },
];

/** Every Hangul string the frames above draw on canvas (for font preloading). */
export const canvasText = IDOL_SAYS.join('');
