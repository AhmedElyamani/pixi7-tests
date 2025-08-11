const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Helper function to trim canvas to actual content bounds
function trimCanvas(originalCanvas, padding = 2) {
  const ctx = originalCanvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  const data = imageData.data;
  
  let minX = originalCanvas.width, minY = originalCanvas.height;
  let maxX = 0, maxY = 0;
  
  // Find bounds of non-transparent pixels
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
  
  // If no content found, return small canvas
  if (minX >= maxX || minY >= maxY) {
    const emptyCanvas = createCanvas(4, 4);
    return emptyCanvas;
  }
  
  // Add padding
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(originalCanvas.width - 1, maxX + padding);
  maxY = Math.min(originalCanvas.height - 1, maxY + padding);
  
  // Create trimmed canvas
  const trimmedWidth = maxX - minX + 1;
  const trimmedHeight = maxY - minY + 1;
  const trimmedCanvas = createCanvas(trimmedWidth, trimmedHeight);
  const trimmedCtx = trimmedCanvas.getContext('2d');
  
  // Copy content
  trimmedCtx.drawImage(originalCanvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);
  
  return trimmedCanvas;
}

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'resources', 'fireParticles');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper function to create horizontal flame-like curves (pointing right, 0° rotation)
function drawHorizontalFlameShape(ctx, baseX, centerY, width, height, wiggleFactor = 0.3, points = 12) {
  ctx.beginPath();
  
  const halfHeight = height / 2;
  const topY = centerY - halfHeight;
  const bottomY = centerY + halfHeight;
  const tipX = baseX + width;
  
  // Start at bottom left (base)
  ctx.moveTo(baseX, bottomY);
  
  // Create flame outline using curves
  const topPoints = [];
  const bottomPoints = [];
  
  // Generate top side points (base to tip)
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = baseX + (t * width);
    const baseY = topY + (t * t * halfHeight); // Curve inward as we go right
    const wiggle = Math.sin(t * Math.PI * 2) * wiggleFactor * (1 - t) * height;
    topPoints.push({ x, y: baseY + wiggle });
  }
  
  // Generate bottom side points (tip to base)
  for (let i = points; i >= 0; i--) {
    const t = i / points;
    const x = baseX + (t * width);
    const baseY = bottomY - (t * t * halfHeight); // Curve inward as we go right
    const wiggle = Math.sin(t * Math.PI * 2 + Math.PI) * wiggleFactor * (1 - t) * height;
    bottomPoints.push({ x, y: baseY + wiggle });
  }
  
  // Draw top side with curves
  ctx.moveTo(topPoints[0].x, topPoints[0].y);
  for (let i = 1; i < topPoints.length; i++) {
    const cp1x = topPoints[i-1].x;
    const cp1y = topPoints[i-1].y + (topPoints[i].y - topPoints[i-1].y) * 0.5;
    const cp2x = topPoints[i].x;
    const cp2y = topPoints[i].y - (topPoints[i].y - topPoints[i-1].y) * 0.5;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, topPoints[i].x, topPoints[i].y);
  }
  
  // Draw bottom side with curves
  for (let i = 1; i < bottomPoints.length; i++) {
    const cp1x = bottomPoints[i-1].x;
    const cp1y = bottomPoints[i-1].y + (bottomPoints[i].y - bottomPoints[i-1].y) * 0.5;
    const cp2x = bottomPoints[i].x;
    const cp2y = bottomPoints[i].y - (bottomPoints[i].y - bottomPoints[i-1].y) * 0.5;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, bottomPoints[i].x, bottomPoints[i].y);
  }
  
  ctx.closePath();
}

