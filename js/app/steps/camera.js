// Step 2 · 摄像头: ask for the webcam, or let 小芒 model instead.

import { h } from '../../core/dom.js';
import { lines } from '../../data/copy.js';
import { openCamera, openDemo, cameraError } from '../../photo/camera.js';
import { SparkIcon } from '../../art/spark.js';
import { icon } from '../../art/icons.js';
import { actions, button, choose } from '../dock.js';

export async function stepCamera(S) {
  const { chat, stage, dock } = S;
  await chat.claude(lines.camera);
  stage.head({ icon: 'camera', title: '取景器', sub: '等待摄像头…' });
  stage.show(
    h(
      'div.cam-wait',
      h('div.cam-wait-ico', icon('camera', { size: 40, stroke: 1.3 })),
      h('p', '点「打开摄像头」后，浏览器会询问权限。'),
      h('small', '画面只在这台设备上处理，不会上传。'),
    ),
    'center',
  );
  const cam = button('打开摄像头', { primary: true, icon: 'camera' });
  const demo = button('让小芒当模特', { icon: 'spark' });
  dock.set([actions(h('span.dock-hint', '没有摄像头也能拍'), demo, cam)]);
  const which = await choose({ cam, demo }, S.signal);

  if (which === 'cam') {
    chat.user('打开摄像头');
    const spin = new SparkIcon({ size: 18, mode: 'think' });
    dock.set([h('div.dock-wait', spin.el, '正在打开摄像头…')]);
    try {
      S.source = await openCamera();
      if (S.signal.aborted) S.source.stop();
    } catch (e) {
      if (S.signal.aborted) throw e;
      console.warn('[camera]', e);
      await chat.claude(lines.cameraFail(cameraError(e)));
      S.source = openDemo();
    } finally {
      spin.destroy();
    }
  } else {
    chat.user('让小芒当模特');
    S.source = openDemo();
    await chat.claude(lines.demo);
  }
}
