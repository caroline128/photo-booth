// Before the shoot: choose layout + frame, machine-specific options
// (lens strength, retouch level...), then the prop shelf / backdrop with a
// live camera preview.

import { h, sleep } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { btn, modal, CAMERA_HELP } from '../ui.js';
import { compose, slotAspect } from '../../engine/compose.js';
import { openCamera, createDemoSource } from '../../engine/camera.js';
import { Stage } from '../../engine/stage.js';
import { artThumb } from '../../art/render.js';
import { defaultOptions } from '../sample.js';

const frameCache = new Map();

function framePreview(theme, layout, frame, info, width = 420) {
  const key = `${theme.id}/${layout.id}/${frame.id}/${width}`;
  if (!frameCache.has(key)) {
    const full = compose(layout, frame, [], { ...info, placeholderTint: theme.placeholderTint });
    const s = width / full.width;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round(full.height * s);
    c.getContext('2d').drawImage(full, 0, 0, c.width, c.height);
    frameCache.set(key, c.toDataURL('image/png'));
  }
  return frameCache.get(key);
}

export function infoFor(b) {
  const s = b.session;
  return { theme: b.theme, date: s.date, serial: s.serial, options: s.options, captions: s.captions };
}

export async function chooseFrame(b) {
  const t = b.theme;
  const s = b.session;
  s.options = defaultOptions(t);
  const { main, foot, timer } = b.show({ step: 'frame', title: '选择相框', sub: 'CHOOSE YOUR FRAME', timer: t.selectTime || 60 });
  let layout = t.layouts[0];
  let frame = t.frames.find((f) => fits(f, layout)) || t.frames[0];
  const preview = h('img.frame-preview', { alt: '相框预览' });
  const layoutBar = h('div.seg');
  const grid = h('div.frame-grid');
  const desc = h('p.frame-desc');

  function fits(f, l) {
    return !f.layouts || f.layouts.includes(l.id);
  }
  function renderPreview() {
    preview.src = framePreview(t, layout, frame, infoFor(b), 480);
    desc.textContent = [layout.name, frame.name, layout.desc].filter(Boolean).join(' · ');
  }
  function renderLayouts() {
    layoutBar.innerHTML = '';
    if (t.layouts.length < 2) return;
    for (const l of t.layouts) {
      const bt = btn(l.name, () => {
        layout = l;
        if (!fits(frame, layout)) frame = t.frames.find((f) => fits(f, layout));
        sfx.select();
        renderLayouts();
        renderFrames();
        renderPreview();
      }, l === layout ? 'seg-on' : '');
      bt.setAttribute('aria-pressed', String(l === layout));
      layoutBar.append(bt);
    }
  }
  function renderFrames() {
    grid.innerHTML = '';
    for (const f of t.frames.filter((x) => fits(x, layout))) {
      const card = h(
        'button.frame-card',
        { type: 'button', 'aria-pressed': String(f === frame), title: f.name },
        h('img', { src: framePreview(t, layout, f, infoFor(b), 160), alt: '' }),
        h('span', f.name),
      );
      card.addEventListener('click', () => {
        frame = f;
        sfx.select();
        renderFrames();
        renderPreview();
      });
      grid.append(card);
    }
  }
  renderLayouts();
  renderFrames();
  renderPreview();
  main.append(
    h('div.frame-step', h('div.frame-left', preview, desc), h('div.frame-right', t.layouts.length > 1 ? h('h4', '版式') : null, layoutBar, h('h4', '相框'), grid)),
  );
  let ok;
  const clicked = new Promise((r) => (ok = r));
  foot.append(btn('就选这个 ✓', () => ok(), 'primary big'));
  b.say('choose');
  await b.wait(Promise.race([clicked, timer.done]));
  s.layout = layout;
  s.frame = frame;
  sfx.select();
}

