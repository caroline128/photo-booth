// A photo booth machine: the physical shell (marquee, lens, flash panels,
// coin slot, print slot) and the flow that walks the guest through the same
// steps as a real booth: insert coins → frame → props → timed shooting →
// pick & one retake → filter → decorate → review → print.

import { h, sleep, pick } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx, say, playBgm, stopBgm, setSubtitleSink, hush } from '../core/audio.js';
import { ensureFonts, themeText } from '../core/fonts.js';
import { stepTimer, modal } from './ui.js';
import { attract, coin } from './steps/intro.js';
import { chooseFrame, chooseOptions, prep } from './steps/setup.js';
import { shoot, pickAndRetake } from './steps/shoot.js';
import { chooseFilter, captions, moveToDecoBooth, decorate, review, printOut } from './steps/finish.js';

export const EXIT = Symbol('exit');

const STEPS = [
  ['frame', '相框'],
  ['prep', '道具'],
  ['shoot', '拍摄'],
  ['pick', '选片'],
  ['filter', '滤镜'],
  ['deco', '涂鸦'],
  ['print', '打印'],
];

export class Booth {
  constructor(theme, { onExit }) {
    this.theme = theme;
    this.onExit = onExit;
    this.session = {
      options: {},
      props: [],
      background: null,
      shots: [],
      selected: [],
      filter: null,
      captions: [],
      retakesLeft: theme.shoot.retakes ?? 1,
      date: new Date(),
      serial: 0,
    };
    this.timers = new Set();
    this.cleanups = [];
    this._abort = null;
    this.aborted = new Promise((_, rej) => (this._abort = rej));
    this.aborted.catch(() => {});
    this.el = this._shell();
  }

