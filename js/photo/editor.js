// The doodle editor: stickers/text you can drag, pinch, rotate and flip,
// pen strokes on their own ink layer (so the eraser never touches photos),
// and undo/redo. Everything is stored in sheet pixels and re-rendered at
// full resolution for the print.

import { canvas, clamp, TAU, dpr } from '../core/util.js';
import { needAll } from '../core/fonts.js';
import { drawStroke } from './pens.js';

const HANDLE = 14; // css px
let uid = 0;

// White die-cut edge (with a soft drop shadow) around a bitmap.
// Returns the new canvas; the source sits at (m, m) inside it.
function outlined(src, pad, color = '#ffffff') {
  const m = Math.ceil(pad * 2);
  const sil = canvas(src.width + m * 2, src.height + m * 2);
  const sx = sil.getContext('2d');
  const steps = 20;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TAU;
    sx.drawImage(src, m + Math.cos(a) * pad, m + Math.sin(a) * pad);
  }
  sx.globalCompositeOperation = 'source-in';
  sx.fillStyle = color;
  sx.fillRect(0, 0, sil.width, sil.height);
  const c = canvas(sil.width, sil.height);
  const x = c.getContext('2d');
  x.shadowColor = 'rgba(20,20,19,0.28)';
  x.shadowBlur = pad * 0.9;
  x.shadowOffsetY = pad * 0.35;
  x.drawImage(sil, 0, 0);
  x.shadowColor = 'transparent';
  x.drawImage(src, m, m);
  return { img: c, pad: m };
}

// Draw a sticker definition at w×h (optionally with its die-cut edge).
export function renderDef(def, w, hh) {
  const c = canvas(Math.max(1, w), Math.max(1, hh));
  def.draw(c.getContext('2d'), c.width, c.height);
  if (!def.outline) return { img: c, pad: 0 };
  return outlined(c, Math.max(2, Math.round(w * 0.035)));
}

export class Editor {
  constructor({ base, L, onChange }) {
    this.base = base;
    this.L = L;
    this.onChange = onChange || (() => {});
    this.items = [];
    this.strokes = [];
    this.undoStack = [];
    this.redoStack = [];
    this.sel = null;
    this.mode = 'select';
    this.pen = { pen: 'ink', color: '#141413', size: 8 };
    this.cache = new Map();
    this.pointers = new Map();
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'editor-canvas';
    this.canvas.tabIndex = 0;
    this.canvas.setAttribute('role', 'application');
    this.canvas.setAttribute('aria-label', '涂鸦画布：拖动贴纸，双指缩放旋转，Delete 删除');
    this.ink = canvas(4, 4);
    this.s = 1;
    this.dirty = false;
    this.bind();
  }

  // ------------------------------------------------------------ sizing

  resize(cssW, cssH) {
    if (cssW === this.cssW && cssH === this.cssH) return;
    this.cssW = cssW;
    this.cssH = cssH;
    const k = Math.min(dpr(), 2400 / cssH);
    this.canvas.width = Math.round(cssW * k);
    this.canvas.height = Math.round(cssH * k);
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.css = cssW / this.L.W; // css px per sheet px
    this.s = this.canvas.width / this.L.W; // device px per sheet px
    this.ink.width = this.canvas.width;
    this.ink.height = this.canvas.height;
    this.cache.clear();
    this.redrawInk();
    this.render();
  }

