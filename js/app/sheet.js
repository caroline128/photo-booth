// The print preview on the stage, re-composed at the stage's size.

import { h } from '../core/dom.js';
import { dpr } from '../core/util.js';
import { compose } from '../photo/compose.js';

export class SheetView {
  // getPhotos(scale, slots) → canvases for each slot (raw, placeholder or filtered)
  constructor(S, getPhotos) {
    this.S = S;
    this.getPhotos = getPhotos;
    this.canvas = h('canvas.sheet');
    this.el = h('div.sheet-wrap', this.canvas);
    this.ro = new ResizeObserver(() => this.queue());
    this.ro.observe(S.stage.inner);
    this.pending = 0;
  }

  scale() {
    const { L } = this.S;
    const { w, h } = this.S.stage.size();
    return Math.min(1, Math.min(w / L.W, h / L.H) * dpr());
  }

  queue() {
    clearTimeout(this.pending);
    this.pending = setTimeout(() => this.render(), 60);
  }

  async render() {
    const { L, frame, info } = this.S;
    const scale = this.scale();
    const slots = frame.geometry(L, info).slots;
    const photos = await this.getPhotos(scale, slots);
    const token = (this.token = {});
    // compose off-screen, then swap in, so the preview never flashes blank
    const { canvas: out } = await compose({ L, frame, photos, info, scale });
    if (token !== this.token) return;
    this.canvas.width = out.width;
    this.canvas.height = out.height;
    this.canvas.getContext('2d').drawImage(out, 0, 0);
    this.canvas.style.aspectRatio = `${L.W} / ${L.H}`;
  }

  destroy() {
    this.ro.disconnect();
    clearTimeout(this.pending);
  }
}
