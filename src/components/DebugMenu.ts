import { Container, Graphics, BitmapText } from 'pixi.js';
import { DebugInfo } from '../types';
import { Colors } from '../utils/Colors';

export class DebugMenu {
  public container: Container;
  private background: Graphics;
  private fpsText!: BitmapText;
  private spriteText!: BitmapText;

  private readonly POS_X = 10;
  private readonly POS_Y = 40;
  private readonly PADDING = 10;
  private readonly LINE_HEIGHT = 18;
  private readonly FONT_SIZE = 16;

  constructor() {
    this.container = new Container();
    this.background = new Graphics();
  }

  init(): void {
    this.setupBackground();
    this.setupTexts();
    this.setupLayout();
  }

  private setupBackground(): void {
    this.background.beginFill(0x000000, 0.7);
    this.background.lineStyle(1, Colors.DEBUG_GREEN, 1);
    this.background.drawRoundedRect(0, 0, 200, 3 * this.LINE_HEIGHT + 2 * this.PADDING, 5);
    this.background.endFill();
    this.container.addChild(this.background);
  }

  private setupTexts(): void {
    this.fpsText = new BitmapText('FPS: 0', {
      fontName: 'MonospaceBold',
      fontSize: this.FONT_SIZE,
    });
    this.spriteText = new BitmapText('Sprites: 0', {
      fontName: 'MonospaceBold',
      fontSize: this.FONT_SIZE,
    });

    this.fpsText.tint = Colors.DEBUG_GREEN;
    this.spriteText.tint = Colors.DEBUG_YELLOW;

    this.container.addChild(this.fpsText);
    this.container.addChild(this.spriteText);
  }

  private setupLayout(): void {
    this.container.position.set(this.POS_X, this.POS_Y);
    this.fpsText.position.set(this.PADDING, this.PADDING);
    this.spriteText.position.set(this.PADDING, this.PADDING + 2 * this.LINE_HEIGHT);
  }

  updateDebugInfo(debugInfo: DebugInfo): void {
    this.fpsText.text = `FPS: ${debugInfo.fps.toString()}`;
    this.spriteText.text = `Sprites: ${debugInfo.spriteCount.toString()}`;

    // Update FPS color based on performance
    if (debugInfo.fps >= 55) {
      this.fpsText.tint = Colors.DEBUG_GREEN;
    } else if (debugInfo.fps >= 30) {
      this.fpsText.tint = Colors.DEBUG_YELLOW;
    } else {
      this.fpsText.tint = Colors.RED;
    }
  }

  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }
}
