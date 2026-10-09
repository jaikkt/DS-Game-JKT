/** Buildings & landmarks in HGSS 3/4 view: roof on top, facade facing south. */
import { Img, hex, shade, Color, mix, hash2, rng } from './pixel';
import {
  stoneWall, brickWall, plaster, windowGlass, door, awning, terracottaRoof, flatRoof, slateRoof,
  pointedRoof, stairs, outlineDark, groundShadow, leafCluster,
} from './draw';

// ───────────── 3×5 signage font ─────────────
const MINI: Record<string, string> = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', K: '101101110101101',
  L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100',
  R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010',
  Y: '101101010010010', Z: '111001010100111', W: '101101111111101', ' ': '000000000000000', '-': '000000111000000',
  '.': '000000000000010', '&': '010101010101011', "'": '010010000000000',
};
export function miniText(im: Img, x: number, y: number, s: string, c: Color, center = false) {
  const w = s.length * 4 - 1;
  let xx = center ? Math.round(x - w / 2) : x;
  for (const ch of s.toUpperCase()) {
    const g = MINI[ch] ?? MINI[' '];
    for (let j = 0; j < 5; j++) for (let i = 0; i < 3; i++) if (g[j * 3 + i] === '1') im.put(xx + i, y + j, c);
    xx += 4;
  }
}
function signBoard(im: Img, x: number, y: number, w: number, h: number, bg: Color, fg: Color, text: string) {
  im.rect(x, y, w, h, bg);
  im.hline(x, y, w, shade(bg, 0.3));
  im.hline(x, y + h - 1, w, shade(bg, -0.35));
  im.strokeRect(x - 1, y - 1, w + 2, h + 2, shade(bg, -0.6));
  miniText(im, x + w / 2, y + Math.floor((h - 5) / 2), text, fg, true);
}

const eaveShadow = (im: Img, x: number, y: number, w: number, h = 2) => {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) im.set(x + i, y + j, hex('#201420', 90 - j * 30));
};

// ───────────── Kerala houses ─────────────
function lateriteBase(im: Img, x: number, y: number, w: number, h: number) {
  const r = rng(x * 7 + y);
  im.rect(x, y, w, h, hex('#7a3a24'));
  for (let yy = 0; yy < h; yy += 3) {
    const off = (yy / 3) % 2 ? 4 : 0;
    for (let xx = -off; xx < w; xx += 8) {
      const c = r.pick([hex('#b65a38'), hex('#a8502e'), hex('#c4683e')]);
      for (let i = 0; i < 7; i++) for (let j = 0; j < 2; j++) {
        const px = x + xx + i, py = y + yy + j;
        if (px >= x && px < x + w && py < y + h) im.put(px, py, j === 0 ? shade(c, 0.12) : c);
      }
      if (r.chance(0.4)) im.put(x + xx + 3, y + yy + 1, hex('#8a4024'));
    }
  }
}
function woodBarWindow(im: Img, x: number, y: number, w: number, h: number, frame = hex('#6a4024')) {
  im.rect(x, y, w, h, frame);
  im.rect(x + 1, y + 1, w - 2, h - 2, hex('#2a2030'));
  for (let i = x + 2; i < x + w - 1; i += 2) im.vline(i, y + 1, h - 2, hex('#8a5a34'));
  im.hline(x - 1, y - 1, w + 2, shade(frame, -0.4));
  im.hline(x - 1, y + h, w + 2, hex('#e8e0d0'));
  im.hline(x - 1, y + h + 1, w + 2, hex('#a09888'));
}
function shutters(im: Img, x: number, y: number, h: number, c: Color) {
  for (const sx of [x - 4, x + 0]) {
    void sx;
  }
  im.rect(x, y, 3, h, c);
  im.vline(x, y, h, shade(c, 0.25));
  for (let j = y + 1; j < y + h; j += 2) im.hline(x, j, 3, shade(c, -0.25));
}

