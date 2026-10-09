/**
 * Ground painter. Paints a whole map's terrain into one image, pixel by pixel,
 * with neighbour-aware edges (curbs, turf rims, quay walls, foam) so the result
 * reads like hand-assembled HGSS tiles. Water pixels stay transparent so the
 * animated water layer underneath shows through.
 */
import { Img, hex, hash2, Color, withAlpha, shade } from './pixel';
import { C } from './palette';

export const TS = 16;

type T = string;
const isGrass = (t: T) => t === 'G' || t === 'L';
const isWater = (t: T) => t === 'W';
const isRoad = (t: T) => t === 'R' || t === 'X';

// ── base patterns (global pixel coords) ──
function grassAt(x: number, y: number, lawn = false): Color {
  const tx = Math.floor(x / TS), ty = Math.floor(y / TS);
  const lx = x - tx * TS, ly = y - ty * TS;
  let base = C.grass;
  if (lawn) base = Math.floor(x / 32) % 2 === 0 ? C.lawnA : C.lawnB;
  // HGSS grass: a few little two-blade tufts per tile, from 4 fixed variants
  const v = Math.floor(hash2(tx, ty, 7) * 4);
  const tufts = TUFTS[v];
  for (const [ox, oy] of tufts) {
    const dx = lx - ox, dy = ly - oy;
    if (dy === 0 && (dx === 0 || dx === 2)) return lawn ? shade(base, -0.14) : C.grassDark;
    if (dy === 1 && dx === 1) return lawn ? shade(base, -0.14) : C.grassDark;
    if (dy === -1 && (dx === 0 || dx === 2) && !lawn) return C.grassLight;
  }
  return base;
}
const TUFTS: [number, number][][] = [
  [[2, 3], [10, 6], [5, 11]],
  [[9, 2], [3, 8], [12, 12]],
  [[6, 4], [12, 9], [1, 13]],
  [[3, 2], [11, 3], [7, 10]],
];

function tanAt(x: number, y: number): Color {
  const lx = x % TS, ly = y % TS;
  if (lx === 15 || ly === 15) return C.tanSeam;
  if (lx === 0 || ly === 0) return C.tanLight;
  const h = hash2(x, y, 3);
  if (h < 0.035) return C.tanSeam;
  if (h > 0.965) return C.tanLight;
  return C.tan;
}
function roadAt(x: number, y: number): Color {
  const lx = x % 32, ly = y % 32;
  if (lx === 0 || ly === 0) return C.roadSeam;
  const h = hash2(x, y, 5);
  if (h < 0.05) return C.roadDark;
  if (h > 0.96) return C.roadLight;
  return C.road;
}
function plazaAt(x: number, y: number): Color {
  const row = Math.floor(y / 8);
  const ox = row % 2 ? 4 : 0;
  const lx = (x + ox) % 8, ly = y % 8;
  if (lx === 7 || ly === 7) return C.plazaMortar;
  const v = hash2(Math.floor((x + ox) / 8), row, 11);
  const base = v < 0.2 ? C.plazaB : v > 0.85 ? C.plazaC : C.plazaA;
  if (lx === 0 || ly === 0) return shade(base, 0.25);
  return base;
}
function boardAt(x: number, y: number): Color {
  // planks run across the walkway (horizontal), 4px each, staggered joints
  const row = Math.floor(y / 4);
  const ly = y % 4;
  if (ly === 3) return C.woodSeam;
  const joint = (x + row * 11) % 24;
  if (joint === 0) return C.woodSeam;
  if (joint === 2 && ly === 1) return C.woodNail;
  const v = hash2(Math.floor((x + row * 11) / 24), row, 13);
  const base = v < 0.33 ? C.woodA : v < 0.66 ? C.woodB : C.woodC;
  return ly === 0 ? shade(base, 0.12) : base;
}
function speckle(x: number, y: number, base: Color, d: Color, l: Color, s: number): Color {
  const h = hash2(x, y, s);
  if (h < 0.06) return d;
  if (h > 0.95) return l;
  return base;
}
function crossAt(x: number, y: number, horizontalRun: boolean): Color {
  const lx = x % TS, ly = y % TS;
  if (horizontalRun) {
    if (ly >= 2 && ly <= 13 && x % 4 < 2) return C.zebra;
  } else if (lx >= 2 && lx <= 13 && y % 4 < 2) return C.zebra;
  return roadAt(x, y);
}

