// The shoot: per-shot countdown with pose prompts, flash + shutter, film
// roll of captured frames. Then the contact sheet where the guest picks the
// photos for the layout and may use the single retake.

import { h, sleep, countdown, canvas as mkCanvas } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { btn } from '../ui.js';
import { compose } from '../../engine/compose.js';
import { offlineFx, renderToCanvas } from '../../engine/glfx.js';
import { infoFor } from './setup.js';

function captureWidth(layout) {
  const s = layout.slots[0];
  return Math.round(Math.max(760, Math.min(1500, s.w * 1.7)));
}

/** Thumbnail of a shot with the machine's live look (for film roll/contact sheet). */
export function shotThumb(b, shot, width = 320) {
  const fx = b.theme.liveFx?.(b.session, shot.faces, shot.w, shot.h) || {};
  const out = renderToCanvas(offlineFx(), shot.raw, { ...fx, ...(b.theme.previewFx || {}) }, shot.w, shot.h);
  const c = mkCanvas(width, (width * shot.h) / shot.w);
  c.getContext('2d').drawImage(out, 0, 0, c.width, c.height);
  return c;
}

function shootUI(b, { total }) {
  const count = h('div.count', { 'aria-live': 'assertive' });
  const pose = h('div.pose', { hidden: true });
  const shotNo = h('div.shot-no');
  const freeze = h('img.freeze', { alt: '' });
  const live = h('div.live.shooting', { style: { '--ar': b.stage.aspect } }, b.stage.view, count, pose, shotNo, freeze);
  const roll = h('div.roll', Array.from({ length: total }, (_, i) => h('div.roll-cell', h('span', String(i + 1)))));
  return {
    live,
    roll,
    setCount(n) {
      count.textContent = n > 0 ? String(n) : '';
      count.classList.remove('pop');
      void count.offsetWidth;
      if (n > 0) count.classList.add('pop');
    },
    setPose(p) {
      if (!p) {
        pose.hidden = true;
        return;
      }
      pose.hidden = false;
      pose.innerHTML = '';
      pose.append(p.icon ? h('span.pose-icon', p.icon) : null, h('b', p.text), p.sub ? h('small', p.sub) : null);
    },
    setShotNo(i) {
      shotNo.textContent = `${i + 1} / ${total}`;
    },
    async showFreeze(canvas) {
      freeze.src = canvas.toDataURL('image/jpeg', 0.8);
      freeze.classList.add('on');
      await sleep(650);
      freeze.classList.remove('on');
    },
    fillRoll(i, canvas) {
      const cell = roll.children[i];
      if (!cell) return;
      cell.innerHTML = '';
      cell.append(h('img', { src: canvas.toDataURL('image/jpeg', 0.8), alt: `第 ${i + 1} 张` }), h('span', String(i + 1)));
      cell.classList.add('filled');
    },
  };
}

async function takeOne(b, ui, seconds, pose, onSkip) {
  ui.setPose(pose);
  if (pose) b.say(pose.line || { text: pose.text });
  const cd = countdown(seconds, (left) => {
    ui.setCount(left);
    if (left > 0 && left <= 3) sfx.beep(left === 1);
    if (left === 2) sfx.charge();
    if (left === 1) b.say('cheese');
    b.setLed(left <= 3 ? 'blink' : 'on');
  });
  onSkip(() => cd.skip());
  await b.wait(cd);
  ui.setCount(0);
  b.setLed('');
  b.flash();
  sfx.shutter();
  const shot = b.stage.capture(captureWidth(b.session.layout));
  const thumb = shotThumb(b, shot, 360);
  await ui.showFreeze(thumb);
  return { shot, thumb };
}

export async function shoot(b) {
  const t = b.theme;
  const s = b.session;
  const total = t.shoot.shots;
  const { main, foot } = b.show({ step: 'shoot', title: '拍摄中', sub: 'SHOOTING', cls: 'is-shoot' });
  const ui = shootUI(b, { total });
  main.append(h('div.shoot', h('div.live-box', ui.live), ui.roll));
  let skipFn = null;
  const skip = btn(t.shoot.skipLabel || '⚡ 立即拍（跳过倒数）', () => skipFn?.(), 'ghost');
  foot.append(h('span.foot-note', `每张倒数 ${t.shoot.countdown} 秒，看着上方镜头～`), skip);
  b.say('ready');
  await b.wait(sleep(1400));
  const poses = t.shoot.poses || [];
  s.shots = [];
  for (let i = 0; i < total; i++) {
    ui.setShotNo(i);
    const secs = i === 0 ? t.shoot.firstCountdown || t.shoot.countdown : t.shoot.countdown;
    const { shot, thumb } = await takeOne(b, ui, secs, poses[i % Math.max(1, poses.length)], (fn) => (skipFn = fn));
    s.shots.push(shot);
    ui.fillRoll(i, thumb);
  }
  ui.setPose(null);
  b.say('done');
  await b.wait(sleep(900));
}

