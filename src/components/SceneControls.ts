import { Container, Graphics, BitmapText } from 'pixi.js';
import { Colors } from '../utils/Colors';
import { GameManager } from '../GameManager';
import { PhoenixFlameScene } from '../scenes/PhoenixFlameScene';
import { AceOfShadowsScene } from '../scenes/AceOfShadowsScene';
import { MagicWordsScene } from '../scenes/MagicWordsScene';

export class SceneControls {
  public container: Container;
  private gameManager: GameManager;
  private background: Graphics;
  private currentSceneText!: BitmapText;
  private fullscreenButton: Container;
  private debugToggleButton: Container;
  private phoenixFlameButton: Container;
  private aceOfShadowsButton: Container;
  private magicWordsButton: Container;

  private readonly POS_Y = 140;
  private readonly POS_X = 10;

  private readonly PADDING_X = 10;
  private readonly BUTTON_WIDTH = 100;
  private readonly BUTTON_HEIGHT = 30;

  constructor(gameManager: GameManager) {
    this.gameManager = gameManager;
    this.container = new Container();
    this.background = new Graphics();
    this.fullscreenButton = new Container();
    this.debugToggleButton = new Container();
    this.phoenixFlameButton = new Container();
    this.aceOfShadowsButton = new Container();
    this.magicWordsButton = new Container();
  }

  init(): void {
    this.setupBackground();
    this.setupCurrentSceneText();
    this.setupSceneButtons();
    this.setupFullscreenButton();
    this.setupDebugToggleButton();
    this.setupLayout();
  }

  private setupBackground(): void {
    this.background.beginFill(0x000000, 0.7);
    this.background.lineStyle(1, Colors.BLUE, 1);
    this.background.drawRoundedRect(0, 0, 340, 160, 5);
    this.background.endFill();
    this.container.addChild(this.background);
  }

  private setupCurrentSceneText(): void {
    this.currentSceneText = new BitmapText('Current: Demo', {
      fontName: 'MonospaceBold',
      fontSize: 16,
    });

    this.currentSceneText.tint = Colors.WHITE;
    this.container.addChild(this.currentSceneText);
  }

  private setupSceneButtons(): void {
    this.createSceneButton(this.aceOfShadowsButton, 'Ace of Shadows', () => {
      this.gameManager.switchToScene(new AceOfShadowsScene());
    });

    this.createSceneButton(this.magicWordsButton, 'Magic Words', () => {
      this.gameManager.switchToScene(new MagicWordsScene());
    });

    this.createSceneButton(this.phoenixFlameButton, 'Phoenix Flame', () => {
      this.gameManager.switchToScene(new PhoenixFlameScene());
    });

    this.container.addChild(this.phoenixFlameButton);
    this.container.addChild(this.aceOfShadowsButton);
    this.container.addChild(this.magicWordsButton);
  }

  private createSceneButton(buttonContainer: Container, text: string, onClick: () => void): void {
    const buttonBg = new Graphics();
    buttonBg.beginFill(Colors.DARK_GRAY);
    buttonBg.lineStyle(1, Colors.YELLOW);
    buttonBg.drawRoundedRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 3);
    buttonBg.endFill();

    const buttonText = new BitmapText(text, { fontName: 'MonospaceBold', fontSize: 12 });
    buttonText.tint = Colors.YELLOW;
    buttonText.position.set(
      (this.BUTTON_WIDTH - buttonText.width) / 2,
      (this.BUTTON_HEIGHT - buttonText.height) / 2
    );

    buttonContainer.addChild(buttonBg);
    buttonContainer.addChild(buttonText);

    buttonContainer.eventMode = 'static';
    buttonContainer.cursor = 'pointer';

    buttonContainer.on('pointerdown', onClick);
    buttonContainer.on('click', onClick);

    buttonContainer.on('pointerover', () => {
      buttonBg.tint = 0xcccccc;
    });

    buttonContainer.on('pointerout', () => {
      buttonBg.tint = 0xffffff;
    });

    buttonContainer.on('touchstart', () => {
      buttonBg.tint = 0xcccccc;
    });

