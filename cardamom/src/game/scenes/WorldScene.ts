import Phaser from 'phaser';
import { TILE, WALK_MS, RUN_MS, TURN_GRACE_MS, DEPTH } from '../constants';
import { MAPS, buildRuntime, MapRuntime, DIRS } from '../world/runtime';
import { PREFABS } from '../world/prefabs';
import type { Dir, WarpTarget } from '../world/types';
import { Character, Occupancy } from '../entities/Character';
import { Npc } from '../entities/Npc';
import { getSession } from '../session';
import type { UIScene } from './UIScene';
import type { Controls } from '../input';

const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

interface WorldData {
  map: string;
  x: number;
  y: number;
  dir: Dir;
  fade?: boolean;
}

export class WorldScene extends Phaser.Scene implements Occupancy {
  private rt!: MapRuntime;
  private player!: Character;
  private npcs: Npc[] = [];
  private ui!: UIScene;
  private controls!: Controls;
  private turnHold = 0;
  private lastHeld: Dir | null = null;
  private wasWalking = false;
  private warping = false;
  private water?: Phaser.GameObjects.TileSprite;
  private ambient: { update(dt: number): void }[] = [];

  constructor() {
    super('world');
  }

  create(data: WorldData) {
    const def = MAPS[data.map];
    this.rt = buildRuntime(def);
    this.ui = this.scene.get('ui') as UIScene;
    this.controls = getSession(this).controls!;
    this.npcs = [];
    this.ambient = [];
    this.warping = false;
    const W = def.width * TILE, H = def.height * TILE;

    const cam = this.cameras.main;
    cam.setBackgroundColor(def.interior ? '#000000' : '#1868d8');
    cam.setRoundPixels(true);

    if (!def.interior) {
      this.water = this.add.tileSprite(0, 0, W, H, 'water_0').setOrigin(0, 0).setDepth(DEPTH.water);
      let wf = 0;
      this.time.addEvent({ delay: 260, loop: true, callback: () => this.water?.setTexture(`water_${(wf = (wf + 1) % 4)}`) });
    } else this.water = undefined;
    this.add.image(0, 0, `${def.id}_ground`).setOrigin(0, 0).setDepth(DEPTH.ground);
    this.add.image(0, 0, `${def.id}_overlay`).setOrigin(0, 0).setDepth(DEPTH.overlay);

    // live, animated set pieces
    for (const p of def.placements) {
      const d = PREFABS[p.key];
      if (!('animated' in d) || !d.animated) continue;
      const s = this.add.sprite(p.x * TILE, p.y * TILE, 'sprites', `${p.key}_0`).setOrigin(0, 0);
      s.play({ key: `anim_${p.key}`, startFrame: Math.floor(Math.random() * d.animated.frames) });
      s.setDepth(p.key.startsWith('flowers') ? DEPTH.flat : DEPTH.actorBase + (p.y + d.h) * TILE);
    }

    for (const n of def.npcs) this.npcs.push(new Npc(this, n));
    this.player = new Character(this, 'player', data.x, data.y, data.dir);
    this.player.onStepComplete = () => this.afterStep();

    // camera: locked on the trainer like the DS; small rooms are centred
    const vw = this.scale.width, vh = this.scale.height;
    const bx = W < vw ? (W - vw) / 2 : 0, by = H < vh ? (H - vh) / 2 : 0;
    cam.setBounds(bx, by, Math.max(W, vw), Math.max(H, vh));
    cam.startFollow(this.player.sprite, true, 1, 1, 0, 8);
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));

    if (!def.interior) this.spawnTownAmbience();

    if (data.fade) {
      this.ui.fade(false, 320);
      this.ui.showBanner(def.name);
    }
  }

  private onResize() {
    const def = this.rt.def;
    const W = def.width * TILE, H = def.height * TILE;
    const vw = this.scale.width, vh = this.scale.height;
    this.cameras.main.setBounds(W < vw ? (W - vw) / 2 : 0, H < vh ? (H - vh) / 2 : 0, Math.max(W, vw), Math.max(H, vh));
  }

  // ───────── occupancy ─────────
  canEnter(x: number, y: number, who: Character): boolean {
    if (this.rt.isSolid(x, y)) return false;
    if (who !== this.player && this.rt.warps.has(this.rt.idx(x, y))) return false;
    const all: Character[] = [this.player, ...this.npcs];
    for (const c of all) {
      if (c === who || !c) continue;
      const [ox, oy] = c.targetTile;
      if ((c.tx === x && c.ty === y) || (ox === x && oy === y)) return false;
    }
    return true;
  }

  // ───────── loop ─────────
  update(_t: number, rawDt: number) {
    const dt = Math.min(rawDt, 50);
    for (const n of this.npcs) n.tick(dt, this);
    for (const a of this.ambient) a.update(dt);
    if (this.water) this.water.tilePositionX += dt * 0.004;

    const p = this.player;
    p.update(dt);
    if (this.warping || this.ui.busy) {
      this.turnHold = 0;
      return;
    }
    if (p.moving) return;

    const c = this.controls;
    if (c.justPressed('a')) {
      p.cancelBump();
      this.interact();
      return;
    }
    // a very quick tap may be released before this frame: still honour it once
    const tapped = (['up', 'down', 'left', 'right'] as Dir[]).find((d) => c.justPressed(d)) ?? null;
    const held = c.heldDir();
    const dir = held ?? tapped;
    if (!dir) {
      this.lastHeld = null;
      this.wasWalking = false;
      return;
    }
    const run = c.isDown('b');
    if (dir !== p.facing && !this.wasWalking && (this.lastHeld !== dir || !held)) {
      // tap to turn in place, hold to walk
      p.face(dir);
      p.cancelBump();
      this.turnHold = TURN_GRACE_MS;
      this.lastHeld = dir;
      return;
    }
    this.lastHeld = dir;
    if (this.turnHold > 0 && held) {
      this.turnHold -= dt;
      return;
    }
    if (p.isBusy) return;
    const ok = p.step(dir, this, run ? RUN_MS : WALK_MS, true);
    this.wasWalking = ok;
  }

  private afterStep() {
    const p = this.player;
    const w = this.rt.warps.get(this.rt.idx(p.tx, p.ty));
    if (w) this.warp(w);
  }

  private warp(to: WarpTarget) {
    this.warping = true;
    this.controls.releaseAll();
    this.ui.fade(true, 260, () => {
      this.scene.restart({ map: to.map, x: to.x, y: to.y, dir: to.dir, fade: true } satisfies WorldData);
    });
  }

  // ───────── interaction ─────────
  private interact() {
    const p = this.player;
    const [fx, fy] = p.facingTile();
    const [dx, dy] = DIRS[p.facing];
    const npcAt = (x: number, y: number) => this.npcs.find((n) => {
      const [ox, oy] = n.targetTile;
      return (n.tx === x && n.ty === y) || (ox === x && oy === y);
    });

    let npc = npcAt(fx, fy);
    const owner = this.rt.owner[this.rt.idx(fx, fy)];
    // talk across counters
    if (!npc && owner?.key === 'i_counter') npc = npcAt(fx + dx, fy + dy);
    if (npc) {
      if (npc.moving) return;
      npc.frozen = true;
      if (npc.def.behavior.kind !== 'static' || npc.def.sprite !== 'cat') npc.face(OPPOSITE[p.facing]);
      this.ui.say(npc.nextLines(), () => {
        npc!.frozen = false;
      });
      return;
    }
    const tt = this.rt.def.texts.find((t) => t.x === fx && t.y === fy && (!t.face || t.face === p.facing));
    if (tt) return this.ui.say(tt.text);
    const door = this.rt.doors.get(this.rt.idx(fx, fy));
    if (door?.text) return this.ui.say(door.text);
    if (owner?.text) return this.ui.say(owner.text);
    const t = this.rt.terrainAt(fx, fy);
    if (t === 'W' && !owner) {
      const lines = [
        'The water is calm. Little fish flicker just under the surface.',
        'Ripples carry the smell of salt and wet coconut husk.',
        'Somewhere out on the water, an oar splashes.',
      ];
      this.ui.say([lines[(fx * 7 + fy * 3) % lines.length]]);
    }
  }

  // ───────── town ambience: metro train, ducks, pigeons ─────────
  private spawnTownAmbience() {
    // Metro train shuttling between the east edge and the station
    const train = this.add.image(0, 0, 'sprites', 'train').setOrigin(0, 1).setDepth(DEPTH.train);
    const W = this.rt.def.width * TILE;
    const deckY = 18 * TILE + 24;
    const stopX = 23 * TILE + 2;
    type Phase = 'wait' | 'arrive' | 'dwell' | 'depart';
    let phase: Phase = 'wait', timer = 4000, x = W + 10, v = 0;
    train.setPosition(x, deckY).setVisible(false);
    this.ambient.push({
      update: (dt) => {
        timer -= dt;
        if (phase === 'wait' && timer <= 0) {
          phase = 'arrive';
          x = W + 10;
          v = 0.16;
          train.setVisible(true).setFlipX(false);
        } else if (phase === 'arrive') {
          const dist = x - stopX;
          v = Math.max(0.025, Math.min(0.16, dist / 900));
          x -= v * dt;
          if (x <= stopX) {
            x = stopX;
            phase = 'dwell';
            timer = 3500;
          }
        } else if (phase === 'dwell' && timer <= 0) {
          phase = 'depart';
          v = 0.01;
          train.setFlipX(true);
        } else if (phase === 'depart') {
          v = Math.min(0.18, v + dt * 0.00006);
          x += v * dt;
          if (x > W + 20) {
            phase = 'wait';
            timer = 9000 + Math.random() * 7000;
            train.setVisible(false);
          }
        }
        train.setPosition(Math.round(x), deckY);
      },
    });

    // Ducks paddling around the pond
    const water: [number, number][] = [];
    for (let y = 3; y < 13; y++) for (let x = 49; x < 63; x++) if (this.rt.terrainAt(x, y) === 'W') water.push([x, y]);
    for (let i = 0; i < 3; i++) {
      const kind = i === 0 ? 1 : 0;
      const [sx, sy] = water[(i * 7) % water.length];
      const d = this.add.sprite(sx * TILE, sy * TILE, 'sprites', `duck${kind}_0`).setOrigin(0, 0);
      let tx = d.x, ty = d.y, wait = 0;
      const pick = () => {
        const [wx, wy] = water[Math.floor(Math.random() * water.length)];
        tx = wx * TILE;
        ty = wy * TILE;
        d.play(`duck${kind}_${tx < d.x ? 'l' : 'r'}`, true);
      };
      pick();
      this.ambient.push({
        update: (dt) => {
          if (wait > 0) return void (wait -= dt);
          const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
          if (dist < 1) {
            wait = 1000 + Math.random() * 3000;
            pick();
            return;
          }
          const sp = 0.012 * dt;
          d.x += (dx / dist) * Math.min(sp, dist);
          d.y += (dy / dist) * Math.min(sp, dist);
          d.setDepth(DEPTH.actorBase + d.y + 14);
        },
      });
    }

    // Plaza pigeons: peck about, scatter when the trainer gets close, come back later
    const homes: [number, number][] = [[22, 28], [27, 27], [22, 33], [26, 33], [28, 30]];
    for (const [hx, hy] of homes) {
      const s = this.add.sprite(hx * TILE + 2, hy * TILE, 'sprites', 'pigeon_0').setOrigin(0, 0);
      s.play({ key: 'pigeon_peck', startFrame: Math.floor(Math.random() * 4) }).setDepth(DEPTH.actorBase + hy * TILE + 14);
      let state: 'peck' | 'fly' | 'gone' = 'peck', vx = 0, vy = 0, t = 0;
      this.ambient.push({
        update: (dt) => {
          const p = this.player.sprite;
          if (state === 'peck') {
            if (Math.hypot(p.x - (s.x + 8), p.y - (s.y + 14)) < 30) {
              state = 'fly';
              vx = (s.x + 8 < p.x ? -1 : 1) * (0.05 + Math.random() * 0.04);
              vy = -0.07 - Math.random() * 0.03;
              s.play('pigeon_fly').setFlipX(vx > 0).setDepth(DEPTH.sky);
            }
          } else if (state === 'fly') {
            s.x += vx * dt;
            s.y += vy * dt;
            if (s.y < this.cameras.main.worldView.y - 20) {
              state = 'gone';
              t = 8000 + Math.random() * 8000;
              s.setVisible(false);
            }
          } else {
            t -= dt;
            const homeX = hx * TILE + 2, homeY = hy * TILE;
            const far = Math.hypot(p.x - homeX, p.y - homeY) > 120;
            if (t <= 0 && far) {
              state = 'peck';
              s.setPosition(homeX, homeY).setVisible(true).setFlipX(Math.random() < 0.5).play('pigeon_peck');
              s.setDepth(DEPTH.actorBase + homeY + 14);
            }
          }
        },
      });
    }
  }
}
