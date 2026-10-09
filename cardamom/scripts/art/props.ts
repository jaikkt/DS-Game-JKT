/** Vegetation and street furniture. Every function returns an image sized to its prefab. */
import { Img, hex, shade, Color, hash2, mix } from './pixel';
import { leafCluster, outlineDark, groundShadow, OUT } from './draw';

const leafPal = { base: hex('#48a058'), light: hex('#78c870'), dark: hex('#2e7044'), deep: hex('#1e4a30') };
const leafPalDark = { base: hex('#3a8a58'), light: hex('#5cb070'), dark: hex('#24603e'), deep: hex('#183c2a') };

export function tree(dark = false): Img {
  const im = new Img(32, 48);
  groundShadow(im, 17, 43, 13, 4, 70);
  const trunk = new Img(32, 48);
  trunk.rect(13, 32, 6, 10, hex('#8a5a34'));
  trunk.vline(13, 32, 10, hex('#a8744a'));
  trunk.vline(18, 32, 10, hex('#5e3a22'));
  trunk.put(12, 41, hex('#8a5a34'));
  trunk.put(19, 41, hex('#6e4428'));
  trunk.hline(14, 36, 2, hex('#6e4428'));
  outlineDark(trunk, -0.6);
  im.blit(trunk, 0, 0);
  const can = new Img(32, 48);
  leafCluster(
    can,
    [
      [10, 12, 7], [22, 12, 7], [16, 7, 7.5],
      [6.5, 20, 6.5], [25.5, 20, 6.5], [16, 17, 9],
      [10, 27, 7], [22, 27, 7], [16, 29, 6.5],
    ],
    dark ? leafPalDark : leafPal,
  );
  outlineDark(can, -0.65);
  im.blit(can, 0, 0);
  return im;
}

export function treeSmall(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 8.5, 28, 7, 2.5, 70);
  im.rect(7, 22, 3, 6, hex('#7a4a2c'));
  im.vline(7, 22, 6, hex('#9a6a40'));
  const can = new Img(16, 32);
  leafCluster(can, [[5, 12, 4.5], [11, 12, 4.5], [8, 8, 5], [8, 16, 5.5]], leafPal);
  outlineDark(can, -0.65);
  outlineDark(im, -0.6);
  im.blit(can, 0, 0);
  return im;
}

export function bush(): Img {
  const im = new Img(16, 16);
  groundShadow(im, 8.5, 13, 7.5, 2.5, 60);
  const b = new Img(16, 16);
  leafCluster(b, [[5, 9, 4.5], [11, 9, 4.5], [8, 6, 5]], { ...leafPal, base: hex('#50a860') });
  outlineDark(b, -0.65);
  im.blit(b, 0, 0);
  return im;
}

export function hedge(): Img {
  const im = new Img(16, 16);
  const b = new Img(16, 16);
  leafCluster(b, [[3, 8, 4.5], [8, 7, 5], [13, 8, 4.5], [8, 10, 5]], { ...leafPal, base: hex('#4a9c58') });
  outlineDark(b, -0.65);
  im.blit(b, 0, 0);
  return im;
}

function frond(im: Img, cx: number, cy: number, ang: number, len: number, droop: number, pal: { base: Color; light: Color; dark: Color }) {
  let px = cx, py = cy;
  for (let s = 1; s <= len; s++) {
    const t = s / len;
    const x = cx + Math.cos(ang) * s;
    const y = cy + Math.sin(ang) * s + droop * t * t * len * 0.5;
    const dx = x - px, dy = y - py;
    const nl = Math.hypot(dx, dy) || 1;
    const nx = -dy / nl, ny = dx / nl;
    const leaf = Math.max(1, Math.round((1 - t * 0.7) * 4));
    for (let k = -leaf; k <= leaf; k++) {
      const lx = x + nx * k - dx * Math.abs(k) * 0.45;
      const ly = y + ny * k - dy * Math.abs(k) * 0.45 + Math.abs(k) * 0.35;
      const c = Math.abs(k) === leaf ? pal.dark : k < 0 ? pal.light : pal.base;
      im.put(Math.round(lx), Math.round(ly), c);
    }
    im.put(Math.round(x), Math.round(y), shade(pal.base, -0.1));
    px = x;
    py = y;
  }
}

