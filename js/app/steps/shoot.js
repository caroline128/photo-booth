// Step 3 · 拍摄: live viewfinder, then N countdown shots with pose hints.
// With extended thinking on, the countdown is longer and Claude "thinks".

import { h } from '../../core/dom.js';
import { sleep, deferred, FAST, shuffle, pick } from '../../core/util.js';
import { sfx, voice } from '../../core/audio.js';
import { lines, POSES, THOUGHTS } from '../../data/copy.js';
import { THINKING_EXTRA } from '../../data/models.js';
import { BEAUTY } from '../../photo/fx.js';
import { capture } from '../../photo/camera.js';
import { LiveView } from '../live.js';
import { PROPS, propById, propFonts, drawProp } from '../props.js';
import { section, actions, button, segmented, clicked } from '../dock.js';

export function posePlan(n) {
  const rest = shuffle(POSES.filter((p) => p.id !== 'wave'));
  return [POSES[0], ...rest].slice(0, n);
}

function thumb(src, i) {
  const c = h('canvas');
  c.width = 120;
  c.height = Math.round(120 * (src.height / src.width));
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// Countdown that can be cut short by `skip`; ticks call onTick(n).
async function countdown(secs, S, onTick, skip) {
  for (let n = secs; n >= 1; n--) {
    onTick(n);
    const r = await Promise.race([sleep(FAST ? 180 : 1000, S.signal).then(() => 'tick'), skip.promise]);
    if (r === 'skip') return;
  }
}

export function mountLive(S) {
  const live = new LiveView(S);
  S.stage.head({ icon: 'camera', title: '取景器', sub: `${S.source.label} · ${S.L.name}` });
  S.stage.show(live.el, 'center');
  return live;
}

// Ready screen: beauty level + start.
export async function stepReady(S, live) {
  const { chat, dock, model } = S;
  const secs = model.countdown + (S.cfg.thinking ? THINKING_EXTRA : 0);
  await chat.claude(lines.ready(model, secs));
  const beauty = segmented(
    BEAUTY.map((b) => ({ id: b.id, label: b.name })),
    S.beauty,
    (id) => (S.beauty = id),
    { label: '美颜' },
  );
  const props = h('div.prop-row', { role: 'radiogroup', 'aria-label': '拍摄道具' });
  const paintProps = () =>
    props.replaceChildren(
      ...PROPS.map((p) => {
        const b = h('button.chip.sm', { type: 'button', role: 'radio', 'aria-checked': String((S.prop || 'none') === p.id) }, p.name);
        b.addEventListener('click', async () => {
          await propFonts(p);
          S.prop = p.id;
          sfx.tick();
          paintProps();
        });
        return b;
      }),
    );
  paintProps();
  const go = button('开始拍摄', { primary: true, icon: 'camera' });
  dock.set([section('美颜', beauty), section('拍摄道具', props), actions(h('span.dock-hint', S.cfg.thinking ? '扩展思考已开：倒数更长' : `每张倒数 ${secs} 秒`), go)]);
  live.pose('准备好就点「开始拍摄」');
  await clicked(go, S.signal);
  chat.user('开始拍摄');
}

// Take one shot (used by the main loop and by retakes).
export async function shootOne(S, live, { index, total, pose, secs, skip }) {
  S.source.setPose?.(pose.id);
  live.pose(pose.text, `${index + 1} / ${total}`);
  let think = null;
  let thinking = Promise.resolve();
  if (S.cfg.thinking) {
    think = S.chat.thinking(S.cfg.ultra ? 'ultrathink 中…' : '思考中…');
    const picks = shuffle(THOUGHTS).slice(0, S.cfg.ultra ? 3 : 2);
    thinking = (async () => {
      for (const t of picks) {
        await think.add(t);
        await sleep(FAST ? 50 : 700, S.signal).catch(() => {});
      }
    })();
  }
  voice.speak(pose.text);
  await countdown(secs, S, (n) => {
    live.count(n);
    sfx.count(n);
  }, skip);
  live.count(null);
  live.flash();
  sfx.shutter();
  navigator.vibrate?.(24);
  const shot = capture(S.source, S.L.aspect);
  if (S.prop && S.prop !== 'none') drawProp(shot.getContext('2d'), propById(S.prop), shot.width, shot.height);
  await thinking;
  think?.done(`思考了 ${secs} 秒`);
  return shot;
}

export async function stepShoot(S, live) {
  const { chat, dock, model } = S;
  const n = model.shots;
  S.poses = posePlan(n);
  const cells = Array.from({ length: n }, (_, i) => h('div.film-cell', h('span', String(i + 1))));
  const skipBtn = button('现在就拍', { icon: 'zap', title: '空格键' });
  let skip = deferred(S.signal);
  skipBtn.addEventListener('click', () => skip.resolve('skip'));
  const onKey = (e) => {
    if (e.code === 'Space' && !e.repeat && !/INPUT|TEXTAREA|BUTTON/.test(document.activeElement?.tagName)) {
      e.preventDefault();
      skip.resolve('skip');
    }
  };
  window.addEventListener('keydown', onKey);
  S.signal.addEventListener('abort', () => window.removeEventListener('keydown', onKey), { once: true });
  dock.set([section(`拍摄中 · 共 ${n} 张`, h('div.filmstrip', cells)), actions(h('span.dock-hint', '不想等倒数？按「现在就拍」或空格键'), skipBtn)]);
  await chat.claude(lines.shooting);
  const status = S.cfg.thinking ? null : chat.status('准备…');

  for (let i = 0; i < n; i++) {
    const pose = S.poses[i];
    status?.set(`第 ${i + 1} / ${n} 张 · ${pose.text}`);
    const first = i === 0;
    const secs = (first ? model.first : model.countdown) + (S.cfg.thinking ? THINKING_EXTRA : 0);
    const shot = await shootOne(S, live, { index: i, total: n, pose, secs, skip });
    skip = deferred(S.signal);
    S.shots[i] = shot;
    const t = thumb(shot, i);
    cells[i].replaceChildren(t);
    cells[i].classList.add('filled');
    t.animate?.([{ transform: 'scale(1.4)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
    await sleep(FAST ? 60 : 650, S.signal);
  }
  window.removeEventListener('keydown', onKey);
  live.pose(null);
  status?.done(`拍好了 ${n} 张`);
  sfx.done();
}

export const randomPose = () => pick(POSES);
