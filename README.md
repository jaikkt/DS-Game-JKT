# Cardamom City

*Where the backwaters meet the boulevard.*

A small, explorable Pokémon HeartGold/SoulSilver-style town built as **one self-contained section** for a personal website. It's a fictional town that blends:

- **Kochi:** cheena vala fishing nets that dip and rise, a kettuvallam houseboat, tiled-roof tharavad houses, coconut palms, a whitewashed harbour church, a tea stall and a spice bazaar
- **Blacksburg:** grey-limestone Stonefield Hall with its castellated tower, the mown Drill Lawn, a duck pond with ducks, and a stone library
- **New York:** brownstones with stoops and fire escapes, a bodega with a cat, a theatre marquee, a pizzeria, a subway stair, yellow cabs and a walk-up with a rooftop water tower

An elevated metro line (Goldenrod's magnet-train track, by way of the Kochi Metro and the NYC el) ties the town together.

## Run it

```bash
npm install
npm run dev        # regenerates art, then serves the test harness on :5178
npm run build      # typecheck + production bundle
npm run assets     # regenerate the pixel art only
```

The page at `/` is a **test harness only**. It's not a website design.

## Controls

| Action | Keys | Touch |
|---|---|---|
| Move (tap to turn in place) | Arrows / WASD | D-pad |
| Talk / read / advance text | Z, Space, Enter | A |
| Run (hold) | X, Shift | B |
| Menu (Resume / Exit) | Esc, P | ✕ button |

Keyboard input is bound to the section's own element. It only works while the section has focus, so it never hijacks scrolling or keys on the rest of the page.

## Embedding

```tsx
import { CardamomTown, type CardamomTownHandle } from './src';

const ref = useRef<CardamomTownHandle>(null);

<CardamomTown
  ref={ref}
  width="100%"
  height={540}
  onStart={() => {}}
  onExit={() => {}}
/>

ref.current?.start();
ref.current?.pause();
ref.current?.resume();
ref.current?.exit();
ref.current?.enterFullscreen();
```

| Prop | Default | |
|---|---|---|
| `width`, `height` | `'100%'`, `540` | Any CSS size. The game fills the box. |
| `autoStart` | `false` | Skip the title card. |
| `pixelScale` | auto | Force a whole-number scale from 1 to 8. |
| `allowFullscreen` | `true` | Shows the fullscreen button. |
| `autoPause` | `true` | Pauses when scrolled out of view or when focus leaves. |
| `touchControls` | `'auto'` | `'auto'` shows the pad on coarse pointers; also `'always'` or `'never'`. |

Without React, use `createTownGame(hostElement, { onExit })`. It returns `start / pause / resume / exit`.

**Isolation guarantees**
- Inline styles only, so no global CSS is added.
- Phaser and the game code are lazy-loaded when Start is pressed. Before that, the host page pays only for the poster image.
- `exit()` and unmount destroy the Phaser game, its textures and every observer and listener.
- Pixel art stays crisp: the game picks a whole-number zoom (about 190 game pixels on the short side) and re-fits on resize and fullscreen.

## How it's built

```
scripts/build-assets.ts   generator entry: paints everything and writes src/game/assets/gen/*
scripts/art/              pixel library, palette, terrain, props, buildings, set pieces, characters, font
src/game/world/           shared data: prefabs (footprints), town + café layouts, NPCs, dialogue
src/game/scenes/          Boot (load), World (map, movement, NPCs, warps, ambience), UI (dialogue, banner, menu)
src/game/TownGame.ts      framework-agnostic controller
src/react/CardamomTown.tsx React section component
```

All art is **original and procedurally painted**, pixel by pixel, by `npm run assets`:
- Tile terrain with neighbour-aware curbs, quays, foam and rounded shores.
- 3/4-view buildings, plus a 4-direction player sprite redrawn from the supplied trainer art.
- A procedural NPC cast on the same body template, and a hand-made bitmap font.

Each map is baked into a **ground** layer and an **overlay** layer (canopies, roofs, the metro deck), so characters correctly walk behind trees and under the tracks.

The layout module is shared by the generator and the runtime, so collision always matches the art. The generator also warns about overlapping placements.

To swap in hand-drawn art later, replace the PNGs in `src/game/assets/gen/` and keep the same frame layout. Note that `npm run assets` overwrites them.

### Adding content
- **NPC:** add an entry to `npcs` in `src/game/world/town.ts`, with a sprite key from `looks.ts` and a behaviour of `static | look | wander | patrol`.
- **Sign or object text:** use `sign(x, y, [...])`, or put `text` on any placement.
- **New interior:** create a `MapDef` like `cafe.ts`, register it in `world/runtime.ts` and `assets.ts`, and point a placement's `door.warp` at it.