export function palm(): Img {
  const W = 48, H = 64;
  const im = new Img(W, H);
  groundShadow(im, 26, 60, 9, 3, 70);
  // trunk: gently curved, ringed
  const trunk = new Img(W, H);
  for (let y = 18; y <= 61; y++) {
    const t = (61 - y) / 43;
    const x = Math.round(24 + Math.sin(t * 2.2) * 3 - t * 2);
    const wdt = t > 0.85 ? 3 : 4;
    for (let i = 0; i < wdt; i++) {
      let c = i === 0 ? hex('#c09868') : i === wdt - 1 ? hex('#7a5634') : hex('#a07a4c');
      if (y % 4 === 0) c = shade(c, -0.25);
      trunk.put(x - 1 + i, y, c);
    }
  }
  outlineDark(trunk, -0.6);
  im.blit(trunk, 0, 0);
  // crown
  const crown = new Img(W, H);
  const pal = { base: hex('#4ca24c'), light: hex('#86d06a'), dark: hex('#2a6c36') };
  const cx = 21, cy = 17;
  const fronds: [number, number, number][] = [
    [-2.9, 17, 0.9], [-2.3, 16, 0.5], [-1.6, 12, 0.1], [-1.1, 12, 0.1], [-0.4, 16, 0.5], [0.2, 18, 0.9],
    [2.6, 13, 0.6], [0.9, 14, 0.8], [2.0, 12, 0.9],
  ];
  for (const [a, l, d] of fronds) frond(crown, cx, cy, a, l, d * 1.4, pal);
  // coconuts
  for (const [x, y] of [[19, 19], [22, 20], [24, 18], [20, 21]] as const) {
    crown.rect(x, y, 3, 3, hex('#6a7a2c'));
    crown.put(x, y, hex('#9aa848'));
  }
  outlineDark(crown, -0.62);
  im.blit(crown, 0, 0);
  return im;
}

export function banana(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 8.5, 29, 6, 2, 60);
  const p = new Img(16, 32);
  p.rect(7, 18, 2, 11, hex('#8aa040'));
  p.vline(7, 18, 11, hex('#a8c060'));
  const leaf = (x0: number, y0: number, dir: number, len: number) => {
    for (let i = 0; i < len; i++) {
      const x = x0 + dir * i, y = y0 - Math.round(Math.sin((i / len) * Math.PI) * 4) + Math.floor(i / 3);
      for (let k = -2; k <= 2; k++) p.put(x, y + k, k === 0 ? hex('#3e8a3a') : k < 0 ? hex('#7cc85c') : hex('#58a848'));
    }
  };
  leaf(8, 14, -1, 8);
  leaf(8, 12, 1, 8);
  leaf(8, 8, -1, 6);
  leaf(8, 7, 1, 6);
  p.rect(7, 3, 2, 6, hex('#68b850'));
  outlineDark(p, -0.62);
  im.blit(p, 0, 0);
  return im;
}

export function flowers(petal: Color, petalL: Color): Img {
  const im = new Img(32, 16);
  for (let f = 0; f < 2; f++) {
    const spots: [number, number][] = [[3, 3], [10, 2], [6, 8], [12, 9], [2, 12], [9, 13]];
    spots.forEach(([x, y], i) => {
      const sway = f === 1 && i % 2 === 0 ? 1 : 0;
      const ox = f * 16 + x + sway;
      im.put(f * 16 + x, y + 2, hex('#3a9050'));
      im.put(ox, y - 1, petal);
      im.put(ox - 1, y, petal);
      im.put(ox + 1, y, petal);
      im.put(ox, y + 1, petal);
      im.put(ox, y, f === 0 ? hex('#f8f0a0') : petalL);
      im.put(ox + 1, y - 1, petalL);
    });
  }
  return im;
}

// ───────────── street furniture ─────────────
export function lamp(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 9, 29, 4, 1.5, 70);
  const p = new Img(16, 32);
  p.rect(7, 9, 2, 19, hex('#3a4a5a'));
  p.vline(7, 9, 19, hex('#5a6c80'));
  p.rect(5, 27, 6, 2, hex('#2e3a48'));
  p.rect(6, 25, 4, 2, hex('#3a4a5a'));
  // lantern head
  p.rect(4, 3, 8, 6, hex('#3a4a5a'));
  p.rect(5, 4, 6, 4, hex('#f8f0b0'));
  p.rect(5, 4, 3, 2, hex('#fffff0'));
  p.hline(3, 2, 10, hex('#2e3a48'));
  p.hline(5, 1, 6, hex('#2e3a48'));
  p.put(7, 0, hex('#2e3a48'));
  p.put(8, 0, hex('#2e3a48'));
  outlineDark(p, -0.5);
  im.blit(p, 0, 0);
  return im;
}

