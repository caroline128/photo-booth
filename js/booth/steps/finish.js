// After the shoot: filter → decorate (time-limited 落書き) → review →
// print (dye-sub passes or chemical developing) → the photo in your hand.

import { h, sleep, canvas as mkCanvas, downloadCanvas, stamp } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { wall } from '../../core/store.js';
import { btn, stepTimer } from '../ui.js';
import { compose } from '../../engine/compose.js';
import { offlineFx, renderToCanvas } from '../../engine/glfx.js';
import { Decorator, textArt } from '../../engine/decorate.js';
import { PENS } from '../../engine/pens.js';
import { dyeSubPasses } from '../../engine/printer.js';
import { artThumb } from '../../art/render.js';
import { infoFor } from './setup.js';

function renderShot(b, shot, filter, width) {
  const w = width || shot.w;
  const hh = Math.round((w * shot.h) / shot.w);
  const fx = { ...(b.theme.liveFx?.(b.session, shot.faces, shot.w, shot.h) || {}), ...(filter?.fx || {}) };
  return renderToCanvas(offlineFx(), shot.raw, fx, w, hh);
}

function scaledUrl(src, width, type = 'image/jpeg') {
  const c = mkCanvas(width, (width * src.height) / src.width);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL(type, 0.9);
}

// ------------------------------------------------------------------ filter
export async function chooseFilter(b) {
  const t = b.theme;
  const s = b.session;
  const { main, foot, timer } = b.show({ step: 'filter', title: '选择滤镜', sub: 'FILTER', timer: t.filterTime || 45 });
  let cur = s.filter || t.filters[0];
  const preview = h('img.filter-preview', { alt: '滤镜预览' });
  const chips = h('div.filter-chips');
  const first = s.shots[s.selected[0]];
  const renderPreview = () => {
    const photos = s.selected.map((i) => renderShot(b, s.shots[i], cur, 560));
    const full = compose(s.layout, s.frame, photos, infoFor(b));
    preview.src = scaledUrl(full, 520);
  };
  const renderChips = () => {
    chips.innerHTML = '';
    for (const f of t.filters) {
      const thumb = renderShot(b, first, f, 150);
      const chip = h(
        'button.filter-chip',
        { type: 'button', 'aria-pressed': String(f === cur) },
        h('img', { src: thumb.toDataURL('image/jpeg', 0.8), alt: '' }),
        h('b', f.name),
        f.desc ? h('small', f.desc) : null,
      );
      chip.addEventListener('click', () => {
        cur = f;
        sfx.select();
        renderChips();
        renderPreview();
      });
      chips.append(chip);
    }
  };
  renderChips();
  renderPreview();
  main.append(h('div.filter-step', h('div.filter-left', preview), h('div.filter-right', h('h4', '滤镜'), chips)));
  let ok;
  const clicked = new Promise((r) => (ok = r));
  foot.append(btn('就用这个 ✓', () => ok(), 'primary big'));
  b.say('filter');
  await b.wait(Promise.race([clicked, timer.done]));
  s.filter = cur;
  s.photos = s.selected.map((i) => renderShot(b, s.shots[i], cur));
}

// ------------------------------------------------------------------ captions
/** Optional step (theme.captions): a caption per photo, meme-template style. */
export async function captions(b) {
  const t = b.theme;
  const s = b.session;
  const cfg = t.captions;
  const presets = cfg.presets || [];
  const { main, foot, timer } = b.show({ step: 'filter', title: cfg.title || '配字', sub: 'CAPTION', timer: cfg.time || 90 });
  if (!s.captions?.length) s.captions = s.photos.map((_, i) => presets[i % Math.max(1, presets.length)] || '');
  const preview = h('img.filter-preview', { alt: '配字预览' });
  let focused = 0;
  let pending = 0;
  const renderPreview = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const full = compose(s.layout, s.frame, s.photos, infoFor(b));
      preview.src = scaledUrl(full, 520);
    });
  };
  const inputs = [];
  const list = h('div.caption-list');
  s.photos.forEach((p, i) => {
    const input = h('input.text-input', { type: 'text', value: s.captions[i] || '', maxLength: cfg.max || 16, 'aria-label': `第 ${i + 1} 张的配字` });
    input.addEventListener('focus', () => {
      focused = i;
      inputs.forEach((x, j) => x.parentElement.classList.toggle('on', j === i));
    });
    input.addEventListener('input', () => {
      s.captions[i] = input.value;
      renderPreview();
    });
    const shuffle = h('button.btn.ghost.small', { type: 'button', title: '随机换一句' }, '🎲');
    shuffle.addEventListener('click', () => {
      input.value = presets[Math.floor(Math.random() * presets.length)] || '';
      s.captions[i] = input.value;
      sfx.pop();
      renderPreview();
    });
    inputs.push(input);
    list.append(h('div.caption-row', h('img', { src: scaledUrl(p, 120), alt: '' }), input, shuffle));
  });
  inputs[0]?.parentElement.classList.add('on');
  const chips = h('div.phrases', presets.map((txt) => h('button.phrase', { type: 'button', onclick: () => {
    inputs[focused].value = txt;
    s.captions[focused] = txt;
    sfx.select();
    renderPreview();
  } }, txt)));
  main.append(h('div.filter-step', h('div.filter-left', preview), h('div.filter-right', h('h4', cfg.lead || '给每张照片配一句'), list, h('p.pane-tip', '点一句热梗，填进选中的那张：'), chips)));
  renderPreview();
  let ok;
  const clicked = new Promise((r) => (ok = r));
  foot.append(btn('配好了 ✓', () => ok(), 'primary big'));
  if (t.lines?.caption) b.say('caption');
  await b.wait(Promise.race([clicked, timer.done]));
}

