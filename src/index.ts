import '@pixi/events';
import { Application } from 'pixi.js';
import { GameManager } from './GameManager';
import { GameConfig } from './types';
import { Colors } from './utils/Colors';

const gameConfig: GameConfig = {
  width: 1024,
  height: 768,
  backgroundColor: Colors.BACKGROUND,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
};

async function initGame(): Promise<void> {
  try {
    const app = new Application({
      width: gameConfig.width,
      height: gameConfig.height,
      backgroundColor: gameConfig.backgroundColor,
      antialias: gameConfig.antialias,
      resolution: gameConfig.resolution,
      autoDensity: true,
    });

    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
      throw new Error('Game container element not found');
    }

    gameContainer.appendChild(app.view as HTMLCanvasElement);

    const gameManager = new GameManager(app, gameConfig);
    await gameManager.init();

    window.addEventListener('resize', () => {
      gameManager.handleResize();
    });

    gameManager.handleResize();
  } catch (error) {
    console.error('Failed to initialize game:', error);

    const errorElement = document.createElement('div');
    errorElement.style.color = 'white';
    errorElement.style.fontSize = '24px';
    errorElement.style.textAlign = 'center';
    errorElement.style.margin = '50px';
    errorElement.textContent = `Game initialization failed: ${error instanceof Error ? error.message : String(error)}`;

    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
      gameContainer.appendChild(errorElement);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void initGame();
  });
} else {
  void initGame();
}
