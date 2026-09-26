// Photo filters. One WebGL fragment shader does beauty (edge-aware skin
// smoothing + brightening), colour grading and four stylised looks; ASCII
// is drawn on a 2D canvas. Falls back to plain copies without WebGL.

import { canvas } from '../core/util.js';
import { FAMILY } from '../core/fonts.js';

export const FILTERS = [
  { id: 'natural', name: '原片', desc: '只加一点点暖', p: { temp: 0.02, contrast: 1.03, sat: 1.03 } },
  {
    id: 'cream',
    name: '奶油',
    desc: '低对比、暖白、柔光',
    p: { exposure: 0.1, contrast: 0.88, sat: 0.9, temp: 0.05, fade: 0.07, glow: 0.3, split: 0.25, shadow: '#6b4a3a', high: '#fff3dd', vig: 0.12 },
  },
  {
    id: 'terracotta',
    name: '陶土',
    desc: '暖橙调，像傍晚的光',
    p: { contrast: 1.08, sat: 1.08, temp: 0.1, split: 0.4, shadow: '#5b2c1f', high: '#ffe1c6', vig: 0.28, fade: 0.03 },
  },
  { id: 'mono', name: '墨色', desc: '暖调黑白', mode: 1, p: { contrast: 1.18, c0: '#1b1a18', c1: '#f7f2e8', grain: 0.07, vig: 0.22 } },
  { id: 'sepia', name: '旧书页', desc: '泛黄的纸，像夹在书里', mode: 1, p: { contrast: 0.95, c0: '#3a2a1f', c1: '#f4e4c4', fade: 0.06, grain: 0.09, vig: 0.4 } },
  { id: 'ink', name: '墨线插画', desc: '描边 + 平涂，像一张手绘插画', mode: 2, p: { c0: '#faf6ec', c1: '#efc3a6', c2: '#d97757', c3: '#161513', amt: 1 } },
  { id: 'riso', name: '双色印刷', desc: '蓝、橙两色网点，轻微错版', mode: 3, p: { c0: '#f6f0e4', c1: '#5f8fc4', c2: '#e0714f' } },
  { id: 'pixel', name: '像素', desc: '12 色像素画', mode: 4, p: { blocks: 64 } },
  { id: 'ascii', name: '终端 ASCII', desc: '用字符拼出你的样子', ascii: true },
];

export const filterById = (id) => FILTERS.find((f) => f.id === id) || FILTERS[0];

export const BEAUTY = [
  { id: 'off', name: '原生', smooth: 0, bright: 0 },
  { id: 'natural', name: '自然', smooth: 0.45, bright: 0.1 },
  { id: 'cream', name: '奶油肌', smooth: 0.85, bright: 0.24 },
];

export const beautyById = (id) => BEAUTY.find((b) => b.id === id) || BEAUTY[1];

// 12-colour palette for the pixel look (brand colours + skin-friendly tones)
const PIXEL_PALETTE = [
  '#141413', '#3d3d3a', '#b0aea5', '#e8e6dc', '#faf9f5', '#d97757',
  '#c6613f', '#9c4a31', '#f2c4ad', '#d4a27f', '#788c5d', '#6a9bcc',
];

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec4 u_crop;
uniform float u_mirror;
uniform vec2 u_out;
uniform float u_seed;
uniform float u_smooth, u_bright;
uniform float u_exposure, u_contrast, u_sat, u_temp, u_tint, u_fade, u_vig, u_grain, u_glow;
uniform vec3 u_shadow, u_high;
uniform float u_split;
uniform int u_mode;
uniform vec3 u_c0, u_c1, u_c2, u_c3;
uniform float u_amt, u_blocks;
uniform vec3 u_pal[12];

vec2 src(vec2 uv) {
  float x = u_mirror > 0.5 ? 1.0 - uv.x : uv.x;
  return vec2(u_crop.x + x * u_crop.z, u_crop.y + uv.y * u_crop.w);
}
vec3 tex(vec2 uv) { return texture2D(u_tex, src(clamp(uv, 0.0, 1.0))).rgb; }
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + u_seed) * 43758.5453); }