export function globeLamp(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 9, 29, 4, 1.5, 70);
  const p = new Img(16, 32);
  p.rect(7, 9, 2, 19, hex('#2c5a3a'));
  p.vline(7, 9, 19, hex('#4a8a5a'));
  p.rect(5, 26, 6, 3, hex('#244a30'));
  p.ellipse(8, 5, 4.5, 4.5, hex('#58c070'));
  p.ellipse(7, 4, 2.5, 2.5, hex('#a8f0b0'));
  p.put(6, 3, hex('#ffffff'));
  outlineDark(p, -0.55);
  im.blit(p, 0, 0);
  return im;
}

export function bench(): Img {
  const im = new Img(32, 16);
  const p = new Img(32, 16);
  // backrest
  p.rect(2, 2, 28, 3, hex('#b0743c'));
  p.hline(2, 2, 28, hex('#d09050'));
  // seat
  p.rect(2, 7, 28, 4, hex('#c48448'));
  p.hline(2, 7, 28, hex('#e0a868'));
  p.hline(2, 10, 28, hex('#8a5a30'));
  // iron legs
  for (const x of [3, 27]) {
    p.rect(x, 2, 2, 12, hex('#3a3a44'));
  }
  outlineDark(p, -0.55);
  im.blit(p, 0, 0);
  im.hline(4, 15, 26, hex('#203020', 60));
  return im;
}

