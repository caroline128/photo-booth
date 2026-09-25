# 主题（机器）开发说明 · Theme API

店里的每一台大头贴机都是一个主题模块。引擎（拍摄流程、滤镜、贴纸编辑器、打印动画）是共用的，主题只负责**配置 + 美术**。参考实现：`js/themes/classic/`。

```
js/themes/<id>/index.js   主题配置（export default {...}）
js/themes/<id>/art.js     props / stickers / layouts / frames / backgrounds
css/themes/<id>.css       机器外壳的主题化样式（选择器以 .theme-<id> 开头）
```

注册在 `js/themes/index.js`。开发时打开 `dev/gallery.html?theme=<id>` 可以一次看到全部素材：道具会分别戴在「人形假人」和「店猫」上，方便检查位置。

---

## 1. 配置字段

| 字段 | 说明 |
|---|---|
| `id` | 机器 id（URL `#/m/<id>`，CSS `.theme-<id>`） |
| `name` / `title` / `plate` | 招牌英文名 / 中文名 / 镜头下方铭牌 |
| `kicker` / `tagline` / `features[]` | 待机画面文案 |
| `price` | 代币数 |
| `badge` / `screenText` | 大厅机器角标 / 机身小屏幕文字 |
| `lang` / `voice {pitch, rate}` | 机器语音语言（SpeechSynthesis），字幕总是中文 |
| `colors` | CSS 变量：`body trim accent curtain screen screenText glow btn btnText card cardBorder` |
| `fonts` | `{ display, ui, load: [...], text }`：`load` 是要预加载的 Google Fonts 字体名；`text` 写上相框/贴纸里用 canvas 画的**所有中日韩文字**（中文字体按字符分包下载，没预载的字会先用系统字体画出来） |
| `bgm` | `{ style: 'lounge'|'kpop'|'hiphop'|'eurobeat'|'chip'|'bounce', key: midi, prog: [半音偏移...], minor? }` |
| `lines` | 语音台词：`attract insert paid choose camera props ready cheese done check pick retake filter decorate hurry timeup review print bye`；值为字符串、`{text, lang, sub}` 或数组（随机取） |
| `shoot` | `{ shots, firstCountdown, countdown, retakes: 1, poses: [{text, icon, sub, line?}], skipLabel? }` |
| `selectTime prepTime pickTime filterTime decorateTime` | 各步骤限时（秒） |
| `options[]` | 额外选择步骤：`{ id, title, sub, lead, choices: [{id, name, desc, icon}], default, time }`，结果在 `session.options[id]` |
| `backgrounds[]` | 可选，换背景：`{ id, name, swatch (CSS background), paint(ctx, w, h, t) }`（需要人像分割模型） |
| `props[]` / `maxProps` / `sampleProps[]` | 道具，见 §2 |
| `liveFx(session, faces, w, h)` | 镜头特性（鱼眼、闪光、美颜、大眼……），实时预览和成片都会用 |
| `previewFx` | 只在实时预览和缩略图里叠加的调色 |
| `filters[]` | `{ id, name, desc, fx }`，成片 = `liveFx` + `filter.fx` |
| `layouts[]` / `frames[]` | 版式与相框，见 §4 |
| `stickers[]` | 贴纸，见 §3（`group` 字段用来分页签） |
| `textStyles[]` | 文字贴纸样式：`{ name, font, color, stroke, strokeWidth, gradient, outline, outlineColor, chip }` |
| `phrases[]` | 文字页签里的常用语 |
| `pens[]` / `penColors[]` | 画笔：`{ pen, name, width }`，`pen` 取值 `solid neon double glitter hearts stars dots spray chalk rainbow` |
| `captions` | 可选，开启「配字」步骤：`{ title, lead, presets: [...], max, font }`，结果在 `info.captions[i]`；`font` 是相框画配字用的 canvas font 字符串（用来预载用户输入的字） |
| `decoBooth` | 可选，拍完后显示「请移动到涂鸦台」过场：`{ title, text, sub, icon }`（台词键 `move`） |
| `print` | `{ kind: 'dyesub'|'chemical', sheet: 'single'|'strip-pair'|'sticker', copies, paperName, backColor }` |
| （版式可用 `sheet`、`paperName` 字段覆盖，比如只有竖条版式打印成两条） | |
| `placeholderTint` | 选框页占位剪影的两种底色 |