// ------------------------------------------------------------------ decorate
export async function decorate(b) {
  const t = b.theme;
  const s = b.session;
  const base = compose(s.layout, s.frame, s.photos, infoFor(b));
  const seconds = s.decoLeft != null ? Math.max(30, s.decoLeft) : t.decorateTime || 150;
  const { main, foot } = b.show({ step: 'deco', title: '涂鸦 & 贴纸', sub: t.decoSub || 'DECORATE', cls: 'is-deco' });
  const timer = stepTimer(seconds, {
    warnAt: 15,
    onTick: (left) => {
      s.decoLeft = left;
      if (left === 30 || left === 10) b.say('hurry');
    },
  });
  b.timers.add(timer);
  b.timerSlot.append(timer.el);

  if (!s.deco || s.deco.base.width !== base.width) s.deco = new Decorator({ base });
  else {
    s.deco.base = base;
  }
  const deco = s.deco;
  deco.setMode('sticker');

  // --- sticker pane
  const stickerGrid = h('div.sticker-grid');
  const groups = [...new Set(t.stickers.map((x) => x.group || '贴纸'))];
  const groupBar = h('div.seg.small');
  let group = groups[0];
  const renderStickers = () => {
    stickerGrid.innerHTML = '';
    for (const def of t.stickers.filter((x) => (x.group || '贴纸') === group)) {
      const img = h('img', { alt: def.name || '' });
      artThumb(def, 110).then((u) => (img.src = u));
      const bt = h('button.sticker-btn', { type: 'button', title: def.name }, img);
      bt.addEventListener('click', () => deco.add(def));
      stickerGrid.append(bt);
    }
    [...groupBar.children].forEach((c) => c.classList.toggle('seg-on', c.textContent === group));
  };
  if (groups.length > 1) {
    for (const g of groups) {
      groupBar.append(
        h('button.btn', { type: 'button', onclick: () => {
          group = g;
          renderStickers();
        } }, g),
      );
    }
  }
  renderStickers();

  // --- text pane
  const styles = t.textStyles || [{ name: '默认', color: '#222', outline: 0.04 }];
  let style = styles[0];
  const input = h('input.text-input', { type: 'text', maxLength: 24, placeholder: '写点什么…（最多 24 字）', 'aria-label': '贴纸文字' });
  const styleBar = h('div.text-styles');
  const renderStyles = () => {
    styleBar.innerHTML = '';
    for (const st of styles) {
      const chip = h('button.text-style', { type: 'button', 'aria-pressed': String(st === style), style: { fontFamily: st.font || 'inherit', color: st.color || '#222', background: st.chip || '#fff' } }, st.name);
      chip.addEventListener('click', () => {
        style = st;
        renderStyles();
      });
      styleBar.append(chip);
    }
  };
  renderStyles();
  const addText = (text) => {
    const v = (text ?? input.value).trim();
    if (!v) return;
    deco.add(textArt(v, style));
    input.value = '';
  };
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addText();
  });
  const phrases = h('div.phrases', (t.phrases || []).map((p) => h('button.phrase', { type: 'button', onclick: () => addText(p) }, p)));

  // --- pen pane
  const pens = t.pens || [{ pen: 'solid' }];
  const colors = t.penColors || ['#222', '#fff', '#ff4fa3'];
  const penBar = h('div.pen-bar');
  const colorBar = h('div.color-bar');
  const size = h('input.pen-size', { type: 'range', min: 4, max: 40, value: deco.pen.width, 'aria-label': '笔刷粗细' });
  deco.pen = { ...deco.pen, pen: deco.pen.pen === 'eraser' ? pens[0].pen : deco.pen.pen, color: colors.includes(deco.pen.color) ? deco.pen.color : colors[0] };
  const renderPens = () => {
    penBar.innerHTML = '';
    for (const p of [...pens, { pen: 'eraser', name: '橡皮' }]) {
      const bt = h('button.pen-btn', { type: 'button', 'aria-pressed': String(deco.pen.pen === p.pen) }, h('i', { dataset: { pen: p.pen } }), p.name || PENS[p.pen]?.name);
      bt.addEventListener('click', () => {
        deco.pen.pen = p.pen;
        if (p.width) {
          deco.pen.width = p.width;
          size.value = p.width;
        }
        renderPens();
      });
      penBar.append(bt);
    }
    colorBar.innerHTML = '';
    for (const c of colors) {
      const sw = h('button.color', { type: 'button', 'aria-label': c, 'aria-pressed': String(deco.pen.color === c), style: { background: c } });
      sw.addEventListener('click', () => {
        deco.pen.color = c;
        if (deco.pen.pen === 'eraser') deco.pen.pen = pens[0].pen;
        renderPens();
      });
      colorBar.append(sw);
    }
  };
  size.addEventListener('input', () => (deco.pen.width = +size.value));
  renderPens();

  const panes = {
    sticker: h('div.pane', groups.length > 1 ? groupBar : null, stickerGrid),
    text: h('div.pane', h('div.text-row', input, btn('添加', () => addText(), 'primary small')), styleBar, h('p.pane-tip', '常用语'), phrases),
    pen: h('div.pane', penBar, colorBar, h('label.size-row', '粗细', size)),
  };
  const tabs = h('div.seg.tabs');
  const setTab = (id) => {
    for (const [k, el] of Object.entries(panes)) el.hidden = k !== id;
    [...tabs.children].forEach((c) => c.classList.toggle('seg-on', c.dataset.tab === id));
    deco.setMode(id === 'pen' ? 'pen' : 'sticker');
  };
  for (const [id, label] of [['sticker', '贴纸'], ['text', '文字'], ['pen', '画笔']]) {
    tabs.append(h('button.btn', { type: 'button', dataset: { tab: id }, onclick: () => setTab(id) }, label));
  }
  setTab('sticker');

  const undo = btn('↶ 撤销', () => deco.undo(), 'ghost small');
  const clear = btn('清空', () => deco.clear(), 'ghost small');
  main.append(h('div.deco-step', h('div.deco-tools', tabs, ...Object.values(panes)), h('div.deco-wrap', deco.el)));
  let ok;
  const clicked = new Promise((r) => (ok = r));
  foot.append(undo, clear, h('span.foot-note', '拖动/双指缩放旋转贴纸 · 选中后可删除'), btn('完成 ✓', () => ok(), 'primary big'));
  requestAnimationFrame(() => deco.layout());
  b.say('decorate');
  const r = await b.wait(Promise.race([clicked, timer.done]));
  if (r === 'timeout') {
    b.say('timeup');
    sfx.warn();
    await sleep(600);
  }
  timer.stop();
  s.final = await deco.bake();
}

