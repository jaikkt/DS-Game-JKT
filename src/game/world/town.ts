/**
 * CARDAMOM CITY — "Where the backwaters meet the boulevard."
 *
 * A fictional town that folds together a Kochi waterfront (cheena vala fishing
 * nets, a houseboat, tiled roofs and coconut palms), a Blacksburg-style quad
 * (grey limestone halls, a big mown lawn, a duck pond), and a slice of New York
 * (brownstones, a bodega, a theatre marquee, a subway stair), all stitched
 * together by an elevated metro line in the spirit of Goldenrod City.
 *
 * Terrain legend: G grass · L mown lawn · T tan paving · R road · P plaza stone
 *                 B boardwalk · S sand · D dirt path · W water · X crosswalk
 */
import { PREFABS, PrefabKey } from './prefabs';
import type { MapDef, Placement, NpcDef, TileText } from './types';

const W = 64;
const H = 48;

const grid: string[][] = Array.from({ length: H }, () => Array<string>(W).fill('G'));
const fill = (c: string, x: number, y: number, w: number, h: number) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) grid[j][i] = c;
};
const at = (x: number, y: number) => grid[y]?.[x];

const placements: Placement[] = [];
const occupied = new Set<string>();
function put(key: PrefabKey, x: number, y: number, extra: Partial<Placement> = {}) {
  const p = PREFABS[key];
  p.mask.forEach((row, j) => [...row].forEach((c, i) => c !== '.' && occupied.add(`${x + i},${y + j}`)));
  placements.push({ key, x, y, ...extra });
}
/** Places a tree only if its footprint is clear and on soft ground. */
function tree(x: number, y: number, key: PrefabKey = 'tree') {
  const p = PREFABS[key];
  for (let j = 0; j < p.h; j++)
    for (let i = 0; i < p.w; i++) {
      if (p.mask[j][i] === '.') continue;
      const tx = x + i, ty = y + j;
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
      if (occupied.has(`${tx},${ty}`)) return;
      if (!'GLS'.includes(at(tx, ty))) return;
    }
  put(key, x, y);
}

// ─── terrain ────────────────────────────────────────────────────────────────
// West backwater bay + southern inlet
fill('W', 0, 18, 12, 30);
fill('W', 12, 19, 2, 29);
fill('W', 0, 46, 28, 2);
fill('S', 10, 16, 6, 2); // little beach where the quarter meets the water
fill('S', 12, 18, 2, 1);
fill('B', 14, 18, 2, 28); // promenade boardwalk
fill('B', 14, 44, 14, 2);
// Statue island
fill('S', 2, 36, 5, 6);
fill('G', 3, 37, 3, 4);
fill('W', 2, 36, 1, 1); fill('W', 6, 36, 1, 1); fill('W', 2, 41, 1, 1); fill('W', 6, 41, 1, 1);

// Kerala quarter paths
fill('D', 1, 14, 10, 2);
fill('D', 4, 10, 1, 4);
fill('D', 11, 11, 1, 3);

// Church courtyard + station forecourt
fill('T', 15, 12, 9, 2);
fill('T', 16, 21, 48, 6); // north + south avenue sidewalks (road painted over below)
fill('T', 14, 14, 1, 1);

// Academic quad: hall forecourt, lawn ring, lawn
fill('T', 23, 11, 18, 7);
fill('L', 24, 12, 7, 5);
fill('L', 33, 12, 7, 5);
fill('T', 41, 10, 9, 2); // library forecourt
fill('T', 41, 12, 2, 6);
// Duck pond (stepped oval, corners get rounded by the painter)
for (const [y, x0, x1] of [[5, 53, 58], [6, 52, 59], [7, 51, 60], [8, 51, 60], [9, 52, 59], [10, 53, 57]] as const)
  fill('W', x0, y, x1 - x0 + 1, 1);
fill('D', 50, 12, 12, 1);
fill('D', 50, 4, 1, 8);

// Paving under the elevated line
fill('T', 23, 18, 41, 3);

// Roads
fill('R', 17, 22, 47, 3); // main avenue
fill('R', 30, 17, 4, 31); // central boulevard (north end meets the quad)
fill('T', 28, 27, 2, 18);
fill('T', 34, 27, 2, 18);
fill('R', 36, 34, 28, 2); // east street
fill('T', 36, 33, 28, 1);
fill('T', 36, 36, 28, 1);
fill('R', 50, 25, 2, 21); // north-south street
fill('T', 49, 27, 1, 18);
fill('T', 52, 27, 1, 18);
// crosswalks
fill('X', 30, 21, 4, 1);
fill('X', 30, 25, 4, 1);
fill('X', 29, 22, 1, 3);
fill('X', 34, 22, 1, 3);
fill('X', 49, 34, 1, 2);
fill('X', 52, 34, 1, 2);
fill('X', 50, 33, 2, 1);
fill('X', 50, 36, 2, 1);

