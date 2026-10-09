import Phaser from 'phaser';
import { ASSETS } from '../assets';
import { FRAME_W, FRAME_H } from '../constants';
import { PREFABS, PrefabKey } from '../world/prefabs';
import { getSession } from '../session';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 50, height / 2, 0, 4, 0xf8f8f8).setOrigin(0, 0.5);
    this.add.rectangle(width / 2, height / 2, 104, 8).setStrokeStyle(1, 0xf8f8f8);
    this.load.on('progress', (p: number) => bar.setSize(100 * p, 4));

    for (const [id, m] of Object.entries(ASSETS.maps)) {
      this.load.image(`${id}_ground`, m.ground);
      this.load.image(`${id}_overlay`, m.overlay);
    }
    this.load.atlas('sprites', ASSETS.sprites.png, ASSETS.sprites.json);
    this.load.spritesheet('chars', ASSETS.chars.png, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    this.load.spritesheet('water', ASSETS.water, { frameWidth: 32, frameHeight: 32 });
    this.load.bitmapFont('font', ASSETS.font.png, ASSETS.font.xml);
  }

  create() {
    // Split the water strip into standalone textures so a TileSprite can swap them.
    const src = this.textures.get('water').getSourceImage() as HTMLImageElement;
    for (let i = 0; i < 4; i++) {
      const ct = this.textures.createCanvas(`water_${i}`, 32, 32)!;
      ct.context.drawImage(src, i * 32, 0, 32, 32, 0, 0, 32, 32);
      ct.refresh();
    }
    for (const k of Object.keys(PREFABS) as PrefabKey[]) {
      const d = PREFABS[k];
      if (!('animated' in d) || !d.animated) continue;
      this.anims.create({
        key: `anim_${k}`,
        frames: Array.from({ length: d.animated.frames }, (_, i) => ({ key: 'sprites', frame: `${k}_${i}` })),
        frameRate: d.animated.fps,
        repeat: -1,
      });
    }
    for (const [key, frames, rate] of [
      ['duck0_l', [0, 1], 2], ['duck0_r', [2, 3], 2], ['duck1_l', [0, 1], 2], ['duck1_r', [2, 3], 2],
      ['pigeon_peck', [0, 1, 0, 0], 3], ['pigeon_fly', [2, 3], 10],
    ] as const) {
      const base = key.split('_')[0];
      this.anims.create({ key, frames: frames.map((f) => ({ key: 'sprites', frame: `${base}_${f}` })), frameRate: rate, repeat: -1 });
    }
    const s = getSession(this);
    this.scene.launch('ui');
    this.scene.start('world', { ...s.start, fade: true });
    s.onReady();
  }
}