  // ------------------------------------------------------------------ shell
  _shell() {
    const t = this.theme;
    const bulbs = h('div.bulbs', Array.from({ length: 18 }, (_, i) => h('i', { style: { '--i': i } })));
    this.subtitle = h('div.subtitle', { 'aria-live': 'polite' });
    this.screenEl = h('div.screen');
    this.stepsEl = h('ol.steps', STEPS.map(([id, label]) => h('li', { dataset: { step: id } }, label)));
    this.timerSlot = h('div.timer-slot');
    this.titleEl = h('div.screen-title');
    this.led = h('i.led');
    this.coinCount = h('b', `${t.price}`);
    const toggle = (key, on, off, label) => {
      const b = h('button.tgl', { type: 'button', title: label, 'aria-label': label, 'aria-pressed': String(store.get(key)) }, store.get(key) ? on : off);
      b.addEventListener('click', () => {
        store.set(key, !store.get(key));
        b.textContent = store.get(key) ? on : off;
        b.setAttribute('aria-pressed', String(store.get(key)));
        if (key === 'bgm') store.get('bgm') ? playBgm(t.bgm) : stopBgm();
        if (key === 'voice' && !store.get('voice')) hush();
      });
      return b;
    };
    const el = h(
      `div.booth.theme-${t.id}`,
      { style: cssVars(t), dataset: { theme: t.id } },
      h(
        'header.booth-top',
        h('button.exit', { type: 'button', onclick: () => this.confirmExit() }, '← 离开机器'),
        h('div.marquee', bulbs, h('h1', t.name), h('small', t.title)),
        h('div.toggles', toggle('sfx', '🔊', '🔈', '音效'), toggle('bgm', '🎵', '🎵̸', '背景音乐'), toggle('voice', '🗣️', '🤐', '机器语音')),
      ),
      h(
        'div.booth-body',
        h('div.flashpanel.l'),
        h(
          'div.cabinet',
          h('div.lensbar', h('span.lens', h('i.glass'), this.led), h('span.plate', t.plate || t.name)),
          h(
            'div.bezel',
            h('div.screen-wrap', h('div.screen-head', this.titleEl, this.stepsEl, this.timerSlot), this.screenEl, this.subtitle),
          ),
          h(
            'div.panel',
            h('div.speaker'),
            h('div.coinslot', h('span', 'INSERT COIN'), h('i.slot'), h('span.price', '🪙 × ', this.coinCount)),
            h('div.printslot', h('i.slot'), h('span', 'PHOTO OUT · 出片口')),
          ),
        ),
        h('div.flashpanel.r'),
      ),
      h('div.flash-overlay'),
    );
    setSubtitleSink((text) => {
      this.subtitle.textContent = text;
      this.subtitle.classList.remove('show');
      void this.subtitle.offsetWidth;
      this.subtitle.classList.add('show');
    });
    this._key = (e) => {
      if (e.key === 'Escape') this.confirmExit();
      // Enter = the machine's big OK button, unless typing or focused on a control
      if (e.key === 'Enter' && !e.repeat) {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || this.el.querySelector('.modal-wrap')) return;
        const ok = this.el.querySelector('.print-scene .btn.primary:not([hidden]), .screen-foot .btn.primary:not(:disabled)');
        if (ok) {
          e.preventDefault();
          ok.click();
        } else if (this.screenEl.classList.contains('is-attract')) this.screenEl.querySelector('.screen-main')?.click();
      }
    };
    window.addEventListener('keydown', this._key);
    return el;
  }

  /** Clear the screen for a new step. Returns { main, foot, timer }. */
  show({ step, title, sub, timer, cls = '' }) {
    this.clearTimers();
    this.screenEl.innerHTML = '';
    this.screenEl.className = `screen ${cls}`;
    this.titleEl.innerHTML = '';
    if (title) this.titleEl.append(h('b', title), sub ? h('small', sub) : null);
    const idx = STEPS.findIndex(([id]) => id === step);
    this.stepsEl.hidden = idx < 0;
    [...this.stepsEl.children].forEach((li, i) => {
      li.classList.toggle('done', i < idx);
      li.classList.toggle('now', i === idx);
    });
    this.timerSlot.innerHTML = '';
    let tm = null;
    if (timer) {
      tm = stepTimer(timer, {
        onTick: (left) => {
          if (left === 10 && timer > 20) this.say('hurry');
        },
      });
      this.timers.add(tm);
      this.timerSlot.append(tm.el);
    }
    const main = h('div.screen-main');
    const foot = h('div.screen-foot');
    this.screenEl.append(main, foot);
    return { main, foot, timer: tm };
  }

  clearTimers() {
    for (const t of this.timers) t.stop();
    this.timers.clear();
  }

  /** Race a promise against leaving the machine. */
  wait(p) {
    return Promise.race([p, this.aborted]);
  }

  say(key, extra = {}) {
    const lines = this.theme.lines || {};
    let line = typeof key === 'string' ? lines[key] : key;
    if (Array.isArray(line)) line = pick(line);
    if (!line) return;
    say(line, { lang: this.theme.lang, ...this.theme.voice, ...extra });
  }

  flash() {
    this.el.classList.remove('flashing');
    void this.el.offsetWidth;
    this.el.classList.add('flashing');
  }

  setLed(state) {
    this.led.dataset.state = state || '';
  }

  // ------------------------------------------------------------------ flow
  async run() {
    const t = this.theme;
    await ensureFonts(t.fonts?.load || [], themeText(t));
    playBgm(t.bgm);
    try {
      await attract(this);
      await coin(this);
      await chooseFrame(this);
      await chooseOptions(this);
      await prep(this);
      await shoot(this);
      await pickAndRetake(this);
      this.releaseCamera();
      await chooseFilter(this);
      if (t.captions) await captions(this);
      for (const step of t.extraSteps || []) await step(this);
      if (t.decoBooth) await moveToDecoBooth(this);
      let again = true;
      while (again) {
        await decorate(this);
        again = (await review(this)) === 'back';
      }
      await printOut(this);
    } catch (e) {
      if (e !== EXIT) {
        console.error(e);
        await modal(this.el, { title: '机器出了点小故障', body: String(e?.message || e), actions: [{ id: 'ok', label: '回到小店', primary: true }] });
        this.leave();
      }
    }
  }

  releaseCamera() {
    this.stage?.destroy();
    this.source?.stop();
    this.stage = null;
    this.source = null;
  }

  async confirmExit() {
    if (this.el.querySelector('.modal-wrap')) return;
    const paid = this.session.paid && !this.session.printed;
    if (paid) {
      const r = await modal(this.el, {
        title: '要离开这台机器吗？',
        body: '已经投的代币不会退还哦（和真的大头贴机一样）。',
        actions: [
          { id: 'stay', label: '继续拍', primary: true },
          { id: 'leave', label: '离开' },
        ],
      });
      if (r !== 'leave') return;
    }
    this.leave();
  }

  leave() {
    sfx.back();
    this.abort();
    this.onExit?.();
  }

  /** Stop everything (idempotent). */
  abort() {
    this._abort(EXIT);
    this.destroy();
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearTimers();
    this.releaseCamera();
    stopBgm();
    hush();
    setSubtitleSink(null);
    window.removeEventListener('keydown', this._key);
    for (const fn of this.cleanups) fn();
  }
}

function cssVars(t) {
  const c = t.colors || {};
  const vars = {};
  for (const [k, v] of Object.entries(c)) vars[`--${k}`] = v;
  if (t.fonts?.display) vars['--font-display'] = t.fonts.display;
  if (t.fonts?.ui) vars['--font-ui'] = t.fonts.ui;
  return vars;
}

export { sleep };
