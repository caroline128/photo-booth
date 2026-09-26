// Print layouts at 300 dpi: 2×6 in strips and 4×6 in sheets. A layout
// fixes the sheet size, photo count and photo aspect; frames decide margins.

export const LAYOUTS = {
  strip3: { id: 'strip3', kind: 'strip', name: '三格竖条', W: 600, H: 1800, count: 3, aspect: 4 / 3 },
  hero3: { id: 'hero3', kind: 'hero', name: '一大两小', W: 1200, H: 1800, count: 3, aspect: 4 / 3 },
  strip4: { id: 'strip4', kind: 'strip', name: '四格竖条', W: 600, H: 1800, count: 4, aspect: 4 / 3 },
  grid4: { id: 'grid4', kind: 'grid', name: '四宫格', W: 1200, H: 1800, count: 4, aspect: 3 / 4, cols: 2 },
  grid6: { id: 'grid6', kind: 'grid', name: '六宫格', W: 1200, H: 1800, count: 6, aspect: 1, cols: 2 },
  duo6: { id: 'duo6', kind: 'duo', name: '双竖条', W: 1200, H: 1800, count: 6, aspect: 4 / 3 },
};

export const isNarrow = (L) => L.W < 900;

// Place L.count photo slots inside `box`, keeping the layout's aspect.
// above/below reserve room for captions around each slot.
export function place(L, box, { gap = 24, above = 0, below = 0, hgap = gap } = {}) {
  const n = L.count, a = L.aspect;
  const cell = (w) => ({ w, h: w / a });
  const out = [];
  const extra = above + below;

  const stack = (x0, y0, cw, ch, k, offset) => {
    let { w, h } = cell(cw);
    const need = k * (h + extra) + (k - 1) * gap;
    if (need > ch) ({ w, h } = cell(((ch - (k - 1) * gap) / k - extra) * a));
    const total = k * (h + extra) + (k - 1) * gap;
    const x = x0 + (cw - w) / 2;
    let y = y0 + (ch - total) / 2 + above;
    for (let i = 0; i < k; i++) {
      out.push({ i: offset + i, x, y, w, h });
      y += h + extra + gap;
    }
  };

  if (L.kind === 'strip') stack(box.x, box.y, box.w, box.h, n, 0);
  else if (L.kind === 'duo') {
    const cw = (box.w - hgap) / 2, k = Math.ceil(n / 2);
    stack(box.x, box.y, cw, box.h, k, 0);
    for (const s of out.slice()) out.push({ ...s, i: s.i + k, x: s.x + cw + hgap });
  } else if (L.kind === 'grid') {
    const cols = L.cols || 2, rows = Math.ceil(n / cols);
    let w = (box.w - hgap * (cols - 1)) / cols;
    let h = w / a;
    const need = rows * (h + extra) + (rows - 1) * gap;
    if (need > box.h) {
      h = (box.h - (rows - 1) * gap) / rows - extra;
      w = h * a;
    }
    const tw = cols * w + (cols - 1) * hgap;
    const th = rows * (h + extra) + (rows - 1) * gap;
    const x0 = box.x + (box.w - tw) / 2, y0 = box.y + (box.h - th) / 2 + above;
    for (let i = 0; i < n; i++) {
      const c = i % cols, r = Math.floor(i / cols);
      out.push({ i, x: x0 + c * (w + hgap), y: y0 + r * (h + extra + gap), w, h });
    }
  } else if (L.kind === 'hero') {
    const m = n - 1;
    let W1 = box.w;
    let w2 = (box.w - hgap * (m - 1)) / m;
    const total = () => W1 / a + extra + gap + w2 / a + extra;
    const k = Math.min(1, box.h / total());
    W1 *= k;
    w2 *= k;
    const x1 = box.x + (box.w - W1) / 2;
    let y = box.y + (box.h - total()) / 2 + above;
    out.push({ i: 0, x: x1, y, w: W1, h: W1 / a });
    y += W1 / a + extra + gap;
    const rowW = m * w2 + (m - 1) * hgap;
    const x2 = box.x + (box.w - rowW) / 2;
    for (let j = 0; j < m; j++) out.push({ i: j + 1, x: x2 + j * (w2 + hgap), y, w: w2, h: w2 / a });
  }
  return out.sort((p, q) => p.i - q.i);
}

// Bounding box of slots (handy for frames that draw around the photo block).
export function bounds(slots) {
  const x = Math.min(...slots.map((s) => s.x)), y = Math.min(...slots.map((s) => s.y));
  const r = Math.max(...slots.map((s) => s.x + s.w)), b = Math.max(...slots.map((s) => s.y + s.h));
  return { x, y, w: r - x, h: b - y };
}
