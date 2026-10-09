/** Interior of CHAYA & CO, the café on the plaza. */
import type { MapDef } from './types';

const terrain = [
  'ffffffffffff',
  'ffffffffffff',
  'ffffffffffff',
  'ffffffffffff',
  'ffffffffffff',
  'ffffrrrrffff',
  'ffffrrrrffff',
  'ffffrrrrffff',
  'ffffffffffff',
  '_____mm_____',
];

const EXIT = { map: 'town', x: 18, y: 32, dir: 'down' as const };

export const CAFE: MapDef = {
  id: 'cafe',
  name: 'CHAYA & CO.',
  width: 12,
  height: 10,
  interior: true,
  terrain,
  placements: [
    { key: 'i_wall', x: 0, y: 0 },
    { key: 'i_counter', x: 1, y: 3, text: ['A brass chai urn, an espresso machine and a glass case of banana bread share the counter.', 'It is a surprisingly peaceful arrangement.'] },
    { key: 'i_shelf', x: 9, y: 2, text: ['Old paperbacks, a field guide to river birds, and a subway map with a coffee ring on it.'] },
    { key: 'i_plant', x: 0, y: 4 },
    { key: 'i_plant', x: 11, y: 2 + 2 },
    { key: 'i_table', x: 8, y: 5, text: ['Two cups of filter coffee, still steaming. Somebody is coming back for these.'] },
    { key: 'i_chair', x: 7, y: 5 },
    { key: 'i_chair', x: 10, y: 5 },
    { key: 'i_table', x: 1, y: 7, text: ['A half-finished crossword. 7 across: "Backwater boat" (10). You know this one.'] },
    { key: 'i_chair', x: 0, y: 7 },
    { key: 'i_chair', x: 3, y: 7 },
    { key: 'i_sofa', x: 8, y: 8, text: ['A squashy green sofa. It has absorbed a great many afternoons.'] },
    { key: 'i_radio', x: 11, y: 6, text: ['A record player is spinning an old film song.', '♪ The needle crackles like rain on a tiled roof. ♪'] },
  ],
  texts: [
    { x: 6, y: 1, face: 'up', text: ['MENU', 'Chaya · Filter Kaapi · Cold Brew', 'Bagel with cream cheese · Pazhampori · Banana bread', 'Ask about the "Three Cities" — chai, espresso, and a bagel.'] },
    { x: 7, y: 1, face: 'up', text: ['MENU', 'Chaya · Filter Kaapi · Cold Brew', 'Bagel with cream cheese · Pazhampori · Banana bread', 'Ask about the "Three Cities" — chai, espresso, and a bagel.'] },
    { x: 9, y: 1, face: 'up', text: ['Outside, a yellow taxi honks at a pigeon. The pigeon does not move.'] },
    { x: 2, y: 1, face: 'up', text: ['Through the window: the fountain glittering in the plaza, and the metro gliding past above it.'] },
    { x: 11, y: 1, face: 'up', text: ['A framed photo of rolling blue mountains under snow. Someone wrote "home, too" on the corner.'] },
  ],
  npcs: [
    {
      id: 'barista', sprite: 'barista', x: 3, y: 2, dir: 'down', behavior: { kind: 'static' },
      lines: ['Welcome to Chaya & Co.! We do Kerala chai, New York bagels, and coffee strong enough to pass a midterm.', "Today's special is the Three Cities: one chai, one espresso, one bagel. Nobody has ever finished it."],
      more: [["Fun fact: our chai is 'pulled'. You pour it back and forth from a height until it foams. It's half cooking, half performance."]],
    },
    {
      id: 'reader', sprite: 'reader', x: 9, y: 7, dir: 'down', behavior: { kind: 'look', dirs: ['down', 'left', 'down', 'right'] },
      lines: ["I come here to read, but mostly I listen to the record player and watch the trains.", 'This town is like this café. Everything from somewhere else, and somehow it all fits.'],
    },
    {
      id: 'studier', sprite: 'student', x: 2, y: 6, dir: 'down', behavior: { kind: 'static' },
      lines: ['Shh… I am studying. (The page has been the same for an hour.)'],
    },
    {
      id: 'cafecat', sprite: 'cat', x: 6, y: 6, dir: 'left', behavior: { kind: 'static' },
      lines: ['The café cat is curled up on the warm rug.', 'Zzz… it twitches one ear at you and keeps sleeping.'],
    },
  ],
  warps: [
    { x: 5, y: 9, to: EXIT },
    { x: 6, y: 9, to: EXIT },
  ],
  spawn: { x: 5, y: 8, dir: 'up' },
};