export function sign(): Img {
  const im = new Img(16, 16);
  const p = new Img(16, 16);
  p.rect(7, 9, 2, 6, hex('#7a4a2c'));
  p.rect(2, 2, 12, 8, hex('#b07440'));
  p.rect(3, 3, 10, 6, hex('#d8a060'));
  p.hline(4, 4, 8, hex('#9a6034'));
  p.hline(4, 6, 6, hex('#9a6034'));
  p.hline(3, 3, 10, hex('#e8b878'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function postbox(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 9, 29, 5, 1.6, 70);
  const p = new Img(16, 32);
  p.rect(4, 12, 8, 16, hex('#d02a2a'));
  p.vline(4, 12, 16, hex('#f05050'));
  p.vline(5, 12, 16, hex('#e04040'));
  p.vline(11, 12, 16, hex('#901818'));
  p.ellipse(8, 12, 4.6, 3, hex('#d83030'));
  p.ellipse(7, 11, 2, 1.2, hex('#ff7070'));
  p.rect(3, 26, 10, 2, hex('#3a3a44'));
  p.rect(6, 15, 4, 1, hex('#2a1010'));
  p.rect(6, 18, 4, 2, hex('#f0d060'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function hydrant(): Img {
  const im = new Img(16, 16);
  groundShadow(im, 9, 14, 4, 1.4, 70);
  const p = new Img(16, 16);
  p.rect(5, 5, 6, 9, hex('#d83838'));
  p.vline(5, 5, 9, hex('#ff6868'));
  p.vline(10, 5, 9, hex('#981c1c'));
  p.rect(6, 2, 4, 3, hex('#d83838'));
  p.rect(3, 7, 10, 2, hex('#c02828'));
  p.rect(4, 13, 8, 2, hex('#a82020'));
  p.put(7, 2, hex('#ff9090'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function trash(): Img {
  const im = new Img(16, 16);
  groundShadow(im, 9, 14, 5, 1.5, 70);
  const p = new Img(16, 16);
  p.rect(3, 4, 10, 10, hex('#4a8a58'));
  for (let x = 4; x < 13; x += 2) p.vline(x, 5, 9, hex('#3a6a46'));
  p.vline(3, 4, 10, hex('#70b080'));
  p.rect(2, 2, 12, 3, hex('#5a9a68'));
  p.hline(2, 2, 12, hex('#80c090'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function bollard(): Img {
  const im = new Img(16, 16);
  groundShadow(im, 9, 13, 4, 1.4, 60);
  const p = new Img(16, 16);
  p.rect(6, 4, 4, 9, hex('#c8c0b8'));
  p.vline(6, 4, 9, hex('#f0ece8'));
  p.vline(9, 4, 9, hex('#8a847e'));
  p.hline(6, 6, 4, hex('#e0b040'));
  p.ellipse(8, 4, 2.2, 1.4, hex('#e8e4e0'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function planterTree(): Img {
  const im = new Img(16, 32);
  const p = new Img(16, 32);
  p.rect(2, 24, 12, 6, hex('#a09890'));
  p.hline(2, 24, 12, hex('#d0c8c0'));
  p.rect(4, 25, 8, 2, hex('#5a4030'));
  p.rect(7, 18, 2, 7, hex('#7a4a2c'));
  outlineDark(p, -0.55);
  im.blit(p, 0, 0);
  const can = new Img(16, 32);
  leafCluster(can, [[5, 10, 4.5], [11, 10, 4.5], [8, 6, 5], [8, 14, 5]], leafPal);
  outlineDark(can, -0.65);
  im.blit(can, 0, 0);
  return im;
}

export function fenceIron(): Img {
  const im = new Img(16, 16);
  const c = hex('#30303c'), l = hex('#5a5a6a');
  im.hline(0, 5, 16, c);
  im.hline(0, 12, 16, c);
  for (let x = 1; x < 16; x += 3) {
    im.vline(x, 3, 11, c);
    im.put(x, 2, l);
  }
  im.hline(0, 14, 16, hex('#203020', 60));
  return im;
}

export function fenceWood(): Img {
  const im = new Img(16, 16);
  const p = new Img(16, 16);
  p.rect(1, 2, 3, 12, hex('#b07a44'));
  p.rect(12, 2, 3, 12, hex('#b07a44'));
  p.vline(1, 2, 12, hex('#d0a060'));
  p.vline(12, 2, 12, hex('#d0a060'));
  p.rect(0, 5, 16, 2, hex('#c08a50'));
  p.rect(0, 10, 16, 2, hex('#a06a3a'));
  p.hline(0, 5, 16, hex('#e0b070'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function barrier(): Img {
  const im = new Img(16, 16);
  const p = new Img(16, 16);
  for (let x = 0; x < 16; x++) for (let y = 4; y < 9; y++) p.put(x, y, Math.floor((x + y) / 3) % 2 ? hex('#f0f0f0') : hex('#e04030'));
  p.rect(2, 9, 2, 5, hex('#606068'));
  p.rect(12, 9, 2, 5, hex('#606068'));
  p.rect(6, 1, 4, 3, hex('#f0a020'));
  p.put(7, 1, hex('#fff0a0'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function rock(): Img {
  const im = new Img(16, 16);
  const p = new Img(16, 16);
  p.ellipse(8, 9, 6.5, 5, hex('#8a8a96'));
  p.ellipse(7, 8, 4.5, 3.5, hex('#a8a8b4'));
  p.ellipse(6, 6.5, 2.2, 1.6, hex('#d0d0dc'));
  p.hline(4, 12, 9, hex('#686874'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  // water ring
  for (let x = 1; x < 15; x++) if (x % 3 !== 0) im.set(x, 15, hex('#f0f8ff', 160));
  return im;
}

export function canoe(): Img {
  const im = new Img(32, 16);
  const p = new Img(32, 16);
  for (let x = 2; x < 30; x++) {
    const t = Math.abs(x - 15.5) / 14;
    const top = 5 + Math.round(t * t * 3);
    for (let y = top; y <= 11 - Math.round(t * 2); y++) p.put(x, y, y === top ? hex('#d0a068') : y > 9 ? hex('#6a4024') : hex('#9a6034'));
    if (y0(x)) p.put(x, top + 1, hex('#5a3820'));
  }
  p.rect(14, 6, 4, 2, hex('#7a4a28'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  for (let x = 3; x < 29; x += 2) im.set(x, 13, hex('#e8f4ff', 140));
  return im;
}
const y0 = (x: number) => x > 4 && x < 27;

export function hotdogCart(): Img {
  const im = new Img(32, 32);
  groundShadow(im, 17, 29, 13, 2.5, 70);
  const p = new Img(32, 32);
  // cart body
  p.rect(4, 18, 24, 9, hex('#e8e8ec'));
  p.hline(4, 18, 24, hex('#ffffff'));
  p.rect(4, 22, 24, 2, hex('#d03030'));
  p.rect(4, 26, 24, 1, hex('#9898a0'));
  p.rect(6, 19, 8, 3, hex('#c0c0c8'));
  p.rect(16, 19, 10, 2, hex('#f0c050'));
  // wheels
  p.ellipse(9, 28, 2.5, 2.5, hex('#303038'));
  p.ellipse(23, 28, 2.5, 2.5, hex('#303038'));
  // umbrella pole + canopy
  p.vline(16, 7, 11, hex('#606068'));
  for (let j = 0; j < 7; j++) {
    const hw = 4 + j * 2;
    for (let i = -hw; i <= hw; i++) p.put(16 + i, 2 + j, Math.floor((i + 40) / 4) % 2 ? hex('#f0d040') : hex('#e04030'));
  }
  for (let i = -16; i <= 15; i++) if ((i + 16) % 4 < 2) p.put(16 + i, 9, Math.floor((i + 40) / 4) % 2 ? hex('#d0b030') : hex('#b02820'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function taxi(): Img {
  const im = new Img(32, 32);
  groundShadow(im, 17, 27, 15, 4, 80);
  const p = new Img(32, 32);
  const y = hex('#f8c828'), yd = hex('#d09a10'), yl = hex('#fff070');
  // lower body (side visible), roof & windows from above-front
  p.rect(1, 13, 30, 12, y);
  p.hline(1, 13, 30, yl);
  p.rect(1, 21, 30, 4, yd);
  p.hline(1, 18, 30, hex('#202020'));
  for (let x = 2; x < 30; x += 2) p.put(x, 18, x % 4 ? hex('#202020') : hex('#f0f0f0'));
  // cabin
  p.rect(7, 5, 18, 9, y);
  p.rect(8, 6, 16, 7, hex('#4a6a88'));
  p.rect(8, 6, 7, 3, hex('#9ac8e8'));
  p.vline(15, 6, 7, y);
  p.rect(13, 2, 6, 3, hex('#f0f0f0'));
  p.hline(13, 2, 6, hex('#ffffff'));
  p.rect(14, 3, 4, 1, hex('#202020'));
  // wheels
  for (const wx of [7, 25]) {
    p.ellipse(wx, 25, 3.2, 3, hex('#28282c'));
    p.ellipse(wx, 25, 1.3, 1.2, hex('#a0a0a8'));
  }
  // lights
  p.rect(29, 15, 2, 2, hex('#fff8d0'));
  p.rect(1, 15, 2, 2, hex('#e04040'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function newsstand(): Img {
  const im = new Img(32, 32);
  groundShadow(im, 17, 30, 15, 2.5, 70);
  const p = new Img(32, 32);
  p.rect(2, 4, 28, 5, hex('#2a6a4a'));
  p.hline(2, 4, 28, hex('#4a9a6a'));
  p.rect(3, 9, 26, 19, hex('#3a7a58'));
  p.rect(5, 11, 22, 9, hex('#f0ece0'));
  // magazines
  const cols = ['#e05050', '#4080d0', '#f0c040', '#a050c0', '#50b070', '#f08040'];
  for (let i = 0; i < 6; i++) {
    p.rect(6 + i * 3 + (i > 2 ? 1 : 0), 12, 3, 4, hex(cols[i]));
    p.rect(6 + i * 3 + (i > 2 ? 1 : 0), 16, 3, 3, hex(cols[(i + 3) % 6]));
  }
  p.rect(5, 21, 22, 6, hex('#2a5a40'));
  for (let i = 0; i < 5; i++) p.hline(6, 22 + i, 20, i % 2 ? hex('#e8e0d0') : hex('#c8c0b0'));
  p.rect(10, 5, 12, 3, hex('#f8f0d0'));
  p.hline(11, 6, 10, hex('#203020'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function subway(): Img {
  const im = new Img(32, 32);
  // stairwell opening going down (southward), railings on both sides
  im.rect(4, 4, 24, 26, hex('#5a5a64'));
  for (let j = 0; j < 22; j++) {
    const c = mix(hex('#a8a8b0'), hex('#202028'), j / 22);
    im.hline(6, 6 + j, 20, j % 3 === 2 ? shade(c, -0.3) : c);
  }
  // tiled side walls
  im.rect(4, 4, 2, 26, hex('#e8e8e0'));
  im.rect(26, 4, 2, 26, hex('#c8c8c0'));
  // railings
  const g = hex('#2c6a42');
  im.rect(2, 2, 2, 28, g);
  im.rect(28, 2, 2, 28, g);
  im.rect(2, 2, 28, 2, g);
  im.vline(2, 2, 28, hex('#4a9a62'));
  im.hline(2, 2, 28, hex('#4a9a62'));
  // sign plate
  im.rect(9, 0, 14, 4, hex('#202024'));
  im.hline(10, 1, 12, hex('#f0f0f0'));
  im.put(12, 2, hex('#f0f0f0'));
  im.put(19, 2, hex('#f0f0f0'));
  outlineDark(im, -0.6);
  return im;
}

export function phoneBooth(): Img {
  const im = new Img(16, 32);
  groundShadow(im, 9, 30, 6, 1.6, 70);
  const p = new Img(16, 32);
  p.rect(2, 6, 12, 23, hex('#b8bcc4'));
  p.rect(3, 9, 10, 14, hex('#7ab0d8'));
  p.rect(3, 9, 4, 6, hex('#b8e0f8'));
  p.rect(2, 3, 12, 4, hex('#2a4a8a'));
  p.hline(3, 4, 10, hex('#f0f0f0'));
  p.rect(6, 15, 4, 5, hex('#404048'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export { OUT, hash2 };
