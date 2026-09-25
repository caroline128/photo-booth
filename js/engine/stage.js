// The live camera stage inside a booth: crops/mirrors the camera to the
// photo slot's aspect ratio, swaps the backdrop, pins AR props on faces,
// runs the look (WebGL) for the live view, and captures full-res frames.

import { canvas as mkCanvas, clamp } from '../core/util.js';
import { GLFX } from './glfx.js';
import { drawProps, virtualFace, faceGeom } from './props.js';
import { faceTracker, segmenter } from './vision.js';
import { artBitmap } from '../art/render.js';

export class Stage {
  /**
   * @param {object} o
   * @param {object} o.source   frame source from camera.js
   * @param {number} o.aspect   width / height of the photo slot
   * @param {Function} o.fx     (faces, rawW, rawH) => fx uniforms for the live view
   */
  constructor({ source, aspect, fx, previewWidth = 960, preview = true }) {
    this.source = source;
    this.aspect = aspect;
    this.fxFn = fx || (() => ({}));
    this.props = [];
    this.bitmaps = new Map();
    this.background = null; // { paint(ctx, w, h, t) } or null
    this.mirror = true;
    this.zoom = 1;
    this.manual = { x: 0.5, y: 0.42, d: 0.2 }; // virtual face (fractions of width)
    this.glfx = preview ? new GLFX() : null;
    this.view = this.glfx ? this.glfx.canvas : null;
    this.view?.classList.add('stage-view');
    const pw = previewWidth;
    this.rawPrev = mkCanvas(pw, pw / aspect);
    this.personPrev = mkCanvas(pw, pw / aspect);
    this.faces = [];
    this.running = false;
    this.useTracker = source.kind === 'camera';
    if (this.useTracker) faceTracker.init().then(() => this.emitStatus());
    this.onStatus = null;
  }

  get trackingState() {
    if (this.source.kind === 'demo') return 'demo';
    return faceTracker.state; // idle/loading/ready/failed
  }

  emitStatus() {
    this.onStatus?.(this.trackingState, segmenter.state);
  }

  async setProps(defs) {
    this.props = defs;
    await Promise.all(
      defs.map(async (p) => {
        if (!this.bitmaps.has(p.id)) this.bitmaps.set(p.id, await artBitmap(p, 420));
      }),
    );
  }

  async setBackground(bg) {
    this.background = bg;
    if (bg && this.source.kind === 'camera') {
      await segmenter.init();
      this.emitStatus();
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.renderPreview();
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.glfx?.dispose();
    this.glfx = null;
  }

  /** Faces in normalized source coords (y down), before crop/mirror. */
  sourceFaces() {
    if (this.source.getFaces) return this.source.getFaces();
    if (this.useTracker && faceTracker.state === 'ready') return faceTracker.update(this.source.el);
    return null; // manual mode
  }

  crop(w, h) {
    const sw = this.source.width;
    const sh = this.source.height;
    const outA = w / h;
    let cw;
    let ch;
    if (sw / sh > outA) {
      ch = sh;
      cw = sh * outA;
    } else {
      cw = sw;
      ch = sw / outA;
    }
    cw /= this.zoom;
    ch /= this.zoom;
    return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch, W: sw, H: sh };
  }

  mapFaces(faces, w, h, cr) {
    const mp = (p) => {
      if (!p) return null;
      let x = ((p.x * cr.W - cr.sx) / cr.sw) * w;
      const y = ((p.y * cr.H - cr.sy) / cr.sh) * h;
      if (this.mirror) x = w - x;
      return { x, y };
    };
    return faces.map((f) => {
      let eyeL = mp(f.eyeL);
      let eyeR = mp(f.eyeR);
      let earL = mp(f.earL);
      let earR = mp(f.earR);
      if (eyeL.x > eyeR.x) [eyeL, eyeR] = [eyeR, eyeL];
      if (earL && earR && earL.x > earR.x) [earL, earR] = [earR, earL];
      return { id: f.id, eyeL, eyeR, nose: mp(f.nose), mouth: mp(f.mouth), earL, earR };
    });
  }

