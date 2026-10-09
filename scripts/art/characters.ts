/**
 * Overworld character sprites (HGSS-style, 20x28 frames).
 *
 * Sheet layout (per character): 12 frames in one row
 *   down: stand, stepA, stand, stepB  → frames 0..2 used as [stand, stepA, stepB]
 * We store 3 frames per direction in order: down, up, left, right → 12 frames.
 *
 * The player is hand-authored from the supplied trainer sprite (spiky black hair,
 * brown skin, cream tee, black open jacket, dark trousers, white sneakers).
 * NPCs share the same body template with a procedural head generator so the whole
 * cast reads as one coherent set.
 */
import { Img, hex, shade, Color, A } from './pixel';

export const FW = 20;
export const FH = 28;

type Pal = Record<string, Color>;

/** Mirror a half-row (cols 0..9) into a full 20-col row. */
const sym = (rows: string[]) => rows.map((r) => r + r.split('').reverse().join(''));

// ───────────────────────────── shared body template ─────────────────────────────
// J = outer layer (jacket / shirt), j = outer highlight, T = inner shirt, t = inner shadow,
// S = skin, P = trousers, p = trouser shadow, F = shoe, f = sole, k = outline
const BODY_DOWN_TOP = sym([
  '......kJTT', // 17
  '.....kJJTT', // 18
  '....kJJJTT', // 19
  '....kJjJTT', // 20
  '....kSkJTT', // 21
  '....kskJtt', // 22
]);
const BODY_UP_TOP = sym([
  '......kJJJ',
  '.....kJJJJ',
  '....kJJJJJ',
  '....kJjJJJ',
  '....kSkJJJ',
  '....kskJJJ',
]);
const LEGS_FRONT = {
  stand: [
    '.....kkPPPPPPPPkk...'.slice(0, 20),
    '......kPPPPPPPPk....',
    '......kPPpkkpPPk....',
    '......kFFfk.kfFFk...',
    '......kkkk...kkkk...',
  ],
};
// Fix the stand legs to be exactly symmetric around x=9.5
LEGS_FRONT.stand = sym(['.....kkPPP', '......kPPP', '......kPpk', '......kFFk', '.......kkk']);
const LEGS_FRONT_STEP_A = [
  '.....kkPPPPPPPkk....',
  '......kPPPPPPPPk....',
  '......kPpkkpPPPk....',
  '......kFFk.kpPPk....',
  '.......kk..kFFfk....',
];
const LEGS_FRONT_STEP_B = LEGS_FRONT_STEP_A.map((r) => r.split('').reverse().join(''));

const BODY_LEFT_TOP = [
  '........kJTJk.......', // 17
  '.......kJTTJJk......', // 18
  '.......kJTJJJk......', // 19
  '.......kJJjJJk......', // 20
  '.......kJJSkJk......', // 21
  '........kJskk.......', // 22
];
const BODY_LEFT_TOP_SWING_A = [
  '........kJTJk.......',
  '.......kJTTJJk......',
  '.......kJjJJJk......',
  '.......kSkjJJk......',
  '.......kskJJJk......',
  '........kkJJk.......',
];
const BODY_LEFT_TOP_SWING_B = [
  '........kJTJk.......',
  '.......kJTTJJk......',
  '.......kJTJjJk......',
  '.......kJJJjJk......',
  '.......kJJJkSk......',
  '........kJJksk......',
];
const LEGS_LEFT_STAND = [
  '........kPPPk.......',
  '........kPPPk.......',
  '........kPpPk.......',
  '.......kFFFfk.......',
  '.......kkkkk........',
];
const LEGS_LEFT_STEP_A = [
  '........kPPPk.......',
  '.......kPPkPPk......',
  '......kPpk.kPpk.....',
  '.....kFFfk.kFfk.....',
  '.....kkkk...kkk.....',
];
const LEGS_LEFT_STEP_B = [
  '........kPPPk.......',
  '.......kPpkPPk......',
  '......kPPk.kPPk.....',
  '......kFfk.kFFfk....',
  '......kkk..kkkk.....',
];

