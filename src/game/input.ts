/**
 * Unified controls: keyboard (only while the game's container has focus — Phaser's
 * keyboard plugin is bound to the container element, never to window) plus a
 * virtual pad that the React wrapper drives for touch screens.
 */
import Phaser from 'phaser';
import type { Dir } from './world/types';

export type Button = Dir | 'a' | 'b' | 'start';

export class Controls {
  private keys: Record<string, Phaser.Input.Keyboard.Key[]> = {};
  private virtual = new Set<Button>();
  private pressedQueue = new Set<Button>();
  /** Most recently pressed direction wins when several are held (DS behaviour). */
  private dirOrder: Dir[] = [];

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    const map: Record<Button, number[]> = {
      up: [K.UP, K.W],
      down: [K.DOWN, K.S],
      left: [K.LEFT, K.A],
      right: [K.RIGHT, K.D],
      a: [K.Z, K.SPACE, K.ENTER],
      b: [K.X, K.SHIFT, K.BACKSPACE],
      start: [K.ESC, K.P],
    };
    for (const [btn, codes] of Object.entries(map) as [Button, number[]][]) {
      this.keys[btn] = codes.map((c) => {
        const key = kb.addKey(c, true, false);
        key.on('down', () => this.press(btn));
        key.on('up', () => this.release(btn));
        return key;
      });
    }
  }

  private press(b: Button) {
    this.pressedQueue.add(b);
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') {
      this.dirOrder = this.dirOrder.filter((d) => d !== b);
      this.dirOrder.push(b);
    }
  }
  private release(b: Button) {
    if (b === 'up' || b === 'down' || b === 'left' || b === 'right') {
      if (!this.isDown(b)) this.dirOrder = this.dirOrder.filter((d) => d !== b);
    }
  }

  setVirtual(b: Button, down: boolean) {
    if (down && !this.virtual.has(b)) {
      this.virtual.add(b);
      this.press(b);
    } else if (!down && this.virtual.has(b)) {
      this.virtual.delete(b);
      this.release(b);
    }
  }

  isDown(b: Button): boolean {
    return this.virtual.has(b) || (this.keys[b]?.some((k) => k.isDown) ?? false);
  }

  /** Consumes a fresh press of `b` since the last call. */
  justPressed(b: Button): boolean {
    if (this.pressedQueue.has(b)) {
      this.pressedQueue.delete(b);
      return true;
    }
    return false;
  }
  /** Drops queued presses (e.g. after closing a dialogue so A doesn't re-trigger). */
  flush() {
    this.pressedQueue.clear();
  }

  heldDir(): Dir | null {
    for (let i = this.dirOrder.length - 1; i >= 0; i--) if (this.isDown(this.dirOrder[i])) return this.dirOrder[i];
    for (const d of ['up', 'down', 'left', 'right'] as Dir[]) if (this.isDown(d)) return d;
    return null;
  }

  releaseAll() {
    this.virtual.clear();
    this.dirOrder = [];
    this.pressedQueue.clear();
    for (const ks of Object.values(this.keys)) ks.forEach((k) => k.reset());
  }
}
