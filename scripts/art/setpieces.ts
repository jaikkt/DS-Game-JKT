/** Animated landmarks (frame strips) + elevated metro pieces + ambient critters. */
import { Img, hex, shade, mix, Color } from './pixel';
import { outlineDark, groundShadow, stoneWall } from './draw';
import { miniText } from './buildings';

const strip = (frames: Img[]) => {
  const out = new Img(frames[0].w * frames.length, frames[0].h);
  frames.forEach((f, i) => out.blit(f, i * f.w, 0));
  return out;
};

// ───────────── Fountain ─────────────
export function fountain(): Img {
  const frames: Img[] = [];
  for (let f = 0; f < 4; f++) {
    const im = new Img(48, 48);
    groundShadow(im, 25, 42, 22, 5, 60);
    // outer stone rim
    im.ellipse(24, 30, 22, 13, hex('#a8a098'));
    im.ellipse(24, 29, 21, 12, hex('#e0d8cc'));
    im.ellipse(24, 30, 18, 9.5, hex('#8a847c'));
    // basin water
    im.ellipse(24, 31, 17, 8.5, hex('#3a88d8'));
    for (let k = 0; k < 3; k++) {
      const r = 4 + ((f + k * 1.33) % 4) * 3.2;
      for (let a = 0; a < 40; a++) {
        const t = (a / 40) * Math.PI * 2;
        const x = 24 + Math.cos(t) * r, y = 31 + Math.sin(t) * r * 0.48;
        if (a % 3) im.put(Math.round(x), Math.round(y), hex('#8cc8f8'));
      }
    }
    // front lip of rim (in front of water)
    for (let x = 4; x < 45; x++) {
      const dx = (x - 24) / 21;
      const y = Math.round(30 + Math.sqrt(Math.max(0, 1 - dx * dx)) * 12);
      im.put(x, y, hex('#c8c0b4'));
      im.put(x, y + 1, hex('#8a847c'));
    }
    // pedestal + upper bowl
    im.rect(21, 18, 6, 13, hex('#d0c8bc'));
    im.vline(21, 18, 13, hex('#f0ece4'));
    im.vline(26, 18, 13, hex('#a09888'));
    im.ellipse(24, 17, 8, 3.2, hex('#d8d0c4'));
    im.ellipse(24, 16.5, 6.5, 2.2, hex('#4a98e0'));
    // jet & falling streams
    const h = 9 + (f % 2);
    for (let y = 16 - h; y < 16; y++) im.put(24, y, hex('#d8f0ff'));
    im.put(23, 16 - h + 1, hex('#a8d8ff'));
    im.put(25, 16 - h + 1, hex('#a8d8ff'));
    for (const s of [-1, 1]) {
      for (let k = 0; k < 9; k++) {
        const x = 24 + s * (3 + k * 0.9), y = 6 + k * k * 0.22 + (f % 2);
        if ((k + f) % 3 !== 0) im.put(Math.round(x), Math.round(y), k % 2 ? hex('#ffffff') : hex('#a8d8ff'));
      }
      for (let k = 0; k < 6; k++) {
        if ((k + f) % 2) im.put(24 + s * (8 + (k % 2)), 18 + k * 2, hex('#c8e8ff'));
      }
    }
    // sparkles
    const sp: [number, number][] = [[14, 29], [32, 33], [20, 35], [30, 27]];
    const [sx, sy] = sp[f];
    im.put(sx, sy, hex('#ffffff'));
    im.put(sx - 1, sy, hex('#c8e8ff'));
    im.put(sx + 1, sy, hex('#c8e8ff'));
    outlineDark(im, -0.55);
    frames.push(im);
  }
  return strip(frames);
}

