// Machine registry — one theme module per photo booth in the shop.

import classic from './classic/index.js';
import kpop from './kpop/index.js';
import fisheye from './fisheye/index.js';
import y2k from './y2k/index.js';
import ccd from './ccd/index.js';
import meme from './meme/index.js';

export const THEMES = [classic, kpop, fisheye, y2k, ccd, meme];

export const themeById = (id) => THEMES.find((t) => t.id === id);
