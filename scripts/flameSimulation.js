/**
 * Sandboxed flame particle simulation to study natural clustering patterns
 * This will help us understand what texture types we actually need to generate
 */

class SimulationParticle {
    constructor(x, y, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 20; // horizontal velocity
        this.vy = -30 - Math.random() * 40; // upward velocity (flame rises)
        this.life = 3.0 + Math.random() * 2.0; // particle lifetime
        this.maxLife = this.life;
        this.active = true;
        this.radius = 8 + Math.random() * 4; // particle size for clustering
    }

    update(dt, flameCenter, flameHeight, allParticles) {
        if (!this.active) return;

        // Basic flame physics - upward movement with turbulence
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Gravity and drag
        this.vy -= 20 * dt; // upward acceleration (negative gravity for flame)
        this.vx += (Math.random() - 0.5) * 15 * dt; // horizontal turbulence
        this.vy += (Math.random() - 0.5) * 8 * dt; // vertical turbulence

        // Drag
        this.vx *= 0.995;
        this.vy *= 0.995;

        // Magnetic attraction to nearby particles - flame physics
        const attractionForce = this.calculateAttractionForce(allParticles, flameCenter, flameHeight);
        this.vx += attractionForce.x * dt;
        this.vy += attractionForce.y * dt;

        // Life decay
        this.life -= dt;
        if (this.life <= 0) {
            this.active = false;
        }
    }

    calculateAttractionForce(allParticles, flameCenter, flameHeight) {
        let totalForceX = 0;
        let totalForceY = 0;

        // Calculate clustering strength based on position in flame
        const verticalProgress = Math.max(0, Math.min(1, this.y / flameHeight));
        const horizontalDistance = Math.abs(this.x - flameCenter);
        
        // Stronger clustering near bottom/center, weaker at top/edges
        const clusteringStrength = (1 - verticalProgress) * (1 - Math.min(1, horizontalDistance / 100));

        for (const other of allParticles) {
            if (other === this || !other.active) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = this.radius + other.radius;

            // Apply attraction when particles are close but not overlapping
            if (distance > minDistance && distance < minDistance * 3) {
                const attractionRadius = minDistance * 2.5;
                const normalizedDist = distance / attractionRadius;
                const attraction = (1 - normalizedDist) * clusteringStrength * 30;

                const forceX = (dx / distance) * attraction;
                const forceY = (dy / distance) * attraction;

                totalForceX += forceX;
                totalForceY += forceY;
            }
        }

        return { x: totalForceX, y: totalForceY };
    }

    getAlpha() {
        if (!this.active) return 0;
        const lifeRatio = this.life / this.maxLife;
        return Math.min(1, lifeRatio * 2);
    }
}

class FlameSimulation {
    constructor(width = 200, height = 400) {
        this.width = width;
        this.height = height;
        this.flameCenter = width / 2;
        this.particles = [];
        this.time = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 0.1;
        this.maxParticles = 50;
        this.clusterHistory = [];
    }

    update(dt) {
        this.time += dt;
        this.spawnTimer += dt;

        // Spawn new particles at flame base
        if (this.spawnTimer >= this.spawnInterval && this.particles.length < this.maxParticles) {
            this.spawnParticle();
            this.spawnTimer = 0;
        }

        // Update all particles
        for (const particle of this.particles) {
            particle.update(dt, this.flameCenter, this.height, this.particles);
        }

        // Remove dead particles
        this.particles = this.particles.filter(p => p.active);

        // Analyze clustering every 0.5 seconds
        if (Math.floor(this.time * 2) !== Math.floor((this.time - dt) * 2)) {
            this.analyzeCurrentClusters();
        }
    }

    spawnParticle() {
        // Spawn near flame base with some spread
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 25;
        const x = this.flameCenter + Math.cos(angle) * radius;
        const y = this.height - 10 + Math.random() * 20;
        
        this.particles.push(new SimulationParticle(x, y, this.particles.length));
    }

    analyzeCurrentClusters() {
        const activeParticles = this.particles.filter(p => p.active);
        if (activeParticles.length === 0) return;

        const clusters = this.findClusters(activeParticles);
        
        // Record cluster data with merge state analysis
        for (const cluster of clusters) {
            if (cluster.length >= 2) {
                const clusterData = this.analyzeClusterGeometry(cluster);
                const mergeState = this.analyzeMergeState(cluster);
                this.clusterHistory.push({
                    time: this.time,
                    size: cluster.length,
                    mergeState: mergeState,
                    ...clusterData
                });
            }
        }
    }

