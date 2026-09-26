// Step 4 · 选片: choose which shots go into the frame (in click order),
// with one retake for the whole session.

import { h } from '../../core/dom.js';
import { deferred, FAST } from '../../core/util.js';
import { sfx } from '../../core/audio.js';
import { lines } from '../../data/copy.js';
import { icon } from '../../art/icons.js';
import { section, actions, button } from '../dock.js';
import { SheetView } from '../sheet.js';
import { mountLive, shootOne, randomPose } from './shoot.js';

function thumbCanvas(src) {
  const c = h('canvas');
  c.width = 220;
  c.height = Math.round(220 * (src.height / src.width));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export async function stepPick(S, live) {
  const { chat, stage, dock, model } = S;
  live.stop();
  const keep = model.keep;
  S.picks = S.shots.map((_, i) => i).slice(0, keep);

  const view = new SheetView(S, async () => S.picks.map((i) => S.shots[i]));
  const showSheet = async () => {
    stage.head({ icon: 'image', title: '选片', sub: `${S.frame.name} · ${S.L.name}` });
    stage.show(view.el, 'center');
    await view.render();
  };
  await showSheet();
  await chat.claude(lines.shotsDone(model));

  const grid = h('div.pick-grid', { role: 'group', 'aria-label': '照片' });
  const hint = h('span.dock-hint');
  const next = button('下一步', { primary: true, icon: 'right' });
  let done = deferred(S.signal);
  next.addEventListener('click', () => done.resolve('next'));

  const paint = () => {
    grid.replaceChildren(
      ...S.shots.map((shot, i) => {
        const order = S.picks.indexOf(i);
        const b = h(
          'div.pick',
          { role: 'checkbox', tabindex: 0, 'aria-checked': String(order >= 0), 'aria-label': `第 ${i + 1} 张` },
          thumbCanvas(shot),
          order >= 0 ? h('span.pick-badge', String(order + 1)) : null,
        );
        const toggle = () => {
          const k = S.picks.indexOf(i);
          if (k >= 0) S.picks.splice(k, 1);
          else if (S.picks.length < keep) S.picks.push(i);
          else {
            hint.textContent = `最多选 ${keep} 张，先取消一张`;
            hint.classList.add('warn');
            sfx.error();
            return;
          }
          sfx.tick();
          paint();
          view.render();
        };
        b.addEventListener('click', toggle);
        b.addEventListener('keydown', (e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), toggle()));
        if (!S.retakeUsed) {
          const r = h('button.pick-retake', { type: 'button', title: '重拍这张（整次拍摄只有 1 次机会）' }, icon('refresh', { size: 14 }), '重拍');
          r.addEventListener('click', (e) => {
            e.stopPropagation();
            done.resolve(`retake:${i}`);
          });
          b.append(r);
        }
        return b;
      }),
    );
    hint.classList.remove('warn');
    hint.textContent = `已选 ${S.picks.length} / ${keep}` + (S.retakeUsed ? ' · 重拍机会已用完' : ' · 还有 1 次重拍机会');
    next.disabled = S.picks.length !== keep;
  };

  const mountDock = () => dock.set([section(keep < S.shots.length ? `挑 ${keep} 张，按点选顺序放进相框` : '按点选顺序放进相框', grid), actions(hint, next)], 'wide');

  paint();
  mountDock();
  for (;;) {
    const r = await done.promise;
    if (r === 'next') break;
    // one retake
    const j = Number(r.split(':')[1]);
    S.retakeUsed = true;
    chat.user(`重拍第 ${j + 1} 张`);
    await chat.claude(lines.retake);
    const lv = mountLive(S);
    const skip = deferred(S.signal);
    const cancel = button('现在就拍', { icon: 'zap' });
    cancel.addEventListener('click', () => skip.resolve('skip'));
    dock.set([actions(h('span.dock-hint', `重拍第 ${j + 1} 张`), cancel)]);
    S.shots[j] = await shootOne(S, lv, { index: j, total: S.shots.length, pose: randomPose(), secs: FAST ? 1 : 3, skip });
    lv.stop();
    done = deferred(S.signal);
    paint();
    mountDock();
    await showSheet();
  }
  view.destroy();
  chat.user(`选好了：第 ${S.picks.map((i) => i + 1).join('、')} 张`);
}
