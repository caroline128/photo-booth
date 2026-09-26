// Dev gallery: every drawn asset on one page, for visual checks.
// dev/gallery.html?s=spark,mascot,scene,frames,stickers,filters

import { h } from '../core/dom.js';
import { canvas } from '../core/util.js';
import { drawSpark, sparkSVG, SPARK_SEED } from '../art/spark.js';
import { drawMascot, POSES, DemoScene, mascotPhoto, POSE_IDS } from '../art/mascot.js';
import { LAYOUTS } from '../photo/layouts.js';
import { FRAMES } from '../photo/frames/index.js';
import { compose } from '../photo/compose.js';
import { makeInfo } from '../photo/frames/common.js';
import { FILTERS, BEAUTY, applyFilter } from '../photo/fx.js';
import { STICKERS, GROUPS } from '../art/stickers.js';
import { needAll } from '../core/fonts.js';
import { renderDef } from '../photo/editor.js';

const root = document.getElementById('root');
const want = new URLSearchParams(location.search).get('s')?.split(',') || ['spark', 'mascot', 'scene'];
const fig = (node, cap) => h('figure', node, h('figcaption', cap));

const q = new URLSearchParams(location.search);
const scale = Number(q.get('scale') || 0.3);

function photosFor(L) {
  const w = 640, h = Math.round(640 / L.aspect);
  return POSE_IDS.slice(0, L.count).map((p) => mascotPhoto(p, w, h));
}

const sections = {
  async stickers() {
    await needAll(STICKERS.flatMap((st) => st.fonts || []));
    const out = [h('h2', `贴纸 Stickers · ${STICKERS.length}`)];
    const bg = q.get('bg');
    for (const g of GROUPS) {
      const row = h('div.row');
      for (const st of STICKERS.filter((x) => x.group === g.id)) {
        const w = 220, hh = Math.round(w * st.ratio);
        const c = canvas(w + 20, hh + 20);
        const ctx = c.getContext('2d');
        if (bg) {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, c.width, c.height);
        }
        if (q.has('outline')) {
          // exactly what the editor pastes onto a photo (die-cut edge included)
          const b = renderDef(st, w, hh);
          ctx.drawImage(b.img, 10 - b.pad, 10 - b.pad);
        } else {
          ctx.translate(10, 10);
          st.draw(ctx, w, hh);
        }
        row.append(fig(c, `${st.name} · ${st.id}`));
      }
      out.push(h('h3', `${g.name} · ${g.id}`), row);
    }
    return out;
  },
  filters() {
    const row = h('div.row');
    const src = mascotPhoto(q.get('pose') || 'peace', 800, 600);
    for (const f of FILTERS) row.append(fig(applyFilter(src, f, 'natural', 400, 300), f.name));
    const row2 = h('div.row');
    for (const b of BEAUTY) row2.append(fig(applyFilter(src, 'natural', b, 400, 300), `美颜 · ${b.name}`));
    return [h('h2', '滤镜 Filters'), row, row2];
  },
  async frames() {
    const out = [h('h2', '相框 Frames')];
    const only = q.get('frame');
    const title = q.get('title') ?? '周五下班后的我们';
    for (const frame of FRAMES.filter((f) => !only || only.split(',').includes(f.id))) {
      const row = h('div.row');
      const onlyL = q.get('layout')?.split(',');
      for (const L of Object.values(LAYOUTS)) {
        if (frame.layouts && !frame.layouts.includes(L.id)) continue;
        if (onlyL && !onlyL.includes(L.id)) continue;
        const info = makeInfo({ title, modelName: L.count === 3 ? 'Haiku' : L.count === 4 ? 'Sonnet' : 'Opus' });
        const { canvas: c } = await compose({ L, frame, photos: photosFor(L), info, scale });
        row.append(fig(c, `${frame.name} · ${L.name}`));
      }
      out.push(h('h3', frame.name), row);
    }
    return out;
  },
  spark() {
    const row = h('div.row');
    for (let seed = 1; seed <= 12; seed++) {
      const c = canvas(140, 140);
      drawSpark(c.getContext('2d'), 70, 70, 62, { seed });
      row.append(fig(c, `seed ${seed}${seed === SPARK_SEED ? ' ★' : ''}`));
    }
    const c = canvas(140, 140);
    drawSpark(c.getContext('2d'), 70, 70, 56, { outline: '#141413', outlineWidth: 5 });
    row.append(fig(c, 'outline'));
    const img = h('img', { src: `data:image/svg+xml,${encodeURIComponent(sparkSVG(140))}`, width: 140, height: 140 });
    row.append(fig(img, 'svg'));
    return [h('h2', '星芒 Spark'), row];
  },
  mascot() {
    const row = h('div.row');
    for (const style of ['plush', 'ink'])
      for (const pose of Object.keys(POSES)) {
        const c = canvas(220, 220);
        drawMascot(c.getContext('2d'), 110, 118, 50, { pose, t: 0.6, style });
        row.append(fig(c, `${pose} · ${style}`));
      }
    return [h('h2', '小芒 Mascot'), row];
  },
  scene() {
    const row = h('div.row');
    for (const pose of ['idle', 'peace', 'think', 'cheer']) {
      const s = new DemoScene(640, 480);
      s.setPose(pose, -10);
      s.update(performance.now() + 2000);
      row.append(fig(s.el, pose));
    }
    return [h('h2', '演示场景 Demo scene'), row];
  },
};

for (const key of want) if (sections[key]) root.append(...[await sections[key]()].flat());
document.body.dataset.ready = '1';
