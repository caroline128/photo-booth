// Live viewfinder on the stage: the camera (or 小芒) through the beauty
// shader, cropped to the photo aspect, with countdown and pose overlays.

import { h } from '../core/dom.js';
import { dpr } from '../core/util.js';
import { renderLive } from '../photo/fx.js';
import { cropFor } from '../photo/camera.js';
import { fitCanvas } from './stage.js';
import { SparkIcon } from '../art/spark.js';
import { drawProp, propById } from './props.js';

export class LiveView {
  constructor(S) {
    this.S = S;
    this.canvas = fitCanvas(S.stage, S.L.aspect, { maxW: 1100 });
    this.canvas.classList.add('live-canvas');
    this.canvas.addEventListener('fit', (e) => {
      // the preview only needs to look sharp; captures come from the full video
      const k = Math.min(dpr(), 760 / e.detail.w);
      this.canvas.width = Math.round(e.detail.w * k);
      this.canvas.height = Math.round(e.detail.h * k);
      this.wrap.style.width = `${Math.floor(e.detail.w)}px`;
      this.wrap.style.height = `${Math.floor(e.detail.h)}px`;
    });
    this.num = h('div.live-count', { 'aria-live': 'assertive' });
    this.hint = h('div.live-hint');
    this.counter = h('div.live-counter');
    this.flashEl = h('div.live-flash');
    this.corners = h('div.live-corners', h('i'), h('i'), h('i'), h('i'));
    this.wrap = h('div.live', this.canvas, this.corners, this.counter, this.num, this.hint, this.flashEl);
    this.el = this.wrap;
    this.running = true;
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loop(now) {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    // ~30 fps is plenty for a viewfinder and leaves the main thread free
    if (now - (this.last || 0) < 30) return;
    this.last = now;
    const src = this.S.source;
    if (src && this.canvas.width > 4) {
      src.update?.(now);
      if (src.w && src.h) {
        renderLive(src.el, this.canvas, { crop: cropFor(src.w, src.h, this.S.L.aspect), mirror: src.mirror, beauty: this.S.beauty });
        if (this.S.prop && this.S.prop !== 'none') drawProp(this.canvas.getContext('2d'), propById(this.S.prop), this.canvas.width, this.canvas.height, { live: true });
      }
    }
  }

  count(n) {
    this.num.replaceChildren();
    if (n == null) return;
    const el = h('span', String(n));
    this.num.append(el);
    el.animate?.(
      [
        { opacity: 0, transform: 'scale(1.6)' },
        { opacity: 1, transform: 'scale(1)', offset: 0.18 },
        { opacity: 1, transform: 'scale(0.96)', offset: 0.8 },
        { opacity: 0, transform: 'scale(0.9)' },
      ],
      { duration: 980, easing: 'ease-out', fill: 'forwards' },
    );
  }

  pose(text, counter = '') {
    this.hint.replaceChildren();
    this.counter.textContent = counter;
    this.counter.hidden = !counter;
    if (!text) return;
    const s = new SparkIcon({ size: 16, color: '#fff', mode: 'breathe' });
    this.hint.append(s.el, h('span', text));
  }

  flash() {
    this.flashEl.animate?.([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease-out' });
  }

  stop() {
    this.running = false;
    this.canvas.release?.();
  }
}
