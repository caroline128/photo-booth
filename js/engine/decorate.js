// The 落書き (decorate) board: a print preview you can drop stickers on
// (drag / pinch / wheel / corner handle to move, scale, rotate) and doodle
// over with pens. Everything is stored in print pixels and baked at full
// resolution at the end.

import { h, canvas as mkCanvas, clamp, uid } from '../core/util.js';
import { artBitmap, artRatio } from '../art/render.js';
import { drawStroke } from './pens.js';
import { sfx } from '../core/audio.js';

const THUMB = 240;

export class Decorator {
  constructor({ base, onChange }) {
    this.base = base;
    this.W = base.width;
    this.H = base.height;
    this.stickers = [];
    this.strokes = [];
    this.history = [];
    this.mode = 'sticker';
    this.pen = { pen: 'solid', color: '#ff4fa3', width: 14 };
    this.selected = null;
    this.onChange = onChange || (() => {});
    this.k = 1;
    this.view = { x: 0, y: 0, w: this.W, h: this.H }; // visible region (print px)

    this.baseCv = h('canvas.deco-base');
    this.penCv = h('canvas.deco-pen');
    this.activeCv = h('canvas.deco-active');
    this.layer = h('div.deco-stickers');
    this.board = h('div.deco-board', this.baseCv, this.penCv, this.activeCv, this.layer);
    this.el = h('div.deco', this.board);

    this._bindPen();
    this.board.addEventListener('pointerdown', (e) => {
      if (this.mode === 'sticker' && (e.target === this.board || e.target === this.layer || e.target.tagName === 'CANVAS')) this.select(null);
    });
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(this.el);
    this._onKey = (e) => {
      if (!this.selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (document.activeElement?.tagName === 'INPUT') return;
        e.preventDefault();
        this.remove(this.selected);
      }
    };
    window.addEventListener('keydown', this._onKey);
  }

  destroy() {
    this.ro.disconnect();
    window.removeEventListener('keydown', this._onKey);
  }

  /** Zoom the board onto a region of the print (null = whole print). */
  setView(rect) {
    this.view = rect ? { ...rect } : { x: 0, y: 0, w: this.W, h: this.H };
    this.layout();
  }

  setMode(mode) {
    this.mode = mode;
    this.el.dataset.mode = mode;
    if (mode !== 'sticker') this.select(null);
  }

