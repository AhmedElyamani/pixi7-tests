import { Container, BitmapText, Sprite, Texture } from 'pixi.js';

interface TextSegment {
  type: 'text' | 'emoji';
  content: string;
  x: number;
  y: number;
  width: number;
}

export class TextWithInlineImages extends Container {
  private static readonly EMOJI_SIZE = 24;
  private static readonly LINE_HEIGHT = 32;
  private static readonly MAX_WIDTH = 600;

  private textSegments: TextSegment[] = [];
  private emojiTextures = new Map<string, Texture>();
  private displayObjects: (BitmapText | Sprite)[] = [];
  private spaceWidth: number;

  constructor(
    private text: string,
    emojiTextures: Map<string, Texture>,
    private fontName = 'MonospaceBold',
    private fontSize = 20,
    private maxWidth: number = TextWithInlineImages.MAX_WIDTH
  ) {
    super();

    this.emojiTextures = emojiTextures;
    this.spaceWidth = this.measureTextWidth('  ');

    this.parseAndLayoutText();
    this.createDisplayObjects();
  }

  private parseAndLayoutText(): void {
    this.textSegments = [];

    const tokenRegex = /\{([^}]+)\}/g;
    const parts: { type: 'text' | 'emoji'; content: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(this.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: this.text.slice(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'emoji',
        content: match[1] ?? '',
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < this.text.length) {
      parts.push({
        type: 'text',
        content: this.text.slice(lastIndex),
      });
    }

    this.layoutParts(parts);
  }

  private layoutParts(parts: { type: 'text' | 'emoji'; content: string }[]): void {
    let currentX = 0;
    let currentY = 0;
    const lineHeight = TextWithInlineImages.LINE_HEIGHT;

    for (const part of parts) {
      if (part.type === 'text' && part.content) {
        const words = part.content.split(' ');

        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (!word) {
            continue;
          }

          const wordWithSpace = i < words.length - 1 ? word + ' ' : word;
          const wordWidth = this.measureTextWidth(wordWithSpace);

          if (currentX + wordWidth > this.maxWidth && currentX > 0) {
            currentX = 0;
            currentY += lineHeight;
          }

          this.textSegments.push({
            type: 'text',
            content: wordWithSpace,
            x: currentX,
            y: currentY,
            width: wordWidth,
          });

          currentX += wordWidth + this.spaceWidth;
        }
      } else if (part.type === 'emoji') {
        const emojiSize = TextWithInlineImages.EMOJI_SIZE;

        if (currentX + emojiSize > this.maxWidth && currentX > 0) {
          currentX = 0;
          currentY += lineHeight;
        }

        this.textSegments.push({
          type: 'emoji',
          content: part.content,
          x: currentX,
          y: currentY,
          width: emojiSize,
        });

        currentX += emojiSize + this.spaceWidth;
      }
    }
  }

  private measureTextWidth(text: string): number {
    const tempText = new BitmapText(text, {
      fontName: this.fontName,
      fontSize: this.fontSize,
    });

    const width = tempText.width;
    tempText.destroy();
    return width;
  }

  private createDisplayObjects(): void {
    this.clearDisplayObjects();

    for (const segment of this.textSegments) {
      if (segment.type === 'text') {
        const textObj = new BitmapText(segment.content, {
          fontName: this.fontName,
          fontSize: this.fontSize,
        });

        textObj.x = segment.x;
        textObj.y = segment.y;

        this.addChild(textObj);
        this.displayObjects.push(textObj);
      } else {
        const texture = this.emojiTextures.get(segment.content);
        if (texture) {
          const sprite = new Sprite(texture);
          sprite.x = segment.x;
          sprite.y = segment.y;
          sprite.width = TextWithInlineImages.EMOJI_SIZE;
          sprite.height = TextWithInlineImages.EMOJI_SIZE;

          this.addChild(sprite);
          this.displayObjects.push(sprite);
        }
      }
    }
  }

  private clearDisplayObjects(): void {
    for (const obj of this.displayObjects) {
      this.removeChild(obj);
      obj.destroy();
    }
    this.displayObjects = [];
  }

  public updateText(newText: string): void {
    this.text = newText;
    this.parseAndLayoutText();
    this.createDisplayObjects();
  }

  public updateMaxWidth(newMaxWidth: number): void {
    this.maxWidth = newMaxWidth;
    this.parseAndLayoutText();
    this.createDisplayObjects();
  }

  public getContentHeight(): number {
    if (this.textSegments.length === 0) {
      return 0;
    }

    const maxY = Math.max(...this.textSegments.map(s => s.y));
    return maxY + TextWithInlineImages.LINE_HEIGHT;
  }

  public override destroy(): void {
    this.clearDisplayObjects();
    super.destroy({ children: true });
  }
}