export function keralaHouse(variant: 0 | 1): Img {
  const W = variant ? 96 : 80, H = 80;
  const im = new Img(W, H);
  const wall = variant ? hex('#bfe0d0') : hex('#f2ece0');
  const trim = variant ? hex('#f4f0e8') : hex('#c8b898');
  // facade
  plaster(im, 3, 44, W - 6, 30, wall);
  // veranda floor + laterite plinth
  lateriteBase(im, 1, 72, W - 2, 8);
  im.hline(1, 72, W - 2, hex('#e8d8c0'));
  im.hline(1, 73, W - 2, hex('#c8b8a0'));
  // door
  const dx = 2 * 16 + 3;
  door(im, dx, 56, 10, 16, hex('#8a4a28'), { double: true, knob: hex('#f0c850') });
  im.rect(dx - 2, 54, 14, 2, trim);
  // windows
  const winY = 54;
  woodBarWindow(im, 9, winY, 12, 10);
  shutters(im, 6, winY, 10, variant ? hex('#3a7a8a') : hex('#3a8a6a'));
  shutters(im, 21, winY, 10, variant ? hex('#3a7a8a') : hex('#3a8a6a'));
  const wx2 = W - 22;
  woodBarWindow(im, wx2, winY, 12, 10);
  shutters(im, wx2 - 3, winY, 10, variant ? hex('#3a7a8a') : hex('#3a8a6a'));
  shutters(im, wx2 + 12, winY, 10, variant ? hex('#3a7a8a') : hex('#3a8a6a'));
  if (variant) {
    woodBarWindow(im, 54, winY, 10, 10);
  }
  // veranda columns
  for (const cx of variant ? [4, 30, 50, W - 6] : [4, 28, 50, W - 6]) {
    im.rect(cx, 46, 3, 26, hex('#7a4a28'));
    im.vline(cx, 46, 26, hex('#a06a3c'));
    im.rect(cx - 1, 70, 5, 2, hex('#5a3420'));
  }
  // roof
  terracottaRoof(im, 0, 2, W, 44, { gablet: true, base: variant ? hex('#b84e34') : hex('#cc5c3a') });
  eaveShadow(im, 3, 46, W - 6, 3);
  // steps
  stairs(im, dx - 1, 74, 12, 6, hex('#d8d0c4'));
  // potted plant + lamp details
  im.rect(W - 13, 66, 6, 6, hex('#c86a3a'));
  leafSmall(im, W - 10, 63);
  outlineDark(im, -0.6);
  return im;
}
function leafSmall(im: Img, cx: number, cy: number) {
  const tmp = new Img(12, 12);
  leafCluster(tmp, [[4, 6, 3], [7, 5, 3.4], [6, 8, 3]], { base: hex('#4aa050'), light: hex('#7cc870'), dark: hex('#2e7040'), deep: hex('#1e4a30') });
  im.blit(tmp, cx - 6, cy - 6);
}

// ───────────── Brownstones ─────────────
export function brownstone(variant: 0 | 1): Img {
  const W = 64, H = 96;
  const im = new Img(W, H);
  const stone = variant ? hex('#a84c36') : hex('#8a5640');
  // roof
  flatRoof(im, 0, 0, W, 30, { surface: hex('#8c847c'), rim: variant ? hex('#c8a090') : hex('#c0aa98'), seed: variant ? 4 : 2 });
  // chimney
  brickWall(im, 46, 3, 8, 10, hex('#9a4a34'));
  im.rect(45, 2, 10, 2, hex('#b8b0a8'));
  // cornice with brackets
  im.rect(0, 28, W, 6, hex('#5a3a2c'));
  im.hline(0, 28, W, hex('#8a6050'));
  for (let x = 2; x < W; x += 6) im.rect(x, 31, 2, 4, hex('#3e2820'));
  // facade
  if (variant) brickWall(im, 0, 34, W, 62, stone, 9);
  else {
    im.rect(0, 34, W, 62, stone);
    for (let y = 34; y < 96; y += 5) im.hline(0, y, W, shade(stone, -0.14));
    for (let y = 34; y < 96; y++) for (let x = 0; x < W; x++) if (hash2(x, y, 3) < 0.05) im.put(x, y, shade(stone, 0.08));
  }
  im.vline(0, 34, 62, shade(stone, 0.2));
  im.vline(W - 1, 34, 62, shade(stone, -0.3));
  // upper windows (3) with stone lintels
  const lintel = hex('#e4d4bc');
  for (const x of [5, 26, 47]) {
    im.rect(x - 1, 38, 13, 3, lintel);
    im.hline(x - 1, 40, 13, shade(lintel, -0.3));
    windowGlass(im, x, 41, 11, 14, { frame: hex('#f0ece4'), panes: 'cross', sill: lintel, lit: variant === 1 && x === 26 });
  }
  // ground floor: door on the left (tile x=1 → px 16..31), window to the right
  const lx = 44;
  im.rect(lx - 1, 60, 15, 3, lintel);
  windowGlass(im, lx, 63, 13, 15, { frame: hex('#f0ece4'), panes: 'cross', sill: lintel });
  // door surround + door
  im.rect(15, 64, 18, 3, lintel);
  im.rect(15, 64, 3, 22, lintel);
  im.rect(30, 64, 3, 22, lintel);
  door(im, 18, 67, 12, 19, variant ? hex('#2a6a4a') : hex('#3a2418'), { glass: true, knob: hex('#f0d060') });
  // stoop
  stairs(im, 16, 86, 16, 10, hex('#b8a088'));
  for (const sx of [14, 33]) {
    im.vline(sx, 82, 14, hex('#24242c'));
    im.put(sx, 81, hex('#4a4a58'));
  }
  // fire escape (variant 1) or planter boxes
  if (variant) {
    const iron = hex('#2a2a32');
    im.hline(2, 56, 26, iron);
    im.hline(2, 57, 26, hex('#4a4a56'));
    for (let x = 2; x < 28; x += 3) im.vline(x, 52, 4, iron);
    im.hline(2, 52, 26, iron);
    im.line(6, 57, 14, 64, iron);
  } else {
    for (const x of [5, 26, 47]) {
      im.rect(x, 56, 11, 3, hex('#7a4a2c'));
      for (let i = 0; i < 11; i += 2) im.put(x + i, 55, i % 4 ? hex('#e05060') : hex('#58b060'));
    }
  }
  outlineDark(im, -0.6);
  return im;
}

