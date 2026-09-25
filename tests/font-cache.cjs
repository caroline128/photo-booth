// Optional for tests: serve Google Fonts from a local cache filled with curl.
// Some sandboxed networks stall browser font downloads but let curl through.
//   FONTCACHE=1 node tests/e2e.cjs …   (or FONTCACHE=/some/dir)

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

async function useFontCache(page) {
  const opt = process.env.FONTCACHE;
  if (!opt) return false;
  const dir = opt === '1' ? path.join(os.tmpdir(), 'kacha-font-cache') : opt;
  fs.mkdirSync(dir, { recursive: true });
  await page.route(/fonts\.(googleapis|gstatic)\.com/, async (route) => {
    const url = route.request().url();
    const file = path.join(dir, crypto.createHash('md5').update(url).digest('hex'));
    try {
      if (!fs.existsSync(file)) execFileSync('curl', ['-sS', '--fail', '--max-time', '40', '-A', UA, '-o', file, url]);
      const css = url.includes('googleapis');
      await route.fulfill({
        status: 200,
        body: fs.readFileSync(file),
        headers: { 'content-type': css ? 'text/css; charset=utf-8' : 'font/woff2', 'access-control-allow-origin': '*' },
      });
    } catch {
      await route.abort();
    }
  });
  return true;
}

module.exports = { useFontCache };
