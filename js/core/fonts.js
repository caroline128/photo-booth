// Canvas text only uses a web font once it has been downloaded, so machines
// ask for their fonts up front (with a timeout so offline use still works).

const loaded = new Set();

export async function ensureFonts(families = [], sample = '大头贴ABCabc123가나あい') {
  const todo = families.filter((f) => !loaded.has(f));
  if (!todo.length || !document.fonts?.load) return;
  const jobs = todo.map((f) =>
    Promise.all([document.fonts.load(`400 48px "${f}"`, sample), document.fonts.load(`700 48px "${f}"`, sample)])
      .then(() => loaded.add(f))
      .catch(() => {}),
  );
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 2500))]);
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
