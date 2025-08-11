/**
 * This approach for the FireParticle effect tries to minimize sprite count
 * By replacing clusters of sprites with pre-generated images of particles
 * merging like metaballs
 *
 */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Container, Sprite } from 'pixi.js';
import { AssetLoader } from '../utils/AssetLoader';

interface FireMetaBallOptions {
  max: number;
  width: number;
  height: number;
  singlesCount?: number;
  twoParticleCount?: number;
  threeParticleCount?: number;
  fourParticleCount?: number;
  scatteredCount?: number;
  asymmetricCount?: number;
  mergeDistance?: number;
  spawnInterval?: number;
}

class FireMetaBallParticle {
  private static nextId = 1;

  public readonly id: number;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public active: boolean;
  public merged: boolean;

  constructor(x: number, y: number) {
    this.id = FireMetaBallParticle.nextId++;
    this.x = x;
    this.y = y;
    this.active = true;
    this.merged = false;

    const angle = ((270 + (Math.random() - 0.5) * 30) * Math.PI) / 180;
    const speed = 50 + Math.random() * 50;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.maxLife = 2.0 + Math.random() * 2.0;
    this.life = this.maxLife;
  }

  public update(dt: number): void {
    if (!this.active) {
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.vy -= 20 * dt;
    this.vx += (Math.random() - 0.5) * 10 * dt;
    this.vy += (Math.random() - 0.5) * 5 * dt;

    this.vx *= 0.995;
    this.vy *= 0.995;

    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
    }
  }

  public getAlpha(): number {
    if (!this.active) {
      return 0;
    }
    const a = this.life * 2;
    return a < 1 ? a : 1;
  }
}
interface ParticleGroup {
  key: string;
  particles: FireMetaBallParticle[];
  sprite: Sprite;
  anchor: FireMetaBallParticle;
}

export class FireMetaBallSystem extends Container {
  private readonly maxSprites: number;
  private readonly emitterWidth: number;
  private readonly emitterHeight: number;

  private readonly baseMergeDistance: number;

  private spawnTimer: number;
  private spawnInterval: number;

  private readonly particles: FireMetaBallParticle[] = [];
  private readonly singleSprites = new Map<FireMetaBallParticle, Sprite>();
  private groups = new Map<string, ParticleGroup>();

  constructor(opts: FireMetaBallOptions) {
    super();
    this.maxSprites = opts.max;
    this.emitterWidth = opts.width;
    this.emitterHeight = opts.height;

    this.baseMergeDistance = opts.mergeDistance ?? 5;
    this.spawnInterval = opts.spawnInterval ?? 0.15;
    this.spawnTimer = 0;
  }

  public update(dt: number): void {
    this.spawnTimer += dt;

    for (const p of this.particles) {
      p.update(dt);
    }

    this.cullDeadParticles();

    const clusters = this.clusterToFitBudget();
    this.reconcileVisuals(clusters);

    this.maybeSpawn();

    this.updateSingleSprites();
    this.updateGroupSprites();
  }

  private scaleAtY(y: number): number {
    const t = Math.max(0, Math.min(1, y / this.emitterHeight));
    return 0.12 + t * 2;
  }

  private maybeSpawn(): void {
    if (this.spawnTimer < this.spawnInterval) {
      return;
    }

    const visual = this.getVisualSpriteCount();
    if (visual < this.maxSprites) {
      this.spawnInterval = visual > this.maxSprites - 3 ? 0.25 : 0.15;
      this.spawnOne();
    }

    this.spawnTimer = 0;
  }

  private spawnOne(): void {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 30;
    const x = this.emitterWidth / 2 + Math.cos(angle) * radius;

    const baseBias = Math.random() * 0.5;
    const verticalOffset = baseBias * baseBias * 15;
    const y = this.emitterHeight - 10 - verticalOffset + Math.sin(angle) * radius * 0.3;

    const p = new FireMetaBallParticle(x, y);
    this.particles.push(p);

    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    const variation = 1 + Math.floor(Math.random() * 6);
    const texture = AssetLoader.getTexture(`single_${size}_${variation}`);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = p.x;
    sprite.y = p.y;
    sprite.rotation = Math.random() * Math.PI * 2;

    this.singleSprites.set(p, sprite);
    this.addChild(sprite);
  }

