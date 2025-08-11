import { Application, Ticker, Container } from 'pixi.js';
import { Scene, GameConfig, GameApplication, DebugInfo } from './types';
import { DebugMenu } from './components/DebugMenu';
import { SceneControls } from './components/SceneControls';
import { AssetLoader } from './utils/AssetLoader';
import { AceOfShadowsScene } from './scenes/AceOfShadowsScene';

export class GameManager {
  private app: Application;
  private config: GameConfig;
  private currentScene: Scene | null = null;
  private debugMenu: DebugMenu;
  private sceneControls: SceneControls;
  private assetLoader: AssetLoader;

  public debugMode = true;

  constructor(app: Application, config: GameConfig) {
    this.app = app;
    this.config = config;
    this.assetLoader = new AssetLoader();
    this.debugMenu = new DebugMenu();
    this.sceneControls = new SceneControls(this);

    (this.app as GameApplication).currentScene = null;
    (this.app as GameApplication).debugMode = this.debugMode;
  }

  async init(): Promise<void> {
    try {
      await this.assetLoader.loadInitialAssets();
      this.setupUI();
      this.setupGameLoop();

      this.switchToScene(new AceOfShadowsScene());
    } catch (error) {
      console.error('GameManager initialization failed:', error);
      throw error;
    }
  }

  private setupUI(): void {
    this.app.stage.addChild(this.debugMenu.container);
    this.app.stage.addChild(this.sceneControls.container);

    this.debugMenu.init();
    this.sceneControls.init();
  }

  private setupGameLoop(): void {
    this.app.ticker.add(() => {
      if (this.currentScene) {
        this.currentScene.update(this.app.ticker.deltaMS);
      }

      if (this.debugMode) {
        this.updateDebugInfo(this.app.ticker);
      }
    });
  }

  private updateDebugInfo(ticker: Ticker): void {
    const debugInfo: DebugInfo = {
      fps: Math.round(ticker.FPS * 10) / 10,
      sceneName: this.currentScene?.name ?? 'No Scene',
      spriteCount: this.getSpriteCount(),
    };

    this.debugMenu.updateDebugInfo(debugInfo);
  }

  private getSpriteCount(): number {
    if (!this.currentScene) {
      return 0;
    }

    let count = 0;
    const countSprites = (container: Container): void => {
      for (const child of container.children) {
        if ('texture' in child && child.texture) {
          count++;
        }
        if (child instanceof Container && child.children.length > 0) {
          countSprites(child as Container);
        }
      }
    };

    countSprites(this.currentScene.container);
    return count;
  }

  switchToScene(newScene: Scene): void {
    try {
      if (this.currentScene) {
        this.app.stage.removeChild(this.currentScene.container);
        this.currentScene.destroy();
      }

      this.currentScene = newScene;
      (this.app as GameApplication).currentScene = newScene;

      this.app.stage.addChildAt(newScene.container, 0);
      newScene.init();
      newScene.resize(this.app.screen.width, this.app.screen.height);

      this.sceneControls.updateCurrentScene(newScene.name);
    } catch (error) {
      console.error('Failed to switch scene:', error);
      throw error;
    }
  }

  handleResize(): void {
    const canvas = this.app.view as HTMLCanvasElement;
    const container = canvas.parentElement;

    if (!container) {
      return;
    }

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    canvas.style.transform = '';
    canvas.style.transformOrigin = '';

    // Fixed height approach - maintain the design height and calculate virtual width
    const designHeight = this.config.height;
    const aspectRatio = containerWidth / containerHeight;
    const virtualWidth = Math.ceil(designHeight * aspectRatio);

    this.app.renderer.resize(virtualWidth, designHeight);

    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    if (this.currentScene) {
      this.currentScene.resize(virtualWidth, designHeight);
    }
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err: unknown) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      void document.exitFullscreen();
    }
  }

  toggleDebugMode(): void {
    this.debugMode = !this.debugMode;
    (this.app as GameApplication).debugMode = this.debugMode;
    this.debugMenu.setVisible(this.debugMode);
  }
}
