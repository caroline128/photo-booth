// One-pass WebGL "darkroom": every booth look (B&W chemical, soft K-pop glow,
// fisheye, CCD noise, big-eye purikura retouch...) is a set of uniforms for
// the same fragment shader. Falls back to 2D canvas filters without WebGL.

import { canvas as mkCanvas } from '../core/util.js';

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uTexel;
uniform float uAspect;
uniform float uSeed;

uniform float uFisheye;
uniform float uCircle;
uniform float uZoom;
uniform vec4 uEyes[4];

uniform float uExposure;
uniform float uBrightness;
uniform float uContrast;
uniform float uSaturation;
uniform float uTemp;
uniform float uTint;
uniform float uFade;
uniform float uCurve;
uniform float uTone;
uniform vec3 uDuoA;
uniform vec3 uDuoB;
uniform float uSmooth;
uniform float uGlow;
uniform float uVignette;
uniform float uGrain;
uniform float uChroma;
uniform float uPixel;
uniform float uPosterize;
uniform float uFlash;
uniform float uJpeg;
uniform float uSharpen;
uniform float uLeak;
uniform float uWhiten;

float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 lens(vec2 uv) {
  uv = 0.5 + (uv - 0.5) / uZoom;
  if (uFisheye <= 0.001 && uCircle < 0.5) return uv;
  vec2 d = (uv - 0.5) * vec2(uAspect, 1.0);
  float halfDiag = 0.5 * length(vec2(uAspect, 1.0));
  float rOut = uCircle > 0.5 ? 0.5 * min(uAspect, 1.0) / uZoom : halfDiag / uZoom;
  float len = length(d);
  float r = len / rOut;
  float a = 2.4 * uFisheye;
  float f = a > 0.001 ? (exp(a * r) - 1.0) / (exp(a) - 1.0) : r;
  float rSrc = (uCircle > 0.5 ? halfDiag * 0.94 : halfDiag) / uZoom;
  vec2 sd = len > 0.0 ? d / len * f * rSrc : vec2(0.0);
  return 0.5 + sd / vec2(uAspect, 1.0);
}

vec2 eyeWarp(vec2 uv) {
  for (int i = 0; i < 4; i++) {
    vec4 e = uEyes[i];
    if (e.w <= 0.0) continue;
    vec2 d = (uv - e.xy) * vec2(uAspect, 1.0);
    float t = length(d) / e.z;
    if (t < 1.0) {
      float fall = (1.0 - t * t);
      uv = e.xy + (uv - e.xy) * (1.0 - e.w * fall * fall);
    }
  }
  return uv;
}

vec3 tex(vec2 uv) {
  if (uChroma > 0.0) {
    vec2 dir = (uv - 0.5) * uChroma * 0.012;
    return vec3(texture2D(uTex, uv + dir).r, texture2D(uTex, uv).g, texture2D(uTex, uv - dir).b);
  }
  return texture2D(uTex, uv).rgb;
}