  layout() {
    const r = this.el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const v = this.view;
    const s = Math.min(r.width / v.w, r.height / v.h);
    const dw = Math.floor(v.w * s);
    const dh = Math.floor(v.h * s);
    this.k = s;
    Object.assign(this.board.style, { width: dw + 'px', height: dh + 'px' });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [this.baseCv, this.penCv, this.activeCv]) {
      c.width = Math.round(dw * dpr);
      c.height = Math.round(dh * dpr);
    }
    this.pk = (dw * dpr) / v.w;
    const bctx = this.baseCv.getContext('2d');
    bctx.imageSmoothingQuality = 'high';
    bctx.drawImage(this.base, v.x, v.y, v.w, v.h, 0, 0, this.baseCv.width, this.baseCv.height);
    this.redrawPen();
    this.stickers.forEach((s) => this.place(s));
  }

  // ---------------------------------------------------------------- history
  snapshot() {
    this.history.push({ stickers: this.stickers.map((s) => ({ ...s, el: undefined })), strokes: this.strokes.slice() });
    if (this.history.length > 60) this.history.shift();
  }

  undo() {
    const snap = this.history.pop();
    if (!snap) return false;
    this.layer.innerHTML = '';
    this.stickers = [];
    this.selected = null;
    this.strokes = snap.strokes;
    for (const s of snap.stickers) this._mount(s);
    this.redrawPen();
    this.onChange();
    return true;
  }

  clear() {
    if (!this.stickers.length && !this.strokes.length) return;
    this.snapshot();
    this.layer.innerHTML = '';
    this.stickers = [];
    this.strokes = [];
    this.selected = null;
    this.redrawPen();
    this.onChange();
  }

  get count() {
    return this.stickers.length + this.strokes.length;
  }

  // ---------------------------------------------------------------- stickers
  async add(def, opts = {}) {
    this.snapshot();
    const v = this.view;
    const base = Math.min(v.w, v.h);
    const w = opts.w ?? base * (def.size || 0.3);
    const s = {
      id: uid(),
      def,
      x: opts.x ?? v.x + v.w / 2 + (Math.random() - 0.5) * v.w * 0.3,
      y: opts.y ?? v.y + v.h / 2 + (Math.random() - 0.5) * v.h * 0.3,
      w,
      rot: opts.rot ?? (Math.random() - 0.5) * 0.35,
      flip: false,
    };
    await this._mount(s);
    this.select(s);
    sfx.pop();
    this.onChange();
    return s;
  }

  async _mount(s) {
    const bmp = await artBitmap(s.def, THUMB);
    const img = h('img', { src: bmp.toDataURL(), alt: s.def.name || '', draggable: false });
    s.fw = bmp.width / THUMB;
    s.fh = bmp.height / THUMB;
    const del = h('button.stk-del', { title: '删除', 'aria-label': '删除贴纸' }, '×');
    const flip = h('button.stk-flip', { title: '翻转', 'aria-label': '翻转贴纸' }, '⇋');
    const rot = h('div.stk-rot', { title: '拖动旋转/缩放' });
    s.el = h('div.stk', img, del, flip, rot);
    this.layer.appendChild(s.el);
    this.stickers.push(s);
    this.place(s);
    del.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.remove(s);
    });
    flip.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.snapshot();
      s.flip = !s.flip;
      this.place(s);
    });
    this._bindSticker(s, rot);
  }

  place(s) {
    if (!s.el) return;
    const k = this.k;
    const ew = s.w * s.fw * k;
    const eh = s.w * s.fh * k;
    Object.assign(s.el.style, {
      width: ew + 'px',
      height: eh + 'px',
      transform: `translate(${(s.x - this.view.x) * k - ew / 2}px, ${(s.y - this.view.y) * k - eh / 2}px) rotate(${s.rot}rad)`,
    });
    s.el.firstChild.style.transform = s.flip ? 'scaleX(-1)' : '';
  }

  select(s) {
    if (this.selected?.el) this.selected.el.classList.remove('sel');
    this.selected = s;
    if (s?.el) {
      s.el.classList.add('sel');
      this.layer.appendChild(s.el); // bring to front
      this.stickers = this.stickers.filter((x) => x !== s).concat(s);
    }
  }

  remove(s) {
    this.snapshot();
    s.el?.remove();
    this.stickers = this.stickers.filter((x) => x !== s);
    if (this.selected === s) this.selected = null;
    sfx.back();
    this.onChange();
  }

  _toPrint(e) {
    const r = this.board.getBoundingClientRect();
    const v = this.view;
    return { x: v.x + ((e.clientX - r.left) / r.width) * v.w, y: v.y + ((e.clientY - r.top) / r.height) * v.h };
  }

  _bindSticker(s, rotHandle) {
    const pointers = new Map();
    let start = null;
    const el = s.el;
    const begin = () => {
      const pts = [...pointers.values()];
      start = { x: s.x, y: s.y, w: s.w, rot: s.rot, pts: pts.map((p) => ({ ...p })) };
    };
    el.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'sticker' || e.target.closest('button') || e.target === rotHandle) return;
      e.preventDefault();
      e.stopPropagation();
      if (!pointers.size) this.snapshot();
      this.select(s);
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, this._toPrint(e));
      begin();
    });
    el.addEventListener('pointermove', (e) => {
      if (!pointers.has(e.pointerId) || !start) return;
      pointers.set(e.pointerId, this._toPrint(e));
      const pts = [...pointers.values()];
      if (pts.length === 1 && start.pts.length === 1) {
        s.x = clamp(start.x + pts[0].x - start.pts[0].x, 0, this.W);
        s.y = clamp(start.y + pts[0].y - start.pts[0].y, 0, this.H);
      } else if (pts.length >= 2 && start.pts.length >= 2) {
        const [a0, b0] = start.pts;
        const [a1, b1] = pts;
        const d0 = Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1;
        const d1 = Math.hypot(b1.x - a1.x, b1.y - a1.y);
        s.w = clamp(start.w * (d1 / d0), 30, this.W * 1.4);
        s.rot = start.rot + Math.atan2(b1.y - a1.y, b1.x - a1.x) - Math.atan2(b0.y - a0.y, b0.x - a0.x);
        s.x = clamp(start.x + (a1.x + b1.x) / 2 - (a0.x + b0.x) / 2, 0, this.W);
        s.y = clamp(start.y + (a1.y + b1.y) / 2 - (a0.y + b0.y) / 2, 0, this.H);
      }
      this.place(s);
    });
    const up = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size) begin();
      else start = null;
    };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener(
      'wheel',
      (e) => {
        if (this.mode !== 'sticker') return;
        e.preventDefault();
        s.w = clamp(s.w * (e.deltaY > 0 ? 0.93 : 1.07), 30, this.W * 1.4);
        this.place(s);
      },
      { passive: false },
    );

    // corner handle: rotate + scale around the centre
    let rs = null;
    rotHandle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.snapshot();
      this.select(s);
      rotHandle.setPointerCapture(e.pointerId);
      const p = this._toPrint(e);
      rs = { w: s.w, rot: s.rot, d: Math.hypot(p.x - s.x, p.y - s.y) || 1, a: Math.atan2(p.y - s.y, p.x - s.x) };
    });
    rotHandle.addEventListener('pointermove', (e) => {
      if (!rs) return;
      const p = this._toPrint(e);
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      s.w = clamp(rs.w * (d / rs.d), 30, this.W * 1.4);
      s.rot = rs.rot + Math.atan2(p.y - s.y, p.x - s.x) - rs.a;
      this.place(s);
    });
    const rup = () => (rs = null);
    rotHandle.addEventListener('pointerup', rup);
    rotHandle.addEventListener('pointercancel', rup);
  }

  // ---------------------------------------------------------------- pens
  _bindPen() {
    let cur = null;
    const cv = this.activeCv;
    cv.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'pen') return;
      e.preventDefault();
      cv.setPointerCapture(e.pointerId);
      const p = this._toPrint(e);
      cur = { ...this.pen, seed: (Math.random() * 1e9) | 0, points: [[p.x, p.y]] };
      this.snapshot();
      this._drawActive(cur);
    });
    cv.addEventListener('pointermove', (e) => {
      if (!cur) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const ev of evs) {
        const p = this._toPrint(ev);
        const last = cur.points[cur.points.length - 1];
        if (Math.hypot(p.x - last[0], p.y - last[1]) > 2) cur.points.push([p.x, p.y]);
      }
      if (cur.pen === 'eraser') {
        // erase directly on the committed layer
        this.redrawPen(cur);
      } else this._drawActive(cur);
    });
    const end = () => {
      if (!cur) return;
      this.strokes.push(cur);
      cur = null;
      this.activeCv.getContext('2d').clearRect(0, 0, this.activeCv.width, this.activeCv.height);
      this.redrawPen();
      this.onChange();
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
  }

  _drawActive(stroke) {
    const ctx = this.activeCv.getContext('2d');
    ctx.clearRect(0, 0, this.activeCv.width, this.activeCv.height);
    ctx.save();
    ctx.translate(-this.view.x * this.pk, -this.view.y * this.pk);
    drawStroke(ctx, stroke, this.pk);
    ctx.restore();
  }

  redrawPen(extra) {
    const ctx = this.penCv.getContext('2d');
    ctx.clearRect(0, 0, this.penCv.width, this.penCv.height);
    ctx.save();
    ctx.translate(-this.view.x * this.pk, -this.view.y * this.pk);
    for (const s of this.strokes) drawStroke(ctx, s, this.pk);
    if (extra) drawStroke(ctx, extra, this.pk);
    ctx.restore();
  }

  // ---------------------------------------------------------------- output
  async bake() {
    const c = mkCanvas(this.W, this.H);
    const ctx = c.getContext('2d');
    ctx.drawImage(this.base, 0, 0);
    if (this.strokes.length) {
      const pc = mkCanvas(this.W, this.H);
      const pctx = pc.getContext('2d');
      for (const s of this.strokes) drawStroke(pctx, s, 1);
      ctx.drawImage(pc, 0, 0);
    }
    for (const s of this.stickers) {
      const bmp = await artBitmap(s.def, s.w);
      const scale = s.w / (bmp.width - bmp.margin * 2);
      const bw = bmp.width * scale;
      const bh = bmp.height * scale;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      if (s.flip) ctx.scale(-1, 1);
      ctx.drawImage(bmp, -bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }
    return c;
  }
}