// Helper function to create thin, wavy lick shapes (pointing right, 0° rotation)
function drawLickShape(ctx, baseX, centerY, width, height, waveFactor = 0.5, waves = 3) {
  ctx.beginPath();
  
  const halfHeight = height / 2;
  const points = Math.max(20, Math.floor(width / 3)); // More points for smoother curves
  
  // Create serpentine lick with multiple waves along the length
  const topPoints = [];
  const bottomPoints = [];
  
  // Generate wavy lick points
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const x = baseX + (t * width);
    
    // Create multiple sine waves along the length for serpentine effect
    const wave1 = Math.sin(t * Math.PI * waves) * waveFactor;
    const wave2 = Math.sin(t * Math.PI * waves * 1.7 + Math.PI/3) * waveFactor * 0.6;
    const totalWave = (wave1 + wave2) * (1 - t * 0.3); // Reduce waves toward tip
    
    // Taper the lick from base to tip
    const taperFactor = Math.max(0.1, 1 - t * 0.7);
    const currentHalfHeight = halfHeight * taperFactor;
    
    topPoints.push({ 
      x, 
      y: centerY - currentHalfHeight + totalWave 
    });
    bottomPoints.unshift({ 
      x, 
      y: centerY + currentHalfHeight + totalWave 
    });
  }
  
  // Draw the lick shape
  const allPoints = [...topPoints, ...bottomPoints];
  ctx.moveTo(allPoints[0].x, allPoints[0].y);
  
  for (let i = 1; i < allPoints.length; i++) {
    const prev = allPoints[i-1];
    const curr = allPoints[i];
    const next = allPoints[i+1] || curr;
    
    // Use quadratic curves for smoother lick shape
    const cp1x = prev.x + (curr.x - prev.x) * 0.5;
    const cp1y = prev.y + (curr.y - prev.y) * 0.5;
    
    ctx.quadraticCurveTo(cp1x, cp1y, curr.x, curr.y);
  }
  
  ctx.closePath();
}

// Helper function to create flame-like curves (old vertical version - keep for reference)
function drawFlameShape(ctx, centerX, baseY, width, height, wiggleFactor = 0.3, points = 12) {
  ctx.beginPath();
  
  const halfWidth = width / 2;
  const leftX = centerX - halfWidth;
  const rightX = centerX + halfWidth;
  const topY = baseY - height;
  
  // Start at bottom left
  ctx.moveTo(leftX, baseY);
  
  // Create flame outline using curves
  const leftPoints = [];
  const rightPoints = [];
  
  // Generate left side points (bottom to top)
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const y = baseY - (t * height);
    const baseX = leftX + (t * t * halfWidth); // Curve inward as we go up
    const wiggle = Math.sin(t * Math.PI * 2) * wiggleFactor * (1 - t) * width;
    leftPoints.push({ x: baseX + wiggle, y });
  }
  
  // Generate right side points (top to bottom)
  for (let i = points; i >= 0; i--) {
    const t = i / points;
    const y = baseY - (t * height);
    const baseX = rightX - (t * t * halfWidth); // Curve inward as we go up
    const wiggle = Math.sin(t * Math.PI * 2 + Math.PI) * wiggleFactor * (1 - t) * width;
    rightPoints.push({ x: baseX + wiggle, y });
  }
  
  // Draw left side with curves
  ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
  for (let i = 1; i < leftPoints.length; i++) {
    const cp1x = leftPoints[i-1].x + (leftPoints[i].x - leftPoints[i-1].x) * 0.5;
    const cp1y = leftPoints[i-1].y;
    const cp2x = leftPoints[i].x - (leftPoints[i].x - leftPoints[i-1].x) * 0.5;
    const cp2y = leftPoints[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, leftPoints[i].x, leftPoints[i].y);
  }
  
  // Draw right side with curves
  for (let i = 1; i < rightPoints.length; i++) {
    const cp1x = rightPoints[i-1].x + (rightPoints[i].x - rightPoints[i-1].x) * 0.5;
    const cp1y = rightPoints[i-1].y;
    const cp2x = rightPoints[i].x - (rightPoints[i].x - rightPoints[i-1].x) * 0.5;
    const cp2y = rightPoints[i].y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, rightPoints[i].x, rightPoints[i].y);
  }
  
  ctx.closePath();
}

