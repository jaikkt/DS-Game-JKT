/**
 * Prefab footprints. Shared by the asset generator (which paints the art at
 * exactly w*16 × h*16 px) and the runtime (which derives collision from `mask`).
 *
 * mask legend (one char per tile, rows top→bottom):
 *   '.' walkable   '#' solid   'D' door (solid unless the placement defines a warp)
 * overlay: number of top tile-rows drawn above characters (tree canopies, roofs, decks).
 */
export interface PrefabDef {
  w: number;
  h: number;
  mask: string[];
  overlay?: number;
  /** Rendered as a live sprite (animated) instead of being baked into the map layers. */
  animated?: { frames: number; fps: number };
}

const solid = (w: number, h: number, free = 0) =>
  Array.from({ length: h }, (_, i) => (i < free ? '.'.repeat(w) : '#'.repeat(w)));

const withDoor = (rows: string[], dx: number, dy: number) =>
  rows.map((r, y) => (y === dy ? r.slice(0, dx) + 'D' + r.slice(dx + 1) : r));

const DEFS = {
  // vegetation
  tree: { w: 2, h: 3, mask: solid(2, 3, 1), overlay: 1 },
  tree_dark: { w: 2, h: 3, mask: solid(2, 3, 1), overlay: 1 },
  tree_small: { w: 1, h: 2, mask: solid(1, 2, 1), overlay: 1 },
  palm: { w: 3, h: 4, mask: ['...', '...', '...', '.#.'], overlay: 3 },
  banana: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  bush: { w: 1, h: 1, mask: ['#'] },
  hedge: { w: 1, h: 1, mask: ['#'] },
  flowers_red: { w: 1, h: 1, mask: ['.'], animated: { frames: 2, fps: 1.6 } },
  flowers_yellow: { w: 1, h: 1, mask: ['.'], animated: { frames: 2, fps: 1.6 } },
  // street furniture
  lamp: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  globe_lamp: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  bench: { w: 2, h: 1, mask: ['##'] },
  sign: { w: 1, h: 1, mask: ['#'] },
  postbox: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  hydrant: { w: 1, h: 1, mask: ['#'] },
  trash: { w: 1, h: 1, mask: ['#'] },
  bollard: { w: 1, h: 1, mask: ['#'] },
  planter_tree: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  fence_iron: { w: 1, h: 1, mask: ['#'] },
  fence_wood: { w: 1, h: 1, mask: ['#'] },
  barrier: { w: 1, h: 1, mask: ['#'] },
  hotdog_cart: { w: 2, h: 2, mask: ['..', '##'], overlay: 1 },
  taxi: { w: 2, h: 2, mask: ['##', '##'] },
  newsstand: { w: 2, h: 2, mask: ['##', '##'] },
  rock: { w: 1, h: 1, mask: ['#'] },
  canoe: { w: 2, h: 1, mask: ['##'] },
  subway: { w: 2, h: 2, mask: ['##', '##'] },
  phone_booth: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  // buildings
  kerala_house: { w: 5, h: 5, mask: withDoor(solid(5, 5), 2, 4) },
  kerala_house2: { w: 6, h: 5, mask: withDoor(solid(6, 5), 2, 4) },
  church: { w: 7, h: 8, mask: withDoor(solid(7, 8), 3, 7) },
  hall: { w: 14, h: 8, mask: withDoor(withDoor(solid(14, 8), 6, 7), 7, 7) },
  library: { w: 7, h: 6, mask: withDoor(solid(7, 6), 3, 5) },
  station: { w: 8, h: 6, mask: withDoor(solid(8, 6), 3, 5) },
  cafe: { w: 6, h: 5, mask: withDoor(solid(6, 5), 2, 4) },
  spice_shop: { w: 5, h: 5, mask: withDoor(solid(5, 5), 2, 4) },
  brownstone: { w: 4, h: 6, mask: withDoor(solid(4, 6), 1, 5) },
  brownstone2: { w: 4, h: 6, mask: withDoor(solid(4, 6), 1, 5) },
  bodega: { w: 4, h: 5, mask: withDoor(solid(4, 5), 1, 4) },
  pizza: { w: 4, h: 5, mask: withDoor(solid(4, 5), 2, 4) },
  theater: { w: 6, h: 6, mask: withDoor(withDoor(solid(6, 6), 2, 5), 3, 5) },
  apartment: { w: 6, h: 8, mask: withDoor(solid(6, 8), 2, 7) },
  tea_stall: { w: 3, h: 3, mask: solid(3, 3, 1), overlay: 1 },
  gate: { w: 8, h: 3, mask: ['........', '##....##', '##....##'], overlay: 1 },
  statue: { w: 2, h: 4, mask: ['..', '..', '##', '##'], overlay: 2 },
  // animated set pieces
  fountain: { w: 3, h: 3, mask: solid(3, 3), animated: { frames: 4, fps: 6 } },
  fishing_net: { w: 5, h: 5, mask: solid(5, 5), animated: { frames: 8, fps: 1.2 } },
  houseboat: { w: 6, h: 3, mask: solid(6, 3), animated: { frames: 2, fps: 0.8 } },
  // viaduct (elevated metro line): deck rows are overlay, pillar row solid
  viaduct: { w: 1, h: 2, mask: ['.', '.'], overlay: 2 },
  viaduct_pillar: { w: 1, h: 3, mask: ['.', '.', '#'], overlay: 2 },
  viaduct_end: { w: 1, h: 3, mask: ['.', '.', '#'], overlay: 2 },
  // interior furniture (café)
  i_wall: { w: 12, h: 2, mask: solid(12, 2) },
  i_counter: { w: 5, h: 2, mask: solid(5, 2) },
  i_table: { w: 2, h: 1, mask: ['##'] },
  i_chair: { w: 1, h: 1, mask: ['#'] },
  i_plant: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
  i_shelf: { w: 2, h: 2, mask: solid(2, 2) },
  i_sofa: { w: 3, h: 1, mask: ['###'] },
  i_radio: { w: 1, h: 2, mask: ['.', '#'], overlay: 1 },
} satisfies Record<string, PrefabDef>;

export type PrefabKey = keyof typeof DEFS;
export const PREFABS: Record<PrefabKey, PrefabDef> = DEFS;
export const prefab = (k: PrefabKey): PrefabDef => PREFABS[k];
