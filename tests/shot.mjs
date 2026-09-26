// Screenshot any page of the app: node tests/shot.mjs <path> <out.png> [w] [h] [--full] [--wait=ms] [--dark]
import { launch } from './browser.mjs';
import { serve } from '../scripts/serve.mjs';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')));
const [path = '/', out = 'test-results/shot.png', w = '1440', h = '900'] = args.filter((a) => !a.startsWith('--'));

const port = 5190 + Math.floor(Math.random() * 300);
const server = await serve(port);
const browser = await launch({ camera: !('nocam' in flags) });
const page = await browser.newPage({
  viewport: { width: +w, height: +h },
  deviceScaleFactor: Number(flags.dpr || 1),
  colorScheme: 'dark' in flags ? 'dark' : 'light',
});
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto(`http://localhost:${port}${path}`);
await page.waitForTimeout(Number(flags.wait || 1500));
await page.screenshot({ path: out, fullPage: 'full' in flags });
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'));
await browser.close();
server.close();
console.log('saved', out);
