// Records the live stage canvas while shooting, like the behind-the-scenes
// video Korean self-photo studios hand out with the prints.

const TYPES = ['video/mp4;codecs=avc1', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];

export function recordCanvas(canvas, { fps = 24, maxMs = 180000 } = {}) {
  try {
    if (!canvas?.captureStream || !window.MediaRecorder) return null;
    const mime = TYPES.find((t) => MediaRecorder.isTypeSupported(t));
    if (!mime) return null;
    const stream = canvas.captureStream(fps);
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
    rec.start(1000);
    const cap = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxMs);
    const finish = () => {
      stream.getTracks().forEach((t) => t.stop());
      return chunks.length ? new Blob(chunks, { type: mime.split(';')[0] }) : null;
    };
    return {
      ext: mime.includes('mp4') ? 'mp4' : 'webm',
      stop: () =>
        new Promise((resolve) => {
          clearTimeout(cap);
          if (rec.state === 'inactive') return resolve(finish());
          rec.onstop = () => resolve(finish());
          rec.stop();
        }),
    };
  } catch (e) {
    console.info('[recorder] not available', e?.message || e);
    return null;
  }
}
