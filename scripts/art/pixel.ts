/**
 * Tiny pixel-art raster library used by the asset generator.
 * Colors are packed 0xRRGGBBAA numbers; 0 means fully transparent.
 */
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

export type Color = number;

export function hex(h: string, a = 255): Color {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16);
  return ((n << 8) | a) >>> 0;
}
export const rgba = (r: number, g: number, b: number, a = 255): Color =>
  (((r & 255) << 24) | ((g & 255) << 16) | ((b & 255) << 8) | (a & 255)) >>> 0;
export const R = (c: Color) => (c >>> 24) & 255;
export const G = (c: Color) => (c >>> 16) & 255;
export const B = (c: Color) => (c >>> 8) & 255;
export const A = (c: Color) => c & 255;
export const withAlpha = (c: Color, a: number) => ((c & 0xffffff00) | (a & 255)) >>> 0;

export function mix(a: Color, b: Color, t: number): Color {
  return rgba(
    Math.round(R(a) + (R(b) - R(a)) * t),
    Math.round(G(a) + (G(b) - G(a)) * t),
    Math.round(B(a) + (B(b) - B(a)) * t),
    Math.round(A(a) + (A(b) - A(a)) * t),
  );
}
/** Positive amt lightens toward white, negative darkens toward a cool shadow. */
export function shade(c: Color, amt: number): Color {
  if (amt >= 0) return mix(c, rgba(255, 255, 255, A(c)), amt);
  return mix(c, rgba(24, 20, 40, A(c)), -amt);
}

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1)),
    pick: <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}
export type Rng = ReturnType<typeof rng>;