// ───────────── Church (St. Francis–style whitewashed facade) ─────────────
export function church(): Img {
  const W = 112, H = 128;
  const im = new Img(W, H);
  const white = hex('#f6f2ea');
  // nave roof running north (seen from above)
  terracottaRoof(im, 14, 8, 84, 40, { base: hex('#b45a3e'), inset: 6 });
  // facade body
  plaster(im, 6, 52, 100, 70, white);
  // stepped & curved gable
  const gx = 56;
  for (let y = 18; y < 56; y++) {
    const t = (y - 18) / 38;
    let hw = Math.round(14 + t * 36);
    if (y > 40) hw = 50;
    for (let x = -hw; x <= hw; x++) {
      const curve = Math.abs(x) > 18 && y < 40 ? (Math.abs(x) - 18) / 32 > (y - 18) / 22 : false;
      if (curve) continue;
      im.put(gx + x, y, x > hw - 2 ? shade(white, -0.14) : white);
    }
  }
  // scrolls on the shoulders
  for (const sx of [-1, 1]) {
    im.ellipse(gx + sx * 30, 40, 4, 3.5, shade(white, -0.08));
    im.ellipse(gx + sx * 30, 40, 2, 1.6, shade(white, -0.3));
  }
  // cornices
  im.rect(4, 50, 104, 3, hex('#d8d0c4'));
  im.hline(4, 50, 104, hex('#ffffff'));
  im.hline(4, 53, 104, hex('#a8a098'));
  im.rect(gx - 16, 18, 32, 2, hex('#d8d0c4'));
  // pilasters
  for (const px of [8, 30, 80, 101]) {
    im.rect(px, 54, 4, 66, hex('#e8e2d8'));
    im.vline(px, 54, 66, hex('#ffffff'));
    im.vline(px + 3, 54, 66, hex('#c8c0b4'));
  }
  // belfry niche with bell
  im.rect(gx - 6, 24, 12, 14, hex('#8a8078'));
  im.rect(gx - 5, 25, 10, 13, hex('#4a4048'));
  im.ellipse(gx, 31, 3.5, 3.5, hex('#d8a838'));
  im.rect(gx - 4, 31, 8, 4, hex('#d8a838'));
  im.hline(gx - 4, 34, 8, hex('#a87820'));
  im.put(gx - 1, 29, hex('#f8e080'));
  // cross
  im.rect(gx - 1, 6, 3, 12, hex('#e8e0d0'));
  im.rect(gx - 4, 9, 9, 3, hex('#e8e0d0'));
  im.vline(gx + 1, 6, 12, hex('#b8b0a4'));
  // windows: tall arched + rose
  for (const wx of [18, 88]) windowGlass(im, wx - 5, 62, 11, 22, { frame: hex('#d8d0c4'), glass: hex('#7ab0d0'), panes: 'v', arch: true });
  im.ellipse(gx, 64, 7, 7, hex('#d0c8bc'));
  im.ellipse(gx, 64, 5.5, 5.5, hex('#5a90c0'));
  for (let a = 0; a < 8; a++) im.line(gx, 64, gx + Math.round(Math.cos((a * Math.PI) / 4) * 5), 64 + Math.round(Math.sin((a * Math.PI) / 4) * 5), hex('#d0c8bc'));
  im.put(gx - 2, 62, hex('#c0e0ff'));
  // arched door (tile x=3 → px 48..63)
  const dx = 49;
  im.rect(dx - 3, 88, 20, 34, hex('#d8d0c4'));
  door(im, dx, 92, 14, 30, hex('#7a4424'), { double: true, knob: hex('#f0c850') });
  for (let i = 0; i < 7; i++) { im.put(dx + i, 92 - Math.round(Math.sqrt(49 - (i - 7) ** 2) * 0.4), hex('#7a4424')); }
  im.hline(dx, 91, 14, hex('#7a4424'));
  im.hline(dx + 1, 90, 12, hex('#7a4424'));
  im.hline(dx + 3, 89, 8, hex('#5a3018'));
  // steps
  stairs(im, 40, 122, 32, 6, hex('#d8d0c4'));
  eaveShadow(im, 6, 54, 100, 2);
  outlineDark(im, -0.6);
  return im;
}