// Create realistic base fire variations
function createRealisticBaseFireVariations() {
  const variations = [];
  
  for (let i = 1; i <= 6; i++) {
    const tempCanvas = createCanvas(120, 80); // Horizontal orientation: wider than tall
    const ctx = tempCanvas.getContext('2d');
    
    // Create horizontal gradient from left (base) to right (tip)
    const gradient = ctx.createLinearGradient(10, 40, 110, 40);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // White hot center at base
    gradient.addColorStop(0.15, 'rgba(255, 255, 150, 1)'); // Light yellow
    gradient.addColorStop(0.3, 'rgba(255, 200, 50, 1)');   // Yellow-orange
    gradient.addColorStop(0.5, 'rgba(255, 120, 0, 0.95)'); // Orange
    gradient.addColorStop(0.7, 'rgba(255, 60, 0, 0.8)');   // Red-orange
    gradient.addColorStop(0.9, 'rgba(180, 20, 0, 0.6)');   // Dark red
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0.2)');      // Very dark red edge
    
    ctx.fillStyle = gradient;
    
    // Draw horizontal flame shape with variations
    const wiggleFactor = 0.2 + Math.random() * 0.3;
    const width = 70 + Math.random() * 30; // Length of the flame
    const height = 30 + Math.random() * 15; // Height/thickness of the flame
    
    drawHorizontalFlameShape(ctx, 10, 40, width, height, wiggleFactor, 16);
    ctx.fill();
    
    // Add some inner flame details
    const innerGradient = ctx.createLinearGradient(15, 40, 85, 40);
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    innerGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.6)');
    innerGradient.addColorStop(1, 'rgba(255, 150, 0, 0)');
    
    ctx.fillStyle = innerGradient;
    drawHorizontalFlameShape(ctx, 15, 40, width * 0.7, height * 0.6, wiggleFactor * 0.5, 12);
    ctx.fill();
    
    // Trim and save
    const trimmedCanvas = trimCanvas(tempCanvas);
    variations.push({
      name: `fire_base_${i}.png`,
      canvas: trimmedCanvas
    });
  }
  
  return variations;
}

// Create dancing flame lick variations (horizontal, thin, wavy)
function createDancingFlameLickVariations() {
  const variations = [];
  
  for (let i = 1; i <= 8; i++) {
    const tempCanvas = createCanvas(100, 40); // Horizontal orientation: much wider than tall
    const ctx = tempCanvas.getContext('2d');
    
    // Create horizontal gradient for flame lick (more orange/yellow tones than base fire)
    const gradient = ctx.createLinearGradient(5, 20, 95, 20);
    gradient.addColorStop(0, `rgba(255, ${220 + Math.floor(Math.random() * 35)}, ${150 + Math.floor(Math.random() * 105)}, 1)`);
    gradient.addColorStop(0.2, `rgba(255, ${200 + Math.floor(Math.random() * 55)}, ${80 + Math.floor(Math.random() * 70)}, 0.95)`);
    gradient.addColorStop(0.5, `rgba(255, ${150 + Math.floor(Math.random() * 80)}, ${20 + Math.floor(Math.random() * 40)}, 0.85)`);
    gradient.addColorStop(0.8, `rgba(${220 + Math.floor(Math.random() * 35)}, ${80 + Math.floor(Math.random() * 40)}, 0, 0.7)`);
    gradient.addColorStop(1, `rgba(${180 + Math.floor(Math.random() * 40)}, 20, 0, 0.4)`);
    
    ctx.fillStyle = gradient;
    
    // Create thin, wavy lick shape (much thinner than base fire)
    const width = 70 + Math.random() * 20; // Length of the lick
    const height = 8 + Math.random() * 7; // Very thin height (8-15px vs 30-45px for bases)
    const waveFactor = 0.4 + Math.random() * 0.6; // More wavy than base fire
    const waves = 2 + Math.random() * 2; // 2-4 waves along the length
    
    // Small vertical offset for variety
    const centerY = 18 + (Math.random() - 0.5) * 8;
    
    drawLickShape(ctx, 5, centerY, width, height, waveFactor, waves);
    ctx.fill();
    
    // Trim and save
    const trimmedCanvas = trimCanvas(tempCanvas);
    variations.push({
      name: `fire_lick_${i}.png`,
      canvas: trimmedCanvas
    });
  }
  
  return variations;
}

