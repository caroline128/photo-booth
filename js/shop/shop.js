// The lobby of the photo booth shop: neon sign, a row of machines, the
// token counter with the shop cat, the photo wall and the trend board.

import { h } from '../core/util.js';
import { store, wall } from '../core/store.js';
import { sfx } from '../core/audio.js';
import { samplePrint } from '../booth/sample.js';
import { createDemoSource } from '../engine/camera.js';
import { TRENDS } from './trends.js';

const TIPS = [
  '欢迎光临～每台机器风格都不一样，先逛逛吧！',
  '代币不够了就来我这儿兑换，免费的喵。',
  '每次拍摄都有 1 次重拍机会，别浪费哦。',
  '涂鸦时间有限，手要快！',
  '照片只在你的浏览器里处理，不会上传到任何地方。',
  '拍好的照片可以贴到右边的照片墙上。',
];

export class Shop {
  constructor({ themes, onEnter }) {
    this.themes = themes;
    this.onEnter = onEnter;
    this.unsub = [];
    this.el = this.build();
  }

  build() {
    const tokens = h('b', String(store.get('tokens')));
    this.unsub.push(store.on('change:tokens', (v) => (tokens.textContent = String(v))));
    const machines = h(
      'div.machines',
      this.themes.map((t, i) => this.cabinet(t, i)),
    );
    const bubble = h('p.cat-bubble', TIPS[0]);
    let tip = 0;
    const cat = h('canvas.shop-cat', { width: 220, height: 220, role: 'img', 'aria-label': '店长猫咔咔' });
    drawCatAvatar(cat);
    cat.addEventListener('click', () => {
      tip = (tip + 1) % TIPS.length;
      bubble.textContent = TIPS[tip];
      sfx.pop();
    });
    const exchange = h('button.btn.primary', { type: 'button' }, '免费兑换 10 枚代币');
    exchange.addEventListener('click', () => {
      store.earn(10);
      sfx.coin();
      bubble.textContent = '给你 10 枚代币，玩得开心喵！';
    });
    this.wallGrid = h('div.wall-grid');
    this.renderWall();
    this.unsub.push(store.on('wall', () => this.renderWall()));

    return h(
      'div.shop',
      h(
        'header.shop-top',
        h(
          'div.sign',
          h('span.sign-kacha', '咔嚓咔嚓'),
          h('span.sign-main', '大头贴铺'),
          h('small.sign-en', 'KACHA KACHA PHOTO SHOP · 自助大头贴'),
        ),
        h('div.wallet-chip', { title: '你的代币' }, h('i.coin-ico'), tokens, ' 枚代币'),
      ),
      h('p.shop-intro', '店里有 6 台不同风格的大头贴机：选一台，投币，戴上道具，在倒数里摆好姿势——拍完还能涂鸦、贴贴纸，最后等照片从出片口掉出来。'),
      h('section.aisle', { 'aria-label': '大头贴机器' }, machines, h('div.floor')),
      h(
        'section.lower',
        h('div.counter', h('h3', '前台 · 兑币处'), h('div.cat-wrap', cat, bubble), exchange, h('p.privacy', '🔒 摄像头画面只在本机浏览器里处理，不会上传。')),
        h('div.photo-wall', h('h3', '照片墙 PHOTO WALL'), this.wallGrid),
        this.trendBoard(),
      ),
      h('footer.shop-foot', '© 咔嚓咔嚓大头贴铺 · 一个复古大头贴网页实验 · ', h('a', { href: 'docs/research.md', target: '_blank', rel: 'noopener' }, '流行趋势调研')),
    );
  }

  cabinet(t, i) {
    const sample = h('img.c-sample', { alt: `${t.name} 样张`, loading: 'lazy' });
    samplePrint(t).then((u) => (sample.src = u));
    const el = h(
      `button.cab.m-${t.id}`,
      {
        type: 'button',
        style: cabVars(t, i),
        'aria-label': `${t.name}：${t.title}，${t.price} 枚代币`,
      },
      h('div.c-marquee', h('div.c-bulbs', Array.from({ length: 10 }, (_, k) => h('i', { style: { '--k': k } }))), h('b', t.name)),
      h(
        'div.c-body',
        h('div.c-booth', h('div.c-curtain'), h('div.c-screen', h('span', t.screenText || 'TOUCH'))),
        h('div.c-side', sample),
      ),
      h('div.c-base', h('span.c-slot'), h('span.c-price', '🪙 ', String(t.price))),
      t.badge ? h('span.c-badge', t.badge) : null,
      h('div.c-info', h('b', t.title), h('small', t.tagline)),
    );
    el.addEventListener('click', () => {
      sfx.select();
      this.onEnter(t.id);
    });
    el.addEventListener('pointerenter', () => sfx.click());
    return el;
  }

  async renderWall() {
    const items = await wall.list();
    for (const u of this.wallUrls || []) URL.revokeObjectURL(u);
    this.wallUrls = [];
    this.wallGrid.innerHTML = '';
    if (!items.length) {
      this.wallGrid.append(h('p.wall-empty', '还没有照片～ 拍完点「贴到照片墙」就会出现在这里。'));
      return;
    }
    for (const it of items.slice(0, 24)) {
      const url = URL.createObjectURL(it.blob);
      this.wallUrls.push(url);
      const img = h('img', { src: url, alt: `${it.name} 的照片` });
      const pin = h(
        'figure.pin',
        { style: { '--tilt': `${((it.created % 9) - 4) * 1.4}deg` } },
        img,
        h('figcaption', it.name),
        h('button.pin-del', { type: 'button', title: '取下这张', 'aria-label': '从照片墙取下' }, '×'),
      );
      img.addEventListener('click', () => window.open(url, '_blank'));
      pin.querySelector('.pin-del').addEventListener('click', () => wall.remove(it.id));
      this.wallGrid.append(pin);
    }
  }

  trendBoard() {
    return h(
      'div.trends',
      h('h3', '大头贴流行小报'),
      h('p.trends-sub', TRENDS.sub),
      h(
        'ul',
        TRENDS.items.map((it) => h('li', h('b', it.title), ' ', it.text, it.src ? h('a', { href: it.src, target: '_blank', rel: 'noopener' }, ' [来源]') : null)),
      ),
      h('a.trends-more', { href: 'docs/research.md', target: '_blank', rel: 'noopener' }, '看完整调研 →'),
    );
  }

  destroy() {
    this.unsub.forEach((f) => f());
    for (const u of this.wallUrls || []) URL.revokeObjectURL(u);
  }
}

function cabVars(t, i) {
  const c = t.colors || {};
  return {
    '--body': c.body || '#e44',
    '--trim': c.trim || '#fff',
    '--accent': c.accent || '#ffd400',
    '--curtain': c.curtain || c.accent || '#c33',
    '--glow': c.glow || c.accent || '#fff',
    '--i': i,
    '--font-display': t.fonts?.display || 'inherit',
  };
}

function drawCatAvatar(c) {
  const demo = createDemoSource({ animate: false });
  demo.renderAt(5.2);
  const ctx = c.getContext('2d');
  // crop around the cat's head
  ctx.drawImage(demo.el, 640 - 380, 450 - 400, 760, 760, 0, 0, c.width, c.height);
  demo.stop();
}