// ───────────── Stonefield Hall (grey limestone, castellated tower) ─────────────
function battlements(im: Img, x: number, y: number, w: number, seed: number) {
  stoneWall(im, x, y + 4, w, 4, seed);
  for (let i = 0; i < w; i += 6) stoneWall(im, x + i, y, Math.min(4, w - i), 4, seed + i);
}
export function hall(): Img {
  const W = 224, H = 128;
  const im = new Img(W, H);
  // wings: slate roof then stone facade
  slateRoof(im, 14, 22, 196, 26);
  stoneWall(im, 6, 46, 212, 76, 11);
  im.rect(6, 46, 212, 3, hex('#c8c0b8'));
  im.hline(6, 46, 212, hex('#e8e4e0'));
  // corner turrets
  for (const tx of [0, 196]) {
    stoneWall(im, tx, 28, 28, 94, 20 + tx);
    battlements(im, tx - 1, 20, 30, 40 + tx);
    for (const wy of [44, 74]) windowGlass(im, tx + 9, wy, 10, 16, { frame: hex('#d8d0c8'), glass: hex('#5a90c0'), panes: 'cross', arch: true });
    im.vline(tx + 27, 28, 94, hex('#6a6668'));
  }
  // wing windows (two storeys of paired lancets)
  for (let x = 34; x < 190; x += 18) {
    if (x > 78 && x < 140) continue;
    for (const wy of [56, 88]) {
      windowGlass(im, x, wy, 5, 15, { frame: hex('#d8d0c8'), glass: hex('#5a90c0'), panes: 'none', arch: true });
      windowGlass(im, x + 7, wy, 5, 15, { frame: hex('#d8d0c8'), glass: hex('#5a90c0'), panes: 'none', arch: true });
      im.hline(x - 1, wy + 16, 14, hex('#d8d0c8'));
    }
  }
  // central tower
  const cx = 112, tw = 52, tx = cx - tw / 2;
  stoneWall(im, tx, 8, tw, 114, 77);
  battlements(im, tx - 2, 0, tw + 4, 78);
  im.vline(tx + tw - 1, 8, 114, hex('#6a6668'));
  im.vline(tx, 8, 114, hex('#c8c4c0'));
  // great gothic window with tracery
  const gw = 22, gy = 30, gh = 44;
  for (let j = 0; j < gh; j++) {
    const arch = j < 11 ? Math.round(Math.sqrt(Math.max(0, 121 - (11 - j) ** 2)) * (gw / 22)) : gw / 2;
    for (let i = -arch; i < arch; i++) {
      let c = mix(hex('#3a6aa0'), hex('#78b0e0'), j / gh);
      if ((i + j) % 9 === 0) c = hex('#a8d0f0');
      if (i === -1 || i === 0 || j === 24 || (j > 26 && (i === -6 || i === 5))) c = hex('#d8d0c8');
      im.put(cx + i, gy + j, c);
    }
  }
  im.hline(cx - 13, gy + gh, 26, hex('#d8d0c8'));
  im.hline(cx - 13, gy + gh + 1, 26, hex('#8a8680'));
  // clock / crest
  im.ellipse(cx, 18, 6, 6, hex('#e8e0d0'));
  im.ellipse(cx, 18, 4.6, 4.6, hex('#f8f4ec'));
  im.line(cx, 18, cx, 15, hex('#303030'));
  im.line(cx, 18, cx + 2, 19, hex('#303030'));
  // entrance: pointed arch with double oak doors (tiles 6,7 → px 96..127)
  const ex = 100, ew = 24, ey = 92;
  for (let j = 0; j < 30; j++) {
    const hw = j < 8 ? Math.round(Math.sqrt(Math.max(0, 64 - (8 - j) ** 2)) * 1.5) : ew / 2;
    for (let i = -hw; i < hw; i++) im.put(ex + ew / 2 + i, ey + j, hex('#3a2a28'));
  }
  door(im, ex + 2, ey + 8, ew - 4, 22, hex('#8a5a34'), { double: true, knob: hex('#e8c860') });
  for (let j = 0; j < 9; j++) im.put(ex + ew / 2, ey + j, hex('#5a3a24'));
  // banner flags
  for (const bx of [tx + 4, tx + tw - 10]) {
    im.rect(bx, 80, 6, 14, hex('#861f41'));
    im.rect(bx, 80, 6, 2, hex('#a8a0a0'));
    im.hline(bx + 1, 86, 4, hex('#e5751f'));
    im.put(bx + 2, 94, hex('#861f41'));
  }
  stairs(im, ex - 12, 122, ew + 24, 6, hex('#c8c0b8'));
  outlineDark(im, -0.6);
  return im;
}

export function library(): Img {
  const W = 112, H = 96;
  const im = new Img(W, H);
  slateRoof(im, 4, 6, 104, 30, hex('#566070'));
  // dormers
  for (const dx of [22, 82]) {
    stoneWall(im, dx - 6, 12, 12, 12, dx);
    pointedRoof(im, dx, 4, 8, 9, hex('#566070'));
    windowGlass(im, dx - 3, 14, 6, 8, { frame: hex('#d8d0c8'), panes: 'none' });
  }
  stoneWall(im, 2, 34, 108, 58, 31, [hex('#b0a8a0'), hex('#a49c98'), hex('#bcb4a8'), hex('#9c9890'), hex('#b8aca4')]);
  im.rect(2, 34, 108, 3, hex('#d8d0c8'));
  for (const wx of [10, 28, 70, 88]) {
    windowGlass(im, wx, 44, 12, 30, { frame: hex('#d8d0c8'), glass: hex('#5a90c0'), panes: 'grid', arch: true, lit: wx === 28 });
  }
  // portico
  const px = 42;
  im.rect(px, 38, 28, 4, hex('#e0d8cc'));
  for (let j = 0; j < 8; j++) im.hline(px + 14 - j * 2, 30 + j, j * 4, hex('#e0d8cc'));
  for (const cx of [px + 2, px + 23]) {
    im.rect(cx, 42, 3, 48, hex('#e8e2d8'));
    im.vline(cx, 42, 48, hex('#ffffff'));
    im.vline(cx + 2, 42, 48, hex('#b8b0a4'));
  }
  door(im, 49, 68, 14, 22, hex('#5a3a24'), { double: true, glass: true, knob: hex('#e8c860') });
  signBoard(im, 46, 58, 20, 7, hex('#2a3a4a'), hex('#f0e8c0'), 'BOOKS');
  stairs(im, 40, 90, 32, 6, hex('#c8c0b8'));
  outlineDark(im, -0.6);
  return im;
}

