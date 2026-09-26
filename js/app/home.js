// Home: the "new chat" screen. A greeting, a composer whose text becomes the
// title printed on the photos, a model picker and a few quick-start chips.

import { h } from '../core/dom.js';
import { settings, recents } from '../core/store.js';
import { sfx } from '../core/audio.js';
import { pick } from '../core/util.js';
import { icon } from '../art/icons.js';
import { SparkIcon } from '../art/spark.js';
import { MODELS, MODEL_IDS } from '../data/models.js';
import { greeting, randomTitle } from '../data/copy.js';
import { popover } from './ui.js';

// Quick starts: a model + frame (+ filter) preset.
export const PRESETS = [
  { id: 'classic', icon: 'strip', label: '经典四格', model: 'sonnet', layout: 'strip4', frame: 'cream' },
  { id: 'chat', icon: 'chat', label: '聊天截图', model: 'sonnet', layout: 'strip4', frame: 'chat' },
  { id: 'terminal', icon: 'terminal', label: '终端风', model: 'sonnet', layout: 'grid4', frame: 'terminal', filter: 'ascii' },
  { id: 'paper', icon: 'paper', label: '论文插图', model: 'opus', layout: 'grid6', frame: 'paper', filter: 'ink' },
  { id: 'haiku', icon: 'leaf', label: '俳句一首', model: 'haiku', layout: 'strip3', frame: 'haiku' },
  { id: 'random', icon: 'dice', label: 'Claude 帮我选', random: true },
];

// "/opus", "/terminal", "ultrathink"… in the composer map to options.
const SLASH = {
  '/haiku': { model: 'haiku' },
  '/sonnet': { model: 'sonnet' },
  '/opus': { model: 'opus' },
  '/chat': { frame: 'chat' },
  '/terminal': { frame: 'terminal' },
  '/paper': { frame: 'paper' },
  '/card': { frame: 'card' },
  '/doodle': { frame: 'doodle' },
  '/letter': { frame: 'letter' },
  '/ascii': { filter: 'ascii' },
  '/ink': { filter: 'ink' },
  '/riso': { filter: 'riso' },
  ultrathink: { thinking: true, ultra: true },
};

export function parsePrompt(text) {
  const opts = {};
  let title = ` ${text} `;
  for (const [k, v] of Object.entries(SLASH)) {
    const re = new RegExp(`(^|\\s)${k.replace('/', '\\/')}(?=\\s|$)`, 'gi');
    if (re.test(title)) {
      Object.assign(opts, v);
      title = title.replace(re, ' ');
    }
  }
  return { title: title.replace(/\s+/g, ' ').trim().slice(0, 60), opts };
}

export class Home {
  constructor({ onStart }) {
    this.onStart = onStart;
    this.urls = [];
    this.model = MODELS[settings.get('model')] ? settings.get('model') : 'sonnet';
    this.thinking = !!settings.get('thinking');
    this.spark = new SparkIcon({ size: 44, mode: 'breathe' });
    this.el = this.build();
  }

  build() {
    this.input = h('textarea', {
      rows: 2,
      maxlength: 120,
      placeholder: '给这组照片起个标题吧，它会印在照片上…',
      'aria-label': '照片标题',
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        this.start();
      }
    });
    this.input.addEventListener('input', () => {
      this.input.style.height = 'auto';
      this.input.style.height = `${Math.min(160, this.input.scrollHeight)}px`;
    });

    const dice = h('button.pill', { type: 'button', title: '帮我想个标题' }, icon('dice', { size: 16 }), h('span.pill-text', '想个标题'));
    dice.addEventListener('click', () => {
      this.input.value = randomTitle();
      this.input.focus();
      sfx.tick();
    });
    this.thinkBtn = h('button.pill', { type: 'button', 'aria-pressed': String(this.thinking), title: '倒数更长，Claude 会边想边帮你调整姿势' }, icon('bulb', { size: 16 }), h('span.pill-text', '扩展思考'));
    this.thinkBtn.addEventListener('click', () => this.setThinking(!this.thinking));

