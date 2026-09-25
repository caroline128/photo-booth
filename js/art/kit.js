// Small toolkit for authoring sticker/prop art: SVG wrappers, common shape
// paths, and canvas-drawn text stickers (canvas can use the page's web
// fonts; SVG-in-<img> cannot).

import { rrect } from '../core/util.js';

export const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;

const f = (n) => Math.round(n * 100) / 100;

/** Heart path centred at (cx, cy) with half-width ≈ r. */
export function heartD(cx, cy, r) {
  return `M${f(cx)} ${f(cy + r * 0.9)} C${f(cx - r * 1.6)} ${f(cy - r * 0.1)} ${f(cx - r * 0.75)} ${f(cy - r * 1.25)} ${f(cx)} ${f(cy - r * 0.55)} C${f(cx + r * 0.75)} ${f(cy - r * 1.25)} ${f(cx + r * 1.6)} ${f(cy - r * 0.1)} ${f(cx)} ${f(cy + r * 0.9)}Z`;
}

/** n-pointed star. */
export function starD(cx, cy, r, n = 5, inner = 0.45, rot = -90) {
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

/** Four-point twinkle. */
export function sparkleD(cx, cy, r, pinch = 0.18) {
  const p = r * pinch;
  return `M${f(cx)} ${f(cy - r)} Q${f(cx + p)} ${f(cy - p)} ${f(cx + r)} ${f(cy)} Q${f(cx + p)} ${f(cy + p)} ${f(cx)} ${f(cy + r)} Q${f(cx - p)} ${f(cy + p)} ${f(cx - r)} ${f(cy)} Q${f(cx - p)} ${f(cy - p)} ${f(cx)} ${f(cy - r)}Z`;
}

/** Comic burst / explosion outline. */
export function burstD(cx, cy, r, n = 14, inner = 0.72, jitter = 0.12, seed = 1) {
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const base = i % 2 ? r * inner : r;
    const rr = base * (1 - jitter / 2 + rnd() * jitter);
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    d += `${i ? 'L' : 'M'}${f(cx + Math.cos(a) * rr)} ${f(cy + Math.sin(a) * rr)}`;
  }
  return d + 'Z';
}

export function circleD(cx, cy, r) {
  return `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(r * 2)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-r * 2)} 0Z`;
}

/**
 * Canvas text sticker definition.
 * opts: { id, name, text, font, weight, color, gradient: [...], stroke,
 *         strokeWidth (em), shadow, pad (em), lineHeight, rotate, bg, bgRadius,
 *         bgStroke, outline, size, group, italic, letterSpacing }
 */
export function textSticker(opts) {
  const fs = 100;
  const lines = String(opts.text).split('\n');
  const font = `${opts.italic ? 'italic ' : ''}${opts.weight || 400} ${fs}px ${opts.font || '"ZCOOL KuaiLe", sans-serif'}`;
  const lh = opts.lineHeight || 1.12;
  const pad = (opts.pad ?? 0.3) * fs;
  // measure lazily (fonts may not be loaded when the module is imported)
  const measure = () => {
    const c = document.createElement('canvas').getContext('2d');
    c.font = font;
    if (opts.letterSpacing && 'letterSpacing' in c) c.letterSpacing = `${opts.letterSpacing}em`;
    const w = Math.max(...lines.map((l) => c.measureText(l).width));
    return { W: w + pad * 2, H: fs * lh * lines.length + pad * 1.4 };
  };
  let dims = null;
  const def = {
    id: opts.id,
    name: opts.name || opts.text,
    group: opts.group,
    size: opts.size,
    outline: opts.outline,
    outlineColor: opts.outlineColor,
    shadow: opts.shadow,
    holo: opts.holo,
    get ratio() {
      dims ||= measure();
      return dims.H / dims.W;
    },
    draw(ctx, w) {
      dims ||= measure();
      const k = w / dims.W;
      ctx.scale(k, k);
      if (opts.bg) {
        rrect(ctx, fs * 0.06, fs * 0.06, dims.W - fs * 0.12, dims.H - fs * 0.12, (opts.bgRadius ?? 0.25) * fs);
        ctx.fillStyle = opts.bg;
        ctx.fill();
        if (opts.bgStroke) {
          ctx.lineWidth = fs * 0.07;
          ctx.strokeStyle = opts.bgStroke;
          ctx.stroke();
        }
      }
      ctx.font = font;
      if (opts.letterSpacing && 'letterSpacing' in ctx) ctx.letterSpacing = `${opts.letterSpacing}em`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((l, i) => {
        const y = pad * 0.7 + fs * lh * (i + 0.5);
        const x = dims.W / 2;
        if (opts.shadowColor) {
          ctx.fillStyle = opts.shadowColor;
          ctx.fillText(l, x + fs * 0.06, y + fs * 0.07);
        }
        if (opts.stroke) {
          ctx.lineJoin = 'round';
          ctx.lineWidth = fs * (opts.strokeWidth || 0.14);
          ctx.strokeStyle = opts.stroke;
          ctx.strokeText(l, x, y);
        }
        if (opts.gradient) {
          const g = ctx.createLinearGradient(0, y - fs * 0.45, 0, y + fs * 0.45);
          opts.gradient.forEach((c, j, a) => g.addColorStop(j / (a.length - 1), c));
          ctx.fillStyle = g;
        } else ctx.fillStyle = opts.color || '#222';
        ctx.fillText(l, x, y);
      });
    },
  };
  return def;
}

/** Simple seeded RNG for deterministic "hand-made" jitter in frames. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Speckle/grain texture over an area (paper feel). */
export function speckle(ctx, x, y, w, h, { n = 1400, color = 'rgba(0,0,0,0.05)', size = 2, seed = 7 } = {}) {
  const r = rng(seed);
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) ctx.fillRect(x + r() * w, y + r() * h, size * (0.5 + r()), size * (0.5 + r()));
}
