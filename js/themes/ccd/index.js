// Placeholder until the theme pack lands — reuses the classic art.
import classic from '../classic/index.js';

export default {
  ...classic,
  id: 'ccd',
  name: 'DIGI 2003',
  title: '千禧 CCD 大头贴',
  colors: { ...classic.colors, body: '#aab3bd', accent: '#2f6bff' },
};