export async function chooseOptions(b) {
  const t = b.theme;
  for (const opt of t.options || []) {
    const { main, foot, timer } = b.show({ step: 'frame', title: opt.title, sub: opt.sub, timer: opt.time || 40 });
    let cur = b.session.options[opt.id];
    const list = h('div.option-grid');
    const render = () => {
      list.innerHTML = '';
      for (const c of opt.choices) {
        const card = h(
          'button.option-card',
          { type: 'button', 'aria-pressed': String(c.id === cur) },
          c.icon ? h('span.option-icon', c.icon) : null,
          h('b', c.name),
          c.desc ? h('small', c.desc) : null,
        );
        card.addEventListener('click', () => {
          cur = c.id;
          sfx.select();
          render();
        });
        list.append(card);
      }
    };
    render();
    main.append(h('div.option-step', opt.lead ? h('p.lead', opt.lead) : null, list));
    let ok;
    const clicked = new Promise((r) => (ok = r));
    foot.append(btn('确定 ✓', () => ok(), 'primary big'));
    if (opt.line) b.say(opt.line);
    await b.wait(Promise.race([clicked, timer.done]));
    b.session.options[opt.id] = cur;
  }
}

/** Start the webcam (or offer the demo cat) and build the live stage. */
async function startSource(b) {
  for (;;) {
    try {
      return await openCamera();
    } catch (e) {
      const r = await b.wait(
        modal(b.el, {
          title: '摄像头没有打开',
          body: CAMERA_HELP[e.kind] || CAMERA_HELP.unknown,
          actions: [
            { id: 'demo', label: '让店猫当模特（演示模式）', primary: true },
            { id: 'retry', label: '重试' },
          ],
        }),
      );
      if (r === 'demo') return createDemoSource();
    }
  }
}

/** Look for the live view: the machine's lens/retouch + its preview grade. */
export function liveFxFor(b) {
  const t = b.theme;
  return (faces, w, hgt) => ({ ...(t.liveFx?.(b.session, faces, w, hgt) || {}), ...(t.previewFx || {}) });
}