export function baseColor(t: T, x: number, y: number, horizontalCross = false): Color {
  switch (t) {
    case 'G': return grassAt(x, y);
    case 'L': return grassAt(x, y, true);
    case 'T': return tanAt(x, y);
    case 'R': return roadAt(x, y);
    case 'X': return crossAt(x, y, horizontalCross);
    case 'P': return plazaAt(x, y);
    case 'B': return boardAt(x, y);
    case 'S': return speckle(x, y, C.sand, C.sandDark, C.sandLight, 17);
    case 'D': return speckle(x, y, C.dirt, C.dirtDark, C.dirtLight, 19);
    case 'W': return 0;
    // interior floors
    case 'f': return woodFloorAt(x, y);
    case 'r': return rugAt(x, y);
    case 'm': return matAt(x, y);
    case 'k': return checkerAt(x, y);
    case '_': return hex('#000000');
    default: return hex('#ff00ff');
  }
}

function woodFloorAt(x: number, y: number): Color {
  const row = Math.floor(y / 8);
  const ly = y % 8;
  const joint = (x + row * 13) % 32;
  if (ly === 7) return C.floorSeam;
  if (joint === 0) return C.floorSeam;
  const v = hash2(Math.floor((x + row * 13) / 32), row, 21);
  const base = v < 0.5 ? C.floorA : C.floorB;
  if (ly === 0) return shade(base, 0.1);
  if (hash2(x, y, 23) < 0.04) return shade(base, -0.08);
  return base;
}
function rugAt(x: number, y: number): Color {
  const lx = x % TS, ly = y % TS;
  const d = Math.abs(lx - 7.5) + Math.abs(ly - 7.5);
  if (d > 6 && d < 8) return C.rugGold;
  if (d < 3) return C.rugGold;
  return (Math.floor(x / 2) + Math.floor(y / 2)) % 2 ? C.rugA : C.rugB;
}
function matAt(x: number, y: number): Color {
  const lx = x % TS, ly = y % TS;
  if (lx < 1 || lx > 14 || ly < 3 || ly > 13) return woodFloorAt(x, y);
  if (lx === 1 || lx === 14 || ly === 3 || ly === 13) return C.matEdge;
  return (lx + ly) % 3 === 0 ? shade(C.mat, -0.15) : C.mat;
}
function checkerAt(x: number, y: number): Color {
  return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? hex('#e8e0d0') : hex('#b8b0a8');
}

/**
 * Paints the full ground layer.
 * `shadowRows` lets the caller drop soft shadows (e.g. under the elevated line).
 */
