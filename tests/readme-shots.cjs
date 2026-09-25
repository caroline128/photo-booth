// Regenerates the screenshots used in README.md (demo-cat mode, no real faces).
//   NODE_PATH=$(npm root -g) node tests/readme-shots.cjs

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE = process.env.BASE || 'http://localhost:5173';
const OUT = path.join(__dirname, '..', 'docs', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

async function toPrep(page, id) {
  await page.goto(`${BASE}/#/m/${id}`);
  await page.waitForSelector('.attract', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.click('.screen-main');
  await page.waitForSelector('.coin-step');
  for (let i = 0; i < 12 && (await page.$('.coin-step')); i++) {
    const tok = await page.$('.token');
    if (tok) await tok.click().catch(() => {});
    else await page.click('.coin-side .btn').catch(() => {});
    await page.waitForTimeout(260);
  }
  for (let i = 0; i < 4; i++) {
    await page.waitForSelector('.option-step, .frame-step', { timeout: 20000 });
    if (!(await page.$('.option-step'))) break;
    await page.click('.screen-foot .btn.primary');
    await page.waitForTimeout(500);
  }
  await page.waitForSelector('.frame-step');
  await page.waitForTimeout(500);
}

async function snap(page, name) {
  await page.screenshot({ path: path.join(OUT, name), type: 'jpeg', quality: 82, timeout: 45000 });
  console.log('saved', name);
}

(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });

  // lobby
  await page.goto(`${BASE}/#/`);
  await page.waitForTimeout(4000);
  await snap(page, 'shop.jpg');

  // a machine's frame picker
  await toPrep(page, 'kpop');
  await snap(page, 'kpop-frame.jpg');
  await page.click('.screen-foot .btn.primary');
  // camera is denied (no fake-ui flag) → pick the demo cat
  await page.waitForSelector('.modal .btn.primary', { timeout: 15000 });
  await page.click('.modal .btn.primary');
  await page.waitForSelector('.prep');
  for (let k = 0; k < 2; k++) await page.locator('.prop-card').nth(k).click();
  await page.waitForTimeout(1500);
  await snap(page, 'kpop-props.jpg');
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