// ───────────────────────────── player head (hand-authored) ─────────────────────────────
// H hair, h hair highlight, d hair shadow, S skin, s skin shadow, E eye, e eye shine,
// W eye white, m mouth, k outline
const PLAYER_HEAD_DOWN = [
  '........k.k.........', // 0
  '.....k.kHkHk.k......', // 1
  '....kHkHHhHHkHk.k...', // 2
  '...kHHHHhhHHHHHkHk..', // 3
  '..kHHhhHHHHHHhhHHk..', // 4
  '.kHHhHHHHhhHHHHHhHk.', // 5
  '.kHhHHHHhHHHHHHHhHk.', // 6
  'kHHHHHhHHHHHHhHHHHHk', // 7
  'kHHHHHHHHHHHHHHHHHHk', // 8
  '.kHHHdHHHdHHHdHHHHk.', // 9
  '.kHHdSdHdSdHdSdHHHk.', // 10
  '.kHdSSSdSSSdSSSSdHk.', // 11
  '..kdSSSSSSSSSSSSdk..', // 12
  '..kSSEkSSSSSSkESSk..', // 13
  '..kSSEeSSSSSSeESSk..', // 14
  '..ksSSSSSSSSSSSSsk..', // 15
  '...ksSSSSmmSSSSsk...', // 16
];
const PLAYER_HEAD_UP = [
  '........k.k.........',
  '.....k.kHkHk.k......',
  '....kHkHHhHHkHk.k...',
  '...kHHHHhHHHHHHkHk..',
  '..kHHhHHHHHHHhHHHk..',
  '.kHHHHHHHHHHHHHHhHk.',
  '.kHhHHHHHhHHHHHHHHk.',
  'kHHHHHhHHHHHHhHHHHHk',
  'kHHHHHHHHHHHHHHHHHHk',
  'kHHHhHHHHHHhHHHHHHHk',
  '.kHHHHHHHHHHHHHHHHk.',
  '.kHHHHHdHHHHdHHHHHk.',
  '..kHHHdHHHHHHdHHHk..',
  '..kdHHHHHdHHHHHHdk..',
  '..ksdHHHHHHHHHHdsk..',
  '...ksdddHHHHdddsk...',
  '....kksssssssskk....',
];
const PLAYER_HEAD_LEFT = [
  '.........k.k........',
  '.......k.kHkHk......',
  '.....kHkHHhHHkHk....',
  '....kHHHHhHHHHHHk...',
  '...kHHhHHHHHHhHHHk..',
  '..kHHHHHHHHHHHHHhHk.',
  '..kHhHHHHHHHHHHHHHk.',
  '.kHHHHHhHHHHHHhHHHHk',
  '.kHHHHHHHHHHHHHHHHHk',
  '..kHdHHdHHHHHHHHHHHk',
  '..kdSdSSdHHHHHHHHHk.',
  '..kSSSSSSdHHHHHHHHk.',
  '.kSSSSSSSdHHsHHHHk..',
  '.kSEkSSSSSdsSsHHHk..',
  '.kSEeSSSSSSssHHHk...',
  '..kSSSSSSSSSkHHk....',
  '...kkmSSSSsskkk.....',
];

function playerPal(): Pal {
  return {
    k: hex('#1c1a24'),
    H: hex('#2e2e38'),
    h: hex('#5c5e70'),
    d: hex('#1c1a24'),
    S: hex('#d98d56'),
    s: hex('#a9653c'),
    E: hex('#2a1a14'),
    e: hex('#ffffff'),
    m: hex('#8e4a2c'),
    J: hex('#2c2c36'),
    j: hex('#4e4e60'),
    T: hex('#f2ecdc'),
    t: hex('#c9bfa8'),
    P: hex('#383a4c'),
    p: hex('#262636'),
    F: hex('#f8f8f8'),
    f: hex('#b0b0bc'),
  };
}

function composeFrame(head: string[], top: string[], legs: string[], pal: Pal, headDy = 0, flip = false) {
  const im = new Img(FW, FH);
  // shadow ellipse under feet
  im.ellipse(9.5 + (flip ? 0 : 0), 26.5, 6, 1.6, hex('#000000', 52));
  im.ascii(0, 17, top, pal, flip);
  im.ascii(0, 23, legs, pal, flip);
  im.ascii(0, 0 + headDy, head, pal, flip);
  return im;
}

// ───────────────────────────── procedural NPC heads ─────────────────────────────
export interface NpcLook {
  hair: string; // base hair color
  skin: string;
  outer: string; // jacket/shirt
  inner: string; // inner shirt (collar)
  pants: string;
  shoes: string;
  style: 'short' | 'long' | 'bun' | 'cap' | 'bald' | 'pony' | 'curly' | 'scarf';
  accent?: string; // cap / scarf color
  sleeveless?: boolean;
  skirt?: boolean;
}

type Dir = 'down' | 'up' | 'left';

