// Machine ③: FISHEYE CAM — an eye-level fisheye "doorbell view" booth.
// Offline reference (docs/research.md §③): Korean rental booths offer an
// eye-level fisheye they call "doorbell view" (초인종 뷰) — wide, good for
// groups — plus high-angle combos. Chinese fisheye-booth details are not
// verified, so the peephole / security-cam styling here is our own design.

import { props, stickers, layouts, frames, FRAME_TEXT } from './art.js';

// barrel strength per lens choice (glfx `fisheye`, 0..1)
const LENS = { mild: 0.35, door: 0.6, mega: 0.9 };

export default {
  id: 'fisheye',
  name: 'FISHEYE CAM',
  plate: 'DOORBELL VIEW · 180°',
  title: '鱼眼大头机',
  kicker: 'DOORBELL VIEW · 门铃视角',
  tagline: '门铃摄像头里的你：离镜头越近，脑袋越大',
  features: ['鱼眼 3 档可选', '圆形猫眼 / 全画幅', '6 连拍 · 1 次重拍', '四连猫眼 / 超大猫眼 / 监控三连'],
  inspiration: '韩国租赁照相机的"门铃视角"（초인종 뷰）平视鱼眼',
  price: 2,
  badge: 'NEW',
  screenText: '◉ REC',
  lang: 'zh-CN',
  voice: { pitch: 1.12, rate: 1.06 },
  colors: {
    body: '#151515',
    trim: '#c6ff3d',
    accent: '#c6ff3d',
    curtain: '#ff6a2b',
    screen: '#070b07',
    screenText: '#e4ffd0',
    glow: '#c6ff3d',
    btn: '#c6ff3d',
    btnText: '#101010',
    card: 'rgba(198,255,61,0.06)',
    cardBorder: 'rgba(198,255,61,0.26)',
  },
  fonts: {
    display: '"Bangers", "ZCOOL KuaiLe", sans-serif',
    ui: '"ZCOOL KuaiLe", "Noto Sans SC", sans-serif',
    load: ['Bangers', 'Permanent Marker', 'VT323', 'Rubik Mono One', 'Bungee', 'ZCOOL KuaiLe', 'Noto Sans SC'],
    text: FRAME_TEXT,
  },
  bgm: { style: 'hiphop', key: 50, prog: [0, 5, 0, 7], minor: true },
  lines: {
    attract: '叮咚！门铃摄像头上线啦——凑近一点，给你拍个超级大头！',
    insert: '请投入两枚代币，门就开啦。',
    paid: '滴——身份确认，欢迎光临！',
    choose: '先挑版式和相框：四个猫眼、一个超大猫眼，还是监控三连？',
    camera: '正在接通门铃摄像头，请站到门口～',
    props: '道具架上有渔夫帽、大金链子和泡泡糖，戴上更像街头大佬！',
    ready: '要开始啦！离镜头越近，脑袋越大哦！',
    cheese: ['叮咚！', '茄子——！', '看猫眼！', 'Cheese!'],
    done: '六张拍完！门外的人都笑出声了。',
    check: '检查一下照片，不满意可以重拍一张。',
    pick: '挑出最搞笑的几张！不满意还能重拍一次。',
    retake: '好，再按一次门铃！',
    filter: '选个画面风格：夜视仪、监控画面，还是鲜艳街头？',
    decorate: '拿起喷漆罐，在照片上随便涂！',
    hurry: '快快快，时间不多啦！',
    timeup: '时间到！放下喷漆罐！',
    review: '确认没问题，就按下打印键。',
    print: '正在打印，门铃录像归档中……',
    bye: '照片出来啦！下次开门前，记得先看猫眼～',
  },
  shoot: {
    shots: 6,
    firstCountdown: 6,
    countdown: 5,
    retakes: 1,
    poses: [
      { text: '凑近镜头！', icon: '🔍', sub: 'CLOSER!', line: '凑近镜头，再近一点！' },
      { text: '大家挤在一起', icon: '👯', sub: 'SQUEEZE IN', line: '大家挤在一起，门铃视角装得下！' },
      { text: '张大嘴巴！', icon: '😮', sub: 'OPEN WIDE', line: '张大嘴巴，啊——' },
      { text: '鼻子贴镜头', icon: '🐽', sub: 'NOSE CAM', line: '鼻子贴近镜头，变成猪鼻子！' },
      { text: '从下往上看', icon: '👀', sub: 'LOOK UP', line: '蹲低一点，从下往上看镜头！' },
      { text: '比耶挡脸', icon: '✌️', sub: 'PEACE!', line: '最后一张，比耶挡住半张脸！' },
    ],
    skipLabel: '🔔 按门铃（立即拍）',
  },
  selectTime: 50,
  prepTime: 90,
  pickTime: 70,
  filterTime: 45,
  decorateTime: 150,
  options: [
    {
      id: 'lens',
      title: '选择镜头',
      sub: 'LENS',
      lead: '鱼眼会把画面中间撑大、四周压扁——想要大头，就把脸凑到画面正中间！',
      line: '选一个鱼眼强度吧！',
      choices: [
        { id: 'mild', name: '轻微鱼眼', desc: '广角微微弯，适合一群人合照', icon: '🙂' },
        { id: 'door', name: '门铃视角', desc: '最像门铃摄像头，脸会鼓起来', icon: '🔔' },
        { id: 'mega', name: '超级大头', desc: '贴近镜头拍，脑袋大到出框！', icon: '🤯' },
      ],
      default: 'door',
      time: 30,
    },
    {
      id: 'view',
      title: '选择画面',
      sub: 'VIEW',
      lead: '猫眼是圆的，门口的监控是方的。选监控三连的话，圆形猫眼会出现在监控屏中间。',
      line: '要圆圆的猫眼，还是整张铺满？',
      choices: [
        { id: 'peep', name: '圆形猫眼', desc: '透过门上的猫眼往外看，四周一圈黑', icon: '◉' },
        { id: 'full', name: '全画幅', desc: '铺满整格，四角压暗，像门铃摄像头', icon: '▣' },
      ],
      default: 'peep',
      time: 25,
    },
  ],
  sampleProps: ['fe-buckethat', 'fe-shades'],
  maxProps: 3,
  props,
  liveFx(session) {
    const o = session.options || {};
    const k = LENS[o.lens] ?? LENS.door;
    const circle = o.view !== 'full';
    return {
      fisheye: k,
      circle,
      // round view: a little zoom keeps the smeared edge thin (the frame ring covers it)
      zoom: circle ? 1.1 : 1,
      vignette: circle ? 0.35 : 0.5 + k * 0.2,
      chroma: 0.25 + k * 0.7,
      sharpen: 0.15,
    };
  },
  previewFx: { saturation: 1.15, contrast: 1.06 },
  filters: [
    { id: 'vivid', name: '鲜艳街头', desc: '饱和度拉满', fx: { saturation: 1.4, contrast: 1.14, curve: 0.18, exposure: 0.05, sharpen: 0.25 } },
    { id: 'night', name: '夜视仪', desc: '绿油油的红外夜视', fx: { tone: 'duo', duoA: [0.01, 0.05, 0.02], duoB: [0.74, 1, 0.46], exposure: 0.3, contrast: 1.35, curve: 0.2, grain: 0.55, posterize: 9, sharpen: 0.3 } },
    { id: 'cctv', name: '监控画面', desc: '偏冷、噪点、压缩感', fx: { saturation: 0.35, temp: -0.5, tint: 0.12, contrast: 1.12, fade: 0.18, grain: 0.42, jpeg: 0.4, sharpen: 0.2 } },
    { id: 'mono', name: '高反差黑白', desc: '街拍杂志感', fx: { tone: 'mono', contrast: 1.55, curve: 0.35, exposure: 0.05, grain: 0.28, sharpen: 0.3 } },
    { id: 'xpro', name: '交叉冲印', desc: '偏黄绿、高反差', fx: { temp: 0.35, tint: 0.4, contrast: 1.32, curve: 0.3, saturation: 1.3, fade: 0.06, exposure: 0.06 } },
  ],
  layouts,
  frames,
  stickers,
  placeholderTint: ['#3a3f38', '#2e332c'],
  textStyles: [
    { name: '漫画', font: '"Bangers", "ZCOOL KuaiLe", sans-serif', color: '#c6ff3d', stroke: '#111', strokeWidth: 0.18, outline: 0.03, chip: '#111' },
    { name: '喷漆', font: '"Permanent Marker", "ZCOOL KuaiLe", cursive', color: '#ff6a2b', stroke: '#fff', strokeWidth: 0.12, outline: 0.02, chip: '#222' },
    { name: '监控', font: '"VT323", "Noto Sans SC", monospace', color: '#e8ffe0', stroke: '#000', strokeWidth: 0.14, outline: 0, chip: '#0b120b' },
  ],
  phrases: ['DING DONG!', '叮咚～', '谁在门口？', 'BIG HEAD!', '脸好大！', '凑近点！', '别看猫眼啦', 'WHO\'S THERE?'],
  pens: [
    { pen: 'spray', name: '喷漆', width: 16 },
    { pen: 'neon', name: '荧光笔', width: 10 },
    { pen: 'solid', name: '马克笔', width: 9 },
    { pen: 'stars', name: '星星', width: 14 },
  ],
  penColors: ['#c6ff3d', '#ff6a2b', '#3de0ff', '#ffffff', '#111111', '#ff4fa3'],
  print: { kind: 'dyesub', sheet: 'single', copies: 1, paperName: '4×6 相纸', backColor: '#f2f7e6' },
};
