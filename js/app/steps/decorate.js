// Step 6 · 涂鸦: stickers, text and pens on the print, against the clock.

import { h } from '../../core/dom.js';
import { canvas, dpr, fmtClock, FAST, deferred } from '../../core/util.js';
import { needAll } from '../../core/fonts.js';
import { sfx } from '../../core/audio.js';
import { lines } from '../../data/copy.js';
import { C, PEN_COLORS } from '../../art/palette.js';
import { icon } from '../../art/icons.js';
import { STICKERS, GROUPS } from '../../art/stickers.js';
import { TEXT_STYLES, makeTextSticker } from '../../art/textstick.js';
import { PENS, penPreview, penById } from '../../photo/pens.js';
import { Editor, renderDef } from '../../photo/editor.js';
import { compose } from '../../photo/compose.js';
import { applyFilter } from '../../photo/fx.js';
import { observeFit } from '../stage.js';
import { section, actions, button, segmented } from '../dock.js';

const PHRASES = ['你说得完全正确！', '今天也很好看', '让我想想…', '好问题！', 'Hello, Claude', '周末快乐', '最好的朋友', '存档成功'];
const SIZES = [
  { id: 's', label: '细', k: 0.6 },
  { id: 'm', label: '中', k: 1 },
  { id: 'l', label: '粗', k: 1.7 },
];

// Full-resolution base: frame + filtered photos, no doodles.
export async function renderBase(S) {
  const { L, frame, info } = S;
  const slots = frame.geometry(L, info).slots;
  const photos = S.picks.map((i, k) => applyFilter(S.shots[i], S.filter, S.beauty, Math.round(slots[k].w), Math.round(slots[k].h), { seed: info.seed + k }));
  const { canvas: base } = await compose({ L, frame, photos, info, scale: 1 });
  return base;
}

function thumbOf(def, size = 76) {
  const c = canvas(size * dpr(), size * dpr());
  const ctx = c.getContext('2d');
  const pad = c.width * 0.08;
  const box = c.width - pad * 2;
  let w = box, hh = box * def.ratio;
  if (hh > box) {
    hh = box;
    w = box / def.ratio;
  }
  const { img, pad: p } = renderDef(def, Math.round(w), Math.round(hh));
  const k = w / (img.width - p * 2);
  ctx.drawImage(img, (c.width - img.width * k) / 2, (c.height - img.height * k) / 2, img.width * k, img.height * k);
  c.style.width = c.style.height = `${size}px`;
  return c;
}

