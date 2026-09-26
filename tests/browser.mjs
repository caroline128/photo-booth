// Shared Playwright launcher for the test scripts.
import { chromium } from 'playwright';
import { existsSync, readFileSync } from 'node:fs';
import { X509Certificate, createHash } from 'node:crypto';

// Sandboxed CI/dev containers may re-terminate TLS with their own CA. Trust
// that CA (and only it) so Google Fonts load in screenshots.
function proxyCaFlags() {
  const file = process.env.PROXY_CA || '/root/.ccr/agent-proxy-ca.crt';
  if (!existsSync(file)) return [];
  try {
    const spki = new X509Certificate(readFileSync(file)).publicKey.export({ type: 'spki', format: 'der' });
    return [`--ignore-certificate-errors-spki-list=${createHash('sha256').update(spki).digest('base64')}`];
  } catch {
    return [];
  }
}

export function launch({ camera = true } = {}) {
  return chromium.launch({
    args: [
      ...(camera ? ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] : []),
      '--autoplay-policy=no-user-gesture-required',
      ...proxyCaFlags(),
    ],
  });
}
