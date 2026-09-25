// Placeholder until the theme pack lands — reuses the classic art.
import classic from '../classic/index.js';

export default {
  ...classic,
  id: 'kpop',
  name: 'STAR 4CUT',
  title: 'K-POP 人生四格',
  colors: { ...classic.colors, body: '#fbfbfd', accent: '#ff4fa3' },
};