    findClusters(particles) {
        const visited = new Set();
        const clusters = [];

        for (const particle of particles) {
            if (visited.has(particle.id)) continue;

            const cluster = [];
            const stack = [particle];
            
            while (stack.length > 0) {
                const current = stack.pop();
                if (visited.has(current.id)) continue;
                
                visited.add(current.id);
                cluster.push(current);

                // Find nearby particles
                for (const other of particles) {
                    if (visited.has(other.id)) continue;
                    
                    const distance = Math.sqrt(
                        (other.x - current.x) ** 2 + (other.y - current.y) ** 2
                    );
                    const clusterDistance = (current.radius + other.radius) * 2;
                    
                    if (distance <= clusterDistance) {
                        stack.push(other);
                    }
                }
            }

            clusters.push(cluster);
        }

        return clusters;
    }

    analyzeClusterGeometry(cluster) {
        // Calculate cluster center
        const centerX = cluster.reduce((sum, p) => sum + p.x, 0) / cluster.length;
        const centerY = cluster.reduce((sum, p) => sum + p.y, 0) / cluster.length;

        // Calculate cluster spread and shape
        let maxDistance = 0;
        let minDistance = Infinity;
        let totalDistance = 0;

        for (const particle of cluster) {
            const distance = Math.sqrt((particle.x - centerX) ** 2 + (particle.y - centerY) ** 2);
            maxDistance = Math.max(maxDistance, distance);
            minDistance = Math.min(minDistance, distance);
            totalDistance += distance;
        }

        const avgDistance = totalDistance / cluster.length;
        const compactness = minDistance / (maxDistance + 0.001); // 0-1, 1 = very compact

        // Determine primary orientation
        let weightedAngle = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
                const p1 = cluster[i];
                const p2 = cluster[j];
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const weight = 1 / (Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2) + 0.001);
                
                weightedAngle += angle * weight;
                totalWeight += weight;
            }
        }
        
        const primaryOrientation = totalWeight > 0 ? weightedAngle / totalWeight : 0;

        // Calculate vertical position in flame (0 = bottom, 1 = top)
        const flamePosition = Math.max(0, Math.min(1, centerY / this.height));

        return {
            centerX,
            centerY,
            maxDistance,
            avgDistance,
            compactness,
            primaryOrientation: (primaryOrientation * 180 / Math.PI), // Convert to degrees
            flamePosition,
            totalRadius: cluster.reduce((sum, p) => sum + p.radius, 0)
        };
    }

    analyzeMergeState(cluster) {
        if (cluster.length < 2) return 'single';

        // Calculate average distance between particles
        let totalDistance = 0;
        let pairCount = 0;
        let minDistance = Infinity;
        let maxDistance = 0;
        
        for (let i = 0; i < cluster.length; i++) {
            for (let j = i + 1; j < cluster.length; j++) {
                const p1 = cluster[i];
                const p2 = cluster[j];
                const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                const combinedRadius = p1.radius + p2.radius;
                const normalizedDistance = distance / combinedRadius;
                
                totalDistance += normalizedDistance;
                minDistance = Math.min(minDistance, normalizedDistance);
                maxDistance = Math.max(maxDistance, normalizedDistance);
                pairCount++;
            }
        }
        
        const avgNormalizedDistance = totalDistance / pairCount;
        
        // Classify merge state based on normalized distances
        if (avgNormalizedDistance >= 2.0) return 'approaching';      // Particles getting close
        if (avgNormalizedDistance >= 1.5) return 'close';           // Particles nearly touching
        if (avgNormalizedDistance >= 1.2) return 'touching';        // Particles just touching
        if (avgNormalizedDistance >= 0.8) return 'merging';         // Particles overlapping
        if (avgNormalizedDistance >= 0.4) return 'nearly_merged';   // Heavily merged
        return 'fully_merged';                                       // Single merged mass
    }

    getClusterStatistics() {
        const stats = {
            totalClusters: this.clusterHistory.length,
            sizeDistribution: {},
            mergeStateDistribution: {},
            compactnessStats: { min: 1, max: 0, avg: 0 },
            orientationDistribution: {},
            flamePositionStats: {},
            commonPatterns: []
        };

        // Size distribution
        for (const cluster of this.clusterHistory) {
            stats.sizeDistribution[cluster.size] = (stats.sizeDistribution[cluster.size] || 0) + 1;
        }

        // Merge state distribution
        for (const cluster of this.clusterHistory) {
            if (cluster.mergeState) {
                stats.mergeStateDistribution[cluster.mergeState] = (stats.mergeStateDistribution[cluster.mergeState] || 0) + 1;
            }
        }

        // Compactness stats
        const compactnesses = this.clusterHistory.map(c => c.compactness);
        stats.compactnessStats.min = Math.min(...compactnesses);
        stats.compactnessStats.max = Math.max(...compactnesses);
        stats.compactnessStats.avg = compactnesses.reduce((sum, c) => sum + c, 0) / compactnesses.length;

        // Orientation distribution (binned)
        for (const cluster of this.clusterHistory) {
            const bin = Math.floor((cluster.primaryOrientation + 180) / 30) * 30 - 180; // 30-degree bins
            stats.orientationDistribution[bin] = (stats.orientationDistribution[bin] || 0) + 1;
        }

        // Flame position analysis (bottom vs top clustering)
        const bottomClusters = this.clusterHistory.filter(c => c.flamePosition > 0.7).length;
        const topClusters = this.clusterHistory.filter(c => c.flamePosition < 0.3).length;
        stats.flamePositionStats = {
            bottom: bottomClusters,
            top: topClusters,
            ratio: bottomClusters / (topClusters + 0.001)
        };

        return stats;
    }

    run(duration = 10) {
        console.log(`Running flame simulation for ${duration} seconds...`);
        
        const dt = 1 / 60; // 60 FPS simulation
        const steps = Math.floor(duration / dt);
        
        for (let step = 0; step < steps; step++) {
            this.update(dt);
            
            // Log progress
            if (step % 600 === 0) { // Every 10 seconds
                console.log(`Time: ${this.time.toFixed(1)}s, Particles: ${this.particles.length}, Clusters recorded: ${this.clusterHistory.length}`);
            }
        }

        console.log('\nSimulation complete!');
        console.log(`Total clusters analyzed: ${this.clusterHistory.length}`);
        
        return this.getClusterStatistics();
    }
}

