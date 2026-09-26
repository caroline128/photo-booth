// Frame registry.

import cream from './cream.js';
import chat from './chat.js';
import terminal from './terminal.js';
import paper from './paper.js';
import card from './card.js';
import haiku from './haiku.js';
import doodle from './doodle.js';
import letter from './letter.js';

export const FRAMES = [cream, chat, terminal, paper, card, haiku, doodle, letter];

export const frameById = (id) => FRAMES.find((f) => f.id === id) || FRAMES[0];

export const framesFor = (L) => FRAMES.filter((f) => !f.layouts || f.layouts.includes(L.id));