    this.modelBtn = h('button.model-btn', { type: 'button', 'aria-haspopup': 'menu' });
    this.paintModel();
    this.modelBtn.addEventListener('click', () => this.openModels());

    const send = h('button.send', { type: 'button', 'aria-label': '开始拍摄', title: '开始拍摄 (Enter)' }, icon('up', { size: 20, stroke: 2 }));
    send.addEventListener('click', () => this.start());

    const chips = h(
      'div.chips',
      PRESETS.map((p) => {
        const b = h('button.chip', { type: 'button' }, icon(p.icon, { size: 17 }), p.label);
        b.addEventListener('click', () => this.start(p));
        return b;
      }),
    );

    this.shelf = h('section.home-recents', { hidden: true }, h('h2', '最近拍的'), h('div.shelf'));
    this.loadShelf();

    return h(
      'div.home',
      h(
        'div.home-center',
        h('h1.greet', this.spark.el, h('span', `${greeting()}，今天想拍点什么？`)),
        h(
          'div.composer',
          this.input,
          h('div.composer-bar', dice, this.thinkBtn, h('span.grow'), this.modelBtn, send),
        ),
        chips,
        this.shelf,
      ),
      h('footer.home-foot', 'Claude 也会拍糊，请仔细核对每一个笑容。摄像头画面只在本机浏览器里处理，不会上传。'),
    );
  }

  paintModel() {
    this.modelBtn.replaceChildren(MODELS[this.model].name, icon('down', { size: 16 }));
    this.modelBtn.setAttribute('aria-label', `模型：${MODELS[this.model].name}`);
  }

  setThinking(on) {
    this.thinking = on;
    settings.set('thinking', on);
    this.thinkBtn.setAttribute('aria-pressed', String(on));
    sfx.tick();
  }

  openModels() {
    const think = h(
      'button.menu-item',
      { type: 'button', role: 'menuitemcheckbox', 'aria-checked': String(this.thinking) },
      h('span.mi-text', h('b', '扩展思考'), h('small', '倒数更长，Claude 边想边帮你摆姿势')),
      h('span.switch'),
    );
    const items = MODEL_IDS.map((id) => ({
      label: MODELS[id].name,
      tag: MODELS[id].tag,
      sub: MODELS[id].blurb,
      checked: id === this.model,
      onSelect: () => {
        this.model = id;
        settings.set('model', id);
        this.paintModel();
        sfx.select();
      },
    }));
    const pop = popover(this.modelBtn, [...items, 'sep', think], { align: 'right' });
    think.addEventListener('click', () => {
      this.setThinking(!this.thinking);
      think.setAttribute('aria-checked', String(this.thinking));
      this.thinkBtn.setAttribute('aria-pressed', String(this.thinking));
    });
    return pop;
  }

  start(preset = null) {
    const { title, opts } = parsePrompt(this.input.value);
    let p = preset;
    if (p?.random) p = pick(PRESETS.filter((x) => !x.random));
    const model = opts.model || p?.model || this.model;
    sfx.select();
    this.onStart({
      title,
      model,
      thinking: opts.thinking || this.thinking,
      ultra: !!opts.ultra,
      layout: p?.model === model ? p.layout : null,
      frame: opts.frame || p?.frame || null,
      filter: opts.filter || p?.filter || null,
    });
  }

  async loadShelf() {
    const items = (await recents.list()).slice(0, 8);
    if (!items.length) return;
    const shelf = this.shelf.querySelector('.shelf');
    shelf.replaceChildren(
      ...items.map((it) => {
        const url = URL.createObjectURL(it.thumb || it.blob);
        this.urls.push(url);
        return h('a', { href: `#/p/${it.id}` }, h('img', { src: url, alt: it.title || '大头贴' }), h('span', it.title || '无题'));
      }),
    );
    this.shelf.hidden = false;
  }

  focus() {
    if (matchMedia('(pointer: fine)').matches) this.input.focus({ preventScroll: true });
  }

  destroy() {
    this.spark.destroy();
    this.urls.forEach((u) => URL.revokeObjectURL(u));
  }
}
