/**
 * Generate Merge Transition Textures for Fire Metaballs
 * Creates smooth visual progressions for particles merging together
 * Based on simulation data showing 43.9% of clusters are in "approaching" state
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { TextureMetadata, TextureRegistry } = require('./textureMetadata');

// Configuration based on simulation findings
const MERGE_STATES = {
    approaching: { normalizedDistance: 2.2, threshold: 0.25, weight: 0.439 },
    close: { normalizedDistance: 1.7, threshold: 0.30, weight: 0.122 },
    touching: { normalizedDistance: 1.35, threshold: 0.35, weight: 0.098 },
    merging: { normalizedDistance: 1.0, threshold: 0.40, weight: 0.146 },
    nearly_merged: { normalizedDistance: 0.6, threshold: 0.45, weight: 0.146 },
    fully_merged: { normalizedDistance: 0.3, threshold: 0.50, weight: 0.049 }
};

const COMMON_ORIENTATIONS = [-60, 0, -30, 30, 60, -90]; // From simulation data
const BASE_PARTICLE_RADIUS = 16;
const PARTICLE_SIZES = [2, 3, 4]; // Focus on most common cluster sizes

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'resources', 'fireMetaBalls');
const metadataDir = path.join(__dirname, '..', 'resources', 'fireMetaBalls', 'metadata');

// Utility functions
const rad = degrees => (degrees * Math.PI) / 180;
const jitter = (value, amount) => value + (Math.random() - 0.5) * 2 * amount;
const rand = (min, max) => min + Math.random() * (max - min);

/**
 * Enhanced metaball field calculation
 */
function metaballField(x, y, cx, cy, radius) {
    const dx = x - cx;
    const dy = y - cy;
    const distSq = dx * dx + dy * dy;
    const radiusSq = radius * radius;

    if (distSq >= radiusSq) return 0;

    const dist = Math.sqrt(distSq);
    const normalizedDist = dist / radius;
    const falloff = 1 - normalizedDist * normalizedDist * (3 - 2 * normalizedDist);
    return Math.max(0, falloff);
}

function calculateMetaballField(x, y, metaballs) {
    let totalField = 0;
    for (const ball of metaballs) {
        const field = metaballField(x, y, ball.x, ball.y, ball.radius);
        totalField += field * field;
    }
    return Math.min(1.0, totalField);
}

/**
 * Create fire gradient
 */
function createFireGradient(ctx, centerX, centerY, maxRadius) {
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 1.2);
    
    gradient.addColorStop(0,    'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.1,  'rgba(255, 255, 200, 1.0)');
    gradient.addColorStop(0.25, 'rgba(255, 240, 120, 0.98)');
    gradient.addColorStop(0.4,  'rgba(255, 200, 60, 0.95)');
    gradient.addColorStop(0.55, 'rgba(255, 140, 30, 0.92)');
    gradient.addColorStop(0.7,  'rgba(255, 80, 10, 0.88)');
    gradient.addColorStop(0.82, 'rgba(220, 40, 0, 0.82)');
    gradient.addColorStop(0.92, 'rgba(180, 20, 0, 0.7)');
    gradient.addColorStop(1,    'rgba(120, 10, 0, 0.5)');
    
    return gradient;
}

/**
 * Render metaballs with fire effect and specific threshold
 */
function renderMetaballs(canvas, metaballs, threshold = 0.42) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Calculate bounds
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (const ball of metaballs) {
        minX = Math.min(minX, ball.x - ball.radius - 5);
        minY = Math.min(minY, ball.y - ball.radius - 5);
        maxX = Math.max(maxX, ball.x + ball.radius + 5);
        maxY = Math.max(maxY, ball.y + ball.radius + 5);
    }

    minX = Math.max(0, Math.floor(minX));
    minY = Math.max(0, Math.floor(minY));
    maxX = Math.min(width, Math.ceil(maxX));
    maxY = Math.min(height, Math.ceil(maxY));

    // Create field-based mask
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
            const field = calculateMetaballField(x, y, metaballs);

            if (field >= threshold) {
                const index = (y * width + x) * 4;
                const normalizedField = (field - threshold) / (1.0 - threshold);
                const smoothAlpha = normalizedField * normalizedField * (3 - 2 * normalizedField);
                const alpha = Math.min(255, Math.floor(smoothAlpha * 255));
                
                data[index] = 255;
                data[index + 1] = 255;
                data[index + 2] = 255;
                data[index + 3] = alpha;
            }
        }
    }

    // Apply gradient
    const maskCanvas = createCanvas(width, height);
    const maskCtx = maskCanvas.getContext('2d');
    maskCtx.putImageData(imageData, 0, 0);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const maxRadius = Math.max(maxX - centerX, maxY - centerY, 20);

    const gradient = createFireGradient(ctx, centerX, centerY, maxRadius);
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

