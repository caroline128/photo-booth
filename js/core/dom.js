// Tiny DOM builder: h('button.btn.primary#go', { onclick }, 'Go', child, [more]).

const PROPS = new Set(['value', 'checked', 'disabled', 'selected', 'hidden', 'textContent', 'htmlFor', 'tabIndex', 'indeterminate']);
const SVG_NS = 'http://www.w3.org/2000/svg';

function isAttrs(v) {
  return v && typeof v === 'object' && !(v instanceof Node) && !Array.isArray(v);
}

function parse(sel) {
  const m = sel.match(/^([a-z0-9-]*)(.*)$/i);
  return { tag: m[1] || 'div', parts: m[2].match(/[.#][^.#]+/g) || [] };
}

function applyAttrs(el, attrs, svg) {
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') {
      for (const c of String(v).split(/\s+/)) if (c) el.classList.add(c);
    } else if (k === 'style') {
      if (typeof v === 'string') el.style.cssText += v;
      else
        for (const [p, val] of Object.entries(v)) {
          if (val == null) continue;
          if (p.startsWith('--')) el.style.setProperty(p, String(val));
          else el.style[p] = val;
        }
    } else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (!svg && PROPS.has(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
}

export function append(el, children) {
  for (const c of [children].flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function h(sel, ...rest) {
  const attrs = isAttrs(rest[0]) ? rest.shift() : null;
  const { tag, parts } = parse(sel);
  const el = document.createElement(tag);
  for (const p of parts) p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1));
  if (attrs) applyAttrs(el, attrs, false);
  return append(el, rest);
}

export function s(sel, ...rest) {
  const attrs = isAttrs(rest[0]) ? rest.shift() : null;
  const { tag, parts } = parse(sel);
  const el = document.createElementNS(SVG_NS, tag);
  for (const p of parts) p[0] === '.' ? el.classList.add(p.slice(1)) : el.setAttribute('id', p.slice(1));
  if (attrs) applyAttrs(el, attrs, true);
  return append(el, rest);
}

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// Parse a trusted SVG string into a node.
export function svgNode(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

// Listen once per signal lifetime; returns an unsubscribe function.
export function on(target, type, fn, opts = {}) {
  target.addEventListener(type, fn, opts);
  return () => target.removeEventListener(type, fn, opts);
}
