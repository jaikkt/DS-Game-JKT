import type { PrefabKey } from './prefabs';

export type Dir = 'down' | 'up' | 'left' | 'right';

export interface WarpTarget {
  map: string;
  x: number;
  y: number;
  dir: Dir;
}

export interface Placement {
  key: PrefabKey;
  x: number;
  y: number;
  /** Pages shown when the player presses A while facing any solid tile of this object. */
  text?: string[];
  /** Door behaviour for 'D' tiles in the mask. */
  door?: { warp?: WarpTarget; text?: string[] };
}

export type NpcBehavior =
  | { kind: 'static' }
  | { kind: 'look'; dirs?: Dir[] }
  | { kind: 'wander'; radius: number }
  | { kind: 'patrol'; path: [number, number][] };

export interface NpcDef {
  id: string;
  sprite: string;
  x: number;
  y: number;
  dir: Dir;
  behavior: NpcBehavior;
  /** Dialogue pages. Successive conversations cycle through `more` if provided. */
  lines: string[];
  more?: string[][];
}

export interface TileText {
  x: number;
  y: number;
  text: string[];
  /** If set, only triggers when the player faces this direction (e.g. signs read from the front). */
  face?: Dir;
}

export interface MapDef {
  id: string;
  name: string;
  width: number;
  height: number;
  /** One char per tile. See terrain legend in art/terrain.ts. */
  terrain: string[];
  placements: Placement[];
  npcs: NpcDef[];
  texts: TileText[];
  /** Walk-onto warps (e.g. interior exit mats). */
  warps: { x: number; y: number; to: WarpTarget }[];
  spawn: { x: number; y: number; dir: Dir };
  /** Interior maps are drawn over black and the camera centres if the room is small. */
  interior?: boolean;
}
