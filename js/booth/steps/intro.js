// Attract screen ("TOUCH TO START") and the coin slot.

import { h, sleep } from '../../core/util.js';
import { store } from '../../core/store.js';
import { sfx } from '../../core/audio.js';
import { btn } from '../ui.js';
import { samplePrint } from '../sample.js';

export async function attract(b) {
  const t = b.theme;
  const { main } = b.show({ step: null, cls: 'is-attract' });
  const sample = h('img.attract-sample', { alt: `${t.name} 样张` });
  samplePrint(t).then((url) => (sample.src = url));
  const press = h('button.press', { type: 'button' }, h('span', 'TOUCH TO START'), h('small', '点击屏幕开始'));
  main.append(
    h(
      'div.attract',
      h('div.attract-sample-wrap', sample),
      h(
        'div.attract-copy',
        h('p.kicker', t.kicker || 'PHOTO BOOTH'),
        h('h2.attract-title', t.name),
        h('p.attract-tag', t.tagline),
        h('ul.features', (t.features || []).map((f) => h('li', f))),
        h('p.attract-price', `🪙 ${t.price} 枚代币 / 次`),
        press,
      ),
    ),
  );
  b.say('attract');
  await b.wait(
    new Promise((resolve) => {
      main.addEventListener('click', () => {
        sfx.select();
        resolve();
      }, { once: true });
    }),
  );
}

export async function coin(b) {
  const t = b.theme;
  const price = t.price;
  let inserted = 0;
  const { main } = b.show({ step: null, title: '请投币', sub: 'INSERT COIN', cls: 'is-coin' });
  const counter = h('div.coin-counter', h('b', '0'), ` / ${price}`);
  const slot = h('div.coin-slot-big', { role: 'button', tabindex: 0, 'aria-label': '投一枚代币' }, h('i.slot'), h('span', 'INSERT COIN'));
  const wallet = h('div.wallet');
  const walletLabel = h('p.wallet-label');
  const help = h('p.coin-help', '点击代币（或投币口）把代币投进去');
  const refill = btn('去前台免费领 10 枚代币', () => {
    store.earn(10);
    sfx.coin();
    renderWallet();
  }, 'ghost small');
  refill.hidden = true;
  main.append(h('div.coin-step', h('div.coin-machine', slot, counter), h('div.coin-side', walletLabel, wallet, help, refill)));
  b.say('insert');

  let resolveFn;
  const done = new Promise((r) => (resolveFn = r));

  function renderWallet() {
    const n = store.get('tokens');
    walletLabel.textContent = `你的代币：${n} 枚`;
    wallet.innerHTML = '';
    for (let i = 0; i < Math.min(n, 12); i++) {
      const c = h('button.token', { type: 'button', 'aria-label': '投币', style: { '--i': i } }, h('span', 'K'));
      c.addEventListener('click', () => insert(c));
      wallet.append(c);
    }
    const need = price - inserted;
    refill.hidden = n >= need;
    help.textContent = n >= need ? '点击代币（或投币口）把代币投进去' : '代币不够啦～ 前台可以免费兑换';
  }

  async function insert(fromEl) {
    if (inserted >= price) return;
    if (!store.spend(1)) {
      sfx.denied();
      refill.hidden = false;
      refill.classList.add('shake');
      setTimeout(() => refill.classList.remove('shake'), 500);
      return;
    }
    // fly the coin into the slot
    const src = (fromEl || wallet.lastElementChild || slot).getBoundingClientRect();
    const dst = slot.getBoundingClientRect();
    const fly = h('i.flying-coin', { style: { left: src.left + src.width / 2 + 'px', top: src.top + src.height / 2 + 'px' } });
    document.body.append(fly);
    requestAnimationFrame(() => {
      fly.style.transform = `translate(${dst.left + dst.width / 2 - (src.left + src.width / 2)}px, ${dst.top + dst.height * 0.35 - (src.top + src.height / 2)}px) scale(0.5) rotateY(80deg)`;
      fly.style.opacity = '0.2';
    });
    setTimeout(() => fly.remove(), 450);
    sfx.coin();
    inserted++;
    b.session.paid = true;
    counter.firstChild.textContent = String(inserted);
    slot.classList.remove('gulp');
    void slot.offsetWidth;
    slot.classList.add('gulp');
    renderWallet();
    if (inserted >= price) {
      await sleep(550);
      sfx.fanfare();
      b.say('paid');
      b.session.serial = store.nextSerial();
      counter.classList.add('ok');
      await sleep(900);
      resolveFn();
    }
  }

  slot.addEventListener('click', () => insert(null));
  slot.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') insert(null);
  });
  renderWallet();
  await b.wait(done);
}
