/**
 * Framework-agnostic controller for the Cardamom City section.
 *
 *   const game = createTownGame(hostElement, { onExit });
 *   game.start(); game.pause(); game.resume(); game.exit();
 *
 * The game mounts a canvas inside `host`, scales it by whole-number factors so the
 * pixel art stays crisp, listens to the keyboard only while `host` has focus,
 * and removes every listener and texture on exit.
 */
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { UIScene } from './scenes/UIScene';
import { WorldScene } from './scenes/WorldScene';
import type { Session } from './session';
import type { Button } from './input';
import { TOWN } from './world/town';

export interface TownGameOptions {
  /** Force a pixel scale (1–8). Default: picked from the container size. */
  pixelScale?: number;
  /** Called when the player chooses EXIT from the in-game menu. */
  onExit?: () => void;
  onReady?: () => void;
}

export interface TownGame {
  start(): void;
  pause(): void;
  resume(): void;
  exit(): void;
  readonly running: boolean;
  readonly paused: boolean;
  setVirtualButton(b: Button, down: boolean): void;
  /** Re-measure the host (called automatically via ResizeObserver). */
  resize(): void;
  focus(): void;
}

export function pickScale(w: number, h: number, forced?: number) {
  if (forced) return Math.max(1, Math.min(8, Math.round(forced)));
  // Aim for a DS-like view (~190 game pixels on the short side) at whole-number scale.
  let z = Math.round(Math.min(w, h) / 190);
  z = Math.max(1, Math.min(8, z));
  while (z > 1 && (w / z < 160 || h / z < 140)) z--;
  return z;
}

export function createTownGame(host: HTMLElement, opts: TownGameOptions = {}): TownGame {
  let game: Phaser.Game | null = null;
  let ro: ResizeObserver | null = null;
  let paused = false;
  let parent: HTMLDivElement | null = null;

  const measure = () => {
    const r = host.getBoundingClientRect();
    const w = Math.max(64, Math.floor(r.width)), h = Math.max(64, Math.floor(r.height));
    const z = pickScale(w, h, opts.pixelScale);
    return { z, w: Math.ceil(w / z), h: Math.ceil(h / z) };
  };

  const resize = () => {
    if (!game) return;
    const { z, w, h } = measure();
    if (game.scale.width !== w || game.scale.height !== h) game.scale.resize(w, h);
    if (game.scale.zoom !== z) game.scale.setZoom(z);
  };

  const exit = () => {
    ro?.disconnect();
    ro = null;
    if (game) {
      game.destroy(true);
      game = null;
    }
    parent?.remove();
    parent = null;
    paused = false;
  };

  const api: TownGame = {
    get running() {
      return !!game;
    },
    get paused() {
      return paused;
    },
    start() {
      if (game) return api.resume();
      const { z, w, h } = measure();
      parent = document.createElement('div');
      Object.assign(parent.style, { position: 'absolute', inset: '0', overflow: 'hidden', lineHeight: '0' });
      host.appendChild(parent);
      const session: Session = {
        onExit: () => {
          // defer so we're not destroying the game from inside its own update loop
          setTimeout(() => {
            exit();
            opts.onExit?.();
          }, 0);
        },
        onReady: () => opts.onReady?.(),
        start: { map: 'town', ...TOWN.spawn },
      };
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: w,
        height: h,
        zoom: z,
        pixelArt: true,
        roundPixels: true,
        antialias: false,
        backgroundColor: '#000000',
        banner: false,
        audio: { noAudio: true },
        disableContextMenu: true,
        scale: { mode: Phaser.Scale.NONE },
        input: { keyboard: { target: host }, mouse: { preventDefaultWheel: false }, touch: { capture: false } },
        fps: { target: 60, smoothStep: true },
        callbacks: { preBoot: (g) => g.registry.set('session', session) },
        scene: [BootScene, WorldScene, UIScene],
      });
      if (import.meta.env.DEV) (window as unknown as { __town?: Phaser.Game }).__town = game;
      ro = new ResizeObserver(() => resize());
      ro.observe(host);
      paused = false;
      api.focus();
    },
    pause() {
      if (!game || paused) return;
      paused = true;
      (game.registry.get('session') as Session).controls?.releaseAll();
      game.pause();
    },
    resume() {
      if (!game || !paused) return;
      paused = false;
      game.resume();
      api.focus();
    },
    exit,
    setVirtualButton(b, down) {
      (game?.registry.get('session') as Session | undefined)?.controls?.setVirtual(b, down);
    },
    resize,
    focus() {
      host.focus({ preventScroll: true });
    },
  };
  return api;
}
