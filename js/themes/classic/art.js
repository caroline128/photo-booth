// Art for the classic analog booth: dress-up props from a vintage costume
// box, ink/stamp stickers, and four strip frames.

import { svg, heartD, starD, textSticker, rng, speckle } from '../../art/kit.js';
import { stamp, rrect } from '../../core/util.js';
import { stripLayout } from '../../engine/compose.js';

// ----------------------------------------------------------------- props
// anchor/w/origin: see js/engine/props.js

export const props = [
  {
    id: 'fedora',
    name: '绅士礼帽',
    anchor: 'head',
    w: 3.1,
    dy: -0.12,
    origin: [0.5, 0.9],
    svg: svg(240, 130, `
      <path d="M52 100 C52 62 64 26 90 20 C106 16 112 32 120 32 C128 32 134 16 150 20 C176 26 188 62 188 100 Z" fill="#3b332e"/>
      <path d="M90 22 C104 18 110 30 120 32 C112 44 104 70 102 98 L66 98 C68 60 76 30 90 22Z" fill="#4a413b"/>
      <path d="M52 84 C92 92 148 92 188 84 L189 102 C148 110 92 110 51 102Z" fill="#7d1c1c"/>
      <ellipse cx="120" cy="108" rx="116" ry="19" fill="#26201c"/>
      <ellipse cx="120" cy="104" rx="84" ry="9" fill="#3b332e"/>`),
  },
  {
    id: 'tophat',
    name: '魔术高帽',
    anchor: 'head',
    w: 2.5,
    dy: -0.12,
    origin: [0.5, 0.93],
    svg: svg(200, 190, `
      <path d="M52 20 L148 20 L142 164 L58 164 Z" fill="#1d1b1e"/>
      <path d="M52 20 L148 20 L147 34 L53 34 Z" fill="#2c2a2e"/>
      <path d="M60 128 L140 128 L139 152 L61 152 Z" fill="#b8262d"/>
      <path d="M70 24 L84 24 L80 160 L66 160Z" fill="#fff" opacity=".08"/>
      <ellipse cx="100" cy="170" rx="96" ry="16" fill="#111"/>
      <ellipse cx="100" cy="20" rx="48" ry="8" fill="#343236"/>`),
  },
  {
    id: 'roundglasses',
    name: '圆框眼镜',
    anchor: 'eyes',
    w: 2.1,
    origin: [0.5, 0.5],
    svg: svg(240, 90, `
      <g fill="none" stroke="#2a211c" stroke-width="9">
        <circle cx="62" cy="45" r="36"/><circle cx="178" cy="45" r="36"/>
        <path d="M98 40 Q120 26 142 40"/><path d="M26 40 L4 30"/><path d="M214 40 L236 30"/>
      </g>
      <circle cx="62" cy="45" r="31" fill="#d8e6ea" opacity=".22"/><circle cx="178" cy="45" r="31" fill="#d8e6ea" opacity=".22"/>
      <path d="M44 30 Q52 22 62 22" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
      <path d="M160 30 Q168 22 178 22" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>`),
  },
  {
    id: 'cateye',
    name: '猫眼墨镜',
    anchor: 'eyes',
    w: 2.35,
    dy: 0.02,
    origin: [0.5, 0.52],
    svg: svg(260, 100, `
      <path d="M8 22 C40 10 92 12 122 30 L120 44 C112 78 86 88 60 84 C30 80 16 60 12 40 C10 32 8 26 8 22Z" fill="#161214"/>
      <path d="M252 22 C220 10 168 12 138 30 L140 44 C148 78 174 88 200 84 C230 80 244 60 248 40 C250 32 252 26 252 22Z" fill="#161214"/>
      <path d="M120 36 Q130 30 140 36" stroke="#161214" stroke-width="8" fill="none"/>
      <path d="M8 22 L0 8 L30 16Z M252 22 L260 8 L230 16Z" fill="#161214"/>
      <circle cx="18" cy="22" r="4" fill="#e8c170"/><circle cx="242" cy="22" r="4" fill="#e8c170"/>
      <path d="M34 34 Q60 26 88 34" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>
      <path d="M172 34 Q198 26 226 34" stroke="#fff" stroke-width="5" fill="none" opacity=".35" stroke-linecap="round"/>`),
  },
  {
    id: 'monocle',
    name: '单片眼镜',
    anchor: 'eyes',
    w: 0.95,
    dx: 0.5,
    origin: [0.42, 0.33],
    svg: svg(110, 170, `
      <circle cx="46" cy="46" r="38" fill="#e8f0f2" fill-opacity=".25" stroke="#c9a14a" stroke-width="8"/>
      <path d="M22 30 Q34 16 50 16" stroke="#fff" stroke-width="5" fill="none" opacity=".7" stroke-linecap="round"/>
      <path d="M80 70 C100 100 60 120 88 166" stroke="#c9a14a" stroke-width="4" fill="none" stroke-dasharray="7 5"/>`),
  },
  {
    id: 'mustache',
    name: '八字胡',
    anchor: 'lip',
    w: 1.7,
    dy: -0.05,
    origin: [0.5, 0.35],
    svg: svg(240, 80, `
      <path d="M120 22 C104 8 80 10 62 26 C46 40 26 44 10 30 C4 26 2 34 8 42 C24 62 60 66 88 54 C104 48 114 40 120 34
               C126 40 136 48 152 54 C180 66 216 62 232 42 C238 34 236 26 230 30 C214 44 194 40 178 26 C160 10 136 8 120 22Z" fill="#2b1d16"/>
      <path d="M70 30 C88 24 104 26 114 32" stroke="#5a4033" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  },
  {
    id: 'pipe',
    name: '烟斗',
    anchor: 'mouth',
    w: 1.25,
    dx: 0.12,
    origin: [0.06, 0.2],
    svg: svg(180, 120, `
      <path d="M4 16 L96 30" stroke="#1e1a18" stroke-width="12" stroke-linecap="round"/>
      <path d="M90 28 C118 34 126 40 126 56 L126 96 C126 112 170 112 170 96 L170 44 C170 36 162 34 150 36 C132 38 116 26 94 24Z" fill="#6b3b1f"/>
      <ellipse cx="148" cy="42" rx="22" ry="7" fill="#2a160b"/>
      <path d="M134 50 L134 98" stroke="#8b5530" stroke-width="5" opacity=".7"/>`),
  },
  {
    id: 'bowtie',
    name: '领结',
    anchor: 'neck',
    w: 1.35,
    dy: 0.25,
    origin: [0.5, 0.5],
    svg: svg(200, 100, `
      <path d="M100 50 L14 10 C4 6 0 12 0 22 L0 78 C0 88 4 94 14 90Z" fill="#8e1b1b"/>
      <path d="M100 50 L186 10 C196 6 200 12 200 22 L200 78 C200 88 196 94 186 90Z" fill="#8e1b1b"/>
      <rect x="82" y="32" width="36" height="36" rx="8" fill="#6d1212"/>
      <g fill="#f3e6c8" opacity=".85"><circle cx="30" cy="34" r="5"/><circle cx="52" cy="60" r="5"/><circle cx="30" cy="72" r="5"/><circle cx="170" cy="34" r="5"/><circle cx="148" cy="60" r="5"/><circle cx="170" cy="72" r="5"/></g>`),
  },
  {
    id: 'pearls',
    name: '珍珠项链',
    anchor: 'neck',
    w: 2.3,
    dy: 0.35,
    origin: [0.5, 0.2],
    svg: svg(260, 120, (() => {
      let s = '';
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        const x = 12 + t * 236;
        const y = 12 + Math.sin(t * Math.PI) * 88;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" fill="#f6f1e6" stroke="#c9bfae" stroke-width="2"/><circle cx="${(x - 3).toFixed(1)}" cy="${(y - 3).toFixed(1)}" r="3" fill="#fff"/>`;
      }
      return s;
    })()),
  },
  {
    id: 'flapper',
    name: '羽毛发带',
    anchor: 'forehead',
    w: 2.7,
    dy: -0.25,
    origin: [0.5, 0.78],
    svg: svg(260, 170, `
      <path d="M190 120 C170 70 176 26 206 4 C214 40 232 70 226 116Z" fill="#f3efe6" stroke="#d9d0bf" stroke-width="3"/>
      <path d="M204 10 C206 50 212 84 214 116" stroke="#b9ae9a" stroke-width="3" fill="none"/>
      <path d="M8 118 C80 140 180 140 252 118 L252 138 C180 160 80 160 8 138Z" fill="#1f1b24"/>
      <g fill="#e8c170">${Array.from({ length: 12 }, (_, i) => `<circle cx="${20 + i * 20}" cy="${131 + Math.sin((i / 11) * Math.PI) * 8}" r="4"/>`).join('')}</g>
      <circle cx="208" cy="124" r="14" fill="#e8c170" stroke="#9c7a2b" stroke-width="3"/>`),
  },
  {
    id: 'beret',
    name: '贝雷帽',
    anchor: 'head',
    w: 2.9,
    dy: 0.02,
    rot: -0.18,
    origin: [0.5, 0.86],
    svg: svg(240, 110, `
      <path d="M10 70 C14 30 70 8 130 10 C196 12 236 40 230 66 C226 84 190 92 120 92 C50 92 8 88 10 70Z" fill="#1f1d24"/>
      <path d="M40 82 C80 98 170 98 206 82 L204 96 C170 106 80 106 42 96Z" fill="#141217"/>
      <path d="M120 10 L124 0" stroke="#1f1d24" stroke-width="7" stroke-linecap="round"/>
      <path d="M40 50 C70 30 110 24 150 26" stroke="#fff" stroke-width="5" fill="none" opacity=".1" stroke-linecap="round"/>`),
  },
];

