const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'resources', 'fireParticles');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create base fire variations (large, solid flames)
function createBaseFireVariations() {
  const variations = [];
  
  for (let i = 1; i <= 4; i++) {
    const canvas = createCanvas(64, 80);
    const ctx = canvas.getContext('2d');
    
    // Vary the gradient positions and colors slightly
    const centerX = 32 + (Math.random() - 0.5) * 8;
    const centerY = 70 + (Math.random() - 0.5) * 8;
    const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY - 30, 40);
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, `rgba(255, 255, ${Math.floor(Math.random() * 50)}, 1)`);
    gradient.addColorStop(0.4, `rgba(255, ${Math.floor(165 + Math.random() * 90)}, 0, 1)`);
    gradient.addColorStop(0.7, `rgba(255, ${Math.floor(69 + Math.random() * 50)}, 0, 0.9)`);
    gradient.addColorStop(1, `rgba(${Math.floor(139 + Math.random() * 50)}, 0, 0, 0.3)`);
    
    ctx.fillStyle = gradient;
    
    // Draw flame shape with variations
    const scale = 0.8 + Math.random() * 0.4;
    const offsetX = (Math.random() - 0.5) * 6;
    
    ctx.beginPath();
    ctx.ellipse(32 + offsetX, 65, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(32 + offsetX, 50, 20 * scale, 18 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(32 + offsetX, 30, 15 * scale, 15 * scale, 0, 0, Math.PI * 2);
    ctx.ellipse(32 + offsetX, 15, 8 * scale, 10 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    variations.push({
      name: `fire_base_${i}.png`,
      canvas: canvas
    });
  }
  
  return variations;
}

// Create flame lick variations (tall, wispy flames)
function createFlameLickVariations() {
  const variations = [];
  
  for (let i = 1; i <= 6; i++) {
    const canvas = createCanvas(32, 64);
    const ctx = canvas.getContext('2d');
    
    // Create linear gradient with variations
    const gradient = ctx.createLinearGradient(0, 64, Math.random() * 10 - 5, Math.random() * 10);
    gradient.addColorStop(0, `rgba(255, 255, ${Math.floor(Math.random() * 100)}, 1)`);
    gradient.addColorStop(0.3, `rgba(255, ${Math.floor(165 + Math.random() * 90)}, 0, 0.9)`);
    gradient.addColorStop(0.6, `rgba(255, ${Math.floor(69 + Math.random() * 100)}, 0, 0.7)`);
    gradient.addColorStop(1, `rgba(255, ${Math.floor(Math.random() * 100)}, 0, 0.4)`);
    
    ctx.fillStyle = gradient;
    
    // Draw wispy flame shape with variations
    const wiggle = (Math.random() - 0.5) * 8;
    const stretch = 0.7 + Math.random() * 0.6;
    
    ctx.beginPath();
    ctx.ellipse(16 + wiggle * 0.2, 55, 12 * stretch, 9, 0, 0, Math.PI * 2);
    ctx.ellipse(16 + wiggle * 0.4, 40, 8 * stretch, 12, 0, 0, Math.PI * 2);
    ctx.ellipse(16 + wiggle * 0.6, 25, 6 * stretch, 10, 0, 0, Math.PI * 2);
    ctx.ellipse(16 + wiggle, 10, 4 * stretch, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    variations.push({
      name: `fire_lick_${i}.png`,
      canvas: canvas
    });
  }
  
  return variations;
}

// Create spark variations (small, bright particles)
function createSparkVariations() {
  const variations = [];
  
  for (let i = 1; i <= 8; i++) {
    const size = 6 + Math.floor(Math.random() * 4); // 6-9 pixel size
    const canvas = createCanvas(size * 2, size * 2);
    const ctx = canvas.getContext('2d');
    
    const centerX = size;
    const centerY = size;
    
    // Create radial gradient with variations
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
    
    if (Math.random() > 0.5) {
      // White-yellow sparks
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.4, `rgba(255, 255, ${Math.floor(Math.random() * 100)}, 0.9)`);
      gradient.addColorStop(0.8, `rgba(255, ${Math.floor(165 + Math.random() * 90)}, 0, 0.7)`);
      gradient.addColorStop(1, 'rgba(255, 69, 0, 0.2)');
    } else {
      // Orange-red sparks
      gradient.addColorStop(0, `rgba(255, ${Math.floor(200 + Math.random() * 55)}, 100, 1)`);
      gradient.addColorStop(0.4, `rgba(255, ${Math.floor(150 + Math.random() * 105)}, 0, 0.9)`);
      gradient.addColorStop(0.8, `rgba(255, ${Math.floor(69 + Math.random() * 100)}, 0, 0.7)`);
      gradient.addColorStop(1, 'rgba(200, 0, 0, 0.2)');
    }
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size - 1, 0, Math.PI * 2);
    ctx.fill();
    
    variations.push({
      name: `fire_spark_${i}.png`,
      canvas: canvas
    });
  }
  
  return variations;
}

// Generate ember variations (medium-sized glowing particles)
function createEmberVariations() {
  const variations = [];
  
  for (let i = 1; i <= 4; i++) {
    const canvas = createCanvas(16, 16);
    const ctx = canvas.getContext('2d');
    
    // Create radial gradient for ember
    const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
    gradient.addColorStop(0, `rgba(255, ${Math.floor(150 + Math.random() * 105)}, 50, 1)`);
    gradient.addColorStop(0.3, `rgba(255, ${Math.floor(100 + Math.random() * 100)}, 0, 0.9)`);
    gradient.addColorStop(0.7, `rgba(${Math.floor(200 + Math.random() * 55)}, 50, 0, 0.7)`);
    gradient.addColorStop(1, 'rgba(100, 0, 0, 0.3)');
    
    ctx.fillStyle = gradient;
    
    // Draw ember shape (slightly irregular circle)
    const points = 8;
    ctx.beginPath();
    for (let j = 0; j < points; j++) {
      const angle = (j / points) * Math.PI * 2;
      const radius = 6 + Math.random() * 2;
      const x = 8 + Math.cos(angle) * radius;
      const y = 8 + Math.sin(angle) * radius;
      
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    
    variations.push({
      name: `fire_ember_${i}.png`,
      canvas: canvas
    });
  }
  
  return variations;
}

// Generate all fire texture variations
function generateAllFireTextures() {
  console.log('Generating fire texture variations...');
  
  const allVariations = [
    ...createBaseFireVariations(),
    ...createFlameLickVariations(),
    ...createSparkVariations(),
    ...createEmberVariations()
  ];
  
  allVariations.forEach(variation => {
    const buffer = variation.canvas.toBuffer('image/png');
    const filePath = path.join(outputDir, variation.name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Generated ${variation.name}`);
  });
  
  console.log(`Generated ${allVariations.length} fire texture variations in resources/fireParticles/`);
}

// Run the generation
try {
  generateAllFireTextures();
} catch (error) {
  console.error('Error generating fire texture variations:', error);
}