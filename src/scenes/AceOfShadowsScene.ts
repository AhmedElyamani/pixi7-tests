import { BitmapText } from 'pixi.js';
import * as TWEEN from '@tweenjs/tween.js';
import { BaseScene } from './BaseScene';
import { PlayingCard } from '../components/PlayingCard';
import { Colors } from '../utils/Colors';

export class AceOfShadowsScene extends BaseScene {
  public readonly name = 'Ace of Shadows';

  private static readonly TOTAL_CARDS = 144;
  private static readonly CARD_OFFSET_X = 1;
  private static readonly CARD_OFFSET_Y = 2.7;
  private static readonly ANIMATION_INTERVAL = 1000;
  private static readonly ANIMATION_DURATION = 2000;
  private static readonly DEFAULT_SPEED_MULTIPLIER = 1.0;

  private titleText: BitmapText;
  private cards: PlayingCard[] = [];
  private speedMultiplier = AceOfShadowsScene.DEFAULT_SPEED_MULTIPLIER;

  private tweenGroup: TWEEN.Group;

  private sourceStackCards: PlayingCard[] = [];
  private destinationStackCards: PlayingCard[] = [];
  private animationTimer = 0;
  private isAnimating = false;
  private animationComplete = false;
  private activeTween: TWEEN.Tween | null = null;
  private animatingCard: PlayingCard | null = null;

  private sourceStackPosition = { x: 0, y: 0 };
  private destinationStackPosition = { x: 0, y: 0 };

  constructor() {
    super();
    this.titleText = new BitmapText('Ace of Shadows', { fontName: 'MonospaceBold', fontSize: 28 });
    this.tweenGroup = new TWEEN.Group();
    this.container.sortableChildren = true;
  }

  init(): void {
    this.setupTitle();
    this.createCards();
    this.calculateStackPositions();
    this.arrangeCards();
    this.initialized = true;
  }

  private setupTitle(): void {
    this.titleText.tint = Colors.WHITE;
    this.titleText.anchor.set(0.5, 0);
    this.titleText.x = this.screenWidth / 2;
    this.titleText.y = 40;
    this.container.addChild(this.titleText);
  }

  private createCards(): void {
    for (let i = 1; i <= AceOfShadowsScene.TOTAL_CARDS; i++) {
      const card = new PlayingCard(i);
      // All cards start in source stack (index 0)
      card.setStackPosition(0, i - 1);
      this.cards.push(card);
      this.sourceStackCards.push(card);
      this.container.addChild(card);
    }
  }

  private calculateStackPositions(): void {
    // Source stack: left side
    this.sourceStackPosition.x = this.screenWidth / 2 - 100;
    this.sourceStackPosition.y = this.screenHeight / 2 - 200;

    // Destination stack: right side
    this.destinationStackPosition.x = this.screenWidth / 2 + 200;
    this.destinationStackPosition.y = this.screenHeight / 2 - 200;
  }

  private arrangeCards(): void {
    this.arrangeStack(this.sourceStackCards, this.sourceStackPosition);
    this.arrangeStack(this.destinationStackCards, this.destinationStackPosition);
  }

  private arrangeStack(stackCards: PlayingCard[], stackPosition: { x: number; y: number }): void {
    for (let i = 0; i < stackCards.length; i++) {
      const card = stackCards[i];
      if (!card) {
        continue;
      }
      card.x = stackPosition.x + i * AceOfShadowsScene.CARD_OFFSET_X;
      card.y = stackPosition.y + i * AceOfShadowsScene.CARD_OFFSET_Y;
      card.zIndex = i;
    }
  }

  update(deltaTime: number): void {
    this.tweenGroup.update();
    this.animationTimer += deltaTime;

    // Handle timer for next card animation (only if source stack has cards and not currently animating)
    if (this.sourceStackCards.length > 0 && !this.isAnimating) {
      const adjustedInterval = AceOfShadowsScene.ANIMATION_INTERVAL / this.speedMultiplier;
      if (this.animationTimer >= adjustedInterval) {
        this.animateNextCard();
        this.animationTimer = 0;
      }
    } else if (this.sourceStackCards.length === 0 && !this.isAnimating && !this.animationComplete) {
      // All cards have been moved - animation sequence complete
      this.animationComplete = true;
      this.onAllCardsTransferred();
    }
  }

  private onAllCardsTransferred(): void {
    console.log('All cards have been transferred to destination stack');
  }

