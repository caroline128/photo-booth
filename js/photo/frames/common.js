// Shared bits for frames: info defaults, formatting and text helpers.

import { fmtDate, pad, rng, shuffle } from '../../core/util.js';
import { HAIKU, REPLIES, POSES } from '../../data/copy.js';

export function makeInfo(over = {}) {
  const seed = over.seed ?? 20260926;
  const r = rng(seed);
  return {
    title: '',
    modelName: 'Sonnet',
    date: new Date(),
    serial: 42,
    seed,
    replies: shuffle(REPLIES, r),
    haiku: HAIKU[Math.floor(r() * HAIKU.length)],
    poses: shuffle(POSES, r).map((p) => p.text),
    ...over,
  };
}

export const serialText = (info) => `No.${pad(info.serial || 1, 4)}`;
export const dateText = (info, sep = '.') => fmtDate(info.date || new Date(), sep);

// Characters a frame will draw, for font preloading.
export function infoText(info) {
  return [info.title, info.modelName, ...(info.replies || []), ...(info.haiku || []), ...(info.poses || [])].join('');
}

export const DIGITS = '0123456789./:-·No ';
