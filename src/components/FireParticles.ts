/**\
 * This is another approach for the FireParticles
 * That aims to split the 10 sprite allowance into 4 different kinds:
 * - Base: for the big round part in the middle
 * - FlameLick: for the long stripes of flames
 * - Spark: for the small, bright particles
 * - Ember: for the glowing remnants
 */
import { Container } from 'pixi.js';
import { Emitter, EmitterConfigV3 } from '@pixi/particle-emitter';

interface FireParticlesOptions {
  max: number;
  width: number;
  height: number;
}

export class FireParticles extends Container {
  private baseFireEmitter!: Emitter;
  private flameLickEmitter!: Emitter;
  private sparkEmitter!: Emitter;
  private emberEmitter!: Emitter;

  private maxParticles: number;
  private emitterWidth: number;
  private emitterHeight: number;

  // Particle position tracking
  private baseParticlePositions: { x: number; y: number }[] = [];
  private lickParticlePositions: { x: number; y: number }[] = [];

  constructor(options: FireParticlesOptions) {
    super();

    this.maxParticles = options.max;
    this.emitterWidth = options.width;
    this.emitterHeight = options.height;

    this.createEmitters();
  }

  private createEmitters(): void {
    // Base fire emitter configuration (2-3 particles max)
    const baseFireConfig: EmitterConfigV3 = {
      lifetime: {
        min: 0.8,
        max: 1.5,
      },
      frequency: 0.4,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: 3,
      pos: {
        x: this.emitterWidth / 2,
        y: this.emitterHeight - 20,
      },
      addAtBack: false,
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { value: 0.8, time: 0 },
                { value: 1, time: 0.1 },
                { value: 0.9, time: 0.7 },
                { value: 0, time: 1 },
              ],
            },
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: 0.8, time: 0 },
                { value: 1.2, time: 0.3 },
                { value: 1.0, time: 1 },
              ],
            },
            minMult: 1,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                { value: '#ffffff', time: 0 },
                { value: '#ffff66', time: 0.2 },
                { value: '#ff8800', time: 0.5 },
                { value: '#ff4400', time: 0.8 },
                { value: '#cc0000', time: 1 },
              ],
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: 20, time: 0 },
                { value: 15, time: 1 },
              ],
            },
            minMult: 0.9,
          },
        },
        {
          type: 'rotation',
          config: {
            accel: 0,
            minSpeed: -5,
            maxSpeed: 5,
            minStart: -20,
            maxStart: 20,
          },
        },
        {
          type: 'textureRandom',
          config: {
            textures: [
              'fire_base_1',
              'fire_base_2',
              'fire_base_3',
              'fire_base_4',
              'fire_base_5',
              'fire_base_6',
            ],
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: -3,
              y: -2,
              w: 6,
              h: 4,
            },
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 268,
            max: 272,
          },
        },
      ],
    };

    // Flame lick emitter configuration (2 particles max)
    const flameLickConfig: EmitterConfigV3 = {
      lifetime: {
        min: 0.6,
        max: 1.0,
      },
      frequency: 0.4,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: 2,
      pos: {
        x: this.emitterWidth / 2,
        y: this.emitterHeight - 30,
      },
      addAtBack: false,
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { value: 0.7, time: 0 },
                { value: 0.9, time: 0.2 },
                { value: 0.6, time: 0.8 },
                { value: 0, time: 1 },
              ],
            },
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: 0.7, time: 0 },
                { value: 1.0, time: 0.3 },
                { value: 0.8, time: 1 },
              ],
            },
            minMult: 1,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                { value: '#ffff88', time: 0 },
                { value: '#ffaa44', time: 0.3 },
                { value: '#ff6600', time: 0.7 },
                { value: '#dd2200', time: 1 },
              ],
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: 40, time: 0 },
                { value: 60, time: 0.5 },
                { value: 35, time: 1 },
              ],
            },
            minMult: 0.9,
          },
        },
        {
          type: 'rotation',
          config: {
            accel: 0,
            minSpeed: -10,
            maxSpeed: 10,
            minStart: -10,
            maxStart: 10,
          },
        },
        {
          type: 'textureRandom',
          config: {
            textures: [
              'fire_lick_1',
              'fire_lick_2',
              'fire_lick_3',
              'fire_lick_4',
              'fire_lick_5',
              'fire_lick_6',
              'fire_lick_7',
              'fire_lick_8',
            ],
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: -15,
              y: -5,
              w: 30,
              h: 10,
            },
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 265,
            max: 275,
          },
        },
      ],
    };

    // Spark emitter configuration (3 particles max)
    const sparkConfig: EmitterConfigV3 = {
      lifetime: {
        min: 0.4,
        max: 0.7,
      },
      frequency: 0.2,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: 3,
      pos: {
        x: this.emitterWidth / 2,
        y: this.emitterHeight - 40,
      },
      addAtBack: false,
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { value: 1, time: 0 },
                { value: 0.8, time: 0.5 },
                { value: 0, time: 1 },
              ],
            },
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: 0.8, time: 0 },
                { value: 1.2, time: 0.3 },
                { value: 0.4, time: 1 },
              ],
            },
            minMult: 1,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                { value: '#ffffff', time: 0 },
                { value: '#ffff44', time: 0.4 },
                { value: '#ff8800', time: 0.8 },
                { value: '#ff2200', time: 1 },
              ],
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: 80, time: 0 },
                { value: 120, time: 0.3 },
                { value: 60, time: 1 },
              ],
            },
            minMult: 0.9,
          },
        },
        {
          type: 'rotation',
          config: {
            accel: 0,
            minSpeed: -50,
            maxSpeed: 50,
            minStart: -15,
            maxStart: 15,
          },
        },
        {
          type: 'textureRandom',
          config: {
            textures: [
              'fire_spark_1',
              'fire_spark_2',
              'fire_spark_3',
              'fire_spark_4',
              'fire_spark_5',
              'fire_spark_6',
              'fire_spark_7',
              'fire_spark_8',
              'fire_spark_9',
              'fire_spark_10',
            ],
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: -12,
              y: -8,
              w: 24,
              h: 16,
            },
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 260,
            max: 280,
          },
        },
      ],
    };

    // Ember emitter configuration (1 particle max)
    const emberConfig: EmitterConfigV3 = {
      lifetime: {
        min: 1.2,
        max: 1.8,
      },
      frequency: 1.0,
      spawnChance: 1,
      particlesPerWave: 1,
      emitterLifetime: -1,
      maxParticles: 1,
      pos: {
        x: this.emitterWidth / 2,
        y: this.emitterHeight - 15,
      },
      addAtBack: false,
      behaviors: [
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                { value: 0.6, time: 0 },
                { value: 0.8, time: 0.3 },
                { value: 0.5, time: 0.8 },
                { value: 0, time: 1 },
              ],
            },
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                { value: 0.9, time: 0 },
                { value: 1.1, time: 0.5 },
                { value: 0.7, time: 1 },
              ],
            },
            minMult: 1,
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                { value: '#ffaa66', time: 0 },
                { value: '#ff6633', time: 0.5 },
                { value: '#cc2200', time: 1 },
              ],
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                { value: 35, time: 0 },
                { value: 50, time: 0.4 },
                { value: 25, time: 1 },
              ],
            },
            minMult: 0.9,
          },
        },
        {
          type: 'rotation',
          config: {
            accel: 0,
            minSpeed: -15,
            maxSpeed: 15,
            minStart: -10,
            maxStart: 10,
          },
        },
        {
          type: 'textureRandom',
          config: {
            textures: [
              'fire_ember_1',
              'fire_ember_2',
              'fire_ember_3',
              'fire_ember_4',
              'fire_ember_5',
              'fire_ember_6',
            ],
          },
        },
        {
          type: 'spawnShape',
          config: {
            type: 'rect',
            data: {
              x: -12,
              y: -6,
              w: 24,
              h: 12,
            },
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 270,
            max: 275,
          },
        },
      ],
    };

    // Create emitters
    this.baseFireEmitter = new Emitter(this, baseFireConfig);
    this.flameLickEmitter = new Emitter(this, flameLickConfig);
    this.sparkEmitter = new Emitter(this, sparkConfig);
    this.emberEmitter = new Emitter(this, emberConfig);

    // Start all emitters
    this.baseFireEmitter.emit = true;
    this.flameLickEmitter.emit = true;
    this.sparkEmitter.emit = true;
    this.emberEmitter.emit = true;
  }

  update(deltaTime: number): void {
    this.baseFireEmitter.update(deltaTime);

    this.updateParticlePositions();

    this.updateEmitterPositions();

    this.flameLickEmitter.update(deltaTime);
    this.sparkEmitter.update(deltaTime);
    this.emberEmitter.update(deltaTime);

    // Monitor total particle count and adjust if needed
    const totalParticles = this.getTotalParticleCount();
    if (totalParticles > this.maxParticles) {
      this.adjustEmitterRates(totalParticles);
    }
  }

  private updateParticlePositions(): void {
    this.baseParticlePositions = [];
    if (this.baseFireEmitter.particleCount > 0) {
      const baseX = this.emitterWidth / 2;
      const baseY = this.emitterHeight - 45;

      for (let i = 0; i < this.baseFireEmitter.particleCount; i++) {
        this.baseParticlePositions.push({
          x: baseX + (Math.random() - 0.5) * 20,
          y: baseY + (Math.random() - 0.5) * 10,
        });
      }
    }

    this.lickParticlePositions = [];
    if (this.flameLickEmitter.particleCount > 0) {
      for (let i = 0; i < this.flameLickEmitter.particleCount; i++) {
        if (this.baseParticlePositions.length > 0) {
          const basePos = this.baseParticlePositions[i % this.baseParticlePositions.length];
          if (basePos) {
            this.lickParticlePositions.push({
              x: basePos.x + (Math.random() - 0.5) * 15,
              y: basePos.y - 30 + (Math.random() - 0.5) * 10,
            });
          }
        }
      }
    }
  }

  private updateEmitterPositions(): void {
    // Update flame lick emitter to spawn from base particle tips
    if (this.baseParticlePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.baseParticlePositions.length);
      const randomBase = this.baseParticlePositions[randomIndex];
      if (randomBase) {
        this.flameLickEmitter.updateSpawnPos(randomBase.x, randomBase.y);
      }
    }

    // Update spark emitter to spawn from lick particle tips
    if (this.lickParticlePositions.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.lickParticlePositions.length);
      const randomLick = this.lickParticlePositions[randomIndex];
      if (randomLick) {
        this.sparkEmitter.updateSpawnPos(randomLick.x, randomLick.y);
      }
    }
  }

  private getTotalParticleCount(): number {
    return (
      this.baseFireEmitter.particleCount +
      this.flameLickEmitter.particleCount +
      this.sparkEmitter.particleCount +
      this.emberEmitter.particleCount
    );
  }

  private adjustEmitterRates(currentCount: number): void {
    // Temporarily reduce spawn rates if we exceed the limit
    const excess = currentCount - this.maxParticles;

    // Prioritize base fire, then licks, then sparks, then embers
    if (this.sparkEmitter.emit && excess > 0) {
      this.sparkEmitter.emit = false;
      setTimeout(() => {
        this.sparkEmitter.emit = true;
      }, 500);
    }
  }

  override destroy(): void {
    this.baseFireEmitter.destroy();
    this.flameLickEmitter.destroy();
    this.sparkEmitter.destroy();
    this.emberEmitter.destroy();
    super.destroy();
  }
}
