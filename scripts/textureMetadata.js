/**
 * Texture metadata system for proper sizing and selection of fire metaball textures
 * Based on natural clustering patterns from flame simulation
 */

/**
 * Metadata structure for each texture
 */
class TextureMetadata {
    constructor({
        name,                    // Texture filename
        particleCount,          // Number of particles this represents
        baseParticleSize,       // Size of individual particles used to create this
        totalSize,              // Combined visual area (for scaling calculations)
        orientationAngle,       // Primary angle in degrees (-180 to 180)
        compactness,            // 0-1, how tightly packed (0 = spread, 1 = tight)
        centerOffset,           // {x, y} offset of visual center from texture center
        spatialBounds,          // {width, height} of actual content area
        naturalSpacing,         // Typical distance between particles in this formation
        mergeState,             // Merge state: approaching, close, touching, merging, nearly_merged, fully_merged
        normalizedDistance      // Normalized distance between particles (for merge state selection)
    }) {
        this.name = name;
        this.particleCount = particleCount;
        this.baseParticleSize = baseParticleSize;
        this.totalSize = totalSize;
        this.orientationAngle = orientationAngle;
        this.compactness = compactness;
        this.centerOffset = centerOffset || { x: 0, y: 0 };
        this.spatialBounds = spatialBounds;
        this.naturalSpacing = naturalSpacing;
        this.mergeState = mergeState || (particleCount === 1 ? 'single' : 'clustered');
        this.normalizedDistance = normalizedDistance || (particleCount === 1 ? 0 : 1.0);
        
        // Calculate derived properties
        this.sizePerParticle = totalSize / particleCount;
        this.orientationCategory = this.categorizeOrientation(orientationAngle);
        this.compactnessCategory = this.categorizeCompactness(compactness);
    }

    categorizeOrientation(angle) {
        // Normalize angle to -180 to 180
        const normalized = ((angle % 360) + 360) % 360;
        const finalAngle = normalized > 180 ? normalized - 360 : normalized;
        
        // Based on simulation data, categorize into common bins
        if (Math.abs(finalAngle) <= 15) return 'horizontal';
        if (Math.abs(finalAngle - 90) <= 15 || Math.abs(finalAngle + 90) <= 15) return 'vertical';
        if ((finalAngle >= 45 && finalAngle <= 75) || (finalAngle >= -75 && finalAngle <= -45)) return 'diagonal_ne_sw';
        if ((finalAngle >= 105 && finalAngle <= 135) || (finalAngle >= -135 && finalAngle <= -105)) return 'diagonal_nw_se';
        return 'oblique';
    }

    categorizeCompactness(compactness) {
        if (compactness >= 0.7) return 'tight';
        if (compactness >= 0.4) return 'medium';
        return 'loose';
    }

    /**
     * Calculate how well this texture matches a given cluster of particles
     */
    getMatchScore(particles, targetOrientation = null, targetCompactness = null, targetMergeState = null, targetNormalizedDistance = null) {
        let score = 0;
        
        // Particle count match (most important)
        if (this.particleCount === particles.length) {
            score += 100;
        } else {
            // Penalize size mismatches heavily
            const sizeDiff = Math.abs(this.particleCount - particles.length);
            score -= sizeDiff * 20;
        }

        // Orientation match
        if (targetOrientation !== null) {
            const orientationDiff = Math.abs(this.orientationAngle - targetOrientation);
            const normalizedDiff = Math.min(orientationDiff, 360 - orientationDiff);
            score += (1 - normalizedDiff / 180) * 30; // 0-30 points for orientation
        }

        // Compactness match
        if (targetCompactness !== null) {
            const compactnessDiff = Math.abs(this.compactness - targetCompactness);
            score += (1 - compactnessDiff) * 20; // 0-20 points for compactness
        }

        // Merge state match (critical for smooth transitions)
        if (targetMergeState !== null && this.mergeState === targetMergeState) {
            score += 50; // High bonus for exact merge state match
        }

        // Normalized distance match (for fine-grained merge state selection)
        if (targetNormalizedDistance !== null) {
            const distanceDiff = Math.abs(this.normalizedDistance - targetNormalizedDistance);
            score += (1 - Math.min(1, distanceDiff / 2.0)) * 25; // 0-25 points based on distance similarity
        }

        return Math.max(0, score);
    }

    /**
     * Calculate the proper scale for this texture when representing given particles
     */
    calculateScale(particles, baseParticleScale = 1.0) {
        // Calculate total area that particles should occupy
        const totalParticleArea = particles.reduce((sum, p) => sum + (p.radius * p.radius * Math.PI), 0);
        
        // Calculate expected area based on our metadata
        const expectedArea = this.particleCount * (this.baseParticleSize * this.baseParticleSize * Math.PI);
        
        // Scale factor to match actual particles
        const areaScale = Math.sqrt(totalParticleArea / expectedArea);
        
        return baseParticleScale * areaScale;
    }
}

/**
 * Registry for all texture metadata
 */
class TextureRegistry {
    constructor() {
        this.textures = new Map();
        this.byParticleCount = new Map();
        this.byOrientation = new Map();
        this.byCompactness = new Map();
        this.byMergeState = new Map();
    }

