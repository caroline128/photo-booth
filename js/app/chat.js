// The conversation column: Claude's replies stream in (serif, no bubble),
// your choices appear as bubbles, and "thinking" blocks fold up when done.

import { h } from '../core/dom.js';
import { sfx, voice } from '../core/audio.js';
import { reducedMotion, sleep, FAST } from '../core/util.js';
import { SparkIcon } from '../art/spark.js';
import { icon } from '../art/icons.js';

// **bold** and `code` only.
function parse(md) {
  const out = [];
  const re = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0, m;
  while ((m = re.exec(md))) {
    if (m.index > last) out.push({ t: 'text', s: md.slice(last, m.index) });
    out.push(m[1] ? { t: 'strong', s: m[1] } : { t: 'code', s: m[2] });
    last = re.lastIndex;
  }
  if (last < md.length) out.push({ t: 'text', s: md.slice(last) });
  return out;
}

export class Chat {
  constructor(signal) {
    this.signal = signal;
    this.el = h('div.thread', { role: 'log', 'aria-live': 'polite', 'aria-label': '和 Claude 的对话' });
    this.stick = true;
    this.el.addEventListener('scroll', () => {
      this.stick = this.el.scrollHeight - this.el.scrollTop - this.el.clientHeight < 40;
    });
    this.sparks = [];
  }

  scroll(force = false) {
    if (!force && !this.stick) return;
    requestAnimationFrame(() => (this.el.scrollTop = this.el.scrollHeight));
  }

  add(node) {
    this.el.append(node);
    this.scroll(true);
    return node;
  }

  async claude(md, { speak = true, extra = null } = {}) {
    this.sparks.forEach((s) => s.setMode('still'));
    const spark = new SparkIcon({ size: 20, mode: 'think' });
    this.sparks.push(spark);
    const body = h('div.msg-text');
    const msg = this.add(h('div.msg.claude', h('div.msg-mark', spark.el), h('div.msg-main', body)));
    // a beat of "thinking" before the first token, like claude.ai
    if (!FAST && !reducedMotion()) await sleep(260, this.signal).catch(() => {});
    sfx.chime();
    if (speak) voice.speak(md);
    const parts = [];
    for (const p of parse(md)) {
      // "✻" becomes the drawn spark instead of a system-font glyph
      p.s.split('✻').forEach((seg, k) => {
        if (k) body.append(icon('spark', { size: 15 }));
        const tn = document.createTextNode('');
        body.append(p.t === 'text' ? tn : h(p.t, tn));
        parts.push([tn, [...seg]]);
      });
    }
    const total = parts.reduce((a, [, cs]) => a + cs.length, 0);
    const dur = reducedMotion() ? 0 : Math.min(1300, total * 26);
    const t0 = performance.now();
    await new Promise((resolve) => {
      const tick = () => {
        if (this.signal?.aborted) return resolve();
        const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
        let n = Math.round(total * k);
        for (const [tn, cs] of parts) {
          const take = Math.min(cs.length, n);
          if (tn.data.length !== take) tn.data = cs.slice(0, take).join('');
          n -= take;
        }
        this.scroll();
        if (k < 1) requestAnimationFrame(tick);
        else resolve();
      };
      tick();
    });
    spark.setMode('breathe');
    setTimeout(() => spark.setMode('still'), 1800);
    if (extra) msg.querySelector('.msg-main').append(extra);
    this.scroll();
    return msg;
  }

  user(content) {
    sfx.tick();
    return this.add(h('div.msg.user', h('div.bubble', content)));
  }

  // A collapsible "thinking" block; lines stream in; done() folds it.
  thinking(label = '思考中') {
    const spark = new SparkIcon({ size: 16, mode: 'think' });
    const lab = h('span.think-label', label);
    const list = h('div.think-body');
    const el = h('details.think', { open: true }, h('summary', spark.el, lab, h('span.think-chev', icon('down', { size: 14 }))), list);
    this.add(el);
    const t0 = performance.now();
    return {
      el,
      label: (t) => (lab.textContent = t),
      add: (text) => {
        const p = list.appendChild(h('p'));
        const cs = [...text];
        const dur = reducedMotion() ? 0 : Math.min(1100, cs.length * 30);
        const t0 = performance.now();
        return new Promise((resolve) => {
          const tick = () => {
            if (this.signal?.aborted) return resolve();
            const k = dur ? Math.min(1, (performance.now() - t0) / dur) : 1;
            p.textContent = cs.slice(0, Math.round(cs.length * k)).join('');
            this.scroll();
            if (k < 1) requestAnimationFrame(tick);
            else resolve();
          };
          tick();
        });
      },
      done: (summary) => {
        spark.setMode('still');
        lab.textContent = summary || `思考了 ${Math.max(1, Math.round((performance.now() - t0) / 1000))} 秒`;
        el.open = false;
        el.classList.add('done');
      },
    };
  }

  // A small muted line with a spinner, e.g. progress while shooting.
  status(text) {
    const spark = new SparkIcon({ size: 14, mode: 'think' });
    const t = h('span', text);
    const el = this.add(h('div.status', spark.el, t));
    return {
      set: (s) => {
        t.textContent = s;
        this.scroll();
      },
      done: (s) => {
        spark.setMode('still');
        if (s) t.textContent = s;
        el.classList.add('done');
      },
    };
  }

  destroy() {
    this.sparks.forEach((s) => s.destroy());
  }
}
