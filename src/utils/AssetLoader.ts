import { Assets, Texture } from 'pixi.js';
import { EmojiData, AvatarData, MagicWordsData, AvatarTexture } from '../types';

export class AssetLoader {
  private static textureCache = new Map<string, Texture>();
  private static magicWordsData: MagicWordsData | null = null;
  private static avatarTextures: Map<string, AvatarTexture> | null = null;

  async loadInitialAssets(): Promise<void> {
    const texture = await Assets.load<Texture>('assets/images/fish_blue.png');
    AssetLoader.textureCache.set('demo_sprite', texture);
    await AssetLoader.loadFont(
      'MonospaceBold',
      './assets/fonts/MonospaceBold.fnt',
      './assets/fonts/MonospaceBold.png'
    );
    await AssetLoader.loadAtlas('playingCards', './assets/images/playingCards.json');
    await AssetLoader.loadAtlas('fireParticles', './assets/images/fireParticles.json');
    await AssetLoader.loadAtlas('fireMetaBalls', './assets/images/fireMetaBalls.json');

    await AssetLoader.loadMagicWordsAssets();
  }

  static getTexture(name: string): Texture {
    const texture = AssetLoader.textureCache.get(name) ?? Assets.cache.get(name);
    if (!texture) {
      throw new Error(`Texture '${name}' not found. Make sure it's loaded first.`);
    }
    return texture;
  }

  static hasTexture(name: string): boolean {
    return AssetLoader.textureCache.has(name) || Assets.cache.has(name);
  }

  static async loadFont(name: string, fontPath: string, texturePath: string): Promise<void> {
    try {
      await Assets.load([
        { alias: `${name}_texture`, src: texturePath },
        { alias: name, src: fontPath },
      ]);
    } catch (error) {
      console.error(`Failed to load bitmap font ${name}:`, error);
      throw error;
    }
  }

  static async loadAtlas(name: string, atlasPath: string): Promise<void> {
    try {
      await Assets.load({ alias: name, src: atlasPath });
    } catch (error) {
      console.error(`Failed to load texture atlas ${name}:`, error);
      throw error;
    }
  }

  static async loadEmojis(emojis: EmojiData[]): Promise<Map<string, Texture>> {
    const emojiTextures = new Map<string, Texture>();

    const loadPromises = emojis.map(async emoji => {
      try {
        const texture = await Assets.load<Texture>({
          src: emoji.url,
          loadParser: 'loadTextures',
        });

        emojiTextures.set(emoji.name, texture);
        AssetLoader.textureCache.set(`emoji_${emoji.name}`, texture);
      } catch (error) {
        console.error(`Failed to load emoji texture for ${emoji.name} from ${emoji.url}:`, error);
      }
    });

    await Promise.all(loadPromises);

    return emojiTextures;
  }

  static async loadAvatars(avatars: AvatarData[]): Promise<Map<string, AvatarTexture>> {
    const avatarTextures = new Map<string, AvatarTexture>();

    const texture = await Assets.load<Texture>('assets/images/default_avatar.png');
    AssetLoader.textureCache.set('default_avatar', texture);

    const loadPromises = avatars.map(async avatar => {
      try {
        const texture = await Assets.load<Texture>({
          src: avatar.url,
          loadParser: 'loadTextures',
        });

        avatarTextures.set(avatar.name, {
          position: avatar.position,
          texture,
        });
        AssetLoader.textureCache.set(`avatar_${avatar.name}`, texture);
      } catch (error) {
        console.error(
          `Failed to load avatar texture for ${avatar.name} from ${avatar.url}:`,
          error
        );
      }
    });

    await Promise.all(loadPromises);

    return avatarTextures;
  }

  static getEmojiTexture(name: string): Texture | undefined {
    return AssetLoader.textureCache.get(`emoji_${name}`) ?? Assets.cache.get(`emoji_${name}`);
  }

  static getAvatarTexture(name: string): Texture | undefined {
    return AssetLoader.textureCache.get(`avatar_${name}`) ?? Assets.cache.get(`avatar_${name}`);
  }

  static async loadMagicWordsAssets(): Promise<void> {
    try {
      // Fetch Magic Words data from API
      const response = await fetch(
        'https://private-624120-softgamesassignment.apiary-mock.com/v2/magicwords'
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch Magic Words data: ${response.status.toString()}`);
      }

      const data = (await response.json()) as MagicWordsData;

      if (data.dialogue.length === 0) {
        throw new Error('No dialogue data found in API response');
      }

      AssetLoader.magicWordsData = data;

      await AssetLoader.loadEmojis(AssetLoader.magicWordsData.emojies);

      AssetLoader.avatarTextures = await AssetLoader.loadAvatars(
        AssetLoader.magicWordsData.avatars
      );
    } catch (error) {
      console.error('Failed to load Magic Words assets:', error);
      throw error;
    }
  }

  static getMagicWordsData(): MagicWordsData | null {
    return AssetLoader.magicWordsData;
  }

  static getAllEmojiTextures(): Map<string, Texture> {
    const emojiTextures = new Map<string, Texture>();
    for (const [key, texture] of AssetLoader.textureCache.entries()) {
      if (key.startsWith('emoji_')) {
        emojiTextures.set(key.substring(6), texture);
      }
    }
    return emojiTextures;
  }

  static getAllAvatarTextures(): Map<string, AvatarTexture> {
    if (AssetLoader.avatarTextures) {
      return AssetLoader.avatarTextures;
    } else {
      const avatarTextures = new Map<string, AvatarTexture>();
      for (const [key, texture] of AssetLoader.textureCache.entries()) {
        if (key.startsWith('avatar_')) {
          avatarTextures.set(key.substring(7), {
            texture: texture,
            position: 'left',
          });
        }
      }
      return avatarTextures;
    }
  }
}