// ───────────── Metro station (shell roof, glass front) ─────────────
export function station(): Img {
  const W = 128, H = 96;
  const im = new Img(W, H);
  // shell roof: three overlapping barrel vaults
  for (const [x0, w, top] of [[2, 70, 6], [44, 82, 2], [24, 68, 10]] as const) {
    for (let j = 0; j < 44 - top; j++) {
      const t = j / (44 - top);
      const inset = Math.round((1 - Math.sin(Math.min(1, t * 1.6) * Math.PI / 2)) * 10);
      for (let i = inset; i < w - inset; i++) {
        const u = (i - inset) / Math.max(1, w - 2 * inset);
        let c = mix(hex('#ffffff'), hex('#c8ccd8'), Math.abs(u - 0.35) * 1.3);
        if ((i - inset) % 10 === 0) c = shade(c, -0.12);
        if (j === 0) c = hex('#e8ecf4');
        im.put(x0 + i, top + j, c);
      }
    }
  }
  im.rect(0, 44, W, 6, hex('#d0d4dc'));
  im.hline(0, 44, W, hex('#ffffff'));
  im.hline(0, 49, W, hex('#7a7e8a'));
  // glass curtain wall
  for (let y = 50; y < 90; y++)
    for (let x = 2; x < W - 2; x++) {
      let c = mix(hex('#3a6a9a'), hex('#6aa0d0'), (y - 50) / 40);
      if ((x - 2) % 12 === 0 || (y - 50) % 13 === 0) c = hex('#b8c0cc');
      if ((x + y) % 23 === 0 && (x - 2) % 12 > 2) c = hex('#c8e4ff');
      im.put(x, y, c);
    }
  // entrance
  im.rect(46, 66, 36, 24, hex('#2a3a4a'));
  door(im, 50, 70, 28, 20, hex('#88a8c8'), { double: true, glass: true });
  signBoard(im, 44, 56, 40, 8, hex('#e04838'), hex('#ffffff'), 'METRO');
  // platform canopy edge on the east (meets the viaduct)
  im.rect(110, 46, 18, 34, hex('#a8acb8'));
  for (let y = 48; y < 80; y += 4) im.hline(110, y, 18, hex('#888c98'));
  im.rect(0, 90, W, 6, hex('#b8b4b0'));
  im.hline(0, 90, W, hex('#e0dcd8'));
  outlineDark(im, -0.6);
  return im;
}

// ───────────── Café (Kerala roof meets city awning) ─────────────
export function cafe(): Img {
  const W = 96, H = 80;
  const im = new Img(W, H);
  plaster(im, 2, 40, 92, 36, hex('#f4e8c8'));
  terracottaRoof(im, 0, 0, W, 42, { base: hex('#c4583a'), gablet: false });
  // chimney with steam vent
  brickWall(im, 70, 6, 8, 12, hex('#a04a34'));
  im.rect(69, 5, 10, 2, hex('#b8b0a8'));
  eaveShadow(im, 2, 42, 92, 3);
  signBoard(im, 28, 44, 40, 8, hex('#2a5a44'), hex('#f8f0d0'), 'CHAYA & CO');
  awning(im, 4, 54, 88, 6, hex('#2a7a5a'), hex('#f0ece0'));
  // big windows with warm light, door at tile 2 (px 32..47)
  windowGlass(im, 6, 62, 22, 12, { frame: hex('#2a5a44'), panes: 'v', lit: true });
  windowGlass(im, 54, 62, 36, 12, { frame: hex('#2a5a44'), panes: 'grid', lit: true });
  door(im, 34, 62, 12, 16, hex('#2a5a44'), { glass: true, knob: hex('#f0d060') });
  // chalkboard & plant
  im.rect(48, 68, 5, 8, hex('#2a2a2a'));
  im.hline(49, 70, 3, hex('#f0f0f0'));
  im.hline(49, 72, 2, hex('#f0f0f0'));
  im.rect(2, 76, 92, 4, hex('#b8a888'));
  im.hline(2, 76, 92, hex('#e0d0b0'));
  outlineDark(im, -0.6);
  return im;
}