function npcHead(look: NpcLook, dir: Dir): Img {
  const im = new Img(FW, 18);
  const hair = hex(look.hair), hairL = shade(hair, 0.28), hairD = shade(hair, -0.35);
  const skin = hex(look.skin), skinD = shade(skin, -0.25);
  const acc = hex(look.accent ?? '#d04040'), accL = shade(acc, 0.3), accD = shade(acc, -0.3);
  const cx = 9.5, cy = 10.5, rx = 7.2, ry = 6.6;
  const inHead = (x: number, y: number) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx * dx + dy * dy <= 1;
  };
  const isHair = (x: number, y: number): 'hair' | 'skin' | 'acc' | null => {
    const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry;
    const head = inHead(x, y);
    const s = look.style;
    // extras outside head
    if (s === 'bun' && (x + 0.5 - cx) ** 2 / 9 + (y + 0.5 - 3.2) ** 2 / 6 <= 1) return 'hair';
    if (s === 'long' && dir !== 'left' && Math.abs(nx) > 0.62 && Math.abs(nx) < 1.12 && y >= 10 && y <= 17) return 'hair';
    if (s === 'long' && dir === 'left' && nx > -0.1 && nx < 1.1 && y >= 10 && y <= 17) return 'hair';
    if (s === 'pony' && dir === 'left' && x >= 15 && x <= 17 && y >= 7 && y <= 15 - (x - 15)) return 'hair';
    if (s === 'pony' && dir === 'up' && x >= 8 && x <= 11 && y >= 14 && y <= 17) return 'hair';
    if (s === 'curly' && !head) {
      const dx = (x + 0.5 - cx) / (rx + 1.2), dy = (y + 0.5 - (cy - 0.6)) / (ry + 1.0);
      if (dx * dx + dy * dy <= 1 && ny < 0.35 && ((x * 7 + y * 3) % 5 !== 0)) return 'hair';
    }
    if (s === 'scarf' && !head) {
      const dx = (x + 0.5 - cx) / (rx + 0.8), dy = (y + 0.5 - cy) / (ry + 0.8);
      if (dx * dx + dy * dy <= 1) return 'acc';
    }
    if (s === 'cap' && dir === 'down' && y === 7 && x >= 4 && x <= 15) return 'acc';
    if (s === 'cap' && dir === 'left' && y >= 7 && y <= 8 && x >= 0 && x <= 5) return 'acc';
    if (!head) return null;
    if (dir === 'up') {
      if (s === 'scarf') return 'acc';
      if (s === 'bald') return ny > -0.2 ? 'hair' : 'skin';
      if (s === 'cap') return ny < 0.05 ? 'acc' : ny < 0.75 ? 'hair' : 'skin';
      return ny < 0.8 || s === 'long' || s === 'curly' ? 'hair' : 'skin';
    }
    if (s === 'scarf') {
      const fx = dir === 'down' ? nx / 0.68 : (nx + 0.38) / 0.55;
      const fy = (ny - 0.28) / 0.62;
      return fx * fx + fy * fy <= 1 ? 'skin' : 'acc';
    }
    if (s === 'cap') {
      if (ny < -0.42) return 'acc';
      if (dir === 'down') return Math.abs(nx) > 0.8 && ny < 0.3 ? 'hair' : 'skin';
      return nx > 0.1 && ny < 0.55 ? 'hair' : 'skin';
    }
    if (s === 'bald') {
      if (dir === 'down') return Math.abs(nx) > 0.78 && ny > -0.35 && ny < 0.35 ? 'hair' : 'skin';
      return nx > 0.3 && ny > -0.3 && ny < 0.45 ? 'hair' : 'skin';
    }
    // short / long / bun / pony / curly
    if (dir === 'down') {
      const fringe = -0.18 + 0.12 * Math.sin(x * 1.9) + (s === 'curly' ? 0.1 : 0);
      if (ny < fringe) return 'hair';
      if (Math.abs(nx) > 0.82 && ny < 0.45) return 'hair';
      if ((s === 'long' || s === 'pony') && Math.abs(nx) > 0.7 && ny < 0.7) return 'hair';
      return 'skin';
    }
    // left profile: face on the left
    if (ny < -0.2 + 0.1 * Math.sin(x * 1.7)) return 'hair';
    if (nx > -0.05 && ny < 0.62) return 'hair';
    if (s === 'long' && nx > -0.35) return 'hair';
    return 'skin';
  };
  for (let y = 0; y < 18; y++)
    for (let x = 0; x < FW; x++) {
      const r = isHair(x, y);
      if (!r) continue;
      let c = r === 'hair' ? hair : r === 'acc' ? acc : skin;
      const lit = (x + 0.5 - cx) / rx * 0.6 + (y + 0.5 - cy) / ry; // light from top-left
      if (r === 'hair') {
        if (lit < -0.62 && lit > -0.9 && x % 4 !== 3) c = hairL;
        else if (lit > 0.55) c = hairD;
        if (look.style === 'curly') {
          const n = Math.sin(x * 2.1 + y * 0.7) + Math.sin(y * 2.3 - x * 0.4);
          c = n > 1.1 ? hairL : n < -1.2 ? hairD : c;
        }
      } else if (r === 'acc') {
        if (lit < -0.6) c = accL;
        else if (lit > 0.5) c = accD;
      } else if (lit > 0.75 || (dir === 'left' && x > 9)) c = skinD;
      im.put(x, y, c);
    }
  // face features
  const eye = hex('#262028'), shine = hex('#ffffff');
  if (dir === 'down') {
    for (const ex of [6, 13]) {
      im.put(ex, 12, eye);
      im.put(ex, 13, eye);
    }
    if (look.style === 'cap') for (let x = 4; x <= 15; x++) im.put(x, 8, shade(acc, -0.45));
  } else if (dir === 'left') {
    im.put(3, 12, eye);
    im.put(3, 13, eye);
    im.put(4, 13, shine);
    // ear
    const ear = shade(skin, -0.2);
    if (look.style !== 'scarf' && look.style !== 'long') {
      im.put(11, 12, ear);
      im.put(11, 13, ear);
    }
    if (look.style === 'cap') for (let x = 0; x <= 5; x++) im.put(x, 9, shade(acc, -0.45));
  }
  // selective dark outline (colored by neighbour)
  outlineSelective(im);
  return im;
}