// ----------------------------------------------------------------- stickers

const INK = '#1f1b18';
const CHALK = '#f7f3ea';

function postmark(ctx, w) {
  const r = w / 2 - w * 0.04;
  ctx.translate(w / 2, w / 2);
  ctx.rotate(-0.2);
  ctx.strokeStyle = 'rgba(160,30,30,0.85)';
  ctx.fillStyle = 'rgba(160,30,30,0.85)';
  ctx.lineWidth = w * 0.03;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = w * 0.015;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = `400 ${w * 0.1}px "Special Elite", monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = '★ PHOTOMATIC ★ SAY CHEESE ';
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate((i / text.length) * Math.PI * 2);
    ctx.fillText(text[i], 0, -r * 0.83);
    ctx.restore();
  }
  ctx.font = `400 ${w * 0.12}px "Special Elite", monospace`;
  const d = new Date();
  ctx.fillText(d.toLocaleString('en', { month: 'short' }).toUpperCase(), 0, -w * 0.09);
  ctx.font = `400 ${w * 0.17}px "Special Elite", monospace`;
  ctx.fillText(String(d.getDate()).padStart(2, '0'), 0, w * 0.06);
  ctx.font = `400 ${w * 0.1}px "Special Elite", monospace`;
  ctx.fillText(String(d.getFullYear()), 0, w * 0.2);
  // rough ink: knock out speckles
  ctx.globalCompositeOperation = 'destination-out';
  const rr = rng(3);
  for (let i = 0; i < 180; i++) ctx.fillRect((rr() - 0.5) * w, (rr() - 0.5) * w, w * 0.012, w * 0.012);
}

function labelTape(text, id, color = '#141414') {
  return textSticker({
    id,
    name: text,
    text,
    font: '"Rubik Mono One", "Bungee", monospace',
    color: '#f4f4f4',
    bg: color,
    bgRadius: 0.08,
    pad: 0.35,
    letterSpacing: 0.08,
    size: 0.5,
    group: '文字',
  });
}

export const stickers = [
  { id: 'postmark', name: '邮戳', ratio: 1, size: 0.34, group: '印章', draw: (ctx, w) => postmark(ctx, w) },
  {
    id: 'kiss',
    name: '口红印',
    group: '印章',
    size: 0.26,
    svg: svg(200, 120, `
      <path d="M100 40 C88 18 60 8 34 22 C18 30 8 44 4 58 C30 50 60 50 100 58 C140 50 170 50 196 58 C192 44 182 30 166 22 C140 8 112 18 100 40Z" fill="#b3122a"/>
      <path d="M4 62 C30 58 70 60 100 66 C130 60 170 58 196 62 C184 92 150 112 100 112 C50 112 16 92 4 62Z" fill="#c8182f"/>
      <path d="M20 60 C60 64 80 70 100 70 C120 70 140 64 180 60" stroke="#7a0a1a" stroke-width="5" fill="none"/>
      <g stroke="#7a0a1a" stroke-width="2" opacity=".5"><path d="M60 80 L62 100"/><path d="M80 78 L80 104"/><path d="M120 78 L120 104"/><path d="M140 80 L138 100"/><path d="M70 28 L74 44"/><path d="M130 28 L126 44"/></g>`),
  },
  {
    id: 'chalk-heart',
    name: '手绘爱心',
    group: '涂鸦',
    size: 0.28,
    svg: svg(120, 110, `<path d="${heartD(60, 58, 42)}" fill="none" stroke="${CHALK}" stroke-width="7" stroke-linejoin="round" stroke-dasharray="60 6 30 4"/>
      <path d="${heartD(62, 56, 38)}" fill="none" stroke="${CHALK}" stroke-width="3" opacity=".6"/>`),
  },
  {
    id: 'chalk-stars',
    name: '星星涂鸦',
    group: '涂鸦',
    size: 0.3,
    svg: svg(160, 120, `<g fill="none" stroke="${CHALK}" stroke-width="5" stroke-linejoin="round">
      <path d="${starD(50, 58, 38)}"/><path d="${starD(124, 32, 20)}"/><path d="${starD(126, 92, 14)}"/></g>
      <g stroke="${CHALK}" stroke-width="4" stroke-linecap="round"><path d="M96 58 L106 58"/><path d="M101 53 L101 63"/></g>`),
  },
  {
    id: 'arrow-me',
    name: '箭头 me',
    group: '涂鸦',
    size: 0.3,
    draw(ctx, w, h) {
      ctx.strokeStyle = CHALK;
      ctx.fillStyle = CHALK;
      ctx.lineWidth = w * 0.035;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.08, h * 0.25);
      ctx.bezierCurveTo(w * 0.35, h * 0.1, w * 0.62, h * 0.42, w * 0.84, h * 0.78);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.9, h * 0.9);
      ctx.lineTo(w * 0.72, h * 0.78);
      ctx.moveTo(w * 0.9, h * 0.9);
      ctx.lineTo(w * 0.9, h * 0.66);
      ctx.stroke();
      ctx.font = `700 ${w * 0.26}px "Caveat", cursive`;
      ctx.fillText('me', w * 0.06, h * 0.62);
    },
    ratio: 0.62,
  },
  textSticker({ id: 'xoxo', text: 'xoxo', font: '"Caveat", cursive', weight: 700, color: CHALK, size: 0.34, group: '涂鸦' }),
  textSticker({ id: 'forever', text: 'forever', font: '"Caveat", cursive', weight: 700, color: CHALK, size: 0.4, group: '涂鸦' }),
  {
    id: 'ticket',
    name: '电影票根',
    group: '印章',
    size: 0.46,
    outline: 0.03,
    draw(ctx, w, h) {
      const n = 7;
      ctx.fillStyle = '#e9d9b0';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w, 0);
      for (let i = 0; i < n; i++) ctx.arc(w, (h / n) * (i + 0.5), h / n / 2.6, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      for (let i = n - 1; i >= 0; i--) ctx.arc(0, (h / n) * (i + 0.5), h / n / 2.6, Math.PI / 2, -Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#9e1f1f';
      ctx.lineWidth = h * 0.03;
      ctx.strokeRect(w * 0.07, h * 0.12, w * 0.86, h * 0.76);
      ctx.fillStyle = '#9e1f1f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `400 ${h * 0.3}px "Limelight", serif`;
      ctx.fillText('ADMIT ONE', w / 2, h * 0.45);
      ctx.font = `400 ${h * 0.13}px "Special Elite", monospace`;
      const d = new Date();
      ctx.fillText(`No. ${String(((d.getDate() * 7919 + d.getMonth() * 104729) % 90000) + 10000)}`, w / 2, h * 0.72);
    },
    ratio: 0.42,
  },
  {
    id: 'tape',
    name: '纸胶带',
    group: '装饰',
    size: 0.42,
    svg: svg(220, 60, `<path d="M6 8 L12 2 L18 8 L24 3 L214 6 L208 12 L216 18 L208 26 L216 34 L208 42 L216 52 L212 58 L20 55 L14 49 L6 54 L10 42 L3 34 L10 26 L3 18Z" fill="#e7d8b3" fill-opacity=".82"/>
      <path d="M30 10 L200 12" stroke="#fff" stroke-width="3" opacity=".35"/>`),
  },
  {
    id: 'corners',
    name: '相角',
    group: '装饰',
    size: 0.2,
    svg: svg(100, 100, `<path d="M0 0 L100 0 L0 100Z" fill="#1b1714"/><path d="M12 12 L70 12" stroke="#fff" stroke-width="3" opacity=".2"/>`),
  },
  {
    id: 'laurel',
    name: '月桂花环',
    group: '装饰',
    size: 0.46,
    svg: svg(220, 180, (() => {
      let s = '';
      for (const side of [-1, 1]) {
        for (let i = 0; i < 8; i++) {
          const t = i / 7;
          const a = Math.PI * (0.95 - t * 0.8);
          const x = 110 + side * Math.cos(a) * 88;
          const y = 96 - Math.sin(a) * 78 + 40;
          const rot = (side > 0 ? -1 : 1) * (40 + t * 60) * (side > 0 ? 1 : -1);
          s += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="20" transform="rotate(${(side * (-30 + t * -60)).toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#c9a14a" stroke="#8d6d25" stroke-width="2"/>`;
          void rot;
        }
      }
      return s + `<path d="M84 160 Q110 150 136 160" stroke="#c9a14a" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    })()),
  },
  labelTape('BEST FRIENDS', 'lbl-bff'),
  labelTape('SAY CHEESE', 'lbl-cheese', '#8e1b1b'),
  labelTape('1965', 'lbl-1965', '#1f3a5f'),
  {
    id: 'camera',
    name: '老相机',
    group: '装饰',
    size: 0.3,
    svg: svg(160, 120, `<g fill="none" stroke="${CHALK}" stroke-width="6" stroke-linejoin="round">
      <rect x="10" y="34" width="140" height="78" rx="12"/><path d="M50 34 L60 16 L100 16 L110 34"/>
      <circle cx="80" cy="72" r="26"/><circle cx="80" cy="72" r="12"/><rect x="118" y="44" width="18" height="10" rx="3"/></g>
      <path d="M20 22 L34 22" stroke="${CHALK}" stroke-width="6" stroke-linecap="round"/>`),
  },
  {
    id: 'rose',
    name: '玫瑰',
    group: '装饰',
    size: 0.3,
    svg: svg(120, 160, `
      <path d="M60 70 C64 100 58 130 62 156" stroke="#2f5d33" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M62 116 C80 100 100 104 106 96 C94 120 76 124 62 122Z" fill="#3f7a44"/>
      <path d="M60 110 C42 96 22 100 16 92 C26 116 44 120 60 118Z" fill="#3f7a44"/>
      <path d="M60 14 C86 12 104 30 100 52 C96 74 76 82 60 80 C40 82 20 72 20 50 C18 28 36 14 60 14Z" fill="#b3122a"/>
      <path d="M60 26 C78 26 88 40 84 52 C80 64 66 68 58 64 C48 62 42 52 46 42 C50 32 56 36 62 40 C70 46 66 56 60 54" stroke="#6d0a18" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M28 40 C34 28 46 22 56 22" stroke="#e24a5c" stroke-width="4" fill="none" opacity=".7" stroke-linecap="round"/>`),
  },
  {
    id: 'crown',
    name: '小皇冠',
    group: '涂鸦',
    size: 0.26,
    svg: svg(140, 100, `<path d="M12 84 L20 24 L48 54 L70 12 L92 54 L120 24 L128 84Z" fill="none" stroke="#e8c170" stroke-width="7" stroke-linejoin="round"/>
      <g fill="#e8c170"><circle cx="20" cy="20" r="7"/><circle cx="70" cy="9" r="7"/><circle cx="120" cy="20" r="7"/></g>`),
  },
  {
    id: 'approved',
    name: 'APPROVED 印',
    group: '印章',
    size: 0.46,
    draw(ctx, w, h) {
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-0.12);
      ctx.strokeStyle = 'rgba(40,70,160,0.85)';
      ctx.fillStyle = 'rgba(40,70,160,0.85)';
      ctx.lineWidth = h * 0.08;
      rrect(ctx, -w * 0.46, -h * 0.4, w * 0.92, h * 0.8, h * 0.12);
      ctx.stroke();
      ctx.font = `400 ${h * 0.46}px "Rubik Mono One", "Bungee", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CUTE', 0, h * 0.03);
      ctx.globalCompositeOperation = 'destination-out';
      const r = rng(11);
      for (let i = 0; i < 160; i++) ctx.fillRect((r() - 0.5) * w, (r() - 0.5) * h, w * 0.01, w * 0.01);
    },
    ratio: 0.42,
  },
  {
    id: 'bubble-hello',
    name: 'Hello 对话框',
    group: '文字',
    size: 0.36,
    outline: 0.03,
    draw(ctx, w, h) {
      ctx.fillStyle = '#fbf7ec';
      ctx.strokeStyle = INK;
      ctx.lineWidth = w * 0.03;
      ctx.beginPath();
      ctx.ellipse(w / 2, h * 0.42, w * 0.46, h * 0.36, 0, 0, Math.PI * 2);
      ctx.moveTo(w * 0.3, h * 0.72);
      ctx.lineTo(w * 0.18, h * 0.96);
      ctx.lineTo(w * 0.44, h * 0.76);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = `700 ${h * 0.34}px "Caveat", cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Hello!', w / 2, h * 0.43);
    },
    ratio: 0.72,
  },
  {
    id: 'datestamp',
    name: '日期章',
    group: '印章',
    size: 0.42,
    draw(ctx, w, h) {
      ctx.fillStyle = 'rgba(90,40,120,0.82)';
      ctx.font = `400 ${h * 0.62}px "Special Elite", monospace`;
      ctx.textBaseline = 'middle';
      ctx.fillText(new Date().toDateString().slice(4).toUpperCase(), w * 0.03, h * 0.52);
      ctx.globalCompositeOperation = 'destination-out';
      const r = rng(5);
      for (let i = 0; i < 120; i++) ctx.fillRect(r() * w, r() * h, w * 0.008, w * 0.008);
    },
    ratio: 0.16,
  },
];