// ───────────── Cheena vala (shore-operated fishing net) ─────────────
export function fishingNet(): Img {
  const N = 8;
  const frames: Img[] = [];
  const wood = hex('#8a5a32'), woodL = hex('#b07a48'), woodD = hex('#5a3a20');
  for (let f = 0; f < N; f++) {
    const im = new Img(80, 80);
    // phase: slow dip then slow rise
    const ph = (1 - Math.cos((f / N) * Math.PI * 2)) / 2; // 0 = raised, 1 = dipped
    // platform (on stilts) at the shore side
    for (const sx of [58, 66, 74]) {
      im.rect(sx, 62, 3, 18, woodD);
      im.vline(sx, 62, 18, wood);
    }
    for (let y = 58; y < 66; y++) for (let x = 54; x < 80; x++) im.put(x, y, y === 58 ? woodL : (x + Math.floor(y / 2)) % 6 === 0 ? woodD : wood);
    im.hline(54, 66, 26, woodD);
    // A-frame pivot
    const px = 66, py = 34;
    im.line(60, 58, px, py, woodD);
    im.line(61, 58, px + 1, py, wood);
    im.line(72, 58, px + 1, py, woodD);
    // boom
    const ang = -0.32 + ph * 0.62; // radians; positive tips down to the left
    const L = 58;
    const tx = px - Math.cos(ang) * L, ty = py + Math.sin(ang) * L * 0.9;
    for (let o = 0; o < 2; o++) im.line(px, py + o, Math.round(tx), Math.round(ty) + o, o ? woodD : woodL);
    // counterweight arm + stones on ropes
    const cx = px + Math.cos(ang) * 14, cy = py - Math.sin(ang) * 14;
    im.line(px, py, Math.round(cx), Math.round(cy), wood);
    for (let k = 0; k < 4; k++) {
      const rx = Math.round(px + (cx - px) * (0.4 + k * 0.2));
      const ry = Math.round(py + (cy - py) * (0.4 + k * 0.2));
      im.vline(rx, ry, 8 + k, hex('#d8c8a0'));
      im.rect(rx - 1, ry + 8 + k, 3, 3, hex('#8a8a96'));
    }
    // net: four-cornered, hung from the tip by a cross of bowed poles
    const netW = 30;
    const netTop = Math.round(ty) + 2;
    const netBot = netTop + 14;
    const ncx = Math.round(tx);
    const waterY = 64;
    for (let y = netTop; y <= netBot; y++) {
      const t = (y - netTop) / (netBot - netTop);
      const hw = Math.round(4 + Math.sin(t * Math.PI * 0.5) * (netW / 2));
      for (let x = -hw; x <= hw; x++) {
        const mesh = (x + y) % 3 === 0 || (x - y + 60) % 3 === 0;
        if (!mesh) continue;
        const under = y > waterY;
        im.put(ncx + x, y, under ? hex('#4a88c8', 170) : hex('#e8e0c8'));
      }
    }
    // bowed poles
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 16; k++) {
        const t = k / 16;
        const x = ncx + s * Math.round(t * (netW / 2 + 1));
        const y = Math.round(ty) + Math.round(t * 16 - Math.sin(t * Math.PI) * 5);
        im.put(x, y, y > waterY ? hex('#3a6aa0', 180) : woodD);
      }
    }
    // ropes from tip
    im.line(Math.round(tx), Math.round(ty), ncx - netW / 2, netBot - 1, hex('#d8c8a0'));
    im.line(Math.round(tx), Math.round(ty), ncx + netW / 2, netBot - 1, hex('#d8c8a0'));
    // splash ring when dipped
    if (ph > 0.75) for (let x = -netW / 2 - 2; x <= netW / 2 + 2; x += 2) im.put(ncx + x, waterY + 1, hex('#f0f8ff', 200));
    // drips when rising
    if (f === 5 || f === 6) for (let k = 0; k < 6; k++) im.put(ncx - 12 + k * 5, netBot + 2 + (k % 3) * 2, hex('#c8e8ff'));
    outlineDark(im, -0.55);
    frames.push(im);
  }
  return strip(frames);
}