export async function stepDecorate(S) {
  const { chat, stage, dock, model } = S;
  const base = await renderBase(S);
  // sticker glyphs load in the background; thumbnails repaint when ready
  const fontsReady = needAll(STICKERS.flatMap((s) => s.fonts || []));

  const ed = (S.editor = new Editor({ base, L: S.L }));
  stage.show(h('div.editor', ed.canvas), 'center');
  const release = observeFit(stage, S.L.W / S.L.H, (w, hh) => ed.resize(w, hh));

  const total = FAST ? 25 : model.decorate;
  let left = total;
  const ring = h('div.timer', { role: 'timer', 'aria-label': '剩余时间' }, h('span'));
  const paintTime = () => {
    ring.style.setProperty('--p', String(left / total));
    ring.firstChild.textContent = fmtClock(left);
    ring.classList.toggle('hurry', left <= 10);
    stage.head({ icon: 'pen', title: '涂鸦', sub: `剩余 ${fmtClock(left)} · ${S.frame.name}` });
  };
  stage.setTools(ring);
  paintTime();
  const hello = chat.claude(lines.decorate(total));

  // --------------------------------------------------------- stickers tab
  let group = GROUPS[0].id;
  const stickerGrid = h('div.sticker-grid');
  const paintStickers = () => {
    stickerGrid.replaceChildren(
      ...STICKERS.filter((s) => s.group === group).map((def) => {
        const b = h('button.sticker-opt', { type: 'button', title: def.name, 'aria-label': `贴纸：${def.name}` }, thumbOf(def));
        b.addEventListener('click', async () => {
          sfx.pop();
          await ed.add(def);
        });
        return b;
      }),
    );
  };
  const groupSeg = segmented(GROUPS.map((g) => ({ id: g.id, label: g.name })), group, (id) => {
    group = id;
    paintStickers();
  }, { label: '贴纸分类' });
  paintStickers();
  fontsReady.then(() => !S.signal.aborted && paintStickers());
  const stickerPane = h('div.tool-pane', groupSeg, stickerGrid);

  // ------------------------------------------------------------ text tab
  let style = TEXT_STYLES[1].id;
  const input = h('input.text-input', { type: 'text', maxlength: 40, placeholder: '写点什么…', 'aria-label': '文字内容' });
  const addText = async (t) => {
    const text = (t ?? input.value).trim();
    if (!text) return input.focus();
    const def = await makeTextSticker(style, text);
    sfx.pop();
    await ed.add(def);
    input.value = '';
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && !e.isComposing && addText());
  const addBtn = button('添加', { primary: true, cls: 'sm' });
  addBtn.addEventListener('click', () => addText());
  const styleSeg = segmented(TEXT_STYLES.map((s) => ({ id: s.id, label: s.name })), style, (id) => (style = id), { label: '文字样式' });
  const phrases = h(
    'div.phrases',
    PHRASES.map((p) => {
      const b = h('button.chip.sm', { type: 'button' }, p);
      b.addEventListener('click', () => addText(p));
      return b;
    }),
  );
  const textPane = h('div.tool-pane', h('div.text-row', input, addBtn), styleSeg, h('div.dock-label', '常用语'), phrases);

  // ------------------------------------------------------------- pen tab
  let sizeK = 1;
  const penGrid = h('div.pen-grid');
  const colors = h('div.colors', { role: 'radiogroup', 'aria-label': '颜色' });
  const applyPen = () => {
    const p = penById(ed.pen.pen);
    ed.pen.size = p.size * sizeK;
  };
  const paintPens = () => {
    penGrid.replaceChildren(
      ...PENS.map((p) => {
        const c = canvas(96 * dpr(), 40 * dpr());
        const ctx = c.getContext('2d');
        ctx.scale(dpr(), dpr());
        penPreview(ctx, p.id, p.id === 'eraser' ? C.ink : ed.pen.color, 96, 40);
        c.style.width = '96px';
        c.style.height = '40px';
        const b = h('button.pen-opt', { type: 'button', 'aria-pressed': String(ed.pen.pen === p.id) }, c, h('span', p.name));
        b.addEventListener('click', () => {
          ed.pen.pen = p.id;
          applyPen();
          sfx.tick();
          paintPens();
        });
        return b;
      }),
    );
  };
  const paintColors = () => {
    colors.replaceChildren(
      ...PEN_COLORS.map((col) => {
        const b = h('button.swatch', { type: 'button', role: 'radio', 'aria-checked': String(ed.pen.color === col), 'aria-label': col, style: { '--c': col } });
        b.addEventListener('click', () => {
          ed.pen.color = col;
          sfx.tick();
          paintColors();
          paintPens();
        });
        return b;
      }),
    );
  };
  paintPens();
  paintColors();
  const sizeSeg = segmented(SIZES.map((s) => ({ id: s.id, label: s.label })), 'm', (id) => {
    sizeK = SIZES.find((s) => s.id === id).k;
    applyPen();
  }, { label: '粗细' });
  const penPane = h('div.tool-pane', penGrid, h('div.pen-row', colors, sizeSeg));

  // ----------------------------------------------------------------- tabs
  const panes = { sticker: stickerPane, text: textPane, pen: penPane };
  const body = h('div.tool-body', stickerPane);
  const tabs = h('div.tool-tabs', { role: 'tablist' });
  const setTab = (id) => {
    for (const t of tabs.children) t.setAttribute('aria-selected', String(t.dataset.id === id));
    body.replaceChildren(panes[id]);
    ed.setMode(id === 'pen' ? 'pen' : 'select');
  };
  for (const [id, label, ico] of [['sticker', '贴纸', 'sticker'], ['text', '文字', 'text'], ['pen', '画笔', 'pen']]) {
    const t = h('button.tool-tab', { type: 'button', role: 'tab', dataset: { id } }, icon(ico, { size: 16 }), label);
    t.addEventListener('click', () => {
      sfx.tick();
      setTab(id);
    });
    tabs.append(t);
  }
  setTab('sticker');

  const undo = h('button.icon-btn', { type: 'button', title: '撤销 (⌘Z)', 'aria-label': '撤销' }, icon('undo'));
  const redo = h('button.icon-btn', { type: 'button', title: '重做', 'aria-label': '重做' }, icon('redo'));
  undo.addEventListener('click', () => ed.undo());
  redo.addEventListener('click', () => ed.redo());

  // selection bar
  const selBar = h('div.sel-bar', { hidden: true });
  for (const [label, ico, fn] of [['翻转', 'flip', () => ed.flipSel()], ['复制', 'copy', () => ed.dupSel()], ['置顶', 'layers', () => ed.frontSel()], ['删除', 'trash', () => ed.removeSel()]]) {
    const b = h('button.btn.sm', { type: 'button' }, icon(ico, { size: 15 }), label);
    b.addEventListener('click', fn);
    selBar.append(b);
  }

  const clearBtn = button('清空', { cls: 'sm' });
  clearBtn.addEventListener('click', () => ed.clear());
  const doneBtn = button('完成', { primary: true, icon: 'check' });
  const finished = deferred(S.signal);
  doneBtn.addEventListener('click', () => finished.resolve('done'));

  ed.onChange = (st) => {
    undo.disabled = !st.canUndo;
    redo.disabled = !st.canRedo;
    selBar.hidden = !st.sel;
  };
  ed.emit();

  dock.set([h('div.tool-head', tabs, h('span.grow'), undo, redo), body, selBar, actions(h('span.dock-hint', '拖动贴纸，右下角旋转缩放，双指也行'), clearBtn, doneBtn)], 'wide tall');

  await hello;

  // ---------------------------------------------------------------- timer
  let warned30 = false, warned10 = false;
  const timer = setInterval(() => {
    left -= 1;
    paintTime();
    if (left === 30 && total > 45 && !warned30) {
      warned30 = true;
      chat.claude(lines.hurry30);
    }
    if (left === 10 && !warned10) {
      warned10 = true;
      chat.claude(lines.hurry10);
    }
    if (left <= 5 && left > 0) sfx.count(Math.min(5, left));
    if (left <= 0) finished.resolve('timeout');
  }, 1000);
  S.signal.addEventListener('abort', () => clearInterval(timer), { once: true });

  const why = await finished.promise.finally(() => clearInterval(timer));
  ed.select(null);
  release();
  if (why === 'timeout') await chat.claude(lines.timeup);
  const n = ed.items.length, m = ed.strokes.filter((s) => s.pen !== 'eraser').length;
  chat.user(n || m ? `涂鸦完成：${n} 个贴纸，${m} 笔` : '不涂了，就这样');
}