export function paintGround(terrain: string[], opts: { shadows?: { x: number; y: number; w: number; h: number }[] } = {}): Img {
  const H = terrain.length, W = terrain[0].length;
  const img = new Img(W * TS, H * TS);
  const tAt = (tx: number, ty: number): T => {
    tx = Math.max(0, Math.min(W - 1, tx));
    ty = Math.max(0, Math.min(H - 1, ty));
    return terrain[ty][tx];
  };

  for (let ty = 0; ty < H; ty++)
    for (let tx = 0; tx < W; tx++) {
      const t = tAt(tx, ty);
      const n = { l: tAt(tx - 1, ty), r: tAt(tx + 1, ty), u: tAt(tx, ty - 1), d: tAt(tx, ty + 1) };
      const hCross = t === 'X' && (n.l === 'X' || n.r === 'X');
      for (let ly = 0; ly < TS; ly++)
        for (let lx = 0; lx < TS; lx++) {
          const x = tx * TS + lx, y = ty * TS + ly;
          let c = baseColor(t, x, y, hCross);
          // distance to each differing edge
          const edges: { d: number; o: T; side: 'l' | 'r' | 'u' | 'd' | 'c' }[] = [];
          if (n.l !== t) edges.push({ d: lx, o: n.l, side: 'l' });
          if (n.r !== t) edges.push({ d: TS - 1 - lx, o: n.r, side: 'r' });
          if (n.u !== t) edges.push({ d: ly, o: n.u, side: 'u' });
          if (n.d !== t) edges.push({ d: TS - 1 - ly, o: n.d, side: 'd' });
          // concave corners (diagonal neighbour differs while both orthogonals match)
          const diag: [number, number, number, number][] = [[-1, -1, lx, ly], [1, -1, TS - 1 - lx, ly], [-1, 1, lx, TS - 1 - ly], [1, 1, TS - 1 - lx, TS - 1 - ly]];
          for (const [dx, dy, ex, ey] of diag) {
            const o = tAt(tx + dx, ty + dy);
            if (o !== t && tAt(tx + dx, ty) === t && tAt(tx, ty + dy) === t) edges.push({ d: Math.max(ex, ey), o, side: 'c' });
          }
          // convex corner rounding for soft paths
          if ((t === 'D' || t === 'S') ) {
            const r = 3;
            for (const [dx, dy, ex, ey] of diag) {
              const ox = tAt(tx + dx, ty), oy = tAt(tx, ty + dy);
              if (ox !== t && oy !== t && ox === oy && isGrass(ox) && ex < r && ey < r) {
                const ddx = r - ex - 0.5, ddy = r - ey - 0.5;
                if (ddx * ddx + ddy * ddy > r * r - 1) {
                  c = baseColor(ox, x, y);
                  edges.length = 0;
                  if (ddx * ddx + ddy * ddy < (r + 1.2) * (r + 1.2)) c = C.grassEdge;
                }
              }
            }
          }
          // rounded shorelines: land bulges into convex water corners
          let shoreLand = false;
          if (t === 'W') {
            const r = 6;
            for (const [dx, dy, ex, ey] of diag) {
              const ox = tAt(tx + dx, ty), oy = tAt(tx, ty + dy);
              if (ox !== oy || isWater(ox) || ex >= r || ey >= r) continue;
              const dist = Math.hypot(r - ex - 0.5, r - ey - 0.5);
              if (dist > r) {
                const d = Math.floor(dist - r);
                c = edgeColor(ox, 'W', d, dy < 0 ? 'd' : 'u', x, y) ?? baseColor(ox, x, y);
                shoreLand = true;
              } else if (dist > r - 1.2) {
                c = withAlpha(C.foam, 200);
                shoreLand = true;
              }
            }
          }
          if (shoreLand) {
            img.put(x, y, c);
            continue;
          }
          if (edges.length) {
            edges.sort((a, b) => a.d - b.d);
            const e = edges[0];
            const ec = edgeColor(t, e.o, e.d, e.side, x, y);
            if (ec !== null) c = ec;
          }
          if (c) img.put(x, y, c);
          else img.put(x, y, 0);
          // water edge overlays are partially transparent → blend on empty
          if (t === 'W' && edges.length) {
            const e = edges[0];
            const wc = waterEdge(e.o, e.d, e.side, x, y);
            if (wc) img.put(x, y, wc);
          }
        }
    }
  for (const s of opts.shadows ?? []) {
    for (let y = s.y; y < s.y + s.h; y++)
      for (let x = s.x; x < s.x + s.w; x++) {
        const c = img.get(x, y);
        if (c && (c & 255) === 255) img.put(x, y, shade(c, -0.22));
      }
  }
  return img;
}

