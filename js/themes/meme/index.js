// Machine ⑥: 抽象表情包机 — a Chinese meme / hot-word booth.
// Offline reference (docs/research.md §3.3, ⑥): a Shanghai studio with 30,000+
// dialect & meme templates (~200 new a month), 38 yuan for 9 shots; a Changsha
// shop dressed in candy colours, retro TVs, rhinestones and pixel art. Guests
// "don't need to look good" — they shoot to let off steam, in wigs, shades and
// head covers. Here: 9 fast shots, big outlined captions, a 9-grid meme sheet.

import { props, stickers, layouts, frames, CAPTION_FONT, FRAME_TEXT } from './art.js';

// The first nine match the nine pose prompts (they are the default captions).
const PRESETS = [
  '打工人打工魂',
  '尊嘟假嘟',
  '显眼包本包',
  '蚌埠住了',
  '不理解但尊重',
  '已读乱回',
  '在逃公主',
  '精神状态良好',
  '我太难了',
  '绝绝子',
  '破防了',
  '班味好重',
  '谁懂啊',
  '急急急',
  '麻了',
  '你人还怪好的',
  'i人勿扰',
  'e人出没',
  '摆烂中',
  '主打一个陪伴',
  '表情管理失败',
  '这很难评',
  '有被笑到',
  '今日份抽象已到账',
];

