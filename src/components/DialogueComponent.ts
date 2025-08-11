import { Container, Sprite, Texture, Graphics, BitmapText } from 'pixi.js';
import { AvatarTexture, DialogueEntry } from '../types';
import { TextWithInlineImages } from './TextWithInlineImages';
import { Colors } from '../utils/Colors';
import { AssetLoader } from '../utils/AssetLoader';

export class DialogueComponent extends Container {
  private static readonly AVATAR_SIZE = 80;
  private static readonly DIALOGUE_BOX_HEIGHT = 120;
  private static readonly DIALOGUE_BOX_PADDING = 20;
  private static readonly AVATAR_MARGIN = 20;

  private dialogueEntries: DialogueEntry[] = [];
  private emojiTextures = new Map<string, Texture>();
  private avatarTextures = new Map<string, AvatarTexture>();

  private currentDialogueIndex = 0;
  private screenWidth = 0;
  private screenHeight = 0;

  private dialogueBox!: Graphics;
  private currentTextComponent: TextWithInlineImages | null = null;
  private currentAvatarSprite: Sprite | null = null;
  private currentAvatarName: BitmapText | null = null;
  private isReady = false;

  constructor(
    dialogueEntries: DialogueEntry[],
    emojiTextures: Map<string, Texture>,
    avatarTextures: Map<string, AvatarTexture>
  ) {
    super();

    this.dialogueEntries = dialogueEntries;
    this.emojiTextures = emojiTextures;
    this.avatarTextures = avatarTextures;

    this.createDialogueBox();
    this.isReady = true;
    this.displayCurrentDialogue();
  }

  private createDialogueBox(): void {
    this.dialogueBox = new Graphics();
    this.dialogueBox.beginFill(Colors.BLACK, 0.8);
    this.dialogueBox.lineStyle(2, Colors.WHITE, 1);
    this.dialogueBox.drawRoundedRect(0, 0, 100, 100, 10); // Will be resized later
    this.dialogueBox.endFill();
    this.addChild(this.dialogueBox);
  }

  private displayCurrentDialogue(): void {
    if (!this.isReady || this.currentDialogueIndex >= this.dialogueEntries.length) {
      return;
    }

    const currentEntry = this.dialogueEntries[this.currentDialogueIndex];
    if (!currentEntry) {
      return;
    }

    const characterName = currentEntry.name;

    this.clearCurrentDisplay();
    this.updateDialogueBox();
    this.displayAvatar(characterName);
    this.displayText(currentEntry.text, 'left');
  }

  private clearCurrentDisplay(): void {
    if (this.currentTextComponent) {
      this.removeChild(this.currentTextComponent);
      this.currentTextComponent.destroy();
      this.currentTextComponent = null;
    }

    if (this.currentAvatarSprite) {
      this.removeChild(this.currentAvatarSprite);
      this.currentAvatarSprite.destroy();
      this.currentAvatarSprite = null;
    }

    if (this.currentAvatarName) {
      this.removeChild(this.currentAvatarName);
      this.currentAvatarName.destroy();
      this.currentAvatarName = null;
    }
  }

  private getDialogueBoxWidth(): number {
    return this.screenWidth - 40;
  }

  private updateDialogueBox(): void {
    const boxWidth = this.getDialogueBoxWidth();
    const boxHeight = DialogueComponent.DIALOGUE_BOX_HEIGHT;
    const boxX = 20;
    const boxY = this.screenHeight - boxHeight - 20;

    this.dialogueBox.clear();
    this.dialogueBox.beginFill(Colors.BLACK, 0.8);
    this.dialogueBox.lineStyle(2, Colors.WHITE, 1);
    this.dialogueBox.drawRoundedRect(boxX, boxY, boxWidth, boxHeight, 10);
    this.dialogueBox.endFill();
  }

  private displayAvatar(characterName: string): void {
    const boxY = this.screenHeight - DialogueComponent.DIALOGUE_BOX_HEIGHT - 20;

    const avatarTexture = this.avatarTextures.get(characterName) ?? {
      texture: AssetLoader.getTexture('default_avatar'),
      position: 'left',
    };

    const avatarX =
      avatarTexture.position === 'left'
        ? DialogueComponent.AVATAR_MARGIN
        : this.getDialogueBoxWidth() -
          DialogueComponent.AVATAR_MARGIN -
          DialogueComponent.AVATAR_SIZE / 2;

    this.currentAvatarName = new BitmapText(characterName, {
      fontName: 'MonospaceBold',
      fontSize: 14,
    });
    this.currentAvatarName.tint = Colors.WHITE;
    this.currentAvatarName.anchor.set(0.5);
    this.currentAvatarName.x = avatarX + DialogueComponent.AVATAR_SIZE / 2;
    this.currentAvatarName.y = boxY - 10;
    this.addChild(this.currentAvatarName);

    this.currentAvatarSprite = new Sprite(avatarTexture.texture);
    this.currentAvatarSprite.width = DialogueComponent.AVATAR_SIZE;
    this.currentAvatarSprite.height = DialogueComponent.AVATAR_SIZE;

    // Default to left position
    this.currentAvatarSprite.x = avatarX;
    this.currentAvatarSprite.y = boxY - DialogueComponent.AVATAR_SIZE - 20;
    this.addChild(this.currentAvatarSprite);
  }

  private displayText(text: string, position: 'left' | 'right'): void {
    const boxWidth = this.screenWidth - 40;
    const textMaxWidth =
      boxWidth -
      2 * DialogueComponent.DIALOGUE_BOX_PADDING -
      DialogueComponent.AVATAR_SIZE -
      DialogueComponent.AVATAR_MARGIN;

    this.currentTextComponent = new TextWithInlineImages(
      text,
      this.emojiTextures,
      'MonospaceBold',
      18,
      textMaxWidth
    );

    const boxX = 20;
    const boxY = this.screenHeight - DialogueComponent.DIALOGUE_BOX_HEIGHT - 20;

    if (position === 'left') {
      this.currentTextComponent.x = boxX + DialogueComponent.DIALOGUE_BOX_PADDING;
    } else {
      this.currentTextComponent.x = boxX + DialogueComponent.DIALOGUE_BOX_PADDING;
    }

    this.currentTextComponent.y = boxY + DialogueComponent.DIALOGUE_BOX_PADDING;
    this.addChild(this.currentTextComponent);
  }

  public nextDialogue(): boolean {
    if (this.currentDialogueIndex < this.dialogueEntries.length - 1) {
      this.currentDialogueIndex++;
      this.displayCurrentDialogue();
      return true;
    }
    return false;
  }

  public previousDialogue(): boolean {
    if (this.currentDialogueIndex > 0) {
      this.currentDialogueIndex--;
      this.displayCurrentDialogue();
      return true;
    }
    return false;
  }

  public getCurrentDialogueIndex(): number {
    return this.currentDialogueIndex;
  }

  public getTotalDialogues(): number {
    return this.dialogueEntries.length;
  }

  public isAtEnd(): boolean {
    return this.currentDialogueIndex >= this.dialogueEntries.length - 1;
  }

  public isAtStart(): boolean {
    return this.currentDialogueIndex <= 0;
  }

  public resetToStart(): void {
    this.currentDialogueIndex = 0;
    this.displayCurrentDialogue();
  }

  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;

    if (this.isReady) {
      this.displayCurrentDialogue();
    }
  }

  public override destroy(): void {
    this.clearCurrentDisplay();
    super.destroy({ children: true });
  }
}
