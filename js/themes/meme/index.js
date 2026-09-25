// Placeholder until the theme pack lands — reuses the classic art.
import classic from '../classic/index.js';

export default {
  ...classic,
  id: 'meme',
  name: '抽象表情包机',
  title: 'MEME BOOTH',
  colors: { ...classic.colors, body: '#ffd400', accent: '#111111' },
};