// ------------------------------------------------------------------ review
export async function review(b) {
  const t = b.theme;
  const s = b.session;
  const { main, foot, timer } = b.show({ step: 'print', title: '最后确认', sub: 'PREVIEW', timer: 45 });
  const img = h('img.review-img', { src: scaledUrl(s.final, 640, 'image/png'), alt: '成片预览' });
  const copies = t.print?.copies || 1;
  const details = h(
    'dl.review-details',
    h('dt', '版式'), h('dd', s.layout.name),
    h('dt', '相框'), h('dd', s.frame.name),
    h('dt', '滤镜'), h('dd', s.filter?.name || '原图'),
    h('dt', '装饰'), h('dd', `${s.deco?.stickers.length || 0} 张贴纸 · ${s.deco?.strokes.length || 0} 笔涂鸦`),
    h('dt', '打印'), h('dd', `${t.print?.paperName || '相纸'} × ${copies}`),
  );
  main.append(h('div.review', h('div.review-left', img), h('div.review-right', h('h4', '要打印了哦！'), details, h('p.pane-tip', '打印之后就不能再修改了。'))));
  let choose;
  const clicked = new Promise((r) => (choose = r));
  const canBack = (s.decoLeft ?? 0) > 5;
  foot.append(
    canBack ? btn('← 再改改', () => choose('back'), 'ghost') : h('span.foot-note', '涂鸦时间已用完'),
    btn('打印！🖨', () => choose('print'), 'primary big'),
  );
  b.say('review');
  const r = await b.wait(Promise.race([clicked, timer.done.then(() => 'print')]));
  return r;
}

