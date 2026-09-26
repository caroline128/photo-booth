// A booth session: the conversation column (thread + dock) on the left, the
// artifact-style stage on the right, and the steps run in order.

import { h } from '../core/dom.js';
import { isAbort } from '../core/util.js';
import { settings } from '../core/store.js';
import { MODELS } from '../data/models.js';
import { LAYOUTS } from '../photo/layouts.js';
import { frameById, framesFor } from '../photo/frames/index.js';
import { makeInfo } from '../photo/frames/common.js';
import { icon } from '../art/icons.js';
import { Chat } from './chat.js';
import { Stage } from './stage.js';
import { Dock, actions, button } from './dock.js';
import { stepFrame } from './steps/frame.js';
import { stepCamera } from './steps/camera.js';
import { mountLive, stepReady, stepShoot } from './steps/shoot.js';
import { stepPick } from './steps/pick.js';
import { stepFilter } from './steps/filter.js';
import { stepDecorate } from './steps/decorate.js';
import { stepPrint } from './steps/print.js';

export class Booth {
  constructor(cfg, hooks) {
    this.hooks = hooks;
    this.ctrl = new AbortController();
    const model = MODELS[cfg.model] || MODELS.sonnet;
    const L = model.layouts.includes(cfg.layout) ? LAYOUTS[cfg.layout] : LAYOUTS[model.layouts[0]];
    let frame = frameById(cfg.frame || 'cream');
    if (!framesFor(L).includes(frame)) frame = framesFor(L)[0];
    const signal = this.ctrl.signal;
    this.S = {
      cfg,
      model,
      L,
      frame,
      filter: cfg.filter || (frame.id === 'terminal' ? 'ascii' : 'cream'),
      beauty: 'natural',
      prop: 'none',
      shots: [],
      picks: [],
      retakeUsed: false,
      signal,
      info: makeInfo({ title: cfg.title, modelName: model.name, seed: Math.floor(Math.random() * 1e9), date: new Date(), serial: settings.nextSerial() }),
      chat: new Chat(signal),
      stage: new Stage(),
      dock: new Dock(),
    };
    const S = this.S;
    const exit = h('button.icon-btn', { type: 'button', title: '离开', 'aria-label': '离开拍摄' }, icon('close'));
    exit.addEventListener('click', () => hooks.onExit());
    const head = h(
      'header.convo-head',
      h('div.convo-title', h('b', cfg.title || '新的大头贴'), h('span.model-badge', model.name, cfg.thinking ? h('i', cfg.ultra ? ' · ultrathink' : ' · 扩展思考') : null)),
      exit,
    );
    this.el = h('div.booth', h('section.convo', head, S.chat.el, S.dock.el, h('p.convo-note', 'Claude 也会拍糊，请仔细核对每一个笑容。')), S.stage.el);
  }

  async run() {
    const S = this.S;
    try {
      if (S.cfg.ultra) await S.chat.claude('**ultrathink** 已开启。接下来的每一次倒数，我都会想得非常、非常认真。');
      await stepFrame(S);
      await stepCamera(S);
      this.live = mountLive(S);
      await stepReady(S, this.live);
      await stepShoot(S, this.live);
      await stepPick(S, this.live);
      S.source.stop();
      await stepFilter(S);
      await stepDecorate(S);
      this.printing = true;
      await stepPrint(S, this.hooks);
      this.finished = true;
    } catch (e) {
      if (isAbort(e) || S.signal.aborted) return;
      console.error(e);
      await S.chat.claude(`抱歉，出了点问题（${e.message || e}）。我们重新来一次好吗？`, { speak: false });
      const again = button('重新开始', { primary: true, icon: 'refresh' });
      again.addEventListener('click', () => this.hooks.onAgain(S.cfg));
      S.dock.set([actions(again)]);
    }
  }

  busy() {
    return this.S.shots.length > 0 && !this.finished && !this.printing;
  }

  destroy() {
    this.ctrl.abort();
    this.live?.stop();
    this.S.source?.stop();
    this.S.editor?.destroy();
    this.S.artifact?.destroy();
    this.S.chat.destroy();
  }
}
