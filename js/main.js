// App entry: hash routing between the shop lobby (#/) and a machine (#/m/<id>).

import { h } from './core/util.js';
import { unlockAudio } from './core/audio.js';
import { THEMES, themeById } from './themes/index.js';
import { Shop } from './shop/shop.js';
import { Booth } from './booth/booth.js';

const app = document.getElementById('app');
let current = null;

function unmount() {
  if (!current) return;
  if (current instanceof Booth) current.abort();
  else current.destroy?.();
  current = null;
}

async function curtain(run) {
  const el = h('div.curtain-transition', h('i.l'), h('i.r'));
  document.body.append(el);
  await new Promise((r) => setTimeout(r, 420));
  run();
  el.classList.add('open');
  setTimeout(() => el.remove(), 700);
}

function openShop() {
  unmount();
  const shop = new Shop({ themes: THEMES, onEnter: (id) => (location.hash = `#/m/${id}`) });
  current = shop;
  app.replaceChildren(shop.el);
  document.title = '咔嚓咔嚓大头贴铺';
  window.scrollTo(0, 0);
}

function openBooth(theme) {
  unmount();
  const booth = new Booth(theme, { onExit: () => (location.hash = '#/') });
  booth.onAgain = () => {
    booth.abort();
    openBooth(theme);
  };
  current = booth;
  app.replaceChildren(booth.el);
  document.title = `${theme.name} · 咔嚓咔嚓大头贴铺`;
  window.scrollTo(0, 0);
  booth.run();
}

function route() {
  const m = location.hash.match(/^#\/m\/([\w-]+)/);
  const theme = m && themeById(m[1]);
  if (theme) curtain(() => openBooth(theme));
  else if (!(current instanceof Shop)) (current ? curtain(openShop) : openShop());
}

window.addEventListener('hashchange', route);
const unlock = () => unlockAudio();
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('keydown', unlock, { once: true });
route();
