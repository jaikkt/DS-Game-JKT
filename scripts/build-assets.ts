/**
 * Asset generator: paints every tile, building, prop, character and UI piece and
 * writes PNG/JSON into src/game/assets/gen. Run with `npm run assets`.
 *
 * Static prefabs are baked into two layers per map:
 *   <map>_ground.png  — terrain + everything at/under character height
 *   <map>_overlay.png — rows flagged `overlay` (canopies, roofs, the metro deck)
 * Animated prefabs, critters, the train and UI go into one texture atlas.
 */
import fs from 'node:fs';
import path from 'node:path';
import { Img, hex, packAtlas, shade } from './art/pixel';
import { paintGround, waterFrames, TS } from './art/terrain';
import * as P from './art/props';
import * as B from './art/buildings';
import * as S from './art/setpieces';
import * as I from './art/interior';
import { playerSheet, npcSheet, catSheet, FH } from './art/characters';
import { buildFont } from './art/font';
import { PREFABS, PrefabKey } from '../src/game/world/prefabs';
import { LOOKS } from '../src/game/world/looks';
import { TOWN } from '../src/game/world/town';
import { CAFE } from '../src/game/world/cafe';
import type { MapDef } from '../src/game/world/types';

const OUT_DIR = path.resolve('src/game/assets/gen');
fs.mkdirSync(OUT_DIR, { recursive: true });

const ART: Record<PrefabKey, () => Img> = {
  tree: () => P.tree(false),
  tree_dark: () => P.tree(true),
  tree_small: P.treeSmall,
  palm: P.palm,
  banana: P.banana,
  bush: P.bush,
  hedge: P.hedge,
  flowers_red: () => P.flowers(hex('#f04858'), hex('#ff98a0')),
  flowers_yellow: () => P.flowers(hex('#f8c830'), hex('#fff0a0')),
  lamp: P.lamp,
  globe_lamp: P.globeLamp,
  bench: P.bench,
  sign: P.sign,
  postbox: P.postbox,
  hydrant: P.hydrant,
  trash: P.trash,
  bollard: P.bollard,
  planter_tree: P.planterTree,
  fence_iron: P.fenceIron,
  fence_wood: P.fenceWood,
  barrier: P.barrier,
  hotdog_cart: P.hotdogCart,
  taxi: P.taxi,
  newsstand: P.newsstand,
  rock: P.rock,
  canoe: P.canoe,
  subway: P.subway,
  phone_booth: P.phoneBooth,
  kerala_house: () => B.keralaHouse(0),
  kerala_house2: () => B.keralaHouse(1),
  church: B.church,
  hall: B.hall,
  library: B.library,
  station: B.station,
  cafe: B.cafe,
  spice_shop: B.spiceShop,
  brownstone: () => B.brownstone(0),
  brownstone2: () => B.brownstone(1),
  bodega: B.bodega,
  pizza: B.pizza,
  theater: B.theater,
  apartment: B.apartment,
  tea_stall: B.teaStall,
  gate: B.gate,
  statue: B.statue,
  fountain: S.fountain,
  fishing_net: S.fishingNet,
  houseboat: S.houseboat,
  viaduct: () => S.viaduct('deck'),
  viaduct_pillar: () => S.viaduct('pillar'),
  viaduct_end: () => S.viaduct('end'),
  i_wall: I.iWall,
  i_counter: I.iCounter,
  i_table: I.iTable,
  i_chair: I.iChair,
  i_plant: I.iPlant,
  i_shelf: I.iShelf,
  i_sofa: I.iSofa,
  i_radio: I.iRadio,
};

const cache = new Map<PrefabKey, Img>();
const art = (k: PrefabKey) => {
  if (!cache.has(k)) {
    const im = ART[k]();
    const d = PREFABS[k];
    const fw = d.w * TS * ('animated' in d && d.animated ? d.animated.frames : 1);
    if (im.w !== fw || im.h !== d.h * TS) throw new Error(`${k}: art ${im.w}x${im.h} ≠ prefab ${fw}x${d.h * TS}`);
    cache.set(k, im);
  }
  return cache.get(k)!;
};

function bakeMap(map: MapDef, shadows: { x: number; y: number; w: number; h: number }[] = []) {
  const ground = paintGround(map.terrain, { shadows });
  const overlay = new Img(ground.w, ground.h);
  const statics = map.placements
    .filter((p) => !('animated' in PREFABS[p.key] && PREFABS[p.key].animated))
    .sort((a, b) => a.y + PREFABS[a.key].h - (b.y + PREFABS[b.key].h) || a.x - b.x);
  for (const p of statics) {
    const d = PREFABS[p.key];
    const im = art(p.key);
    const ov = ('overlay' in d ? d.overlay : 0) ?? 0;
    const px = p.x * TS, py = p.y * TS;
    if (ov > 0) overlay.blit(im, px, py, { sh: ov * TS });
    ground.blit(im, px, py + ov * TS, { sy: ov * TS, sh: im.h - ov * TS });
  }
  ground.save(path.join(OUT_DIR, `${map.id}_ground.png`));
  overlay.save(path.join(OUT_DIR, `${map.id}_overlay.png`));
  return { ground, overlay };
}

