// Checks AR prop tracking (and backdrop swap) on a real face: a local photo
// is fed to the page as a synthetic camera stream.
//   NODE_PATH=$(npm root -g) node tests/face.cjs <themeId> <portrait.jpg> [outDir]
// The portrait is only used locally; keep it out of the repository.

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:5173';
const [id = 'classic', imgPath, outDir = path.join(__dirname, '..', 'test-results')] = process.argv.slice(2);
if (!imgPath) throw new Error('usage: face.cjs <themeId> <portrait.jpg> [outDir]');
fs.mkdirSync(outDir, { recursive: true });
const dataUrl = 'data:image/jpeg;base64,' + fs.readFileSync(imgPath).toString('base64');

(async () => {
  const browser = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.text().includes('[vision]')) && errors.push(m.text()));
  await page.addInitScript((src) => {
    navigator.mediaDevices.getUserMedia = async () => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = 1280;
      cv.height = 960;
      const ctx = cv.getContext('2d');
      const t0 = performance.now();
      const scale = 1.4;
      const draw = () => {
        const t = (performance.now() - t0) / 1000;
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.save();
        ctx.translate(640 + Math.sin(t * 0.8) * 30, 380);
        ctx.rotate(Math.sin(t * 0.6) * 0.12);
        ctx.drawImage(img, -400 * scale, -215 * scale, img.width * scale, img.height * scale);
        ctx.restore();
        requestAnimationFrame(draw);
      };
      draw();
      return cv.captureStream(30);
    };
  }, dataUrl);

  await page.goto(`${BASE}/#/m/${id}`);
  await page.waitForSelector('.attract', { timeout: 15000 });
  await page.click('.screen-main');
  await page.waitForSelector('.coin-step');
  for (let i = 0; i < 12 && (await page.$('.coin-step')); i++) {
    const tok = await page.$('.token');
    if (tok) await tok.click().catch(() => {});
    else await page.click('.coin-side .btn').catch(() => {});
    await page.waitForTimeout(250);
  }
  await page.waitForSelector('.frame-step');
  await page.click('.screen-foot .btn.primary');
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(500);
    if (!(await page.$('.option-step'))) break;
    await page.click('.screen-foot .btn.primary');
  }
  await page.waitForSelector('.prep', { timeout: 20000 });
  const n = await page.locator('.prop-card').count();
  const pickProps = (process.env.PROPS || '0,2,5').split(',').map(Number).filter((k) => k < n);
  for (const k of pickProps) {
    await page.locator('.prop-card').nth(k).click();
    await page.waitForTimeout(200);
  }
  if (await page.$('.prep-side .seg .btn[data-pane="bg"]')) {
    await page.click('.prep-side .seg .btn[data-pane="bg"]');
    const nb = await page.locator('.bg-card').count();
    if (nb > 2) await page.locator('.bg-card').nth(2).click();
  }
  await page.waitForTimeout(6000); // let MediaPipe load + track
  const chip = await page.$eval('.ar-chip', (e) => e.dataset.state + ' | ' + e.textContent).catch(() => '');
  console.log('AR chip:', chip);
  await page.locator('.live').screenshot({ path: path.join(outDir, `face-${id}-1.png`) });
  await page.waitForTimeout(1500);
  await page.locator('.live').screenshot({ path: path.join(outDir, `face-${id}-2.png`) });
  console.log('saved', path.join(outDir, `face-${id}-*.png`));
  if (errors.length) console.log('log:\n - ' + [...new Set(errors)].join('\n - '));
  await browser.close();
})();
