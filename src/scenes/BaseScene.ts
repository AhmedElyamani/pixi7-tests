import { Container, Sprite } from 'pixi.js';
import { Scene } from '../types';

export abstract class BaseScene implements Scene {
  public readonly container: Container;
  public abstract readonly name: string;

  protected screenWidth = 0;
  protected screenHeight = 0;
  protected initialized = false;

  constructor() {
    this.container = new Container();
  }

  abstract init(): void;

  abstract update(deltaTime: number): void;

  resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    if (this.initialized) {
      this.onResize(width, height);
    }
  }

  protected onResize(_width: number, _height: number): void {}

  destroy(): void {
    this.container.removeChildren();
    this.container.destroy({ children: true, texture: false, baseTexture: false });
    this.initialized = false;
  }

  protected centerObject(sprite: Sprite): void {
    sprite.x = this.screenWidth / 2;
    sprite.y = this.screenHeight / 2;
    sprite.anchor.set(0.5);
  }
}