export function spiceShop(): Img {
  const W = 80, H = 80;
  const im = new Img(W, H);
  // wooden shopfront under a tiled roof
  im.rect(2, 40, 76, 36, hex('#8a5a34'));
  for (let x = 2; x < 78; x += 4) im.vline(x, 40, 36, hex('#7a4a28'));
  terracottaRoof(im, 0, 0, W, 42, { base: hex('#b85438'), gablet: true });
  eaveShadow(im, 2, 42, 76, 3);
  signBoard(im, 14, 44, 52, 7, hex('#e8c040'), hex('#6a2a1a'), 'SPICE BAZAAR');
  // shutters half down
  im.rect(8, 54, 22, 18, hex('#3a2418'));
  im.rect(8, 54, 22, 8, hex('#a8a8a0'));
  for (let y = 54; y < 62; y += 2) im.hline(8, y, 22, hex('#888880'));
  im.rect(50, 54, 22, 18, hex('#3a2418'));
  im.rect(50, 54, 22, 8, hex('#a8a8a0'));
  for (let y = 54; y < 62; y += 2) im.hline(50, y, 22, hex('#888880'));
  door(im, 34, 58, 12, 18, hex('#5a3420'), { double: true, knob: hex('#f0c850') });
  // spice sacks (cardamom, chilli, pepper, turmeric)
  const sacks: [number, string, string][] = [[9, '#5aa040', '#3a7a28'], [18, '#d83020', '#a01810'], [53, '#3a3028', '#1a1410'], [62, '#e8b020', '#b07a10']];
  for (const [sx, top, d] of sacks) {
    im.rect(sx, 68, 9, 8, hex('#d8c098'));
    im.vline(sx + 8, 68, 8, hex('#b09870'));
    im.ellipse(sx + 4.5, 68, 4.5, 2.2, hex(top));
    for (let i = 0; i < 9; i++) if (hash2(sx + i, 68, 3) < 0.4) im.put(sx + i, 67, hex(d));
  }
  im.rect(2, 76, 76, 4, hex('#b8a888'));
  outlineDark(im, -0.6);
  return im;
}

// ───────────── New York storefronts ─────────────
export function bodega(): Img {
  const W = 64, H = 80;
  const im = new Img(W, H);
  flatRoof(im, 0, 0, W, 26, { surface: hex('#90887e'), rim: hex('#c8bcb0'), seed: 12 });
  brickWall(im, 0, 26, W, 50, hex('#b85a40'), 4);
  // upper windows
  for (const x of [6, 26, 46]) windowGlass(im, x, 30, 11, 12, { frame: hex('#f0ece4'), sill: hex('#d8d0c4') });
  signBoard(im, 3, 46, 58, 7, hex('#f8d030'), hex('#c02020'), 'DELI GROCERY');
  awning(im, 2, 54, 60, 4, hex('#d83030'), hex('#f0f0f0'));
  windowGlass(im, 34, 61, 26, 12, { frame: hex('#404048'), panes: 'v', lit: true });
  door(im, 18, 61, 12, 15, hex('#404048'), { glass: true, knob: hex('#d0d0d8') });
  // fruit stand
  im.rect(36, 70, 22, 6, hex('#a87848'));
  for (let i = 0; i < 20; i += 2) {
    im.put(37 + i, 69, i % 6 === 0 ? hex('#f04030') : i % 6 === 2 ? hex('#f0c030') : hex('#60c040'));
    im.put(38 + i, 69, i % 4 === 0 ? hex('#f08030') : hex('#f0c030'));
  }
  im.rect(0, 76, W, 4, hex('#b0a898'));
  outlineDark(im, -0.6);
  return im;
}

export function pizza(): Img {
  const W = 64, H = 80;
  const im = new Img(W, H);
  flatRoof(im, 0, 0, W, 26, { surface: hex('#8a8278'), rim: hex('#d0c4b8'), seed: 21 });
  plaster(im, 0, 26, W, 50, hex('#ece0c8'));
  for (const x of [6, 26, 46]) windowGlass(im, x, 30, 11, 12, { frame: hex('#a03828'), sill: hex('#d8d0c4') });
  signBoard(im, 6, 46, 52, 7, hex('#202020'), hex('#f8f0d0'), 'PIZZERIA');
  // tricolour awning
  for (let i = 0; i < 60; i++) {
    const c = i < 20 ? hex('#3a9a4a') : i < 40 ? hex('#f4f0e8') : hex('#d83a30');
    for (let j = 0; j < 4; j++) im.put(2 + i, 54 + j, j === 0 ? shade(c, 0.2) : c);
    if (i % 3 !== 2) im.put(2 + i, 58, shade(c, -0.25));
  }
  windowGlass(im, 4, 61, 24, 12, { frame: hex('#a03828'), panes: 'none', lit: true });
  // neon slice in window
  im.line(10, 63, 20, 63, hex('#ff70a0'));
  im.line(10, 63, 15, 70, hex('#ff70a0'));
  im.line(20, 63, 15, 70, hex('#ff70a0'));
  door(im, 34, 61, 12, 15, hex('#a03828'), { glass: true, knob: hex('#f0d060') });
  im.rect(0, 76, W, 4, hex('#b0a898'));
  outlineDark(im, -0.6);
  return im;
}