// Create varied spark textures
function createVariedSparkVariations() {
  const variations = [];
  
  for (let i = 1; i <= 10; i++) {
    const size = 8 + Math.floor(Math.random() * 8); // 8-15 pixel size
    const tempCanvas = createCanvas(size * 2, size * 2);
    const ctx = tempCanvas.getContext('2d');
    
    const centerX = size;
    const centerY = size;
    
    if (Math.random() > 0.6) {
      // Star-shaped sparks (30% chance)
      const spikes = 4 + Math.floor(Math.random() * 4); // 4-7 spikes
      const outerRadius = size * 0.8;
      const innerRadius = size * 0.3;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, outerRadius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 100, 0.9)');
      gradient.addColorStop(0.7, 'rgba(255, 150, 0, 0.7)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0.2)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      
      for (let j = 0; j < spikes * 2; j++) {
        const radius = j % 2 === 0 ? outerRadius : innerRadius;
        const angle = (j / (spikes * 2)) * Math.PI * 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
    } else if (Math.random() > 0.3) {
      // Irregular blob sparks (60% chance)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, `rgba(255, ${200 + Math.floor(Math.random() * 55)}, ${Math.floor(Math.random() * 100)}, 0.9)`);
      gradient.addColorStop(0.8, `rgba(255, ${100 + Math.floor(Math.random() * 100)}, 0, 0.7)`);
      gradient.addColorStop(1, 'rgba(200, 0, 0, 0.2)');
      
      ctx.fillStyle = gradient;
      
      // Draw irregular blob
      const points = 8 + Math.floor(Math.random() * 4);
      ctx.beginPath();
      for (let j = 0; j < points; j++) {
        const angle = (j / points) * Math.PI * 2;
        const radius = size * (0.5 + Math.random() * 0.5);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      
    } else {
      // Simple circular sparks (10% chance)
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, `rgba(255, 255, ${Math.floor(Math.random() * 100)}, 0.9)`);
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Trim and save
    const trimmedCanvas = trimCanvas(tempCanvas);
    variations.push({
      name: `fire_spark_${i}.png`,
      canvas: trimmedCanvas
    });
  }
  
  return variations;
}

// Create glowing ember variations with realistic shapes
function createGlowingEmberVariations() {
  const variations = [];
  
  for (let i = 1; i <= 6; i++) {
    const tempCanvas = createCanvas(24, 24);
    const ctx = tempCanvas.getContext('2d');
    
    const centerX = 12;
    const centerY = 12;
    
    // Create ember gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 12);
    gradient.addColorStop(0, `rgba(255, ${150 + Math.floor(Math.random() * 105)}, 100, 1)`);
    gradient.addColorStop(0.2, `rgba(255, ${120 + Math.floor(Math.random() * 80)}, 50, 0.95)`);
    gradient.addColorStop(0.5, `rgba(${220 + Math.floor(Math.random() * 35)}, 80, 0, 0.8)`);
    gradient.addColorStop(0.8, `rgba(180, 40, 0, 0.6)`);
    gradient.addColorStop(1, 'rgba(80, 0, 0, 0.2)');
    
    ctx.fillStyle = gradient;
    
    if (Math.random() > 0.5) {
      // Irregular ember chunk
      const points = 6 + Math.floor(Math.random() * 4);
      ctx.beginPath();
      for (let j = 0; j < points; j++) {
        const angle = (j / points) * Math.PI * 2;
        const radius = 6 + Math.random() * 4;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (j === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Elongated ember (no rotation - let emitter handle orientation)
      const width = 8 + Math.random() * 6;
      const height = 6 + Math.random() * 4;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width, height, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Trim and save
    const trimmedCanvas = trimCanvas(tempCanvas);
    variations.push({
      name: `fire_ember_${i}.png`,
      canvas: trimmedCanvas
    });
  }
  
  return variations;
}

// Clear existing files and generate new realistic fire textures
async function generateRealisticFireTextures() {
  console.log('Clearing existing fire textures...');
  
  // Clear existing files
  try {
    const files = await fs.promises.readdir(outputDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        await fs.promises.unlink(path.join(outputDir, file));
      }
    }
  } catch (error) {
    // Directory might not exist or be empty, that's fine
  }
  
  console.log('Generating realistic fire texture variations...');
  
  const allVariations = [
    ...createRealisticBaseFireVariations(),
    ...createDancingFlameLickVariations(),
    ...createVariedSparkVariations(),
    ...createGlowingEmberVariations()
  ];
  
  for (const variation of allVariations) {
    const buffer = variation.canvas.toBuffer('image/png');
    const filePath = path.join(outputDir, variation.name);
    await fs.promises.writeFile(filePath, buffer);
    console.log(`Generated ${variation.name}`);
  }
  
  console.log(`Generated ${allVariations.length} realistic fire texture variations in resources/fireParticles/`);
}

// Run the generation
generateRealisticFireTextures().catch(error => {
  console.error('Error generating realistic fire texture variations:', error);
});