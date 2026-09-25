// Small shared helpers: DOM building, math, timing, seeded randomness.

/**
 * Hyperscript-style element builder.
 *   h('button.btn.primary', { onclick }, 'OK')
 * Props starting with "on" become listeners, `style` may be an object,
 * `dataset` an object, anything else is set as attribute/property.
 */
export function h(tag, props, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props);
    props = null;
  }
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'style' && typeof v === 'object') {
        for (const [sk, sv] of Object.entries(v)) {
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else el.style[sk] = sv;
        }
      }
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
      else if (k === 'html') el.innerHTML = v;
      else if (k in el && typeof v !== 'string') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  appendChildren(el, children);
  return el;
}

function appendChildren(el, children) {
  for (const c of children) {
    if (c == null || c === false) continue;
    if (Array.isArray(c)) appendChildren(el, c);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const TAU = Math.PI * 2;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/** Deterministic PRNG (mulberry32) so glitter pens re-render identically at print time. */
export function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const uid = () => Math.random().toString(36).slice(2, 9);

export function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/** Wait for a CSS animation/transition on `el` or a timeout, whichever comes first. */
export function waitAnim(el, ms = 1200, type = 'animationend') {
  return new Promise((resolve) => {
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      el.removeEventListener(type, fin);
      resolve();
    };
    el.addEventListener(type, fin);
    setTimeout(fin, ms);
  });
}

/** Format a date like the stamps on booth prints. */
export function stamp(date = new Date(), style = 'dot') {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (style === 'ccd') return `'${String(y).slice(2)} ${m} ${d}`;
  if (style === 'slash') return `${y}/${m}/${d}`;
  return `${y}.${m}.${d}`;
}

/**
 * Cancellable countdown helper. Calls onTick(secondsLeft) every second,
 * resolves when it reaches 0 or when `skip()` is called.
 */
export function countdown(seconds, onTick) {
  let timer = null;
  let resolveFn;
  let left = seconds;
  const p = new Promise((resolve) => {
    resolveFn = resolve;
    onTick?.(left);
    timer = setInterval(() => {
      left -= 1;
      onTick?.(left);
      if (left <= 0) {
        clearInterval(timer);
        resolve('done');
      }
    }, 1000);
  });
  p.skip = () => {
    clearInterval(timer);
    resolveFn('skipped');
  };
  p.cancel = () => {
    clearInterval(timer);
    resolveFn('cancelled');
  };
  return p;
}

/** Download a canvas as PNG. */
export function downloadCanvas(cnv, filename) {
  return new Promise((resolve) => {
    cnv.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = h('a', { href: url, download: filename });
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve();
    }, 'image/png');
  });
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export const svgUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

/** Rounded rectangle path helper for 2D contexts. */
export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Simple event emitter mixin. */
export class Emitter {
  constructor() {
    this._l = {};
  }
  on(ev, fn) {
    (this._l[ev] ||= []).push(fn);
    return () => this.off(ev, fn);
  }
  off(ev, fn) {
    this._l[ev] = (this._l[ev] || []).filter((f) => f !== fn);
  }
  emit(ev, ...args) {
    for (const f of this._l[ev] || []) f(...args);
  }
}
