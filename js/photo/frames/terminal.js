// 终端风: a Claude Code session. A welcome box, your title as the prompt,
// one tool call per photo, and the spinner line at the bottom.

import { font } from '../../core/fonts.js';
import { ellipsize } from '../../core/text.js';
import { roundRect } from '../../art/ink.js';
import { drawSpark } from '../../art/spark.js';
import { place, isNarrow } from '../layouts.js';
import { dateText } from './common.js';

const BG = '#171615';
const FG = '#efece4';
const DIM = '#8f8b80';
const FAINT = '#5f5c55';
const ORANGE = '#d97757';
const GREEN = '#8fb46c';
const EDGE = '#3b3935';

export default {
  id: 'terminal',
  name: '终端风',
  desc: 'Claude Code 会话：每张照片都是一次工具调用',
  dark: true,

  geometry(L) {
    const n = isNarrow(L);
    const top = n ? 290 : 400;
    const bottom = n ? 150 : 190;
    const side = n ? 34 : 72;
    const slots = place(L, { x: side, y: top, w: L.W - side * 2, h: L.H - top - bottom }, { gap: n ? 20 : 26, above: n ? 38 : 50, below: n ? 34 : 44, hgap: n ? 20 : 44 });
    return { slots: slots.map((s) => ({ ...s, r: 8 })), top, bottom, side };
  },

  fonts(L, info) {
    return [
      [font(700, 21, 'mono'), 'Welcome to Claude Booth!'],
      [font(400, 16, 'mono'), `/help 查看帮助 · /shoot 拍照cwd: ~/photos/${dateText(info, '-')}>${info.title || '拍一组大头贴'}好的，开始拍摄 张。Camera(shot_.jpg)已保存 · 微笑检测通过Smiling… (s · esc to interrupt)? for shortcuts0123456789`],
    ];
  },

  under(ctx, L, G, info) {
    const n = isNarrow(L);
    const k = n ? 1 : 1.45;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, L.W, L.H);
    ctx.textBaseline = 'alphabetic';
    // welcome box
    const bx = n ? 22 : 44, by = n ? 22 : 40, bw = L.W - bx * 2, bh = n ? 150 : 200;
    ctx.strokeStyle = ORANGE;
    ctx.lineWidth = n ? 2.5 : 3;
    ctx.beginPath();
    roundRect(ctx, bx, by, bw, bh, n ? 14 : 18);
    ctx.stroke();
    drawSpark(ctx, bx + 30 * k, by + 40 * k, 11 * k);
    ctx.fillStyle = FG;
    ctx.font = font(700, 21 * k, 'mono');
    ctx.fillText('Welcome to Claude Booth!', bx + 50 * k, by + 48 * k);
    ctx.fillStyle = DIM;
    ctx.font = font(400, 15 * k, 'mono');
    ctx.fillText('/help 查看帮助 · /shoot 拍照', bx + 26 * k, by + 88 * k);
    ctx.fillText(`cwd: ~/photos/${dateText(info, '-')}`, bx + 26 * k, by + 120 * k);

    // prompt + first reply
    let y = by + bh + (n ? 46 : 64);
    ctx.fillStyle = '#bdb9ae';
    ctx.font = font(400, 17 * k, 'mono');
    ctx.fillText(ellipsize(ctx, `> ${info.title || '拍一组大头贴'}`, L.W - bx * 2), bx + 4, y);
    y += n ? 40 : 56;
    ctx.fillStyle = FG;
    ctx.beginPath();
    ctx.arc(bx + 10, y - 6 * k, 5 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = font(400, 16 * k, 'mono');
    ctx.fillText(`好的，开始拍摄 ${L.count} 张。`, bx + 28 * k, y);
  },

  slot(ctx, s, i, L) {
    const n = isNarrow(L);
    const k = n ? 1 : 1.25;
    ctx.save();
    ctx.strokeStyle = EDGE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
    ctx.stroke();
    // tool call label
    const ly = s.y - (n ? 14 : 18);
    ctx.fillStyle = GREEN;
    ctx.beginPath();
    ctx.arc(s.x + 6, ly - 6 * k, 5 * k, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = FG;
    ctx.font = font(700, 15 * k, 'mono');
    ctx.fillText('Camera', s.x + 22 * k, ly);
    const w = ctx.measureText('Camera').width;
    ctx.font = font(400, 15 * k, 'mono');
    ctx.fillStyle = DIM;
    ctx.fillText(`(shot_${i + 1}.jpg)`, s.x + 22 * k + w, ly);
    // result line with the ⎿ elbow
    const ry = s.y + s.h + (n ? 26 : 34);
    ctx.strokeStyle = FAINT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(s.x + 10, ry - 20 * k);
    ctx.lineTo(s.x + 10, ry - 7 * k);
    ctx.lineTo(s.x + 22 * k, ry - 7 * k);
    ctx.stroke();
    ctx.fillStyle = DIM;
    ctx.font = font(400, 14 * k, 'mono');
    ctx.fillText('已保存 · 微笑检测通过', s.x + 30 * k, ry);
    ctx.restore();
  },

  over(ctx, L, G, info) {
    const n = isNarrow(L);
    const k = n ? 1 : 1.4;
    const bx = n ? 22 : 44;
    const y0 = L.H - G.bottom + (n ? 34 : 46);
    drawSpark(ctx, bx + 12 * k, y0 - 6 * k, 9 * k, { t: 1.2 });
    ctx.fillStyle = ORANGE;
    ctx.font = font(400, 15 * k, 'mono');
    ctx.fillText(`Smiling… (${L.count}s · esc to interrupt)`, bx + 30 * k, y0);
    const iy = y0 + (n ? 20 : 26), ih = n ? 54 : 72;
    ctx.strokeStyle = '#4a4742';
    ctx.lineWidth = 2;
    ctx.beginPath();
    roundRect(ctx, bx, iy, L.W - bx * 2, ih, n ? 10 : 14);
    ctx.stroke();
    ctx.fillStyle = FG;
    ctx.font = font(400, 17 * k, 'mono');
    ctx.fillText('>', bx + 18 * k, iy + ih / 2 + 6 * k);
    ctx.fillRect(bx + 40 * k, iy + ih / 2 - 11 * k, 11 * k, 22 * k);
    ctx.fillStyle = FAINT;
    ctx.font = font(400, 12 * k, 'mono');
    ctx.fillText('? for shortcuts', bx + 4, iy + ih + (n ? 24 : 32));
  },
};