vec3 beauty(vec2 uv, vec3 c) {
  if (u_smooth <= 0.0 && u_bright <= 0.0) return c;
  vec2 px = 1.0 / u_out;
  float r = max(1.5, u_out.y / 260.0);
  vec3 sum = c;
  float ws = 1.0;
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996;
    float d = sqrt(float(i) + 0.5) / 4.0;
    vec2 o = vec2(cos(a), sin(a)) * d * r * 2.2 * px;
    vec3 s = tex(uv + o);
    vec3 diff = s - c;
    float w = exp(-dot(diff, diff) * 90.0);
    sum += s * w;
    ws += w;
  }
  vec3 sm = sum / ws;
  // favour warm, mid-bright pixels (skin) for smoothing
  float skin = smoothstep(0.02, 0.12, c.r - c.b) * smoothstep(0.18, 0.45, luma(c));
  c = mix(c, sm, u_smooth * (0.35 + 0.65 * skin));
  // brighten: lift mids, a touch of pink
  c = mix(c, 1.0 - (1.0 - c) * (1.0 - c * 0.55), u_bright);
  c += vec3(0.012, 0.0, 0.008) * u_bright * 3.0;
  return c;
}

vec3 grade(vec3 c, vec2 uv) {
  c *= exp2(u_exposure);
  c.r += u_temp * 0.5;
  c.b -= u_temp * 0.5;
  c.g += u_tint * 0.3;
  c = (c - 0.5) * u_contrast + 0.5;
  float l = luma(c);
  c = mix(vec3(l), c, u_sat);
  if (u_split > 0.0) {
    float t = smoothstep(0.0, 1.0, l);
    c = mix(c, c * u_shadow * 2.0, (1.0 - t) * u_split * 0.5);
    c = mix(c, mix(c, u_high, 0.5), t * u_split * 0.45);
  }
  if (u_glow > 0.0) {
    vec2 px = 1.0 / u_out;
    vec3 b = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398;
      b += tex(uv + vec2(cos(a), sin(a)) * px * u_out.y * 0.012);
    }
    b /= 8.0;
    c = mix(c, max(c, b), u_glow);
  }
  c = mix(vec3(u_fade), vec3(1.0), clamp(c, 0.0, 1.0));
  return c;
}

float sobel(vec2 uv, float k) {
  vec2 p = k / u_out;
  float tl = luma(tex(uv + vec2(-p.x, p.y))), t = luma(tex(uv + vec2(0.0, p.y))), tr = luma(tex(uv + p));
  float l = luma(tex(uv - vec2(p.x, 0.0))), r = luma(tex(uv + vec2(p.x, 0.0)));
  float bl = luma(tex(uv - p)), b = luma(tex(uv - vec2(0.0, p.y))), br = luma(tex(uv + vec2(p.x, -p.y)));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -tl - 2.0 * t - tr + bl + 2.0 * b + br;
  return length(vec2(gx, gy));
}

float soft(vec2 uv, float k) {
  vec2 p = k / u_out;
  float s = 0.0;
  for (int x = -2; x <= 2; x++)
    for (int y = -2; y <= 2; y++) s += luma(tex(uv + vec2(float(x), float(y)) * p));
  return s / 25.0;
}

vec3 inkLook(vec2 uv) {
  float k = max(1.0, u_out.y / 520.0);
  float e = sobel(uv, 1.6 * k);
  float line = smoothstep(0.22, 0.42, e * u_amt);
  // flat fills, nudged off the line like a misregistered print
  vec2 off = vec2(3.0, -2.0) * k / u_out;
  float l = soft(uv + off, 1.4 * k);
  l += (hash(floor(uv * u_out / 3.0)) - 0.5) * 0.012;
  vec3 fill = l > 0.66 ? u_c0 : (l > 0.46 ? u_c1 : (l > 0.28 ? u_c2 : mix(u_c2, u_c3, 0.55)));
  vec3 c = mix(fill, u_c3, line * 0.92);
  c *= 0.97 + 0.03 * hash(uv * u_out);
  return c;
}

float dots(vec2 frag, float ang, float cell, float d) {
  float s = sin(ang), co = cos(ang);
  vec2 p = mat2(co, -s, s, co) * frag;
  vec2 q = mod(p, cell) - cell * 0.5;
  float r = sqrt(clamp(d, 0.0, 1.0)) * cell * 0.62;
  return 1.0 - smoothstep(r - 0.9, r + 0.9, length(q));
}

vec3 risoLook(vec2 uv) {
  float cell = max(4.0, u_out.x / 110.0);
  vec2 frag = uv * u_out;
  float l = luma(tex(uv));
  l = (l - 0.5) * 1.15 + 0.52;
  float dA = smoothstep(0.78, 0.12, l);
  vec2 shift = vec2(2.5, 1.5) * cell / 6.0 / u_out;
  float l2 = luma(tex(uv + shift));
  float dB = smoothstep(0.98, 0.35, l2) * 0.85;
  float a = dots(frag, 0.26, cell, dA);
  float b = dots(frag + 3.1, 1.3, cell, dB);
  vec3 paper = u_c0 * (0.96 + 0.04 * hash(floor(frag)));
  vec3 c = paper;
  c *= mix(vec3(1.0), u_c2, b);
  c *= mix(vec3(1.0), u_c1, a);
  return c;
}

