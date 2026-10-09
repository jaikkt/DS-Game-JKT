/** Reusable drawing helpers for 3/4-view HGSS-style architecture and props. */
import { Img, hex, shade, Color, rng, hash2, mix } from './pixel';

export const OUT = hex('#2a2430');

/** Union-of-circles leafy blob with per-clump top-left highlights. */
export function leafCluster(
  im: Img,
  clumps: [number, number, number][],
  pal: { base: Color; light: Color; dark: Color; deep: Color },
) {
  // silhouette
  for (const [cx, cy, r] of clumps) im.ellipse(cx, cy, r, r * 0.92, pal.base);
  // per-clump shading (back-to-front order given by caller)
  for (const [cx, cy, r] of clumps) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        const d = Math.sqrt(dx * dx + (dy * dy) / 0.85);
        if (d > r) continue;
        const lit = (dx + dy) / r;
        let c = pal.base;
        if (d > r - 1.6 && lit > 0.35) c = pal.dark;
        else if (lit < -0.75 && d > r * 0.45) c = pal.light;
        else if (lit > 0.95) c = pal.dark;
        im.put(x, y, c);
      }
  }
  // leaf texture flecks
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++) {
      const c = im.get(x, y);
      if (c !== pal.base) continue;
      const h = hash2(x, y, 41);
      if (h < 0.06) im.put(x, y, pal.dark);
      else if (h > 0.95) im.put(x, y, pal.light);
    }
}

/** Dark outline coloured from the neighbouring pixel. */
export function outlineDark(im: Img, k = -0.62, solid?: Color) {
  const src = im.data.slice();
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < im.w && y < im.h ? src[y * im.w + x] : 0);
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++) {
      if ((at(x, y) & 255) > 0) continue;
      const n = [at(x, y - 1), at(x - 1, y), at(x + 1, y), at(x, y + 1)].find((c) => (c & 255) === 255);
      if (n) im.put(x, y, solid ?? shade(n, k));
    }
}

export function groundShadow(im: Img, cx: number, cy: number, rx: number, ry: number, a = 60) {
  im.ellipse(cx, cy, rx, ry, hex('#103020', a));
}

// ───────────── walls ─────────────
export function stoneWall(im: Img, x: number, y: number, w: number, h: number, seed = 1, tones?: Color[]) {
  const r = rng(seed);
  const T = tones ?? [hex('#a8a29a'), hex('#9a948e'), hex('#b4aa9c'), hex('#a49a94'), hex('#bcb0a6'), hex('#8e8a86'), hex('#b0a4a0')];
  const mortar = hex('#6e6a6c');
  im.rect(x, y, w, h, mortar);
  let yy = y;
  while (yy < y + h) {
    const rh = r.int(3, 4);
    let xx = x - r.int(0, 4);
    while (xx < x + w) {
      const sw = r.int(4, 8);
      const c = r.pick(T);
      for (let j = 0; j < rh - 1; j++)
        for (let i = 0; i < sw - 1; i++) {
          const px = xx + i, py = yy + j;
          if (px < x || px >= x + w || py >= y + h) continue;
          let cc = c;
          if (j === 0 || i === 0) cc = shade(c, 0.18);
          else if (j === rh - 2) cc = shade(c, -0.12);
          im.put(px, py, cc);
        }
      xx += sw;
    }
    yy += rh;
  }
}

export function brickWall(im: Img, x: number, y: number, w: number, h: number, base: Color, seed = 3) {
  const mortar = shade(base, -0.38);
  im.rect(x, y, w, h, mortar);
  for (let yy = 0; yy < h; yy += 3) {
    const off = (yy / 3) % 2 ? 3 : 0;
    for (let xx = -off; xx < w; xx += 6) {
      const v = hash2(xx + x, yy + y, seed);
      const c = v < 0.25 ? shade(base, -0.1) : v > 0.85 ? shade(base, 0.1) : base;
      for (let i = 0; i < 5; i++)
        for (let j = 0; j < 2; j++) {
          const px = x + xx + i, py = y + yy + j;
          if (px >= x && px < x + w && py < y + h) im.put(px, py, j === 0 ? shade(c, 0.07) : c);
        }
    }
  }
}

export function plaster(im: Img, x: number, y: number, w: number, h: number, base: Color) {
  im.rect(x, y, w, h, base);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const v = hash2(x + i, y + j, 77);
      if (v < 0.04) im.put(x + i, y + j, shade(base, -0.06));
    }
  im.vline(x + w - 1, y, h, shade(base, -0.16));
  im.vline(x, y, h, shade(base, 0.2));
}