    register(metadata) {
        this.textures.set(metadata.name, metadata);
        
        // Index by particle count
        if (!this.byParticleCount.has(metadata.particleCount)) {
            this.byParticleCount.set(metadata.particleCount, []);
        }
        this.byParticleCount.get(metadata.particleCount).push(metadata);

        // Index by orientation category
        if (!this.byOrientation.has(metadata.orientationCategory)) {
            this.byOrientation.set(metadata.orientationCategory, []);
        }
        this.byOrientation.get(metadata.orientationCategory).push(metadata);

        // Index by compactness category
        if (!this.byCompactness.has(metadata.compactnessCategory)) {
            this.byCompactness.set(metadata.compactnessCategory, []);
        }
        this.byCompactness.get(metadata.compactnessCategory).push(metadata);

        // Index by merge state
        if (!this.byMergeState.has(metadata.mergeState)) {
            this.byMergeState.set(metadata.mergeState, []);
        }
        this.byMergeState.get(metadata.mergeState).push(metadata);
    }

    /**
     * Find the best texture for a given cluster of particles
     */
    findBestTexture(particles, clusterAnalysis = null) {
        if (particles.length === 1) {
            // For singles, just pick a random single texture
            const singles = this.byParticleCount.get(1) || [];
            return singles[Math.floor(Math.random() * singles.length)];
        }

        let candidates = this.byParticleCount.get(particles.length);
        if (!candidates || candidates.length === 0) {
            // Fallback to closest size
            const sizes = Array.from(this.byParticleCount.keys()).sort();
            const closestSize = sizes.reduce((prev, curr) => 
                Math.abs(curr - particles.length) < Math.abs(prev - particles.length) ? curr : prev
            );
            candidates = this.byParticleCount.get(closestSize) || [];
        }

        if (candidates.length === 0) return null;

        // Score each candidate
        let bestTexture = candidates[0];
        let bestScore = -Infinity;

        for (const texture of candidates) {
            const score = texture.getMatchScore(
                particles,
                clusterAnalysis?.orientation,
                clusterAnalysis?.compactness,
                clusterAnalysis?.mergeState,
                clusterAnalysis?.normalizedDistance
            );
            
            if (score > bestScore) {
                bestScore = score;
                bestTexture = texture;
            }
        }

        return bestTexture;
    }

    /**
     * Get all textures of a specific particle count
     */
    getByParticleCount(count) {
        return this.byParticleCount.get(count) || [];
    }

    /**
     * Get statistics about registered textures
     */
    getStatistics() {
        const stats = {
            total: this.textures.size,
            bySize: {},
            byOrientation: {},
            byCompactness: {},
            byMergeState: {}
        };

        for (const [count, textures] of this.byParticleCount) {
            stats.bySize[count] = textures.length;
        }

        for (const [orientation, textures] of this.byOrientation) {
            stats.byOrientation[orientation] = textures.length;
        }

        for (const [compactness, textures] of this.byCompactness) {
            stats.byCompactness[compactness] = textures.length;
        }

        for (const [mergeState, textures] of this.byMergeState) {
            stats.byMergeState[mergeState] = textures.length;
        }

        return stats;
    }
}

/**
 * Utility functions for cluster analysis
 */
class ClusterAnalyzer {
    /**
     * Analyze the spatial properties of a particle cluster
     */
    static analyze(particles) {
        if (particles.length <= 1) return null;

        // Calculate center
        const centerX = particles.reduce((sum, p) => sum + p.x, 0) / particles.length;
        const centerY = particles.reduce((sum, p) => sum + p.y, 0) / particles.length;

        // Calculate primary orientation
        let weightedAngle = 0;
        let totalWeight = 0;
        
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    const weight = 1 / (distance + 1); // Closer particles have more weight
                    
                    weightedAngle += angle * weight;
                    totalWeight += weight;
                }
            }
        }
        
        const orientation = totalWeight > 0 ? weightedAngle / totalWeight : 0;

        // Calculate compactness
        const distances = [];
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                distances.push(distance);
            }
        }
        
        if (distances.length === 0) return { orientation: 0, compactness: 1 };
        
        const minDist = Math.min(...distances);
        const maxDist = Math.max(...distances);
        const compactness = maxDist > 0 ? minDist / maxDist : 1;

        // Calculate merge state based on average normalized distance
        let mergeState = 'single';
        let avgNormalizedDistance = 0;
        
        if (particles.length >= 2) {
            let totalNormalizedDistance = 0;
            let pairCount = 0;
            
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const p1 = particles[i];
                    const p2 = particles[j];
                    const distance = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
                    const combinedRadius = (p1.radius || 16) + (p2.radius || 16);
                    totalNormalizedDistance += distance / combinedRadius;
                    pairCount++;
                }
            }
            
            avgNormalizedDistance = totalNormalizedDistance / pairCount;
            
            // Classify merge state
            if (avgNormalizedDistance >= 2.0) mergeState = 'approaching';
            else if (avgNormalizedDistance >= 1.5) mergeState = 'close';
            else if (avgNormalizedDistance >= 1.2) mergeState = 'touching';
            else if (avgNormalizedDistance >= 0.8) mergeState = 'merging';
            else if (avgNormalizedDistance >= 0.4) mergeState = 'nearly_merged';
            else mergeState = 'fully_merged';
        }

        return {
            centerX,
            centerY,
            orientation,
            compactness,
            minDistance: minDist,
            maxDistance: maxDist,
            mergeState,
            normalizedDistance: avgNormalizedDistance
        };
    }
}

module.exports = {
    TextureMetadata,
    TextureRegistry,
    ClusterAnalyzer
};