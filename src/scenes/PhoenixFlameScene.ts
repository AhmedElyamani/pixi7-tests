import { BitmapText } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { FireMetaBallSystem } from '@/components/FireMetaBallSystem';
import { Colors } from '../utils/Colors';

export class PhoenixFlameScene extends BaseScene {
  public readonly name = 'PhoenixFlame';

  private titleText: BitmapText;
  private animationTime = 0;
  private fireMetaBallSystem!: FireMetaBallSystem;

  constructor() {
    super();
    this.titleText = new BitmapText('Phoenix Flame', {
      fontName: 'MonospaceBold',
      fontSize: 28,
    });
  }

  init(): void {
    this.setupFire();
    this.setupTexts();
    this.initialized = true;
  }

  private setupTexts(): void {
    this.titleText.tint = Colors.WHITE;
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = this.screenWidth / 2;
    this.titleText.y = 40;

    this.container.addChild(this.titleText);
  }

  private setupFire(): void {
    this.fireMetaBallSystem = new FireMetaBallSystem({ max: 10, width: 400, height: 400 });
    this.fireMetaBallSystem.pivot.set(200, 0);

    this.container.addChild(this.fireMetaBallSystem);
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime * 0.02;
    this.fireMetaBallSystem.update(deltaTime / 1000);
  }

  protected override onResize(width: number, _: number): void {
    this.titleText.x = width / 2;

    this.fireMetaBallSystem.x = width / 2;
  }
}