// ───────────── openings ─────────────
export function windowGlass(
  im: Img,
  x: number,
  y: number,
  w: number,
  h: number,
  o: { frame?: Color; glass?: Color; sill?: Color; panes?: 'cross' | 'v' | 'none' | 'grid'; arch?: boolean; lit?: boolean } = {},
) {
  const frame = o.frame ?? hex('#f4f0e8');
  const glass = o.glass ?? hex('#6ab0e8');
  const gd = shade(glass, -0.32), gl = shade(glass, 0.45);
  im.rect(x, y, w, h, frame);
  const gx = x + 1, gy = y + 1, gw = w - 2, gh = h - 2;
  for (let j = 0; j < gh; j++)
    for (let i = 0; i < gw; i++) {
      let c = mix(gd, glass, Math.min(1, j / Math.max(1, gh - 1) + 0.3));
      if (o.lit) c = mix(hex('#f8d870'), hex('#f0a848'), j / gh);
      if ((i - j + 100) % 7 === 0 && i + j < gw + gh - 4) c = gl;
      im.put(gx + i, gy + j, c);
    }
  if (o.arch) {
    im.put(x, y, 0); im.put(x + w - 1, y, 0);
    im.put(x + 1, y, frame); im.put(x + w - 2, y, frame);
  }
  im.hline(gx, gy, gw, shade(glass, -0.5));
  if (o.panes === 'cross' || o.panes === undefined) {
    im.vline(x + (w >> 1), gy, gh, frame);
    im.hline(gx, y + (h >> 1), gw, frame);
  } else if (o.panes === 'v') im.vline(x + (w >> 1), gy, gh, frame);
  else if (o.panes === 'grid') {
    for (let i = 3; i < gw; i += 3) im.vline(gx + i, gy, gh, frame);
    for (let j = 3; j < gh; j += 4) im.hline(gx, gy + j, gw, frame);
  }
  if (o.sill !== undefined) im.hline(x - 1, y + h, w + 2, o.sill);
  im.strokeRect(x - 1, y - 1, w + 2, h + 2, shade(frame, -0.55));
}

export function door(im: Img, x: number, y: number, w: number, h: number, base: Color, o: { glass?: boolean; double?: boolean; knob?: Color } = {}) {
  const d = shade(base, -0.3), l = shade(base, 0.25);
  im.rect(x, y, w, h, base);
  im.strokeRect(x - 1, y - 1, w + 2, h + 1, shade(base, -0.6));
  im.vline(x, y, h, l);
  im.vline(x + w - 1, y, h, d);
  if (o.double) im.vline(x + (w >> 1), y, h, d);
  // panels
  const pw = o.double ? (w >> 1) - 3 : w - 4;
  for (const px of o.double ? [x + 1, x + (w >> 1) + 1] : [x + 2]) {
    if (o.glass) im.rect(px + 1, y + 2, pw - 1, Math.floor(h / 2) - 1, hex('#80c0e8'));
    else im.strokeRect(px, y + 2, pw, Math.floor(h / 2) - 1, d);
    im.strokeRect(px, y + Math.floor(h / 2) + 2, pw, Math.floor(h / 2) - 4, d);
  }
  if (o.knob !== undefined) im.put(x + w - 3, y + (h >> 1) + 1, o.knob);
}

export function awning(im: Img, x: number, y: number, w: number, h: number, a: Color, b: Color) {
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const stripe = Math.floor(i / 3) % 2 ? a : b;
      let c = j === 0 ? shade(stripe, 0.25) : j > h - 3 ? shade(stripe, -0.15) : stripe;
      im.put(x + i, y + j, c);
    }
  // scalloped valance
  for (let i = 0; i < w; i++) {
    const stripe = Math.floor(i / 3) % 2 ? a : b;
    if (i % 3 !== 2) im.put(x + i, y + h, shade(stripe, -0.2));
    if (i % 3 === 1) im.put(x + i, y + h + 1, shade(stripe, -0.35));
  }
  im.hline(x, y - 1, w, shade(a, -0.55));
}

// ───────────── roofs ─────────────
/** Terracotta hip roof (Kerala). Viewed from above at 3/4: trapezoid with a ridge. */
export function terracottaRoof(im: Img, x: number, y: number, w: number, h: number, o: { base?: Color; inset?: number; gablet?: boolean } = {}) {
  const base = o.base ?? hex('#c85a3a');
  const lt = shade(base, 0.22), dk = shade(base, -0.28), dd = shade(base, -0.5);
  const inset = o.inset ?? Math.min(18, Math.floor(w * 0.22));
  const ridgeY = y + 3;
  for (let j = 0; j < h; j++) {
    const t = j / (h - 1);
    const ins = Math.round(inset * (1 - Math.min(1, j / (h * 0.75))));
    const x0 = x + ins, x1 = x + w - 1 - ins;
    for (let i = x0; i <= x1; i++) {
      const yy = y + j;
      // which face? left hip / right hip / front
      const leftHip = i < x + inset && i - x < (inset * (yy - y)) / (h * 0.75) ? false : i < x + inset;
      const lj = j % 4;
      const lx = (i + (Math.floor(j / 4) % 2) * 2) % 4;
      let c = base;
      if (lj === 0) c = lt;
      else if (lj === 3) c = dk;
      if (lx === 3 && lj > 0) c = dk;
      if (lx === 0 && lj === 1) c = lt;
      // hips: shade side faces
      const relL = i - x0, relR = x1 - i;
      if (relL < (inset * (1 - t)) * 0.9 + 2 && j > 3) c = shade(c, 0.12);
      if (relR < (inset * (1 - t)) * 0.9 + 2 && j > 3) c = shade(c, -0.18);
      void leftHip;
      im.put(i, yy, c);
    }
  }
  // ridge cap
  im.hline(x + inset, ridgeY - 1, w - inset * 2, dd);
  im.hline(x + inset, ridgeY, w - inset * 2, shade(base, -0.1));
  im.hline(x + inset, ridgeY - 2, w - inset * 2, lt);
  // eave
  im.hline(x, y + h - 1, w, dd);
  im.hline(x, y + h - 2, w, dk);
  if (o.gablet) {
    const cx = x + (w >> 1);
    for (let j = 0; j < 9; j++) {
      for (let i = -j; i <= j; i++) {
        const c = Math.abs(i) === j ? hex('#5a3420') : j > 1 && Math.abs(i) < j - 1 ? (j % 2 ? hex('#8a5a32') : hex('#7a4a28')) : hex('#a8723e');
        im.put(cx + i, ridgeY + j - 1, c);
      }
    }
    im.put(cx, ridgeY - 3, hex('#e8c050'));
    im.put(cx, ridgeY - 2, hex('#a8723e'));
  }
}

