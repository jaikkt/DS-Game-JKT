/** Derives collision, doors and interaction lookups from a MapDef + prefab masks. */
import { PREFABS } from './prefabs';
import type { MapDef, Placement, WarpTarget, Dir } from './types';
import { TOWN } from './town';
import { CAFE } from './cafe';

export const MAPS: Record<string, MapDef> = { town: TOWN, cafe: CAFE };

export const DIRS: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

export interface MapRuntime {
  def: MapDef;
  solid: Uint8Array;
  /** placement owning each solid tile (for "read" interactions) */
  owner: (Placement | undefined)[];
  doors: Map<number, { placement: Placement; warp?: WarpTarget; text?: string[] }>;
  warps: Map<number, WarpTarget>;
  isSolid(x: number, y: number): boolean;
  terrainAt(x: number, y: number): string;
  idx(x: number, y: number): number;
}

export function buildRuntime(def: MapDef): MapRuntime {
  const { width: W, height: H } = def;
  const idx = (x: number, y: number) => y * W + x;
  const solid = new Uint8Array(W * H);
  const owner: (Placement | undefined)[] = new Array(W * H);
  const doors = new Map<number, { placement: Placement; warp?: WarpTarget; text?: string[] }>();
  const warps = new Map<number, WarpTarget>();

  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const t = def.terrain[y][x];
      if (t === 'W' || t === '_') solid[idx(x, y)] = 1;
    }
  for (const p of def.placements) {
    const d = PREFABS[p.key];
    d.mask.forEach((row, j) =>
      [...row].forEach((c, i) => {
        const x = p.x + i, y = p.y + j;
        if (x < 0 || y < 0 || x >= W || y >= H || c === '.') return;
        const k = idx(x, y);
        owner[k] = p;
        if (c === 'D') {
          doors.set(k, { placement: p, warp: p.door?.warp, text: p.door?.text });
          solid[k] = p.door?.warp ? 0 : 1;
          if (p.door?.warp) warps.set(k, p.door.warp);
        } else solid[k] = 1;
      }),
    );
  }
  for (const w of def.warps) warps.set(idx(w.x, w.y), w.to);

  return {
    def,
    solid,
    owner,
    doors,
    warps,
    idx,
    isSolid: (x, y) => x < 0 || y < 0 || x >= W || y >= H || solid[idx(x, y)] === 1,
    terrainAt: (x, y) => def.terrain[y]?.[x] ?? '_',
  };
}