// ───────────── Kettuvallam houseboat ─────────────
export function houseboat(): Img {
  const frames: Img[] = [];
  for (let f = 0; f < 2; f++) {
    const im = new Img(96, 48);
    const dy = f;
    // hull with upturned prow & stern
    for (let x = 2; x < 94; x++) {
      const t = (x - 48) / 46;
      const lift = Math.round(Math.pow(Math.abs(t), 4) * 12);
      for (let y = 30 - lift; y < 40 - Math.round(Math.abs(t) * 3); y++) {
        let c = y < 33 - lift ? hex('#8a5432') : hex('#5a3420');
        if (y === 30 - lift) c = hex('#b07a48');
        if ((x + y) % 7 === 0) c = shade(c, -0.15);
        im.put(x, y + dy, c);
      }
    }
    // woven bamboo barrel roof
    for (let y = 8; y < 30; y++) {
      const t = (y - 8) / 22;
      const inset = Math.round((1 - Math.sin(Math.min(1, t * 1.8) * Math.PI / 2)) * 8);
      for (let x = 14 + inset; x < 82 - inset; x++) {
        let c = (x + y) % 4 < 2 ? hex('#d8b060') : hex('#c09848');
        if ((x - y + 400) % 4 === 0) c = hex('#e8c878');
        if (y > 24) c = shade(c, -0.2);
        im.put(x, y + dy, c);
      }
    }
    // windows (openings with curtains)
    for (let x = 22; x < 76; x += 12) {
      im.rect(x, 22 + dy, 7, 6, hex('#3a2418'));
      im.rect(x, 22 + dy, 2, 6, hex('#e05040'));
    }
    // deck rail & front sitting area
    im.hline(80, 27 + dy, 10, hex('#b07a48'));
    im.vline(82, 24 + dy, 4, hex('#8a5432'));
    im.vline(88, 22 + dy, 6, hex('#8a5432'));
    outlineDark(im, -0.55);
    // wake ripples
    for (let x = 4; x < 92; x += 3) im.set(x, 42 + (x % 2) + dy, hex('#f0f8ff', 150));
    frames.push(im);
  }
  return strip(frames);
}

// ───────────── Elevated metro ─────────────
function deck(im: Img) {
  // parapet
  im.rect(0, 0, 16, 4, hex('#c8c4c0'));
  im.hline(0, 0, 16, hex('#f0ece8'));
  im.hline(0, 3, 16, hex('#8a8680'));
  // ballast + rails
  for (let y = 4; y < 25; y++) for (let x = 0; x < 16; x++) im.put(x, y, (x * 7 + y * 3) % 5 === 0 ? hex('#7a7470') : hex('#8e8882'));
  for (let x = 1; x < 16; x += 4) im.rect(x, 7, 2, 16, hex('#6a5040'));
  for (const ry of [9, 19]) {
    im.hline(0, ry, 16, hex('#d8dce4'));
    im.hline(0, ry + 1, 16, hex('#6a6e78'));
  }
  // fascia
  im.rect(0, 25, 16, 7, hex('#b8b4b0'));
  im.hline(0, 25, 16, hex('#e0dcd8'));
  im.hline(0, 28, 16, hex('#e07838'));
  im.hline(0, 31, 16, hex('#6a6662'));
}
export function viaduct(kind: 'deck' | 'pillar' | 'end'): Img {
  const im = new Img(16, kind === 'deck' ? 32 : 48);
  deck(im);
  if (kind !== 'deck') {
    im.rect(4, 32, 8, 15, hex('#b0aca8'));
    im.vline(4, 32, 15, hex('#d8d4d0'));
    im.vline(11, 32, 15, hex('#7a7672'));
    im.rect(3, 45, 10, 3, hex('#8a8680'));
    for (let x = 4; x < 12; x++) im.set(x, 32, hex('#201820', 100));
  }
  if (kind === 'end') {
    im.vline(0, 0, 32, hex('#6a6662'));
  }
  return im;
}

