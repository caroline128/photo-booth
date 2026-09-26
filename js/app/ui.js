// Small UI pieces: popover menus, a confirm modal, toasts.

import { h } from '../core/dom.js';

let openPop = null;

export function closePopover() {
  openPop?.close();
}

// Anchor a popover to `anchor`; items: [{ label, sub, tag, checked, onSelect }] | 'sep' | Node
export function popover(anchor, items, { align = 'right', above = true } = {}) {
  closePopover();
  const el = h(
    'div.popover',
    { role: 'menu' },
    items.map((it) => {
      if (it === 'sep') return h('div.menu-sep', { role: 'separator' });
      if (it instanceof Node) return it;
      const btn = h(
        'button.menu-item',
        { type: 'button', role: it.checked == null ? 'menuitem' : 'menuitemradio', 'aria-checked': it.checked == null ? null : String(!!it.checked) },
        h('span.mi-text', h('b', it.label, it.tag ? h('em', it.tag) : null), it.sub ? h('small', it.sub) : null),
        it.checked != null ? h('span.check', it.checked ? '✓' : '') : null,
      );
      btn.addEventListener('click', () => {
        close();
        it.onSelect?.();
      });
      return btn;
    }),
  );
  document.body.append(el);
  const r = anchor.getBoundingClientRect();
  const pw = el.offsetWidth, ph = el.offsetHeight;
  let left = align === 'right' ? r.right - pw : r.left;
  left = Math.max(8, Math.min(left, innerWidth - pw - 8));
  let top = above ? r.top - ph - 8 : r.bottom + 8;
  if (top < 8) top = r.bottom + 8;
  if (top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 8);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.querySelector('button')?.focus({ preventScroll: true });

  const onDoc = (e) => {
    if (!el.contains(e.target) && !anchor.contains(e.target)) close();
  };
  const onKey = (e) => {
    if (e.key === 'Escape') {
      close();
      anchor.focus();
    }
  };
  setTimeout(() => document.addEventListener('pointerdown', onDoc), 0);
  document.addEventListener('keydown', onKey);
  function close() {
    el.remove();
    document.removeEventListener('pointerdown', onDoc);
    document.removeEventListener('keydown', onKey);
    if (openPop?.el === el) openPop = null;
  }
  openPop = { el, close };
  return openPop;
}

export function confirmModal({ title, text, ok = '确定', cancel = '取消', danger = false }) {
  return new Promise((resolve) => {
    const okBtn = h(`button.btn${danger ? '.dark' : '.primary'}`, { type: 'button' }, ok);
    const noBtn = h('button.btn', { type: 'button' }, cancel);
    const back = h(
      'div.modal-back',
      h('div.modal', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title }, h('h3', title), h('p', text), h('div.row', noBtn, okBtn)),
    );
    const done = (v) => {
      back.remove();
      document.removeEventListener('keydown', onKey);
      resolve(v);
    };
    const onKey = (e) => e.key === 'Escape' && done(false);
    okBtn.addEventListener('click', () => done(true));
    noBtn.addEventListener('click', () => done(false));
    back.addEventListener('click', (e) => e.target === back && done(false));
    document.addEventListener('keydown', onKey);
    document.body.append(back);
    okBtn.focus();
  });
}

export function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = h('div.toast', { role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 2700);
}
