/**
 * Screen-space UI: DS-style dialogue box (typewriter text, blinking ▼), location
 * banner, fades and a tiny pause menu. Owns the shared Controls instance.
 */
import Phaser from 'phaser';
import { Controls } from '../input';
import { getSession } from '../session';

const TEXT = 0x505058;
const SHADOW = 0xd0d0c8;
const LINE_H = 14;
const CHARS_PER_SEC = 55;

export class UIScene extends Phaser.Scene {
  controls!: Controls;
  private box!: Phaser.GameObjects.Container;
  private frame!: Phaser.GameObjects.NineSlice;
  private lines: Phaser.GameObjects.BitmapText[] = [];
  private shadows: Phaser.GameObjects.BitmapText[] = [];
  private arrow!: Phaser.GameObjects.Image;
  private pages: string[][] = [];
  private page = 0;
  private shown = 0;
  private onDone?: () => void;
  private fader!: Phaser.GameObjects.Rectangle;
  private banner?: Phaser.GameObjects.Container;
  private menu?: Phaser.GameObjects.Container;
  private menuIdx = 0;
  private menuCursor?: Phaser.GameObjects.Image;
  private fading = false;
  private boxW = 0;

  constructor() {
    super('ui');
  }

  get dialogOpen() {
    return this.box?.visible ?? false;
  }
  get busy() {
    return this.dialogOpen || this.fading || !!this.menu;
  }
  get menuOpen() {
    return !!this.menu;
  }