// West of the boulevard: café row, plaza, spice lane
fill('T', 16, 27, 12, 7);
fill('P', 22, 27, 6, 7);
fill('T', 16, 34, 12, 2);
fill('D', 18, 36, 1, 3);
fill('D', 24, 40, 4, 2);
fill('D', 21, 41, 3, 1);
// East blocks: sidewalks in front of buildings
fill('T', 36, 27, 13, 6);
fill('T', 53, 27, 11, 6);
fill('T', 36, 37, 13, 8);
fill('T', 53, 37, 11, 8);
fill('G', 54, 39, 8, 5); // pocket park
fill('D', 57, 39, 2, 5);
// South gate approach
fill('T', 28, 45, 8, 1);

// ─── buildings & landmarks ──────────────────────────────────────────────────
const LOCKED = (s: string) => ({ text: [s] });

put('kerala_house', 2, 5, {
  door: { text: ["It's locked. A sandal is left on the step… someone's home, just not answering."] },
  text: ['A tiled-roof tharavad house. The terracotta tiles click softly when it rains.'],
});
put('kerala_house2', 8, 6, {
  door: { text: ['Through the window: a bowl of mangoes ripening on the sill. The door is locked.'] },
});
put('church', 16, 4, {
  door: { text: ['The door is shut. A note reads:', '"Choir practice at six. Latecomers sing the high notes."'] },
  text: ['A whitewashed church with a stepped gable. It has watched this harbour for centuries.'],
});
put('station', 15, 15, {
  door: { text: ['CARDAMOM STATION', 'The ticket gates are closed. A notice says trains run "whenever the timetable feels like it."'] },
  text: ['The glass-and-steel metro station. Its curved roof gleams like a seashell.'],
});
put('hall', 25, 3, {
  door: { text: ['STONEFIELD HALL', 'The great oak doors are locked for the evening.'] },
  text: ['Grey limestone, cut from a quarry just outside town. Every block is a slightly different colour.'],
});
put('library', 42, 4, {
  door: { text: ['The library is closed. Through the glass you can see a cat asleep on the returns cart.'] },
  text: ['A quiet stone library with tall arched windows.'],
});
put('cafe', 16, 27, {
  door: { warp: { map: 'cafe', x: 5, y: 8, dir: 'up' } },
});
put('spice_shop', 21, 35, {
  door: { text: ['The shutters are half down. The smell of cardamom, pepper and clove drifts out anyway.'] },
  text: ['Sacks of whole spices are stacked by the door: green cardamom, black pepper, dried chillies.'],
});
put('kerala_house', 16, 38, { door: { text: ["Nobody's home. A bicycle leans against the wall."] } });
put('tea_stall', 16, 33, { text: ['A tea stall. A dented kettle hisses on a small blue flame.'] });

put('brownstone', 36, 27, { door: { text: ['A brownstone stoop. The buzzer list has eleven names on it and none of them is yours.'] } });
put('brownstone2', 40, 27, { door: { text: ['The door is locked. Someone upstairs is practising the trumpet. Badly. Lovingly.'] } });
put('theater', 44, 27, {
  door: { text: ['THE LYRIC', '"Doors open at 7:30. No flash photography, no cheering for the villain."'] },
  text: ['A little theatre with a marquee full of chaser lights.'],
});
put('bodega', 53, 28, {
  door: { text: ['A handwritten sign: "BACK IN 5 MIN — ask the cat."'] },
});
put('apartment', 57, 26, { door: { text: ['A tall walk-up with a wooden water tower on the roof. The intercom crackles, then nothing.'] } });
put('pizza', 36, 37, {
  door: { text: ['"PIZZERIA — Sorry, we\'re closed for a private event (the oven is being cleaned)."'] },
});
put('brownstone', 40, 37, { door: { text: ['Locked. A row of basil pots on the window ledge is doing extremely well.'] } });
put('brownstone2', 44, 37, { door: { text: ['A note taped to the door: "Package for 3B is with the bodega cat."'] } });
put('subway', 48, 38, {
  text: ['Steps lead down into a subway entrance.', '…The tunnel is still being dug. For now it leads to one very confused pigeon.'],
});

