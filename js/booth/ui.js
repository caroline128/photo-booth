// Shared on-screen widgets for booth steps: the step timer ring, buttons,
// modal dialogs and the camera-trouble dialog.

import { h } from '../core/util.js';
import { sfx } from '../core/audio.js';

/**
 * A countdown ring. Resolves `done` when it hits zero. `onTick(left)` fires
 * each second. Call `stop()` to cancel without resolving.
 */
export function stepTimer(seconds, { onTick, warnAt = 10 } = {}) {
  const num = h('b', String(seconds));
  const el = h('div.timer', { role: 'timer', 'aria-label': `剩余 ${seconds} 秒` }, h('span.timer-label', 'TIME'), num);
  el.style.setProperty('--p', '1');
  let left = seconds;
  let id = null;
  let resolveFn;
  let paused = false;
  const done = new Promise((r) => (resolveFn = r));
  const tick = () => {
    if (paused) return;
    left -= 1;
    num.textContent = String(Math.max(0, left));
    el.style.setProperty('--p', String(Math.max(0, left) / seconds));
    el.setAttribute('aria-label', `剩余 ${left} 秒`);
    el.classList.toggle('warn', left <= warnAt);
    if (left <= 5 && left > 0) sfx.click();
    onTick?.(left);
    if (left <= 0) {
      clearInterval(id);
      resolveFn('timeout');
    }
  };
  id = setInterval(tick, 1000);
  return {
    el,
    done,
    get left() {
      return left;
    },
    stop() {
      clearInterval(id);
    },
    pause(v = true) {
      paused = v;
    },
  };
}

export function btn(label, onClick, cls = '') {
  const b = h(`button.btn${cls ? '.' + cls.split(' ').join('.') : ''}`, { type: 'button' }, label);
  b.addEventListener('click', (e) => {
    if (b.disabled) return;
    sfx.click();
    onClick?.(e);
  });
  return b;
}

/** Modal dialog inside `root`. Resolves with the id of the chosen action. */
export function modal(root, { title, body, actions = [{ id: 'ok', label: '好的', primary: true }], cls = '' }) {
  return new Promise((resolve) => {
    const close = (id) => {
      wrap.classList.add('out');
      setTimeout(() => wrap.remove(), 200);
      resolve(id);
    };
    const wrap = h(
      `div.modal-wrap${cls ? '.' + cls : ''}`,
      h(
        'div.modal',
        { role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        title && h('h3', title),
        typeof body === 'string' ? h('p', body) : body,
        h(
          'div.modal-actions',
          actions.map((a) => btn(a.label, () => close(a.id), a.primary ? 'primary' : 'ghost')),
        ),
      ),
    );
    root.appendChild(wrap);
    wrap.querySelector('.btn.primary')?.focus();
  });
}

export const CAMERA_HELP = {
  denied: '摄像头权限被拒绝了。可以在浏览器地址栏左侧的权限设置里允许摄像头，然后点「重试」。',
  notfound: '没有找到可用的摄像头。',
  busy: '摄像头正被其他程序占用，关掉其他视频应用后再试试。',
  insecure: '摄像头只能在 https:// 或 localhost 页面使用。请用本地服务器或 https 打开这个网页。',
  unsupported: '这个浏览器不支持摄像头 API，请换用最新版 Chrome / Edge / Safari / Firefox。',
  unknown: '摄像头启动失败。',
};