  private animateNextCard(): void {
    if (this.sourceStackCards.length === 0 || this.isAnimating) {
      return;
    }

    const cardToMove = this.sourceStackCards.pop();
    if (!cardToMove) {
      return;
    }

    this.isAnimating = true;
    this.animatingCard = cardToMove;

    // Calculate destination position in destination stack
    const destIndex = this.destinationStackCards.length;
    const destX = this.destinationStackPosition.x + destIndex * AceOfShadowsScene.CARD_OFFSET_X;
    const destY = this.destinationStackPosition.y + destIndex * AceOfShadowsScene.CARD_OFFSET_Y;

    // Set high z-index for card during animation
    cardToMove.zIndex = 1000 + destIndex;

    const startRotation = cardToMove.rotation;
    const targetRotation = startRotation + (Math.random() - 0.5) * 0.2;

    interface AnimationCoords {
      x: number;
      y: number;
      rotation: number;
    }

    this.activeTween = new TWEEN.Tween({
      x: cardToMove.x,
      y: cardToMove.y,
      rotation: startRotation,
    } as AnimationCoords)
      .to(
        {
          x: destX,
          y: destY,
          rotation: targetRotation,
        } as AnimationCoords,
        AceOfShadowsScene.ANIMATION_DURATION / this.speedMultiplier
      )
      .easing(TWEEN.Easing.Sinusoidal.InOut)
      .onUpdate((coords: AnimationCoords) => {
        cardToMove.x = coords.x;
        cardToMove.y = coords.y;
        cardToMove.rotation = coords.rotation;
      })
      .onComplete(() => {
        this.destinationStackCards.push(cardToMove);
        cardToMove.setStackPosition(1, destIndex);
        cardToMove.zIndex = this.destinationStackCards.length - 1;

        // reset rotation with a tween
        this.tweenGroup.add(
          new TWEEN.Tween({ rotation: cardToMove.rotation })
            .to({ rotation: 0 }, 500)
            .easing(TWEEN.Easing.Back.Out)
            .onUpdate((coords: { rotation: number }) => {
              cardToMove.rotation = coords.rotation;
            })
            .start()
        );

        this.isAnimating = false;
        this.activeTween = null;
        this.animatingCard = null;
      })
      .start();

    this.tweenGroup.add(this.activeTween);
  }

  protected override onResize(width: number, _height: number): void {
    this.titleText.x = width / 2;

    // Recalculate stack positions based on new dimensions
    this.calculateStackPositions();

    // If there's an active animation, we need to update its target
    if (this.activeTween && this.animatingCard) {
      this.activeTween.stop();

      const destIndex = this.destinationStackCards.length;
      const newDestX =
        this.destinationStackPosition.x + destIndex * AceOfShadowsScene.CARD_OFFSET_X;
      const newDestY =
        this.destinationStackPosition.y + destIndex * AceOfShadowsScene.CARD_OFFSET_Y;

      const cardToMove = this.animatingCard;
      const currentRotation = cardToMove.rotation;

      interface AnimationCoords {
        x: number;
        y: number;
        rotation: number;
      }

      this.activeTween = new TWEEN.Tween({
        x: cardToMove.x,
        y: cardToMove.y,
        rotation: currentRotation,
      } as AnimationCoords)
        .to(
          {
            x: newDestX,
            y: newDestY,
            rotation: currentRotation,
          } as AnimationCoords,
          AceOfShadowsScene.ANIMATION_DURATION / this.speedMultiplier
        )
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate((coords: AnimationCoords) => {
          cardToMove.x = coords.x;
          cardToMove.y = coords.y;
          cardToMove.rotation = coords.rotation;
        })
        .onComplete(() => {
          this.destinationStackCards.push(cardToMove);
          cardToMove.setStackPosition(1, destIndex);
          cardToMove.zIndex = this.destinationStackCards.length - 1;

          this.tweenGroup.add(
            new TWEEN.Tween({ rotation: cardToMove.rotation })
              .to({ rotation: 0 }, 500)
              .easing(TWEEN.Easing.Back.Out)
              .onUpdate((coords: { rotation: number }) => {
                cardToMove.rotation = coords.rotation;
              })
              .start()
          );

          this.isAnimating = false;
          this.activeTween = null;
          this.animatingCard = null;
        })
        .start();

      this.tweenGroup.add(this.activeTween);
    }

    this.arrangeCards();
  }

  setSpeedMultiplier(multiplier: number): void {
    this.speedMultiplier = Math.max(0.1, multiplier);
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  override destroy(): void {
    if (this.activeTween) {
      this.activeTween.stop();
      this.activeTween = null;
    }
    this.animatingCard = null;
    this.isAnimating = false;

    this.tweenGroup.removeAll();

    super.destroy();
  }
}