// Waterfront set pieces
put('fishing_net', 9, 20, {
  text: ['CHEENAVALA', 'A shore-operated fishing net. A team leans on the counterweight ropes and the whole net dips into the water like a bow.'],
});
put('fishing_net', 9, 28, { text: ['The net rises dripping and glittering. Mostly it catches sunlight.'] });
put('houseboat', 2, 25, {
  text: ['A kettuvallam houseboat with a woven bamboo roof.', 'Someone inside is cooking fish curry. It smells incredible.'],
});
put('statue', 3, 37, {
  text: ['A copper statue of a woman holding a lamp toward the harbour.', 'The plaque says: "FOR EVERYONE WHO ARRIVED HERE FROM SOMEWHERE ELSE."'],
});
put('canoe', 12, 41);
put('canoe', 7, 33);

// Plaza
put('fountain', 23, 29, { text: ['The fountain burbles. Coins from three different countries glint on the bottom.'] });

// South gate
put('gate', 28, 45);

// Elevated metro: deck rows 18–19, pillar foot on row 20
for (let x = 23; x < W; x++) {
  const pillar = [26, 37, 44, 55, 61].includes(x);
  put(pillar ? 'viaduct_pillar' : x === 23 ? 'viaduct_end' : 'viaduct', x, 18);
}

// ─── vegetation ─────────────────────────────────────────────────────────────
// Northern forest edge (two staggered rows like the DS games)
for (let x = 0; x < W; x += 2) tree(x, -1, 'tree_dark');
for (let x = -1; x < W; x += 2) tree(x, 1, 'tree_dark');
// East edge
for (let y = 3; y < 18; y += 2) { tree(62, y); }
for (let y = 37; y < 45; y += 2) tree(62, y);
// South edge (east of gate)
for (let x = 36; x < W; x += 2) tree(x, 45);
for (let x = 37; x < W; x += 2) tree(x, 46);
// Quad trees around the lawn ring
for (const [x, y] of [[23, 7], [39, 7], [44, 13], [46, 15], [21, 15]] as const) tree(x, y);
// Pond side
for (const [x, y] of [[54, 1], [56, 12], [60, 13], [53, 13]] as const) tree(x, y);
tree(48, 13); tree(47, 10, 'tree_small');
// Pocket park
tree(54, 40); tree(60, 40);
put('bench', 55, 43);
put('bench', 59, 43);

// Palms & bananas (Kerala quarter / waterfront)
const palms: [number, number][] = [
  [-1, 9], [6, 3], [12, 3], [0, 12], [6, 10], [13, 10], [10, 12],
  [12, 15], [17, 30], [20, 41], [23, 42], [26, 40], [3, 34], [13, 25],
];
for (const [x, y] of palms) {
  const p = PREFABS.palm;
  let ok = true;
  p.mask.forEach((row, j) => [...row].forEach((c, i) => {
    if (c !== '.' && (occupied.has(`${x + i},${y + j}`) || !'GSDL'.includes(at(x + i, y + j) ?? 'W'))) ok = false;
  }));
  if (ok) put('palm', x, y);
}
for (const [x, y] of [[1, 3], [7, 11], [14, 8], [22, 38], [27, 37]] as const) {
  if (!occupied.has(`${x},${y + 1}`) && 'GD'.includes(at(x, y + 1))) put('banana', x, y);
}

// Hedges & flowers
for (let x = 24; x <= 30; x++) if (x !== 27) put('hedge', x, 17);
for (let x = 33; x <= 40; x++) if (x !== 36) put('hedge', x, 17);
const flowers: [number, number, PrefabKey][] = [
  [24, 12, 'flowers_red'], [25, 12, 'flowers_yellow'], [29, 12, 'flowers_red'], [30, 12, 'flowers_yellow'],
  [33, 12, 'flowers_yellow'], [34, 12, 'flowers_red'], [38, 12, 'flowers_yellow'], [39, 12, 'flowers_red'],
  [1, 7, 'flowers_red'], [7, 9, 'flowers_yellow'], [7, 10, 'flowers_red'], [13, 12, 'flowers_yellow'],
  [55, 4, 'flowers_red'], [57, 4, 'flowers_yellow'], [61, 10, 'flowers_red'],
  [56, 41, 'flowers_yellow'], [59, 41, 'flowers_red'], [21, 40, 'flowers_red'],
  [22, 42, 'flowers_yellow'], [2, 39, 'flowers_red'], [5, 38, 'flowers_yellow'],
];
for (const [x, y, k] of flowers) put(k, x, y);
for (const [x, y] of [[22, 43], [21, 43], [15, 37]] as const) put('bush', x, y);

