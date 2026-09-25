// Art for FISHEYE CAM (门铃视角鱼眼机): street-style dress-up props,
// doorbell / peephole / security-cam stickers, loud onomatopoeia, and frames
// for three layouts — 2×2 peepholes, one giant peephole, a 1×3 CCTV strip.
// Everything is drawn in code. The lens itself (barrel distortion + round
// peephole mask) is liveFx in index.js, so props drawn on the face bulge with
// it just like real hats and glasses would.
//
// Ids are prefixed `fe-` because rendered art is cached by id across machines.

import { svg, starD, sparkleD, heartD, circleD, rng, speckle } from '../../art/kit.js';
import { rrect, TAU } from '../../core/util.js';
import { gridLayout, stripLayout, slotPath } from '../../engine/compose.js';

const ACID = '#c6ff3d';
const ORANGE = '#ff6a2b';
const INK = '#111111';
const PINK = '#ff4fa3';
const CYAN = '#3de0ff';
const RED = '#ff2d2d';
const NV = '#9dff5c'; // night-vision phosphor green

const F_COMIC = '"Bangers", "ZCOOL KuaiLe", sans-serif';
const F_MARKER = '"Permanent Marker", "ZCOOL KuaiLe", cursive';
const F_MONO = '"VT323", "Noto Sans SC", monospace';
const F_BLOCK = '"Rubik Mono One", "ZCOOL KuaiLe", sans-serif';
const F_CN = '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
const F_HEAVY = '"Noto Sans SC", "ZCOOL KuaiLe", sans-serif';

// Web-font specs for canvas text stickers (the renderer downloads exactly
// these glyphs before drawing — CJK fonts arrive in unicode-range slices).
const fs = (family, text, weight = 400) => ({ fontSpec: { font: `${weight} 100px "${family}"`, text } });

const r2 = (n) => Math.round(n * 100) / 100;

/** Doorbell icon (a bell) centred at (cx, cy); about 1.7·s wide. */
function bellD(cx, cy, s) {
  const P = (x, y) => `${r2(cx + x * s)} ${r2(cy + y * s)}`;
  return (
    `M${P(-0.58, 0.38)} C${P(-0.58, -0.2)} ${P(-0.52, -0.7)} ${P(0, -0.7)} C${P(0.52, -0.7)} ${P(0.58, -0.2)} ${P(0.58, 0.38)} L${P(0.84, 0.6)} L${P(-0.84, 0.6)} Z` +
    circleD(cx, cy + 0.72 * s, 0.17 * s) +
    circleD(cx, cy - 0.74 * s, 0.12 * s)
  );
}

