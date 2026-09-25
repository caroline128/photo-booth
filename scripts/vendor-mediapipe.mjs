#!/usr/bin/env node
// Optional: download MediaPipe Tasks Vision into ./vendor/mediapipe so AR
// props and backdrops work without the jsDelivr CDN (offline / intranet).
// The app tries ./vendor/mediapipe first and falls back to the CDN.
//   node scripts/vendor-mediapipe.mjs

import { mkdir, writeFile, copyFile, rm, mkdtemp } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const VERSION = '1.0.1'; // keep in sync with CDN in js/engine/vision.js
const root = fileURLToPath(new URL('..', import.meta.url));
const dest = join(root, 'vendor', 'mediapipe');
const url = `https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-${VERSION}.tgz`;

const tmp = await mkdtemp(join(tmpdir(), 'mp-'));
try {
  console.log('downloading', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const tgz = join(tmp, 'pkg.tgz');
  await writeFile(tgz, Buffer.from(await res.arrayBuffer()));
  execFileSync('tar', ['-xzf', tgz, '-C', tmp]);
  await mkdir(join(dest, 'wasm'), { recursive: true });
  const files = [
    'vision_bundle.mjs',
    'wasm/vision_wasm_internal.js',
    'wasm/vision_wasm_internal.wasm',
    'wasm/vision_wasm_nosimd_internal.js',
    'wasm/vision_wasm_nosimd_internal.wasm',
  ];
  for (const f of files) await copyFile(join(tmp, 'package', f), join(dest, f));
  console.log(`✅ MediaPipe Tasks Vision ${VERSION} → vendor/mediapipe`);
} finally {
  await rm(tmp, { recursive: true, force: true });
}