/** HGSS-ish outline: each outside pixel gets a dark version of its neighbour. */
export function outlineSelective(im: Img, k = -0.72) {
  const src = im.data.slice();
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < im.w && y < im.h ? src[y * im.w + x] : 0);
  for (let y = 0; y < im.h; y++)
    for (let x = 0; x < im.w; x++) {
      if (A(at(x, y))) continue;
      const n = [at(x, y - 1), at(x - 1, y), at(x + 1, y), at(x, y + 1)].find((c) => A(c) === 255);
      if (n) im.put(x, y, shade(n, k));
    }
}

function npcPal(look: NpcLook): Pal {
  const outer = hex(look.outer), inner = hex(look.inner), pants = hex(look.pants), shoe = hex(look.shoes);
  const skin = hex(look.skin);
  return {
    k: hex('#24202c'),
    J: look.sleeveless ? skin : outer,
    j: look.sleeveless ? shade(skin, 0.15) : shade(outer, 0.25),
    T: inner,
    t: shade(inner, -0.2),
    S: skin,
    s: shade(skin, -0.25),
    P: look.skirt ? outer : pants,
    p: shade(look.skirt ? outer : pants, -0.3),
    F: shoe,
    f: shade(shoe, -0.3),
  };
}

function headToRows(head: Img): Img {
  return head;
}

/** Builds a 12-frame horizontal sheet: down(3), up(3), left(3), right(3). */
function buildSheet(frameFn: (dir: 'down' | 'up' | 'left' | 'right', f: 0 | 1 | 2) => Img) {
  const sheet = new Img(FW * 12, FH);
  const dirs = ['down', 'up', 'left', 'right'] as const;
  dirs.forEach((d, di) =>
    ([0, 1, 2] as const).forEach((f) => sheet.blit(frameFn(d, f), (di * 3 + f) * FW, 0)),
  );
  return sheet;
}

export function playerSheet(): Img {
  const pal = playerPal();
  return buildSheet((dir, f) => {
    const flip = dir === 'right';
    const bob = f === 0 ? 0 : 1; // head dips a pixel on each step, like the DS sprites
    if (dir === 'down') {
      const legs = f === 0 ? LEGS_FRONT.stand : f === 1 ? LEGS_FRONT_STEP_A : LEGS_FRONT_STEP_B;
      return composeFrame(PLAYER_HEAD_DOWN, BODY_DOWN_TOP, legs, pal, bob);
    }
    if (dir === 'up') {
      const legs = f === 0 ? LEGS_FRONT.stand : f === 1 ? LEGS_FRONT_STEP_B : LEGS_FRONT_STEP_A;
      return composeFrame(PLAYER_HEAD_UP, BODY_UP_TOP, legs, pal, bob);
    }
    const top = f === 0 ? BODY_LEFT_TOP : f === 1 ? BODY_LEFT_TOP_SWING_A : BODY_LEFT_TOP_SWING_B;
    const legs = f === 0 ? LEGS_LEFT_STAND : f === 1 ? LEGS_LEFT_STEP_A : LEGS_LEFT_STEP_B;
    return composeFrame(PLAYER_HEAD_LEFT, top, legs, pal, bob, flip);
  });
}

