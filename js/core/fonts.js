// Canvas text only uses a web font once it has been downloaded, so machines
// ask for their fonts up front (with a timeout so offline use still works).

const loaded = new Set();
const BASE_SAMPLE = '大头贴ABCabc123가나あい';

/**
 * Preload font families. CJK web fonts are split by unicode range, so pass
 * every non-Latin string the theme draws on canvas in `text`.
 */
export async function ensureFonts(families = [], text = '') {
  if (!document.fonts?.load) return;
  const sample = BASE_SAMPLE + uniq(text);
  const key = (f) => `${f}|${sample}`;
  const todo = families.filter((f) => !loaded.has(key(f)));
  if (!todo.length) return;
  const jobs = todo.map((f) =>
    Promise.all([document.fonts.load(`400 48px "${f}"`, sample), document.fonts.load(`700 48px "${f}"`, sample)])
      .then(() => loaded.add(key(f)))
      .catch(() => {}),
  );
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 4000))]);
}

function uniq(text) {
  return [...new Set(String(text))].join('');
}

/** Everything a theme draws with web fonts, for ensureFonts(). */
export function themeText(t) {
  const parts = [t.fonts?.text || '', ...(t.phrases || []), ...(t.captions?.presets || []), ...(t.sampleCaptions || []), t.title || '', t.name || ''];
  for (const s of t.stickers || []) if (s.fontSpec) parts.push(s.fontSpec.text);
  return uniq(parts.join(''));
}

/** Load fonts for specific text (CJK fonts are split by unicode range). */
export async function ensureText(font, text) {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([document.fonts.load(font, text), new Promise((r) => setTimeout(r, 1500))]);
  } catch {
    /* ignore */
  }
}