/** Stable hash of integer coordinates → [0,1). */
export function hash2(x: number, y: number, s = 0): number {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export class Img {
  readonly data: Uint32Array;
  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint32Array(w * h);
  }
  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }
  get(x: number, y: number): Color {
    return this.inside(x, y) ? this.data[y * this.w + x] : 0;
  }
  /** Writes a pixel; alpha < 255 blends over the existing pixel. */
  set(x: number, y: number, c: Color) {
    x |= 0;
    y |= 0;
    if (!this.inside(x, y)) return;
    const a = A(c);
    if (a === 0) return;
    if (a === 255) {
      this.data[y * this.w + x] = c;
      return;
    }
    const d = this.data[y * this.w + x];
    const da = A(d);
    if (da === 0) {
      this.data[y * this.w + x] = c;
      return;
    }
    const t = a / 255;
    const outA = Math.min(255, Math.round(a + da * (1 - t)));
    this.data[y * this.w + x] = rgba(
      Math.round(R(c) * t + R(d) * (1 - t)),
      Math.round(G(c) * t + G(d) * (1 - t)),
      Math.round(B(c) * t + B(d) * (1 - t)),
      outA,
    );
  }
  /** Writes without blending (can erase). */
  put(x: number, y: number, c: Color) {
    if (this.inside(x | 0, y | 0)) this.data[(y | 0) * this.w + (x | 0)] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: Color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  clear(x: number, y: number, w: number, h: number) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, 0);
  }
  hline(x: number, y: number, w: number, c: Color) {
    this.rect(x, y, w, 1, c);
  }
  vline(x: number, y: number, h: number, c: Color) {
    this.rect(x, y, 1, h, c);
  }
  /** Outlined, shaded box: light top-left rim, dark bottom-right rim. */
  box(
    x: number,
    y: number,
    w: number,
    h: number,
    base: Color,
    o: { outline?: Color; light?: Color; dark?: Color } = {},
  ) {
    this.rect(x, y, w, h, base);
    if (o.light) {
      this.hline(x, y, w, o.light);
      this.vline(x, y, h, o.light);
    }
    if (o.dark) {
      this.hline(x, y + h - 1, w, o.dark);
      this.vline(x + w - 1, y, h, o.dark);
    }
    if (o.outline) this.strokeRect(x - 1, y - 1, w + 2, h + 2, o.outline);
  }
  strokeRect(x: number, y: number, w: number, h: number, c: Color) {
    this.hline(x, y, w, c);
    this.hline(x, y + h - 1, w, c);
    this.vline(x, y, h, c);
    this.vline(x + w - 1, y, h, c);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: Color) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }
  /** Draws another image onto this one. */
  blit(src: Img, dx: number, dy: number, opts: { flipX?: boolean; sx?: number; sy?: number; sw?: number; sh?: number } = {}) {
    const sx = opts.sx ?? 0, sy = opts.sy ?? 0;
    const sw = opts.sw ?? src.w, sh = opts.sh ?? src.h;
    for (let j = 0; j < sh; j++)
      for (let i = 0; i < sw; i++) {
        const c = src.get(opts.flipX ? sx + sw - 1 - i : sx + i, sy + j);
        if (c) this.set(dx + i, dy + j, c);
      }
  }
  /** Adds a 1px outline around opaque pixels (outside only). */
  outline(c: Color, diagonal = false) {
    const src = this.data.slice();
    const op = (x: number, y: number) => x >= 0 && y >= 0 && x < this.w && y < this.h && A(src[y * this.w + x]) > 0;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (op(x, y)) continue;
        let n = op(x - 1, y) || op(x + 1, y) || op(x, y - 1) || op(x, y + 1);
        if (diagonal) n = n || op(x - 1, y - 1) || op(x + 1, y - 1) || op(x - 1, y + 1) || op(x + 1, y + 1);
        if (n) this.data[y * this.w + x] = c;
      }
  }
  /** Replaces every pixel with fn(x,y,color) where opaque. */
  map(fn: (x: number, y: number, c: Color) => Color) {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.data[y * this.w + x];
        if (A(c)) this.data[y * this.w + x] = fn(x, y, c);
      }
  }
  clone() {
    const o = new Img(this.w, this.h);
    o.data.set(this.data);
    return o;
  }
  crop(x: number, y: number, w: number, h: number) {
    const o = new Img(w, h);
    o.blit(this, 0, 0, { sx: x, sy: y, sw: w, sh: h });
    return o;
  }
  flipped() {
    const o = new Img(this.w, this.h);
    o.blit(this, 0, 0, { flipX: true });
    return o;
  }
  /** Paints an ASCII pixel map using a palette (char → color). '.' and ' ' are transparent. */
  ascii(x: number, y: number, rows: string[], pal: Record<string, Color>, flipX = false) {
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c === undefined) throw new Error(`palette missing '${ch}'`);
        this.set(flipX ? x + row.length - 1 - i : x + i, y + j, c);
      }
    });
  }
  scaled(k: number) {
    const o = new Img(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.data[y * o.w + x] = this.data[((y / k) | 0) * this.w + ((x / k) | 0)];
    return o;
  }
  toPNG(): Buffer {
    const png = new PNG({ width: this.w, height: this.h });
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      png.data[i * 4] = R(c);
      png.data[i * 4 + 1] = G(c);
      png.data[i * 4 + 2] = B(c);
      png.data[i * 4 + 3] = A(c);
    }
    return PNG.sync.write(png);
  }
  save(file: string) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, this.toPNG());
  }
}

/** Packs named images into a single atlas (shelf packer) → Phaser JSON-hash atlas. */
export function packAtlas(items: Record<string, Img>, maxW = 1024, pad = 1) {
  const entries = Object.entries(items).sort((a, b) => b[1].h - a[1].h || b[1].w - a[1].w);
  let x = 0, y = 0, rowH = 0, W = 0;
  const pos: Record<string, { x: number; y: number }> = {};
  for (const [k, im] of entries) {
    if (x + im.w > maxW) { x = 0; y += rowH + pad; rowH = 0; }
    pos[k] = { x, y };
    x += im.w + pad;
    rowH = Math.max(rowH, im.h);
    W = Math.max(W, x);
  }
  const H = y + rowH;
  const pow2 = (n: number) => { let p = 1; while (p < n) p <<= 1; return p; };
  const atlas = new Img(Math.min(maxW, pow2(W)), pow2(H));
  const frames: Record<string, unknown> = {};
  for (const [k, im] of entries) {
    const p = pos[k];
    atlas.blit(im, p.x, p.y);
    frames[k] = {
      frame: { x: p.x, y: p.y, w: im.w, h: im.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: im.w, h: im.h },
      sourceSize: { w: im.w, h: im.h },
    };
  }
  return { img: atlas, json: { frames, meta: { image: '', size: { w: atlas.w, h: atlas.h }, scale: '1' } } };
}
