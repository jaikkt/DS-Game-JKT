/** Generated asset manifest (URLs are fingerprinted and bundled by Vite). */
import townGround from './assets/gen/town_ground.png';
import townOverlay from './assets/gen/town_overlay.png';
import cafeGround from './assets/gen/cafe_ground.png';
import cafeOverlay from './assets/gen/cafe_overlay.png';
import spritesPng from './assets/gen/sprites.png';
import spritesJson from './assets/gen/sprites.json?url';
import charsPng from './assets/gen/chars.png';
import charsMeta from './assets/gen/chars.json';
import waterPng from './assets/gen/water.png';
import fontPng from './assets/gen/font.png';
import fontXml from './assets/gen/font.xml?url';

export const ASSETS = {
  maps: {
    town: { ground: townGround, overlay: townOverlay },
    cafe: { ground: cafeGround, overlay: cafeOverlay },
  } as Record<string, { ground: string; overlay: string }>,
  sprites: { png: spritesPng, json: spritesJson },
  chars: { png: charsPng, rows: charsMeta.rows as string[] },
  water: waterPng,
  font: { png: fontPng, xml: fontXml },
};

export const charRow = (key: string) => {
  const i = ASSETS.chars.rows.indexOf(key);
  if (i < 0) throw new Error(`unknown character sprite '${key}'`);
  return i;
};
