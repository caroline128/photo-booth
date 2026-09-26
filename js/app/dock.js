// The dock sits where claude.ai's composer is. Each step puts its controls
// here; helpers below build the common control shapes.

import { h } from '../core/dom.js';
import { sfx } from '../core/audio.js';
import { deferred } from '../core/util.js';
import { icon } from '../art/icons.js';

export class Dock {
  constructor() {
    this.el = h('div.dock');
  }

  set(nodes, cls = '') {
    const card = h(`div.dock-card${cls ? '.' + cls.split(' ').join('.') : ''}`, nodes);
    this.el.replaceChildren(card);
    card.animate?.([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: 'ease-out' });
    return card;
  }

  clear() {
    this.el.replaceChildren();
  }
}

export function section(label, ...content) {
  return h('div.dock-sec', label ? h('div.dock-label', label) : null, ...content);
}

export function actions(...buttons) {
  return h('div.dock-actions', ...buttons);
}

export function button(label, { primary = false, icon: ico = null, cls = '', title = '' } = {}) {
  return h(`button.btn${primary ? '.primary' : ''}${cls ? '.' + cls : ''}`, { type: 'button', title: title || null }, ico ? icon(ico, { size: 18 }) : null, label);
}

// Segmented control. opts: [{ id, label, icon }]
export function segmented(opts, value, onChange, { label = '' } = {}) {
  const el = h('div.seg', { role: 'radiogroup', 'aria-label': label || null });
  const paint = () => {
    for (const b of el.children) b.setAttribute('aria-checked', String(b.dataset.id === value));
  };
  for (const o of opts) {
    const b = h('button.seg-opt', { type: 'button', role: 'radio', dataset: { id: o.id } }, o.icon ? icon(o.icon, { size: 16 }) : null, o.label);
    b.addEventListener('click', () => {
      if (value === o.id) return;
      value = o.id;
      paint();
      sfx.tick();
      onChange(o.id);
    });
    el.append(b);
  }
  paint();
  el.set = (v) => {
    value = v;
    paint();
  };
  return el;
}

// Resolve with the key of whichever button is clicked first.
export function choose(map, signal) {
  const d = deferred(signal);
  const offs = Object.entries(map).map(([key, btn]) => {
    const fn = () => d.resolve(key);
    btn.addEventListener('click', fn);
    return () => btn.removeEventListener('click', fn);
  });
  return d.promise.finally(() => offs.forEach((f) => f()));
}

export const clicked = (btn, signal) => choose({ ok: btn }, signal);