/** Lightning bolt inside a w×h box at (x, y). */
function boltD(x, y, w, h) {
  const P = (u, v) => `${r2(x + u * w)} ${r2(y + v * h)}`;
  return `M${P(0.62, 0)} L${P(0.08, 0.56)} L${P(0.44, 0.56)} L${P(0.3, 1)} L${P(0.92, 0.38)} L${P(0.56, 0.38)} L${P(0.78, 0)}Z`;
}

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js (units = eye distance d; the head
// is ~2.4d wide, skull top ~1.85d above the eyes, chin ~1.75d below).

export const props = [
  {
    id: 'fe-buckethat',
    name: '渔夫帽',
    anchor: 'head',
    w: 3.0,
    origin: [0.5, 0.67],
    svg: svg(240, 132, `
      <path d="M30 92 C33 52 46 14 120 10 C194 14 207 52 210 92 Z" fill="${ACID}" stroke="${INK}" stroke-width="3"/>
      <path d="M120 11 C156 14 172 34 178 90 L208 90 C204 48 188 16 120 11Z" fill="#a4dc22"/>
      <path d="M58 34 C76 20 96 15 116 14" stroke="#fff" stroke-width="6" fill="none" opacity=".4" stroke-linecap="round"/>
      <path d="M31 72 C80 83 160 83 209 72 L210 92 C160 103 80 103 30 92Z" fill="${INK}"/>
      <path d="M30 88 C70 101 170 101 210 88 L238 117 C196 135 44 135 2 117 Z" fill="#b8ef2c" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M22 108 C66 121 174 121 218 108" stroke="#5c8a00" stroke-width="2.5" fill="none" stroke-dasharray="7 5"/>
      <path d="M12 116 C60 131 180 131 228 116" stroke="#5c8a00" stroke-width="2.5" fill="none" stroke-dasharray="7 5"/>
      <path d="M40 104 C70 112 100 114 124 114" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-backcap',
    name: '反戴棒球帽',
    anchor: 'head',
    w: 2.95,
    rot: -0.08,
    origin: [0.5, 0.638],
    svg: svg(240, 150, `
      <path d="M146 36 C174 14 228 10 238 26 C243 38 222 52 166 58 Z" fill="#1553a8" stroke="#0a2450" stroke-width="3" stroke-linejoin="round"/>
      <path fill-rule="evenodd" d="M26 120 C24 62 62 18 120 16 C178 18 216 62 214 120 Z M84 120 C84 92 100 82 120 82 C140 82 156 92 156 120 Z" fill="#2b86ff" stroke="#0a2450" stroke-width="3" stroke-linejoin="round"/>
      <g stroke="#1a62c9" stroke-width="3.5" fill="none" stroke-linecap="round"><path d="M120 20 L120 82"/><path d="M114 20 C84 38 64 78 60 118"/><path d="M126 20 C156 38 176 78 180 118"/></g>
      <path d="M26 112 C44 117 64 120 84 121 L84 131 C62 130 42 127 26 122Z M156 121 C176 120 196 117 214 112 L214 122 C198 127 178 130 156 131Z" fill="#1a62c9" stroke="#0a2450" stroke-width="2.5"/>
      <rect x="80" y="104" width="80" height="13" rx="6" fill="#f4f4f4" stroke="#0a2450" stroke-width="2.5"/>
      <g fill="#0a2450"><circle cx="96" cy="110.5" r="3"/><circle cx="108" cy="110.5" r="3"/><circle cx="120" cy="110.5" r="3"/><circle cx="132" cy="110.5" r="3"/></g>
      <circle cx="120" cy="19" r="8" fill="#1a62c9" stroke="#0a2450" stroke-width="3"/>
      <path d="M56 56 C70 36 92 26 112 24" stroke="#fff" stroke-width="7" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M170 26 C190 18 214 18 226 22" stroke="#fff" stroke-width="4" fill="none" opacity=".3" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-shades',
    name: '超大墨镜',
    anchor: 'eyes',
    w: 2.75,
    origin: [0.5, 0.5],
    svg: svg(280, 112, `
      <path d="M8 34 L0 26 M272 34 L280 26" stroke="#0e0e0e" stroke-width="8" stroke-linecap="round"/>
      <rect x="6" y="10" width="126" height="94" rx="32" fill="#0e0e0e"/>
      <rect x="148" y="10" width="126" height="94" rx="32" fill="#0e0e0e"/>
      <path d="M124 36 Q140 22 156 36" stroke="#0e0e0e" stroke-width="16" fill="none"/>
      <rect x="18" y="21" width="102" height="72" rx="24" fill="url(#lens)"/>
      <rect x="160" y="21" width="102" height="72" rx="24" fill="url(#lens)"/>
      <g stroke="#fff" stroke-linecap="round" fill="none">
        <path d="M34 42 L64 30" stroke-width="7" opacity=".55"/><path d="M32 60 L50 52" stroke-width="5" opacity=".35"/>
        <path d="M176 42 L206 30" stroke-width="7" opacity=".55"/><path d="M174 60 L192 52" stroke-width="5" opacity=".35"/>
      </g>
      <path d="M16 14 L124 14" stroke="#444" stroke-width="4" stroke-linecap="round"/><path d="M156 14 L264 14" stroke="#444" stroke-width="4" stroke-linecap="round"/>`,
    `<linearGradient id="lens" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15151c"/><stop offset=".55" stop-color="#3a1d62"/><stop offset="1" stop-color="${ORANGE}"/></linearGradient>`),
  },
  {
    id: 'fe-chain',
    name: '大金链子',
    anchor: 'neck',
    w: 2.3,
    dy: -0.3,
    origin: [0.5, 0.1],
    svg: svg(200, 124, (() => {
      // chunky links draped in a shallow U, then the medallion
      let s = '';
      const n = 15;
      const depth = 44;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const x = 14 + t * 172;
        const y = 12 + depth * Math.pow(Math.sin(t * Math.PI), 1.15);
        const slope = (depth * 1.15 * Math.pow(Math.sin(t * Math.PI), 0.15) * Math.cos(t * Math.PI) * Math.PI) / 172;
        const a = (Math.atan(slope) * 180) / Math.PI;
        const ry = i % 2 ? 3.6 : 7.2;
        const tr = `transform="rotate(${a.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})"`;
        s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9.6" ry="${ry}" ${tr} fill="none" stroke="#7a560c" stroke-width="7.5"/>`;
        s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9.6" ry="${ry}" ${tr} fill="none" stroke="#f2c94c" stroke-width="4.2"/>`;
      }
      return `${s}
        <path d="M100 56 L100 64" stroke="#7a560c" stroke-width="8" stroke-linecap="round"/>
        <circle cx="100" cy="88" r="27" fill="url(#gold)" stroke="#7a560c" stroke-width="4"/>
        <circle cx="100" cy="88" r="20" fill="none" stroke="#b8871c" stroke-width="2.5"/>
        <path d="${bellD(100, 87, 13.5)}" fill="#8a6414"/>
        <path d="${sparkleD(119, 70, 9)}" fill="#fffbe0"/>`;
    })(), `<radialGradient id="gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff4b0"/><stop offset=".5" stop-color="#e5b62f"/><stop offset="1" stop-color="#9c7212"/></radialGradient>`),
  },
  {
    id: 'fe-gum',
    name: '泡泡糖',
    anchor: 'mouth',
    w: 1.75,
    dy: -0.02,
    origin: [0.5, 0.5],
    svg: svg(160, 150, `
      <circle cx="80" cy="75" r="70" fill="url(#gum)" stroke="#d63a8a" stroke-width="3"/>
      <ellipse cx="54" cy="44" rx="21" ry="12" transform="rotate(-32 54 44)" fill="#fff" opacity=".78"/>
      <circle cx="86" cy="30" r="5" fill="#fff" opacity=".6"/>
      <path d="M112 118 C104 126 94 130 84 131" stroke="#fff" stroke-width="4" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M70 136 C76 131 84 131 90 136" stroke="#c42f7c" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>`,
    `<radialGradient id="gum" cx=".38" cy=".32" r=".78"><stop offset="0" stop-color="#ffd6ec"/><stop offset=".55" stop-color="#ff8cc6"/><stop offset="1" stop-color="#e8479a"/></radialGradient>`),
  },
  {
    id: 'fe-groucho',
    name: '搞怪鼻子眼镜',
    anchor: 'eyes',
    w: 2.2,
    origin: [0.5, 0.333],
    svg: svg(220, 150, `
      <path d="M18 28 C34 6 78 0 102 18 C98 26 88 28 78 24 C60 16 40 20 26 32 Z" fill="#161616"/>
      <path d="M202 28 C186 6 142 0 118 18 C122 26 132 28 142 24 C160 16 180 20 194 32 Z" fill="#161616"/>
      <circle cx="60" cy="50" r="24" fill="#cfe6ff" opacity=".2"/><circle cx="160" cy="50" r="24" fill="#cfe6ff" opacity=".2"/>
      <g fill="none" stroke="#161616" stroke-width="8"><circle cx="60" cy="50" r="28"/><circle cx="160" cy="50" r="28"/><path d="M88 46 Q110 36 132 46"/><path d="M32 46 L8 40"/><path d="M188 46 L212 40"/></g>
      <path d="M46 36 Q54 30 62 30" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>
      <path d="M146 36 Q154 30 162 30" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>
      <path d="M110 42 C100 56 86 88 86 102 C86 120 134 120 134 102 C134 88 120 56 110 42 Z" fill="#f4a987" stroke="#b86a4c" stroke-width="3"/>
      <ellipse cx="102" cy="66" rx="4" ry="11" fill="#fff" opacity=".45"/>
      <ellipse cx="100" cy="110" rx="6" ry="4" fill="#8a4a33"/><ellipse cx="120" cy="110" rx="6" ry="4" fill="#8a4a33"/>
      <path d="M110 114 C94 106 64 106 44 124 C38 130 42 136 50 134 C68 130 88 132 110 124 C132 132 152 130 170 134 C178 136 182 130 176 124 C156 106 126 106 110 114 Z" fill="#161616"/>`),
  },
  {
    id: 'fe-headphones',
    name: '大耳机',
    anchor: 'crown',
    w: 3.2,
    origin: [0.5, 0.222],
    svg: svg(320, 270, `
      <path d="M30 176 C24 40 92 10 160 10 C228 10 296 40 290 176" stroke="#161616" stroke-width="24" fill="none" stroke-linecap="round"/>
      <path d="M36 150 C36 50 96 22 160 22 C224 22 284 50 284 150" stroke="${ACID}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M90 30 C110 22 130 19 150 18" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
      <rect x="20" y="150" width="20" height="30" rx="4" fill="#555"/><rect x="280" y="150" width="20" height="30" rx="4" fill="#555"/>
      <rect x="2" y="162" width="60" height="104" rx="28" fill="#161616"/>
      <rect x="258" y="162" width="60" height="104" rx="28" fill="#161616"/>
      <rect x="11" y="174" width="42" height="80" rx="20" fill="${ACID}"/>
      <rect x="267" y="174" width="42" height="80" rx="20" fill="${ACID}"/>
      <circle cx="32" cy="214" r="11" fill="none" stroke="${ORANGE}" stroke-width="5"/>
      <circle cx="288" cy="214" r="11" fill="none" stroke="${ORANGE}" stroke-width="5"/>
      <path d="M18 196 C20 184 26 178 34 176" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M274 196 C276 184 282 178 290 176" stroke="#fff" stroke-width="4" fill="none" opacity=".45" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-beanie',
    name: '毛线帽',
    anchor: 'head',
    w: 2.7,
    origin: [0.5, 0.713],
    svg: svg(240, 150, `
      <path d="M24 100 C22 50 62 18 120 16 C178 18 218 50 216 100 Z" fill="${ORANGE}" stroke="${INK}" stroke-width="3"/>
      <g stroke="#d9531e" stroke-width="4" fill="none" stroke-linecap="round">
        ${[-4, -3, -2, -1, 0, 1, 2, 3, 4].map((k) => `<path d="M${120 + k * 22} 98 Q${120 + k * 17} 56 ${120 + k * 6} 24"/>`).join('')}
      </g>
      <path d="M60 46 C76 30 96 24 114 22" stroke="#fff" stroke-width="6" fill="none" opacity=".3" stroke-linecap="round"/>
      <path d="M16 90 C80 107 160 107 224 90 L226 132 C160 148 80 148 14 132 Z" fill="#ff8048" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <g stroke="#dc5a22" stroke-width="3.5" stroke-linecap="round">
        ${Array.from({ length: 20 }, (_, i) => {
          const x = 22 + i * 10.4;
          const t = (x - 120) / 104;
          const y0 = 104 - t * t * 10;
          return `<path d="M${x.toFixed(1)} ${(y0 + 4).toFixed(1)} L${x.toFixed(1)} ${(y0 + 34).toFixed(1)}"/>`;
        }).join('')}
      </g>
      <rect x="96" y="106" width="48" height="28" rx="4" fill="${INK}"/>
      <circle cx="120" cy="120" r="9" fill="none" stroke="${ACID}" stroke-width="3"/>
      <circle cx="116.5" cy="117.5" r="1.8" fill="${ACID}"/><circle cx="123.5" cy="117.5" r="1.8" fill="${ACID}"/>
      <path d="M115 122 Q120 127 125 122" stroke="${ACID}" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-bandana',
    name: '街头头巾',
    anchor: 'forehead',
    w: 3.0,
    dy: -0.12,
    origin: [0.5, 0.46],
    svg: svg(300, 120, `
      <path d="M270 58 C290 42 296 30 298 14 L286 22 C284 36 278 46 266 52 Z" fill="#d7263d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M272 68 C290 84 296 98 296 114 L284 104 C282 92 276 82 264 72 Z" fill="#c21f34" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M30 44 C100 26 200 26 262 44 L258 82 C200 66 100 66 34 82 Z" fill="#d7263d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M38 52 C102 36 198 36 256 52" stroke="#fff" stroke-width="2.5" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>
      <path d="M40 74 C102 59 198 59 254 74" stroke="#fff" stroke-width="2.5" fill="none" stroke-dasharray="2 6" stroke-linecap="round"/>
      <g fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
        ${Array.from({ length: 9 }, (_, i) => {
          const x = 56 + i * 23;
          const y = 58 - Math.sin(((i + 0.5) / 9) * Math.PI) * 5;
          return i % 2
            ? `<path d="M${x} ${y + 5} c-7 -2 -7 -12 0 -12 c6 0 7 7 2 9"/>`
            : `<circle cx="${x}" cy="${y}" r="3.2" fill="#fff" stroke="none"/><circle cx="${x + 8}" cy="${y + 4}" r="1.8" fill="#fff" stroke="none"/>`;
        }).join('')}
      </g>
      <ellipse cx="266" cy="62" rx="14" ry="12" fill="#b81d31" stroke="${INK}" stroke-width="3"/>
      <path d="M258 58 C262 54 268 54 272 57" stroke="#fff" stroke-width="2" fill="none" opacity=".6"/>`),
  },
  {
    id: 'fe-clownnose',
    name: '小丑红鼻子',
    anchor: 'nose',
    w: 0.8,
    origin: [0.5, 0.6],
    svg: svg(100, 100, `
      <circle cx="50" cy="50" r="46" fill="url(#nose)" stroke="#8a0a12" stroke-width="2"/>
      <ellipse cx="35" cy="31" rx="14" ry="8" transform="rotate(-35 35 31)" fill="#fff" opacity=".82"/>
      <circle cx="64" cy="70" r="5" fill="#fff" opacity=".25"/>`,
    `<radialGradient id="nose" cx=".36" cy=".3" r=".8"><stop offset="0" stop-color="#ff8f85"/><stop offset=".5" stop-color="#ff2d2d"/><stop offset="1" stop-color="#a50d14"/></radialGradient>`),
  },
];

// ----------------------------------------------------------------- canvas helpers

/**
 * Comic lettering: optional 3D extrusion, fat outline, optional inner
 * outline, then the fill — centred at (x, y).
 */
function comic(ctx, text, x, y, size, o = {}) {
  const { font = F_COMIC, weight = 400, fill = ACID, stroke = INK, sw = 0.2, inner, innerW = 0.07, depth = 0, depthColor = INK, rot = 0, skew = 0, spacing = 0, maxW } = o;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  if (skew) ctx.transform(1, 0, skew, 1, 0, 0);
  ctx.font = `${weight} ${size}px ${font}`;
  if (spacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${spacing * size}px`;
  if (maxW) {
    const tw = ctx.measureText(text).width;
    if (tw > maxW) {
      size *= maxW / tw;
      ctx.font = `${weight} ${size}px ${font}`;
    }
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  for (let k = depth; k > 0; k--) {
    const d = k * size * 0.014;
    ctx.fillStyle = depthColor;
    ctx.strokeStyle = depthColor;
    ctx.lineWidth = size * sw;
    ctx.strokeText(text, d, d);
    ctx.fillText(text, d, d);
  }
  if (stroke) {
    ctx.lineWidth = size * sw;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, 0, 0);
  }
  if (inner) {
    ctx.lineWidth = size * innerW;
    ctx.strokeStyle = inner;
    ctx.strokeText(text, 0, 0);
  }
  ctx.fillStyle = fill;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Plain text with a hard drop shadow (HUD / labels). */
function label(ctx, text, x, y, size, { font = F_MONO, color = '#fff', shadow = 'rgba(0,0,0,0.85)', align = 'left', base = 'middle', glow, weight = 400, maxW } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px ${font}`;
  if (maxW) {
    const tw = ctx.measureText(text).width;
    if (tw > maxW) {
      size *= maxW / tw;
      ctx.font = `${weight} ${size}px ${font}`;
    }
  }
  ctx.textAlign = align;
  ctx.textBaseline = base;
  if (shadow) {
    ctx.fillStyle = shadow;
    ctx.fillText(text, x + size * 0.06, y + size * 0.07);
  }
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = size * 0.5;
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Star-burst path with separate x/y radii. */
function burstPath(cx, cy, rx, ry, n = 14, inner = 0.76, jitter = 0.14, seed = 1) {
  const r = rng(seed);
  const p = new Path2D();
  for (let i = 0; i < n * 2; i++) {
    const k = (i % 2 ? inner : 1) * (1 - jitter / 2 + r() * jitter);
    const a = (i / (n * 2)) * TAU - Math.PI / 2;
    const x = cx + Math.cos(a) * rx * k;
    const y = cy + Math.sin(a) * ry * k;
    if (i) p.lineTo(x, y);
    else p.moveTo(x, y);
  }
  p.closePath();
  return p;
}

/** Wobbly blob (splash / bubble) path. */
function blobPath(cx, cy, r, { n = 9, amp = 0.14, seed = 3, pts = 64 } = {}) {
  const rr = rng(seed);
  const ph = [rr() * TAU, rr() * TAU];
  const p = new Path2D();
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * TAU;
    const k = 1 + amp * Math.sin(a * n + ph[0]) + amp * 0.4 * Math.sin(a * (n + 3) + ph[1]);
    const x = cx + Math.cos(a) * r * k;
    const y = cy + Math.sin(a) * r * k;
    if (i) p.lineTo(x, y);
    else p.moveTo(x, y);
  }
  p.closePath();
  return p;
}

/** Speech bubble (rounded box + tail) as a Path2D. */
function bubblePath(x, y, w, h, r, tail) {
  const p = new Path2D();
  const [tx, ty, tw] = tail; // tail tip + base width, base centred at tx on the bottom edge
  const bx = Math.min(Math.max(tx, x + r + tw), x + w - r - tw);
  p.moveTo(x + r, y);
  p.arcTo(x + w, y, x + w, y + h, r);
  p.arcTo(x + w, y + h, x, y + h, r);
  p.lineTo(bx + tw, y + h);
  p.lineTo(tx, ty);
  p.lineTo(bx - tw * 0.2, y + h);
  p.arcTo(x, y + h, x, y, r);
  p.arcTo(x, y, x + w, y, r);
  p.closePath();
  return p;
}

/** Spray-paint speckle around a filled path (deterministic). */
function sprayDust(ctx, cx, cy, spread, n, color, seed, size = 1) {
  const r = rng(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const a = r() * TAU;
    const d = Math.pow(r(), 0.7) * spread;
    ctx.globalAlpha = 0.25 + r() * 0.6;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, (0.4 + r() * 1.2) * size, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** Security-cam timecode; each "camera" / slot is a few seconds apart. */
function timecode(date, addSec = 0, style = 'iso') {
  const d = new Date(+(date || new Date()) + addSec * 1000);
  const day = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return style === 'time' ? time : style === 'day' ? day : `${day} ${time}`;
}

const serialNo = (info) => `No.${String(info.serial || 0).padStart(6, '0')}`;

// ----------------------------------------------------------------- stickers

/** Canvas sticker helper (keeps the definitions short). */
const cs = (id, name, group, size, ratio, draw, extra = {}) => ({ id, name, group, size, ratio, draw, outline: 0.035, ...extra });

export const stickers = [
  // ---------- 拟声 (onomatopoeia)
  cs('fe-dingdong', 'DING DONG!', '拟声', 0.4, 0.8, (ctx, w, h) => {
    const p = burstPath(w / 2, h / 2, w * 0.48, h * 0.47, 15, 0.8, 0.16, 5);
    ctx.lineJoin = 'round';
    ctx.fillStyle = ACID;
    ctx.fill(p);
    ctx.lineWidth = w * 0.028;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    comic(ctx, 'DING', w * 0.47, h * 0.37, h * 0.3, { fill: INK, stroke: '#fff', sw: 0.18, rot: -0.12, maxW: w * 0.62 });
    comic(ctx, 'DONG!', w * 0.53, h * 0.64, h * 0.32, { fill: ORANGE, stroke: INK, sw: 0.2, rot: -0.12, maxW: w * 0.68 });
  }, fs('Bangers', 'DING DONG!')),
  cs('fe-dingdong-cn', '叮咚！', '拟声', 0.34, 0.58, (ctx, w, h) => {
    comic(ctx, '叮咚!', w * 0.47, h * 0.56, h * 0.66, { font: F_CN, fill: ACID, stroke: INK, sw: 0.16, depth: 6, rot: -0.07, maxW: w * 0.84 });
    ctx.strokeStyle = INK;
    ctx.lineWidth = w * 0.022;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const a = -0.9 + i * 0.42;
      ctx.beginPath();
      ctx.moveTo(w * 0.9 + Math.cos(a) * w * 0.02, h * 0.2 + Math.sin(a) * w * 0.02);
      ctx.lineTo(w * 0.9 + Math.cos(a) * w * 0.085, h * 0.2 + Math.sin(a) * w * 0.085);
      ctx.stroke();
    }
  }, fs('ZCOOL KuaiLe', '叮咚!')),
  cs('fe-boom', 'BOOM!', '拟声', 0.36, 0.82, (ctx, w, h) => {
    const outer = burstPath(w / 2, h / 2, w * 0.49, h * 0.48, 13, 0.66, 0.24, 9);
    const inner = burstPath(w / 2, h / 2, w * 0.36, h * 0.34, 11, 0.72, 0.2, 4);
    ctx.lineJoin = 'round';
    ctx.fillStyle = ORANGE;
    ctx.fill(outer);
    ctx.lineWidth = w * 0.026;
    ctx.strokeStyle = INK;
    ctx.stroke(outer);
    ctx.fillStyle = '#ffd83d';
    ctx.fill(inner);
    comic(ctx, 'BOOM!', w * 0.5, h * 0.53, h * 0.34, { fill: '#fff', stroke: INK, sw: 0.2, depth: 4, rot: -0.1, maxW: w * 0.74 });
  }, fs('Bangers', 'BOOM!')),
  cs('fe-wow', 'WOW!', '拟声', 0.34, 0.52, (ctx, w, h) => {
    comic(ctx, 'WOW!', w * 0.48, h * 0.56, h * 0.74, { fill: PINK, stroke: INK, sw: 0.14, inner: '#fff', innerW: 0.04, depth: 5, rot: -0.08, maxW: w * 0.84 });
    ctx.fillStyle = ACID;
    ctx.strokeStyle = INK;
    ctx.lineWidth = w * 0.012;
    for (const [x, y, r] of [[0.9, 0.16, 0.07], [0.08, 0.2, 0.05], [0.93, 0.8, 0.045]]) {
      const p = new Path2D(sparkleD(w * x, h * y, w * r));
      ctx.fill(p);
      ctx.stroke(p);
    }
  }, fs('Bangers', 'WOW!')),
  cs('fe-wasai', '哇塞！', '拟声', 0.34, 0.56, (ctx, w, h) => {
    comic(ctx, '哇塞!', w * 0.5, h * 0.54, h * 0.62, { font: F_HEAVY, weight: 900, fill: ORANGE, stroke: INK, sw: 0.14, inner: '#ffe0cf', innerW: 0.035, depth: 6, skew: -0.14, rot: -0.05, maxW: w * 0.86 });
  }, fs('Noto Sans SC', '哇塞!', 900)),
  cs('fe-pu', '噗！', '拟声', 0.3, 0.9, (ctx, w, h) => {
    const p = blobPath(w * 0.5, h * 0.5, w * 0.38, { n: 7, amp: 0.13, seed: 12 });
    ctx.lineJoin = 'round';
    ctx.fillStyle = CYAN;
    ctx.fill(p);
    ctx.lineWidth = w * 0.025;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    ctx.fillStyle = '#fff';
    for (const [x, y, r] of [[0.86, 0.14, 0.045], [0.93, 0.3, 0.028], [0.1, 0.86, 0.04], [0.2, 0.95, 0.022], [0.9, 0.9, 0.03]]) {
      ctx.beginPath();
      ctx.arc(w * x, h * y, w * r, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.ellipse(w * 0.34, h * 0.3, w * 0.08, w * 0.04, -0.6, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 1;
    comic(ctx, '噗!', w * 0.52, h * 0.53, h * 0.44, { font: F_HEAVY, weight: 900, fill: '#fff', stroke: INK, sw: 0.16, depth: 4, rot: 0.08, maxW: w * 0.66 });
  }, fs('Noto Sans SC', '噗!', 900)),
  cs('fe-omg', 'OMG', '拟声', 0.36, 0.5, (ctx, w, h) => {
    const cols = [ACID, ORANGE, PINK];
    const rots = [-0.14, 0.08, -0.05];
    const box = h * 0.66;
    'OMG'.split('').forEach((ch, i) => {
      const cx = w * (0.19 + i * 0.29);
      const cy = h * (0.5 + (i === 1 ? -0.06 : 0.04));
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rots[i]);
      rrect(ctx, -box / 2, -box / 2, box, box, box * 0.14);
      ctx.fillStyle = cols[i];
      ctx.fill();
      ctx.lineWidth = w * 0.018;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.restore();
      comic(ctx, ch, cx, cy + box * 0.04, box * 0.82, { fill: INK, stroke: null, rot: rots[i] });
    });
    comic(ctx, '!!', w * 0.95, h * 0.2, h * 0.34, { fill: '#fff', stroke: INK, sw: 0.22, rot: 0.2 });
  }, fs('Bangers', 'OMG!')),
  cs('fe-haha', '哈哈哈', '拟声', 0.36, 0.5, (ctx, w, h) => {
    const cols = [ACID, '#fff', ORANGE];
    for (let i = 0; i < 3; i++) {
      comic(ctx, '哈', w * (0.18 + i * 0.32), h * (0.56 + (i % 2 ? -0.1 : 0.06)), h * 0.62, { font: F_HEAVY, weight: 900, fill: cols[i], stroke: INK, sw: 0.16, depth: 4, rot: (i - 1) * 0.16 });
    }
  }, fs('Noto Sans SC', '哈', 900)),
  cs('fe-bighead', 'BIG HEAD', '拟声', 0.42, 0.3, (ctx, w, h) => {
    // black tape with torn ends
    const r = rng(21);
    const p = new Path2D();
    const n = 7;
    p.moveTo(w * 0.04, h * 0.1);
    p.lineTo(w * 0.96, h * 0.1);
    for (let i = 1; i <= n; i++) p.lineTo(w * (i % 2 ? 0.93 + r() * 0.03 : 0.97), h * (0.1 + (0.8 * i) / n));
    p.lineTo(w * 0.04, h * 0.9);
    for (let i = n - 1; i >= 0; i--) p.lineTo(w * (i % 2 ? 0.07 - r() * 0.03 : 0.03), h * (0.1 + (0.8 * i) / n));
    p.closePath();
    ctx.fillStyle = INK;
    ctx.fill(p);
    comic(ctx, 'BIG HEAD', w * 0.5, h * 0.54, h * 0.46, { font: F_BLOCK, fill: ACID, stroke: null, spacing: 0.04, maxW: w * 0.8 });
    ctx.fillStyle = ORANGE;
    ctx.fillRect(w * 0.04, h * 0.1, w * 0.92, h * 0.06);
    ctx.fillRect(w * 0.04, h * 0.84, w * 0.92, h * 0.06);
  }, fs('Rubik Mono One', 'BIG HEAD')),

  // ---------- 门铃 (doorbell / peephole / security cam)
  {
    id: 'fe-bell-btn',
    name: '门铃按钮',
    group: '门铃',
    size: 0.22,
    outline: 0.05,
    svg: svg(120, 184, `
      <rect x="4" y="4" width="112" height="176" rx="28" fill="#0c0c0c"/>
      <rect x="10" y="10" width="100" height="164" rx="23" fill="url(#body)"/>
      <circle cx="60" cy="50" r="27" fill="#050505" stroke="#3a3a3a" stroke-width="4"/>
      <circle cx="60" cy="50" r="15" fill="url(#glass)"/>
      <circle cx="54" cy="44" r="4.5" fill="#fff" opacity=".85"/>
      <circle cx="90" cy="26" r="4" fill="${RED}"/><circle cx="90" cy="26" r="7" fill="${RED}" opacity=".3"/>
      <g stroke="#3a3a3a" stroke-width="3.5" stroke-linecap="round"><path d="M42 90 L78 90"/><path d="M46 99 L74 99"/></g>
      <circle cx="60" cy="140" r="30" fill="${ACID}" opacity=".35"/>
      <circle cx="60" cy="140" r="26" fill="${ACID}"/>
      <circle cx="60" cy="140" r="20" fill="#1a1a1a"/>
      <path d="${bellD(60, 139, 11)}" fill="#fff"/>
      <path d="M26 28 C30 20 36 16 44 14" stroke="#fff" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>`,
    `<linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e2e2e"/><stop offset="1" stop-color="#121212"/></linearGradient>
     <radialGradient id="glass" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#3a5a7a"/><stop offset="1" stop-color="#0a1420"/></radialGradient>`),
  },
  {
    id: 'fe-peep-ring',
    name: '猫眼圈',
    group: '门铃',
    size: 0.3,
    svg: svg(160, 160, `
      <path fill-rule="evenodd" d="${circleD(80, 80, 77)}${circleD(80, 80, 50)}" fill="url(#brass)" stroke="#5a3d0a" stroke-width="3"/>
      <circle cx="80" cy="80" r="64" fill="none" stroke="#fff6cf" stroke-width="2" opacity=".55"/>
      <circle cx="80" cy="80" r="52" fill="none" stroke="#3b2805" stroke-width="5" opacity=".7"/>
      <circle cx="80" cy="80" r="48" fill="#bfe9ff" opacity=".12"/>
      <path d="M50 66 A 33 33 0 0 1 74 47" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".75"/>
      <path d="M104 110 A 33 33 0 0 1 96 116" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".4"/>
      <g fill="#6b4a10">${[45, 135, 225, 315].map((a) => {
        const x = 80 + Math.cos((a * Math.PI) / 180) * 64;
        const y = 80 + Math.sin((a * Math.PI) / 180) * 64;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/><path d="M${(x - 3).toFixed(1)} ${y.toFixed(1)} L${(x + 3).toFixed(1)} ${y.toFixed(1)}" stroke="#e9c35a" stroke-width="1.5"/>`;
      }).join('')}</g>`,
    `<linearGradient id="brass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b0"/><stop offset=".35" stop-color="#d9a93a"/><stop offset=".7" stop-color="#8a5f14"/><stop offset="1" stop-color="#e9c35a"/></linearGradient>`),
  },
  cs('fe-rec', 'REC 录制中', '门铃', 0.24, 0.42, (ctx, w, h) => {
    rrect(ctx, w * 0.03, h * 0.08, w * 0.94, h * 0.84, h * 0.42);
    ctx.fillStyle = INK;
    ctx.fill();
    ctx.lineWidth = h * 0.06;
    ctx.strokeStyle = '#fff';
    ctx.stroke();
    ctx.save();
    ctx.shadowColor = RED;
    ctx.shadowBlur = h * 0.2;
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(w * 0.24, h * 0.5, h * 0.2, 0, TAU);
    ctx.fill();
    ctx.restore();
    label(ctx, 'REC', w * 0.62, h * 0.52, h * 0.62, { color: '#fff', shadow: null, align: 'center' });
  }, { outline: 0, ...fs('VT323', 'REC') }),
  cs('fe-timecode', '时间码', '门铃', 0.42, 0.3, (ctx, w, h) => {
    const d = new Date();
    rrect(ctx, 0, 0, w, h, h * 0.1);
    ctx.fillStyle = 'rgba(8,10,8,0.72)';
    ctx.fill();
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(w * 0.06, h * 0.3, h * 0.09, 0, TAU);
    ctx.fill();
    label(ctx, 'REC  CAM-01', w * 0.11, h * 0.31, h * 0.34, { color: '#fff', maxW: w * 0.84 });
    label(ctx, timecode(d), w * 0.05, h * 0.7, h * 0.34, { color: NV, maxW: w * 0.9 });
  }, { outline: 0, ...fs('VT323', 'REC CAM-01 0123456789-:') }),
  cs('fe-whos', "WHO'S THERE?", '门铃', 0.36, 0.74, (ctx, w, h) => {
    const p = bubblePath(w * 0.04, h * 0.05, w * 0.92, h * 0.7, h * 0.3, [w * 0.24, h * 0.96, w * 0.07]);
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fff';
    ctx.fill(p);
    ctx.lineWidth = w * 0.028;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    comic(ctx, "WHO'S", w * 0.5, h * 0.25, h * 0.27, { fill: INK, stroke: null, maxW: w * 0.66 });
    comic(ctx, 'THERE?', w * 0.5, h * 0.52, h * 0.3, { fill: ORANGE, stroke: INK, sw: 0.14, maxW: w * 0.7 });
  }, fs('Bangers', "WHO'S THERE?")),
  cs('fe-sheiya', '谁呀？', '门铃', 0.3, 0.7, (ctx, w, h) => {
    const p = bubblePath(w * 0.05, h * 0.05, w * 0.9, h * 0.68, h * 0.18, [w * 0.78, h * 0.96, w * 0.07]);
    ctx.lineJoin = 'round';
    ctx.fillStyle = ACID;
    ctx.fill(p);
    ctx.lineWidth = w * 0.03;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    comic(ctx, '谁呀？', w * 0.5, h * 0.4, h * 0.42, { font: F_CN, fill: INK, stroke: INK, sw: 0.05, maxW: w * 0.8 });
  }, fs('ZCOOL KuaiLe', '谁呀？')),
  cs('fe-knock', 'KNOCK KNOCK', '门铃', 0.36, 0.62, (ctx, w, h) => {
    // a little wooden door sign
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-0.06);
    rrect(ctx, -w * 0.46, -h * 0.4, w * 0.92, h * 0.8, h * 0.1);
    ctx.fillStyle = '#9a6734';
    ctx.fill();
    ctx.lineWidth = w * 0.02;
    ctx.strokeStyle = '#3d2410';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,30,10,0.35)';
    ctx.lineWidth = w * 0.006;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(-w * 0.44, -h * 0.3 + i * h * 0.12);
      ctx.bezierCurveTo(-w * 0.1, -h * 0.34 + i * h * 0.12, w * 0.1, -h * 0.26 + i * h * 0.12, w * 0.44, -h * 0.31 + i * h * 0.12);
      ctx.stroke();
    }
    ctx.restore();
    comic(ctx, 'KNOCK', w * 0.5, h * 0.33, h * 0.3, { fill: '#fff', stroke: INK, sw: 0.18, rot: -0.06, maxW: w * 0.8 });
    comic(ctx, 'KNOCK!', w * 0.52, h * 0.65, h * 0.3, { fill: ACID, stroke: INK, sw: 0.18, rot: -0.06, maxW: w * 0.8 });
  }, fs('Bangers', 'KNOCK!')),
  {
    id: 'fe-cctv',
    name: '监控摄像头',
    group: '门铃',
    size: 0.32,
    outline: 0.045,
    svg: svg(210, 140, `
      <rect x="180" y="16" width="26" height="70" rx="6" fill="#bfc5cc" stroke="${INK}" stroke-width="4"/>
      <path d="M182 50 L150 54 L146 76" stroke="${INK}" stroke-width="12" fill="none" stroke-linejoin="round"/>
      <path d="M182 50 L150 54 L146 76" stroke="#8e969f" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <path d="M28 44 L154 26 L164 70 L38 92 Z" fill="#f2f4f6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M20 36 L160 16 L166 30 L26 52 Z" fill="#d7dce1" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 88 L164 68 L166 74 L40 96Z" fill="#aab2ba"/>
      <ellipse cx="30" cy="68" rx="15" ry="22" transform="rotate(-10 30 68)" fill="#1a1a1a" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="28" cy="68" rx="8" ry="13" transform="rotate(-10 28 68)" fill="#2d4a66"/>
      <circle cx="25" cy="62" r="3.5" fill="#fff" opacity=".85"/>
      <circle cx="60" cy="74" r="5" fill="${RED}"/>
      <g stroke="#9aa3ad" stroke-width="3" stroke-linecap="round"><path d="M80 52 L140 43"/><path d="M82 62 L142 53"/></g>`),
  },

  // ---------- 涂鸦 (street doodles)
  {
    id: 'fe-bolt',
    name: '闪电',
    group: '涂鸦',
    size: 0.2,
    outline: 0.06,
    svg: svg(100, 160, `<path d="${boltD(6, 4, 88, 152)}" fill="${ACID}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M58 16 L30 72" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`),
  },
  {
    id: 'fe-flame',
    name: '火焰',
    group: '涂鸦',
    size: 0.22,
    outline: 0.05,
    svg: svg(120, 160, `
      <path d="M60 4 C64 30 92 44 100 74 C104 58 100 48 96 40 C114 58 120 86 112 110 C104 138 84 156 60 156 C32 156 10 136 8 108 C6 84 20 66 26 50 C30 62 34 70 42 74 C38 50 46 24 60 4Z" fill="${ORANGE}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M62 50 C68 70 88 82 88 108 C88 128 76 142 60 142 C44 142 30 130 30 112 C30 96 40 86 44 76 C48 88 54 92 58 94 C54 78 56 64 62 50Z" fill="#ffd23d"/>
      <path d="M60 98 C66 108 74 114 74 126 C74 134 68 140 60 140 C52 140 46 134 46 126 C46 116 54 110 60 98Z" fill="#fff6c8"/>`),
  },
  cs('fe-spraystars', '喷漆星星', '涂鸦', 0.3, 0.8, (ctx, w, h) => {
    const stars = [
      [0.34, 0.42, 0.26, '#fff', 3],
      [0.78, 0.26, 0.14, ACID, 7],
      [0.72, 0.76, 0.12, '#fff', 11],
    ];
    for (const [x, y, r, c, seed] of stars) {
      const cx = w * x;
      const cy = h * y;
      const R = w * r;
      const rot = -90 + seed * 3;
      // soft black overspray outline, then the colour coat + dust
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = R * 0.22;
      ctx.fillStyle = 'rgba(17,17,17,0.92)';
      ctx.fill(new Path2D(starD(cx, cy, R * 1.16, 5, 0.5, rot)));
      ctx.restore();
      sprayDust(ctx, cx, cy, R * 1.3, 90, INK, seed + 50, w / 170);
      ctx.fillStyle = c;
      ctx.fill(new Path2D(starD(cx, cy, R, 5, 0.48, rot)));
      sprayDust(ctx, cx, cy, R * 1.1, 110, c, seed, w / 180);
    }
  }, { outline: 0 }),
  {
    id: 'fe-smiley',
    name: '滴漆笑脸',
    group: '涂鸦',
    size: 0.24,
    outline: 0.045,
    svg: svg(140, 172, `
      <path d="M40 112 L40 150 C40 160 52 160 52 150 L52 118 Z M86 118 L86 164 C86 174 98 174 98 164 L98 110Z M64 126 L64 138 C64 146 74 146 74 138 L74 128Z" fill="${ACID}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="70" cy="68" r="60" fill="${ACID}" stroke="${INK}" stroke-width="6"/>
      <path d="M40 114 L40 128 M52 118 L52 126 M86 118 L86 130 M98 110 L98 122 M64 126 L64 130 M74 128 L74 132" stroke="${ACID}" stroke-width="7"/>
      <path d="M42 44 L58 60 M58 44 L42 60" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      <ellipse cx="94" cy="52" rx="7" ry="10" fill="${INK}"/>
      <path d="M34 78 C44 108 96 108 106 78" stroke="${INK}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M100 84 L110 72" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <path d="M28 46 C34 30 46 20 60 16" stroke="#fff" stroke-width="6" fill="none" opacity=".5" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-eyes',
    name: '大眼睛',
    group: '涂鸦',
    size: 0.26,
    outline: 0.05,
    svg: svg(190, 104, `
      <circle cx="50" cy="52" r="46" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <circle cx="140" cy="52" r="46" fill="#fff" stroke="${INK}" stroke-width="6"/>
      <circle cx="66" cy="62" r="21" fill="${INK}"/><circle cx="156" cy="62" r="21" fill="${INK}"/>
      <circle cx="73" cy="55" r="6" fill="#fff"/><circle cx="163" cy="55" r="6" fill="#fff"/>
      <path d="M22 34 C28 22 38 16 48 14" stroke="#e9eef2" stroke-width="5" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'fe-arrow',
    name: '箭头',
    group: '涂鸦',
    size: 0.28,
    svg: svg(200, 130, `
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 30 C60 6 116 22 132 64 C140 84 146 96 158 104" stroke="${INK}" stroke-width="24"/>
        <path d="M128 110 L166 110 L164 74" stroke="${INK}" stroke-width="24"/>
        <path d="M14 30 C60 6 116 22 132 64 C140 84 146 96 158 104" stroke="${ORANGE}" stroke-width="12"/>
        <path d="M128 110 L166 110 L164 74" stroke="${ORANGE}" stroke-width="12"/>
      </g>`),
    outline: 0.035,
  },
  {
    id: 'fe-crown',
    name: '街头皇冠',
    group: '涂鸦',
    size: 0.26,
    outline: 0.05,
    svg: svg(150, 112, `
      <path d="M14 96 L10 30 L46 58 L75 14 L104 58 L140 30 L136 96 Z" fill="${ORANGE}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
      <path d="M16 82 L134 82" stroke="${INK}" stroke-width="6"/>
      <g fill="${ACID}" stroke="${INK}" stroke-width="5"><circle cx="10" cy="26" r="9"/><circle cx="75" cy="11" r="9"/><circle cx="140" cy="26" r="9"/></g>
      <path d="M26 70 L34 50 M60 66 L70 40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`),
  },
  {
    id: 'fe-skate',
    name: '滑板',
    group: '涂鸦',
    size: 0.34,
    outline: 0.04,
    svg: svg(240, 110, `
      <g transform="rotate(-12 120 55)">
        <path d="M40 70 L60 86 L64 86 M176 70 L172 86 L176 86" stroke="#8e969f" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="56" cy="92" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="84" cy="92" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/>
        <circle cx="156" cy="92" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="184" cy="92" r="12" fill="#fff" stroke="${INK}" stroke-width="5"/>
        <rect x="46" y="72" width="48" height="10" rx="4" fill="#8e969f" stroke="${INK}" stroke-width="4"/>
        <rect x="146" y="72" width="48" height="10" rx="4" fill="#8e969f" stroke="${INK}" stroke-width="4"/>
        <path d="M24 46 C10 46 6 58 12 66 C16 72 22 72 30 72 L210 72 C218 72 224 72 228 66 C234 58 230 46 216 46 Z" fill="${ACID}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
        <path d="M60 46 L78 72 M110 46 L128 72 M160 46 L178 72" stroke="${ORANGE}" stroke-width="10"/>
        <path d="M24 46 L216 46" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
      </g>`),
  },
  {
    id: 'fe-spraycan',
    name: '喷漆罐',
    group: '涂鸦',
    size: 0.2,
    outline: 0.05,
    svg: svg(120, 190, `
      <g fill="${PINK}" opacity=".9"><circle cx="90" cy="18" r="4"/><circle cx="102" cy="10" r="3"/><circle cx="104" cy="26" r="3.5"/><circle cx="114" cy="16" r="2.5"/><circle cx="96" cy="32" r="2"/></g>
      <rect x="54" y="30" width="18" height="16" rx="3" fill="#ddd" stroke="${INK}" stroke-width="4"/>
      <path d="M70 36 L80 32" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
      <path d="M30 70 C30 54 44 44 63 44 C82 44 96 54 96 70 Z" fill="${PINK}" stroke="${INK}" stroke-width="5"/>
      <rect x="28" y="68" width="70" height="114" rx="10" fill="#f4f4f4" stroke="${INK}" stroke-width="5"/>
      <rect x="30" y="96" width="66" height="50" fill="${INK}"/>
      <path d="${boltD(48, 100, 30, 42)}" fill="${ACID}"/>
      <path d="M40 146 L40 164 C40 170 48 170 48 164 L48 146 M70 146 L70 158 C70 164 78 164 78 158 L78 146" fill="${INK}"/>
      <path d="M38 76 L38 90 M38 150 L38 172" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>`),
  },
  {
    id: 'fe-dripheart',
    name: '滴漆爱心',
    group: '涂鸦',
    size: 0.24,
    outline: 0.045,
    svg: svg(140, 170, `
      <path d="M42 96 L42 136 C42 146 54 146 54 136 L54 104 Z M84 104 L84 156 C84 166 96 166 96 156 L96 96 Z M64 112 L64 122 C64 128 72 128 72 122 L72 112Z" fill="${PINK}" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="${heartD(70, 64, 46)}" fill="${PINK}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M44 100 L44 112 M52 106 L52 112 M86 106 L86 116 M94 98 L94 110 M66 112 L66 116" stroke="${PINK}" stroke-width="7"/>
      <path d="M34 44 C40 32 50 26 60 28" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".6"/>`),
  },
];

// ----------------------------------------------------------------- layouts

export const layouts = [
  {
    ...gridLayout({ id: 'circles', name: '四连猫眼', cols: 2, rows: 2, W: 1200, H: 1800, pad: 60, gap: 56, top: 250, bottom: 380, aspect: 1, shape: 'circle' }),
    desc: '2×2 圆形取景 · 4×6 相纸 · 6 张里挑 4 张',
  },
  {
    id: 'peephole',
    name: '超大猫眼',
    desc: '一张巨型鱼眼大头 · 4×5 相纸 · 6 张里挑 1 张',
    size: [1200, 1500],
    photos: 1,
    slots: [{ x: 160, y: 240, w: 880, h: 880, shape: 'circle' }],
    footer: { y: 1160, h: 340 },
  },
  {
    ...stripLayout({ id: 'cctv', name: '监控三连', n: 3, W: 600, H: 1800, side: 34, top: 170, gap: 34, bottom: 300, aspect: 4 / 3, shape: 'rect' }),
    desc: '三格监控画面竖条 · 一式两条 · 6 张里挑 3 张',
    sheet: 'strip-pair',
  },
];

// ----------------------------------------------------------------- frame helpers

/** Header / footer bands around the photos. */
function zones(L) {
  const top = Math.min(...L.slots.map((s) => s.y));
  const bottom = Math.max(...L.slots.map((s) => s.y + s.h));
  return { top, bottom };
}

const center = (s) => ({ cx: s.x + s.w / 2, cy: s.y + s.h / 2, R: s.w / 2 });

/** Stroke a circle concentric with a round slot (radius R + off). */
function ring(ctx, s, off, lw, style) {
  const { cx, cy, R } = center(s);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(1, R + off), 0, TAU);
  ctx.lineWidth = lw;
  ctx.strokeStyle = style;
  ctx.stroke();
}

/** Dark "screen" behind every slot (a round photo in a rect slot shows it). */
function screens(ctx, L, color = '#060806') {
  for (const s of L.slots) {
    slotPath(ctx, s);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

/** Diagonal hazard stripes in a rect. */
function hazard(ctx, x, y, w, h, a = ACID, b = INK, s = 36) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = a;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = b;
  for (let k = -h; k < w + h; k += s * 2) {
    ctx.beginPath();
    ctx.moveTo(x + k, y + h);
    ctx.lineTo(x + k + s, y + h);
    ctx.lineTo(x + k + s + h, y);
    ctx.lineTo(x + k + h, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/** Halftone dot grid. */
function dots(ctx, W, H, step, r, color, offset = 0) {
  ctx.fillStyle = color;
  for (let y = 0, row = 0; y < H + step; y += step * 0.866, row++) {
    for (let x = (row % 2) * step * 0.5 + offset; x < W + step; x += step) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
}

/** Horizontal scanlines over a region. */
function scanlines(ctx, x, y, w, h, gap, color) {
  ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += gap) ctx.fillRect(x, yy, w, gap * 0.45);
}

/** Viewfinder corner brackets inside a rect. */
function brackets(ctx, x, y, w, h, len, lw, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'square';
  ctx.beginPath();
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    ctx.moveTo(px, py + sy * len);
    ctx.lineTo(px, py);
    ctx.lineTo(px + sx * len, py);
  }
  ctx.stroke();
  ctx.restore();
}

/** REC dot + camera no. + timecode inside a rectangular slot. */
function camHud(ctx, s, i, info, { color = '#fff', shadow = 'rgba(0,0,0,0.85)', bracket = color } = {}) {
  const u = s.w / 100;
  ctx.save();
  ctx.beginPath();
  ctx.rect(s.x, s.y, s.w, s.h);
  ctx.clip();
  brackets(ctx, s.x + u * 3, s.y + u * 3, s.w - u * 6, s.h - u * 6, u * 8, u * 0.9, bracket);
  const size = u * 6.4;
  ctx.save();
  ctx.shadowColor = RED;
  ctx.shadowBlur = u * 2;
  ctx.fillStyle = RED;
  ctx.beginPath();
  ctx.arc(s.x + u * 8.2, s.y + u * 8.8, u * 1.9, 0, TAU);
  ctx.fill();
  ctx.restore();
  label(ctx, 'REC', s.x + u * 11.4, s.y + u * 8.9, size, { color, shadow });
  label(ctx, `CAM-0${i + 1}`, s.x + s.w - u * 7, s.y + u * 8.9, size, { color, shadow, align: 'right' });
  label(ctx, timecode(info.date, i * 7 + 3), s.x + u * 7, s.y + s.h - u * 8.4, size * 0.86, { color, shadow, maxW: s.w * 0.56 });
  label(ctx, ['FRONT DOOR', 'DOORBELL', 'PORCH'][i % 3], s.x + s.w - u * 7, s.y + s.h - u * 8.4, size * 0.72, { color, shadow, align: 'right', maxW: s.w * 0.26 });
  ctx.restore();
}

// --- sticker-bomb motifs for the acid frame (drawn centred, size u)

function die(ctx, p, u, color = '#fff') {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.28)';
  ctx.shadowBlur = u * 0.14;
  ctx.shadowOffsetY = u * 0.06;
  ctx.lineJoin = 'round';
  ctx.lineWidth = u * 0.3;
  ctx.strokeStyle = color;
  ctx.stroke(p);
  ctx.fillStyle = color;
  ctx.fill(p);
  ctx.restore();
}

const BOMB_WORDS = ['DING', 'DONG', 'WOW', 'BIG', 'OMG', 'POW', 'YO!', 'REC', '叮咚', '哇!', 'HI!', 'LOL'];
const BOMB = [
  (ctx, u) => {
    const p = new Path2D(starD(0, 0, u, 5, 0.5));
    die(ctx, p, u);
    ctx.fillStyle = INK;
    ctx.fill(p);
  },
  (ctx, u) => {
    const p = new Path2D(circleD(0, 0, u * 0.78));
    die(ctx, p, u);
    ctx.fillStyle = ORANGE;
    ctx.fill(p);
    ctx.lineWidth = u * 0.08;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-u * 0.28, -u * 0.3, u * 0.18, u * 0.1, -0.7, 0, TAU);
    ctx.fill();
  },
  (ctx, u, r) => {
    const word = BOMB_WORDS[Math.floor(r() * BOMB_WORDS.length)];
    const dark = r() < 0.5;
    const p = new Path2D();
    const w = u * 2.3;
    const h = u * 1.05;
    p.roundRect ? p.roundRect(-w / 2, -h / 2, w, h, h * 0.2) : p.rect(-w / 2, -h / 2, w, h);
    die(ctx, p, u * 0.8);
    ctx.fillStyle = dark ? INK : '#fff';
    ctx.fill(p);
    ctx.lineWidth = u * 0.06;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    const cjk = /[^\x00-\x7f]/.test(word);
    comic(ctx, word, 0, h * 0.04, h * 0.72, { font: cjk ? F_CN : F_COMIC, fill: dark ? ACID : INK, stroke: null, maxW: w * 0.84 });
  },
  (ctx, u) => {
    const p = new Path2D(boltD(-u * 0.55, -u, u * 1.1, u * 2));
    die(ctx, p, u);
    ctx.fillStyle = INK;
    ctx.fill(p);
  },
  (ctx, u) => {
    const p = new Path2D(circleD(0, 0, u * 0.82));
    die(ctx, p, u);
    ctx.fillStyle = '#fff';
    ctx.fill(p);
    ctx.lineWidth = u * 0.09;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(-u * 0.28, -u * 0.18, u * 0.09, u * 0.15, 0, 0, TAU);
    ctx.ellipse(u * 0.28, -u * 0.18, u * 0.09, u * 0.15, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, u * 0.05, u * 0.46, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  },
  (ctx, u) => {
    const s = u * 1.4;
    const p = new Path2D();
    p.rect(-s / 2, -s / 2, s, s);
    die(ctx, p, u * 0.8);
    ctx.fillStyle = '#fff';
    ctx.fill(p);
    ctx.fillStyle = INK;
    const n = 4;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i + j) % 2) ctx.fillRect(-s / 2 + (i * s) / n, -s / 2 + (j * s) / n, s / n, s / n);
    ctx.lineWidth = u * 0.06;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
  },
  (ctx, u) => {
    const p = new Path2D(heartD(0, u * 0.05, u * 0.78));
    die(ctx, p, u);
    ctx.fillStyle = PINK;
    ctx.fill(p);
    ctx.lineWidth = u * 0.08;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
  },
  (ctx, u) => {
    const p = new Path2D(circleD(0, 0, u * 0.8));
    die(ctx, p, u);
    ctx.fillStyle = INK;
    ctx.fill(p);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, u * 0.52, 0, TAU);
    ctx.fill();
    ctx.fillStyle = ACID;
    ctx.beginPath();
    ctx.arc(u * 0.1, u * 0.06, u * 0.3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(u * 0.14, u * 0.08, u * 0.15, 0, TAU);
    ctx.fill();
  },
  (ctx, u) => {
    const p = new Path2D(bellD(0, 0, u * 0.9));
    die(ctx, p, u);
    ctx.fillStyle = ORANGE;
    ctx.fill(p);
    ctx.lineWidth = u * 0.07;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
  },
  (ctx, u) => {
    const p = new Path2D(sparkleD(0, 0, u * 1.05, 0.22));
    die(ctx, p, u * 0.8);
    ctx.fillStyle = CYAN;
    ctx.fill(p);
    ctx.lineWidth = u * 0.07;
    ctx.strokeStyle = INK;
    ctx.stroke(p);
  },
];

function stickerBomb(ctx, W, H, seed, cell) {
  const r = rng(seed);
  const cols = Math.ceil(W / cell) + 1;
  const rows = Math.ceil(H / cell) + 1;
  let k = Math.floor(r() * BOMB.length);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = (i + (j % 2) * 0.5 + (r() - 0.5) * 0.6) * cell;
      const y = (j + (r() - 0.5) * 0.6) * cell;
      const u = cell * (0.24 + r() * 0.14);
      k = (k + 1 + Math.floor(r() * 3)) % BOMB.length;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((r() - 0.5) * 1.1);
      BOMB[k](ctx, u, r);
      ctx.restore();
    }
  }
}

/** A strip of tape (torn short ends) centred at (cx, cy). */
function tape(ctx, cx, cy, w, h, rot, color, seed = 1) {
  const r = rng(seed);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = h * 0.12;
  ctx.shadowOffsetY = h * 0.05;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(w / 2, -h / 2);
  const n = 6;
  for (let i = 1; i <= n; i++) ctx.lineTo(w / 2 - (i % 2 ? h * 0.08 * (0.5 + r()) : 0), -h / 2 + (h * i) / n);
  ctx.lineTo(-w / 2, h / 2);
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(-w / 2 + (i % 2 ? h * 0.08 * (0.5 + r()) : 0), -h / 2 + (h * i) / n);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// --- wood for the peephole door

function wood(ctx, W, H, seed) {
  const r = rng(seed);
  const planks = Math.max(3, Math.round(W / 250));
  const pw = W / planks;
  const tones = ['#8b5a2b', '#96633a', '#7e5028', '#9a6a36'];
  for (let p = 0; p < planks; p++) {
    const x0 = p * pw;
    ctx.fillStyle = tones[p % tones.length];
    ctx.fillRect(x0, 0, pw + 1, H);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, 0, pw, H);
    ctx.clip();
    for (let g = 0; g < 30; g++) {
      const gx = x0 + r() * pw;
      const amp = 3 + r() * 9;
      const freq = 0.003 + r() * 0.006;
      const ph = r() * TAU;
      ctx.strokeStyle = r() < 0.6 ? `rgba(60,30,10,${0.12 + r() * 0.2})` : `rgba(255,220,170,${0.05 + r() * 0.08})`;
      ctx.lineWidth = 1 + r() * 3;
      ctx.beginPath();
      for (let y = -10; y <= H + 20; y += 18) {
        const x = gx + Math.sin(y * freq + ph) * amp;
        if (y < 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // a knot
    const kx = x0 + pw * (0.3 + r() * 0.4);
    const ky = H * (0.15 + r() * 0.7);
    for (let k = 5; k > 0; k--) {
      ctx.strokeStyle = `rgba(60,30,10,${0.08 + k * 0.05})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(kx, ky, k * pw * 0.018, k * pw * 0.05, 0, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(28,14,4,0.6)';
    ctx.fillRect(x0 - 2, 0, 4, H);
    ctx.fillStyle = 'rgba(255,230,190,0.12)';
    ctx.fillRect(x0 + 2, 0, 2, H);
  }
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(255,240,210,0.1)');
  g.addColorStop(0.5, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Metal gradient across a box (brass or chrome). */
function metal(ctx, x, y, w, h, kind = 'brass') {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  const stops = kind === 'brass'
    ? ['#fff4c2', '#e0b64a', '#8a6116', '#f0cf6a', '#6b4a10']
    : ['#ffffff', '#c9d0d6', '#6f7880', '#e9edf0', '#4a525a'];
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
  return g;
}

/** Brass peephole ring around a round slot. */
function brassRing(ctx, s) {
  const { cx, cy, R } = center(s);
  const t = R * (R > 350 ? 0.12 : 0.105); // 2×2 peepholes must not touch
  ctx.save();
  ctx.shadowColor = 'rgba(20,8,0,0.55)';
  ctx.shadowBlur = t * 0.6;
  ctx.shadowOffsetY = t * 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy, R + t * 0.42, 0, TAU);
  ctx.lineWidth = t;
  ctx.strokeStyle = metal(ctx, cx - R, cy - R, R * 2, R * 2, 'brass');
  ctx.stroke();
  ctx.restore();
  ring(ctx, s, t * 0.9, t * 0.08, 'rgba(60,35,5,0.8)');
  ring(ctx, s, t * 0.72, t * 0.06, 'rgba(255,248,210,0.7)');
  ring(ctx, s, 0, t * 0.16, '#2a1a04');
  ring(ctx, s, t * 0.1, t * 0.05, 'rgba(255,240,190,0.55)');
  // glass reflection on the lens
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = R * 0.05;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.86, Math.PI * 1.08, Math.PI * 1.36);
  ctx.stroke();
  ctx.lineWidth = R * 0.025;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.86, Math.PI * 1.42, Math.PI * 1.48);
  ctx.stroke();
  ctx.restore();
}

/** Glossy doorbell-camera bezel behind a round slot. */
function bezel(ctx, s) {
  const { cx, cy, R } = center(s);
  const big = R > 350;
  const k = big ? 1.14 : 1.1; // 2×2 lenses must not overlap
  const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.4, R * 0.2, cx, cy, R * k);
  g.addColorStop(0, '#3a3a3a');
  g.addColorStop(0.8, '#161616');
  g.addColorStop(1, '#050505');
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = R * 0.08;
  ctx.shadowOffsetY = R * 0.03;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R * k, 0, TAU);
  ctx.fill();
  ctx.restore();
  ring(ctx, s, R * (k - 1), R * 0.012, '#4a4a4a');
  // IR LEDs around the lens
  const lr = R * (big ? 1.088 : 1.074);
  for (let j = 0; j < 12; j++) {
    const a = (j / 12) * TAU + Math.PI / 12;
    const x = cx + Math.cos(a) * lr;
    const y = cy + Math.sin(a) * lr;
    ctx.fillStyle = '#2a0a0a';
    ctx.beginPath();
    ctx.arc(x, y, R * 0.02, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,80,80,0.5)';
    ctx.beginPath();
    ctx.arc(x - R * 0.005, y - R * 0.005, R * 0.009, 0, TAU);
    ctx.fill();
  }
}

/** The big round doorbell button (+ glow ring) centred at (x, y). */
function bellButton(ctx, x, y, r) {
  ctx.save();
  ctx.shadowColor = ACID;
  ctx.shadowBlur = r * 0.5;
  ctx.fillStyle = ACID;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
  const g = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r * 0.8);
  g.addColorStop(0, '#3c3c3c');
  g.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fill(new Path2D(bellD(x, y - r * 0.02, r * 0.4)));
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.66, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();
}

/** Speaker grille (rounded box of holes). */
function grille(ctx, x, y, w, h, hole, color = '#050505') {
  ctx.save();
  rrect(ctx, x, y, w, h, h * 0.25);
  ctx.fillStyle = '#1c1c1c';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = color;
  for (let yy = y + hole * 1.5; yy < y + h; yy += hole * 2.6) {
    for (let xx = x + hole * 1.5; xx < x + w; xx += hole * 2.6) {
      ctx.beginPath();
      ctx.arc(xx, yy, hole, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Gum bubble (glossy circle). */
function gumBubble(ctx, x, y, r, color = '#ff8cc6') {
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, '#ffe3f1');
  g.addColorStop(0.6, color);
  g.addColorStop(1, '#e8479a');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.28, r * 0.15, -0.7, 0, TAU);
  ctx.fill();
}

/** Tick marks around a round slot (night-vision reticle). */
function reticle(ctx, s, color) {
  const { cx, cy, R } = center(s);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let k = 0; k < 72; k++) {
    const a = (k / 72) * TAU;
    const long = k % 9 === 0;
    const r0 = R * 1.05;
    const r1 = R * (long ? 1.15 : 1.09);
    ctx.lineWidth = R * (long ? 0.012 : 0.007);
    ctx.globalAlpha = long ? 0.95 : 0.55;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();
}

// ----------------------------------------------------------------- frames

export const frames = [
  {
    id: 'acid',
    name: '荧光贴纸墙',
    paint: {
      under(ctx, L) {
        ctx.fillStyle = ACID;
        ctx.fillRect(0, 0, L.W, L.H);
        dots(ctx, L.W, L.H, L.W / 34, L.W / 260, 'rgba(0,60,0,0.12)');
        stickerBomb(ctx, L.W, L.H, L.id === 'cctv' ? 41 : L.id === 'peephole' ? 29 : 17, L.W / (L.id === 'cctv' ? 3.4 : 6.2));
        screens(ctx, L);
      },
      slot(ctx, s, i, info) {
        if (s.shape === 'circle') {
          const R = s.w / 2;
          ring(ctx, s, R * 0.035, R * 0.1, INK);
          ring(ctx, s, R * 0.095, R * 0.035, '#fff');
          ring(ctx, s, R * 0.006, R * 0.02, '#fff');
        } else {
          ctx.lineWidth = s.w * 0.035;
          ctx.strokeStyle = INK;
          ctx.stroke();
          camHud(ctx, s, i, info);
        }
      },
      over(ctx, L, info) {
        const { top, bottom } = zones(L);
        const W = L.W;
        const ext = L.id === 'cctv' ? 0 : L.slots[0].w * 0.07;
        const hh = Math.min(top - ext, W * 0.24);
        // headline tape
        tape(ctx, W / 2, (top - ext) * 0.46, W * 0.9, hh * 0.58, -0.035, INK, 3);
        comic(ctx, 'FISHEYE CAM', W * 0.5, (top - ext) * 0.47, hh * 0.44, { fill: ACID, stroke: null, rot: -0.035, spacing: 0.04, maxW: W * 0.8 });
        tape(ctx, W * 0.72, (top - ext) * 0.86, W * 0.44, hh * 0.2, 0.05, ORANGE, 5);
        comic(ctx, 'DOORBELL VIEW · 门铃视角', W * 0.72, (top - ext) * 0.865, hh * 0.13, { font: F_BLOCK, fill: INK, stroke: null, rot: 0.05, maxW: W * 0.4 });
        // footer: printed cam label
        const fy = bottom + ext;
        const fh = L.H - fy;
        const lw = W * 0.8;
        const lh = Math.min(fh * 0.46, W * 0.2);
        const ly = fy + fh * 0.5;
        ctx.save();
        ctx.translate(W * 0.47, ly);
        ctx.rotate(0.02);
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = lh * 0.12;
        ctx.shadowOffsetY = lh * 0.05;
        rrect(ctx, -lw / 2, -lh / 2, lw, lh, lh * 0.12);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.lineWidth = lh * 0.04;
        ctx.strokeStyle = INK;
        ctx.stroke();
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(-lw / 2 + lh * 0.3, -lh * 0.18, lh * 0.1, 0, TAU);
        ctx.fill();
        label(ctx, `REC  ${timecode(info.date)}`, -lw / 2 + lh * 0.5, -lh * 0.17, lh * 0.3, { color: INK, shadow: null });
        label(ctx, `CAM FRONT-DOOR   ${serialNo(info)}`, -lw / 2 + lh * 0.2, lh * 0.22, lh * 0.26, { color: '#444', shadow: null });
        ctx.restore();
        // a couple of slap stickers on the label corners
        const bu = Math.min(fh * 0.2, W * 0.08);
        ctx.save();
        ctx.translate(W * 0.86, ly - lh * 0.45);
        ctx.rotate(0.3);
        BOMB[0](ctx, bu, rng(2));
        ctx.restore();
        ctx.save();
        ctx.translate(W * 0.1, ly + lh * 0.5);
        ctx.rotate(-0.25);
        BOMB[8](ctx, bu * 0.9, rng(4));
        ctx.restore();
      },
    },
  },
  {
    id: 'doorbell',
    name: '门铃机身',
    layouts: ['circles', 'peephole'],
    paint: {
      under(ctx, L) {
        const { W, H } = L;
        hazard(ctx, 0, 0, W, H, ACID, INK, W * 0.035);
        const m = W * 0.04;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = m * 0.8;
        rrect(ctx, m, m, W - m * 2, H - m * 2, W * 0.09);
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, '#2a2a2a');
        g.addColorStop(0.5, '#151515');
        g.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
        ctx.save();
        rrect(ctx, m, m, W - m * 2, H - m * 2, W * 0.09);
        ctx.clip();
        speckle(ctx, m, m, W - m * 2, H - m * 2, { n: 5000, color: 'rgba(255,255,255,0.035)', size: 2, seed: 8 });
        ctx.restore();
        rrect(ctx, m + 4, m + 4, W - m * 2 - 8, H - m * 2 - 8, W * 0.085);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.stroke();
        for (const s of L.slots) bezel(ctx, s);
        screens(ctx, L, '#000');
      },
      slot(ctx, s) {
        const { cx, cy, R } = center(s);
        ring(ctx, s, R * 0.01, R * 0.035, '#000');
        ctx.save();
        ctx.shadowColor = ACID;
        ctx.shadowBlur = R * 0.06;
        ring(ctx, s, R * 0.045, R * 0.014, ACID);
        ctx.restore();
        ctx.save();
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = R * 0.045;
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.88, Math.PI * 1.1, Math.PI * 1.34);
        ctx.stroke();
        ctx.restore();
      },
      over(ctx, L, info) {
        const { W, H } = L;
        const { top, bottom } = zones(L);
        const R = L.slots[0].w / 2;
        const m = W * 0.04;
        const ht = top - R * 0.14 - m;
        // header: model name, status LED, REC + timecode
        const hy = m + ht * 0.5;
        const hs = Math.min(ht * 0.34, W * 0.075);
        label(ctx, 'FISHEYE CAM', m + W * 0.06, hy - hs * 0.1, hs, { font: '"Bungee", "Rubik Mono One", sans-serif', color: '#f2f2f2', shadow: 'rgba(0,0,0,0.6)' });
        label(ctx, 'HD 180° · DOORBELL VIEW', m + W * 0.062, hy + hs * 0.78, hs * 0.42, { font: F_BLOCK, color: '#8a8a8a', shadow: null });
        ctx.save();
        ctx.shadowColor = RED;
        ctx.shadowBlur = hs * 0.4;
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(W - m - W * 0.22, hy - hs * 0.12, hs * 0.16, 0, TAU);
        ctx.fill();
        ctx.restore();
        label(ctx, 'REC', W - m - W * 0.2, hy - hs * 0.08, hs * 0.62, { color: '#f2f2f2', shadow: null });
        label(ctx, timecode(info.date, 0, 'time'), W - m - W * 0.06, hy + hs * 0.72, hs * 0.5, { color: ACID, shadow: null, align: 'right' });
        // footer: speaker, big bell button, serial
        const fy = bottom + R * 0.14;
        const fh = H - m - fy;
        const br = Math.min(fh * 0.3, W * 0.1);
        const by = fy + fh * 0.45;
        bellButton(ctx, W / 2, by, br);
        label(ctx, 'PRESS', W / 2, by + br * 1.3, br * 0.28, { font: F_BLOCK, color: '#9a9a9a', shadow: null, align: 'center' });
        grille(ctx, m + W * 0.06, by - br * 0.5, W * 0.24, br, br * 0.07);
        label(ctx, 'DING', W - m - W * 0.06, by - br * 0.32, br * 0.44, { font: F_COMIC, color: ACID, shadow: null, align: 'right' });
        label(ctx, 'DONG!', W - m - W * 0.06, by + br * 0.14, br * 0.44, { font: F_COMIC, color: ORANGE, shadow: null, align: 'right' });
        label(ctx, serialNo(info), W - m - W * 0.06, by + br * 0.62, br * 0.24, { color: '#8a8a8a', shadow: null, align: 'right' });
      },
    },
  },
  {
    id: 'night',
    name: '夜视监控',
    paint: {
      under(ctx, L) {
        const { W, H } = L;
        const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2);
        g.addColorStop(0, '#0c2a12');
        g.addColorStop(1, '#020803');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        const step = W / 20;
        ctx.strokeStyle = 'rgba(157,255,92,0.07)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let x = step / 2; x < W; x += step) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, H);
        }
        for (let y = step / 2; y < H; y += step) {
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
        }
        ctx.stroke();
        speckle(ctx, 0, 0, W, H, { n: 3000, color: 'rgba(157,255,92,0.08)', size: 2, seed: 31 });
        screens(ctx, L, '#010401');
      },
      slot(ctx, s, i, info) {
        if (s.shape === 'circle') {
          const R = s.w / 2;
          ctx.save();
          ctx.shadowColor = NV;
          ctx.shadowBlur = R * 0.08;
          ring(ctx, s, R * 0.012, R * 0.022, NV);
          ctx.restore();
          reticle(ctx, s, NV);
          if (R < 350) {
            const { cx, cy } = center(s);
            label(ctx, `CAM-0${i + 1}`, cx - R * 1.02, cy - R * 0.96, R * 0.11, { color: NV, shadow: null, glow: NV });
          }
        } else {
          ctx.lineWidth = s.w * 0.012;
          ctx.strokeStyle = NV;
          ctx.stroke();
          camHud(ctx, s, i, info, { color: NV, shadow: 'rgba(0,0,0,0.9)' });
        }
      },
      over(ctx, L, info) {
        const { W, H } = L;
        const { top, bottom } = zones(L);
        const round = L.slots[0].shape === 'circle';
        const ext = round ? L.slots[0].w * 0.08 : 0;
        const ht = top - ext;
        const u = Math.min(ht * 0.24, W * 0.06);
        const px = W * 0.06;
        // header HUD
        ctx.save();
        ctx.shadowColor = RED;
        ctx.shadowBlur = u * 0.5;
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(px + u * 0.3, ht * 0.32, u * 0.26, 0, TAU);
        ctx.fill();
        ctx.restore();
        label(ctx, 'REC', px + u * 0.8, ht * 0.33, u * 0.9, { color: NV, shadow: null, glow: NV });
        label(ctx, 'IR ON  ◉', W - px, ht * 0.33, u * 0.9, { color: NV, shadow: null, glow: NV, align: 'right' });
        label(ctx, 'NIGHT VISION', W / 2, ht * 0.7, u * 1.5, { color: NV, shadow: null, glow: NV, align: 'center' });
        // battery
        const bw = u * 1.6;
        const bx = W - px - bw - u * 3.6;
        ctx.strokeStyle = NV;
        ctx.lineWidth = u * 0.12;
        ctx.strokeRect(bx, ht * 0.33 - u * 0.32, bw, u * 0.64);
        ctx.fillStyle = NV;
        ctx.fillRect(bx + bw, ht * 0.33 - u * 0.14, u * 0.14, u * 0.28);
        for (let k = 0; k < 3; k++) ctx.fillRect(bx + u * 0.14 + k * bw * 0.3, ht * 0.33 - u * 0.2, bw * 0.24, u * 0.4);
        // crosshair between the peepholes
        if (L.slots.length === 4) {
          const cx = W / 2;
          const cy = (L.slots[0].y + L.slots[3].y + L.slots[3].h) / 2;
          ctx.strokeStyle = NV;
          ctx.lineWidth = W * 0.004;
          ctx.beginPath();
          ctx.moveTo(cx - W * 0.03, cy);
          ctx.lineTo(cx + W * 0.03, cy);
          ctx.moveTo(cx, cy - W * 0.03);
          ctx.lineTo(cx, cy + W * 0.03);
          ctx.stroke();
        }
        // footer HUD
        const fy = bottom + ext;
        const fh = H - fy;
        const fu = Math.min(fh * 0.16, W * 0.06);
        label(ctx, timecode(info.date), W / 2, fy + fh * 0.36, fu * 1.2, { color: NV, shadow: null, glow: NV, align: 'center' });
        label(ctx, `FISHEYE CAM · ${serialNo(info)}`, W / 2, fy + fh * 0.62, fu * 0.8, { color: 'rgba(157,255,92,0.7)', shadow: null, align: 'center' });
        brackets(ctx, W * 0.03, H * 0.02, W * 0.94, H * 0.96, W * 0.07, W * 0.006, NV);
        // monitor scanlines over everything
        scanlines(ctx, 0, 0, W, H, 6, 'rgba(0,0,0,0.16)');
      },
    },
  },
  {
    id: 'gum',
    name: '泡泡糖粉',
    paint: {
      under(ctx, L) {
        const { W, H } = L;
        ctx.fillStyle = '#ffc3df';
        ctx.fillRect(0, 0, W, H);
        dots(ctx, W, H, W / 9, W / 50, '#ffd9ec');
        const r = rng(L.id === 'cctv' ? 7 : 5);
        for (let k = 0; k < 16; k++) gumBubble(ctx, r() * W, r() * H, W * (0.03 + r() * 0.06), k % 3 ? '#ff9fcf' : '#ff7fbf');
        // drippy top edge
        ctx.fillStyle = PINK;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(W, 0);
        const base = H * 0.018;
        ctx.lineTo(W, base);
        const n = Math.round(W / 70);
        for (let k = n; k >= 0; k--) {
          const x = (k / n) * W;
          const len = base + (k % 3 === 1 ? H * 0.035 : k % 2 ? H * 0.018 : H * 0.006) * (0.6 + r() * 0.8);
          const hw = W / n / 4;
          ctx.lineTo(x + hw, base);
          ctx.lineTo(x + hw, len);
          ctx.arc(x, len, hw, 0, Math.PI);
          ctx.lineTo(x - hw, base);
        }
        ctx.lineTo(0, base);
        ctx.closePath();
        ctx.fill();
        screens(ctx, L, '#ff8cc6');
        if (L.id === 'cctv') {
          for (const s of L.slots) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(s.x, s.y, s.w, s.h);
            ctx.clip();
            dots(ctx, s.x + s.w, s.y + s.h, s.w / 12, s.w / 70, 'rgba(255,255,255,0.35)', s.x);
            ctx.restore();
          }
        }
      },
      slot(ctx, s, i, info) {
        if (s.shape === 'circle') {
          const R = s.w / 2;
          ring(ctx, s, R * 0.045, R * 0.09, '#fff');
          ring(ctx, s, R * 0.095, R * 0.016, PINK);
          ring(ctx, s, R * 0.002, R * 0.012, PINK);
        } else {
          ctx.lineWidth = s.w * 0.04;
          ctx.strokeStyle = '#fff';
          ctx.stroke();
          camHud(ctx, s, i, info, { color: '#fff', shadow: 'rgba(200,30,110,0.9)' });
        }
      },
      over(ctx, L, info) {
        const { W, H } = L;
        const { top, bottom } = zones(L);
        const ext = L.slots[0].shape === 'circle' ? L.slots[0].w * 0.07 : 0;
        const ht = top - ext;
        const hs = Math.min(ht * 0.5, W * 0.15);
        comic(ctx, 'BIG HEAD CLUB', W / 2, ht * 0.56, hs, { fill: '#fff', stroke: PINK, sw: 0.2, depth: 4, depthColor: '#c42f7c', rot: -0.03, spacing: 0.03, maxW: W * 0.86 });
        const fy = bottom + ext;
        const fh = H - fy;
        const ph = Math.min(fh * 0.34, W * 0.12);
        const pw = W * 0.76;
        const py = fy + fh * 0.5;
        rrect(ctx, W / 2 - pw / 2, py - ph / 2, pw, ph, ph / 2);
        ctx.fillStyle = PINK;
        ctx.fill();
        ctx.lineWidth = ph * 0.06;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
        label(ctx, `${timecode(info.date, 0, 'day')}  ·  ${serialNo(info)}`, W / 2, py + ph * 0.03, ph * 0.42, { font: F_MONO, color: '#fff', shadow: 'rgba(160,20,90,0.6)', align: 'center' });
        gumBubble(ctx, W * 0.12, py - ph * 0.7, ph * 0.5);
        gumBubble(ctx, W * 0.9, py + ph * 0.55, ph * 0.38);
        ctx.fillStyle = '#fff';
        for (const [x, y, s] of [[0.2, 0.45, 0.35], [0.84, 0.3, 0.25]]) ctx.fill(new Path2D(sparkleD(W * x, py - ph * 0.5 + (y - 0.4) * ph, ph * s)));
        comic(ctx, 'POP!', W * 0.86, fy + fh * 0.16, Math.min(fh * 0.2, W * 0.08), { fill: ACID, stroke: INK, sw: 0.2, rot: 0.2 });
      },
    },
  },
  {
    id: 'door',
    name: '猫眼木门',
    layouts: ['circles', 'peephole'],
    paint: {
      under(ctx, L) {
        wood(ctx, L.W, L.H, L.id === 'peephole' ? 12 : 6);
        // door-frame moulding
        const m = L.W * 0.035;
        ctx.lineWidth = m;
        ctx.strokeStyle = 'rgba(40,20,6,0.55)';
        ctx.strokeRect(m / 2, m / 2, L.W - m, L.H - m);
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,225,180,0.25)';
        ctx.strokeRect(m + 2, m + 2, L.W - m * 2 - 4, L.H - m * 2 - 4);
        screens(ctx, L, '#000');
      },
      slot(ctx, s) {
        brassRing(ctx, s);
      },
      over(ctx, L, info) {
        const { W, H } = L;
        const { top, bottom } = zones(L);
        const R = L.slots[0].w / 2;
        const ext = R * 0.16;
        // house-number plate
        const ht = top - ext;
        const pw = Math.min(W * 0.44, ht * 3);
        const ph = Math.min(ht * 0.56, pw * 0.3);
        const py = ht * 0.52;
        ctx.save();
        ctx.shadowColor = 'rgba(20,8,0,0.5)';
        ctx.shadowBlur = ph * 0.2;
        ctx.shadowOffsetY = ph * 0.08;
        rrect(ctx, W / 2 - pw / 2, py - ph / 2, pw, ph, ph * 0.5);
        ctx.fillStyle = metal(ctx, W / 2 - pw / 2, py - ph / 2, pw, ph, 'brass');
        ctx.fill();
        ctx.restore();
        rrect(ctx, W / 2 - pw / 2 + ph * 0.1, py - ph * 0.4, pw - ph * 0.2, ph * 0.8, ph * 0.4);
        ctx.lineWidth = ph * 0.035;
        ctx.strokeStyle = 'rgba(80,50,8,0.7)';
        ctx.stroke();
        label(ctx, serialNo(info), W / 2, py + ph * 0.04, ph * 0.44, { font: F_BLOCK, color: '#4a2f06', shadow: 'rgba(255,245,200,0.6)', align: 'center', maxW: pw - ph * 1.1 });
        for (const sx of [-1, 1]) {
          ctx.fillStyle = '#6b4a10';
          ctx.beginPath();
          ctx.arc(W / 2 + sx * (pw / 2 - ph * 0.28), py, ph * 0.08, 0, TAU);
          ctx.fill();
        }
        // sticky note with the date
        const fy = bottom + ext;
        const fh = H - fy;
        const ns = Math.min(fh * 0.72, W * 0.3);
        const nx = W * 0.2;
        const ny = fy + fh * 0.48;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(-0.07);
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = ns * 0.06;
        ctx.shadowOffsetY = ns * 0.03;
        ctx.fillStyle = ACID;
        ctx.fillRect(-ns / 2, -ns * 0.42, ns, ns * 0.84);
        ctx.restore();
        tape(ctx, nx - ns * 0.03, ny - ns * 0.44, ns * 0.44, ns * 0.13, -0.12, 'rgba(255,255,255,0.6)', 9);
        comic(ctx, '谁在门口？', nx, ny - ns * 0.1, ns * 0.2, { font: F_CN, fill: INK, stroke: null, rot: -0.07, maxW: ns * 0.86 });
        comic(ctx, timecode(info.date, 0, 'day'), nx, ny + ns * 0.17, ns * 0.13, { font: F_MARKER, fill: '#333', stroke: null, rot: -0.07, maxW: ns * 0.86 });
        // doorbell plate
        const bw = Math.min(fh * 0.4, W * 0.14);
        const bx = W * 0.8;
        const by = fy + fh * 0.46;
        ctx.save();
        ctx.shadowColor = 'rgba(20,8,0,0.5)';
        ctx.shadowBlur = bw * 0.12;
        ctx.shadowOffsetY = bw * 0.05;
        rrect(ctx, bx - bw / 2, by - bw * 0.75, bw, bw * 1.5, bw * 0.2);
        ctx.fillStyle = metal(ctx, bx - bw / 2, by - bw * 0.75, bw, bw * 1.5, 'brass');
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#fff8e0';
        ctx.beginPath();
        ctx.arc(bx, by + bw * 0.12, bw * 0.3, 0, TAU);
        ctx.fill();
        ctx.lineWidth = bw * 0.05;
        ctx.strokeStyle = '#6b4a10';
        ctx.stroke();
        ctx.fillStyle = '#6b4a10';
        ctx.fill(new Path2D(bellD(bx, by - bw * 0.46, bw * 0.13)));
        // mail slot between them
        const mw = W * 0.24;
        const mh = Math.min(fh * 0.16, W * 0.05);
        const mx = W * 0.5;
        const my = fy + fh * 0.5;
        rrect(ctx, mx - mw / 2, my - mh / 2, mw, mh, mh * 0.3);
        ctx.fillStyle = metal(ctx, mx - mw / 2, my - mh / 2, mw, mh, 'brass');
        ctx.fill();
        rrect(ctx, mx - mw * 0.4, my - mh * 0.15, mw * 0.8, mh * 0.3, mh * 0.15);
        ctx.fillStyle = '#1a0f02';
        ctx.fill();
        label(ctx, 'LETTERS', mx, my - mh * 0.72, mh * 0.42, { font: F_BLOCK, color: 'rgba(255,235,190,0.55)', shadow: null, align: 'center', base: 'bottom' });
      },
    },
  },
  {
    id: 'monitor',
    name: '保安室监控屏',
    layouts: ['cctv'],
    paint: {
      under(ctx, L) {
        const { W, H } = L;
        const g = ctx.createLinearGradient(0, 0, W, 0);
        g.addColorStop(0, '#3a3d40');
        g.addColorStop(0.5, '#2c2f32');
        g.addColorStop(1, '#1e2023');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
        speckle(ctx, 0, 0, W, H, { n: 4000, color: 'rgba(255,255,255,0.03)', size: 2, seed: 44 });
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.strokeRect(10, 10, W - 20, H - 20);
        for (const s of L.slots) {
          const pad = s.w * 0.035;
          ctx.save();
          ctx.shadowColor = 'rgba(255,255,255,0.12)';
          ctx.shadowOffsetY = 3;
          rrect(ctx, s.x - pad, s.y - pad, s.w + pad * 2, s.h + pad * 2, pad * 1.4);
          ctx.fillStyle = '#0d0e0f';
          ctx.fill();
          ctx.restore();
        }
        screens(ctx, L, '#040504');
        // screw heads
        for (const [x, y] of [[26, 26], [W - 26, 26], [26, H - 26], [W - 26, H - 26]]) {
          ctx.fillStyle = metal(ctx, x - 9, y - 9, 18, 18, 'chrome');
          ctx.beginPath();
          ctx.arc(x, y, 9, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 6, y - 2);
          ctx.lineTo(x + 6, y + 2);
          ctx.stroke();
        }
      },
      slot(ctx, s, i, info) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(s.x, s.y, s.w, s.h);
        ctx.clip();
        scanlines(ctx, s.x, s.y, s.w, s.h, 5, 'rgba(0,0,0,0.14)');
        const g = ctx.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
        g.addColorStop(0, 'rgba(255,255,255,0.1)');
        g.addColorStop(0.35, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        const v = ctx.createRadialGradient(s.x + s.w / 2, s.y + s.h / 2, s.h * 0.4, s.x + s.w / 2, s.y + s.h / 2, s.w * 0.62);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = v;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.restore();
        camHud(ctx, s, i, info);
      },
      over(ctx, L, info) {
        const { W, H } = L;
        const { top, bottom } = zones(L);
        // badge plate
        const bh = top * 0.36;
        rrect(ctx, W * 0.1, top * 0.3, W * 0.8, bh, bh * 0.2);
        ctx.fillStyle = metal(ctx, W * 0.1, top * 0.3, W * 0.8, bh, 'chrome');
        ctx.fill();
        label(ctx, 'SECURITY · CH 1-3', W / 2, top * 0.3 + bh * 0.53, bh * 0.4, { font: F_BLOCK, color: '#2c2f32', shadow: 'rgba(255,255,255,0.7)', align: 'center' });
        ctx.fillStyle = NV;
        ctx.save();
        ctx.shadowColor = NV;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(W * 0.1 + bh * 0.1, top * 0.18, 7, 0, TAU);
        ctx.fill();
        ctx.restore();
        label(ctx, 'POWER', W * 0.1 + bh * 0.1 + 16, top * 0.18, 20, { font: F_MONO, color: '#9aa1a8', shadow: null });
        // LCD with timecode + serial
        const fy = bottom;
        const fh = H - fy;
        const lw = W * 0.8;
        const lh = fh * 0.34;
        const lx = W * 0.1;
        const ly = fy + fh * 0.18;
        rrect(ctx, lx, ly, lw, lh, 10);
        ctx.fillStyle = '#16210f';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#0a0a0a';
        ctx.stroke();
        label(ctx, timecode(info.date), lx + lw / 2, ly + lh * 0.36, lh * 0.34, { color: NV, shadow: null, glow: NV, align: 'center' });
        label(ctx, `FISHEYE CAM  ${serialNo(info)}`, lx + lw / 2, ly + lh * 0.74, lh * 0.26, { color: 'rgba(157,255,92,0.7)', shadow: null, align: 'center' });
        // knobs
        const ky = ly + lh + fh * 0.22;
        const kr = fh * 0.1;
        [0.22, 0.42].forEach((kx, k) => {
          ctx.fillStyle = metal(ctx, W * kx - kr, ky - kr, kr * 2, kr * 2, 'chrome');
          ctx.beginPath();
          ctx.arc(W * kx, ky, kr, 0, TAU);
          ctx.fill();
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(W * kx, ky);
          ctx.lineTo(W * kx + Math.cos(-2.2 + k * 1.6) * kr * 0.8, ky + Math.sin(-2.2 + k * 1.6) * kr * 0.8);
          ctx.stroke();
        });
        rrect(ctx, W * 0.58, ky - kr * 0.6, W * 0.26, kr * 1.2, kr * 0.3);
        ctx.fillStyle = RED;
        ctx.fill();
        label(ctx, 'REC', W * 0.71, ky + 2, kr * 0.8, { font: F_BLOCK, color: '#fff', shadow: null, align: 'center' });
      },
    },
  },
];

/** Every CJK string the frames draw on canvas (→ `fonts.text` in index.js). */
export const FRAME_TEXT = ['DOORBELL VIEW · 门铃视角', '谁在门口？', ...BOMB_WORDS].join(' ');
