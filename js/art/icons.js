// Line icons (20×20, currentColor), written as SVG path data.

import { svgNode } from '../core/dom.js';
import { sparkD } from './spark.js';

const P = {
  plus: 'M10 4.5v11M4.5 10h11',
  up: 'M10 15.5V5M5.5 9.5 10 5l4.5 4.5',
  down: 'M5.5 8 10 12.5 14.5 8',
  right: 'M8 5.5 12.5 10 8 14.5',
  left: 'M12 5.5 7.5 10l4.5 4.5',
  close: 'M5.5 5.5l9 9M14.5 5.5l-9 9',
  check: 'M4.5 10.5 8.3 14 15.5 6.5',
  sidebar: 'M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM8 3.5v13',
  sound: 'M4 8h2.5L10 5v10l-3.5-3H4zM13 7.5a3.5 3.5 0 0 1 0 5M15 5.5a6.3 6.3 0 0 1 0 9',
  mute: 'M4 8h2.5L10 5v10l-3.5-3H4zM13 8l4 4M17 8l-4 4',
  voice: 'M10 3.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0V6A2.5 2.5 0 0 1 10 3.5zM5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v2.5',
  camera: 'M3.5 7.5a2 2 0 0 1 2-2h1.5l1.2-1.8h3.6L13 5.5h1.5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM10 13.2a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4z',
  image: 'M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM3.8 13.5l3.7-3.5 3 2.8 2-1.8 3.7 3.2M12.5 7.7a1 1 0 1 0 0 .1',
  download: 'M10 3.5v9M6 9l4 4 4-4M4 16.5h12',
  share: 'M10 12.5V3.5M6.5 7 10 3.5 13.5 7M5 10.5v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4',
  trash: 'M4.5 6h11M8 6V4.5h4V6M6 6l.7 9.5a1.5 1.5 0 0 0 1.5 1.5h3.6a1.5 1.5 0 0 0 1.5-1.5L14 6',
  undo: 'M7.5 5 4 8.5 7.5 12M4.5 8.5h7a4 4 0 0 1 0 8H9',
  redo: 'M12.5 5 16 8.5 12.5 12M15.5 8.5h-7a4 4 0 0 0 0 8H11',
  pen: 'M12.5 4.5l3 3L7 16H4v-3zM11 6l3 3',
  text: 'M5 5.5h10M10 5.5v10M7.5 15.5h5',
  sticker: 'M4 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5l-5 5H6a2 2 0 0 1-2-2zM16 11h-3a2 2 0 0 0-2 2v3M7.5 8.5h.1M12.5 8.5h.1M7.5 11.5c.8.8 1.6 1.1 2.5 1.1',
  refresh: 'M15.5 8A6 6 0 0 0 4.7 6.7M4.5 3.5v3.3h3.3M4.5 12a6 6 0 0 0 10.8 1.3M15.5 16.5v-3.3h-3.3',
  clock: 'M10 16.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM10 6.5V10l2.5 1.5',
  copy: 'M7.5 7.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2zM12.5 5.5v-.5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h2.5',
  code: 'M7.5 6 3.5 10l4 4M12.5 6l4 4-4 4',
  eye: 'M2.8 10s2.7-5 7.2-5 7.2 5 7.2 5-2.7 5-7.2 5-7.2-5-7.2-5zM10 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z',
  dice: 'M4 6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM7.5 7.5h.1M12.5 12.5h.1M10 10h.1M12.5 7.5h.1M7.5 12.5h.1',
  bulb: 'M7.5 14.5h5M8 16.5h4M10 3.5a4.5 4.5 0 0 0-2.7 8.1c.5.4.7.9.7 1.4v.5h4V13c0-.5.2-1 .7-1.4A4.5 4.5 0 0 0 10 3.5z',
  chat: 'M4 5.5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-3.5 3v-3H6a2 2 0 0 1-2-2z',
  terminal: 'M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2zM6.5 8l2.5 2-2.5 2M10.5 12.5h3',
  paper: 'M5.5 3.5h6l3 3v10h-9zM11.5 3.5v3h3M7.5 10h5M7.5 12.5h5',
  leaf: 'M4.5 15.5C5 9 9 4.5 15.5 4.5 15.5 11 11 15 4.5 15.5zM4.5 15.5 11 9',
  grid: 'M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z',
  strip: 'M7 3.5h6v13H7zM7 7h6M7 10h6M7 13h6',
  wand: 'M4 16 13 7M12 4.5l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5zM15.5 10l.4 1 1 .4-1 .4-.4 1-.4-1-1-.4 1-.4z',
  eraser: 'M8 16.5h8M4.8 12.3 11.6 5.5a1.5 1.5 0 0 1 2.1 0l2.3 2.3a1.5 1.5 0 0 1 0 2.1L9.5 16.5H7.3z',
  flip: 'M10 3.5v13M7.5 6 4 13h3.5zM12.5 6 16 13h-3.5z',
  layers: 'M10 4 16.5 7.5 10 11 3.5 7.5zM3.5 11 10 14.5 16.5 11',
  pause: 'M7.5 5v10M12.5 5v10',
  zap: 'M11 3.5 5 11h4.5L9 16.5 15 9h-4.5z',
  menu: 'M4 6h12M4 10h12M4 14h12',
  home: 'M4 9 10 4l6 5v6.5a1 1 0 0 1-1 1h-3.5v-4h-3v4H5a1 1 0 0 1-1-1z',
};

export function icon(name, { size = 20, stroke = 1.6, label = '' } = {}) {
  if (name === 'spark')
    return svgNode(
      `<svg class="ico" viewBox="0 0 20 20" width="${size}" height="${size}" aria-hidden="true"><path fill="currentColor" d="${sparkD(20)}"/></svg>`,
    );
  const d = P[name] || P.plus;
  return svgNode(
    `<svg class="ico" viewBox="0 0 20 20" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"${
      label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'
    }><path d="${d}"/></svg>`,
  );
}
