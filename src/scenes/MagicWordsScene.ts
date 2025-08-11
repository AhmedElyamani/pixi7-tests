import { BitmapText, Container, Rectangle } from 'pixi.js';
import { BaseScene } from './BaseScene';
import { DialogueComponent } from '../components/DialogueComponent';
import { MagicWordsData } from '../types';
import { Colors } from '../utils/Colors';
import { AssetLoader } from '../utils/AssetLoader';

export class MagicWordsScene extends BaseScene {
  public readonly name = 'Magic Words';

  private titleText!: BitmapText;
  private dialogueComponent: DialogueComponent | null = null;
  private instructionText!: BitmapText;
  private progressText!: BitmapText;
  private clickArea: Container;

  private magicWordsData: MagicWordsData | null = null;
  private hasError = false;

  constructor() {
    super();

    this.clickArea = new Container();
    this.setupClickArea();
  }

  private setupClickArea(): void {
    this.clickArea.hitArea = new Rectangle(0, 0, 100, 100);
    this.clickArea.eventMode = 'static';
    this.clickArea.cursor = 'pointer';
    this.clickArea.on('pointertap', this.onScreenClick.bind(this));
  }

  init(): void {
    this.createBitmapTexts();
    this.setupTitle();

    try {
      this.magicWordsData = AssetLoader.getMagicWordsData();
      if (!this.magicWordsData) {
        throw new Error('Magic Words data not loaded by AssetLoader');
      }

      this.createDialogueComponent();
      this.setupUI();
    } catch (error) {
      this.handleLoadError(error);
    }

    this.initialized = true;
  }

  private createBitmapTexts(): void {
    this.titleText = new BitmapText('Magic Words', {
      fontName: 'MonospaceBold',
      fontSize: 28,
    });

    this.instructionText = new BitmapText('Click anywhere to continue dialogue', {
      fontName: 'MonospaceBold',
      fontSize: 16,
    });

    this.progressText = new BitmapText('', {
      fontName: 'MonospaceBold',
      fontSize: 14,
    });
  }

  private setupTitle(): void {
    this.titleText.tint = Colors.WHITE;
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = this.screenWidth / 2;
    this.titleText.y = 40;
    this.container.addChild(this.titleText);
  }

  private createDialogueComponent(): void {
    if (!this.magicWordsData) {
      return;
    }

    const emojiTextures = AssetLoader.getAllEmojiTextures();
    const avatarTextures = AssetLoader.getAllAvatarTextures();

    this.dialogueComponent = new DialogueComponent(
      this.magicWordsData.dialogue,
      emojiTextures,
      avatarTextures
    );

    this.dialogueComponent.resize(this.screenWidth, this.screenHeight);
    this.container.addChild(this.dialogueComponent);
  }

  private setupUI(): void {
    this.instructionText.tint = Colors.WHITE;
    this.instructionText.anchor.set(0.5);
    this.instructionText.x = this.screenWidth / 2;
    this.instructionText.y = 80;
    this.container.addChild(this.instructionText);

    this.progressText.tint = Colors.WHITE;
    this.progressText.anchor.set(0.5);
    this.progressText.x = this.screenWidth / 2;
    this.progressText.y = 110;
    this.container.addChild(this.progressText);

    this.container.addChild(this.clickArea);

    this.updateProgressText();
  }

  private handleLoadError(error: unknown): void {
    console.error('Failed to load Magic Words data:', error);
    this.hasError = true;

    const errorText = new BitmapText('Failed to load dialogue data.\nCheck console for details.', {
      fontName: 'MonospaceBold',
      fontSize: 16,
    });
    errorText.tint = Colors.WHITE;
    errorText.anchor.set(0.5);
    errorText.x = this.screenWidth / 2;
    errorText.y = this.screenHeight / 2;
    this.container.addChild(errorText);
  }

  private onScreenClick(): void {
    if (this.hasError || !this.dialogueComponent) {
      return;
    }

    const hasNext = this.dialogueComponent.nextDialogue();
    this.updateProgressText();

    if (!hasNext) {
      this.onDialogueComplete();
    }
  }

  private updateProgressText(): void {
    if (!this.dialogueComponent) {
      return;
    }

    const current = this.dialogueComponent.getCurrentDialogueIndex() + 1;
    const total = this.dialogueComponent.getTotalDialogues();
    this.progressText.text = `Dialogue ${current.toString()} / ${total.toString()}`;
  }

  private onDialogueComplete(): void {
    this.instructionText.text = 'All dialogues complete! Click to restart.';

    this.clickArea.removeAllListeners('pointertap');
    this.clickArea.on('pointertap', () => {
      if (this.dialogueComponent) {
        this.dialogueComponent.resetToStart();
        this.updateProgressText();
        this.instructionText.text = 'Click anywhere to continue dialogue';

        this.clickArea.removeAllListeners('pointertap');
        this.clickArea.on('pointertap', this.onScreenClick.bind(this));
      }
    });
  }

  update(_deltaTime: number): void {
    // No continuous updates needed for this scene
  }

  protected override onResize(width: number, height: number): void {
    this.titleText.x = width / 2;
    this.instructionText.x = width / 2;
    this.progressText.x = width / 2;

    if (this.dialogueComponent) {
      this.dialogueComponent.resize(width, height);
    }

    this.clickArea.hitArea = new Rectangle(0, 0, width, height);
  }

  public getSpriteCount(): number {
    let count = 3;

    if (this.dialogueComponent) {
      count += 10;
    }

    return count;
  }

  override destroy(): void {
    this.clickArea.removeAllListeners();

    if (this.dialogueComponent) {
      this.dialogueComponent.destroy();
    }

    super.destroy();
  }
}