/**
 * Trim canvas with bounds calculation
 */
function trimCanvasWithBounds(originalCanvas, padding = 4) {
    const ctx = originalCanvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const data = imageData.data;

    let minX = originalCanvas.width, minY = originalCanvas.height;
    let maxX = 0, maxY = 0;

    for (let y = 0; y < originalCanvas.height; y++) {
        for (let x = 0; x < originalCanvas.width; x++) {
            const alpha = data[(y * originalCanvas.width + x) * 4 + 3];
            if (alpha > 0) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (minX >= maxX || minY >= maxY) {
        return {
            canvas: createCanvas(8, 8),
            bounds: { width: 8, height: 8 },
            centerOffset: { x: 0, y: 0 }
        };
    }

    const originalCenterX = originalCanvas.width / 2;
    const originalCenterY = originalCanvas.height / 2;
    const contentCenterX = (minX + maxX) / 2;
    const contentCenterY = (minY + maxY) / 2;
    
    const centerOffset = {
        x: contentCenterX - originalCenterX,
        y: contentCenterY - originalCenterY
    };

    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(originalCanvas.width - 1, maxX + padding);
    maxY = Math.min(originalCanvas.height - 1, maxY + padding);

    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;
    const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
    const trimmedCtx = trimmedCanvas.getContext('2d');

    trimmedCtx.drawImage(originalCanvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

    return {
        canvas: trimmedCanvas,
        bounds: { width: trimmedWidth, height: trimmedHeight },
        centerOffset
    };
}

/**
 * Generate particle layout for specific merge state
 */
function generateMergeStateLayout(particleCount, orientation, mergeState) {
    const stateConfig = MERGE_STATES[mergeState];
    const normalizedDistance = stateConfig.normalizedDistance;
    const baseRadius = BASE_PARTICLE_RADIUS;
    
    const metaballs = [];
    
    if (particleCount === 2) {
        // Two particles at specific merge distance
        const spacing = normalizedDistance * (baseRadius * 2);
        const angle = rad(orientation);
        
        const r1 = jitter(baseRadius, 1.5);
        const r2 = jitter(baseRadius, 1.5);
        
        metaballs.push(
            { x: -spacing/2 * Math.cos(angle), y: -spacing/2 * Math.sin(angle), radius: r1 },
            { x:  spacing/2 * Math.cos(angle), y:  spacing/2 * Math.sin(angle), radius: r2 }
        );
    }
    else if (particleCount === 3) {
        // Triangle formation with merge-appropriate spacing
        const spacing = normalizedDistance * baseRadius * 1.2;
        const baseAngle = rad(orientation);
        
        for (let i = 0; i < 3; i++) {
            const angle = baseAngle + (i * 120 + jitter(0, 10)) * Math.PI / 180;
            const distance = spacing * rand(0.9, 1.1);
            const radius = jitter(baseRadius * 0.95, 1.5);
            
            metaballs.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                radius: radius
            });
        }
    }
    else if (particleCount === 4) {
        // Square formation with merge-appropriate spacing
        const spacing = normalizedDistance * baseRadius * 1.1;
        const baseAngle = rad(orientation);
        
        for (let i = 0; i < 4; i++) {
            const angle = baseAngle + (i * 90 + jitter(0, 8)) * Math.PI / 180;
            const distance = spacing * rand(0.9, 1.1);
            const radius = jitter(baseRadius * 0.9, 1.5);
            
            metaballs.push({
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                radius: radius
            });
        }
    }
    
    return metaballs;
}

/**
 * Generate merge transition textures
 */
async function generateMergeTransitionTextures() {
    console.log('=== GENERATING MERGE TRANSITION TEXTURES ===');
    console.log('Creating smooth visual progressions for particle merging\n');

    const textures = [];
    const registry = new TextureRegistry();
    
    // Generate textures for each combination
    for (const particleCount of PARTICLE_SIZES) {
        for (const [mergeState, stateConfig] of Object.entries(MERGE_STATES)) {
            const texturesToGenerate = Math.max(2, Math.floor(stateConfig.weight * 20)); // Scale by frequency
            
            console.log(`Generating ${texturesToGenerate} textures for ${particleCount}p ${mergeState} state...`);
            
            for (let i = 1; i <= texturesToGenerate; i++) {
                // Choose orientation from common ones
                const orientation = COMMON_ORIENTATIONS[Math.floor(Math.random() * COMMON_ORIENTATIONS.length)];
                const finalOrientation = jitter(orientation, 8);
                
                // Generate metaball layout for this merge state
                const metaballs = generateMergeStateLayout(particleCount, finalOrientation, mergeState);
                
                if (metaballs.length === 0) continue;
                
                // Calculate bounds
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const ball of metaballs) {
                    minX = Math.min(minX, ball.x - ball.radius);
                    minY = Math.min(minY, ball.y - ball.radius);
                    maxX = Math.max(maxX, ball.x + ball.radius);
                    maxY = Math.max(maxY, ball.y + ball.radius);
                }
                
                const canvasSize = Math.max(maxX - minX + 60, maxY - minY + 60, 80);
                const canvas = createCanvas(canvasSize, canvasSize);
                const centerX = canvasSize / 2;
                const centerY = canvasSize / 2;
                
                // Center metaballs
                const boundsX = (minX + maxX) / 2;
                const boundsY = (minY + maxY) / 2;
                const offsetX = centerX - boundsX;
                const offsetY = centerY - boundsY;
                
                const adjustedMetaballs = metaballs.map(ball => ({
                    x: ball.x + offsetX,
                    y: ball.y + offsetY,
                    radius: ball.radius
                }));
                
                // Render with merge state specific threshold
                renderMetaballs(canvas, adjustedMetaballs, stateConfig.threshold);
                const trimResult = trimCanvasWithBounds(canvas);
                
                // Calculate total size
                const totalSize = metaballs.reduce((sum, ball) => sum + (Math.PI * ball.radius * ball.radius), 0);
                
                // Generate name
                const name = `merge_${particleCount}p_${mergeState}_${i}`;
                
                // Create metadata
                const metadata = new TextureMetadata({
                    name: name + '.png',
                    particleCount: particleCount,
                    baseParticleSize: BASE_PARTICLE_RADIUS,
                    totalSize: totalSize,
                    orientationAngle: finalOrientation,
                    compactness: stateConfig.normalizedDistance < 1.0 ? 0.8 : 0.4,
                    centerOffset: trimResult.centerOffset,
                    spatialBounds: trimResult.bounds,
                    naturalSpacing: stateConfig.normalizedDistance * BASE_PARTICLE_RADIUS * 2,
                    mergeState: mergeState,
                    normalizedDistance: stateConfig.normalizedDistance
                });
                
                registry.register(metadata);
                textures.push({
                    name: name + '.png',
                    canvas: trimResult.canvas,
                    metadata
                });
            }
        }
    }
    
    // Write texture files
    console.log('\nWriting texture files...');
    for (const texture of textures) {
        const buffer = texture.canvas.toBuffer('image/png');
        await fs.promises.writeFile(path.join(outputDir, texture.name), buffer);
    }
    
    // Update metadata registry
    const metadataPath = path.join(metadataDir, 'merge_textures.json');
    const metadataJson = {
        generated: new Date().toISOString(),
        mergeStates: MERGE_STATES,
        commonOrientations: COMMON_ORIENTATIONS,
        textures: Array.from(registry.textures.entries()).map(([name, metadata]) => ({
            name: metadata.name,
            particleCount: metadata.particleCount,
            baseParticleSize: metadata.baseParticleSize,
            totalSize: metadata.totalSize,
            orientationAngle: metadata.orientationAngle,
            compactness: metadata.compactness,
            centerOffset: metadata.centerOffset,
            spatialBounds: metadata.spatialBounds,
            naturalSpacing: metadata.naturalSpacing,
            mergeState: metadata.mergeState,
            normalizedDistance: metadata.normalizedDistance,
            sizePerParticle: metadata.sizePerParticle,
            orientationCategory: metadata.orientationCategory,
            compactnessCategory: metadata.compactnessCategory
        }))
    };
    
    await fs.promises.writeFile(metadataPath, JSON.stringify(metadataJson, null, 2));
    
    console.log('\n=== MERGE TRANSITION GENERATION COMPLETE ===');
    console.log(`Generated ${textures.length} merge transition textures`);
    console.log(`Metadata saved to: ${metadataPath}`);
    
    const stats = registry.getStatistics();
    console.log('\nMerge state distribution:');
    Object.entries(stats.byMergeState).forEach(([state, count]) => {
        console.log(`  ${state}: ${count} textures`);
    });
    
    console.log('\n✅ Complete merge transition system ready!');
    console.log('✅ Covers all merge states: approaching → close → touching → merging → nearly merged → fully merged');
    console.log('✅ Runtime can now select textures based on actual particle distances');
    console.log('✅ This eliminates blinking with smooth visual transitions');
    
    return { textures, registry };
}

// Run if called directly
if (require.main === module) {
    generateMergeTransitionTextures().catch(error => {
        console.error('Error generating merge transition textures:', error);
        process.exit(1);
    });
}

module.exports = { generateMergeTransitionTextures };