// ----------------------------------------------------------------- layout + frames

export const layouts = [
  {
    ...stripLayout({ id: 'strip', name: '经典四连拍', n: 4, W: 600, H: 2400, side: 40, top: 50, gap: 26, bottom: 240, aspect: 0.92, shape: 'round', r: 10 }),
    desc: '2×8 英寸长条 · 和老式化学机一样',
  },
];

function paper(ctx, W, H, base, seed) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);
  speckle(ctx, 0, 0, W, H, { n: 2600, color: 'rgba(80,60,40,0.05)', size: 2, seed });
}

function stains(ctx, W, H, seed) {
  // uneven chemistry near the strip edges
  const r = rng(seed + 1);
  for (let i = 0; i < 6; i++) {
    const x = r() < 0.5 ? r() * W * 0.2 : W - r() * W * 0.2;
    const y = r() * H;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 40 + r() * 90);
    g.addColorStop(0, 'rgba(150,110,50,0.18)');
    g.addColorStop(1, 'rgba(150,110,50,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
}

function footer(ctx, L, info, { color, font = '"Special Elite", monospace', title = 'PHOTOMATIC' }) {
  const y = L.footer.y + L.footer.h * 0.42;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `400 58px "Limelight", serif`;
  ctx.fillText(title, L.W / 2, y);
  ctx.font = `400 26px ${font}`;
  ctx.fillText(`${stamp(info.date || new Date())}  ·  No.${String(info.serial || 0).padStart(6, '0')}`, L.W / 2, y + 62);
}

export const frames = [
  {
    id: 'white',
    name: '白边经典',
    paint: {
      under(ctx, L, info) {
        paper(ctx, L.W, L.H, '#f3efe6', 11);
      },
      slot(ctx, s) {
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 2;
        ctx.stroke();
        void s;
      },
      over(ctx, L, info) {
        stains(ctx, L.W, L.H, info.serial || 3);
        footer(ctx, L, info, { color: '#3a332d' });
      },
    },
  },
  {
    id: 'black',
    name: '黑边胶片',
    paint: {
      under(ctx, L) {
        paper(ctx, L.W, L.H, '#141312', 5);
      },
      slot(ctx) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 3;
        ctx.stroke();
      },
      over(ctx, L, info) {
        footer(ctx, L, info, { color: '#f3efe6', title: '4 POSES' });
      },
    },
  },
  {
    id: 'deckle',
    name: '锯齿花边',
    paint: {
      under(ctx, L) {
        ctx.clearRect(0, 0, L.W, L.H);
        const r = 13;
        ctx.save();
        ctx.beginPath();
        // scalloped outline
        for (let x = 0; x <= L.W; x += r * 2) ctx.arc(x + r, r, r, Math.PI, 0);
        for (let y = 0; y <= L.H; y += r * 2) ctx.arc(L.W - r, y + r, r, -Math.PI / 2, Math.PI / 2);
        for (let x = L.W; x >= 0; x -= r * 2) ctx.arc(x - r, L.H - r, r, 0, Math.PI);
        for (let y = L.H; y >= 0; y -= r * 2) ctx.arc(r, y - r, r, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.clip();
        paper(ctx, L.W, L.H, '#efe3c8', 21);
        ctx.restore();
      },
      slot(ctx) {
        ctx.strokeStyle = '#fff8e8';
        ctx.lineWidth = 8;
        ctx.stroke();
      },
      over(ctx, L, info) {
        ctx.fillStyle = '#6b4e2e';
        ctx.textAlign = 'center';
        ctx.font = `700 74px "Caveat", cursive`;
        ctx.fillText('sweet memories', L.W / 2, L.footer.y + L.footer.h * 0.45);
        ctx.font = `400 26px "Special Elite", monospace`;
        ctx.fillText(stamp(info.date || new Date()), L.W / 2, L.footer.y + L.footer.h * 0.72);
      },
    },
  },
  {
    id: 'film',
    name: '35mm 胶片',
    paint: {
      under(ctx, L) {
        ctx.fillStyle = '#1c1612';
        ctx.fillRect(0, 0, L.W, L.H);
        ctx.fillStyle = '#f3efe6';
        for (let y = 18; y < L.H; y += 58) {
          rrect(ctx, 8, y, 20, 32, 5);
          ctx.fill();
          rrect(ctx, L.W - 28, y, 20, 32, 5);
          ctx.fill();
        }
      },
      over(ctx, L, info) {
        // film edge markings in the gaps between frames
        ctx.fillStyle = '#f0a33a';
        ctx.font = `400 17px "Special Elite", monospace`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        L.slots.forEach((s, i) => ctx.fillText(`KACHA 400  ▸ ${i + 1}A`, s.x + 6, s.y + s.h + 13));
        footer(ctx, L, info, { color: '#f0a33a', title: 'PHOTOMATIC' });
      },
    },
  },
];