/** Flat city roof with a parapet rim (Goldenrod style). */
export function flatRoof(im: Img, x: number, y: number, w: number, h: number, o: { surface?: Color; rim?: Color; seed?: number; vents?: boolean } = {}) {
  const surf = o.surface ?? hex('#a8a098');
  const rim = o.rim ?? hex('#d8d0c4');
  im.rect(x, y, w, h, rim);
  im.hline(x, y, w, shade(rim, 0.3));
  im.vline(x, y, h, shade(rim, 0.15));
  im.vline(x + w - 1, y, h, shade(rim, -0.25));
  im.hline(x, y + h - 1, w, shade(rim, -0.45));
  im.hline(x, y + h - 2, w, shade(rim, -0.2));
  const sx = x + 3, sy = y + 3, sw = w - 6, sh = h - 6;
  for (let j = 0; j < sh; j++)
    for (let i = 0; i < sw; i++) {
      let c = surf;
      if (j === 0 || i === 0) c = shade(surf, -0.25);
      else if ((i + j * 3) % 11 === 0 && hash2(i, j, o.seed ?? 5) < 0.6) c = shade(surf, -0.08);
      im.put(sx + i, sy + j, c);
    }
  if (o.vents !== false) {
    const r = rng(o.seed ?? 9);
    const n = Math.max(1, Math.floor((sw * sh) / 260));
    for (let k = 0; k < n; k++) {
      const vx = sx + r.int(2, Math.max(2, sw - 8)), vy = sy + r.int(2, Math.max(2, sh - 7));
      im.box(vx, vy, 6, 4, hex('#c8c8cc'), { light: hex('#f0f0f4'), dark: hex('#88888c') });
      im.hline(vx + 1, vy + 4, 6, shade(surf, -0.3));
      im.hline(vx + 1, vy + 2, 4, hex('#8c8c94'));
    }
  }
}

/** Slate pitched roof seen from the front (ridge at top). */
export function slateRoof(im: Img, x: number, y: number, w: number, h: number, base = hex('#5e6676')) {
  const lt = shade(base, 0.2), dk = shade(base, -0.3);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const lj = j % 3, lx = (i + (Math.floor(j / 3) % 2) * 3) % 6;
      let c = base;
      if (lj === 0) c = lt;
      if (lj === 2 || lx === 0) c = dk;
      if (hash2(x + i, y + j, 31) < 0.05) c = shade(c, 0.1);
      im.put(x + i, y + j, c);
    }
  im.hline(x, y, w, shade(base, -0.5));
  im.hline(x, y + 1, w, shade(base, 0.35));
  im.hline(x, y + h - 1, w, shade(base, -0.55));
}

export function pointedRoof(im: Img, cx: number, top: number, halfW: number, h: number, base: Color) {
  for (let j = 0; j < h; j++) {
    const hw = Math.round((halfW * (j + 1)) / h);
    for (let i = -hw; i <= hw; i++) {
      let c = i < 0 ? shade(base, 0.15) : shade(base, -0.2);
      if ((j + Math.abs(i)) % 3 === 0) c = shade(c, -0.1);
      if (Math.abs(i) === hw) c = shade(base, -0.55);
      im.put(cx + i, top + j, c);
    }
  }
  im.put(cx, top - 1, hex('#e0c050'));
  im.put(cx, top - 2, hex('#e0c050'));
}

export function stairs(im: Img, x: number, y: number, w: number, h: number, base: Color) {
  for (let j = 0; j < h; j++) {
    const c = j % 2 === 0 ? shade(base, 0.2) : shade(base, -0.15);
    im.hline(x, y + j, w, c);
  }
  im.vline(x - 1, y, h, shade(base, -0.5));
  im.vline(x + w, y, h, shade(base, -0.5));
}

/** Soft drop shadow down/right of a footprint, painted onto the image's lowest rows. */
export function baseShadow(im: Img, x: number, y: number, w: number, a = 70) {
  for (let i = 0; i < w; i++) im.set(x + i, y, hex('#201820', a));
}
