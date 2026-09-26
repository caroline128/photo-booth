// Camera sources. The webcam and the demo scene share one interface:
// { kind, el, w, h, mirror, update(now), setPose(id), stop() }.

import { canvas } from '../core/util.js';
import { DemoScene } from '../art/mascot.js';

export async function openCamera() {
  if (!window.isSecureContext) throw Object.assign(new Error('insecure'), { name: 'SecurityError' });
  if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.srcObject = stream;
  await video.play().catch(() => {});
  await new Promise((resolve, reject) => {
    const t0 = performance.now();
    const check = () => {
      if (video.videoWidth > 0) resolve();
      else if (performance.now() - t0 > 8000) reject(Object.assign(new Error('timeout'), { name: 'NotReadableError' }));
      else requestAnimationFrame(check);
    };
    check();
  });
  const track = stream.getVideoTracks()[0];
  return {
    kind: 'camera',
    el: video,
    mirror: true,
    label: track?.label || '摄像头',
    get w() {
      return video.videoWidth;
    },
    get h() {
      return video.videoHeight;
    },
    update() {},
    setPose() {},
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

export function openDemo() {
  const scene = new DemoScene(1280, 960);
  return {
    kind: 'demo',
    el: scene.el,
    mirror: false,
    label: '小芒',
    w: scene.w,
    h: scene.h,
    update: (now) => scene.update(now),
    setPose: (p) => scene.setPose(p),
    stop() {},
  };
}

export function cameraError(e) {
  switch (e?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return '没有得到摄像头权限';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return '没有找到摄像头';
    case 'NotReadableError':
    case 'TrackStartError':
      return '摄像头可能正被别的程序占用';
    case 'SecurityError':
      return '摄像头只能在 https 或 localhost 页面里使用';
    default:
      return '这个浏览器暂时用不了摄像头';
  }
}

// Centred crop of (w, h) with the given aspect (width / height).
export function cropFor(w, h, aspect) {
  if (w / h > aspect) {
    const cw = h * aspect;
    return { x: (w - cw) / 2, y: 0, w: cw, h };
  }
  const ch = w / aspect;
  return { x: 0, y: (h - ch) / 2, w, h: ch };
}

// Grab one frame, cropped to `aspect` and mirrored like the preview.
export function capture(source, aspect, maxH = 1440) {
  source.update?.(performance.now());
  const c = cropFor(source.w, source.h, aspect);
  const scale = Math.min(1, maxH / c.h);
  const out = canvas(c.w * scale, c.h * scale);
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (source.mirror) {
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source.el, c.x, c.y, c.w, c.h, 0, 0, out.width, out.height);
  return out;
}
