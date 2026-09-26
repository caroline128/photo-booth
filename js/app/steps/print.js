// Step 7 · 出片: render the print at full size, "generate" it out of the
// printer slot, save it to Recents and show it as an artifact.

import { h } from '../../core/dom.js';
import { canvas, sleep, FAST, toBlob, fmtDate } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { recents } from '../../core/store.js';
import { lines, SPIN_VERBS } from '../../data/copy.js';
import { filterById } from '../../photo/fx.js';
import { SparkIcon } from '../../art/spark.js';
import { observeFit } from '../stage.js';
import { actions, button } from '../dock.js';
import { ArtifactView, fileNameFor, canShareFiles } from '../artifact.js';

async function thumbBlob(src) {
  const w = 240, hh = Math.round((240 * src.height) / src.width);
  const c = canvas(w, hh);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, w, hh);
  return toBlob(c, 'image/jpeg', 0.86);
}

export async function stepPrint(S, hooks) {
  const { chat, stage, dock, model, L } = S;
  dock.clear();
  stage.setTools();
  stage.head({ icon: 'spark', title: '生成中', sub: '大头贴.png' });
  await chat.claude(lines.print);
  const status = chat.status(`${SPIN_VERBS[0]}…`);

  const final = await S.editor.renderFinal(1);
  const blob = await toBlob(final);
  const url = URL.createObjectURL(blob);

  // printer: a slot, the paper sliding out, a progress line
  const img = h('img', { src: url, alt: '' });
  const paper = h('div.pv-paper', img);
  const mask = h('div.pv-mask', paper);
  const spin = new SparkIcon({ size: 18, mode: 'think' });
  const verb = h('span', `${SPIN_VERBS[0]}…`);
  const bar = h('i');
  const view = h('div.print-view', h('div.pv-printer', h('div.pv-slot'), mask), h('div.pv-status', spin.el, verb, h('span.pv-bar', bar)));
  stage.show(view, 'center');
  const release = observeFit(stage, L.W / (L.H * 1.12), (w) => {
    paper.style.width = `${w * 0.92}px`;
    view.style.setProperty('--pw', `${w * 0.92}px`);
  });

  const stop = sfx.printer();
  const dur = FAST ? 900 : 4200;
  const t0 = performance.now();
  let v = 0;
  await new Promise((resolve) => {
    const tick = () => {
      if (S.signal.aborted) return resolve();
      const t = Math.min(1, (performance.now() - t0) / dur);
      // stop-and-go, like a thermal printer feeding paper
      const k = t + Math.sin(t * Math.PI * 14) * 0.012 * (1 - t);
      paper.style.transform = `translateY(${(-100 + Math.min(1, k) * 100).toFixed(2)}%)`;
      bar.style.width = `${Math.round(t * 100)}%`;
      const nv = Math.min(SPIN_VERBS.length - 1, Math.floor(t * 6));
      if (nv !== v) {
        v = nv;
        verb.textContent = `${SPIN_VERBS[v]}…`;
        status.set(`${SPIN_VERBS[v]}…`);
      }
      if (t < 1) requestAnimationFrame(tick);
      else resolve();
    };
    tick();
  });
  stop();
  spin.destroy();
  release();
  if (S.signal.aborted) return;
  sfx.done();
  status.done('生成完成');

  // save
  const title = S.cfg.title || '';
  const fileName = fileNameFor(title, S.info.date);
  const meta = {
    fileName,
    model: model.name,
    frame: S.frame.id,
    filter: S.filter,
    date: fmtDate(S.info.date),
    photos: S.picks.map((i) => ({ shot: i + 1, pose: S.poses?.[i]?.text || '' })),
    stickers: S.editor.items.map((it) => it.def.name || it.def.id),
    strokes: S.editor.strokes.filter((s) => s.pen !== 'eraser').length,
  };
  let saved = null;
  try {
    saved = await recents.add({
      title,
      model: model.id,
      modelName: model.name,
      frame: S.frame.id,
      frameName: S.frame.name,
      filter: S.filter,
      filterName: filterById(S.filter).name,
      layout: L.id,
      w: final.width,
      h: final.height,
      blob,
      thumb: await thumbBlob(final),
      fileName,
      meta,
    });
    hooks.onSaved?.(saved.id);
  } catch (e) {
    console.warn('[recents] not saved', e);
  }
  URL.revokeObjectURL(url);

  // artifact
  const art = new ArtifactView({ blob, title, fileName, meta });
  S.artifact = art;
  stage.head({ icon: 'image', title: title || '大头贴', sub: `${fileName} · ${final.width}×${final.height}` });
  stage.setTools(art.tools);
  const wrap = h('div.print-view.done', art.el);
  stage.show(wrap, 'center');

  const share = button('分享', { icon: 'share' });
  share.addEventListener('click', () => art.share());
  const dl = button('下载 PNG', { primary: true, icon: 'download' });
  dl.addEventListener('click', () => art.download());
  const again = button('再来一组', { icon: 'refresh' });
  again.addEventListener('click', () => hooks.onAgain({ ...S.cfg, layout: L.id, frame: S.frame.id, filter: S.filter }));
  const home = h('button.link-btn', { type: 'button' }, '回到首页');
  home.addEventListener('click', () => hooks.onExit());
  dock.set([actions(home, again, canShareFiles() ? share : null, dl)]);

  await sleep(200, S.signal);
  await chat.claude(lines.done);
  if (saved) await chat.claude(lines.saved, { speak: false });
}
