/**
 * Tile-locked overworld character with DS-style stepping: each tile step shows a
 * stride frame for the first half and the standing frame for the second, and
 * consecutive steps alternate feet.
 */
import Phaser from 'phaser';
import { TILE, WALK_MS, DEPTH, FRAME_H } from '../constants';
import { charRow } from '../assets';
import { DIRS } from '../world/runtime';
import type { Dir } from '../world/types';

const DIR_INDEX: Record<Dir, number> = { down: 0, up: 1, left: 2, right: 3 };

export interface Occupancy {
  canEnter(x: number, y: number, who: Character): boolean;
}

export class Character {
  sprite: Phaser.GameObjects.Sprite;
  tx: number;
  ty: number;
  facing: Dir;
  moving = false;
  private fromX = 0;
  private fromY = 0;
  private toX = 0;
  private toY = 0;
  private elapsed = 0;
  private duration = WALK_MS;
  private foot = 0;
  private bumping = 0;
  private row: number;
  onStepComplete?: () => void;

  constructor(
    protected scene: Phaser.Scene,
    sprite: string,
    tx: number,
    ty: number,
    facing: Dir,
  ) {
    this.row = charRow(sprite);
    this.tx = tx;
    this.ty = ty;
    this.facing = facing;
    this.sprite = scene.add.sprite(0, 0, 'chars', this.frame(0)).setOrigin(0.5, 1);
    this.place();
  }

  /** Tile currently reserved (destination while moving). */
  get targetTile(): [number, number] {
    return this.moving ? [this.toX, this.toY] : [this.tx, this.ty];
  }
  get isBusy() {
    return this.moving || this.bumping > 0;
  }

  private frame(f: 0 | 1 | 2) {
    return this.row * 12 + DIR_INDEX[this.facing] * 3 + f;
  }

  place() {
    this.sprite.setPosition(this.tx * TILE + TILE / 2, this.ty * TILE + TILE);
    this.sprite.setFrame(this.frame(0));
    this.updateDepth();
  }

  private updateDepth() {
    this.sprite.setDepth(DEPTH.actorBase + this.sprite.y);
  }

  face(dir: Dir) {
    this.facing = dir;
    if (!this.moving) this.sprite.setFrame(this.frame(0));
  }

  facingTile(): [number, number] {
    const [dx, dy] = DIRS[this.facing];
    return [this.tx + dx, this.ty + dy];
  }

  /** Attempts one step. Returns false (and plays a bump) if blocked. */
  step(dir: Dir, occ: Occupancy, durationMs = WALK_MS, bumpOnFail = false): boolean {
    if (this.moving) return false;
    this.facing = dir;
    const [dx, dy] = DIRS[dir];
    const nx = this.tx + dx, ny = this.ty + dy;
    if (!occ.canEnter(nx, ny, this)) {
      this.sprite.setFrame(this.frame(0));
      if (bumpOnFail && this.bumping <= 0) this.bumping = WALK_MS * 2;
      return false;
    }
    this.moving = true;
    this.fromX = this.tx;
    this.fromY = this.ty;
    this.toX = nx;
    this.toY = ny;
    this.elapsed = 0;
    this.duration = durationMs;
    this.foot ^= 1;
    return true;
  }

  update(dtMs: number) {
    if (this.bumping > 0) {
      // walking-in-place against an obstacle, at half speed
      this.bumping -= dtMs;
      const phase = Math.floor(((WALK_MS * 2 - this.bumping) / WALK_MS) % 2);
      const t = ((WALK_MS * 2 - this.bumping) % WALK_MS) / WALK_MS;
      this.sprite.setFrame(this.frame(t < 0.5 ? ((phase ^ this.foot) ? 1 : 2) : 0));
      if (this.bumping <= 0) {
        this.foot ^= 1;
        this.sprite.setFrame(this.frame(0));
      }
    }
    if (!this.moving) return;
    this.elapsed += dtMs;
    const t = Math.min(1, this.elapsed / this.duration);
    const px = (this.fromX + (this.toX - this.fromX) * t) * TILE + TILE / 2;
    const py = (this.fromY + (this.toY - this.fromY) * t) * TILE + TILE;
    this.sprite.setPosition(Math.round(px), Math.round(py));
    this.sprite.setFrame(this.frame(t < 0.5 ? (this.foot ? 1 : 2) : 0));
    this.updateDepth();
    if (t >= 1) {
      this.moving = false;
      this.tx = this.toX;
      this.ty = this.toY;
      this.onStepComplete?.();
    }
  }

  cancelBump() {
    if (this.bumping > 0) {
      this.bumping = 0;
      this.sprite.setFrame(this.frame(0));
    }
  }

  destroy() {
    this.sprite.destroy();
  }
}

export const SPRITE_FOOT_OFFSET = FRAME_H;
