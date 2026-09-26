// End-to-end run through the booth with Playwright.
//   node tests/e2e.mjs                 → Sonnet, fake webcam, desktop
//   MODEL=opus DEMO=1 node tests/e2e.mjs  → deny camera, 小芒 models
//   MOBILE=1 node tests/e2e.mjs        → phone viewport
//   DARK=1, THINK=1, RETAKE=1, FRAME=聊天截图, FILTER=墨线插画, PROP=和小芒合影, TITLE=… also work
// Screenshots land in test-results/<name>-NN-step.png

import { mkdirSync } from 'node:fs';
import { launch } from './browser.mjs';
import { serve } from '../scripts/serve.mjs';

const env = process.env;
const MODEL = env.MODEL || 'sonnet';
const DEMO = !!env.DEMO;
const MOBILE = !!env.MOBILE;
const NAME = env.NAME || `${MODEL}${DEMO ? '-demo' : ''}${MOBILE ? '-m' : ''}${env.DARK ? '-dark' : ''}`;
const TITLE = env.TITLE ?? '周五下班后的我们';
const OUT = 'test-results';
mkdirSync(OUT, { recursive: true });

const port = 5400 + Math.floor(Math.random() * 400);
const server = await serve(port);
const browser = await launch({ camera: !DEMO });
const context = await browser.newContext({
  viewport: MOBILE ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: MOBILE ? 2 : 1,
  isMobile: MOBILE,
  hasTouch: MOBILE,
  permissions: DEMO ? [] : ['camera'],
  colorScheme: env.DARK ? 'dark' : 'light',
});
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && !/favicon|ERR_CERT|net::/.test(m.text()) && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e.stack || e)));

let n = 0;
const shot = async (label) => {
  n++;
  const file = `${OUT}/${NAME}-${String(n).padStart(2, '0')}-${label}.${env.JPEG ? 'jpg' : 'png'}`;
  await page.screenshot({ path: file, ...(env.JPEG ? { type: 'jpeg', quality: 82 } : {}) });
  console.log('  📸', file);
};
const step = (s) => console.log(`→ ${s}`);
const click = (sel) => page.locator(sel).first().click();
const waitDockButton = async (text) => {
  const b = page.locator('.dock button', { hasText: text }).first();
  await b.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForFunction((t) => [...document.querySelectorAll('.dock button')].some((x) => x.textContent.includes(t) && !x.disabled), text, { timeout: 30000 });
  return b;
};

try {
  step('home');
  await page.goto(`http://localhost:${port}/?fast=1`);
  await page.waitForSelector('.composer textarea');
  await page.waitForTimeout(800);
  await shot('home');

  step('model + title');
  await page.fill('.composer textarea', TITLE);
  await click('.model-btn');
  await page.waitForSelector('.popover');
  await shot('model-menu');
  await page.locator('.popover .menu-item', { hasText: MODEL === 'haiku' ? 'Haiku' : MODEL === 'opus' ? 'Opus' : 'Sonnet' }).click();
  if (env.THINK) await click('.composer-bar .pill:nth-of-type(2)');
  await click('.send');

  step('frame');
  await page.waitForSelector('.frame-grid .frame-opt');
  await page.waitForTimeout(900);
  if (env.FRAME) {
    await page.locator('.frame-opt', { hasText: env.FRAME }).click();
    await page.waitForTimeout(400);
  }
  await shot('frame');
  await (await waitDockButton('下一步')).click();

  step('camera');
  await (await waitDockButton('打开摄像头')).click();
  await (await waitDockButton('开始拍摄')).waitFor();
  if (env.PROP) {
    await page.locator('.prop-row .chip', { hasText: env.PROP }).click();
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(900);
  await shot('ready');
  await (await waitDockButton('开始拍摄')).click();

  step('shooting');
  await page.waitForSelector('.live-count span', { timeout: 20000 });
  await page.waitForTimeout(250);
  await shot('shooting');

  step('pick');
  await page.waitForSelector('.pick-grid .pick', { timeout: 60000 });
  await page.waitForTimeout(900);
  await shot('pick');
  if (env.RETAKE) {
    await page.locator('.pick').nth(1).hover();
    await page.locator('.pick-retake').nth(1).click();
    await page.waitForSelector('.pick-grid .pick', { timeout: 30000 });
    await page.waitForTimeout(500);
  }
  await (await waitDockButton('下一步')).click();

  step('filter');
  await page.waitForSelector('.filter-grid .filter-opt');
  await page.waitForTimeout(700);
  if (env.FILTER) {
    await page.locator('.filter-opt', { hasText: env.FILTER }).click();
    await page.waitForTimeout(700);
  }
  await shot('filter');
  await (await waitDockButton('下一步')).click();

  step('decorate');
  const deco = await page.waitForSelector('.editor, .print-view', { timeout: 30000 });
  if (await deco.evaluate((el) => el.classList.contains('editor'))) {
    await page.waitForSelector('.sticker-opt');
    await page.waitForTimeout(700);
    // add a few stickers and a stroke
    const stickers = page.locator('.sticker-opt');
    const count = await stickers.count();
    for (const i of [0, 3, 7].filter((k) => k < count)) {
      await stickers.nth(i).click();
      await page.waitForTimeout(150);
    }
    await shot('decorate-stickers');
    const pens = page.locator('.tool-tab', { hasText: '画笔' });
    if (await pens.count()) {
      await pens.click();
      const box = await page.locator('.editor canvas').first().boundingBox();
      await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
      await page.mouse.down();
      for (let i = 0; i <= 20; i++) await page.mouse.move(box.x + box.width * (0.2 + i * 0.03), box.y + box.height * (0.3 + Math.sin(i / 3) * 0.05));
      await page.mouse.up();
    }
    await shot('decorate');
    await (await waitDockButton('完成')).click();
  }

  step('print');
  await page.waitForSelector('.print-view .pv-paper', { timeout: 30000 });
  await page.waitForTimeout(450);
  await shot('printing');
  await page.waitForSelector('.print-view.done', { timeout: 45000 });
  await page.waitForTimeout(1800);
  await shot('done');
  await page.locator('.artifact-tabs .seg-opt').nth(1).click();
  await page.waitForTimeout(300);
  await shot('code');

  step('home again');
  await page.locator('.dock .link-btn').click();
  await page.waitForSelector('.home .shelf a', { timeout: 10000 });
  await page.waitForTimeout(800);
  await shot('home-after');

  step('viewer');
  await page.locator('.home .shelf a').first().click();
  await page.waitForSelector('.viewer .print-view.done img', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await shot('viewer');
} catch (e) {
  console.error('✗ FAILED:', e.message);
  await shot('failure').catch(() => {});
  errors.push(String(e));
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.log('\nErrors:\n' + errors.join('\n'));
  process.exitCode = 1;
} else console.log('\n✓ no page errors');