## 2. 道具（AR，跟着脸走）

道具是一张美术图（SVG 或 canvas 绘制），挂在人脸的某个锚点上。单位是**两眼间距 d**，坐标系跟着脸一起旋转（x 指向右眼，y 指向下巴）。

| anchor | 位置（d） | 适合 |
|---|---|---|
| `eyes` | 两眼中点 | 眼镜、墨镜 |
| `forehead` | 上方 0.62 | 发带 |
| `head` | 上方 1.02（发际线） | 帽子帽檐 |
| `crown` | 上方 1.45（头顶） | 发箍、耳朵、皇冠 |
| `above` | 上方 2.15 | 头顶漂浮物（光环、问号） |
| `nose` / `lip` / `mouth` | 检测到的鼻子 / 人中 / 嘴 | 小丑鼻、胡子、烟斗 |
| `chin` / `neck` | 下方 1.62 / 2.25 | 口罩带、领结、项链 |
| `cheeks` / `ears` | 两侧（配 `pair: true`） | 腮红、耳环 |
| `side` | 右下侧 | 手持物（应援棒、玩偶） |

其余字段：`w` 为宽度（单位 d，人头宽约 2.4d），`origin: [ox, oy]` 是美术图上贴在锚点的那一点（0–1），`dx`/`dy` 为额外偏移（单位 d），`rot` 为额外旋转（弧度），`pair`/`flipPair` 表示左右各画一个。

## 3. 贴纸

```js
{ id, name, group, size /* 默认宽度，占版面短边比例 */,
  svg: '<svg viewBox="0 0 W H">…</svg>'            // 或
  draw(ctx, w, h) {…}, ratio /* h/w */,
  outline: 0.05, outlineColor: '#fff', shadow, holo }  // 白色裁切边 / 镭射
```

需要网页字体的文字贴纸用 `textSticker({...})`（`js/art/kit.js`，会自动预载字形）或 canvas `draw`，因为 SVG 放进 `<img>` 后读不到网页字体。自己写 `draw` 画文字时，加上 `fontSpec: { font: '400 100px "Jua"', text: '要画的字' }`，渲染前会先下载这些字形。常用图形：`heartD starD sparkleD burstD circleD`。

## 4. 版式与相框

版式用 `stripLayout()` / `gridLayout()`（`js/engine/compose.js`）生成，也可以手写：

```js
{ id, name, desc, size: [W, H] /* 300dpi 像素 */, photos /* 需要几张不同的照片 */,
  slots: [{ x, y, w, h, shape: 'rect'|'round'|'circle'|'heart', r, src /* 用第几张照片 */, rot }],
  footer: { y, h } }
```

相框：

```js
{ id, name, layouts?: ['strip'] /* 适用版式 */,
  paint: {
    under(ctx, L, info) {},    // 照片下面：纸张、背景
    slot(ctx, slot, i, info) {},  // 每张照片之后（当前路径 = 照片形状，可 stroke）
    over(ctx, L, info) {},     // 照片上面：logo、日期、装饰
  } }
```

`L` = 版式 + `W`、`H`；`info = { theme, date, serial, options, captions, photoIndex }`。

## 5. 滤镜参数（`js/engine/glfx.js`）

`fisheye 0..1`、`circle bool`、`zoom`、`eyes [{x,y,r,s}]`（用 `eyesFx()` 生成）、`exposure brightness contrast saturation temp tint fade curve`、`tone 'none'|'mono'|'sepia'|'cyan'|'duo'` + `duoA duoB`、`smooth`（磨皮）、`whiten`（美白）、`glow`（柔焦）、`vignette grain chroma pixel`（像素块数）、`posterize flash jpeg`（电子包浆）、`sharpen leak`（漏光）。

## 6. 素材原则

- 全部原创，用代码绘制；不使用真实艺人肖像、品牌 logo 或商标。
- 线下玩法的出处写在 `docs/research.md`。