export function theater(): Img {
  const W = 96, H = 96;
  const im = new Img(W, H);
  flatRoof(im, 0, 0, W, 24, { surface: hex('#887e78'), rim: hex('#d8c8b8'), seed: 33 });
  // ornate facade
  im.rect(0, 24, W, 68, hex('#d8b890'));
  for (let y = 24; y < 92; y += 6) im.hline(0, y, W, hex('#c8a880'));
  for (const px of [4, 44, 84]) {
    im.rect(px, 26, 8, 40, hex('#e8d0a8'));
    im.vline(px, 26, 40, hex('#f8e8c8'));
    im.vline(px + 7, 26, 40, hex('#b89870'));
  }
  for (const x of [16, 56]) windowGlass(im, x, 30, 24, 16, { frame: hex('#e8d0a8'), glass: hex('#6a4a8a'), panes: 'grid', arch: true });
  // marquee with chaser bulbs
  im.rect(4, 50, 88, 18, hex('#2a1a2a'));
  im.rect(6, 52, 84, 14, hex('#f8f0d8'));
  miniText(im, 48, 54, 'THE LYRIC', hex('#c02040'), true);
  miniText(im, 48, 60, 'TONIGHT', hex('#202020'), true);
  for (let x = 4; x < 92; x += 3) {
    im.put(x, 50, x % 6 ? hex('#fff070') : hex('#f8a030'));
    im.put(x, 67, x % 6 ? hex('#f8a030') : hex('#fff070'));
  }
  im.rect(8, 68, 80, 2, hex('#1a1018'));
  // doors (tiles 2,3 → px 32..63)
  im.rect(28, 70, 40, 22, hex('#5a2a2a'));
  door(im, 32, 72, 14, 20, hex('#a83030'), { glass: true, knob: hex('#f0d060') });
  door(im, 50, 72, 14, 20, hex('#a83030'), { glass: true, knob: hex('#f0d060') });
  // poster cases
  for (const px of [8, 76]) {
    im.rect(px, 72, 12, 16, hex('#e8c050'));
    im.rect(px + 1, 73, 10, 14, hex('#3a2a5a'));
    im.ellipse(px + 6, 78, 3, 3, hex('#f0a0c0'));
    im.hline(px + 2, 84, 8, hex('#f0f0f0'));
  }
  im.rect(0, 92, W, 4, hex('#c0a888'));
  outlineDark(im, -0.6);
  return im;
}

export function apartment(): Img {
  const W = 96, H = 128;
  const im = new Img(W, H);
  flatRoof(im, 0, 8, W, 30, { surface: hex('#7e786e'), rim: hex('#c0b4a8'), seed: 44 });
  // water tower on stilts
  const wx = 14;
  for (const lx of [wx + 1, wx + 15]) im.rect(lx, 22, 2, 12, hex('#3a3a40'));
  im.line(wx + 2, 24, wx + 15, 32, hex('#3a3a40'));
  im.line(wx + 15, 24, wx + 2, 32, hex('#3a3a40'));
  for (let y = 6; y < 23; y++)
    for (let x = wx; x < wx + 18; x++) {
      let c = x < wx + 6 ? hex('#a87a50') : x > wx + 13 ? hex('#6e4a2c') : hex('#8a6038');
      if ((x - wx) % 3 === 0) c = shade(c, -0.15);
      if (y === 10 || y === 18) c = hex('#3a3a40');
      im.put(x, y, c);
    }
  pointedRoof(im, wx + 9, 0, 10, 7, hex('#5a5a62'));
  // AC units
  im.box(60, 16, 10, 7, hex('#d8d8dc'), { light: hex('#ffffff'), dark: hex('#9898a0') });
  im.box(76, 22, 10, 7, hex('#d8d8dc'), { light: hex('#ffffff'), dark: hex('#9898a0') });
  // brick facade, 4 storeys
  brickWall(im, 0, 38, W, 86, hex('#9a5038'), 17);
  im.rect(0, 38, W, 4, hex('#d8c8b8'));
  for (let f = 0; f < 3; f++)
    for (const x of [6, 24, 58, 76]) windowGlass(im, x, 46 + f * 22, 12, 14, { frame: hex('#f0ece4'), sill: hex('#d8d0c4'), lit: (f + x) % 3 === 0 });
  // fire escape down the middle
  const iron = hex('#26262e');
  for (let f = 0; f < 3; f++) {
    const y = 60 + f * 22;
    im.hline(40, y, 16, iron);
    im.hline(40, y + 1, 16, hex('#4a4a56'));
    for (let x = 40; x < 56; x += 3) im.vline(x, y - 4, 4, iron);
    im.hline(40, y - 4, 16, iron);
    im.line(42, y + 1, 53, y + 18, iron);
  }
  // ground floor: door with canopy (tile 2 → px 32..47)
  im.rect(28, 100, 24, 3, hex('#2a2a6a'));
  im.hline(28, 100, 24, hex('#4a4a9a'));
  door(im, 34, 104, 12, 20, hex('#3a2418'), { glass: true, knob: hex('#e8c860') });
  for (const x of [6, 60, 76]) windowGlass(im, x, 106, 12, 12, { frame: hex('#f0ece4'), sill: hex('#d8d0c4') });
  im.rect(0, 124, W, 4, hex('#b0a898'));
  outlineDark(im, -0.6);
  return im;
}

