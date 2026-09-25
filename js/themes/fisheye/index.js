// Placeholder until the theme pack lands — reuses the classic art.
import classic from '../classic/index.js';

export default {
  ...classic,
  id: 'fisheye',
  name: 'FISHEYE CAM',
  title: '鱼眼大头机',
  colors: { ...classic.colors, body: '#1b1b1b', accent: '#c6ff3d' },
};