  redrawInk() {
    const x = this.ink.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, this.ink.width, this.ink.height);
    x.setTransform(this.s, 0, 0, this.s, 0, 0);
    for (const st of this.strokes) drawStroke(x, st);
  }

  // ------------------------------------------------------------ render

  bitmap(it, pxW) {
    const bucket = Math.max(32, Math.ceil(pxW / 48) * 48);
    const key = `${it.def.id}|${bucket}`;
    let b = this.cache.get(key);
    if (!b) {
      b = renderDef(it.def, bucket, Math.round(bucket * it.def.ratio));
      this.cache.set(key, b);
      if (this.cache.size > 120) this.cache.delete(this.cache.keys().next().value);
    }
    return b;
  }

  drawItem(ctx, it, s) {
    const w = it.w * s, hh = w * it.def.ratio;
    const b = this.bitmap(it, w);
    const k = w / (b.img.width - b.pad * 2);
    ctx.save();
    ctx.translate(it.x * s, it.y * s);
    ctx.rotate(it.rot);
    if (it.flip) ctx.scale(-1, 1);
    ctx.drawImage(b.img, -w / 2 - b.pad * k, -hh / 2 - b.pad * k, b.img.width * k, b.img.height * k);
    ctx.restore();
  }

  render() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => {
      this.raf = 0;
      this.paint();
    });
  }

  paint() {
    const ctx = this.canvas.getContext('2d');
    const { s } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.base, 0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.ink, 0, 0);
    if (this.live && this.live.pen !== 'eraser') {
      ctx.save();
      ctx.setTransform(s, 0, 0, s, 0, 0);
      drawStroke(ctx, this.live);
      ctx.restore();
    }
    for (const it of this.items) this.drawItem(ctx, it, s);
    if (this.sel) this.paintSelection(ctx);
  }

  corners(it) {
    const hw = it.w / 2, hh = (it.w * it.def.ratio) / 2;
    const c = Math.cos(it.rot), sn = Math.sin(it.rot);
    const pt = (x, y) => [it.x + x * c - y * sn, it.y + x * sn + y * c];
    return { tl: pt(-hw, -hh), tr: pt(hw, -hh), br: pt(hw, hh), bl: pt(-hw, hh) };
  }

  paintSelection(ctx) {
    const it = this.sel;
    const { s } = this;
    const k = dpr();
    const q = this.corners(it);
    ctx.save();
    ctx.lineWidth = 1.5 * k;
    ctx.strokeStyle = '#d97757';
    ctx.setLineDash([6 * k, 5 * k]);
    ctx.beginPath();
    for (const p of [q.tl, q.tr, q.br, q.bl]) ctx.lineTo(p[0] * s, p[1] * s);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    const r = HANDLE * k;
    const handle = ([x, y], fill, glyph) => {
      ctx.fillStyle = fill;
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 4 * k;
      ctx.beginPath();
      ctx.arc(x * s, y * s, r, 0, TAU);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2 * k;
      ctx.lineCap = 'round';
      glyph(x * s, y * s, r * 0.42);
    };
    handle(q.tl, '#141413', (x, y, g) => {
      ctx.beginPath();
      ctx.moveTo(x - g, y - g);
      ctx.lineTo(x + g, y + g);
      ctx.moveTo(x + g, y - g);
      ctx.lineTo(x - g, y + g);
      ctx.stroke();
    });
    handle(q.br, '#d97757', (x, y, g) => {
      ctx.beginPath();
      ctx.arc(x, y, g, -Math.PI * 0.9, Math.PI * 0.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + g * 0.2, y + g * 1.05);
      ctx.lineTo(x - g * 0.45, y + g * 0.9);
      ctx.lineTo(x - g * 0.05, y + g * 0.35);
      ctx.stroke();
    });
    ctx.restore();
  }

  // ------------------------------------------------------------ state

  snapshot() {
    return { items: this.items.map((i) => ({ ...i })), strokes: this.strokes.slice() };
  }

  commit(before) {
    this.undoStack.push(before);
    if (this.undoStack.length > 60) this.undoStack.shift();
    this.redoStack.length = 0;
    this.dirty = true;
    this.emit();
  }

  restore(snap) {
    this.items = snap.items.map((i) => ({ ...i }));
    this.strokes = snap.strokes.slice();
    if (this.sel) this.sel = this.items.find((i) => i.id === this.sel.id) || null;
    this.redrawInk();
    this.render();
    this.emit();
  }

  undo() {
    if (!this.undoStack.length) return;
    this.redoStack.push(this.snapshot());
    this.restore(this.undoStack.pop());
  }

  redo() {
    if (!this.redoStack.length) return;
    this.undoStack.push(this.snapshot());
    this.restore(this.redoStack.pop());
  }

  clear() {
    if (!this.items.length && !this.strokes.length) return;
    const before = this.snapshot();
    this.items = [];
    this.strokes = [];
    this.sel = null;
    this.redrawInk();
    this.render();
    this.commit(before);
  }

  emit() {
    this.onChange({
      sel: this.sel,
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      count: this.items.length + this.strokes.length,
    });
  }

  async add(def, { at = null } = {}) {
    await needAll(def.fonts || []);
    const { L } = this;
    const short = Math.min(L.W, L.H);
    const w = clamp(def.size * short, 60, L.W * 0.95);
    const n = this.items.length;
    const jitter = () => (Math.random() - 0.5) * 0.16;
    const it = {
      id: ++uid,
      def,
      x: at ? at[0] : L.W * (0.5 + jitter()),
      y: at ? at[1] : L.H * (0.46 + jitter() + ((n % 5) - 2) * 0.03),
      w,
      rot: (Math.random() - 0.5) * 0.22,
      flip: false,
    };
    const before = this.snapshot();
    this.items.push(it);
    this.sel = it;
    this.mode = 'select';
    this.render();
    this.commit(before);
    return it;
  }

  removeSel() {
    if (!this.sel) return;
    const before = this.snapshot();
    this.items = this.items.filter((i) => i.id !== this.sel.id);
    this.sel = null;
    this.render();
    this.commit(before);
  }

  flipSel() {
    if (!this.sel) return;
    const before = this.snapshot();
    this.sel.flip = !this.sel.flip;
    this.render();
    this.commit(before);
  }

  frontSel() {
    if (!this.sel) return;
    const before = this.snapshot();
    this.items = [...this.items.filter((i) => i !== this.sel), this.sel];
    this.render();
    this.commit(before);
  }

  dupSel() {
    if (!this.sel) return;
    const before = this.snapshot();
    const it = { ...this.sel, id: ++uid, x: this.sel.x + this.L.W * 0.05, y: this.sel.y + this.L.W * 0.05 };
    this.items.push(it);
    this.sel = it;
    this.render();
    this.commit(before);
  }

  select(it) {
    this.sel = it;
    this.render();
    this.emit();
  }

  setMode(mode) {
    this.mode = mode;
    if (mode === 'pen') this.sel = null;
    this.canvas.classList.toggle('pen', mode === 'pen');
    this.render();
    this.emit();
  }

  // ------------------------------------------------------------ input

  toSheet(e) {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left) / this.css, (e.clientY - r.top) / this.css];
  }

  hit([x, y]) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const dx = x - it.x, dy = y - it.y;
      const c = Math.cos(-it.rot), s = Math.sin(-it.rot);
      const lx = dx * c - dy * s, ly = dx * s + dy * c;
      const pad = 8 / this.css;
      if (Math.abs(lx) <= it.w / 2 + pad && Math.abs(ly) <= (it.w * it.def.ratio) / 2 + pad) return it;
    }
    return null;
  }

  onHandle(p) {
    if (!this.sel) return null;
    const q = this.corners(this.sel);
    const r = (HANDLE + 6) / this.css;
    if (Math.hypot(p[0] - q.tl[0], p[1] - q.tl[1]) <= r) return 'delete';
    if (Math.hypot(p[0] - q.br[0], p[1] - q.br[1]) <= r) return 'scale';
    return null;
  }

  bind() {
    const cv = this.canvas;
    cv.style.touchAction = 'none';

    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      const p = this.toSheet(e);
      this.pointers.set(e.pointerId, p);

      if (this.pointers.size === 2) {
        // second finger: pinch the selected sticker (and abandon a stroke)
        this.live = null;
        this.drag = null;
        if (this.sel) {
          const [a, b] = [...this.pointers.values()];
          this.pinch = { d: Math.hypot(b[0] - a[0], b[1] - a[1]), a: Math.atan2(b[1] - a[1], b[0] - a[0]), w: this.sel.w, rot: this.sel.rot, before: this.snapshot() };
        }
        this.render();
        return;
      }
      if (this.pointers.size > 2) return;

      if (this.mode === 'pen') {
        this.live = { ...this.pen, pts: [p] };
        if (this.live.pen === 'eraser') this.eraseSeg(p, p);
        this.render();
        return;
      }
      const h = this.onHandle(p);
      if (h === 'delete') {
        this.removeSel();
        return;
      }
      if (h === 'scale') {
        const it = this.sel;
        this.drag = { kind: 'scale', it, d0: Math.hypot(p[0] - it.x, p[1] - it.y), a0: Math.atan2(p[1] - it.y, p[0] - it.x), w: it.w, rot: it.rot, before: this.snapshot() };
        return;
      }
      const it = this.hit(p);
      if (it) {
        this.sel = it;
        this.drag = { kind: 'move', it, dx: p[0] - it.x, dy: p[1] - it.y, before: this.snapshot(), moved: false };
      } else this.sel = null;
      this.render();
      this.emit();
    });

    cv.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const p = this.toSheet(e);
      const prev = this.pointers.get(e.pointerId);
      this.pointers.set(e.pointerId, p);

      if (this.pinch && this.sel && this.pointers.size >= 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        this.sel.w = clamp((this.pinch.w * d) / Math.max(1, this.pinch.d), 30, this.L.W * 1.6);
        this.sel.rot = this.pinch.rot + (ang - this.pinch.a);
        this.render();
        return;
      }
      if (this.live) {
        const last = this.live.pts[this.live.pts.length - 1];
        if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 2.5) return;
        this.live.pts.push(p);
        if (this.live.pen === 'eraser') this.eraseSeg(last, p);
        this.render();
        return;
      }
      const d = this.drag;
      if (!d) return;
      if (d.kind === 'move') {
        d.it.x = clamp(p[0] - d.dx, 0, this.L.W);
        d.it.y = clamp(p[1] - d.dy, 0, this.L.H);
        d.moved = d.moved || Math.hypot(p[0] - prev[0], p[1] - prev[1]) > 0.5;
      } else {
        const it = d.it;
        const dist = Math.hypot(p[0] - it.x, p[1] - it.y);
        it.w = clamp((d.w * dist) / Math.max(1, d.d0), 30, this.L.W * 1.6);
        let rot = d.rot + (Math.atan2(p[1] - it.y, p[0] - it.x) - d.a0);
        // snap to upright within ~4°
        const k = Math.round(rot / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(rot - k) < 0.07) rot = k;
        it.rot = rot;
      }
      this.render();
    });

    const end = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      this.pointers.delete(e.pointerId);
      if (this.pinch) {
        if (this.pointers.size < 2) {
          this.commit(this.pinch.before);
          this.pinch = null;
        }
        return;
      }
      if (this.live) {
        const before = this.snapshot();
        const st = this.live;
        this.live = null;
        this.strokes.push(st);
        if (st.pen !== 'eraser') {
          const x = this.ink.getContext('2d');
          x.setTransform(this.s, 0, 0, this.s, 0, 0);
          drawStroke(x, st);
        }
        this.render();
        this.commit(before);
        return;
      }
      if (this.drag) {
        const d = this.drag;
        this.drag = null;
        if (d.kind === 'scale' || d.moved) this.commit(d.before);
      }
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);

    cv.addEventListener(
      'wheel',
      (e) => {
        if (!this.sel) return;
        e.preventDefault();
        const before = this.snapshot();
        if (e.shiftKey) this.sel.rot += e.deltaY * 0.004;
        else this.sel.w = clamp(this.sel.w * Math.exp(-e.deltaY * 0.0015), 30, this.L.W * 1.6);
        this.render();
        clearTimeout(this.wheelT);
        if (!this.wheelBefore) this.wheelBefore = before;
        this.wheelT = setTimeout(() => {
          this.commit(this.wheelBefore);
          this.wheelBefore = null;
        }, 300);
      },
      { passive: false },
    );

    cv.addEventListener('keydown', (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? this.redo() : this.undo();
        return;
      }
      if (!this.sel) return;
      const step = e.shiftKey ? 20 : 4;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.removeSel();
      } else if (e.key === 'Escape') this.select(null);
      else if (moves[e.key]) {
        e.preventDefault();
        const before = this.snapshot();
        this.sel.x += moves[e.key][0];
        this.sel.y += moves[e.key][1];
        this.render();
        this.commit(before);
      }
    });
  }

  eraseSeg(a, b) {
    const x = this.ink.getContext('2d');
    x.save();
    x.setTransform(this.s, 0, 0, this.s, 0, 0);
    x.globalCompositeOperation = 'destination-out';
    x.lineCap = 'round';
    x.lineWidth = this.pen.size;
    x.beginPath();
    x.moveTo(a[0], a[1]);
    x.lineTo(b[0] + 0.01, b[1]);
    x.stroke();
    x.restore();
  }

  // ------------------------------------------------------------ export

  async renderFinal(scale = 1) {
    await needAll(this.items.flatMap((i) => i.def.fonts || []));
    const { L } = this;
    const W = Math.round(L.W * scale), H = Math.round(L.H * scale);
    const out = canvas(W, H);
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.base, 0, 0, W, H);
    const inkFull = canvas(W, H);
    const ix = inkFull.getContext('2d');
    ix.setTransform(scale, 0, 0, scale, 0, 0);
    for (const st of this.strokes) drawStroke(ix, st);
    ctx.drawImage(inkFull, 0, 0);
    for (const it of this.items) {
      const w = it.w * scale, hh = w * it.def.ratio;
      const b = renderDef(it.def, Math.round(w), Math.round(hh));
      ctx.save();
      ctx.translate(it.x * scale, it.y * scale);
      ctx.rotate(it.rot);
      if (it.flip) ctx.scale(-1, 1);
      ctx.drawImage(b.img, -w / 2 - b.pad, -hh / 2 - b.pad);
      ctx.restore();
    }
    return out;
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.cache.clear();
  }
}
