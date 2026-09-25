// Machine ④: PURI☆PARA — a Heisei-revival Japanese purikura (Y2K gyaru).
// Offline reference (docs/research.md §二 / 设计启示④): the おまかせ mode
// shoots a fixed 6 shots, then a 3–5 min 落書き booth with neon pens and
// stamps, and out comes one big multi-photo sticker sheet. "盛れ" retouch =
// whitening + bigger eyes; FuRyu's 2025 survey puts Heisei-style doodles,
// MBTI and gyaru-style on top, with ズッ友 / ニコイチ / 心友 written in
// pink, purple and black neon pen.

import { eyesFx } from '../../engine/stage.js';
import { props, stickers, layouts, frames, backgrounds, FONT } from './art.js';

// Lines in Japanese (the machine's voice) carry a Chinese subtitle; Chinese
// lines say so explicitly because the machine language is ja-JP.
const ja = (text, sub) => ({ text, lang: 'ja-JP', sub });
const zh = (text) => ({ text, lang: 'zh-CN' });

export default {
  id: 'y2k',
  name: 'PURI☆PARA',
  plate: 'PURI☆PARA · 6 SHOTS',
  title: 'Y2K 辣妹大头贴',
  kicker: 'HEISEI GAL · PURIKURA',
  tagline: '6 连拍 + 3 分钟落書き，印出一大张闪亮贴纸',
  features: ['6 连拍自动模式', '美白大眼「盛れ」', '荧光笔 + 满版印章', '一大张贴纸'],
  inspiration: '日本プリクラ（平成辣妹 / Y2K 复刻机）',
  price: 3,
  badge: 'Y2K',
  screenText: '6 SHOTS ♡',
  lang: 'ja-JP',
  voice: { pitch: 1.55, rate: 1.08 },
  colors: {
    body: '#ffa8d8',
    trim: '#ffffff',
    accent: '#ec3f9a',
    curtain: '#ff9fd0',
    screen: '#fff6fb',
    screenText: '#4b1d4f',
    glow: '#ff8fd0',
    btn: '#ff4fa3',
    btnText: '#ffffff',
    card: 'rgba(255,255,255,0.78)',
    cardBorder: 'rgba(196,110,180,0.34)',
  },
  fonts: {
    display: '"Mochiy Pop One", "ZCOOL KuaiLe", sans-serif',
    ui: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif',
    // frames draw synchronously, so their fonts are preloaded; stickers and
    // text stamps fetch their own glyphs through `fontSpec`
    load: ['Mochiy Pop One', 'VT323'],
    text: 'PURIPARA ミニシール No.0123456789 HEISEI GAL REIWA NATURAL MODE',
  },
  bgm: { style: 'eurobeat', key: 61, prog: [0, 8, 10, 5] },
  lines: {
    attract: [ja('プリ撮ろ～！', '一起拍大头贴吧～！'), zh('平成辣妹大头贴！六连拍，还能涂鸦三分钟！')],
    insert: zh('请投入三枚代币～'),
    paid: ja('ありがと～！', '谢谢惠顾～！'),
    choose: zh('先选贴纸版式和相框吧～'),
    camera: zh('摄像头打开中，请看着镜头～'),
    props: ja('猫耳とかティアラ、つけてみて！', '猫耳、皇冠……戴上试试吧！'),
    ready: ja('6枚連続で撮るよ！ポーズの準備してね！', '要连拍 6 张哦！准备好姿势～'),
    cheese: [ja('はい、チーズ！', '茄子～！'), ja('かわいい～！', '好可爱～！'), ja('いくよ～！', '要拍啦～！')],
    done: ja('おつかれさま～！', '辛苦啦～ 6 张都拍好了！'),
    check: zh('看看照片吧，不满意的可以重拍一张～'),
    pick: zh('挑出最上镜的照片，不满意可以重拍一张～'),
    retake: ja('もう一回いくよ！', '再来一张！'),
    filter: zh('选一个滤镜吧，美白粉还是闪亮亮？'),
    decorate: ja('落書きタイム！3分間だよ！', '涂鸦时间！一共 3 分钟！'),
    // said at 30 s and 10 s left, so no fixed number here
    hurry: ja('いそいで～！もうすぐ時間だよ！', '快快快～时间快到啦！'),
    timeup: ja('タイムアップ！', '时间到！'),
    review: zh('确认一下，没问题就开始打印贴纸啦！'),
    print: ja('シールを印刷中だよ。ちょっと待ってね！', '贴纸打印中，稍等一下哦～'),
    bye: ja('できあがり！またね～！', '出片啦！下次再来玩～'),
  },
  shoot: {
    shots: 6,
    firstCountdown: 5,
    countdown: 4,
    retakes: 1,
    skipLabel: '⚡ 立即拍',
    poses: [
      { text: '辣妹剪刀手', icon: '💅', sub: 'ギャルピース', line: ja('ギャルピース！', '辣妹剪刀手！手背朝外往下比～') },
      { text: '比个耶', icon: '✌️', sub: 'ピース', line: ja('ピース！', '比个耶！') },
      { text: '小老虎嗷呜', icon: '🐯', sub: 'がおー', line: ja('がおー！', '嗷呜～ 双手当爪子！') },
      { text: '敬礼剪刀手', icon: '🙋', sub: 'ラジャ', line: ja('ラジャ！', '收到！剪刀手放在额头边敬个礼～') },
      { text: '捧脸显脸小', icon: '🤲', sub: '小顔ポーズ', line: ja('小顔ポーズ！', '双手捧脸，显得脸小～') },
      { text: '双手比心', icon: '💕', sub: 'ハート', line: ja('両手でハート！', '最后一张，双手比个心！') },
    ],
  },
  selectTime: 60,
  prepTime: 90,
  pickTime: 60,
  filterTime: 40,
  decorateTime: 180,
  decoSub: '落書き',
  options: [
    {
      id: 'mori',
      title: '选择「盛れ」程度',
      sub: 'MORI LEVEL',
      lead: '日本机都有「盛れ」修图：美白、磨皮、放大眼睛。选一种画风吧～',
      choices: [
        { id: 'heisei', name: '平成浓妆', desc: '超白皙 + 大眼 + 柔光，满满 2000 年代辣妹感', icon: '💄' },
        { id: 'reiwa', name: '令和自然', desc: '轻微美白 + 自然大眼，像素颜但气色超好', icon: '🌸' },
      ],
      default: 'reiwa',
      time: 30,
      line: ja('盛れ度をえらんでね！', '选一下美颜程度吧！'),
    },
  ],
  sampleProps: ['y2k-ribbon', 'y2k-blush'],
  maxProps: 4,
  props,
  backgrounds,
  liveFx(session, faces, w, h) {
    // mild "盛れ": whitening + soft skin + bigger eyes, never a full face warp
    if (session.options?.mori === 'heisei') {
      return { smooth: 0.6, whiten: 0.5, glow: 0.24, exposure: 0.08, eyes: eyesFx(faces, w, h, 0.32) };
    }
    return { smooth: 0.32, whiten: 0.25, glow: 0.12, exposure: 0.05, eyes: eyesFx(faces, w, h, 0.18) };
  },
  filters: [
    { id: 'natural', name: '自然 ナチュラル', desc: '只有盛れ修图', fx: { saturation: 1.05, contrast: 1.02 } },
    { id: 'pink', name: '美白粉 ピンク', desc: '白里透粉的平成少女肤色', fx: { brightness: 0.03, tint: -0.22, temp: 0.08, saturation: 0.96, fade: 0.06 } },
    { id: 'kira', name: '闪亮 キラキラ', desc: '柔光 + 高光，亮晶晶', fx: { glow: 0.42, contrast: 1.1, saturation: 1.18, curve: 0.12 } },
    { id: 'neon', name: '霓虹 ネオン', desc: '粉紫霓虹，夜店辣妹感', fx: { saturation: 1.35, tint: -0.4, temp: -0.06, contrast: 1.12, brightness: 0.02, vignette: 0.16 } },
    { id: 'mono', name: '黑白 モノクロ', desc: '奶油感黑白', fx: { tone: 'mono', contrast: 1.06, brightness: 0.04, fade: 0.05 } },
  ],
  layouts,
  frames,
  stickers,
  textStyles: [
    { name: '霓虹粉', font: FONT.pop, color: '#ff3d9a', stroke: '#ffffff', strokeWidth: 0.22, outline: 0.03, outlineColor: '#ffb3dc', chip: '#2a1026' },
    { name: '霓虹紫', font: FONT.pop, color: '#a259ff', stroke: '#f3e8ff', strokeWidth: 0.22, outline: 0.03, outlineColor: '#d9c2ff', chip: '#1c1030' },
    { name: '辣妹黑', font: FONT.bold, color: '#1a1320', stroke: '#ff8cc6', strokeWidth: 0.22, outline: 0.035, chip: '#ffe0f0' },
    { name: '彩虹', font: FONT.pop, color: '#ff5fa8', gradient: ['#ff5fa8', '#ffb04d', '#ffe95c', '#6fe3a0', '#62c8ff', '#b58aff'], stroke: '#ffffff', strokeWidth: 0.22, outline: 0.03, outlineColor: '#e6d6ff', chip: '#ffffff' },
  ],
  phrases: ['ズッ友だょ', 'ニコイチ', '心友', '一生仲良し', '盛れた～', '最強ギャル', 'ずっといっしょ', 'BFF forever'],
  pens: [
    { pen: 'neon', name: '荧光笔', width: 12 },
    { pen: 'glitter', name: '闪粉笔', width: 16 },
    { pen: 'double', name: '描边笔', width: 12 },
    { pen: 'hearts', name: '爱心印章', width: 14 },
    { pen: 'stars', name: '星星印章', width: 14 },
    { pen: 'rainbow', name: '彩虹笔', width: 10 },
  ],
  // pink / purple / black neon first (FuRyu 2025), then white, baby blue, yellow
  penColors: ['#ff4fa3', '#a259ff', '#1a1320', '#ffffff', '#8fd8ff', '#fff27a'],
  placeholderTint: ['#ffd1ea', '#e3d4ff'],
  print: { kind: 'dyesub', sheet: 'single', copies: 1, paperName: '大头贴贴纸', backColor: '#fff0f8' },
};