// ------------------------------------------------------------------ print
function printSheet(theme, final) {
  if (theme.print?.sheet === 'strip-pair') {
    const c = mkCanvas(final.width * 2, final.height);
    const ctx = c.getContext('2d');
    ctx.drawImage(final, 0, 0);
    ctx.drawImage(final, final.width, 0);
    return c;
  }
  return final;
}

/** Back side of the print: paper brand-free backprint with shop info. */
function backside(b, w, hh) {
  const t = b.theme;
  const c = mkCanvas(w, hh);
  const ctx = c.getContext('2d');
  ctx.fillStyle = t.print?.backColor || '#f4f1ea';
  ctx.fillRect(0, 0, w, hh);
  ctx.save();
  ctx.translate(w / 2, hh / 2);
  ctx.rotate(-Math.PI / 5);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.font = `700 ${w * 0.05}px "Bungee", sans-serif`;
  ctx.textAlign = 'center';
  for (let y = -hh; y < hh; y += w * 0.12) {
    for (let x = -w; x < w; x += w * 0.7) ctx.fillText('KACHA KACHA PHOTO', x + ((y / (w * 0.12)) % 2) * w * 0.35, y);
  }
  ctx.restore();
  ctx.fillStyle = '#5b4a42';
  ctx.textAlign = 'center';
  const u = w * 0.07;
  ctx.font = `700 ${u}px "ZCOOL KuaiLe", "Noto Sans SC", sans-serif`;
  ctx.fillText('咔嚓咔嚓大头贴铺', w / 2, hh * 0.42);
  ctx.font = `400 ${u * 0.6}px "Special Elite", monospace`;
  ctx.fillText(`${t.name}  ·  No.${String(b.session.serial).padStart(6, '0')}`, w / 2, hh * 0.42 + u * 1.2);
  ctx.fillText(stamp(b.session.date, 'slash'), w / 2, hh * 0.42 + u * 2.1);
  ctx.strokeStyle = '#5b4a42';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(w * 0.12, hh * 0.42 - u * 1.8, w * 0.76, u * 4.6);
  return c;
}

export async function printOut(b) {
  const t = b.theme;
  const s = b.session;
  const kind = t.print?.kind || 'dyesub';
  const sheet = printSheet(t, s.final);
  s.sheet = sheet;
  s.printed = true;

  // 1) on the machine screen: the printer at work
  const { main } = b.show({ step: 'print', title: kind === 'chemical' ? '冲洗中' : '打印中', sub: kind === 'chemical' ? 'DEVELOPING' : 'PRINTING', cls: 'is-printing' });
  const bar = h('i.bar');
  const label = h('p.print-label');
  const win = h('div.print-window');
  main.append(h('div.printing', win, h('div.progress', bar), label));
  b.say('print');
  const stopMotor = sfx.printer();
  try {
    if (kind === 'chemical') {
      const stepsTxt = ['曝光 EXPOSE', '显影 DEVELOP', '停显 STOP', '定影 FIX', '水洗 WASH', '烘干 DRY'];
      for (let i = 0; i < stepsTxt.length; i++) {
        label.textContent = stepsTxt[i];
        win.dataset.bath = String(i);
        bar.style.width = `${((i + 1) / stepsTxt.length) * 100}%`;
        await b.wait(sleep(650));
      }
    } else {
      const passes = dyeSubPasses(sheet, 520);
      const names = ['黄 Yellow', '品红 Magenta', '青 Cyan', '保护膜 Overcoat'];
      const paper = h('div.win-paper');
      win.append(paper);
      for (let i = 0; i < 4; i++) {
        label.textContent = `色带第 ${i + 1} 遍 · ${names[i]}`;
        const src = passes[Math.min(i, 2)];
        paper.style.backgroundImage = `url(${src.toDataURL('image/jpeg', 0.85)})`;
        paper.classList.toggle('overcoat', i === 3);
        paper.classList.remove('pass');
        void paper.offsetWidth;
        paper.classList.add('pass');
        bar.style.width = `${((i + 1) / 4) * 100}%`;
        await b.wait(sleep(900));
      }
    }
  } finally {
    stopMotor();
  }

  // 2) outside the booth: the print slides out of the slot
  const scene = printScene(b, sheet, kind);
  b.el.append(scene.el);
  await b.wait(scene.done);
  sfx.ding();
  b.say('bye');
  await b.wait(viewer(b, sheet));
}

