// Everything Claude says in the booth, plus text printed on frames.

import { pick } from '../core/util.js';

export function greeting(d = new Date()) {
  const hr = d.getHours();
  if (hr < 5) return '夜深了';
  if (hr < 11) return '早上好';
  if (hr < 13) return '中午好';
  if (hr < 18) return '下午好';
  return '晚上好';
}

export const TITLE_IDEAS = [
  '周五下班后的我们',
  '今天也要好好拍照',
  '和最好的朋友',
  '一个普通但很好的下午',
  '毕业快乐！',
  '我们认识的第 100 天',
  '周末去哪儿都行',
  '请把这一刻存档',
  '换了新发型',
  '生日快乐，大朋友',
];

export const POSES = [
  { id: 'wave', text: '挥挥手，打个招呼' },
  { id: 'peace', text: '比个耶 ✌' },
  { id: 'heart', text: '比个心' },
  { id: 'think', text: '假装在认真思考' },
  { id: 'wink', text: '眨一只眼' },
  { id: 'surprise', text: '惊讶脸！' },
  { id: 'laugh', text: '哈哈大笑' },
  { id: 'cool', text: '酷一点，不许笑' },
  { id: 'shy', text: '双手捧脸' },
  { id: 'cheer', text: '双手举高——耶！' },
  { id: 'spark', text: '张开五指，做一个星芒 ✻' },
];

// Streamed during the countdown when extended thinking is on.
export const THOUGHTS = [
  '光线是暖的，很好。',
  '人稍微偏左了一点，往中间挪一挪会更好。',
  '这个角度的下巴线条很好看。',
  '表情可以再放松一点——想想周末。',
  '背景有点乱？没关系，相框会盖住一部分。',
  '倒数结束前尽量别眨眼。',
  '这一张很适合比个耶。',
  '如果我有手，我也想比个心。',
  '对焦完成。',
  '我在想要不要提醒你笑……还是提醒一下吧：笑！',
  '肩膀放松，下巴微微收一点。',
  '上一张有点严肃，这张来点反差。',
  '镜头在上面，眼睛看这里。',
  '嗯，这个姿势我给满分。',
  '我数到一的时候，你笑得最好看。',
];

export const SPIN_VERBS = ['思考中', '构图中', '对焦中', '酝酿笑容', '调色中', '显影中', '排版中', '撒星芒', '琢磨中', 'Clauding', 'Pondering', 'Noodling'];

export const HAIKU = [
  ['快门轻轻响', '此刻被好好收藏', '笑容不会旧'],
  ['灯光暖一点', '你偷偷眨了眨眼', '我全都记得'],
  ['三二一之后', '世界安静了一秒', '只剩下你笑'],
  ['星芒落肩头', '今天也值得纪念', '咔嚓，存好了'],
  ['小小的相框', '装下一整个下午', '还有一点风'],
  ['先别动，看我', '光在你的睫毛上', '好，就是现在'],
  ['纸上的我们', '比镜子里更好看', '大概是光吧'],
  ['想了很久的', '姿势最后没用上', '笑得刚刚好'],
];

// Claude's replies next to each photo in the chat frame.
export const REPLIES = [
  '你笑起来真好看。',
  '这张构图满分。',
  '你说得完全正确！',
  '这个角度很上镜。',
  '让我想想……不用想了，好看。',
  '建议多存几份。',
  '这张可以当头像。',
  '光线刚刚好。',
  '值得打印出来。',
  '这一张有故事感。',
  '好问题——答案是：好看。',
  '我没有眼睛，但我确定这张很好看。',
];

export const lines = {
  intro: (m, title) =>
    title
      ? `「${title}」，好标题。这次用 **${m.name}** 拍 ${m.keep} 张。先挑个版式和相框吧——右边可以预览。`
      : `好呀！这次用 **${m.name}** 给你拍 ${m.keep} 张。先挑个版式和相框吧——右边可以预览。`,
  camera: '接下来要借用一下摄像头。画面只在你的浏览器里处理，不会上传到任何地方。',
  cameraFail: (why) => `摄像头没能打开（${why}）。没关系，我的朋友**小芒**可以来当模特——它很上镜，也很有耐心。`,
  demo: '小芒已就位！它会跟着姿势提示摆 pose。',
  ready: (m, secs) =>
    `看得到自己吗？取景框里的画面就是照片的样子。准备好就点「开始拍摄」，每张我会倒数 ${secs} 秒，一共 ${m.shots} 张。`,
  shooting: '开始啦，看镜头！',
  shotsDone: (m) =>
    m.shots > m.keep
      ? `拍好啦！从 ${m.shots} 张里挑 ${m.keep} 张放进相框。有一张不满意的话，还有 **1 次重拍**机会。`
      : `拍好啦！如果有哪张不满意，还有 **1 次重拍**机会。`,
  retake: '好，这张重拍。看镜头——',
  filter: '选个滤镜？「墨线插画」和「双色印刷」是我的私心推荐。',
  decorate: (secs) => `涂鸦时间！贴纸、文字、画笔随便用，你有 ${secs % 60 ? `${secs} 秒` : `${secs / 60} 分钟`}。我帮你计时，不催你。（最后十秒会催一下。）`,
  hurry30: '还剩 30 秒。',
  hurry10: '10 秒！',
  timeup: '时间到！我帮你收个尾。',
  print: '好的，正在生成你的大头贴……',
  done: '完成了 ✻ 这是你的大头贴。可以下载、分享，或者再来一组。',
  saved: '它也存进了左边的「最近」里，随时可以回来看。',
};

export const randomTitle = () => pick(TITLE_IDEAS);
