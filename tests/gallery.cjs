// Screenshot the dev gallery of a theme (full page) for visual review.
//   NODE_PATH=$(npm root -g) node tests/gallery.cjs <themeId> [outFile]

const { chromium } = require('playwright');
const { useFontCache } = require('./font-cache.cjs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:5173';
const id = process.argv[2] || 'classic';
const file = process.argv[3] || path.join(__dirname, '..', 'test-results', `gallery-${id}.png`);

(async () => {
  const browser = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, ignoreHTTPSErrors: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  if (process.env.NOFONTS) await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  else await useFontCache(page);
  await page.goto(`${BASE}/dev/gallery.html?theme=${id}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => document.body.dataset.ready, null, { timeout: 150000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: file, fullPage: true, timeout: 60000 }).catch((e) => console.log('full-page shot failed:', e.message.split('\n')[0]));
  console.log('saved', file, 'status:', await page.evaluate(() => document.body.dataset.ready));
  // one screenshot per section as well (easier to inspect than one huge page)
  const n = await page.locator('.grid').count();
  for (let i = 0; i < n; i++) {
    const f = file.replace(/\.png$/, `-${i + 1}.png`);
    try {
      await page.locator('.grid').nth(i).screenshot({ path: f, timeout: 60000 });
      console.log('saved', f, '—', await page.locator('h2').nth(i).textContent());
    } catch (e) {
      console.log('section shot failed', i + 1, e.message.split('\n')[0]);
    }
  }
  if (errors.length) console.log('errors:\n - ' + [...new Set(errors)].join('\n - '));
  await browser.close();
})();
