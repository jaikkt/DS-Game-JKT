import type Phaser from 'phaser';
import type { Controls } from './input';
import type { Dir } from './world/types';

/** Per-game shared state, stored on game.registry under 'session'. */
export interface Session {
  controls?: Controls;
  onExit: () => void;
  onReady: () => void;
  start: { map: string; x: number; y: number; dir: Dir };
}
export const getSession = (scene: Phaser.Scene) => scene.registry.get('session') as Session;