/** Build a text-stamp art definition with a theme text style. */
export function textArt(text, style = {}) {
  const font = style.font || '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif';
  const weight = style.weight || 400;
  const lines = String(text).split('\n').slice(0, 3);
  const fs = 100;
  const measure = mkCanvas(10, 10).getContext('2d');
  measure.font = `${weight} ${fs}px ${font}`;
  const tw = Math.max(...lines.map((l) => measure.measureText(l).width), fs);
  const pad = fs * 0.35;
  const W = tw + pad * 2;
  const H = fs * 1.18 * lines.length + pad * 1.2;
  // (callers await ensureText() first so the measurement uses the real font)
  return {
    id: 'txt-' + uid(),
    name: text,
    fontSpec: { font: `${weight} ${fs}px ${font}`, text },
    ratio: H / W,
    size: clamp(0.12 * Math.sqrt(tw / fs), 0.16, 0.6),
    outline: style.outline ?? 0.035,
    outlineColor: style.outlineColor || '#fff',
    draw(ctx, w, hgt) {
      const k = w / W;
      ctx.scale(k, k);
      ctx.font = `${weight} ${fs}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      lines.forEach((l, i) => {
        const y = pad * 0.6 + fs * 1.18 * (i + 0.5);
        if (style.stroke) {
          ctx.lineJoin = 'round';
          ctx.lineWidth = fs * (style.strokeWidth || 0.16);
          ctx.strokeStyle = style.stroke;
          ctx.strokeText(l, W / 2, y);
        }
        if (style.gradient) {
          const g = ctx.createLinearGradient(0, y - fs / 2, 0, y + fs / 2);
          style.gradient.forEach((c, j, a) => g.addColorStop(j / (a.length - 1), c));
          ctx.fillStyle = g;
        } else ctx.fillStyle = style.color || '#222';
        ctx.fillText(l, W / 2, y);
      });
      void hgt;
    },
  };
}

export { artRatio };