// Run the simulation
const simulation = new FlameSimulation(200, 400);
const stats = simulation.run(15); // Run for 15 seconds

console.log('\n=== FLAME CLUSTERING ANALYSIS ===');
console.log('\nSize Distribution:');
Object.entries(stats.sizeDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([size, count]) => {
        const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
        console.log(`  ${size} particles: ${count} clusters (${percentage}%)`);
    });

console.log('\nCompactness Stats:');
console.log(`  Min: ${stats.compactnessStats.min.toFixed(3)}`);
console.log(`  Max: ${stats.compactnessStats.max.toFixed(3)}`);
console.log(`  Avg: ${stats.compactnessStats.avg.toFixed(3)}`);

console.log('\nMerge State Distribution:');
Object.entries(stats.mergeStateDistribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([state, count]) => {
        const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
        console.log(`  ${state}: ${count} clusters (${percentage}%)`);
    });

console.log('\nOrientation Distribution (degrees):');
Object.entries(stats.orientationDistribution)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([angle, count]) => {
        const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
        console.log(`  ${angle}°: ${count} clusters (${percentage}%)`);
    });

console.log('\nFlame Position Analysis:');
console.log(`  Bottom clusters (flame base): ${stats.flamePositionStats.bottom}`);
console.log(`  Top clusters (flame tips): ${stats.flamePositionStats.top}`);
console.log(`  Bottom/Top ratio: ${stats.flamePositionStats.ratio.toFixed(2)}`);

console.log('\n=== TEXTURE GENERATION RECOMMENDATIONS ===');

// Analyze most common cluster types
const sizes = Object.entries(stats.sizeDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 4);

console.log('\nMost common cluster sizes (generate textures for these):');
sizes.forEach(([size, count], index) => {
    const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${size} particles - ${percentage}% of all clusters`);
});

const commonOrientations = Object.entries(stats.orientationDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

console.log('\nMost common orientations (generate texture variations for these):');
commonOrientations.forEach(([angle, count], index) => {
    const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${angle}° - ${percentage}% of clusters`);
});

const commonMergeStates = Object.entries(stats.mergeStateDistribution)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

console.log('\nMost common merge states (generate textures for these transitions):');
commonMergeStates.forEach(([state, count], index) => {
    const percentage = ((count / stats.totalClusters) * 100).toFixed(1);
    console.log(`  ${index + 1}. ${state} - ${percentage}% of clusters`);
});

console.log('\nCompactness insights:');
if (stats.compactnessStats.avg > 0.6) {
    console.log('  - Clusters tend to be compact - generate tight cluster textures');
} else if (stats.compactnessStats.avg > 0.3) {
    console.log('  - Clusters are moderately spread - generate medium-spread textures');
} else {
    console.log('  - Clusters are very spread out - generate loose cluster textures');
}

if (stats.flamePositionStats.ratio > 2) {
    console.log('  - Much more clustering at flame base - larger cluster textures for bottom');
    console.log('  - Generate smaller, sparser textures for flame top');
}

console.log('\n=== NEXT STEPS ===');
console.log('1. Generate merge transition textures for the most common states');
console.log('2. Focus on the most common cluster sizes, orientations, and merge states');
console.log('3. Create smooth progressions: approaching → close → touching → merging → nearly merged → fully merged');
console.log('4. Ensure runtime can select textures based on actual particle distances');
console.log('5. This will eliminate blinking by providing continuous visual transitions');