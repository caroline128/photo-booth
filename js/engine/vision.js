// Optional computer-vision helpers built on MediaPipe Tasks Vision (Apache-2.0):
//  - FaceTracker: BlazeFace short-range detector → eyes/nose/mouth keypoints
//    used to pin AR props on heads and to do the purikura "big eyes" warp.
//  - Segmenter: selfie segmentation → swap the booth backdrop (like the
//    green-screen backgrounds in purikura machines).
// Both load lazily and the booth keeps working (manual prop placement, plain
// backdrop) if they cannot load.

import { canvas as mkCanvas, clamp } from '../core/util.js';

const LOCAL = new URL('../../vendor/mediapipe/', import.meta.url).href;
const CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/';
const FACE_MODEL = new URL('../../assets/models/blaze_face_short_range.tflite', import.meta.url).href;
const SEG_MODEL = new URL('../../assets/models/selfie_segmenter.tflite', import.meta.url).href;

let visionP = null;

function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timeout`)), ms))]);
}

export function loadVision() {
  visionP ||= (async () => {
    for (const base of [LOCAL, CDN]) {
      try {
        const mod = await withTimeout(import(/* @vite-ignore */ base + 'vision_bundle.mjs'), 20000, 'import');
        const fileset = await withTimeout(mod.FilesetResolver.forVisionTasks(base + 'wasm'), 20000, 'wasm');
        return { mod, fileset };
      } catch (e) {
        console.info('[vision] not available from', base, e?.message || e);
      }
    }
    throw new Error('MediaPipe vision could not be loaded');
  })();
  return visionP;
}

async function create(Task, options) {
  const { mod, fileset } = await loadVision();
  const Cls = mod[Task];
  try {
    return await Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'GPU' } });
  } catch (e) {
    console.info(`[vision] ${Task} GPU delegate failed, using CPU`, e?.message || e);
    return Cls.createFromOptions(fileset, { ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' } });
  }
}

// ---------------------------------------------------------------------------

class FaceTracker {
  constructor() {
    this.state = 'idle'; // idle | loading | ready | failed
    this.det = null;
    this.faces = [];
    this.last = 0;
    this.lastTs = 0;
  }

  init() {
    if (this.readyP) return this.readyP;
    this.state = 'loading';
    this.readyP = (async () => {
      try {
        this.det = await create('FaceDetector', {
          baseOptions: { modelAssetPath: FACE_MODEL },
          runningMode: 'VIDEO',
          minDetectionConfidence: 0.5,
        });
        this.state = 'ready';
      } catch (e) {
        console.info('[vision] face tracking disabled', e?.message || e);
        this.state = 'failed';
      }
      return this.state === 'ready';
    })();
    return this.readyP;
  }

  /** Returns smoothed faces in normalized source coordinates (y down). */
  update(video) {
    if (this.state !== 'ready' || !video || video.readyState < 2) return this.faces;
    const now = performance.now();
    if (now - this.last < 30) return this.faces;
    this.last = now;
    const ts = Math.max(now, this.lastTs + 1);
    this.lastTs = ts;
    let res;
    try {
      res = this.det.detectForVideo(video, ts);
    } catch (e) {
      console.warn('[vision] detect failed', e);
      return this.faces;
    }
    const W = video.videoWidth || 1;
    const H = video.videoHeight || 1;
    const fresh = (res.detections || []).slice(0, 4).map((d) => toFace(d, W, H));
    this.faces = this._match(fresh, now);
    return this.faces;
  }

  _match(fresh, now) {
    const prev = this.faces;
    const out = [];
    for (const f of fresh) {
      let best = null;
      let bestD = 0.18;
      for (const p of prev) {
        const dd = Math.hypot(p.center.x - f.center.x, p.center.y - f.center.y);
        if (dd < bestD) {
          best = p;
          bestD = dd;
        }
      }
      if (best) {
        // adaptive smoothing: follow fast moves, steady when still
        const a = clamp(0.35 + bestD * 9, 0.35, 0.9);
        out.push(smooth(best, f, a, now));
      } else {
        out.push({ ...f, id: Math.random().toString(36).slice(2, 7), seen: now });
      }
    }
    // keep briefly-missed faces for a few frames to avoid flicker
    for (const p of prev) {
      if (!out.some((o) => o.id === p.id) && now - p.seen < 250) out.push(p);
    }
    return out.sort((a, b) => a.center.x - b.center.x);
  }
}

function toFace(d, W, H) {
  const k = d.keypoints || [];
  const pt = (i) => (k[i] ? { x: k[i].x, y: k[i].y } : null);
  let e1 = pt(0);
  let e2 = pt(1);
  const bb = d.boundingBox || { originX: 0, originY: 0, width: 0, height: 0 };
  const box = { x: bb.originX / W, y: bb.originY / H, w: bb.width / W, h: bb.height / H };
  if (!e1 || !e2) {
    e1 = { x: box.x + box.w * 0.32, y: box.y + box.h * 0.4 };
    e2 = { x: box.x + box.w * 0.68, y: box.y + box.h * 0.4 };
  }
  const [eyeL, eyeR] = e1.x < e2.x ? [e1, e2] : [e2, e1];
  const ears = [pt(4), pt(5)].filter(Boolean).sort((a, b) => a.x - b.x);
  return {
    eyeL,
    eyeR,
    nose: pt(2),
    mouth: pt(3),
    earL: ears[0] || null,
    earR: ears[1] || null,
    box,
    center: { x: (eyeL.x + eyeR.x) / 2, y: (eyeL.y + eyeR.y) / 2 },
    score: d.categories?.[0]?.score ?? 1,
  };
}

function smooth(p, f, a, now) {
  const mix = (A, B) => (A && B ? { x: A.x + (B.x - A.x) * a, y: A.y + (B.y - A.y) * a } : B || A);
  return {
    id: p.id,
    eyeL: mix(p.eyeL, f.eyeL),
    eyeR: mix(p.eyeR, f.eyeR),
    nose: mix(p.nose, f.nose),
    mouth: mix(p.mouth, f.mouth),
    earL: mix(p.earL, f.earL),
    earR: mix(p.earR, f.earR),
    box: f.box,
    center: mix(p.center, f.center),
    score: f.score,
    seen: now,
  };
}

export const faceTracker = new FaceTracker();

// ---------------------------------------------------------------------------

class Segmenter {
  constructor() {
    this.state = 'idle';
    this.seg = null;
    this.mask = null; // canvas whose alpha = person confidence
    this.coverage = 0;
    this.last = 0;
    this.lastTs = 0;
  }

  init() {
    if (this.readyP) return this.readyP;
    this.state = 'loading';
    this.readyP = (async () => {
      try {
        this.seg = await create('ImageSegmenter', {
          baseOptions: { modelAssetPath: SEG_MODEL },
          runningMode: 'VIDEO',
          outputConfidenceMasks: true,
          outputCategoryMask: false,
        });
        this.state = 'ready';
      } catch (e) {
        console.info('[vision] background swap disabled', e?.message || e);
        this.state = 'failed';
      }
      return this.state === 'ready';
    })();
    return this.readyP;
  }

  update(video) {
    if (this.state !== 'ready' || !video || video.readyState < 2) return this.mask;
    const now = performance.now();
    if (now - this.last < 45) return this.mask;
    this.last = now;
    const ts = Math.max(now, this.lastTs + 1);
    this.lastTs = ts;
    try {
      this.seg.segmentForVideo(video, ts, (res) => {
        const m = res.confidenceMasks?.[0];
        if (!m) return;
        const w = m.width;
        const h = m.height;
        const data = m.getAsFloat32Array();
        if (!this.mask || this.mask.width !== w || this.mask.height !== h) {
          this.mask = mkCanvas(w, h);
          this.mctx = this.mask.getContext('2d');
          this.img = this.mctx.createImageData(w, h);
        }
        const px = this.img.data;
        let sum = 0;
        for (let i = 0, j = 3; i < data.length; i++, j += 4) {
          // tighten the soft edge a little so hair keeps its shape
          const v = clamp((data[i] - 0.25) / 0.5, 0, 1);
          sum += v;
          px[j - 3] = 255;
          px[j - 2] = 255;
          px[j - 1] = 255;
          px[j] = v * 255;
        }
        this.coverage = sum / data.length; // share of the frame that is "person"
        this.mctx.putImageData(this.img, 0, 0);
      });
    } catch (e) {
      console.warn('[vision] segment failed', e);
    }
    return this.mask;
  }
}

export const segmenter = new Segmenter();
