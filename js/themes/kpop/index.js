// Machine ②: STAR 4CUT — a Korean self-photo studio (셀프사진관 / 人生四格).
// Offline reference (docs/research.md §一, 设计启示②): choose a frame, 8 timed
// shots ~10 s apart (remote shutter to go early), pick 4, two strips come
// out; idol collab frames, 55×85 mm photocards, a basket of free headbands.

import { eyesFx } from '../../engine/stage.js';
import { props, stickers, layouts, frames, backgrounds, canvasText } from './art.js';

// the machine talks Korean (with Chinese subtitles) and switches to Chinese
// for instructions, so every line carries its own language
const ko = (text, sub) => ({ text, lang: 'ko-KR', sub });
const zh = (text) => ({ text, lang: 'zh-CN' });

export default {
  id: 'kpop',
  name: 'STAR 4CUT',
  plate: 'STAR 4CUT · SELF PHOTO',
  title: 'K-POP 人生四格',
  kicker: 'SELF PHOTO STUDIO · 8 SHOTS',
  tagline: '拍 8 张挑 4 张，一式两条，还能做成偶像小卡',
  features: ['8 连拍 · 每张 10 秒', '挑 4 张 · 一式两条', '和偶像合照限定框', '55×85mm 小卡', '뽀샤시 柔光美颜'],
  inspiration: '韩国自助照相馆（셀프사진관 · 人生四格）',
  price: 3,
  badge: 'HOT',
  screenText: '4 CUTS ♥',
  lang: 'ko-KR',
  voice: { pitch: 1.25, rate: 1.05 },
  colors: {
    body: '#fbfbfd',
    trim: '#e3dfe8',
    accent: '#ff4fa3',
    curtain: '#f3c1d9',
    screen: '#fbf7fb',
    screenText: '#2a2230',
    glow: '#ff7cc0',
    btn: '#ff4fa3',
    btnText: '#ffffff',
    card: 'rgba(255,79,163,0.05)',
    cardBorder: 'rgba(42,34,48,0.14)',
  },
  fonts: {
    display: '"Black Han Sans", "Dela Gothic One", sans-serif',
    ui: '"Jua", "ZCOOL KuaiLe", "Noto Sans SC", sans-serif',
    load: ['Black Han Sans', 'Jua', 'Rubik Mono One', 'Pacifico', 'Caveat', 'Dela Gothic One'],
    text: canvasText,
  },
  bgm: { style: 'kpop', key: 62, prog: [5, 7, 4, 9] },
  lines: {
    attract: [ko('어서 오세요!', '欢迎光临！'), zh('八张里挑四张，一次出两条，来拍人生四格吧！')],
    insert: zh('请投入三枚代币。'),
    paid: ko('감사합니다!', '谢谢惠顾！'),
    choose: zh('先选版式和相框。和偶像合照的限定框只有这台机器有哦！'),
    camera: zh('正在打开摄像头，看着上面的环形补光灯～'),
    props: zh('篮子里有发箍、墨镜、玩偶和应援棒，免费随便戴！'),
    ready: ko('준비됐나요? 시작할게요!', '准备好了吗？要开始啦！'),
    cheese: [ko('김치~!', '茄子～！'), ko('치즈!', '茄子！')],
    done: ko('다 찍었어요! 수고했어요~', '八张都拍完啦！辛苦了～'),
    check: zh('看看照片，不满意的可以重拍一张。'),
    pick: zh('从八张里挑出最喜欢的，按点选的顺序排版。'),
    retake: ko('한 번 더!', '再来一张！'),
    filter: zh('选一个滤镜吧，柔光最受欢迎哦！'),
    decorate: zh('贴纸、手写字、闪粉笔都在这里，像装饰小卡卡套一样尽情装饰吧！'),
    hurry: [ko('빨리빨리!', '快点快点！'), zh('时间快到了！')],
    timeup: zh('时间到！'),
    review: zh('确认没问题就打印吧，一式两份哦！'),
    print: ko('잠시만 기다려 주세요~', '正在打印，请稍等～'),
    bye: [ko('또 만나요!', '下次见！'), ko('오늘도 행복하세요!', '今天也要幸福哦！')],
  },
  shoot: {
    shots: 8,
    firstCountdown: 10,
    countdown: 10,
    retakes: 1,
    skipLabel: '📱 遥控快门（立即拍）',
    poses: [
      { icon: '🫰', text: '比个心！', sub: '손가락 하트', line: ko('손가락 하트!', '比个心！') },
      { icon: '💕', text: '双手比心', sub: '더블 하트', line: zh('两只手都比个心～') },
      { icon: '🙆', text: '举过头顶的大爱心', sub: '머리 위 하트', line: zh('手臂举过头顶，一起比个大爱心！') },
      { icon: '🥰', text: '捧脸比心', sub: '볼하트', line: ko('볼하트!', '捧脸比心！') },
      { icon: '🌸', text: '花朵托腮', sub: '꽃받침', line: zh('双手托住下巴，变成一朵花～') },
      { icon: '✌️', text: '辣妹剪刀手', sub: '갸루피스', line: ko('갸루피스!', '辣妹剪刀手！') },
      { icon: '😜', text: '故意拍张丑照', sub: '엽사 타임', line: zh('这张故意搞怪，越丑越好！') },
      { icon: '📸', text: '最后一张，看镜头！', sub: '하나, 둘, 셋!', line: ko('하나, 둘, 셋!', '一、二、三！') },
    ],
  },
  selectTime: 60,
  prepTime: 90,
  pickTime: 75,
  filterTime: 45,
  decorateTime: 150,
  backgrounds,
  sampleProps: ['bunny', 'blush'],
  maxProps: 3,
  props,
  // light retouch, like the studios' "보정": smoother, brighter skin, a touch of eye
  liveFx(session, faces, w, h) {
    return { smooth: 0.35, whiten: 0.2, eyes: eyesFx(faces, w, h, 0.05) };
  },
  previewFx: { exposure: 0.06, glow: 0.1 },
  filters: [
    { id: 'clean', name: '原图', desc: '干净自然 · 轻微磨皮', fx: { smooth: 0.22, whiten: 0.08, contrast: 1.04, saturation: 1.04 } },
    { id: 'bright', name: '뽀샤시 柔光', desc: '柔焦 + 美白 + 提亮', fx: { glow: 0.36, whiten: 0.38, exposure: 0.12, smooth: 0.5, contrast: 0.96, saturation: 0.97 } },
    { id: 'pink', name: '핑크 粉嫩', desc: '粉粉的少女感', fx: { temp: 0.15, tint: -0.75, smooth: 0.45, whiten: 0.3, exposure: 0.08, glow: 0.18, saturation: 1.1 } },
    { id: 'mono', name: '흑백 黑白', desc: '柔和的黑白画报', fx: { tone: 'mono', contrast: 1.06, exposure: 0.06, smooth: 0.4, glow: 0.18, fade: 0.06 } },
    { id: 'cool', name: '쿨톤 冷调', desc: '清透的蓝调', fx: { temp: -0.65, tint: 0.08, saturation: 0.9, exposure: 0.1, contrast: 1.05, smooth: 0.35 } },
  ],
  layouts,
  frames,
  stickers,
  textStyles: [
    { name: '软糖粉', font: '"Jua", "ZCOOL KuaiLe", sans-serif', color: '#ff5fa8', stroke: '#fff', strokeWidth: 0.2, outline: 0.03, outlineColor: '#ffc2dc', chip: '#fff0f7' },
    { name: '综艺粗体', font: '"Black Han Sans", "ZCOOL KuaiLe", sans-serif', color: '#1d1a22', stroke: '#fff', strokeWidth: 0.18, outline: 0.03, outlineColor: '#ff4fa3', chip: '#ffffff' },
    { name: '梦幻渐变', font: '"Black Han Sans", "ZCOOL KuaiLe", sans-serif', gradient: ['#ff7ac0', '#a78bff', '#6cc6ff'], stroke: '#fff', strokeWidth: 0.16, outline: 0.03, chip: '#f3edff' },
    { name: '手写白字', font: '"Caveat", "ZCOOL KuaiLe", cursive', weight: 700, color: '#ffffff', outline: 0.045, outlineColor: '#ff4fa3', chip: '#ffb3d4' },
  ],
  phrases: ['사랑해 ♥', '최애', '오늘도 행복', '우리 우정 영원히', 'MY BIAS', '人生四格', '追星成功', 'BFF 4ever'],
  pens: [
    { pen: 'neon', name: '霓虹笔', width: 10 },
    { pen: 'double', name: '描边笔', width: 12 },
    { pen: 'glitter', name: '闪粉笔', width: 14 },
    { pen: 'hearts', name: '爱心印章', width: 16 },
    { pen: 'stars', name: '星星印章', width: 16 },
  ],
  penColors: ['#ff4fa3', '#ffb3d4', '#c9b6ff', '#9fd8ff', '#fff0a0', '#b8f0d0', '#1d1a22', '#ffffff'],
  print: { kind: 'dyesub', sheet: 'single', copies: 2, paperName: '4×6 相纸', backColor: '#fff5fa' },
  placeholderTint: ['#f6dde9', '#e9e0f7'],
};
