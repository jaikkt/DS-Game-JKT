import Phaser from 'phaser';
import { Character, Occupancy } from './Character';
import type { NpcDef, Dir } from '../world/types';
import { WALK_MS } from '../constants';

const ALL: Dir[] = ['down', 'left', 'up', 'right'];

export class Npc extends Character {
  private timer: number;
  private lookIdx = 0;
  private patrolIdx = 0;
  private talkCount = 0;
  frozen = false;

  constructor(scene: Phaser.Scene, readonly def: NpcDef) {
    super(scene, def.sprite, def.x, def.y, def.dir);
    this.timer = 800 + Math.random() * 2000;
  }

  /** Pages for this conversation; repeat visits cycle through `more`. */
  nextLines(): string[] {
    const sets = [this.def.lines, ...(this.def.more ?? [])];
    const lines = sets[this.talkCount % sets.length];
    this.talkCount++;
    return lines;
  }

  tick(dt: number, occ: Occupancy) {
    this.update(dt);
    if (this.frozen || this.isBusy) return;
    const b = this.def.behavior;
    if (b.kind === 'static') return;
    if (b.kind === 'patrol') {
      // walk continuously between waypoints, pausing briefly at each
      this.timer -= dt;
      if (this.timer > 0) return;
      const [wx, wy] = b.path[this.patrolIdx];
      if (wx === this.tx && wy === this.ty) {
        this.patrolIdx = (this.patrolIdx + 1) % b.path.length;
        this.timer = 600 + Math.random() * 900;
        return;
      }
      const dir: Dir = wx !== this.tx ? (wx > this.tx ? 'right' : 'left') : wy > this.ty ? 'down' : 'up';
      if (!this.step(dir, occ, WALK_MS)) {
        this.face(dir);
        this.timer = 400;
      }
      return;
    }
    this.timer -= dt;
    if (this.timer > 0) return;
    if (b.kind === 'look') {
      const dirs = b.dirs ?? ALL;
      this.lookIdx = b.dirs ? (this.lookIdx + 1) % dirs.length : Math.floor(Math.random() * 4);
      this.face(dirs[this.lookIdx]);
      this.timer = 1600 + Math.random() * 2600;
      return;
    }
    if (b.kind === 'wander') {
      const dir = ALL[Math.floor(Math.random() * 4)];
      const [nx, ny] = [this.tx + (dir === 'left' ? -1 : dir === 'right' ? 1 : 0), this.ty + (dir === 'up' ? -1 : dir === 'down' ? 1 : 0)];
      const inRange = Math.abs(nx - this.def.x) <= b.radius && Math.abs(ny - this.def.y) <= b.radius;
      if (Math.random() < 0.35 || !inRange || !this.step(dir, occ, WALK_MS)) this.face(dir);
      this.timer = 1200 + Math.random() * 2400;
    }
  }
}
