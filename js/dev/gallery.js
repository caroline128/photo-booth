// Dev gallery: renders every prop (on the mannequin and the demo cat),
// sticker, frame, filter, backdrop and text style of one theme so art can be
// checked at a glance.  Open dev/gallery.html?theme=<id>

import { h, canvas as mkCanvas } from '../core/util.js';
import { ensureFonts, themeText } from '../core/fonts.js';
import { artBitmap } from '../art/render.js';
import { Stage } from '../engine/stage.js';
import { createDemoSource } from '../engine/camera.js';
import { compose, slotAspect } from '../engine/compose.js';
import { offlineFx, renderToCanvas } from '../engine/glfx.js';
import { textArt } from '../engine/decorate.js';
import { samplePrint, defaultOptions } from '../booth/sample.js';
import { createMannequinSource } from './mannequin.js';

const out = document.getElementById('out');
const id = new URLSearchParams(location.search).get('theme') || 'classic';

const section = (title, ...kids) => out.append(h('h2', title), h('div.grid', ...kids));
const fig = (node, cap, cls = '') => h(`figure${cls ? '.' + cls : ''}`, node, h('figcaption', cap));
const img = (c, height) => {
  const i = h('img', { src: c.toDataURL('image/png') });
  if (height) i.style.height = height + 'px';
  return i;
};

async function main() {
  const t = (await import(`../themes/${id}/index.js`)).default;
  document.getElementById('title').textContent = `${t.name} · ${t.title} (${t.id})`;
  await ensureFonts(t.fonts?.load || [], themeText(t));
  // don't hang forever when a web font request stalls
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 5000))]);
  const session = { options: defaultOptions(t) };

  // sample print as shown in the lobby
  const sample = h('img', { src: await samplePrint(t) });
  section('Lobby sample (demo cat)', fig(sample, 'samplePrint'));

  // props on the mannequin + demo cat
  const layout = t.layouts[0];
  const aspect = slotAspect(layout);
  const man = createMannequinSource();
  const cat = createDemoSource({ animate: false });
  cat.renderAt(1.3);
  const figs = [];
  for (const p of t.props) {
    const row = [];
    for (const src of [man, cat]) {
      const stage = new Stage({ source: src, aspect, preview: false });
      await stage.setProps([p]);
      const shot = stage.capture(520);
      row.push(img(shot.raw, 200));
    }
    const bmp = await artBitmap(p, 160);
    figs.push(fig(h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } }, img(bmp, 80), ...row), `${p.id} · ${p.name} · anchor=${p.anchor}`));
  }
  section(`Props (${t.props.length}) — art · mannequin · cat`, ...figs);

  // stickers
  const sfigs = [];
  for (const s of t.stickers) {
    const bmp = await artBitmap(s, 170);
    sfigs.push(fig(img(bmp, Math.min(170, bmp.height)), `${s.id} · ${s.name || ''}${s.group ? ' · ' + s.group : ''}`));
  }
  section(`Stickers (${t.stickers.length})`, ...sfigs);

  // photos for frames: demo cat through liveFx + first filter
  const photosFor = async (lay) => {
    const st = new Stage({ source: cat, aspect: slotAspect(lay), preview: false });
    await st.setProps((t.sampleProps || []).map((pid) => t.props.find((p) => p.id === pid)).filter(Boolean));
    const res = [];
    for (let i = 0; i < lay.photos; i++) {
      cat.renderAt(1.3 + i * 2.5);
      const shot = st.capture(640);
      const fx = { ...(t.liveFx?.(session, shot.faces, shot.w, shot.h) || {}), ...t.filters[0].fx };
      res.push(renderToCanvas(offlineFx(), shot.raw, fx, shot.w, shot.h));
    }
    return res;
  };
  const info = { theme: t, date: new Date(), serial: 123, options: session.options, captions: t.sampleCaptions || [] };
  const ffigs = [];
  for (const lay of t.layouts) {
    const photos = await photosFor(lay);
    for (const f of t.frames.filter((fr) => !fr.layouts || fr.layouts.includes(lay.id))) {
      ffigs.push(fig(img(compose(lay, f, photos, info)), `${lay.id} / ${f.id} · ${f.name}`, 'frames'));
      ffigs.push(fig(img(compose(lay, f, [], { ...info, placeholderTint: t.placeholderTint })), `placeholder`, 'frames'));
    }
  }
  section('Layouts × frames', ...ffigs);

  // filters
  const st = new Stage({ source: cat, aspect, preview: false });
  cat.renderAt(4);
  const shot = st.capture(480);
  const flt = t.filters.map((f) => fig(img(renderToCanvas(offlineFx(), shot.raw, { ...(t.liveFx?.(session, shot.faces, shot.w, shot.h) || {}), ...f.fx }, shot.w, shot.h), 180), `${f.id} · ${f.name}`));
  const prev = fig(img(renderToCanvas(offlineFx(), shot.raw, { ...(t.liveFx?.(session, shot.faces, shot.w, shot.h) || {}), ...(t.previewFx || {}) }, shot.w, shot.h), 180), 'live preview look');
  section('Filters', prev, ...flt);

  // backgrounds
  if (t.backgrounds?.length) {
    const bfigs = t.backgrounds.map((bg) => {
      const c = mkCanvas(360, 360 / aspect);
      bg.paint(c.getContext('2d'), c.width, c.height, 0);
      return fig(img(c, 180), `${bg.id} · ${bg.name}`);
    });
    section('Backgrounds', ...bfigs);
  }

  // text styles
  const tfigs = [];
  for (const ts of t.textStyles || []) {
    const bmp = await artBitmap(textArt((t.phrases || ['文字'])[0], ts), 260);
    tfigs.push(fig(img(bmp, 90), ts.name, 'dark'));
  }
  section('Text styles', ...tfigs);
  document.body.dataset.ready = '1';
}

main().catch((e) => {
  out.append(h('pre.err', String(e?.stack || e)));
  document.body.dataset.ready = 'error';
});
