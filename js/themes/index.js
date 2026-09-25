// Machine registry — one theme module per photo booth in the shop.
// Themes load independently: a machine that fails to load is left out of
// the shop (and logged) instead of taking the whole app down.

const IDS = ['classic', 'kpop', 'fisheye', 'y2k', 'ccd', 'meme'];

export const THEMES = [];

export async function loadThemes() {
  const results = await Promise.allSettled(IDS.map((id) => import(`./${id}/index.js`)));
  THEMES.length = 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') THEMES.push(r.value.default);
    else console.error(`[themes] "${IDS[i]}" failed to load`, r.reason);
  });
  return THEMES;
}

export const themeById = (id) => THEMES.find((t) => t.id === id);
