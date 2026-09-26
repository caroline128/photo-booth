// Web fonts for canvas drawing. CJK families on Google Fonts are split into
// unicode-range slices, so a canvas can only use glyphs that were requested
// first: call need(font, text) before drawing text you did not preload.

export const FAMILY = {
  serif: '"Lora", "Noto Serif SC", Georgia, "Songti SC", serif',
  serifCn: '"Noto Serif SC", "Lora", Georgia, "Songti SC", serif',
  sans: '"Poppins", "Noto Sans SC", system-ui, "PingFang SC", sans-serif',
  sansCn: '"Noto Sans SC", "Poppins", system-ui, "PingFang SC", sans-serif',
  mono: '"JetBrains Mono", "Noto Sans SC", ui-monospace, Menlo, monospace',
  hand: '"Caveat", "Long Cang", cursive',
  handCn: '"Long Cang", "Caveat", cursive',
};

export const font = (weight, size, family = 'serif') => `${weight} ${Math.round(size * 100) / 100}px ${FAMILY[family] || family}`;

const cache = new Map();

export function need(spec, text = '') {
  if (!document.fonts?.load) return Promise.resolve();
  const chars = [...new Set(text)].sort().join('');
  const key = `${spec}|${chars}`;
  if (!cache.has(key)) {
    const p = Promise.race([
      document.fonts.load(spec, chars || 'Aa').catch(() => []),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
    cache.set(key, p);
  }
  return cache.get(key);
}

export function needAll(pairs) {
  return Promise.all(pairs.filter(Boolean).map(([spec, text]) => need(spec, text)));
}