  /** Compose camera + backdrop + props into `out` (w×h). Returns mapped faces. */
  buildRaw(out, person, t) {
    const w = out.width;
    const h = out.height;
    const ctx = out.getContext('2d');
    const cr = this.crop(w, h);
    const el = this.source.el;
    let mask = this.background && this.source.kind === 'camera' ? segmenter.update(el) : null;
    // nobody found (bad light / empty frame): show the camera rather than an empty backdrop
    if (mask && segmenter.coverage < 0.015) mask = null;
    const bgActive = this.background && (mask || this.source.kind === 'demo');
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    if (bgActive) {
      this.background.paint(ctx, w, h, t);
      const pctx = person.getContext('2d');
      pctx.save();
      pctx.clearRect(0, 0, w, h);
      if (this.mirror) {
        pctx.translate(w, 0);
        pctx.scale(-1, 1);
      }
      pctx.drawImage(el, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, w, h);
      if (mask) {
        pctx.globalCompositeOperation = 'destination-in';
        const mx = mask.width / cr.W;
        const my = mask.height / cr.H;
        pctx.imageSmoothingEnabled = true;
        pctx.drawImage(mask, cr.sx * mx, cr.sy * my, cr.sw * mx, cr.sh * my, 0, 0, w, h);
      } else {
        // demo model: key out its plain backdrop with a soft oval
        pctx.globalCompositeOperation = 'destination-in';
        const g = pctx.createRadialGradient(w / 2, h * 0.62, h * 0.35, w / 2, h * 0.62, h * 0.62);
        g.addColorStop(0, '#000');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        pctx.fillStyle = g;
        pctx.fillRect(0, 0, w, h);
      }
      pctx.restore();
      ctx.drawImage(person, 0, 0);
    } else {
      if (this.mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(el, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, w, h);
    }
    ctx.restore();

    const src = this.sourceFaces();
    let faces;
    if (src) faces = this.mapFaces(src, w, h, cr);
    else {
      const m = this.manual;
      faces = [virtualFace(m.x * w, m.y * h, m.d * w)];
    }
    if (this.props.length) drawProps(ctx, faces, this.props, this.bitmaps);
    return faces;
  }

  renderPreview() {
    if (!this.glfx || !this.source.ready()) return;
    const t = performance.now() / 1000;
    this.faces = this.buildRaw(this.rawPrev, this.personPrev, t);
    const fx = this.fxFn(this.faces, this.rawPrev.width, this.rawPrev.height);
    this.glfx.render(this.rawPrev, fx, this.rawPrev.width, this.rawPrev.height);
  }

  /** Full resolution raw capture (no look applied) + face geometry. */
  capture(width) {
    const w = Math.round(clamp(width, 480, 1600));
    const h = Math.round(w / this.aspect);
    const raw = mkCanvas(w, h);
    const person = mkCanvas(w, h);
    const faces = this.buildRaw(raw, person, performance.now() / 1000);
    return { raw, faces: faces.map((f) => ({ ...f, geom: undefined })), w, h };
  }

  /** Manual-mode dragging of the virtual face (when no tracking). */
  bindManualControls(el) {
    let drag = null;
    const toFrac = (e) => {
      const r = this.view.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
    };
    el.addEventListener('pointerdown', (e) => {
      if (this.sourceFaces()) return;
      drag = { start: toFrac(e), orig: { ...this.manual } };
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = toFrac(e);
      this.manual.x = clamp(drag.orig.x + p.x - drag.start.x, 0, 1);
      this.manual.y = clamp(drag.orig.y + p.y - drag.start.y, 0, 1);
    });
    const end = () => (drag = null);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener(
      'wheel',
      (e) => {
        if (this.sourceFaces()) return;
        e.preventDefault();
        this.manual.d = clamp(this.manual.d * (e.deltaY > 0 ? 0.92 : 1.08), 0.06, 0.6);
      },
      { passive: false },
    );
  }
}

/** Eye positions for the big-eye warp, from faces in raw pixel coords. */
export function eyesFx(faces, w, h, strength) {
  if (!strength) return [];
  const out = [];
  for (const f of faces.slice(0, 2)) {
    if (f.manual) continue;
    const g = faceGeom(f);
    for (const e of [f.eyeL, f.eyeR]) out.push({ x: e.x / w, y: e.y / h, r: (g.d * 0.42) / h, s: strength });
  }
  return out;
}