// ─── street furniture ───────────────────────────────────────────────────────
const lamps: [number, number][] = [
  [14, 19], [28, 19], [35, 19], [47, 19], [59, 19], [22, 25], [40, 25], [56, 25],
  [28, 31], [35, 30], [28, 39], [35, 41], [52, 41], [23, 10], [40, 10],
  [14, 26], [14, 34], [14, 41],
];
for (const [x, y] of lamps) put('lamp', x, y);
put('globe_lamp', 48, 40);
for (const [x, y] of [[41, 19], [52, 19], [58, 19]] as const) put('planter_tree', x, y);
for (const [x, y] of [[38, 32], [45, 32], [42, 42]] as const) put('planter_tree', x, y);
put('hydrant', 49, 37);
put('hydrant', 36, 33);
put('trash', 35, 26);
put('trash', 28, 26);
put('trash', 52, 37);
put('phone_booth', 52, 31);
put('postbox', 15, 30, {
  text: ['A red pillar postbox, older than most of the town.', 'Someone has tucked a postcard of snow-covered hills under its lid.'],
});
put('hotdog_cart', 26, 31, {
  text: ['A hot dog cart with a striped umbrella. The menu also lists "masala fries."'],
});
put('newsstand', 45, 43, {
  text: ['Today\'s headline: "LOCAL DUCK ELECTED TO POND COUNCIL, PROMISES MORE BREAD."'],
});
put('taxi', 38, 34, { text: ['A yellow taxi, engine ticking as it cools. The meter is off.'] });
put('taxi', 55, 22, { text: ['A yellow taxi waits at the kerb. The driver is fast asleep.'] });
for (let y = 22; y <= 24; y++) put('barrier', 63, y, { text: ['ROAD CLOSED — the highway out of town is being repaved.'] });
for (let y = 34; y <= 35; y++) put('barrier', 63, y, { text: ['ROAD CLOSED — the highway out of town is being repaved.'] });
for (const [x, y] of [[29, 26], [34, 26], [29, 20], [34, 20]] as const) put('bollard', x, y);
put('bench', 24, 20);
// Hedge line along the pocket park
for (let y = 37; y <= 43; y++) if (y !== 40) put('hedge', 53, y);

// Rocks in the water
for (const [x, y] of [[8, 19], [1, 20], [5, 30], [10, 38], [1, 44], [8, 44], [12, 36], [17, 46], [23, 46], [2, 33]] as const) put('rock', x, y);

// ─── signs ──────────────────────────────────────────────────────────────────
const texts: TileText[] = [];
function sign(x: number, y: number, text: string[]) {
  put('sign', x, y);
  texts.push({ x, y, text });
}
sign(31 - 2, 43, ['CARDAMOM CITY', 'Where the backwaters meet the boulevard.']);
sign(30 - 1, 11 + 0, ['THE DRILL LAWN', 'Please keep off the grass during finals week.', '(Nobody does.)']);
sign(51, 13, ['DUCK POND', 'Please do not feed the ducks bread. They prefer gossip.']);
sign(16, 25, ['CARDAMOM STATION ↑', 'Waterfront promenade ←', 'Old Town →']);
sign(13, 16, ['FORT BEACH', 'Watch for the nets. The nets are watching for fish.']);
sign(15, 36, ['CHAYA KADA', 'Tea · Banana fritters · Opinions']);
sign(42, 10, ['HOLLIS LIBRARY', 'Quiet hours: always.']);

