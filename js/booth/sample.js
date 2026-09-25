// Sample prints for each machine (shown on the lobby cabinets and the
// attract screen), shot with the demo cat so every machine shows off its
// own frame, props and look.

import { createDemoSource } from '../engine/camera.js';
import { Stage } from '../engine/stage.js';
import { compose, slotAspect } from '../engine/compose.js';
import { offlineFx, renderToCanvas } from '../engine/glfx.js';
import { ensureFonts, themeText } from '../core/fonts.js';

const cache = new Map();

// One render per machine, sharp enough for both the lobby cabinet and the
// attract screen (it is only ever scaled down).
const SAMPLE_WIDTH = 480;

export function samplePrint(theme) {
  if (cache.has(theme.id)) return cache.get(theme.id);
  const width = SAMPLE_WIDTH;
  const p = (async () => {
    await ensureFonts(theme.fonts?.load || [], themeText(theme));
    const layout = theme.layouts[0];
    const frame = theme.frames.find((f) => !f.layouts || f.layouts.includes(layout.id)) || theme.frames[0];
    const demo = createDemoSource({ animate: false });
    const stage = new Stage({ source: demo, aspect: slotAspect(layout), preview: false });
    const sampleProps = (theme.sampleProps || []).map((id) => theme.props.find((p) => p.id === id)).filter(Boolean);
    await stage.setProps(sampleProps.length ? sampleProps : theme.props.slice(0, 1));
    const session = { options: defaultOptions(theme), sample: true };
    const filter = theme.filters[0];
    const photos = [];
    for (let i = 0; i < layout.photos; i++) {
      demo.renderAt(1.3 + i * 2.5);
      const shot = stage.capture(560);
      const fx = { ...(theme.liveFx?.(session, shot.faces, shot.w, shot.h) || {}), ...filter.fx };
      photos.push(renderToCanvas(offlineFx(), shot.raw, fx, shot.w, shot.h));
    }
    const info = { theme, date: new Date(), serial: 0, options: session.options, captions: theme.sampleCaptions || [] };
    const full = compose(layout, frame, photos, info);
    const s = width / full.width;
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round(full.height * s);
    c.getContext('2d').drawImage(full, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.86);
  })();
  cache.set(theme.id, p);
  return p;
}

export function defaultOptions(theme) {
  const o = {};
  for (const opt of theme.options || []) o[opt.id] = opt.default ?? opt.choices[0].id;
  return o;
}