function printScene(b, sheet, kind) {
  const t = b.theme;
  const ratio = sheet.height / sheet.width;
  const paper = h('div.out-paper', { dataset: { kind }, style: { '--ratio': ratio } }, h('img', { src: scaledUrl(sheet, 700), alt: '打印出的照片' }), h('i.wet'));
  const hint = h('p.out-hint', kind === 'chemical' ? '照片冲好了！等它慢慢显影…' : '正在出片…');
  const take = btn('取出照片 ✋', () => finish(), 'primary big');
  take.hidden = true;
  const el = h('div.print-scene', { style: { '--ratio': ratio } }, h('div.out-machine', h('div.out-label', t.name, h('small', 'PHOTO OUT · 出片口')), h('div.out-slot', h('i.mouth'), h('div.out-track', paper))), hint, take);
  let resolveFn;
  const done = new Promise((r) => (resolveFn = r));
  function finish() {
    sfx.whoosh();
    el.classList.add('leaving');
    setTimeout(() => {
      el.remove();
      resolveFn();
    }, 350);
  }
  (async () => {
    await sleep(60);
    const stop = sfx.printer();
    paper.classList.add('feeding');
    await sleep(kind === 'chemical' ? 2600 : 3200);
    stop();
    sfx.pop();
    paper.classList.add('out');
    if (kind === 'chemical') {
      paper.classList.add('developing');
      await sleep(3200);
      hint.textContent = '显影完成！小心，还有点湿～';
    } else hint.textContent = t.print?.sheet === 'strip-pair' ? '出片啦！一式两条，分给朋友一条吧～' : '出片啦！';
    take.hidden = false;
    take.focus();
    paper.addEventListener('click', finish, { once: true });
  })();
  return { el, done };
}

function viewer(b, sheet) {
  const t = b.theme;
  const s = b.session;
  return new Promise((resolve) => {
    const front = h('img.v-front', { src: scaledUrl(sheet, 900, 'image/png'), alt: '照片正面' });
    const back = h('img.v-back', { src: backside(b, 600, (600 * sheet.height) / sheet.width).toDataURL('image/jpeg', 0.9), alt: '照片背面' });
    const card = h('div.v-card', { dataset: { kind: t.print?.kind || 'dyesub', sheet: t.print?.sheet || 'single' }, style: { '--ratio': sheet.height / sheet.width } }, h('div.v-inner', front, back));
    const saved = h('span.saved-note');
    const flip = () => {
      card.classList.toggle('flipped');
      sfx.whoosh();
    };
    card.addEventListener('click', flip);
    const name = `kacha-${t.id}-${stamp(s.date).replace(/\./g, '')}-${String(s.serial).padStart(4, '0')}.png`;
    const el = h(
      'div.viewer',
      h('div.viewer-table', card),
      h(
        'div.viewer-side',
        h('h3', '你的大头贴 ✨'),
        h('p', `${t.name} · No.${String(s.serial).padStart(6, '0')} · ${stamp(s.date)}`),
        btn('⬇ 下载电子版 PNG', () => downloadCanvas(s.final, name), 'primary'),
        t.print?.sheet === 'strip-pair' ? btn('⬇ 下载整张打印纸', () => downloadCanvas(sheet, name.replace('.png', '-sheet.png')), 'ghost') : null,
        btn('↻ 翻到背面看看', flip, 'ghost'),
        btn('📌 贴到小店照片墙', async (e) => {
          const bt = e.currentTarget;
          bt.disabled = true;
          const blob = await new Promise((r) => s.final.toBlob(r, 'image/png'));
          const ok = await wall.add({ id: `${Date.now()}-${s.serial}`, theme: t.id, name: t.name, created: Date.now(), blob, w: s.final.width, h: s.final.height });
          saved.textContent = ok ? '已贴到照片墙！回小店就能看到～' : '照片墙保存失败（浏览器存储不可用）';
          sfx.sparkle();
        }, 'ghost'),
        saved,
        h('div.viewer-end', btn('再拍一次', () => close('again'), 'ghost'), btn('回到小店', () => close('shop'), 'ghost')),
      ),
    );
    function close(where) {
      el.remove();
      resolve(where);
      if (where === 'again') b.onAgain?.();
      else b.leave();
    }
    b.el.append(el);
  });
}