vec3 pixelLook(vec2 uv) {
  vec2 blocks = vec2(u_blocks, u_blocks * u_out.y / u_out.x);
  vec2 q = (floor(uv * blocks) + 0.5) / blocks;
  vec3 c = tex(q);
  c = (c - 0.5) * 1.12 + 0.5;
  vec3 best = u_pal[0];
  float bd = 9.0;
  for (int i = 0; i < 12; i++) {
    vec3 d = c - u_pal[i];
    float dd = dot(d, d * vec3(0.9, 1.2, 0.7));
    if (dd < bd) { bd = dd; best = u_pal[i]; }
  }
  vec2 f = fract(uv * blocks);
  float grid = step(0.94, max(f.x, f.y));
  return mix(best, best * 0.9, grid * 0.6);
}

void main() {
  vec2 uv = v_uv;
  vec3 c;
  if (u_mode == 2) c = inkLook(uv);
  else if (u_mode == 3) c = risoLook(uv);
  else if (u_mode == 4) c = pixelLook(uv);
  else {
    c = beauty(uv, tex(uv));
    c = grade(c, uv);
    if (u_mode == 1) c = mix(u_c0, u_c1, clamp(luma(c), 0.0, 1.0));
  }
  if (u_vig > 0.0) {
    vec2 d = uv - 0.5;
    c *= 1.0 - u_vig * smoothstep(0.3, 0.85, length(d * vec2(1.0, u_out.y / u_out.x) * 1.2));
  }
  if (u_grain > 0.0) c += (hash(uv * u_out) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;

const hex3 = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

class GL {
  constructor() {
    this.canvas = canvas(4, 4);
    const gl = (this.gl = this.canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false }));
    if (!gl) throw new Error('no webgl');
    this.canvas.addEventListener('webglcontextlost', () => (this.lost = true));
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    this.prog = prog;
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    this.u = {};
    const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(prog, i);
      const name = info.name.replace(/\[0\]$/, '');
      this.u[name] = gl.getUniformLocation(prog, info.name);
    }
    gl.uniform3fv(this.u.u_pal, new Float32Array(PIXEL_PALETTE.flatMap(hex3)));
    this.maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  }

  draw(src, { crop, mirror = false, w, h, fx = {}, mode = 0, beauty = {}, seed = 0 }) {
    const { gl, u } = this;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
    const c = crop || { x: 0, y: 0, w: sw, h: sh };
    // texture v runs bottom-up after FLIP_Y
    gl.uniform4f(u.u_crop, c.x / sw, 1 - (c.y + c.h) / sh, c.w / sw, c.h / sh);
    gl.uniform1f(u.u_mirror, mirror ? 1 : 0);
    gl.uniform2f(u.u_out, w, h);
    gl.uniform1f(u.u_seed, seed % 97);
    gl.uniform1f(u.u_smooth, beauty.smooth || 0);
    gl.uniform1f(u.u_bright, beauty.bright || 0);
    gl.uniform1f(u.u_exposure, fx.exposure || 0);
    gl.uniform1f(u.u_contrast, fx.contrast ?? 1);
    gl.uniform1f(u.u_sat, fx.sat ?? 1);
    gl.uniform1f(u.u_temp, fx.temp || 0);
    gl.uniform1f(u.u_tint, fx.tint || 0);
    gl.uniform1f(u.u_fade, fx.fade || 0);
    gl.uniform1f(u.u_vig, fx.vig || 0);
    gl.uniform1f(u.u_grain, fx.grain || 0);
    gl.uniform1f(u.u_glow, fx.glow || 0);
    gl.uniform3fv(u.u_shadow, hex3(fx.shadow || '#808080'));
    gl.uniform3fv(u.u_high, hex3(fx.high || '#ffffff'));
    gl.uniform1f(u.u_split, fx.split || 0);
    gl.uniform1i(u.u_mode, mode);
    gl.uniform3fv(u.u_c0, hex3(fx.c0 || '#000000'));
    gl.uniform3fv(u.u_c1, hex3(fx.c1 || '#ffffff'));
    gl.uniform3fv(u.u_c2, hex3(fx.c2 || '#808080'));
    gl.uniform3fv(u.u_c3, hex3(fx.c3 || '#000000'));
    gl.uniform1f(u.u_amt, fx.amt ?? 1);
    gl.uniform1f(u.u_blocks, fx.blocks || 64);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return this.canvas;
  }
}

let glInst = null;
let glFailed = false;

