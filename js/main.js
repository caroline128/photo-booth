// Entry: hash routes for home (#/), a booth session (#/booth) and a saved
// print (#/p/<id>).

import { unlockAudio } from './core/audio.js';
import { setFavicon } from './art/spark.js';
import { Shell } from './app/shell.js';
import { Home } from './app/home.js';
import { Booth } from './app/booth.js';
import { Viewer } from './app/viewer.js';
import { confirmModal } from './app/ui.js';
import { settings } from './core/store.js';

setFavicon();

let view = null;
let pending = null;
let lastHash = location.hash;
let guard = false;

const shell = new Shell(document.getElementById('app'), { onNew: () => go('#/') });

function go(hash) {
  if (location.hash === hash) route(true);
  else location.hash = hash;
}

async function route(force = false) {
  const hash = location.hash || '#/';
  if (!force && guard) return;
  if (view?.busy?.()) {
    guard = true;
    const leave = await confirmModal({
      title: '离开这次拍摄？',
      text: '照片还没打印，离开后这组照片不会保存。',
      ok: '离开',
      cancel: '继续拍',
      danger: true,
    });
    if (!leave) {
      history.replaceState(null, '', lastHash || '#/booth');
      guard = false;
      return;
    }
    guard = false;
  }
  view?.destroy?.();
  window.__booth = null;
  lastHash = hash;

  const saved = hash.match(/^#\/p\/([\w-]+)/);
  if (hash.startsWith('#/booth')) {
    const cfg = pending || { title: '', model: settings.get('model') || 'sonnet', thinking: !!settings.get('thinking') };
    pending = null;
    view = new Booth(cfg, {
      onExit: () => go('#/'),
      onAgain: (next) => {
        pending = next;
        go('#/booth');
      },
      onSaved: (id) => shell.setActive(id),
    });
    window.__booth = view; // handy for tests and the console
    shell.setCollapsed(true);
    shell.setActive(null);
    shell.mount(view.el);
    document.title = 'Claude 大头贴照相馆 · 拍摄中';
    view.run();
  } else if (saved) {
    view = new Viewer(saved[1], {
      onAgain: (next) => {
        pending = next;
        go('#/booth');
      },
      onGone: () => go('#/'),
    });
    shell.setCollapsed(innerWidth < 1100);
    shell.setActive(saved[1]);
    shell.mount(view.el);
    document.title = 'Claude 大头贴照相馆';
  } else {
    view = new Home({
      onStart: (cfg) => {
        pending = cfg;
        go('#/booth');
      },
    });
    shell.setCollapsed(innerWidth < 1100);
    shell.setActive(null);
    shell.mount(view.el);
    view.focus?.();
    document.title = 'Claude 大头贴照相馆';
  }
}

window.addEventListener('hashchange', () => route());
const unlock = () => unlockAudio();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
route();