  private getVisualSpriteCount(): number {
    let singles = 0;
    for (const p of this.particles) {
      if (p.active) {
        singles += 1;
      }
    }
    return singles + this.groups.size;
  }

  private cullDeadParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p || p.active) {
        continue;
      }
      const s = this.singleSprites.get(p);
      if (s && s.parent) {
        this.removeChild(s);
      }
      this.singleSprites.delete(p);
      this.particles.splice(i, 1);
    }
  }

  private clusterToFitBudget(): FireMetaBallParticle[][] {
    const actives = this.particles.filter(p => p.active);
    if (actives.length === 0) {
      return [];
    }

    const multipliers: readonly number[] = [1, 1.12, 1.4, 1.8, 2, 2.2];
    let chosen: FireMetaBallParticle[][] = [];

    for (const m of multipliers) {
      const clusters = this.clusterParticles(actives, this.baseMergeDistance * m);
      chosen = clusters;
      if (clusters.length <= this.maxSprites) {
        break;
      }
    }

    return chosen;
  }

  private pickAnchor(comp: readonly FireMetaBallParticle[]): FireMetaBallParticle {
    let best = comp[0]!;
    let bestScore = -Infinity;
    for (const p of comp) {
      const yNorm = Math.max(0, Math.min(1, p.y / this.emitterHeight));
      const score = yNorm * 0.65 + p.getAlpha() * 0.35;
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    return best;
  }

  private clusterParticles(
    particles: readonly FireMetaBallParticle[],
    threshold: number
  ): FireMetaBallParticle[][] {
    const cell = threshold;
    const keyOf = (x: number, y: number): string => {
      const cx = Math.floor(x / cell);
      const cy = Math.floor(y / cell);
      return `${cx},${cy}`;
    };

    const buckets = new Map<string, FireMetaBallParticle[]>();
    for (const p of particles) {
      const k = keyOf(p.x, p.y);
      const list = buckets.get(k);
      if (list === undefined) {
        buckets.set(k, [p]);
      } else {
        list.push(p);
      }
    }

    const visited = new Set<number>();
    const clusters: FireMetaBallParticle[][] = [];

    const candidates = (px: number, py: number): FireMetaBallParticle[] => {
      const cx = Math.floor(px / cell);
      const cy = Math.floor(py / cell);
      const out: FireMetaBallParticle[] = [];
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const list = buckets.get(`${cx + ox},${cy + oy}`);
          if (list !== undefined) {
            out.push(...list);
          }
        }
      }
      return out;
    };

    for (const seed of particles) {
      if (visited.has(seed.id)) {
        continue;
      }

      let sumX = seed.x;
      let sumY = seed.y;
      let count = 1;
      let cx = seed.x;
      let cy = seed.y;

      const comp: FireMetaBallParticle[] = [seed];
      visited.add(seed.id);

      const stack: FireMetaBallParticle[] = [seed];

      const COHESION = 1.0;

      while (stack.length > 0) {
        const cur = stack.pop() as FireMetaBallParticle;

        for (const nb of candidates(cur.x, cur.y)) {
          if (visited.has(nb.id) || nb.id === cur.id) {
            continue;
          }

          const dx = cur.x - nb.x;
          const dy = cur.y - nb.y;
          const d2 = dx * dx + dy * dy;

          const pairScale = Math.max(this.scaleAtY(cur.y), this.scaleAtY(nb.y));
          const pairThr = threshold * pairScale;
          const pairThr2 = pairThr * pairThr;
          if (d2 > pairThr2) {
            continue;
          }

          const cxScale = this.scaleAtY(cy);
          const bottomBias = 1 + (cy / this.emitterHeight) * 0.8;
          const cohThr = threshold * COHESION * cxScale * bottomBias;
          const dcx = nb.x - cx;
          const dcy = nb.y - cy;
          if (dcx * dcx + dcy * dcy > cohThr * cohThr) {
            continue;
          }

          visited.add(nb.id);
          comp.push(nb);

          sumX += nb.x;
          sumY += nb.y;
          count += 1;
          cx = sumX / count;
          cy = sumY / count;

          stack.push(nb);
        }
      }

      clusters.push(comp);
    }

    return clusters;
  }

  private reconcileVisuals(clusters: readonly FireMetaBallParticle[][]): void {
    for (const p of this.particles) {
      p.merged = false;
    }

    const next = new Map<string, ParticleGroup>();

    for (const comp of clusters) {
      if (comp.length <= 1) {
        continue;
      }

      const key = this.keyFor(comp);
      let grp = this.groups.get(key);

      const anchor = this.pickAnchor(comp);

      if (grp === undefined) {
        const texName = this.pickMergeTexture(comp);
        const sprite = new Sprite(AssetLoader.getTexture(texName));
        sprite.anchor.set(0.5);
        sprite.x = anchor.x;
        sprite.y = anchor.y;

        grp = { key, particles: comp, sprite, anchor };
        this.addChild(sprite);
      } else {
        grp.particles = comp;
        grp.anchor = anchor;
      }

      for (const p of comp) {
        p.merged = true;
        const s = this.singleSprites.get(p);
        if (s !== undefined) {
          s.visible = false;
        }
      }

      next.set(key, grp);
    }

    for (const [key, g] of this.groups) {
      if (!next.has(key) && g.sprite.parent) {
        this.removeChild(g.sprite);
      }
    }

    this.groups = next;

    for (const p of this.particles) {
      if (!p.active) {
        continue;
      }
      const s = this.singleSprites.get(p);
      if (s !== undefined) {
        s.visible = !p.merged;
      }
    }
  }

  private keyFor(comp: readonly FireMetaBallParticle[]): string {
    const ids = comp.map(p => p.id).sort((a, b) => a - b);
    return ids.join(',');
  }

  private updateSingleSprites(): void {
    for (const [p, s] of this.singleSprites) {
      if (!p.active || p.merged) {
        continue;
      }
      s.x = p.x;
      s.y = p.y;
      s.alpha = p.getAlpha();
      s.blendMode = 1;

      const progress = (1 - p.life / p.maxLife) ** 2;
      const baseScale = Math.max(0.1, 4 - progress * 3.8);

      const heightProgress = p.y / this.emitterHeight;
      const horizontalScale = 0.3 + heightProgress * 0.7;

      s.scale.set(baseScale * horizontalScale, baseScale);
    }
  }

  private updateGroupSprites(): void {
    for (const grp of this.groups.values()) {
      let anchor = grp.anchor;
      if (!anchor.active) {
        anchor = this.pickAnchor(grp.particles);
        grp.anchor = anchor;
      }

      let sa = 0;
      let n = 0;
      for (const p of grp.particles) {
        if (!p.active) {
          continue;
        }
        sa += p.getAlpha();
        n += 1;
      }
      if (n === 0) {
        if (grp.sprite.parent) {
          this.removeChild(grp.sprite);
        }
        continue;
      }

      grp.sprite.x = anchor.x;
      grp.sprite.y = anchor.y;
      grp.sprite.alpha = sa / n;
      grp.sprite.blendMode = 1;

      const progress = Math.max(0, (this.emitterHeight - anchor.y) / this.emitterHeight);
      const baseScale = Math.max(0.2, 4.2 - progress * 4);

      const heightProgress = anchor.y / this.emitterHeight;
      const horizontalScale = 0.3 + heightProgress * 0.7;

      grp.sprite.scale.set(baseScale * horizontalScale, baseScale);
    }
  }

  private pickMergeTexture(particles: readonly FireMetaBallParticle[]): string {
    const count = particles.length;

    const pickSingle = (): string => {
      const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const variation = 1 + Math.floor(Math.random() * 6);
      return `single_${size}_${variation}`;
    };

    if (count === 2) {
      const p1 = particles[0];
      const p2 = particles[1];
      if (p1 === undefined || p2 === undefined) {
        return pickSingle();
      }

      const dx = Math.abs(p1.x - p2.x);
      const dy = Math.abs(p1.y - p2.y);
      const distance = Math.sqrt(dx * dx + dy * dy);

      let configType: string;

      if (dx > dy * 1.8) {
        if (distance < 15) configType = 'h2_close';
        else if (distance < 30) configType = 'h2_mid';
        else configType = 'h2_far';
      } else if (dy > dx * 1.8) {
        if (distance < 15) configType = 'v2_close';
        else if (distance < 30) configType = 'v2_mid';
        else configType = 'v2_far';
      } else {
        const angle = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
        const normalizedAngle = (angle + 360) % 360;

        if (normalizedAngle >= 315 || normalizedAngle < 45) {
          configType = Math.random() < 0.7 ? 'a2_30' : 'a2_150';
        } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
          configType = Math.random() < 0.5 ? 'd2_ne' : 'd2_se';
        } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
          configType = Math.random() < 0.7 ? 'a2_60' : 'a2_120';
        } else {
          configType = Math.random() < 0.5 ? 'd2_nw' : 'd2_sw';
        }

        if (distance < 8) {
          configType = Math.random() < 0.6 ? 'o2_heavy' : 'o2_slight';
        } else if (distance < 12) {
          configType = Math.random() < 0.3 ? 'o2_slight' : configType;
        }
      }

      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (count === 3) {
      const configs = [
        'tri3_eq',
        'tri3_iso',
        'tri3_right',
        'tri3_acute',
        'lin3_h_close',
        'lin3_h_far',
        'lin3_v_close',
        'lin3_v_far',
        'lin3_diag',
        'lin3_antidiag',
        'l3_ne',
        'l3_nw',
        'l3_se',
        'l3_sw',
        'arc3_top',
        'arc3_bottom',
        'arc3_left',
        'arc3_right',
        'v3_up',
        'v3_down',
        'v3_left',
        'v3_right',
      ];

      const configType = configs[Math.floor(Math.random() * configs.length)];
      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (count === 4) {
      const configs = [
        'cross4',
        'plus4',
        'cross4_diag',
        'square4',
        'rect4_h',
        'rect4_v',
        'diamond4',
        'line4_h',
        'line4_v',
        'line4_diag',
        't4_up',
        't4_down',
        't4_left',
        't4_right',
      ];

      const configType = configs[Math.floor(Math.random() * configs.length)];
      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (count === 5) {
      const configs = ['cluster5', 'star5', 'x5'];
      const configType = configs[Math.floor(Math.random() * configs.length)];
      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (count === 6) {
      const configs = ['hex6', 'flower6', 'grid6'];
      const configType = configs[Math.floor(Math.random() * configs.length)];
      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (count >= 7) {
      const configs = ['circle7', 'burst8'];
      const configType = configs[Math.floor(Math.random() * configs.length)];
      const variation = 1 + Math.floor(Math.random() * 4);
      return `merge_${configType}_${variation}`;
    }

    if (Math.random() < 0.3) {
      const scatterConfigs = [
        'scatter3',
        'scatter4',
        'scatter5',
        'scatter6',
        'scatter7',
        'scatter8',
        'scatter9',
        'scatter10',
      ];
      const configType = scatterConfigs[Math.floor(Math.random() * scatterConfigs.length)];
      const variation = 1 + Math.floor(Math.random() * 5);
      return `${configType}_${variation}`;
    }

    if (Math.random() < 0.2) {
      const asymConfigs = [
        'tear_up',
        'tear_down',
        'tear_left',
        'tear_right',
        'comet_ne',
        'comet_nw',
        'comet_se',
        'comet_sw',
        'flame_tall',
        'flame_wide',
        'flame_left',
        'flame_right',
        'wave_h',
        'wave_v',
        'wave_s',
      ];
      const configType = asymConfigs[Math.floor(Math.random() * asymConfigs.length)];
      const variation = 1 + Math.floor(Math.random() * 3);
      return `asym_${configType}_${variation}`;
    }

    return pickSingle();
  }

  public override destroy(): void {
    for (const s of this.singleSprites.values()) {
      if (s.parent) {
        s.parent.removeChild(s);
      }
    }
    this.singleSprites.clear();

    for (const g of this.groups.values()) {
      if (g.sprite.parent) {
        g.sprite.parent.removeChild(g.sprite);
      }
    }
    this.groups.clear();

    this.particles.length = 0;

    super.destroy();
  }
}
