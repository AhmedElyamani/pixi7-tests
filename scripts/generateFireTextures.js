const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'assets', 'images');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create fire base texture (large, solid fire)
function createFireBase() {
  const canvas = createCanvas(64, 80);
  const ctx = canvas.getContext('2d');
  
  // Create radial gradient from center-bottom
  const gradient = ctx.createRadialGradient(32, 70, 5, 32, 40, 40);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // White hot center
  gradient.addColorStop(0.2, 'rgba(255, 255, 0, 1)');    // Yellow
  gradient.addColorStop(0.4, 'rgba(255, 165, 0, 1)');    // Orange
  gradient.addColorStop(0.7, 'rgba(255, 69, 0, 0.9)');   // Red-orange
  gradient.addColorStop(1, 'rgba(139, 0, 0, 0.3)');      // Dark red, more transparent
  
  ctx.fillStyle = gradient;
  
  // Draw flame shape
  ctx.beginPath();
  ctx.ellipse(32, 65, 25, 15, 0, 0, Math.PI * 2); // Base
  ctx.ellipse(32, 50, 20, 18, 0, 0, Math.PI * 2); // Middle
  ctx.ellipse(32, 30, 15, 15, 0, 0, Math.PI * 2); // Upper
  ctx.ellipse(32, 15, 8, 10, 0, 0, Math.PI * 2);  // Tip
  ctx.fill();
  
  return canvas;
}

// Create flame lick texture (tall, wispy)
function createFlameLick() {
  const canvas = createCanvas(32, 64);
  const ctx = canvas.getContext('2d');
  
  // Create linear gradient from bottom to top
  const gradient = ctx.createLinearGradient(0, 64, 0, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 0, 1)');      // Yellow base
  gradient.addColorStop(0.3, 'rgba(255, 165, 0, 0.9)');  // Orange
  gradient.addColorStop(0.6, 'rgba(255, 69, 0, 0.7)');   // Red-orange
  gradient.addColorStop(1, 'rgba(255, 0, 0, 0.4)');      // Red tip
  
  ctx.fillStyle = gradient;
  
  // Draw wispy flame shape
  ctx.beginPath();
  ctx.ellipse(16, 55, 12, 9, 0, 0, Math.PI * 2);  // Base
  ctx.ellipse(16, 40, 8, 12, 0, 0, Math.PI * 2);  // Middle
  ctx.ellipse(16, 25, 6, 10, 0, 0, Math.PI * 2);  // Upper
  ctx.ellipse(16, 10, 4, 8, 0, 0, Math.PI * 2);   // Tip
  ctx.fill();
  
  return canvas;
}

// Create spark texture (small, bright)
function createSpark() {
  const canvas = createCanvas(8, 8);
  const ctx = canvas.getContext('2d');
  
  // Create radial gradient for spark
  const gradient = ctx.createRadialGradient(4, 4, 0, 4, 4, 4);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');    // White center
  gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.9)');  // Yellow
  gradient.addColorStop(0.8, 'rgba(255, 165, 0, 0.7)');  // Orange
  gradient.addColorStop(1, 'rgba(255, 69, 0, 0.3)');     // Transparent edge
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(4, 4, 4, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

// Generate and save textures
function generateTextures() {
  try {
    // Generate fire base
    const fireBase = createFireBase();
    const fireBaseBuffer = fireBase.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, 'fire_base.png'), fireBaseBuffer);
    console.log('Generated fire_base.png');
    
    // Generate flame lick
    const flameLick = createFlameLick();
    const flameLickBuffer = flameLick.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, 'fire_lick.png'), flameLickBuffer);
    console.log('Generated fire_lick.png');
    
    // Generate spark
    const spark = createSpark();
    const sparkBuffer = spark.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, 'fire_spark.png'), sparkBuffer);
    console.log('Generated fire_spark.png');
    
    console.log('All fire textures generated successfully!');
  } catch (error) {
    console.error('Error generating fire textures:', error);
  }
}

// Check if canvas package is available
try {
  generateTextures();
} catch (error) {
  console.error('Canvas package not found. Please install it with: npm install canvas');
  console.log('Alternatively, you can create the fire texture assets manually and place them in assets/images/');
}