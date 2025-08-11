import { Sprite } from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';

export class PlayingCard extends Sprite {
  private static readonly AVAILABLE_CARDS = [
    'ace_of_spades2',
    '2_of_spades',
    '3_of_spades',
    '4_of_spades',
    '5_of_spades',
    '6_of_spades',
    '7_of_spades',
    '8_of_spades',
    '9_of_spades',
    '10_of_spades',
    'jack_of_spades2',
    'queen_of_spades2',
    'king_of_spades2',
    'ace_of_hearts',
    '2_of_hearts',
    '3_of_hearts',
    '4_of_hearts',
    '5_of_hearts',
    '6_of_hearts',
    '7_of_hearts',
    '8_of_hearts',
    '9_of_hearts',
    '10_of_hearts',
    'jack_of_hearts2',
    'queen_of_hearts2',
    'king_of_hearts2',
    'ace_of_diamonds',
    '2_of_diamonds',
    '3_of_diamonds',
    '4_of_diamonds',
    '5_of_diamonds',
    '6_of_diamonds',
    '7_of_diamonds',
    '8_of_diamonds',
    '9_of_diamonds',
    '10_of_diamonds',
    'jack_of_diamonds2',
    'queen_of_diamonds2',
    'king_of_diamonds2',
    'ace_of_clubs',
    '2_of_clubs',
    '3_of_clubs',
    '4_of_clubs',
    '5_of_clubs',
    '6_of_clubs',
    '7_of_clubs',
    '8_of_clubs',
    '9_of_clubs',
    '10_of_clubs',
    'jack_of_clubs2',
    'queen_of_clubs2',
    'king_of_clubs2',
    'black_joker',
    'red_joker',
  ];

  public readonly cardNumber: number;
  public currentStackIndex = 0;
  public positionInStack = 0;

  constructor(cardNumber: number) {
    const textureIndex = (cardNumber - 1) % PlayingCard.AVAILABLE_CARDS.length;
    const textureName = PlayingCard.AVAILABLE_CARDS[textureIndex] ?? 'red_joker';
    const texture = AssetLoader.getTexture(textureName);

    super(texture);

    this.cardNumber = cardNumber;
    this.anchor.set(0.5);

    this.scale.set(0.15);
  }

  setStackPosition(stackIndex: number, positionInStack: number): void {
    this.currentStackIndex = stackIndex;
    this.positionInStack = positionInStack;
  }
}
