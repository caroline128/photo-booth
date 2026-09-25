// Frame sources: the user's webcam, or — when there is no camera / permission
// was denied — an animated "demo model" (the shop's cat mascot) drawn on a
// canvas. The demo source reports its own face keypoints so AR props still
// work without any face detection model.

import { canvas as mkCanvas, TAU } from '../core/util.js';

export class CameraError extends Error {
  constructor(kind, message) {
    super(message);
    this.kind = kind; // 'unsupported' | 'denied' | 'notfound' | 'busy' | 'insecure' | 'unknown'
  }
}

export async function openCamera() {
  if (!window.isSecureContext) throw new CameraError('insecure', '摄像头需要在 https 或 localhost 下使用');
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError('unsupported', '这个浏览器不支持摄像头');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
  } catch (e) {
    const map = {
      NotAllowedError: 'denied',
      SecurityError: 'denied',
      NotFoundError: 'notfound',
      OverconstrainedError: 'notfound',
      NotReadableError: 'busy',
      AbortError: 'busy',
    };
    throw new CameraError(map[e.name] || 'unknown', e.message);
  }
  const video = document.createElement('video');
  video.playsInline = true;
  video.muted = true;
  video.autoplay = true;
  video.srcObject = stream;
  try {
    await video.play();
  } catch {
    /* autoplay of a muted inline video is allowed; ignore spurious errors */
  }
  await new Promise((resolve) => {
    if (video.videoWidth) return resolve();
    video.addEventListener('loadedmetadata', resolve, { once: true });
    setTimeout(resolve, 3000);
  });
  return {
    kind: 'camera',
    el: video,
    get width() {
      return video.videoWidth || 1280;
    },
    get height() {
      return video.videoHeight || 720;
    },
    ready: () => video.readyState >= 2,
    getFaces: null,
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
  };
}

// ---------------------------------------------------------------------------
// Demo model: a cartoon cat that bobs, tilts, blinks and changes expression.

export function createDemoSource({ animate = true } = {}) {
  const W = 1280;
  const H = 960;
  const c = mkCanvas(W, H);
  const ctx = c.getContext('2d');
  let raf = 0;
  let faces = [];
  const t0 = performance.now();

  const drawAt = (t) => {
    // backdrop: booth curtain + soft light
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#f6efe4');
    bg.addColorStop(1, '#e5d8c6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(160,120,90,0.08)';
    for (let x = 0; x < W; x += 64) ctx.fillRect(x + 24 + Math.sin(t + x) * 2, 0, 18, H);

    const cx = W / 2 + Math.sin(t * 0.7) * 90;
    const cy = H * 0.47 + Math.sin(t * 1.3) * 18;
    const tilt = Math.sin(t * 0.9) * 0.16;
    const R = 230 + Math.sin(t * 0.5) * 12;
    const blink = (t % 3.4) < 0.14;
    const mood = Math.floor(t / 2.5) % 4; // 0 smile, 1 open mouth, 2 wink, 3 cat mouth

    // body
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#3b2b25';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(0, R * 1.55, R * 1.05, R * 0.9, 0, Math.PI, TAU);
    ctx.lineTo(R * 1.05, H);
    ctx.lineTo(-R * 1.05, H);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // collar + bell
    ctx.fillStyle = '#d83a3a';
    ctx.beginPath();
    ctx.ellipse(0, R * 0.92, R * 0.62, R * 0.16, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(0, R * 1.08, 30, 0, TAU);
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // head
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3b2b25';
    // ears
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(s * R * 0.9, -R * 0.35);
      ctx.lineTo(s * R * 0.78, -R * 1.12);
      ctx.lineTo(s * R * 0.22, -R * 0.82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = s < 0 ? '#e9a24a' : '#ffb3c1';
      ctx.beginPath();
      ctx.moveTo(s * R * 0.78, -R * 0.52);
      ctx.lineTo(s * R * 0.74, -R * 0.96);
      ctx.lineTo(s * R * 0.38, -R * 0.78);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * 0.86, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    // calico patches
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#e9a24a';
    ctx.beginPath();
    ctx.ellipse(-R * 0.75, -R * 0.6, R * 0.55, R * 0.45, 0.4, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3b2b25';
    ctx.beginPath();
    ctx.ellipse(R * 0.8, -R * 0.55, R * 0.45, R * 0.4, -0.3, 0, TAU);
    ctx.fill();
    ctx.restore();

    const ex = R * 0.38;
    const ey = -R * 0.05;
    // eyes
    ctx.fillStyle = '#3b2b25';
    for (const s of [-1, 1]) {
      const closed = blink || (mood === 2 && s > 0);
      if (closed) {
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.arc(s * ex, ey + 6, 26, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.ellipse(s * ex, ey, 26, 34, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(s * ex + 9, ey - 12, 9, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#3b2b25';
      }
    }
    // blush
    ctx.fillStyle = 'rgba(255,120,140,0.45)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * R * 0.58, R * 0.26, 42, 22, 0, 0, TAU);
      ctx.fill();
    }
    // nose + mouth
    const ny = R * 0.2;
    ctx.fillStyle = '#ff8fa3';
    ctx.beginPath();
    ctx.moveTo(-16, ny - 8);
    ctx.lineTo(16, ny - 8);
    ctx.lineTo(0, ny + 10);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#3b2b25';
    const my = R * 0.38;
    if (mood === 1) {
      ctx.fillStyle = '#b8323f';
      ctx.beginPath();
      ctx.ellipse(0, my + 10, 34, 40, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-24, my - 6, 24, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.arc(24, my - 6, 24, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }
    // whiskers
    ctx.lineWidth = 5;
    for (const s of [-1, 1]) {
      for (let k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(s * R * 0.62, R * 0.18 + k * 20);
        ctx.lineTo(s * R * 1.12, R * 0.1 + k * 34);
        ctx.stroke();
      }
    }
    ctx.restore();

    // report face keypoints in normalized coords (image space, y down)
    const rot = (x, y) => ({
      x: (cx + x * Math.cos(tilt) - y * Math.sin(tilt)) / W,
      y: (cy + x * Math.sin(tilt) + y * Math.cos(tilt)) / H,
    });
    faces = [
      {
        id: 'demo',
        eyeL: rot(-ex, ey),
        eyeR: rot(ex, ey),
        nose: rot(0, ny),
        mouth: rot(0, my),
        earL: rot(-R * 0.95, ey),
        earR: rot(R * 0.95, ey),
        box: { x: (cx - R) / W, y: (cy - R) / H, w: (2 * R) / W, h: (2 * R) / H },
        score: 1,
      },
    ];
  };
  const loop = () => {
    drawAt((performance.now() - t0) / 1000);
    raf = requestAnimationFrame(loop);
  };
  if (animate) loop();
  else drawAt(0);

  return {
    kind: 'demo',
    el: c,
    width: W,
    height: H,
    ready: () => true,
    getFaces: () => faces,
    /** Draw a specific moment (used to render sample prints). */
    renderAt: drawAt,
    stop() {
      cancelAnimationFrame(raf);
    },
  };
}
