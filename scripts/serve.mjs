// Minimal static server for local development: node scripts/serve.mjs [port]
// The camera needs a secure context, and http://localhost counts as one.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

export function serve(port = 5173) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
      if (!path.startsWith(ROOT)) throw Object.assign(new Error('forbidden'), { code: 403 });
      if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
      const body = await readFile(path);
      res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch (e) {
      res.writeHead(e.code === 403 ? 403 : 404, { 'content-type': 'text/plain' });
      res.end(e.code === 403 ? 'Forbidden' : 'Not found');
    }
  });
  return new Promise((r) => server.listen(port, () => r(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 5173;
  await serve(port);
  console.log(`Claude 大头贴照相馆 → http://localhost:${port}`);
}
