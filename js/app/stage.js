// The right-hand panel, styled like a claude.ai artifact: a header with an
// icon, title and tools, and a body that shows one view at a time.

import { h } from '../core/dom.js';
import { icon } from '../art/icons.js';

export class Stage {
  constructor() {
    this.ico = h('span.stage-ico');
    this.title = h('b.stage-title');
    this.sub = h('small.stage-sub');
    this.tools = h('div.stage-tools');
    this.inner = h('div.stage-inner');
    this.body = h('div.stage-body', this.inner);
    this.el = h(
      'section.stage',
      { 'aria-label': '预览' },
      h('header.stage-head', this.ico, h('div.stage-titles', this.title, this.sub), h('span.grow'), this.tools),
      this.body,
    );
  }

  head({ icon: name, title, sub = '' }) {
    this.ico.replaceChildren(icon(name || 'image', { size: 18 }));
    this.title.textContent = title;
    this.sub.textContent = sub;
  }

  setTools(...nodes) {
    this.tools.replaceChildren(...nodes.flat().filter(Boolean));
  }

  show(node, cls = '') {
    this.inner.className = `stage-inner ${cls}`.trim();
    this.inner.replaceChildren(node);
    node.animate?.([{ opacity: 0, transform: 'scale(0.985)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out' });
    return node;
  }

  // Inner box size in CSS px (for sizing canvases).
  size() {
    const r = this.inner.getBoundingClientRect();
    return { w: Math.max(80, r.width), h: Math.max(80, r.height) };
  }
}

// Call cb(w, h) with the largest box of `aspect` that fits the stage body,
// now and whenever the stage resizes. Returns a release function.
export function observeFit(stage, aspect, cb, { maxW = Infinity } = {}) {
  const fit = () => {
    const { w, h } = stage.size();
    let cw = Math.min(w, maxW), ch = cw / aspect;
    if (ch > h) {
      ch = h;
      cw = ch * aspect;
    }
    cb(Math.floor(cw), Math.floor(ch));
  };
  const ro = new ResizeObserver(fit);
  ro.observe(stage.inner);
  requestAnimationFrame(fit);
  return () => ro.disconnect();
}

// A canvas that keeps an aspect ratio and fits the stage body.
export function fitCanvas(stage, aspect, opts = {}) {
  const c = document.createElement('canvas');
  c.className = 'fit';
  c.release = observeFit(
    stage,
    aspect,
    (w, h) => {
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      c.dispatchEvent(new CustomEvent('fit', { detail: { w, h } }));
    },
    opts,
  );
  return c;
}