const theme = {
  id: 'meme',
  name: '抽象表情包机',
  plate: 'MEME BOOTH · 9 连拍',
  title: 'MEME BOOTH · 热梗大头贴',
  kicker: '不求好看 只求好玩',
  tagline: '9 连拍做表情，配上热梗大字，一张就是一套表情包',
  features: ['9 连拍 · 每张 3 秒', '热梗大字配字', '电子包浆 / 哈哈镜滤镜', '九宫格表情包'],
  inspiration: '国内热梗 / 表情包大头贴（上海方言热梗模板店、长沙表情包大头贴）',
  price: 2,
  badge: '抽象',
  screenText: '9 连拍',
  lang: 'zh-CN',
  voice: { pitch: 1.3, rate: 1.12 },
  colors: {
    body: '#ffd400',
    trim: '#141414',
    accent: '#ff3d7f',
    curtain: '#ff3d7f',
    screen: '#fffdf4',
    screenText: '#141414',
    glow: '#fff27a',
    btn: '#ffd400',
    btnText: '#141414',
    card: '#fff6c8',
    cardBorder: '#141414',
  },
  fonts: {
    display: '"ZCOOL QingKe HuangYou", "Noto Sans SC", sans-serif',
    ui: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif',
    // canvas fonts only (the two ZCOOL faces are CSS-only and load with the page)
    load: ['Noto Sans SC', 'Bangers', 'Press Start 2P', 'VT323'],
    text: FRAME_TEXT,
  },
  bgm: { style: 'bounce', key: 60, prog: [0, 5, 7, 5] },
  lines: {
    attract: ['来都来了，拍一套表情包再走！', '不求好看，只求好玩。投币开拍！'],
    insert: '请投入两枚代币，抽象之旅马上开始。',
    paid: '收到！精神状态检测：良好。',
    choose: '选一个表情包模板吧，九宫格最抽象。',
    camera: '摄像头打开了，表情管理可以放弃了。',
    props: '爆炸头、狗头套、像素墨镜，怎么离谱怎么来！',
    ready: '九连拍，每张三秒，跟着指令做表情！',
    cheese: ['茄子！', '就是现在！', '别憋着！'],
    done: '九张拍完！每一张都很有梗。',
    check: '看看你的抽象瞬间，不满意可以重拍一张。',
    pick: '挑出最抽象的那几张！',
    retake: '再来一张，这次更离谱一点！',
    filter: '来点滤镜：高饱和、电子包浆、哈哈镜，随便挑。',
    caption: '给每张照片配一句热梗，也可以自己写！',
    decorate: '贴纸随便贴，画笔随便画，越乱越好！',
    hurry: '急急急！时间快到了！',
    timeup: '时间到！就这样吧，挺好的。',
    review: '确认一下，没问题就打印了哦。',
    print: '表情包正在出炉，请稍候……',
    bye: '出片啦！记得发给好朋友当表情包！',
  },
  shoot: {
    shots: 9,
    firstCountdown: 5,
    countdown: 3,
    retakes: 1,
    skipLabel: '⚡ 我准备好了',
    poses: [
      { text: '假装在上班', icon: '💼', sub: 'AT WORK' },
      { text: '目瞪口呆', icon: '😮', sub: 'SHOCKED' },
      { text: '邪魅一笑', icon: '😏', sub: 'SMIRK' },
      { text: '震惊到裂开', icon: '💥', sub: 'CRACKED' },
      { text: '疑惑地歪头', icon: '❓', sub: 'HUH?' },
      { text: '翻个白眼', icon: '🙄', sub: 'EYE ROLL' },
      { text: '嘟嘴卖萌', icon: '😗', sub: 'CUTE' },
      { text: '思考人生', icon: '🤔', sub: 'THINKING' },
      { text: '夸张大哭', icon: '😭', sub: 'CRYING' },
    ],
  },
  selectTime: 45,
  prepTime: 90,
  pickTime: 60,
  filterTime: 40,
  decorateTime: 120,
  captions: {
    title: '配上热梗',
    lead: '给每张照片配一句',
    presets: PRESETS,
    max: 14,
    time: 100,
    font: CAPTION_FONT,
  },
  sampleCaptions: PRESETS.slice(0, 9),
  sampleProps: ['meme-shades', 'meme-sweat'],
  maxProps: 3,
  props,
  liveFx() {
    return { saturation: 1.12, contrast: 1.04 };
  },
  previewFx: { saturation: 1.2 },
  filters: [
    { id: 'pop', name: '高饱和', desc: '颜色拉满，像综艺', fx: { saturation: 1.65, contrast: 1.12, curve: 0.18, exposure: 0.05 } },
    { id: 'none', name: '原图', desc: '什么都不加', fx: {} },
    { id: 'baojiang', name: '电子包浆', desc: '被转发了一千次', fx: { jpeg: 0.8, tint: 0.45, temp: 0.2, fade: 0.4, saturation: 0.8, contrast: 1.05, sharpen: 0.35, grain: 0.12 } },
    { id: 'pixel', name: '像素风', desc: '8-bit 马赛克', fx: { pixel: 90, posterize: 6, saturation: 1.35, contrast: 1.08 } },
    { id: 'haha', name: '哈哈镜', desc: '脸变大，越看越离谱', fx: { fisheye: 0.6, saturation: 1.25, contrast: 1.05 } },
    { id: 'mono', name: '黑白表情包', desc: '高反差，经典斗图', fx: { tone: 'mono', contrast: 1.5, curve: 0.35, brightness: 0.04, sharpen: 0.4 } },
  ],
  layouts,
  frames,
  stickers,
  placeholderTint: ['#ffe27a', '#ffc2dd'],
  textStyles: [
    { name: '表情包白字黑边', font: '"Noto Sans SC", sans-serif', weight: 900, color: '#ffffff', stroke: '#141414', strokeWidth: 0.24, outline: 0, chip: '#3a3a3a' },
    { name: '黄底黑字', font: '"Noto Sans SC", sans-serif', weight: 900, color: '#141414', outline: 0.09, outlineColor: '#ffd400', chip: '#ffd400' },
    { name: '红色描边', font: '"Noto Sans SC", sans-serif', weight: 900, color: '#ffffff', stroke: '#e8112d', strokeWidth: 0.22, outline: 0.03, chip: '#e8112d' },
    { name: '像素', font: '"Press Start 2P", "ZCOOL QingKe HuangYou", monospace', color: '#39ff6a', stroke: '#141414', strokeWidth: 0.18, outline: 0.03, chip: '#141414' },
  ],
  phrases: ['笑死我了', '绝绝子', '救命', '啊对对对', '好家伙', '我真的会谢', '哈哈哈哈哈', '无语子'],
  pens: [
    { pen: 'solid', name: '马克笔', width: 12 },
    { pen: 'double', name: '描边笔', width: 14 },
    { pen: 'spray', name: '喷漆', width: 24 },
    { pen: 'dots', name: '波点笔', width: 14 },
  ],
  penColors: ['#141414', '#ffffff', '#ff2d2d', '#ffd400', '#2f6bff', '#19c26b'],
  print: { kind: 'dyesub', sheet: 'single', copies: 1, paperName: '6 寸相纸', backColor: '#fffbe6' },
};

// The engine preloads the 400/700 cuts of `fonts.load`; captions and frame
// titles use Noto Sans SC 900, so fetch those glyphs early as well (stickers
// and typed text load their own via fontSpec / captions.font).
if (typeof document !== 'undefined' && document.fonts?.load) {
  document.fonts.load(CAPTION_FONT, FRAME_TEXT + PRESETS.join('')).catch(() => {});
}

export default theme;