function edgeColor(t: T, o: T, d: number, side: string, x: number, y: number): Color | null {
  if (t === 'W') return null;
  // land meeting water
  if (isWater(o)) {
    const south = side === 'd';
    if (t === 'B') {
      if (d === 0) return C.woodSeam;
      if (south && d <= 2) return shade(C.woodB, -0.3);
      return null;
    }
    if (t === 'T' || t === 'P' || isRoad(t)) {
      if (d === 0) return C.quayDark;
      if (d === 1) return south ? C.quayMid : C.quayLight;
      if (d === 2 && south) return C.quayLight;
      return null;
    }
    // soft bank (grass / sand / dirt)
    const sandy = t === 'S';
    if (d === 0) return sandy ? C.bankSandDark : C.bankDark;
    if (d === 1) return sandy ? C.bankSandMid : C.bankMid;
    if (d === 2) return sandy ? C.sandLight : south ? C.bankMid : C.bankLight;
    if (d === 3 && south && !sandy) return C.bankLight;
    return null;
  }
  if (isGrass(t)) {
    if (o === 'G' || o === 'L') return null;
    if (d === 0) return C.grassEdge;
    return null;
  }
  if (t === 'T') {
    if (isGrass(o)) return d === 0 ? C.tanEdge : d === 1 ? C.tanSeam : null;
    if (isRoad(o)) return d === 0 ? C.curbLight : d === 1 ? C.curbDark : null;
    if (o === 'P') return null;
    if (o === 'B') return d === 0 ? C.tanEdge : null;
    return d === 0 ? C.tanSeam : null;
  }
  if (isRoad(t)) {
    if (isRoad(o)) return null;
    return d === 0 ? C.roadShadow : d === 1 ? C.roadDark : null;
  }
  if (t === 'P') {
    if (d === 0) return C.plazaRimDark;
    if (d === 1) return C.plazaRim;
    return null;
  }
  if (t === 'D') return d === 0 && isGrass(o) ? C.dirtDark : null;
  if (t === 'S') return d === 0 && isGrass(o) ? C.sandDark : null;
  if (t === 'B') return d === 0 ? C.woodSeam : null;
  if (t === 'f' && o === '_') return null;
  return null;
}

/** Foam / shadow pixels painted over the (transparent) water near shores. */
function waterEdge(o: T, d: number, side: string, x: number, y: number): Color | null {
  if (isWater(o)) return null;
  const wall = o === 'T' || o === 'P' || o === 'R' || o === 'B';
  if (side === 'u') {
    // land to the north casts a shadow onto the water
    if (d <= (wall ? 2 : 1)) return withAlpha(C.waterShadow, 150);
    if (d === (wall ? 3 : 2) && (x + Math.floor(y / 2)) % 3 !== 0) return withAlpha(C.foam, 170);
    return null;
  }
  if (d === 0) return withAlpha(C.foam, (x + y) % 4 === 0 ? 120 : 210);
  if (d === 1 && (x * 3 + y) % 5 < 2) return withAlpha(C.foam, 110);
  return null;
}

/** 4-frame, 32×32 seamless water pattern (deep blue with drifting wave glints). */
export function waterFrames(): Img {
  const N = 4, S = 32;
  const out = new Img(S * N, S);
  for (let f = 0; f < N; f++) {
    for (let y = 0; y < S; y++)
      for (let x = 0; x < S; x++) {
        // diagonal swell bands
        const band = Math.sin(((x + y * 0.5 + f * 2) / S) * Math.PI * 2) + Math.sin(((y - f * 2) / S) * Math.PI * 4) * 0.5;
        let c = band > 0.9 ? C.waterB : band < -0.9 ? C.waterD : C.waterA;
        out.put(f * S + x, y, c);
      }
    // wave glints: little crescent marks, drifting per frame
    const marks: [number, number][] = [[4, 5], [20, 3], [12, 14], [27, 18], [6, 24], [18, 27]];
    marks.forEach(([mx, my], i) => {
      const ox = (mx + f * (i % 2 ? 1 : -1) + S) % S, oy = my;
      const phase = (f + i) % 4;
      const len = phase === 0 ? 2 : phase === 1 ? 4 : phase === 2 ? 3 : 1;
      for (let k = 0; k < len; k++) {
        out.put(f * S + ((ox + k) % S), oy, C.waterGlint);
        if (k > 0 && k < len - 1) out.put(f * S + ((ox + k) % S), (oy + S - 1) % S, C.waterLight);
      }
      if (len > 2) out.put(f * S + ((ox + len) % S), (oy + 1) % S, C.waterB);
    });
  }
  return out;
}
