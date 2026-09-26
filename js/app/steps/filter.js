// Step 5 · 滤镜: one look for the whole print, plus the beauty level.

import { h } from '../../core/dom.js';
import { canvas } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { lines } from '../../data/copy.js';
import { FILTERS, BEAUTY, applyFilter, filterById } from '../../photo/fx.js';
import { cropFor } from '../../photo/camera.js';
import { section, actions, button, segmented, clicked } from '../dock.js';
import { SheetView } from '../sheet.js';

function square(src, size) {
  const c = canvas(size, size);
  const k = cropFor(src.width, src.height, 1);
  c.getContext('2d').drawImage(src, k.x, k.y, k.w, k.h, 0, 0, size, size);
  return c;
}

export async function stepFilter(S) {
  const { chat, stage, dock } = S;
  const photos = S.picks.map((i) => S.shots[i]);
  const view = new SheetView(S, async (scale, slots) =>
    slots.map((s, i) => applyFilter(photos[i], S.filter, S.beauty, Math.max(8, Math.round(s.w * scale)), Math.max(8, Math.round(s.h * scale)), { seed: S.info.seed + i })),
  );
  const paintHead = () => stage.head({ icon: 'wand', title: '滤镜', sub: `${filterById(S.filter).name} · ${BEAUTY.find((b) => b.id === S.beauty)?.name || ''}` });
  paintHead();
  stage.show(view.el, 'center');
  const first = view.render();
  await chat.claude(lines.filter);
  await first;

  const base = square(photos[0], 180);
  const grid = h('div.filter-grid', { role: 'radiogroup', 'aria-label': '滤镜' });
  const paintThumbs = () => {
    grid.replaceChildren(
      ...FILTERS.map((f) => {
        const t = applyFilter(base, f, S.beauty, 120, 120, { seed: 7 });
        const b = h('button.filter-opt', { type: 'button', role: 'radio', 'aria-checked': String(f.id === S.filter), title: f.desc }, t, h('span', f.name));
        b.addEventListener('click', () => {
          if (S.filter === f.id) return;
          S.filter = f.id;
          for (const x of grid.children) x.setAttribute('aria-checked', String(x === b));
          sfx.select();
          paintHead();
          view.render();
        });
        return b;
      }),
    );
  };
  paintThumbs();
  const beauty = segmented(
    BEAUTY.map((b) => ({ id: b.id, label: b.name })),
    S.beauty,
    (id) => {
      S.beauty = id;
      paintHead();
      paintThumbs();
      view.render();
    },
    { label: '美颜' },
  );
  const next = button('下一步：涂鸦', { primary: true, icon: 'right' });
  dock.set([section('滤镜', grid), section('美颜', beauty), actions(h('span.dock-hint', '滤镜会用在所有照片上'), next)], 'wide');
  await clicked(next, S.signal);
  view.destroy();
  chat.user(`滤镜：${filterById(S.filter).name}`);
}
