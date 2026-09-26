// A saved print (#/p/<id>), laid out like a past conversation: a short
// recap from Claude on the left, the artifact on the right.

import { h } from '../core/dom.js';
import { recents } from '../core/store.js';
import { fmtDate, fmtTime } from '../core/util.js';
import { Chat } from './chat.js';
import { Stage } from './stage.js';
import { Dock, actions, button } from './dock.js';
import { ArtifactView, canShareFiles } from './artifact.js';
import { confirmModal, toast } from './ui.js';

export class Viewer {
  constructor(id, { onAgain, onGone }) {
    this.ctrl = new AbortController();
    this.chat = new Chat(this.ctrl.signal);
    this.stage = new Stage();
    this.dock = new Dock();
    this.title = h('b', '大头贴');
    this.badge = h('span.model-badge');
    this.el = h('div.booth.viewer', h('section.convo', h('header.convo-head', h('div.convo-title', this.title, this.badge)), this.chat.el, this.dock.el), this.stage.el);
    this.load(id, { onAgain, onGone });
  }

  async load(id, { onAgain, onGone }) {
    const rec = await recents.get(id);
    if (this.ctrl.signal.aborted) return;
    if (!rec) {
      this.stage.head({ icon: 'image', title: '找不到了', sub: '' });
      this.stage.show(h('div.cam-wait', h('p', '这张大头贴不在这台设备上了。'), h('small', '照片只存在拍摄时用的浏览器里。')), 'center');
      const back = button('回到首页', { primary: true, icon: 'home' });
      back.addEventListener('click', onGone);
      this.dock.set([actions(back)]);
      return;
    }
    const d = new Date(rec.created);
    this.title.textContent = rec.title || '无题大头贴';
    this.badge.textContent = rec.modelName || '';
    const art = (this.art = new ArtifactView(rec));
    this.stage.head({ icon: 'image', title: rec.title || '大头贴', sub: `${rec.fileName} · ${rec.w}×${rec.h}` });
    this.stage.setTools(art.tools);
    this.stage.show(h('div.print-view.done', art.el), 'center');

    const bits = [rec.modelName, rec.frameName && `「${rec.frameName}」相框`, rec.filterName && `${rec.filterName}滤镜`].filter(Boolean).join('、');
    await this.chat.claude(`这是你在 ${fmtDate(d)} ${fmtTime(d)} 拍的${rec.title ? `「${rec.title}」` : '大头贴'}。用的是 ${bits}。`, { speak: false });

    const del = button('删除', { icon: 'trash', cls: 'ghost' });
    del.addEventListener('click', async () => {
      const ok = await confirmModal({ title: '删除这张大头贴？', text: '删除后无法恢复。', ok: '删除', danger: true });
      if (!ok) return;
      await recents.remove(rec.id);
      toast('已删除');
      onGone();
    });
    const again = button('再拍一组', { icon: 'refresh', title: '用同样的模型、版式、相框和滤镜再拍一组' });
    again.addEventListener('click', () => onAgain({ title: rec.title || '', model: rec.model || 'sonnet', layout: rec.layout, frame: rec.frame, filter: rec.filter, thinking: false }));
    const share = button('分享', { icon: 'share' });
    share.addEventListener('click', () => art.share());
    const dl = button('下载 PNG', { primary: true, icon: 'download' });
    dl.addEventListener('click', () => art.download());
    this.dock.set([actions(del, again, canShareFiles() ? share : null, dl)]);
  }

  destroy() {
    this.ctrl.abort();
    this.art?.destroy();
    this.chat.destroy();
  }
}