function getGL() {
  if (glInst?.lost) glInst = null;
  if (!glInst && !glFailed) {
    try {
      glInst = new GL();
    } catch (e) {
      console.warn('[fx] WebGL unavailable, filters disabled:', e.message);
      glFailed = true;
    }
  }
  return glInst;
}

export const webglOK = () => !!getGL();

// High-quality downscale + crop (+ mirror) on a 2D canvas.
export function prep(src, crop, w, h, mirror = false) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
  const k = crop || { x: 0, y: 0, w: sw, h: sh };
  if (mirror) {
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
  }
  // step down in halves for smoother large reductions
  let img = src, ix = k.x, iy = k.y, iw = k.w, ih = k.h;
  while (iw > w * 2.2 && ih > h * 2.2) {
    const t = canvas(Math.round(iw / 2), Math.round(ih / 2));
    t.getContext('2d').drawImage(img, ix, iy, iw, ih, 0, 0, t.width, t.height);
    img = t;
    ix = iy = 0;
    iw = t.width;
    ih = t.height;
  }
  ctx.drawImage(img, ix, iy, iw, ih, 0, 0, w, h);
  return c;
}

// Render `src` (already cropped to the right aspect) through a filter.
export function applyFilter(src, filter, beauty, w, h, { seed = 1, target = null } = {}) {
  const f = typeof filter === 'string' ? filterById(filter) : filter;
  const b = typeof beauty === 'string' ? beautyById(beauty) : beauty || BEAUTY[0];
  const small = prep(src, null, w, h);
  const out = target || canvas(w, h);
  out.width = w;
  out.height = h;
  const octx = out.getContext('2d');
  const gl = getGL();
  if (f.ascii) {
    const pre = gl ? gl.draw(small, { w, h, beauty: b, fx: { contrast: 1.15, sat: 1.05 }, seed }) : small;
    asciiInto(octx, pre, w, h);
    return out;
  }
  if (!gl) {
    octx.drawImage(small, 0, 0);
    return out;
  }
  octx.drawImage(gl.draw(small, { w, h, fx: f.p || {}, mode: f.mode || 0, beauty: f.mode >= 2 ? {} : b, seed }), 0, 0);
  return out;
}

// Live camera preview: straight from the video texture, cropped + mirrored.
export function renderLive(src, target, { crop, mirror, beauty, fx = { temp: 0.02 } }) {
  const gl = getGL();
  const ctx = target.getContext('2d');
  const w = target.width, h = target.height;
  if (!gl) {
    const sw = src.videoWidth || src.width, sh = src.videoHeight || src.height;
    const k = crop || { x: 0, y: 0, w: sw, h: sh };
    ctx.save();
    if (mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(src, k.x, k.y, k.w, k.h, 0, 0, w, h);
    ctx.restore();
    return;
  }
  ctx.drawImage(gl.draw(src, { crop, mirror, w, h, fx, beauty: beautyById(beauty) }), 0, 0);
}

// ------------------------------------------------------------------ ascii

const RAMP = ' .:-=+*oxO#%@';

function asciiInto(ctx, src, w, h) {
  const cols = Math.max(28, Math.round(w / 7.5));
  const cw = w / cols;
  const rows = Math.max(10, Math.round(h / (cw * 1.8)));
  const lh = h / rows;
  const probe = canvas(cols, rows);
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  pctx.imageSmoothingQuality = 'high';
  pctx.drawImage(src, 0, 0, cols, rows);
  const px = pctx.getImageData(0, 0, cols, rows).data;
  // auto-levels: stretch the 3rd–97th percentile of luminance to the full ramp
  const lum = new Float32Array(cols * rows);
  for (let i = 0; i < lum.length; i++) lum[i] = (px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114) / 255;
  const sorted = Float32Array.from(lum).sort();
  const lo = sorted[Math.floor(sorted.length * 0.03)], hi = sorted[Math.floor(sorted.length * 0.97)];
  const span = Math.max(0.05, hi - lo);
  ctx.fillStyle = '#141413';
  ctx.fillRect(0, 0, w, h);
  ctx.font = `600 ${lh * 0.9}px ${FAMILY.mono}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const v = Math.min(1, Math.max(0, (lum[i] - lo) / span));
      const ch = RAMP[Math.round(v * (RAMP.length - 1))];
      if (ch === ' ') continue;
      // the pixel's own colour, lifted so it reads on the dark background
      const k = 0.45 + v * 0.75;
      const r = Math.min(255, px[i * 4] * k + 30), g = Math.min(255, px[i * 4 + 1] * k + 22), b = Math.min(255, px[i * 4 + 2] * k + 18);
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      ctx.fillText(ch, (x + 0.5) * cw, (y + 0.5) * lh);
    }
}