export function teaStall(): Img {
  const W = 48, H = 48;
  const im = new Img(W, H);
  groundShadow(im, 25, 45, 22, 3, 70);
  const p = new Img(W, H);
  // corrugated tin roof
  for (let j = 0; j < 12; j++)
    for (let i = 0; i < 46; i++) {
      let c = i % 4 < 2 ? hex('#4aa0a8') : hex('#38808a');
      if (j === 0) c = shade(c, 0.3);
      if (j === 11) c = shade(c, -0.35);
      p.put(1 + i, 6 + j, c);
    }
  // posts
  for (const x of [3, 42]) p.rect(x, 18, 3, 24, hex('#7a4a28'));
  // counter
  p.rect(2, 30, 44, 14, hex('#b07a44'));
  p.hline(2, 30, 44, hex('#d8a060'));
  for (let x = 4; x < 44; x += 6) p.vline(x, 32, 12, hex('#8a5a30'));
  // glass jars & kettle
  for (const [x, c] of [[8, '#f0c060'], [14, '#e08040'], [20, '#a0d060']] as const) {
    p.rect(x, 24, 5, 6, hex('#d8f0f8'));
    p.rect(x + 1, 26, 3, 4, hex(c));
  }
  p.ellipse(33, 26, 5, 4, hex('#c0c0c8'));
  p.ellipse(32, 25, 2, 1.5, hex('#f0f0f8'));
  p.line(38, 24, 41, 21, hex('#a0a0a8'));
  // hanging bananas
  for (let i = 0; i < 4; i++) p.rect(10 + i * 2, 18, 2, 5, hex('#f0d040'));
  p.rect(26, 18, 8, 3, hex('#e8e0d0'));
  outlineDark(p, -0.6);
  im.blit(p, 0, 0);
  return im;
}

export function gate(): Img {
  const W = 128, H = 48;
  const im = new Img(W, H);
  for (const px of [4, 100]) {
    groundShadow(im, px + 13, 45, 14, 2.5, 70);
    stoneWall(im, px, 12, 24, 34, px + 3);
    im.rect(px - 2, 10, 28, 4, hex('#d8d0c8'));
    im.hline(px - 2, 10, 28, hex('#f0ece8'));
    im.vline(px + 23, 12, 34, hex('#6a6668'));
    // lantern
    im.rect(px + 9, 2, 6, 7, hex('#3a4a5a'));
    im.rect(px + 10, 3, 4, 5, hex('#f8f0b0'));
  }
  // arch beam
  for (let i = 26; i < 102; i++) {
    const t = (i - 64) / 38;
    const y = Math.round(6 + t * t * 6);
    for (let j = 0; j < 7; j++) im.put(i, y + j, j === 0 ? hex('#f0e0c0') : j === 6 ? hex('#8a5a34') : hex('#c89050'));
  }
  signBoard(im, 44, 4, 40, 8, hex('#2a5a44'), hex('#f8f0d0'), 'CARDAMOM');
  outlineDark(im, -0.6);
  return im;
}

export function statue(): Img {
  const W = 32, H = 64;
  const im = new Img(W, H);
  groundShadow(im, 17, 61, 14, 3, 70);
  stoneWall(im, 5, 36, 22, 24, 91, [hex('#c8c0b8'), hex('#b8b0a8'), hex('#d0c8c0')]);
  im.rect(3, 34, 26, 3, hex('#e0d8d0'));
  im.rect(3, 58, 26, 3, hex('#a8a098'));
  const cu = hex('#5cb8a0'), cl = hex('#8ad8c0'), cd = hex('#3a8a78');
  // robe
  for (let y = 12; y < 34; y++) {
    const hw = 3 + Math.floor((y - 12) / 4);
    for (let x = -hw; x <= hw; x++) im.put(16 + x, y, x < -hw + 2 ? cl : x > hw - 2 ? cd : (x + y) % 5 === 0 ? cd : cu);
  }
  // head + crown
  im.ellipse(16, 9, 3, 3, cu);
  im.put(15, 8, cl);
  for (const [dx, dy] of [[-4, -2], [-2, -4], [0, -5], [2, -4], [4, -2]]) im.put(16 + dx, 9 + dy, cl);
  // raised arm with lamp
  im.line(19, 14, 23, 5, cu);
  im.line(20, 14, 24, 5, cd);
  im.rect(22, 1, 4, 4, cd);
  im.rect(22, -1 + 1, 4, 1, hex('#f8d040'));
  im.ellipse(24, 0.5, 2, 1.6, hex('#ffe060'));
  // tablet arm
  im.rect(10, 18, 4, 6, cl);
  outlineDark(im, -0.6);
  return im;
}

export function counterPlaceholder(): Img {
  return new Img(16, 32);
}