// ── validation: overlapping footprints are almost always layout mistakes ──
function validate(map: MapDef) {
  const own = new Map<string, string>();
  const issues: string[] = [];
  for (const p of map.placements) {
    const d = PREFABS[p.key];
    const anim = 'animated' in d && !!d.animated;
    d.mask.forEach((row, j) => [...row].forEach((c, i) => {
      const k = `${p.x + i},${p.y + j}`;
      // flat animated decorations occupy their tile even though it's walkable
      if (c === '.' && !(anim && d.mask.length === 1)) return;
      if (own.has(k)) issues.push(`${map.id}: ${p.key}@${p.x},${p.y} overlaps ${own.get(k)} at ${k}`);
      else own.set(k, `${p.key}@${p.x},${p.y}`);
    }));
  }
  for (const n of map.npcs) if (own.has(`${n.x},${n.y}`)) issues.push(`${map.id}: npc ${n.id} stands inside ${own.get(`${n.x},${n.y}`)}`);
  issues.forEach((m) => console.warn('⚠', m));
}
validate(TOWN);
validate(CAFE);

// ── maps ──
const town = bakeMap(TOWN, [{ x: 23 * TS, y: 20 * TS, w: 41 * TS, h: 6 }]);
bakeMap(CAFE);

// ── atlas: animated prefabs, critters, train, UI ──
const atlasItems: Record<string, Img> = {};
for (const k of Object.keys(PREFABS) as PrefabKey[]) {
  const d = PREFABS[k];
  if (!('animated' in d) || !d.animated) continue;
  const strip = art(k);
  for (let f = 0; f < d.animated.frames; f++) atlasItems[`${k}_${f}`] = strip.crop(f * d.w * TS, 0, d.w * TS, d.h * TS);
}
const trainImg = S.train();
atlasItems.train = trainImg;
const ducks = [S.duck(true), S.duck(false)];
ducks.forEach((d, i) => { for (let f = 0; f < 4; f++) atlasItems[`duck${i}_${f}`] = d.crop(f * 16, 0, 16, 16); });
const pig = S.pigeon();
for (let f = 0; f < 4; f++) atlasItems[`pigeon_${f}`] = pig.crop(f * 16, 0, 16, 16);

// UI: HGSS-like dialogue frame (9-slice, 8px corners)
function frame(outer: string, mid: string, inner: string, fill: string): Img {
  const im = new Img(24, 24);
  const rr = (x: number, y: number, w: number, h: number, r: number, c: ReturnType<typeof hex>) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const cx = i < r ? r - i - 0.5 : i >= w - r ? i - (w - r) + 0.5 : 0;
      const cy = j < r ? r - j - 0.5 : j >= h - r ? j - (h - r) + 0.5 : 0;
      if (cx * cx + cy * cy <= r * r + 0.5) im.put(x + i, y + j, c);
    }
  };
  rr(0, 0, 24, 24, 4, hex(outer));
  rr(1, 1, 22, 22, 3, hex(mid));
  rr(3, 3, 18, 18, 2, hex(inner));
  rr(4, 4, 16, 16, 1, hex(fill));
  im.hline(4, 2, 16, shade(hex(mid), 0.35));
  return im;
}
atlasItems.ui_frame = frame('#383848', '#6890c8', '#d0d8e8', '#f8f8f8');
atlasItems.ui_frame_sign = frame('#4a2c18', '#b07a48', '#7a4a28', '#f4ead0');
const arrow = (dy: number) => {
  const im = new Img(8, 8);
  im.ascii(0, 1 + dy, ['#######', '.#####.', '..###..', '...#...'], { '#': hex('#e04838') });
  im.ascii(0, 0 + dy, ['.......'], { '#': 0 });
  for (let i = 0; i < 7; i++) im.put(i, 5 + dy, 0);
  im.hline(1, 5 + dy, 5, hex('#a02818', 160));
  return im;
};
atlasItems.ui_arrow_0 = arrow(0);
atlasItems.ui_arrow_1 = arrow(1);
const cursor = new Img(8, 8);
cursor.ascii(1, 0, ['#...', '##..', '###.', '####', '###.', '##..', '#...'], { '#': hex('#383848') });
atlasItems.ui_cursor = cursor;
const px = new Img(4, 4);
px.rect(0, 0, 4, 4, hex('#ffffff'));
atlasItems.ui_white = px;

const atlas = packAtlas(atlasItems, 1024);
atlas.json.meta.image = 'sprites.png';
atlas.img.save(path.join(OUT_DIR, 'sprites.png'));
fs.writeFileSync(path.join(OUT_DIR, 'sprites.json'), JSON.stringify(atlas.json));

// ── characters: one row of 12 frames per character ──
const charKeys = ['player', ...Object.keys(LOOKS), 'cat'];
const sheets = [playerSheet(), ...Object.values(LOOKS).map((l) => npcSheet(l)), catSheet()];
const chars = new Img(sheets[0].w, sheets.length * FH);
sheets.forEach((s, i) => chars.blit(s, 0, i * FH));
chars.save(path.join(OUT_DIR, 'chars.png'));
fs.writeFileSync(path.join(OUT_DIR, 'chars.json'), JSON.stringify({ frameW: 20, frameH: FH, rows: charKeys }));

// ── water ──
waterFrames().save(path.join(OUT_DIR, 'water.png'));

// ── font ──
const font = buildFont('font.png');
font.img.save(path.join(OUT_DIR, 'font.png'));
fs.writeFileSync(path.join(OUT_DIR, 'font.xml'), font.xml);

// preview composite for review (not shipped)
const prev = new Img(town.ground.w, town.ground.h);
const water = waterFrames();
for (let y = 0; y < prev.h; y++) for (let x = 0; x < prev.w; x++) prev.put(x, y, water.get(x % 32, y % 32));
prev.blit(town.ground, 0, 0);
for (const p of TOWN.placements) {
  const d = PREFABS[p.key];
  if ('animated' in d && d.animated) prev.blit(atlasItems[`${p.key}_0`], p.x * TS, p.y * TS);
}
prev.blit(town.overlay, 0, 0);
fs.mkdirSync('.preview', { recursive: true });
prev.save('.preview/town.png');
console.log('assets written to', OUT_DIR);