export function npcSheet(look: NpcLook): Img {
  const pal = npcPal(look);
  const heads = { down: npcHead(look, 'down'), up: npcHead(look, 'up'), left: npcHead(look, 'left') };
  return buildSheet((dir, f) => {
    const flip = dir === 'right';
    const bob = f === 0 ? 0 : 1;
    const im = new Img(FW, FH);
    im.ellipse(9.5, 26.5, 6, 1.6, hex('#000000', 52));
    let top: string[], legs: string[];
    if (dir === 'down' || dir === 'up') {
      top = dir === 'down' ? BODY_DOWN_TOP : BODY_UP_TOP;
      legs = f === 0 ? LEGS_FRONT.stand : (f === 1) === (dir === 'down') ? LEGS_FRONT_STEP_A : LEGS_FRONT_STEP_B;
    } else {
      top = f === 0 ? BODY_LEFT_TOP : f === 1 ? BODY_LEFT_TOP_SWING_A : BODY_LEFT_TOP_SWING_B;
      legs = f === 0 ? LEGS_LEFT_STAND : f === 1 ? LEGS_LEFT_STEP_A : LEGS_LEFT_STEP_B;
    }
    if (look.skirt) legs = skirtify(legs);
    im.ascii(0, 17, top, pal, flip);
    im.ascii(0, 23, legs, pal, flip);
    const head = heads[dir === 'right' ? 'left' : dir];
    im.blit(head, 0, 1 + bob - 1, { flipX: flip });
    return im;
  });
}

/** Turns the first trouser rows into a flared skirt with bare legs below. */
function skirtify(legs: string[]) {
  return legs.map((r, i) => {
    if (i === 0) return r.replace(/k(P+)/, (_m, p: string) => 'k' + p);
    if (i === 1) {
      const a = r.indexOf('k'), b = r.lastIndexOf('k');
      return r.slice(0, a - 1) + 'k' + 'P'.repeat(b - a + 1) + 'k' + r.slice(b + 2);
    }
    return r.replace(/P/g, 'S').replace(/p/g, 's');
  });
}

/** A small cat (16x16 frames, 12 frames like humans but compact). */
export function catSheet(fur = '#f0a050', dark = '#a05a20'): Img {
  const W = 20, Hh = 28;
  const sheet = new Img(W * 12, Hh);
  const pal: Pal = { k: hex('#2a1e1a'), o: hex(fur), d: hex(dark), w: hex('#fff6e8'), e: hex('#1a1a1a'), p: hex('#f08090') };
  const down = [
    '....................',
    '.....k........k.....',
    '....kok......kok....',
    '....kodkkkkkkdok....',
    '...koooooooooooook..',
    '...koeoooooooeoook..',
    '...kooowwpwwoooook..',
    '....kooowwwwoook....',
    '.....kkooooookk.....',
    '.....kodoooodok.....',
    '.....kooooooook.....',
    '.....kowkkkkwok.....',
    '......kk....kk......',
  ];
  const up = [
    '....................',
    '.....k........k.....',
    '....kok......kok....',
    '....koookkkkooook...',
    '...koooooooooooook..',
    '...kooodooodooook...',
    '...koooooooooooook..',
    '....koooodoooook....',
    '.....kooooooook.....',
    '.....kodoooodokk....',
    '.....kooooooookok...',
    '.....kookkkkook.kk..',
    '......kk....kk......',
  ];
  const left = [
    '....................',
    '...k..k.............',
    '..kokkok............',
    '..koooook...........',
    '.koeooooook.........',
    '.kowwooooodkkkkkk...',
    '.kpwwoooooooodoook..',
    '..kkkoooodoooooook.k',
    '.....kooooooooodokok',
    '.....kowokkkkowokkok',
    '.....kwk......kwk.k.',
    '......k........k....',
    '....................',
  ];
  const draw = (rows: string[], i: number, flip: boolean, dy: number) => {
    const fr = new Img(W, Hh);
    fr.ellipse(9.5, 26.5, 5, 1.3, hex('#000000', 48));
    fr.ascii(0, 14 + dy, rows, pal, flip);
    sheet.blit(fr, i * W, 0);
  };
  [0, 1, 2].forEach((f) => {
    const dy = f === 0 ? 0 : -1;
    draw(down, f, false, dy);
    draw(up, 3 + f, false, dy);
    draw(left, 6 + f, false, dy);
    draw(left, 9 + f, true, dy);
  });
  return sheet;
}

export const _internal = { headToRows };