export async function pickAndRetake(b) {
  const t = b.theme;
  const s = b.session;
  const need = s.layout.photos;
  const total = s.shots.length;
  const freePick = total > need;
  let sel = freePick ? [] : Array.from({ length: need }, (_, i) => i);
  const { main, foot, timer } = b.show({ step: 'pick', title: freePick ? `选出 ${need} 张` : '确认照片', sub: freePick ? 'PICK YOUR BEST' : 'CHECK', timer: t.pickTime || 75 });
  const thumbs = s.shots.map((shot) => shotThumb(b, shot, 360));
  const grid = h('div.pick-grid', { style: { '--cols': total > 4 ? 3 : 2 } });
  const preview = h('img.pick-preview', { alt: '排版预览' });
  const status = h('p.pick-status');
  const retakeInfo = h('p.retake-info');
  const okBtn = btn('确定 ✓', () => ok(), 'primary big');
  let ok;
  const clicked = new Promise((r) => (ok = r));

  const renderPreview = () => {
    const photos = sel.map((i) => thumbs[i]);
    const full = compose(s.layout, s.frame, photos, infoFor(b));
    const w = 300;
    const c = mkCanvas(w, (w * full.height) / full.width);
    c.getContext('2d').drawImage(full, 0, 0, c.width, c.height);
    preview.src = c.toDataURL('image/jpeg', 0.85);
  };

  const render = () => {
    grid.innerHTML = '';
    s.shots.forEach((_, i) => {
      const order = sel.indexOf(i);
      const card = h(
        'div.pick-card',
        { dataset: { on: String(order >= 0) } },
        h('img', { src: thumbs[i].toDataURL('image/jpeg', 0.85), alt: `第 ${i + 1} 张` }),
        order >= 0 ? h('b.badge', String(order + 1)) : h('b.badge.off', String(i + 1)),
      );
      if (freePick) {
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        const toggle = () => {
          if (order >= 0) sel.splice(order, 1);
          else if (sel.length < need) sel.push(i);
          else {
            sfx.denied();
            return;
          }
          sfx.select();
          render();
        };
        card.addEventListener('click', (e) => {
          if (!e.target.closest('button')) toggle();
        });
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') toggle();
        });
      }
      if (s.retakesLeft > 0) {
        const rb = h('button.retake-btn', { type: 'button', title: '重拍这张' }, '↻ 重拍');
        rb.addEventListener('click', (e) => {
          e.stopPropagation();
          retake(i).catch(() => {}); // rejects only when the guest leaves the machine
        });
        card.append(rb);
      }
      grid.append(card);
    });
    status.textContent = freePick ? `已选 ${sel.length} / ${need}（按点选顺序排版）` : `${need} 张会按拍摄顺序排进相框`;
    retakeInfo.textContent = s.retakesLeft > 0 ? `重拍机会：${s.retakesLeft} 次（点照片上的 ↻）` : '重拍机会已用完';
    retakeInfo.classList.toggle('used', s.retakesLeft <= 0);
    okBtn.disabled = sel.length < need;
    renderPreview();
  };

  async function retake(i) {
    if (s.retakesLeft <= 0) return;
    s.retakesLeft--;
    timer?.pause(true);
    sfx.select();
    const ov = h('div.retake-overlay');
    const ui = shootUI(b, { total: 1 });
    ov.append(h('p.retake-title', `重拍第 ${i + 1} 张`), h('div.live-box', ui.live));
    b.screenEl.append(ov);
    b.say('retake');
    ui.setShotNo(0);
    let skipFn = null;
    const skip = btn('⚡ 立即拍', () => skipFn?.(), 'ghost');
    ov.append(skip);
    const pose = { text: '再来一张！', icon: '📸', sub: 'ONE MORE' };
    const { shot, thumb } = await takeOne(b, ui, t.shoot.countdown, pose, (fn) => (skipFn = fn));
    s.shots[i] = shot;
    thumbs[i] = shotThumb(b, shot, 360);
    void thumb;
    ov.remove();
    timer?.pause(false);
    render();
  }

  main.append(h('div.pick', grid, h('div.pick-side', preview, status, retakeInfo)));
  foot.append(okBtn);
  render();
  b.say(freePick ? 'pick' : 'check');
  await b.wait(Promise.race([clicked, timer.done]));
  // time's up: fill the remaining slots in shooting order
  for (let i = 0; sel.length < need && i < total; i++) if (!sel.includes(i)) sel.push(i);
  s.selected = sel.slice(0, need);
  sfx.select();
}