  create() {
    this.controls = new Controls(this);
    getSession(this).controls = this.controls;

    this.frame = this.add.nineslice(0, 0, 'sprites', 'ui_frame', 100, 48, 8, 8, 8, 8).setOrigin(0, 0);
    this.arrow = this.add.image(0, 0, 'sprites', 'ui_arrow_0').setOrigin(0, 0);
    this.box = this.add.container(0, 0, [this.frame]);
    for (let i = 0; i < 2; i++) {
      const sh = this.add.bitmapText(0, 0, 'font', '').setTint(SHADOW);
      const tx = this.add.bitmapText(0, 0, 'font', '').setTint(TEXT);
      this.shadows.push(sh);
      this.lines.push(tx);
      this.box.add([sh, tx]);
    }
    this.box.add(this.arrow);
    this.box.setVisible(false).setDepth(10);

    this.fader = this.add.rectangle(0, 0, 10, 10, 0x000000).setOrigin(0, 0).setDepth(100).setAlpha(0);
    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.layout, this));

    this.time.addEvent({
      delay: 280,
      loop: true,
      callback: () => this.arrow.setFrame(this.arrow.frame.name === 'ui_arrow_0' ? 'ui_arrow_1' : 'ui_arrow_0'),
    });
  }

  private layout() {
    const { width, height } = this.scale;
    this.boxW = Math.min(width - 8, 360);
    const h = 48;
    this.frame.setSize(this.boxW, h);
    this.box.setPosition(Math.floor((width - this.boxW) / 2), height - h - 4);
    this.lines.forEach((t, i) => t.setPosition(12, 10 + i * LINE_H));
    this.shadows.forEach((t, i) => t.setPosition(13, 11 + i * LINE_H));
    this.arrow.setPosition(this.boxW - 18, h - 14);
    this.fader.setSize(width, height);
    if (this.menu) this.menu.setPosition(width - 84, 30);
  }

  // ───────── dialogue ─────────
  say(paragraphs: string[], onDone?: () => void) {
    const maxW = this.boxW - 26;
    const all: string[] = [];
    for (const p of paragraphs) {
      const wrapped = this.wrap(p, maxW);
      // each paragraph starts on a fresh page
      if (all.length % 2 === 1) all.push('');
      all.push(...wrapped);
    }
    this.pages = [];
    for (let i = 0; i < all.length; i += 2) this.pages.push([all[i], all[i + 1] ?? '']);
    this.page = 0;
    this.shown = 0;
    this.onDone = onDone;
    this.box.setVisible(true);
    this.renderPage();
    this.controls.flush();
  }

  private wrap(text: string, maxW: number): string[] {
    const font = this.cache.bitmapFont.get('font').data as { chars: Record<number, { xAdvance: number }> };
    const width = (s: string) => [...s].reduce((w, ch) => w + (font.chars[ch.codePointAt(0)!]?.xAdvance ?? 4), 0);
    const words = text.split(' ');
    const out: string[] = [];
    let line = '';
    for (const w of words) {
      const t = line ? `${line} ${w}` : w;
      if (width(t) > maxW && line) {
        out.push(line);
        line = w;
      } else line = t;
    }
    if (line) out.push(line);
    return out;
  }

  private renderPage() {
    const [a, b] = this.pages[this.page];
    const n = Math.floor(this.shown);
    const sa = a.slice(0, Math.min(n, a.length));
    const sb = n > a.length ? b.slice(0, n - a.length) : '';
    this.lines[0].setText(sa);
    this.shadows[0].setText(sa);
    this.lines[1].setText(sb);
    this.shadows[1].setText(sb);
    this.arrow.setVisible(this.pageDone());
  }
  private pageDone() {
    const [a, b] = this.pages[this.page];
    return this.shown >= a.length + b.length;
  }

  private advance() {
    if (!this.pageDone()) {
      const [a, b] = this.pages[this.page];
      this.shown = a.length + b.length;
      this.renderPage();
      return;
    }
    if (this.page < this.pages.length - 1) {
      this.page++;
      this.shown = 0;
      this.renderPage();
      return;
    }
    this.box.setVisible(false);
    this.controls.flush();
    const cb = this.onDone;
    this.onDone = undefined;
    cb?.();
  }

  // ───────── banner ─────────
  showBanner(name: string) {
    this.banner?.destroy();
    const font = this.add.bitmapText(0, 0, 'font', name).setTint(0x4a2c18);
    const w = Math.max(80, font.width + 24);
    const bg = this.add.nineslice(0, 0, 'sprites', 'ui_frame_sign', w, 26, 8, 8, 8, 8).setOrigin(0, 0);
    font.setPosition(12, 8);
    const sh = this.add.bitmapText(13, 9, 'font', name).setTint(0xd8c8a0);
    const c = this.add.container(6, -30, [bg, sh, font]).setDepth(20);
    this.banner = c;
    this.tweens.add({
      targets: c,
      y: 6,
      duration: 260,
      ease: 'Quad.easeOut',
      onComplete: () =>
        this.tweens.add({ targets: c, y: -30, delay: 2000, duration: 260, ease: 'Quad.easeIn', onComplete: () => c.destroy() }),
    });
  }

  // ───────── fades ─────────
  fade(toBlack: boolean, ms: number, cb?: () => void) {
    this.fading = true;
    this.tweens.killTweensOf(this.fader);
    this.fader.setAlpha(toBlack ? 0 : 1);
    this.tweens.add({
      targets: this.fader,
      alpha: toBlack ? 1 : 0,
      duration: ms,
      onComplete: () => {
        this.fading = toBlack; // stay "busy" while black, until the fade-in
        cb?.();
      },
    });
  }

  // ───────── pause menu ─────────
  openMenu() {
    if (this.menu) return;
    const { width } = this.scale;
    const items = ['RESUME', 'EXIT'];
    const bg = this.add.nineslice(0, 0, 'sprites', 'ui_frame', 78, 16 + items.length * 14, 8, 8, 8, 8).setOrigin(0, 0);
    const texts = items.flatMap((t, i) => [
      this.add.bitmapText(19, 10 + i * 14, 'font', t).setTint(SHADOW),
      this.add.bitmapText(18, 9 + i * 14, 'font', t).setTint(TEXT),
    ]);
    this.menuCursor = this.add.image(8, 9, 'sprites', 'ui_cursor').setOrigin(0, 0);
    this.menuIdx = 0;
    this.menu = this.add.container(width - 84, 30, [bg, ...texts, this.menuCursor]).setDepth(30);
    this.controls.flush();
    this.scene.pause('world');
  }
  closeMenu() {
    this.menu?.destroy();
    this.menu = undefined;
    this.controls.flush();
    this.scene.resume('world');
  }

  update(_t: number, dt: number) {
    const c = this.controls;
    if (this.menu) {
      if (c.justPressed('up') || c.justPressed('down')) {
        this.menuIdx ^= 1;
        this.menuCursor!.setY(9 + this.menuIdx * 14);
      }
      if (c.justPressed('b') || c.justPressed('start')) this.closeMenu();
      else if (c.justPressed('a')) {
        const exit = this.menuIdx === 1;
        this.closeMenu();
        if (exit) getSession(this).onExit();
      }
      return;
    }
    if (this.dialogOpen) {
      if (!this.pageDone()) {
        const speed = c.isDown('a') || c.isDown('b') ? 3 : 1;
        this.shown += (dt / 1000) * CHARS_PER_SEC * speed;
        this.renderPage();
      }
      if (c.justPressed('a') || c.justPressed('b')) {
        if (this.pageDone()) this.advance();
      }
      return;
    }
    if (!this.fading && c.justPressed('start')) this.openMenu();
  }
}