/** Three-car metro train, side view on the deck (192×24). */
export function train(): Img {
  const W = 64, H = 24;
  const out = new Img(W * 3, H);
  for (let c = 0; c < 3; c++) {
    const im = new Img(W, H);
    const lead = c === 0, tail = c === 2;
    im.rect(1, 3, W - 2, 18, hex('#eef0f4'));
    im.hline(1, 3, W - 2, hex('#ffffff'));
    im.rect(1, 14, W - 2, 3, hex('#18a0a0'));
    im.hline(1, 17, W - 2, hex('#e07838'));
    im.rect(1, 18, W - 2, 3, hex('#a8acb8'));
    for (let x = 6; x < W - 8; x += 11) {
      im.rect(x, 6, 8, 6, hex('#3a5a7a'));
      im.rect(x, 6, 3, 3, hex('#9ac8e8'));
    }
    // doors
    im.rect(W / 2 - 3, 5, 6, 12, hex('#c8ccd4'));
    im.vline(W / 2, 5, 12, hex('#8a8e98'));
    if (lead) {
      for (let y = 3; y < 21; y++) for (let x = 0; x < 6; x++) if (x + (y - 3) * 0.3 < 4) im.put(x, y, 0);
      im.rect(2, 7, 4, 6, hex('#3a5a7a'));
      im.put(3, 16, hex('#fff8c0'));
    }
    if (tail) im.put(W - 3, 16, hex('#ff4040'));
    // bogies
    for (const bx of [8, W - 14]) {
      im.rect(bx, 21, 7, 3, hex('#303038'));
      im.put(bx + 1, 22, hex('#6a6a74'));
      im.put(bx + 5, 22, hex('#6a6a74'));
    }
    outlineDark(im, -0.6);
    if (!lead) im.vline(0, 6, 12, hex('#404048'));
    out.blit(im, c * W, 0);
  }
  miniText(out, 32, 7, '', hex('#ffffff'));
  return out;
}

// ───────────── Critters ─────────────
/** Duck: 4 frames 16×16 (swim left ×2, swim right ×2). */
export function duck(drake = true): Img {
  const out = new Img(64, 16);
  const body = drake ? hex('#c8c0b0') : hex('#a8784a');
  const head = drake ? hex('#2a8a4a') : hex('#8a5a32');
  for (let f = 0; f < 2; f++) {
    const im = new Img(16, 16);
    const bob = f;
    im.ellipse(8, 10 + bob, 5.5, 3, body);
    im.ellipse(7, 9 + bob, 3, 1.5, shade(body, 0.25));
    im.rect(10, 7 + bob, 3, 2, shade(body, -0.25));
    im.ellipse(4, 6 + bob, 2.4, 2.2, head);
    if (drake) im.hline(3, 8 + bob, 3, hex('#ffffff'));
    im.rect(1, 6 + bob, 2, 1, hex('#f0b030'));
    im.put(4, 5 + bob, hex('#101010'));
    outlineDark(im, -0.6);
    for (let x = 2; x < 15; x += 2) im.set(x, 13 + bob, hex('#f0f8ff', 160));
    out.blit(im, f * 16, 0);
    out.blit(im, 32 + f * 16, 0, { flipX: true });
  }
  return out;
}

/** Pigeon: 4 frames 16×16 (peck ×2 facing left, fly ×2). */
export function pigeon(): Img {
  const out = new Img(64, 16);
  const g = hex('#8a8c9a'), gl = hex('#b8bac8'), gd = hex('#5a5c6a');
  for (let f = 0; f < 4; f++) {
    const im = new Img(16, 16);
    if (f < 2) {
      im.ellipse(9, 11, 4, 2.6, g);
      im.ellipse(9, 10, 2.5, 1.3, gl);
      const hy = f === 0 ? 8 : 10;
      im.ellipse(5, hy, 2, 2, gd);
      im.put(4, hy - 1, hex('#f0a020'));
      im.put(3, hy, hex('#e0c080'));
      im.hline(12, 11, 2, gd);
      im.vline(8, 13, 2, hex('#e06060'));
      im.vline(10, 13, 2, hex('#e06060'));
    } else {
      im.ellipse(8, 9, 3.5, 2, g);
      im.ellipse(5, 8, 1.8, 1.8, gd);
      const up = f === 2;
      im.line(7, 8, up ? 4 : 3, up ? 2 : 12, gl);
      im.line(9, 8, up ? 13 : 13, up ? 2 : 12, gl);
    }
    outlineDark(im, -0.6);
    if (f < 2) im.ellipse(9, 15, 3.5, 0.8, hex('#000000', 50));
    out.blit(im, f * 16, 0);
  }
  return out;
}

export { stoneWall, mix };
export type { Color };
