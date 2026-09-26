// README screenshots (demo mode, 小芒 as the model): node tests/screens.mjs
// Writes JPEGs to docs/screenshots/.

import { mkdirSync } from 'node:fs';
import { launch } from './browser.mjs';
import { serve } from '../scripts/serve.mjs';

const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });
const port = 5800 + Math.floor(Math.random() * 300);
const server = await serve(port);
const browser = await launch({ camera: false });
const base = `http://localhost:${port}`;

async function page(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('pageerror:', e.message));
  return p;
}
const snap = (p, name, opts = {}) => p.screenshot({ path: `${OUT}/${name}.jpg`, type: 'jpeg', quality: 84, ...opts }).then(() => console.log('  📸', name));
const dockBtn = async (p, text) => {
  await p.waitForFunction((t) => [...document.querySelectorAll('.dock button')].some((x) => x.textContent.includes(t) && !x.disabled), text, { timeout: 60000 });
  return p.locator('.dock button', { hasText: text }).first();
};

async function session(p, { title, model = 'Sonnet', think = false, frame = '聊天截图', layout = null, filter = null, stickers = [], shots = {} }) {
  await p.goto(`${base}/?fast=1`);
  await p.waitForSelector('.composer textarea');
  await p.fill('.composer textarea', title);
  await p.click('.model-btn');
  await p.locator('.popover .menu-item', { hasText: model }).click();
  if (think) await p.locator('.composer-bar .pill').nth(1).click();
  await p.click('.send');
  await p.waitForSelector('.frame-opt');
  if (layout) await p.locator('.seg-opt', { hasText: layout }).click();
  await p.locator('.frame-opt', { hasText: frame }).click();
  await p.waitForTimeout(1200);
  if (shots.frame) await snap(p, shots.frame);
  await (await dockBtn(p, '下一步')).click();
  await (await dockBtn(p, '让小芒当模特')).click();
  await (await dockBtn(p, '开始拍摄')).click();
  if (shots.shoot) {
    await p.waitForSelector('.think-body p', { timeout: 20000 }).catch(() => {});
    await p.waitForFunction(() => document.querySelectorAll('.film-cell.filled').length >= 2, null, { timeout: 30000 });
    await p.waitForSelector('.live-count span');
    await p.waitForTimeout(260);
    await snap(p, shots.shoot);
  }
  await p.waitForSelector('.pick-grid .pick', { timeout: 90000 });
  await p.waitForTimeout(600);
  await (await dockBtn(p, '下一步')).click();
  await p.waitForSelector('.filter-opt');
  if (filter) await p.locator('.filter-opt', { hasText: filter }).click();
  await p.waitForTimeout(900);
  await (await dockBtn(p, '下一步')).click();
  await p.waitForSelector('.sticker-opt');
  await p.waitForTimeout(600);
  for (const [group, idx, x, y, w] of stickers) {
    await p.locator('.seg-opt', { hasText: group }).first().click();
    await p.locator('.sticker-opt').nth(idx).click();
    // move the new (selected) sticker to (x, y) in canvas fractions
    await p.evaluate(([x, y, w]) => {
      const ed = window.__booth?.S?.editor;
      if (!ed?.sel) return;
      ed.sel.x = ed.L.W * x;
      ed.sel.y = ed.L.H * y;
      if (w) ed.sel.w = ed.L.W * w;
      ed.render();
    }, [x, y, w]);
    await p.waitForTimeout(150);
  }
  await p.locator('.tool-tab', { hasText: '画笔' }).click();
  await p.locator('.pen-opt', { hasText: '星芒笔' }).click();
  const box = await p.locator('.editor-canvas').boundingBox();
  await p.mouse.move(box.x + box.width * 0.12, box.y + box.height * 0.08);
  await p.mouse.down();
  for (let i = 0; i <= 16; i++) await p.mouse.move(box.x + box.width * (0.12 + i * 0.045), box.y + box.height * (0.08 + Math.sin(i / 2.5) * 0.015));
  await p.mouse.up();
  await p.locator('.tool-tab', { hasText: '贴纸' }).click();
  await p.evaluate(() => window.__booth?.S?.editor?.select(window.__booth.S.editor.items.at(-1) || null));
  await p.waitForTimeout(400);
  if (shots.decorate) await snap(p, shots.decorate);
  await (await dockBtn(p, '完成')).click();
  await p.waitForSelector('.print-view.done', { timeout: 60000 });
  await p.waitForTimeout(2200);
  if (shots.done) await snap(p, shots.done);
}

try {
  const p = await page();
  await session(p, {
    title: '周五下班后的我们',
    think: true,
    frame: '聊天截图',
    filter: '奶油',
    stickers: [
      ['对话', 0, 0.36, 0.3, 0.62],
      ['星芒', 2, 0.8, 0.52, 0.3],
      ['徽章', 0, 0.74, 0.8, 0.3],
    ],
    shots: { frame: 'frame', shoot: 'shoot', decorate: 'decorate', done: 'done' },
  });
  await session(p, { title: '毕业快乐！', model: 'Opus', frame: '论文插图', filter: '墨线插画', stickers: [['插画', 1, 0.2, 0.9, 0.16]], shots: { done: 'done-paper' } });
  await session(p, { title: '', model: 'Sonnet', layout: '四宫格', frame: '终端风', filter: '终端 ASCII', shots: { done: 'done-terminal' } });
  await p.goto(`${base}/#/`);
  await p.waitForSelector('.home .shelf a');
  await p.waitForTimeout(1200);
  await snap(p, 'home');

  const m = await page({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.goto(`${base}/?fast=1`);
  await m.waitForSelector('.composer textarea');
  await m.fill('.composer textarea', '和最好的朋友');
  await m.click('.send');
  await m.waitForSelector('.frame-opt');
  await (await dockBtn(m, '下一步')).click();
  await (await dockBtn(m, '让小芒当模特')).click();
  await (await dockBtn(m, '开始拍摄')).click();
  await m.waitForFunction(() => document.querySelectorAll('.film-cell.filled').length >= 1, null, { timeout: 30000 });
  await m.waitForSelector('.live-count span');
  await m.waitForTimeout(250);
  await snap(m, 'mobile', { quality: 80 });

  const g = await page({ viewport: { width: 1700, height: 1000 } });
  await g.goto(`${base}/dev/gallery.html?s=frames&layout=strip4&scale=0.34`);
  await g.waitForSelector('body[data-ready="1"]', { timeout: 60000 });
  await g.addStyleTag({ content: 'h2,h3,figcaption{display:none} .row{display:inline-flex;margin-right:14px} body{padding:18px}' });
  await g.waitForTimeout(1500);
  await snap(g, 'frames', { fullPage: true });
  await g.goto(`${base}/dev/gallery.html?s=stickers`);
  await g.waitForSelector('body[data-ready="1"]', { timeout: 60000 });
  await g.addStyleTag({ content: 'h2,h3,figcaption{display:none} .row{display:contents} #root{display:flex;flex-wrap:wrap;gap:6px} canvas{width:150px;height:auto;border:none;background:transparent}' });
  await g.waitForTimeout(1500);
  await snap(g, 'stickers', { fullPage: true });
} catch (e) {
  console.error('✗', e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
