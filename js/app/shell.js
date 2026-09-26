// App chrome, modelled on claude.ai: a sidebar ("rail") with New, Recents
// and settings, plus the main area the routes render into.

import { h } from '../core/dom.js';
import { settings, recents, subscribe } from '../core/store.js';
import { sfx, voice } from '../core/audio.js';
import { fmtDate } from '../core/util.js';
import { icon } from '../art/icons.js';
import { SparkIcon } from '../art/spark.js';

export class Shell {
  constructor(root, { onNew }) {
    this.onNew = onNew;
    this.urls = [];
    this.active = null;
    this.list = h('div.recents', { role: 'list' });

    const logo = new SparkIcon({ size: 22, mode: 'still' });
    this.brand = h('a.brand', { href: '#/', 'aria-label': 'Claude 大头贴照相馆 首页' }, logo.el, h('b', 'Claude', h('small', '照相馆')));
    const collapse = h('button.icon-btn.collapse', { type: 'button', title: '收起侧栏', 'aria-label': '收起侧栏' }, icon('sidebar'));
    collapse.addEventListener('click', () => this.setCollapsed(!this.rail.classList.contains('collapsed')));

    const newBtn = h('button.new-btn', { type: 'button' }, h('span.plus', icon('plus', { size: 16, stroke: 2 })), h('span.rail-label-inline', '新的大头贴'));
    newBtn.addEventListener('click', () => {
      this.closeDrawer();
      this.onNew();
    });

    this.rail = h(
      'aside.rail',
      { 'aria-label': '侧栏' },
      h('div.rail-head', this.brand, collapse),
      newBtn,
      h('div.rail-label', '最近'),
      this.list,
      h(
        'div.rail-foot',
        this.toggle('sound', '音效', 'sound', 'mute'),
        voice.available() ? this.toggle('voice', '语音朗读', 'voice', 'voice') : null,
        h('p.rail-note', 'Claude 也会拍糊，请仔细核对每一个笑容。画面只在本机处理，不会上传。'),
      ),
    );

    const menu = h('button.icon-btn', { type: 'button', 'aria-label': '打开侧栏' }, icon('menu'));
    menu.addEventListener('click', () => this.app.classList.add('drawer'));
    const topNew = h('button.icon-btn', { type: 'button', 'aria-label': '新的大头贴' }, icon('plus'));
    topNew.addEventListener('click', () => this.onNew());
    const miniLogo = new SparkIcon({ size: 20, mode: 'still' });
    this.topbar = h('header.topbar', menu, h('a.brand', { href: '#/' }, miniLogo.el, h('b', 'Claude 照相馆')), h('span.grow'), topNew);

    const scrim = h('div.scrim');
    scrim.addEventListener('click', () => this.closeDrawer());
    this.view = h('div.view');
    this.app = h('div.app', this.rail, scrim, h('main.main', this.topbar, this.view));
    root.replaceChildren(this.app);

    this.refresh();
    subscribe('recents', () => this.refresh());
  }

  toggle(key, label, onIcon, offIcon) {
    const btn = h('button.opt', { type: 'button', role: 'switch' });
    const paint = () => {
      const on = !!settings.get(key);
      btn.setAttribute('aria-checked', String(on));
      btn.replaceChildren(icon(on ? onIcon : offIcon), h('span.opt-text', label), h('span.switch'));
      btn.title = `${label}：${on ? '开' : '关'}`;
    };
    btn.addEventListener('click', () => {
      settings.set(key, !settings.get(key));
      paint();
      if (key === 'sound') sfx.tick();
      if (key === 'voice' && !settings.get('voice')) voice.cancel();
    });
    paint();
    return btn;
  }

  setCollapsed(on) {
    this.rail.classList.toggle('collapsed', on);
    const btn = this.rail.querySelector('.collapse');
    const label = on ? '展开侧栏' : '收起侧栏';
    btn.title = label;
    btn.setAttribute('aria-label', label);
  }

  closeDrawer() {
    this.app.classList.remove('drawer');
  }

  mount(el) {
    this.closeDrawer();
    this.view.replaceChildren(el);
  }

  setActive(id) {
    this.active = id;
    for (const el of this.list.children) el.classList?.toggle('active', el.dataset.id === id);
  }

  async refresh() {
    const items = await recents.list();
    this.urls.forEach((u) => URL.revokeObjectURL(u));
    this.urls = [];
    if (!items.length) {
      this.list.replaceChildren(h('p.recents-empty', '拍完的大头贴会出现在这里。'));
      return;
    }
    this.list.replaceChildren(
      ...items.slice(0, 40).map((it) => {
        const url = URL.createObjectURL(it.thumb || it.blob);
        this.urls.push(url);
        const a = h(
          'a.recent',
          { href: `#/p/${it.id}`, role: 'listitem', dataset: { id: it.id } },
          h('img', { src: url, alt: '' }),
          h('span', h('b', it.title || '无题'), h('small', `${it.modelName || ''} · ${fmtDate(new Date(it.created), '/')}`)),
        );
        a.addEventListener('click', () => this.closeDrawer());
        if (it.id === this.active) a.classList.add('active');
        return a;
      }),
    );
  }

  recentUrls() {
    return this.urls;
  }
}