// ─── NPCs ───────────────────────────────────────────────────────────────────
const npcs: NpcDef[] = [
  {
    id: 'fisher', sprite: 'fisher', x: 15, y: 22, dir: 'left', behavior: { kind: 'look', dirs: ['left', 'down', 'left', 'up'] },
    lines: ["Each of these nets takes four of us to work. You lean on the ropes, and the whole thing bows to the sea.", 'Traders brought the design here from very far away, a long time ago. Now it belongs to this shore.'],
    more: [["Today's catch: two prawns, a sandal, and a very offended crab."]],
  },
  {
    id: 'student', sprite: 'student', x: 27, y: 14, dir: 'down', behavior: { kind: 'look' },
    lines: ['Midterms are next week. So obviously I am lying on the lawn.', 'Everyone on campus crosses the Drill Lawn at least twelve times a day. It builds character. And calves.'],
    more: [['When it snows here the whole lawn turns white and everyone becomes a professional sledder.']],
  },
  {
    id: 'prof', sprite: 'prof', x: 36, y: 13, dir: 'left', behavior: { kind: 'wander', radius: 2 },
    lines: ['Ah, a visitor! Did you know every block in Stonefield Hall was cut by hand?', 'The stone is a little grey, a little brown, a little pink. Like the town, really. A bit of everywhere.'],
  },
  {
    id: 'duckfan', sprite: 'duckfan', x: 55, y: 11, dir: 'up', behavior: { kind: 'look', dirs: ['up', 'up', 'left', 'up'] },
    lines: ['Shh! The one with the green head is the boss. I call him Professor Quackers.', "He doesn't hold office hours, but he does accept crumbs."],
  },
  {
    id: 'tourist', sprite: 'tourist', x: 14, y: 38, dir: 'left', behavior: { kind: 'look', dirs: ['left', 'left', 'up', 'down'] },
    lines: ["I've taken four hundred photos of that statue and the lamp is blurry in every single one.", "Still, look at it! A lamp held out over the water. Like she's saying \"come on in.\""],
  },
  {
    id: 'grandma', sprite: 'grandma', x: 21, y: 13, dir: 'down', behavior: { kind: 'wander', radius: 2 },
    lines: ['Mone, have you eaten? You look thin.', 'When I was young this was all paddy fields and one bus a day. Now there is a train in the sky!', '…I still prefer the bus.'],
  },
  {
    id: 'chaiwala', sprite: 'chaiwala', x: 19, y: 34, dir: 'left', behavior: { kind: 'static' },
    lines: ['Chaya? Strong, sweet, and pulled from a metre high. The foam is the important part.', 'Pazhampori just came out of the oil. Careful, it is hotter than gossip.'],
  },
  {
    id: 'vendor', sprite: 'vendor', x: 26, y: 33, dir: 'up', behavior: { kind: 'static' },
    lines: ['Hot dogs! Masala fries! Chai-spiced lemonade! The menu is a little bit of everywhere.', "You know what? People argue about where the best food is. I say: it's wherever you're hungry."],
  },
  {
    id: 'kid', sprite: 'kid', x: 25, y: 33, dir: 'up', behavior: { kind: 'wander', radius: 3 },
    lines: ['I threw a coin in the fountain and wished for a pet duck.', "Mom says the ducks at the pond are \"community ducks.\" That means they're a little bit mine."],
  },
  {
    id: 'suit', sprite: 'suit', x: 44, y: 35 - 1, dir: 'right', behavior: { kind: 'patrol', path: [[37, 33], [48, 33]] },
    lines: ["Can't talk, late for a meeting. I've been late for this meeting since 2019.", '…Okay, one tip: the bodega cat knows everything. Bring snacks.'],
  },
  {
    id: 'musician', sprite: 'musician', x: 49, y: 41, dir: 'left', behavior: { kind: 'static' },
    lines: ['♪ ♫ ♪', "I busk here because the subway stairs have perfect acoustics. Even though there's no subway yet.", "Request a song? I only know one. It's about trains."],
  },
  {
    id: 'jogger', sprite: 'jogger', x: 24, y: 21, dir: 'right', behavior: { kind: 'patrol', path: [[18, 21], [48, 21], [48, 25], [18, 25]] },
    lines: ['Huff… huff… One lap is from the station to the theatre and back.', "The trick is to run under the train tracks right when a train passes. It's like having a cheering crowd."],
  },
  {
    id: 'artist', sprite: 'artist', x: 58, y: 42, dir: 'left', behavior: { kind: 'look', dirs: ['left', 'up', 'left', 'right'] },
    lines: ["I'm painting the whole town as one map. Water on the left, towers on the right, everything else in between.", "Problem is, every time I finish it somebody opens a new food stall."],
  },
  {
    id: 'guard', sprite: 'guard', x: 32, y: 44, dir: 'down', behavior: { kind: 'static' },
    lines: ['The road south is closed while they finish the new route.', "Don't worry. There's plenty to see in town. Have you been to the waterfront?"],
  },
  {
    id: 'cat_bodega', sprite: 'cat', x: 55, y: 33, dir: 'down', behavior: { kind: 'wander', radius: 1 },
    lines: ['Mrrrp.', '(The bodega cat looks at you as if you owe it rent.)'],
  },
];

export const TOWN: MapDef = {
  id: 'town',
  name: 'CARDAMOM CITY',
  width: W,
  height: H,
  terrain: grid.map((r) => r.join('')),
  placements,
  npcs,
  texts,
  warps: [],
  spawn: { x: 31, y: 40, dir: 'up' },
};
