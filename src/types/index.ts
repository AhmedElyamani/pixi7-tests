import { Application, Container, Texture } from 'pixi.js';

export interface Scene {
  readonly name: string;
  readonly container: Container;
  init(): void;
  update(deltaTime: number): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

export interface GameConfig {
  width: number;
  height: number;
  backgroundColor: number;
  antialias: boolean;
  resolution: number;
}

export interface DebugInfo {
  fps: number;
  sceneName: string;
  spriteCount: number;
}

export interface GameApplication extends Application {
  currentScene: Scene | null;
  debugMode: boolean;
}

export interface DialogueEntry {
  name: string;
  text: string;
}

export interface EmojiData {
  name: string;
  url: string;
}

export interface AvatarData {
  name: string;
  url: string;
  position: 'left' | 'right';
}

export interface AvatarTexture {
  position: 'left' | 'right';
  texture: Texture;
}

export interface MagicWordsData {
  dialogue: DialogueEntry[];
  emojies: EmojiData[];
  avatars: AvatarData[];
}