void main() {
  vec2 uv = lens(vUv);
  uv = eyeWarp(uv);
  if (uPixel > 0.0) {
    vec2 block = vec2(1.0 / uPixel, uAspect / uPixel);
    uv = (floor(uv / block) + 0.5) * block;
  }
  float inside = 1.0;
  if (uCircle > 0.5) {
    vec2 cd = (vUv - 0.5) * vec2(uAspect, 1.0);
    float cr = 0.5 * min(uAspect, 1.0);
    inside = 1.0 - smoothstep(cr - 0.004, cr, length(cd));
  }
  uv = clamp(uv, vec2(0.0), vec2(1.0));
  vec3 c = tex(uv);

  // skin smoothing: colour-aware blur (cheap bilateral)
  if (uSmooth > 0.0 || uSharpen > 0.0) {
    vec3 acc = c;
    float wsum = 1.0;
    vec3 box = vec3(0.0);
    float rad = 2.0 + 5.0 * uSmooth;
    for (int i = 0; i < 12; i++) {
      float ang = float(i) * 0.5235988;
      float rr = i < 6 ? rad * 0.5 : rad;
      float a2 = i < 6 ? ang : ang + 0.2618;
      vec2 off = vec2(cos(a2), sin(a2)) * rr * uTexel;
      vec3 s = texture2D(uTex, uv + off).rgb;
      box += s;
      float w = exp(-dot(s - c, s - c) * 38.0);
      acc += s * w;
      wsum += w;
    }
    c = mix(c, acc / wsum, uSmooth);
    c += (c - box / 12.0) * uSharpen;
  }

  // soft focus glow (screen blend of a wide blur)
  if (uGlow > 0.0) {
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      acc += texture2D(uTex, uv + vec2(cos(ang), sin(ang)) * 9.0 * uTexel).rgb;
      acc += texture2D(uTex, uv + vec2(cos(ang + 0.39), sin(ang + 0.39)) * 20.0 * uTexel).rgb;
    }
    vec3 b = acc / 16.0;
    c = 1.0 - (1.0 - c) * (1.0 - b * uGlow * 0.75);
  }

  c *= pow(2.0, uExposure);
  c += uBrightness;
  // purikura "bihaku" whitening: lift skin mid-tones toward porcelain
  if (uWhiten > 0.0) {
    float L = luma(c);
    c = mix(c, c + (1.0 - c) * 0.35, uWhiten * smoothstep(0.15, 0.7, L));
    c = mix(c, vec3(L) * vec3(1.02, 1.0, 1.04) + (c - vec3(L)) * 0.8, uWhiten * 0.35);
  }
  c = (c - 0.5) * uContrast + 0.5;
  c = mix(c, c * c * (3.0 - 2.0 * c), uCurve);
  float l = luma(c);
  c = mix(vec3(l), c, uSaturation);
  c.r += uTemp * 0.08;
  c.b -= uTemp * 0.08;
  c.g += uTint * 0.06;

  if (uFlash > 0.0) {
    vec2 fd = (vUv - vec2(0.5, 0.55)) * vec2(uAspect, 1.0);
    float fl = exp(-dot(fd, fd) * 4.0);
    c += uFlash * fl * 0.28;
    c = mix(c, pow(max(c, 0.0), vec3(0.75)), uFlash * 0.6);
  }

  if (uTone > 0.5) {
    float L = clamp(luma(c), 0.0, 1.0);
    if (uTone < 1.5) c = vec3(L);
    else if (uTone < 2.5) c = mix(vec3(0.12, 0.07, 0.03), vec3(1.0, 0.93, 0.78), L) * (0.85 + 0.15 * L);
    else if (uTone < 3.5) c = mix(vec3(0.02, 0.1, 0.3), vec3(0.86, 0.94, 1.0), L);
    else c = mix(uDuoA, uDuoB, L);
  }

  c = uFade * 0.13 + c * (1.0 - uFade * 0.22);

  if (uJpeg > 0.0) {
    vec2 bs = uTexel * 10.0;
    vec3 bc = texture2D(uTex, (floor(uv / bs) + 0.5) * bs).rgb;
    c = mix(c, floor(mix(c, bc, 0.5) * 9.0 + 0.5) / 9.0, uJpeg * 0.55);
    c += vec3(-0.03, 0.05, -0.04) * uJpeg;
  }
  if (uPosterize > 1.0) c = floor(c * uPosterize + 0.5) / uPosterize;

  if (uLeak > 0.0) {
    float lk = smoothstep(0.7, 0.0, distance(vUv, vec2(1.0, 0.9)));
    float lk2 = smoothstep(0.55, 0.0, distance(vUv, vec2(0.0, 0.05)));
    c += vec3(1.0, 0.45, 0.12) * lk * uLeak + vec3(0.9, 0.15, 0.25) * lk2 * uLeak * 0.6;
  }

  vec2 vd = (vUv - 0.5) * vec2(uAspect, 1.0) / (0.5 * length(vec2(uAspect, 1.0)));
  c *= mix(1.0, smoothstep(1.25, 0.25, length(vd)), uVignette);

  float n = hash(vUv / uTexel + uSeed) - 0.5;
  c += n * uGrain * 0.22;

  gl_FragColor = vec4(clamp(c, 0.0, 1.0), inside);
}`;

const TONES = { none: 0, mono: 1, sepia: 2, cyan: 3, duo: 4 };

export const DEFAULT_FX = {
  fisheye: 0,
  circle: false,
  zoom: 1,
  eyes: [], // [{x, y, r, s}] in normalized image coords (y down), r relative to height
  exposure: 0,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  temp: 0,
  tint: 0,
  fade: 0,
  curve: 0,
  tone: 'none',
  duoA: [0, 0, 0],
  duoB: [1, 1, 1],
  smooth: 0,
  glow: 0,
  vignette: 0,
  grain: 0,
  chroma: 0,
  pixel: 0,
  posterize: 0,
  flash: 0,
  jpeg: 0,
  sharpen: 0,
  leak: 0,
  whiten: 0,
};

export class GLFX {
  constructor({ alpha = true } = {}) {
    this.canvas = mkCanvas(2, 2);
    const gl = this.canvas.getContext('webgl', {
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      alpha,
      antialias: false,
    });
    this.gl = gl;
    this.ok = !!gl && this._init();
    this.seed = Math.random() * 100;
  }

  _init() {
    const gl = this.gl;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn('shader error', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VERT);
    const fs = sh(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.warn('link error', gl.getProgramInfoLog(p));
      return false;
    }
    gl.useProgram(p);
    this.prog = p;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const name = info.name.replace('[0]', '');
      this.u[name] = gl.getUniformLocation(p, name);
    }
    return true;
  }

  /**
   * Render `source` (canvas/video/image) with `fx` into this.canvas at w×h.
   * The source is expected to already have the output aspect ratio.
   */
  render(source, fx = {}, w, h) {
    const p = { ...DEFAULT_FX, ...fx };
    w = Math.round(w || source.width || source.videoWidth);
    h = Math.round(h || source.height || source.videoHeight);
    if (!this.ok) return this._render2d(source, p, w, h);
    const gl = this.gl;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch (e) {
      console.warn('texture upload failed', e);
      return this.canvas;
    }
    const sw = source.width || source.videoWidth || w;
    const sh = source.height || source.videoHeight || h;
    const u = this.u;
    const f1 = (k, v) => u[k] && gl.uniform1f(u[k], v);
    gl.uniform1i(u.uTex, 0);
    gl.uniform2f(u.uTexel, 1 / sw, 1 / sh);
    f1('uAspect', w / h);
    f1('uSeed', p.seed ?? this.seed);
    f1('uFisheye', p.fisheye);
    f1('uCircle', p.circle ? 1 : 0);
    f1('uZoom', p.zoom || 1);
    const eyes = new Float32Array(16);
    (p.eyes || []).slice(0, 4).forEach((e, i) => {
      eyes.set([e.x, 1 - e.y, e.r, e.s], i * 4);
    });
    gl.uniform4fv(u.uEyes, eyes);
    f1('uExposure', p.exposure);
    f1('uBrightness', p.brightness);
    f1('uContrast', p.contrast);
    f1('uSaturation', p.saturation);
    f1('uTemp', p.temp);
    f1('uTint', p.tint);
    f1('uFade', p.fade);
    f1('uCurve', p.curve);
    f1('uTone', TONES[p.tone] ?? 0);
    gl.uniform3fv(u.uDuoA, p.duoA);
    gl.uniform3fv(u.uDuoB, p.duoB);
    f1('uSmooth', p.smooth);
    f1('uGlow', p.glow);
    f1('uVignette', p.vignette);
    f1('uGrain', p.grain);
    f1('uChroma', p.chroma);
    f1('uPixel', p.pixel);
    f1('uPosterize', p.posterize);
    f1('uFlash', p.flash);
    f1('uJpeg', p.jpeg);
    f1('uSharpen', p.sharpen);
    f1('uLeak', p.leak);
    f1('uWhiten', p.whiten);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }

  /** Free the GL context (browsers only allow a handful at once). */
  dispose() {
    try {
      this.gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      /* ignore */
    }
    this.ok = false;
  }

  // Rough approximation for browsers without WebGL.
  _render2d(source, p, w, h) {
    if (!this._c2) this._c2 = mkCanvas(w, h);
    const c = this._c2;
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    const f = [];
    if (p.tone === 'mono') f.push('grayscale(1)');
    if (p.tone === 'sepia') f.push('sepia(0.9)');
    if (p.tone === 'cyan') f.push('grayscale(1) sepia(1) hue-rotate(180deg) saturate(2)');
    if (p.contrast !== 1) f.push(`contrast(${p.contrast})`);
    if (p.saturation !== 1) f.push(`saturate(${p.saturation})`);
    const bright = Math.pow(2, p.exposure) + p.brightness + p.whiten * 0.15 + p.glow * 0.1;
    if (bright !== 1) f.push(`brightness(${bright})`);
    ctx.filter = f.join(' ') || 'none';
    ctx.drawImage(source, 0, 0, w, h);
    ctx.filter = 'none';
    if (p.vignette > 0) {
      const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) / 2);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(0,0,0,${p.vignette * 0.7})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    if (p.circle) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    return c;
  }
}

let offline = null;
/** Shared GL renderer for offline work (filters, samples) — one context only. */
export function offlineFx() {
  return (offline ||= new GLFX());
}

/** Render with fx into a fresh 2D canvas (so the GL canvas can be reused). */
export function renderToCanvas(glfx, source, fx, w, h) {
  const out = glfx.render(source, fx, w, h);
  const c = mkCanvas(out.width, out.height);
  c.getContext('2d').drawImage(out, 0, 0);
  return c;
}
