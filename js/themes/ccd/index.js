// Machine ⑤: DIGI 2003 — a millennium Chinese mall booth with a 1.3-megapixel
// CCD camera. Offline reference (docs/research.md §3.4, ⑤): grainy, slightly
// blurry digital photos blown out in the middle by a harsh flash, an orange
// burned-in date; 非主流 dreamy filters, pink bubbles, the 45° upward pose and
// frames covered in 火星文; mall booths shoot 8–9 frames and print one
// 6-inch sheet or a 4-grid.

import { props, stickers, layouts, frames, FRAME_TEXT } from './art.js';

const today = new Date();
const md = `${String(today.getMonth() + 1).padStart(2, '0')} ${String(today.getDate()).padStart(2, '0')}`;

// the 1.3-megapixel sensor look, before any colour grade
const SENSOR = { pixel: 360, jpeg: 0.3, grain: 0.3, chroma: 0.3, sharpen: 0.35 };

const CCD_GRADE = { temp: 0.1, tint: 0.14, saturation: 1.14, contrast: 1.06, curve: 0.12, fade: 0.1 };

export default {
  id: 'ccd',
  name: 'DIGI 2003',
  plate: 'CCD 1.3M · AUTO FLASH',
  title: '千禧 CCD 大头贴',
  kicker: 'SINCE 2003 · 1.3 MEGA PIXELS',
  tagline: '颗粒感 + 闪光过曝 + 橙色日期戳，一秒穿越回 2005',
  features: ['6 连拍 · 1 次重拍', '闪光灯 开 / 关', `橙色日期戳 '05`, '十六连小贴纸', '翻盖手机相框', '火星文贴纸'],
  inspiration: '千禧年代商场里的数码大头贴 + CCD 卡片机',
  price: 2,
  badge: '怀旧',
  screenText: `'05 ${md}`,
  lang: 'zh-CN',
  voice: { pitch: 1.3, rate: 1.08 },
  colors: {
    body: '#c7ced8',
    trim: '#eef2f7',
    accent: '#2f6bff',
    curtain: '#27326b',
    screen: '#0e2a2c',
    screenText: '#d8ffe9',
    glow: '#7fb2ff',
    btn: '#2f6bff',
    btnText: '#ffffff',
    card: 'rgba(216,255,233,0.06)',
    cardBorder: 'rgba(216,255,233,0.24)',
  },
  fonts: {
    display: '"Press Start 2P", "VT323", monospace',
    ui: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
    load: ['Press Start 2P', 'VT323', 'ZCOOL KuaiLe', 'ZCOOL QingKe HuangYou', 'Noto Sans SC', 'Pacifico', 'Caveat', 'Mochiy Pop One'],
    text: FRAME_TEXT,
  },
  bgm: { style: 'chip', key: 57, prog: [0, 5, 7, 0], minor: true },
  lines: {
    attract: ['亲～来拍张千禧大头贴咩？两枚代币，一秒穿越回 2005！', '颗粒感、过曝感、橙色日期戳，统统都有哦～'],
    insert: '亲，请投入两枚代币哦～',
    paid: '收到啦！偶们马上开始～',
    choose: '先选版式和相框，十六连小贴纸超有纪念意义滴！',
    flash: '要不要开闪光灯？开了就是中间亮亮的过曝感。',
    year: '照片右下角的日期，要不要穿越回 2005 年？',
    camera: '摄像头打开中，稍等一下下～',
    props: '道具架上有斜刘海、蝴蝶夹、大耳机和翻盖手机，戴上就是非主流！',
    ready: '下巴收一收，眼睛往上看，45 度角最上镜，要开始咯！',
    cheese: ['茄子！', '一二三，茄子～', '耶！'],
    done: '六张拍完啦，辛苦啦～',
    check: '看看照片，不满意可以重拍一张哦。',
    pick: '挑出你最满意的照片，点选的顺序就是排版的顺序～',
    retake: '好滴，再来一张！',
    filter: '选个滤镜吧：CCD 原味、闪光过曝，还是非主流梦幻？',
    decorate: '贴点火星文和闪图吧，越满越非主流！',
    hurry: '亲，时间快到咯！',
    timeup: '时间到！',
    review: '确认一下，没问题就打印咯～',
    print: '正在打印，热乎乎的相纸马上就好～',
    bye: '出片啦！记得收进相册里，886～',
  },
  shoot: {
    shots: 6,
    firstCountdown: 5,
    countdown: 4,
    retakes: 1,
    skipLabel: '📸 按快门（跳过倒数）',
    poses: [
      { text: '45° 仰角自拍', icon: '📐', sub: '下巴微收 · 眼睛往上看', line: { text: '手举高高，45 度角往上看，下巴收一收～' } },
      { text: '嘟嘴卖萌', icon: '😗', sub: 'DU ZUI' },
      { text: '剪刀手挡脸', icon: '✌️', sub: 'V · 挡住半边脸' },
      { text: '忧郁看窗外', icon: '🌧️', sub: '眼神放空 · 45° 抬头', line: { text: '忧郁地看向窗外，眼神放空～' } },
      { text: '双手捧脸', icon: '🌸', sub: 'FLOWER' },
      { text: '一起比心', icon: '💗', sub: 'HEART' },
    ],
  },
  selectTime: 50,
  prepTime: 90,
  pickTime: 70,
  filterTime: 40,
  decorateTime: 150,
  options: [
    {
      id: 'flash',
      title: '闪光灯',
      sub: 'FLASH',
      lead: '卡片机自带的小闪光灯：打开就是中间一团亮亮的「朦胧过曝感」。',
      line: 'flash',
      choices: [
        { id: 'on', name: '闪光灯 开', desc: '中心过曝、脸很白、背景偏暗——最 CCD 的味道', icon: '⚡' },
        { id: 'off', name: '闪光灯 关', desc: '室内自然光：偏暗偏糊，颗粒更明显', icon: '🌙' },
      ],
      default: 'on',
      time: 30,
    },
    {
      id: 'year',
      title: '日期戳',
      sub: 'DATE STAMP',
      lead: '每张照片右下角都会烧上橙色的数码日期，就像老卡片机一样。',
      line: 'year',
      choices: [
        { id: 'today', name: '今天', desc: `'${String(today.getFullYear()).slice(2)} ${md} · 真实拍摄日期`, icon: '📅' },
        { id: '2005', name: '穿越回 2005', desc: `'05 ${md} · 年份变成 2005，月日不变`, icon: '📼' },
      ],
      default: '2005',
      time: 30,
    },
  ],
  sampleProps: ['starshades', 'butterfly'],
  maxProps: 3,
  props,
  liveFx(session) {
    const flash = session.options?.flash !== 'off';
    return flash
      ? { ...SENSOR, flash: 0.7, vignette: 0.3 }
      : { ...SENSOR, grain: 0.42, exposure: -0.22, temp: 0.08, vignette: 0.2 };
  },
  previewFx: CCD_GRADE,
  filters: [
    { id: 'ccd', name: 'CCD 原味', desc: '暖调偏青 · 颗粒噪点', fx: { ...CCD_GRADE, grain: 0.38 } },
    { id: 'blown', name: '闪光过曝', desc: '强闪光 · 高反差', fx: { flash: 1, exposure: 0.2, contrast: 1.28, curve: 0.2, saturation: 0.95, vignette: 0.45 } },
    { id: 'night', name: '夜景模式', desc: '暗 · 噪点 · 偏蓝', fx: { exposure: -0.5, temp: -0.5, tint: 0.04, grain: 0.75, jpeg: 0.45, saturation: 0.75, contrast: 1.15, vignette: 0.4 } },
    { id: 'dreamy', name: '非主流梦幻', desc: '粉色柔光 · 高饱和', fx: { glow: 0.7, temp: 0.18, tint: -0.4, saturation: 1.3, exposure: 0.12, fade: 0.14, sharpen: 0, vignette: 0.25 } },
    { id: 'mono', name: '黑白证件', desc: '干净的黑白', fx: { tone: 'mono', contrast: 1.2, exposure: 0.05, grain: 0.25, jpeg: 0.08, chroma: 0 } },
  ],
  layouts,
  frames,
  stickers,
  textStyles: [
    { name: '火星文', font: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif', color: '#ff5fb8', gradient: ['#ffffff', '#ffb3e0', '#ff4fa3'], stroke: '#5c0f4a', strokeWidth: 0.2, outline: 0.05, chip: '#2a0f45' },
    { name: 'LCD 绿字', font: '"VT323", "ZCOOL QingKe HuangYou", monospace', color: '#b6ff6a', stroke: '#0d2410', strokeWidth: 0.16, outline: 0.04, outlineColor: '#0d2410', chip: '#0d2410' },
    { name: '日期橙', font: '"VT323", "ZCOOL QingKe HuangYou", monospace', color: '#ff8f1f', stroke: '#3a1600', strokeWidth: 0.12, outline: 0.04, outlineColor: '#1a1a1a', chip: '#1a1a1a' },
    { name: 'Pacifico', font: '"Pacifico", "ZCOOL KuaiLe", cursive', color: '#2f6bff', gradient: ['#bfe6ff', '#2f6bff'], stroke: '#ffffff', strokeWidth: 0.16, outline: 0.04, chip: '#eaf2ff' },
  ],
  phrases: ['伱是莪の唯①', 'ωǒ嗳伱', '好朋友一辈子', '青春万岁', '莪の寂寞伱不懂', '520', '886', 'Forever Young'],
  pens: [
    { pen: 'glitter', name: '亮片笔', width: 14 },
    { pen: 'rainbow', name: '彩虹笔', width: 12 },
    { pen: 'neon', name: '荧光笔', width: 12 },
    { pen: 'dots', name: '波点笔', width: 14 },
    { pen: 'solid', name: '圆珠笔', width: 8 },
  ],
  penColors: ['#ff4fa3', '#b25cff', '#2f6bff', '#a8ff3e', '#ff8f1f', '#ffffff', '#1b1b1f'],
  print: { kind: 'dyesub', sheet: 'single', copies: 1, paperName: '6 寸相纸', backColor: '#eef3ff' },
  placeholderTint: ['#dfe6f2', '#d0d9ea'],
};