    buttonContainer.on('touchend', () => {
      buttonBg.tint = 0xffffff;
    });
  }

  private setupFullscreenButton(): void {
    const buttonBg = new Graphics();
    buttonBg.beginFill(Colors.DARK_GRAY);
    buttonBg.lineStyle(1, Colors.WHITE);
    buttonBg.drawRoundedRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 3);
    buttonBg.endFill();

    const buttonText = new BitmapText('Fullscreen', { fontName: 'MonospaceBold', fontSize: 14 });
    buttonText.tint = Colors.WHITE;
    buttonText.position.set(
      (this.BUTTON_WIDTH - buttonText.width) / 2,
      (this.BUTTON_HEIGHT - buttonText.height) / 2
    );

    this.fullscreenButton.addChild(buttonBg);
    this.fullscreenButton.addChild(buttonText);

    this.fullscreenButton.eventMode = 'static';
    this.fullscreenButton.cursor = 'pointer';

    const fullscreenHandler = () => {
      this.gameManager.toggleFullscreen();
    };

    this.fullscreenButton.on('pointerdown', fullscreenHandler);
    this.fullscreenButton.on('click', fullscreenHandler);

    this.fullscreenButton.on('pointerover', () => {
      buttonBg.tint = 0xcccccc;
    });

    this.fullscreenButton.on('pointerout', () => {
      buttonBg.tint = 0xffffff;
    });

    this.fullscreenButton.on('touchstart', () => {
      buttonBg.tint = 0xcccccc;
    });

    this.fullscreenButton.on('touchend', () => {
      buttonBg.tint = 0xffffff;
    });

    this.container.addChild(this.fullscreenButton);
  }

  private setupDebugToggleButton(): void {
    const buttonBg = new Graphics();
    buttonBg.beginFill(Colors.DARK_GRAY);
    buttonBg.lineStyle(1, Colors.DEBUG_GREEN);
    buttonBg.drawRoundedRect(0, 0, this.BUTTON_WIDTH, this.BUTTON_HEIGHT, 3);
    buttonBg.endFill();

    const buttonText = new BitmapText('Debug: ON', { fontName: 'MonospaceBold', fontSize: 14 });
    buttonText.tint = Colors.DEBUG_GREEN;
    buttonText.position.set(
      (this.BUTTON_WIDTH - buttonText.width) / 2,
      (this.BUTTON_HEIGHT - buttonText.height) / 2
    );

    this.debugToggleButton.addChild(buttonBg);
    this.debugToggleButton.addChild(buttonText);

    this.debugToggleButton.eventMode = 'static';
    this.debugToggleButton.cursor = 'pointer';

    const debugToggleHandler = () => {
      this.gameManager.toggleDebugMode();
      const newText = this.gameManager.debugMode ? 'Debug: ON' : 'Debug: OFF';
      buttonText.text = newText;
      buttonText.tint = this.gameManager.debugMode ? Colors.DEBUG_GREEN : Colors.RED;
      buttonText.position.set(
        (this.BUTTON_WIDTH - buttonText.width) / 2,
        (this.BUTTON_HEIGHT - buttonText.height) / 2
      );
    };

    this.debugToggleButton.on('pointerdown', debugToggleHandler);
    this.debugToggleButton.on('click', debugToggleHandler);

    this.debugToggleButton.on('pointerover', () => {
      buttonBg.tint = 0xcccccc;
    });

    this.debugToggleButton.on('pointerout', () => {
      buttonBg.tint = 0xffffff;
    });

    this.debugToggleButton.on('touchstart', () => {
      buttonBg.tint = 0xcccccc;
    });

    this.debugToggleButton.on('touchend', () => {
      buttonBg.tint = 0xffffff;
    });

    this.container.addChild(this.debugToggleButton);
  }

  private setupLayout(): void {
    this.container.position.set(this.POS_X, this.POS_Y);
    this.currentSceneText.position.set(this.PADDING_X, 10);

    this.aceOfShadowsButton.position.set(this.PADDING_X, 40);
    this.magicWordsButton.position.set(this.PADDING_X + this.BUTTON_WIDTH + 5, 40);
    this.phoenixFlameButton.position.set(this.PADDING_X + (this.BUTTON_WIDTH + 5) * 2, 40);

    this.fullscreenButton.position.set(this.PADDING_X, 90);
    this.debugToggleButton.position.set(this.PADDING_X + this.BUTTON_WIDTH + 5, 90);
  }

  updateCurrentScene(sceneName: string): void {
    this.currentSceneText.text = `Current: ${sceneName}`;
  }
}
