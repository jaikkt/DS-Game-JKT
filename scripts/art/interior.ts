/** Café interior furniture. */
import { Img, hex, shade, hash2 } from './pixel';
import { windowGlass, outlineDark, leafCluster, groundShadow } from './draw';
import { miniText } from './buildings';

export function iWall(): Img {
  const W = 192, H = 32;
  const im = new Img(W, H);
  // plaster upper wall
  for (let y = 0; y < 22; y++)
    for (let x = 0; x < W; x++) {
      let c = hex('#f0e2c4');
      if (hash2(x, y, 9) < 0.04) c = hex('#e4d4b4');
      im.put(x, y, c);
    }
  im.hline(0, 0, W, hex('#8a5a34'));
  im.hline(0, 1, W, hex('#b07a48'));
  // wood wainscot
  for (let y = 22; y < 32; y++)
    for (let x = 0; x < W; x++) {
      let c = x % 8 === 0 ? hex('#6a4024') : hex('#8a5a34');
      if (y === 22) c = hex('#c08a50');
      if (y === 31) c = hex('#4a2c18');
      im.put(x, y, c);
    }
  // windows (tile 2 & 1)
  for (const wx of [18, 140]) {
    windowGlass(im, wx, 5, 26, 15, { frame: hex('#f8f4ec'), glass: hex('#78b8e8'), panes: 'cross', sill: hex('#c8a878') });
    // hint of the town outside
    im.rect(wx + 1, 14, 24, 5, hex('#70c890'));
    im.rect(wx + 3, 11, 4, 4, hex('#c85a3a'));
  }
  // photo frame (tile 10)
  im.rect(160 + 8 - 18, 6, 0, 0, 0);
  // chalk menu board (tiles 6-7 → px 96..127)
  im.rect(94, 3, 36, 18, hex('#6a4024'));
  im.rect(96, 5, 32, 14, hex('#2a3a30'));
  miniText(im, 112, 6, 'MENU', hex('#f8f0d0'), true);
  for (let j = 0; j < 3; j++) {
    im.hline(99, 12 + j * 2, 14 - j * 3, hex('#c8d8c8'));
    im.hline(117, 12 + j * 2, 8, hex('#e8c060'));
  }
  // framed mountains (tile 10)
  const fx = 177;
  im.rect(fx, 4, 14, 14, hex('#c8a050'));
  im.rect(fx + 2, 6, 10, 10, hex('#a8d0f0'));
  for (let i = 0; i < 10; i++) {
    const h = Math.round(4 + Math.sin(i * 0.9) * 2 + (i > 5 ? 1 : 0));
    im.vline(fx + 2 + i, 16 - h, h, hex('#4a6a9a'));
    im.put(fx + 2 + i, 16 - h, hex('#f8f8ff'));
  }
  // clock (tile 4)
  im.ellipse(72, 10, 5, 5, hex('#6a4024'));
  im.ellipse(72, 10, 3.8, 3.8, hex('#f8f4e8'));
  im.line(72, 10, 72, 7, hex('#202020'));
  im.line(72, 10, 74, 11, hex('#202020'));
  // string lights
  for (let x = 2; x < W; x += 6) {
    const y = 2 + Math.round(Math.sin(x / 12) * 1.5 + 1.5);
    im.put(x, y, x % 12 ? hex('#ffe070') : hex('#ff9070'));
  }
  return im;
}

export function iCounter(): Img {
  const W = 80, H = 32;
  const im = new Img(W, H);
  // counter top
  im.rect(0, 2, W, 10, hex('#d8b07a'));
  im.hline(0, 2, W, hex('#f0d0a0'));
  im.hline(0, 11, W, hex('#a07a48'));
  // front panel
  for (let y = 12; y < 30; y++) for (let x = 0; x < W; x++) im.put(x, y, x % 10 === 0 ? hex('#5a3a22') : y === 12 ? hex('#8a5a34') : hex('#7a4a2c'));
  im.hline(0, 29, W, hex('#3a2416'));
  // espresso machine
  im.rect(4, -0 + 0, 18, 9, hex('#c8ccd4'));
  im.hline(4, 0, 18, hex('#f0f4f8'));
  im.rect(7, 3, 4, 4, hex('#303038'));
  im.rect(14, 3, 4, 4, hex('#303038'));
  im.put(8, 8, hex('#6a4024'));
  // chai urn
  im.ellipse(34, 5, 6, 5, hex('#d8a040'));
  im.ellipse(32, 3, 2.5, 1.5, hex('#f8e090'));
  im.rect(33, 9, 3, 2, hex('#a07020'));
  // cups
  for (const x of [44, 49]) { im.rect(x, 6, 4, 4, hex('#f8f8f8')); im.put(x + 1, 6, hex('#8a5a34')); }
  // pastry case
  im.rect(56, 0, 22, 11, hex('#c8e4f0'));
  im.rect(57, 6, 20, 4, hex('#f8f0e0'));
  for (let x = 58; x < 76; x += 4) { im.rect(x, 7, 3, 2, x % 8 ? hex('#c88a40') : hex('#e8c060')); }
  im.hline(56, 0, 22, hex('#ffffff'));
  outlineDark(im, -0.6);
  return im;
}