export async function prep(b) {
  const t = b.theme;
  const s = b.session;
  const { main, foot } = b.show({ step: 'prep', title: t.backgrounds ? '道具 & 背景' : '挑选道具', sub: 'PROPS', cls: 'is-prep' });
  const loading = h('div.cam-loading', h('i.spinner'), '正在打开摄像头…');
  main.append(loading);
  b.say('camera');
  const source = await b.wait(startSource(b));
  b.source = source;
  const stage = new Stage({ source, aspect: slotAspect(s.layout), fx: liveFxFor(b) });
  b.stage = stage;
  loading.remove();

  // timer starts once the camera is up
  const { timer } = b.show({ step: 'prep', title: t.backgrounds ? '道具 & 背景' : '挑选道具', sub: 'PROPS', timer: t.prepTime || 90, cls: 'is-prep' });
  const main2 = b.screenEl.querySelector('.screen-main');
  const foot2 = b.screenEl.querySelector('.screen-foot');
  void main;
  void foot;

  const chip = h('div.ar-chip');
  const setChip = (state) => {
    chip.dataset.state = state;
    chip.textContent =
      {
        demo: '🐱 演示模式：店猫模特',
        loading: '⏳ AR 道具跟随加载中…（可先拖动道具）',
        ready: '✨ AR 跟随已开启：道具会跟着脸走',
        noface: '👀 没找到脸，靠近镜头一点～（道具会戴在脸上）',
        failed: '✋ 拖动画面移动道具 · 滚轮缩放',
        idle: '',
      }[state] || '';
  };
  stage.onStatus = (st) => setChip(st);
  setChip(stage.trackingState);
  const live = h('div.live', { style: { '--ar': slotAspect(s.layout) } }, stage.view, h('div.live-guide'), chip);
  stage.bindManualControls(live);
  stage.start();
  // tell the guest when tracking is on but no face is in view (props hide then)
  const faceWatch = setInterval(() => {
    if (!live.isConnected) return clearInterval(faceWatch);
    if (stage.trackingState === 'ready') setChip(stage.faces.length ? 'ready' : 'noface');
  }, 500);
  b.cleanups.push(() => clearInterval(faceWatch));

  const maxProps = t.maxProps ?? 3;
  const chosen = new Set(s.props.map((p) => p.id));
  const propGrid = h('div.prop-grid');
  const count = h('span.prop-count');
  const renderProps = () => {
    propGrid.innerHTML = '';
    for (const p of t.props) {
      const img = h('img', { alt: '' });
      artThumb(p, 120).then((u) => (img.src = u));
      const on = chosen.has(p.id);
      const card = h('button.prop-card', { type: 'button', 'aria-pressed': String(on), title: p.name }, img, h('span', p.name));
      card.addEventListener('click', async () => {
        if (chosen.has(p.id)) chosen.delete(p.id);
        else {
          if (chosen.size >= maxProps) {
            // swap out the oldest one, like putting a prop back on the shelf
            chosen.delete(chosen.values().next().value);
          }
          chosen.add(p.id);
        }
        sfx.pop();
        renderProps();
        await stage.setProps(t.props.filter((x) => chosen.has(x.id)));
      });
      propGrid.append(card);
    }
    count.textContent = `${chosen.size}/${maxProps}`;
  };
  renderProps();

  const side = h('div.prep-side');
  const tabs = h('div.seg');
  const panes = {};
  panes.props = h('div.pane', h('p.pane-tip', `从道具架上挑最多 ${maxProps} 件戴上 `, count), propGrid);
  if (t.backgrounds?.length) {
    const bgGrid = h('div.bg-grid');
    const renderBgs = () => {
      bgGrid.innerHTML = '';
      const list = [{ id: 'none', name: '原背景', swatch: 'repeating-linear-gradient(45deg,#ddd 0 6px,#fff 6px 12px)' }, ...t.backgrounds];
      for (const bg of list) {
        const on = (s.background?.id || 'none') === bg.id;
        const card = h('button.bg-card', { type: 'button', 'aria-pressed': String(on), title: bg.name }, h('i', { style: { background: bg.swatch } }), h('span', bg.name));
        card.addEventListener('click', async () => {
          s.background = bg.id === 'none' ? null : bg;
          sfx.select();
          renderBgs();
          await stage.setBackground(s.background);
        });
        bgGrid.append(card);
      }
    };
    renderBgs();
    panes.bg = h('div.pane', h('p.pane-tip', '像大头贴机的绿幕一样换背景（需要加载人像分割模型）'), bgGrid);
  }
  const showPane = (id) => {
    for (const [k, el] of Object.entries(panes)) el.hidden = k !== id;
    [...tabs.children].forEach((c) => c.classList.toggle('seg-on', c.dataset.pane === id));
  };
  if (panes.bg) {
    tabs.append(
      h('button.btn.seg-on', { type: 'button', dataset: { pane: 'props' }, onclick: () => showPane('props') }, '道具'),
      h('button.btn', { type: 'button', dataset: { pane: 'bg' }, onclick: () => showPane('bg') }, '背景'),
    );
  }
  side.append(tabs, ...Object.values(panes));
  showPane('props');
  main2.append(h('div.prep', h('div.live-box', live), side));

  let ok;
  const clicked = new Promise((r) => (ok = r));
  const shotsInfo = `共 ${t.shoot.shots} 张 · 每张倒数 ${t.shoot.countdown} 秒 · ${t.shoot.retakes ?? 1} 次重拍机会`;
  foot2.append(h('span.foot-note', shotsInfo), btn('准备好了，开拍！ ▶', () => ok(), 'primary big'));
  b.say('props');
  await b.wait(Promise.race([clicked, timer.done]));
  s.props = t.props.filter((x) => chosen.has(x.id));
  await sleep(100);
}
