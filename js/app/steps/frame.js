// Step 1 · 版式 + 相框. Previews use 小芒 sample photos.

import { h } from '../../core/dom.js';
import { dpr } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { LAYOUTS } from '../../photo/layouts.js';
import { framesFor } from '../../photo/frames/index.js';
import { compose } from '../../photo/compose.js';
import { mascotPhoto, POSE_IDS } from '../../art/mascot.js';
import { lines } from '../../data/copy.js';
import { section, actions, button, segmented, clicked } from '../dock.js';
import { SheetView } from '../sheet.js';

const cache = new Map();
export function samplePhotos(L) {
  const key = `${L.aspect}:${L.count}`;
  if (!cache.has(key)) {
    const w = 520, hh = Math.round(520 / L.aspect);
    cache.set(key, ['wave', 'peace', 'heart', 'cheer', 'wink', 'spark'].slice(0, L.count).map((p) => mascotPhoto(POSE_IDS.includes(p) ? p : 'idle', w, hh)));
  }
  return cache.get(key);
}

const KIND_ICON = { strip: 'strip', grid: 'grid', hero: 'image', duo: 'layers' };

export async function stepFrame(S) {
  const { chat, stage, dock, model } = S;
  await chat.claude(lines.intro(model, S.cfg.title));

  const view = new SheetView(S, async () => samplePhotos(S.L));
  const paintHead = () => stage.head({ icon: 'image', title: '相框预览', sub: `${S.frame.name} · ${S.L.name} · 示意图` });
  paintHead();
  stage.show(view.el, 'center');
  await view.render();

  const grid = h('div.frame-grid', { role: 'radiogroup', 'aria-label': '相框' });
  const renderThumbs = async () => {
    const L = S.L;
    const th = 150;
    const scale = (th * dpr()) / L.H;
    grid.replaceChildren(
      ...framesFor(L).map((f) => {
        const c = h('canvas');
        c.style.aspectRatio = `${L.W} / ${L.H}`;
        compose({ L, frame: f, photos: samplePhotos(L), info: S.info, scale, target: c });
        const b = h('button.frame-opt', { type: 'button', role: 'radio', 'aria-checked': String(f.id === S.frame.id), title: f.desc }, h('span.frame-thumb', c), h('span.frame-name', f.name));
        b.addEventListener('click', () => {
          if (S.frame.id === f.id) return;
          S.frame = f;
          for (const x of grid.children) x.setAttribute('aria-checked', String(x === b));
          sfx.select();
          paintHead();
          view.render();
        });
        return b;
      }),
    );
  };

  const seg = segmented(
    model.layouts.map((id) => ({ id, label: LAYOUTS[id].name, icon: KIND_ICON[LAYOUTS[id].kind] })),
    S.L.id,
    (id) => {
      S.L = LAYOUTS[id];
      if (!framesFor(S.L).includes(S.frame)) S.frame = framesFor(S.L)[0];
      paintHead();
      renderThumbs();
      view.render();
    },
    { label: '版式' },
  );
  await renderThumbs();

  const next = button('下一步', { primary: true, icon: 'right' });
  dock.set([section('版式', seg), section('相框', grid), actions(h('span.dock-hint', '右边是示意图，拍完会换成你的照片'), next)], 'wide');
  await clicked(next, S.signal);
  view.destroy();
  chat.user(`${S.L.name} · ${S.frame.name}`);
}