export function iTable(): Img {
  const im = new Img(32, 16);
  groundShadow(im, 17, 14, 14, 2, 70);
  const p = new Img(32, 16);
  p.rect(2, 2, 28, 8, hex('#a8703c'));
  p.hline(2, 2, 28, hex('#d09858'));
  p.rect(2, 10, 28, 2, hex('#6a4024'));
  p.rect(4, 12, 2, 3, hex('#5a3420'));
  p.rect(26, 12, 2, 3, hex('#5a3420'));
  for (const x of [8, 20]) { p.rect(x, 4, 4, 4, hex('#f8f8f8')); p.rect(x + 1, 5, 2, 2, hex('#7a4a2c')); }
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function iChair(): Img {
  const im = new Img(16, 16);
  const p = new Img(16, 16);
  p.rect(3, 6, 10, 5, hex('#3a7a5a'));
  p.hline(3, 6, 10, hex('#5aa07a'));
  p.rect(4, 11, 2, 4, hex('#5a3420'));
  p.rect(10, 11, 2, 4, hex('#5a3420'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function iPlant(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 8.5, 30, 6, 1.5, 70);
  const p = new Img(16, 32);
  p.rect(4, 22, 8, 8, hex('#c86a3a'));
  p.hline(4, 22, 8, hex('#e88a5a'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  const l = new Img(16, 32);
  leafCluster(l, [[5, 12, 4], [11, 12, 4], [8, 7, 4.5], [8, 17, 4.5], [4, 18, 3]], { base: hex('#48a058'), light: hex('#78c870'), dark: hex('#2e7044'), deep: hex('#1e4a30') });
  outlineDark(l, -0.65);
  im.blit(l, 0, 0);
  return im;
}

export function iShelf(): Img {
  const im = new Img(32, 32);
  im.rect(1, 0, 30, 31, hex('#6a4024'));
  im.rect(3, 2, 26, 27, hex('#3a2416'));
  for (const sy of [10, 19, 28]) im.hline(3, sy, 26, hex('#8a5a34'));
  const cols = ['#c04040', '#4070c0', '#e0b040', '#40a070', '#a050a0', '#e08040', '#f0f0e0'];
  for (const sy of [3, 12, 21]) for (let x = 4; x < 28; x += 3) {
    const h = 5 + Math.floor(hash2(x, sy, 3) * 3);
    im.rect(x, sy + 7 - h, 2, h, hex(cols[Math.floor(hash2(x, sy, 5) * cols.length)]));
  }
  outlineDark(im, -0.6);
  return im;
}

export function iSofa(): Img {
  const im = new Img(48, 16);
  groundShadow(im, 25, 15, 22, 1.5, 70);
  const p = new Img(48, 16);
  p.rect(2, 1, 44, 6, hex('#2e7050'));
  p.hline(2, 1, 44, hex('#4a9a70'));
  p.rect(2, 7, 44, 6, hex('#3a8a60'));
  p.hline(2, 7, 44, hex('#5aaa80'));
  p.vline(17, 7, 6, hex('#2e7050'));
  p.vline(31, 7, 6, hex('#2e7050'));
  p.rect(0, 3, 3, 10, hex('#2a6048'));
  p.rect(45, 3, 3, 10, hex('#2a6048'));
  p.rect(36, 3, 6, 5, hex('#e8c060'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function iRadio(): Img {
  const im = new Img(16, 32);
  const p = new Img(16, 32);
  p.rect(2, 18, 12, 12, hex('#8a5a34'));
  p.hline(2, 18, 12, hex('#b07a48'));
  p.rect(4, 22, 8, 6, hex('#6a4024'));
  p.ellipse(8, 15, 5.5, 2.5, hex('#202020'));
  p.ellipse(8, 15, 2, 1, hex('#c04040'));
  // horn
  for (let k = 0; k < 7; k++) p.hline(9 + Math.floor(k / 2), 3 + k, 1 + k, shade(hex('#d8a040'), k % 2 ? -0.1 : 0.1));
  p.line(9, 10, 9, 14, hex('#a07020'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}
