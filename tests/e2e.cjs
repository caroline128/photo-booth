// End-to-end run through one or more machines with Chromium's fake camera.
//   NODE_PATH=$(npm root -g) node tests/e2e.cjs [themeId ...]
// Env: BASE (default http://localhost:5173), OUT (screenshot dir), W/H viewport,
//      DEMO=1 to deny the camera and use the demo cat, NOFONTS=1 to skip web
//      fonts (flaky networks), FONTCACHE=1 to fetch fonts via curl into a
//      local cache, JPEG=1 for compact screenshots.

const { chromium } = require('playwright');
const { useFontCache } = require('./font-cache.cjs');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:5173';
const OUT = process.env.OUT || path.join(__dirname, '..', 'test-results');
const W = +(process.env.W || 1440);
const H = +(process.env.H || 900);
const ids = process.argv.slice(2);

fs.mkdirSync(OUT, { recursive: true });
const errorsRef = [];

async function run() {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME || undefined,
    args: [
      // DEMO=1: no auto-accept, so the camera request is denied and the demo cat steps in
      ...(process.env.DEMO ? [] : ['--use-fake-ui-for-media-stream']),
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-angle=swiftshader',
    ],
  });
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    permissions: process.env.DEMO ? [] : ['camera'],
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true, // web fonts come through the sandbox proxy
  });
  const page = await context.newPage();
  failPage = page;
  const errors = errorsRef;
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}\n${e.stack || ''}`));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`);
  });
  if (process.env.NOFONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  else await useFontCache(page);
  const shot = async (name) => {
    try {
      const jpeg = !!process.env.JPEG; // compact shots for docs
      await page.screenshot({ path: path.join(OUT, `${name}.${jpeg ? 'jpg' : 'png'}`), timeout: 45000, ...(jpeg ? { type: 'jpeg', quality: 80 } : {}) });
      console.log('  📸', name);
    } catch (e) {
      console.log('  ⚠️ screenshot failed', name, e.message.split('\n')[0]);
    }
  };

  await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  await shot(`00-shop-${W}`);
  const themes = ids.length ? ids : await page.$$eval('.cab', (els) => els.map((e) => [...e.classList].find((c) => c.startsWith('m-')).slice(2)));

  for (const id of themes) {
    console.log('▶', id);
    await page.goto(`${BASE}/#/m/${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.attract', { timeout: 15000 });
    await page.waitForTimeout(1800);
    await shot(`${id}-01-attract`);
    await page.click('.screen-main');
    // coins
    await page.waitForSelector('.coin-step');
    await shot(`${id}-02-coin`);
    for (let i = 0; i < 16; i++) {
      if (!(await page.$('.coin-step'))) break;
      if (!(await page.locator('.token').count())) {
        await page.locator('.coin-side .btn').click({ timeout: 3000 }).catch(() => {});
        continue;
      }
      // the wallet re-renders after every coin, so always re-query
      await page.locator('.token').last().click({ timeout: 3000, force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
    // machine options come first (flash / lens / retouch …), then the frame
    for (let i = 0; i < 4; i++) {
      await page.waitForSelector('.option-step, .frame-step', { timeout: 20000 });
      if (!(await page.$('.option-step'))) break;
      await shot(`${id}-03-option-${i}`);
      await page.locator('.option-card').last().click();
      await page.click('.screen-foot .btn.primary');
      await page.waitForTimeout(600);
    }
    // frame
    await page.waitForSelector('.frame-step', { timeout: 20000 });
    await page.waitForTimeout(600);
    if ((await page.locator('.frame-card').count()) > 1) await page.locator('.frame-card').nth(1).click();
    await page.waitForTimeout(300);
    await shot(`${id}-04-frame`);
    await page.click('.screen-foot .btn.primary');
    // camera / props
    await page.waitForSelector('.prep, .modal', { timeout: 40000 });
    if (await page.$('.modal')) {
      await shot(`${id}-05-camera-modal`);
      await page.click('.modal .btn.primary');
      await page.waitForSelector('.prep', { timeout: 10000 });
    }
    await page.waitForTimeout(1500);
    const nProps = await page.locator('.prop-card').count();
    for (let k = 0; k < Math.min(3, nProps); k++) {
      await page.locator('.prop-card').nth(k).click();
      await page.waitForTimeout(200);
    }
    const bgTab = await page.$('.prep-side .seg .btn[data-pane="bg"]');
    if (bgTab) {
      await bgTab.click();
      if ((await page.locator('.bg-card').count()) > 2) await page.locator('.bg-card').nth(2).click();
      await page.waitForTimeout(800);
    }
    await page.waitForTimeout(1200);
    await shot(`${id}-05-prep`);
    await page.click('.screen-foot .btn.primary');
    // shooting: wait through countdowns, screenshot mid-way
    await page.waitForSelector('.shoot');
    await page.waitForTimeout(2600);
    await shot(`${id}-06-shoot`);
    // use the remote shutter to speed up long machines
    for (let i = 0; i < 20; i++) {
      if (await page.$('.pick')) break;
      const skip = await page.$('.screen-foot .btn.ghost');
      if (skip) await skip.click().catch(() => {});
      await page.waitForTimeout(1300);
    }
    await page.waitForSelector('.pick', { timeout: 60000 });
    await page.waitForTimeout(600);
    // pick if needed
    const need = await page.$eval('.pick-status', (e) => e.textContent);
    if (need.includes('已选')) {
      const m = need.match(/\/ (\d+)/);
      const n = m ? +m[1] : 4;
      for (let k = 0; k < n; k++) {
        await page.locator('.pick-card').nth(k).click({ position: { x: 20, y: 40 } });
        await page.waitForTimeout(120);
      }
    }
    await shot(`${id}-07-pick`);
    // use the retake on the first photo
    const rb = await page.$('.retake-btn');
    if (rb) {
      await rb.click();
      await page.waitForTimeout(1500);
      await shot(`${id}-08-retake`);
      for (let i = 0; i < 10; i++) {
        if (!(await page.$('.retake-overlay'))) break;
        const skip = await page.$('.retake-overlay .btn');
        if (skip) await skip.click().catch(() => {});
        await page.waitForTimeout(900);
      }
      await page.waitForTimeout(400);
    }
    await page.click('.screen-foot .btn.primary');
    // filter
    await page.waitForSelector('.filter-step', { timeout: 10000 });
    if ((await page.locator('.filter-chip').count()) > 1) await page.locator('.filter-chip').nth(1).click();
    await page.waitForTimeout(700);
    await shot(`${id}-09-filter`);
    await page.click('.screen-foot .btn.primary');
    // extra steps (captions etc.) get a generic "primary" click
    for (let i = 0; i < 3; i++) {
      await page.waitForTimeout(700);
      if (await page.$('.deco-step')) break;
      await shot(`${id}-09b-extra-${i}`);
      await page.click('.screen-foot .btn.primary').catch(() => {});
    }
    // decorate
    await page.waitForSelector('.deco-step', { timeout: 10000 });
    await page.waitForTimeout(800);
    const nStk = await page.locator('.sticker-btn').count();
    for (let k = 0; k < Math.min(4, nStk); k++) {
      await page.locator('.sticker-btn').nth(k * 2 % nStk).click();
      await page.waitForTimeout(250);
    }
    // text sticker
    await page.click('.deco-tools .tabs .btn[data-tab="text"]');
    if (await page.locator('.phrase').count()) await page.locator('.phrase').first().click();
    // pen doodle
    await page.click('.deco-tools .tabs .btn[data-tab="pen"]');
    const nPens = await page.locator('.pen-btn').count();
    const bb = await page.locator('.deco-board').boundingBox();
    for (let k = 0; k < Math.min(3, nPens - 1); k++) {
      await page.locator('.pen-btn').nth(k).click();
      await page.mouse.move(bb.x + bb.width * 0.2, bb.y + bb.height * (0.15 + k * 0.25));
      await page.mouse.down();
      for (let j = 0; j <= 12; j++) await page.mouse.move(bb.x + bb.width * (0.2 + j * 0.05), bb.y + bb.height * (0.15 + k * 0.25 + Math.sin(j / 2) * 0.03));
      await page.mouse.up();
    }
    await page.click('.deco-tools .tabs .btn[data-tab="sticker"]');
    await page.waitForTimeout(500);
    await shot(`${id}-10-decorate`);
    await page.click('.screen-foot .btn.primary');
    // review
    await page.waitForSelector('.review', { timeout: 15000 });
    await page.waitForTimeout(500);
    await shot(`${id}-11-review`);
    await page.click('.screen-foot .btn.primary');
    // printing
    await page.waitForSelector('.printing');
    await page.waitForTimeout(1500);
    await shot(`${id}-12-printing`);
    await page.waitForSelector('.print-scene', { timeout: 15000 });
    await page.waitForTimeout(2000);
    await shot(`${id}-13-print-out`);
    await page.waitForSelector('.print-scene .btn.primary:not([hidden])', { timeout: 15000 });
    await page.waitForTimeout(3500);
    await shot(`${id}-14-printed`);
    await page.click('.print-scene .btn.primary');
    await page.waitForSelector('.viewer', { timeout: 20000 });
    await page.waitForTimeout(900);
    await shot(`${id}-15-viewer`);
    // save to wall, then flip
    const btns = await page.$$('.viewer-side .btn');
    for (const b of btns) {
      const t = await b.textContent();
      if (t.includes('照片墙')) await b.click();
    }
    await page.click('.v-card');
    await page.waitForTimeout(1000);
    await shot(`${id}-16-viewer-back`);
  }
  await page.goto(BASE + '/#/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('.photo-wall')?.scrollIntoView());
  await page.waitForTimeout(500);
  await shot(`99-shop-wall`);
  await browser.close();
  if (errors.length) {
    console.log('\n⚠️  console errors/warnings:');
    for (const e of [...new Set(errors)]) console.log(' -', e.slice(0, 600));
  } else console.log('\n✅ no console errors');
}

let failPage = null;
run().catch(async (e) => {
  console.error(e);
  if (failPage) {
    await failPage.screenshot({ path: path.join(OUT, 'FAIL.png'), timeout: 20000 }).catch(() => {});
    console.log('failure screenshot: FAIL.png');
  }
  if (errorsRef.length) console.log('errors so far:\n - ' + [...new Set(errorsRef)].join('\n - ').slice(0, 3000));
  process.exit(1);
});
