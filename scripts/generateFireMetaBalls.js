const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure output directory exists
const outputDir = path.join(__dirname, '..', 'resources', 'fireMetaBalls');
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

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

// Metaball field calculation - returns field strength at point (x, y) for a metaball at (cx, cy) with radius r
function metaballField(x, y, cx, cy, radius) {
	const dx = x - cx;
	const dy = y - cy;
	const distSq = dx * dx + dy * dy;
	const radiusSq = radius * radius;

	if (distSq >= radiusSq) return 0;

	// Use smooth falloff function
	const dist = Math.sqrt(distSq);
	return Math.max(0, 1 - (dist / radius));
}

// Calculate combined metaball field for multiple balls
function calculateMetaballField(x, y, metaballs) {
	let totalField = 0;
	for (const ball of metaballs) {
		totalField += metaballField(x, y, ball.x, ball.y, ball.radius);
	}
	return totalField;
}

// Create fire gradient based on field strength
function createFireGradient(ctx, centerX, centerY, maxRadius) {
	const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
	gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      // White hot center
	gradient.addColorStop(0.2, 'rgba(255, 255, 150, 1)');   // Light yellow
	gradient.addColorStop(0.4, 'rgba(255, 200, 80, 0.95)'); // Yellow-orange
	gradient.addColorStop(0.6, 'rgba(255, 120, 20, 0.9)');  // Orange
	gradient.addColorStop(0.8, 'rgba(255, 60, 0, 0.8)');    // Red-orange
	gradient.addColorStop(1, 'rgba(180, 20, 0, 0.6)');      // Dark red
	return gradient;
}

// Render metaballs with fire effect
function renderMetaballs(canvas, metaballs, threshold = 0.5) {
	const ctx = canvas.getContext('2d');
	const width = canvas.width;
	const height = canvas.height;

	// Clear canvas
	ctx.clearRect(0, 0, width, height);

	// Calculate bounds for optimization
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

	// Find the center for gradient
	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;
	const maxRadius = Math.max(maxX - centerX, maxY - centerY);

	// Create fire gradient
	const gradient = createFireGradient(ctx, centerX, centerY, maxRadius);
	ctx.fillStyle = gradient;

	// Create path from metaball field
	const imageData = ctx.createImageData(width, height);
	const data = imageData.data;

	for (let y = minY; y < maxY; y++) {
		for (let x = minX; x < maxX; x++) {
			const field = calculateMetaballField(x, y, metaballs);

			if (field >= threshold) {
				const index = (y * width + x) * 4;
				// Use field strength to determine alpha
				const alpha = Math.min(255, Math.floor(field * 255));
				data[index] = 255;     // R
				data[index + 1] = 255; // G  
				data[index + 2] = 255; // B
				data[index + 3] = alpha; // A
			}
		}
	}

	// Create temporary canvas for the mask
	const maskCanvas = createCanvas(width, height);
	const maskCtx = maskCanvas.getContext('2d');
	maskCtx.putImageData(imageData, 0, 0);

	// Use mask with gradient
	ctx.save();
	ctx.globalCompositeOperation = 'source-over';
	ctx.drawImage(maskCanvas, 0, 0);
	ctx.globalCompositeOperation = 'source-in';
	ctx.fillRect(0, 0, width, height);
	ctx.restore();
}

// Create single particle variations
function createSingleParticles() {
	const variations = [];
	const sizes = [
		{ name: 'xs', radius: 12 },  // extra small
		{ name: 's', radius: 15 },   // small
		{ name: 'm', radius: 20 },   // medium
		{ name: 'l', radius: 25 },   // large
		{ name: 'xl', radius: 30 },  // extra large
		{ name: 'xxl', radius: 35 }  // extra extra large
	];

	for (const size of sizes) {
		// More variations per size (6 instead of 4)
		for (let i = 1; i <= 6; i++) {
			const canvas = createCanvas(size.radius * 3, size.radius * 3);

			// Add more variation to position and size
			const centerX = size.radius * 1.5 + (Math.random() - 0.5) * 4;
			const centerY = size.radius * 1.5 + (Math.random() - 0.5) * 4;
			const radius = size.radius + (Math.random() - 0.5) * 6;

			const metaballs = [{ x: centerX, y: centerY, radius }];

			// Vary threshold for different densities
			const threshold = 0.3 + Math.random() * 0.3; // 0.3 to 0.6
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `single_${size.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Create two-particle merge variations
function createTwoParticleMerges() {
	const variations = [];
	const baseRadius = 18;

	const configs = [
		// Horizontal merges - different distances
		{ name: 'h2_close', positions: [{ x: 30, y: 35 }, { x: 50, y: 35 }], canvasSize: [80, 70] },
		{ name: 'h2_mid', positions: [{ x: 25, y: 35 }, { x: 55, y: 35 }], canvasSize: [80, 70] },
		{ name: 'h2_far', positions: [{ x: 20, y: 35 }, { x: 60, y: 35 }], canvasSize: [80, 70] },

		// Vertical merges - different distances
		{ name: 'v2_close', positions: [{ x: 35, y: 30 }, { x: 35, y: 50 }], canvasSize: [70, 80] },
		{ name: 'v2_mid', positions: [{ x: 35, y: 25 }, { x: 35, y: 55 }], canvasSize: [70, 80] },
		{ name: 'v2_far', positions: [{ x: 35, y: 20 }, { x: 35, y: 60 }], canvasSize: [70, 80] },

		// Diagonal merges - 45 degrees
		{ name: 'd2_ne', positions: [{ x: 25, y: 45 }, { x: 45, y: 25 }], canvasSize: [70, 70] },
		{ name: 'd2_nw', positions: [{ x: 45, y: 45 }, { x: 25, y: 25 }], canvasSize: [70, 70] },
		{ name: 'd2_se', positions: [{ x: 25, y: 25 }, { x: 45, y: 45 }], canvasSize: [70, 70] },
		{ name: 'd2_sw', positions: [{ x: 45, y: 25 }, { x: 25, y: 45 }], canvasSize: [70, 70] },

		// Angled merges - 30 degrees
		{ name: 'a2_30', positions: [{ x: 25, y: 35 }, { x: 50, y: 25 }], canvasSize: [75, 70] },
		{ name: 'a2_60', positions: [{ x: 25, y: 35 }, { x: 45, y: 20 }], canvasSize: [70, 70] },
		{ name: 'a2_120', positions: [{ x: 35, y: 25 }, { x: 20, y: 45 }], canvasSize: [70, 70] },
		{ name: 'a2_150', positions: [{ x: 40, y: 25 }, { x: 15, y: 35 }], canvasSize: [75, 70] },

		// Overlapping merges
		{ name: 'o2_slight', positions: [{ x: 35, y: 35 }, { x: 45, y: 35 }], canvasSize: [80, 70] },
		{ name: 'o2_heavy', positions: [{ x: 35, y: 35 }, { x: 40, y: 35 }], canvasSize: [75, 70] },
	];

	for (const config of configs) {
		for (let i = 1; i <= 4; i++) { // More variations per config
			const canvas = createCanvas(config.canvasSize[0], config.canvasSize[1]);

			// Create metaballs with more variations
			const metaballs = config.positions.map(pos => ({
				x: pos.x + (Math.random() - 0.5) * 4,
				y: pos.y + (Math.random() - 0.5) * 4,
				radius: baseRadius + (Math.random() - 0.5) * 8
			}));

			// Vary threshold
			const threshold = 0.3 + Math.random() * 0.3;
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `merge_${config.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Create three-particle merge variations
function createThreeParticleMerges() {
	const variations = [];
	const baseRadius = 16;

	const configs = [
		// Triangle formations - different sizes
		{ name: 'tri3_eq', positions: [{ x: 40, y: 25 }, { x: 25, y: 50 }, { x: 55, y: 50 }], canvasSize: [80, 75] },
		{ name: 'tri3_iso', positions: [{ x: 40, y: 20 }, { x: 30, y: 50 }, { x: 50, y: 50 }], canvasSize: [80, 70] },
		{ name: 'tri3_right', positions: [{ x: 25, y: 25 }, { x: 50, y: 25 }, { x: 25, y: 50 }], canvasSize: [75, 75] },
		{ name: 'tri3_acute', positions: [{ x: 40, y: 20 }, { x: 25, y: 55 }, { x: 55, y: 55 }], canvasSize: [80, 75] },

		// Linear formations - different spacings
		{ name: 'lin3_h_close', positions: [{ x: 25, y: 35 }, { x: 40, y: 35 }, { x: 55, y: 35 }], canvasSize: [80, 70] },
		{ name: 'lin3_h_far', positions: [{ x: 15, y: 35 }, { x: 40, y: 35 }, { x: 65, y: 35 }], canvasSize: [80, 70] },
		{ name: 'lin3_v_close', positions: [{ x: 35, y: 25 }, { x: 35, y: 40 }, { x: 35, y: 55 }], canvasSize: [70, 80] },
		{ name: 'lin3_v_far', positions: [{ x: 35, y: 15 }, { x: 35, y: 40 }, { x: 35, y: 65 }], canvasSize: [70, 80] },

		// Diagonal lines
		{ name: 'lin3_diag', positions: [{ x: 20, y: 20 }, { x: 40, y: 40 }, { x: 60, y: 60 }], canvasSize: [80, 80] },
		{ name: 'lin3_antidiag', positions: [{ x: 20, y: 60 }, { x: 40, y: 40 }, { x: 60, y: 20 }], canvasSize: [80, 80] },

		// L-shaped formations - different orientations
		{ name: 'l3_ne', positions: [{ x: 25, y: 25 }, { x: 45, y: 25 }, { x: 25, y: 45 }], canvasSize: [70, 70] },
		{ name: 'l3_nw', positions: [{ x: 45, y: 25 }, { x: 25, y: 25 }, { x: 45, y: 45 }], canvasSize: [70, 70] },
		{ name: 'l3_se', positions: [{ x: 25, y: 45 }, { x: 45, y: 45 }, { x: 25, y: 25 }], canvasSize: [70, 70] },
		{ name: 'l3_sw', positions: [{ x: 45, y: 45 }, { x: 25, y: 45 }, { x: 45, y: 25 }], canvasSize: [70, 70] },

		// Arc formations
		{ name: 'arc3_top', positions: [{ x: 25, y: 40 }, { x: 40, y: 25 }, { x: 55, y: 40 }], canvasSize: [80, 65] },
		{ name: 'arc3_bottom', positions: [{ x: 25, y: 25 }, { x: 40, y: 40 }, { x: 55, y: 25 }], canvasSize: [80, 65] },
		{ name: 'arc3_left', positions: [{ x: 40, y: 25 }, { x: 25, y: 40 }, { x: 40, y: 55 }], canvasSize: [65, 80] },
		{ name: 'arc3_right', positions: [{ x: 25, y: 25 }, { x: 40, y: 40 }, { x: 25, y: 55 }], canvasSize: [65, 80] },

		// V-shaped formations
		{ name: 'v3_up', positions: [{ x: 40, y: 50 }, { x: 25, y: 25 }, { x: 55, y: 25 }], canvasSize: [80, 75] },
		{ name: 'v3_down', positions: [{ x: 40, y: 25 }, { x: 25, y: 50 }, { x: 55, y: 50 }], canvasSize: [80, 75] },
		{ name: 'v3_left', positions: [{ x: 50, y: 40 }, { x: 25, y: 25 }, { x: 25, y: 55 }], canvasSize: [75, 80] },
		{ name: 'v3_right', positions: [{ x: 25, y: 40 }, { x: 50, y: 25 }, { x: 50, y: 55 }], canvasSize: [75, 80] },
	];

	for (const config of configs) {
		for (let i = 1; i <= 4; i++) { // More variations per config
			const canvas = createCanvas(config.canvasSize[0], config.canvasSize[1]);

			// Create metaballs with more variations
			const metaballs = config.positions.map(pos => ({
				x: pos.x + (Math.random() - 0.5) * 4,
				y: pos.y + (Math.random() - 0.5) * 4,
				radius: baseRadius + (Math.random() - 0.5) * 6
			}));

			// Vary threshold
			const threshold = 0.3 + Math.random() * 0.3;
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `merge_${config.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Create four+ particle merge variations
function createFourParticleMerges() {
	const variations = [];
	const baseRadius = 16;

	const configs = [
		// Cross formations - different orientations
		{ name: 'cross4', positions: [{ x: 40, y: 20 }, { x: 20, y: 40 }, { x: 40, y: 40 }, { x: 60, y: 40 }], canvasSize: [80, 60] },
		{ name: 'plus4', positions: [{ x: 40, y: 15 }, { x: 40, y: 35 }, { x: 20, y: 25 }, { x: 60, y: 25 }], canvasSize: [80, 50] },
		{ name: 'cross4_diag', positions: [{ x: 40, y: 40 }, { x: 25, y: 25 }, { x: 55, y: 25 }, { x: 25, y: 55 }], canvasSize: [80, 80] },

		// Square/Rectangle formations
		{ name: 'square4', positions: [{ x: 25, y: 25 }, { x: 50, y: 25 }, { x: 25, y: 50 }, { x: 50, y: 50 }], canvasSize: [75, 75] },
		{ name: 'rect4_h', positions: [{ x: 20, y: 30 }, { x: 35, y: 30 }, { x: 20, y: 45 }, { x: 35, y: 45 }], canvasSize: [70, 75] },
		{ name: 'rect4_v', positions: [{ x: 30, y: 20 }, { x: 45, y: 20 }, { x: 30, y: 35 }, { x: 45, y: 35 }], canvasSize: [75, 70] },
		{ name: 'diamond4', positions: [{ x: 40, y: 20 }, { x: 60, y: 40 }, { x: 40, y: 60 }, { x: 20, y: 40 }], canvasSize: [80, 80] },

		// Line formations
		{ name: 'line4_h', positions: [{ x: 15, y: 35 }, { x: 30, y: 35 }, { x: 45, y: 35 }, { x: 60, y: 35 }], canvasSize: [75, 70] },
		{ name: 'line4_v', positions: [{ x: 35, y: 15 }, { x: 35, y: 30 }, { x: 35, y: 45 }, { x: 35, y: 60 }], canvasSize: [70, 75] },
		{ name: 'line4_diag', positions: [{ x: 20, y: 20 }, { x: 30, y: 30 }, { x: 40, y: 40 }, { x: 50, y: 50 }], canvasSize: [70, 70] },

		// T-formations
		{ name: 't4_up', positions: [{ x: 20, y: 25 }, { x: 35, y: 25 }, { x: 50, y: 25 }, { x: 35, y: 45 }], canvasSize: [70, 70] },
		{ name: 't4_down', positions: [{ x: 35, y: 25 }, { x: 20, y: 45 }, { x: 35, y: 45 }, { x: 50, y: 45 }], canvasSize: [70, 70] },
		{ name: 't4_left', positions: [{ x: 25, y: 20 }, { x: 25, y: 35 }, { x: 25, y: 50 }, { x: 45, y: 35 }], canvasSize: [70, 70] },
		{ name: 't4_right', positions: [{ x: 25, y: 35 }, { x: 45, y: 20 }, { x: 45, y: 35 }, { x: 45, y: 50 }], canvasSize: [70, 70] },

		// 5-particle cluster formations
		{ name: 'cluster5', positions: [{ x: 40, y: 30 }, { x: 25, y: 40 }, { x: 40, y: 50 }, { x: 55, y: 40 }, { x: 40, y: 40 }], canvasSize: [80, 80] },
		{ name: 'star5', positions: [{ x: 40, y: 20 }, { x: 55, y: 35 }, { x: 50, y: 55 }, { x: 30, y: 55 }, { x: 25, y: 35 }], canvasSize: [80, 75] },
		{ name: 'x5', positions: [{ x: 40, y: 40 }, { x: 25, y: 25 }, { x: 55, y: 25 }, { x: 25, y: 55 }, { x: 55, y: 55 }], canvasSize: [80, 80] },

		// 6-particle formations
		{ name: 'hex6', positions: [{ x: 40, y: 25 }, { x: 55, y: 32 }, { x: 55, y: 48 }, { x: 40, y: 55 }, { x: 25, y: 48 }, { x: 25, y: 32 }], canvasSize: [80, 80] },
		{ name: 'flower6', positions: [{ x: 40, y: 40 }, { x: 40, y: 25 }, { x: 52, y: 32 }, { x: 52, y: 48 }, { x: 40, y: 55 }, { x: 28, y: 48 }], canvasSize: [80, 80] },
		{ name: 'grid6', positions: [{ x: 25, y: 25 }, { x: 40, y: 25 }, { x: 55, y: 25 }, { x: 25, y: 45 }, { x: 40, y: 45 }, { x: 55, y: 45 }], canvasSize: [80, 70] },

		// 7+ particle complex formations
		{ name: 'circle7', positions: [
			{ x: 40, y: 40 }, // center
			{ x: 40, y: 25 }, { x: 52, y: 30 }, { x: 55, y: 42 }, 
			{ x: 52, y: 54 }, { x: 40, y: 59 }, { x: 28, y: 54 }, { x: 25, y: 42 }
		], canvasSize: [80, 84] },
		{ name: 'burst8', positions: [
			{ x: 40, y: 40 }, // center
			{ x: 40, y: 20 }, { x: 56, y: 26 }, { x: 60, y: 40 }, 
			{ x: 56, y: 54 }, { x: 40, y: 60 }, { x: 24, y: 54 }, { x: 20, y: 40 }, { x: 24, y: 26 }
		], canvasSize: [80, 80] }
	];

	for (const config of configs) {
		for (let i = 1; i <= 4; i++) { // More variations per config
			const canvas = createCanvas(config.canvasSize[0], config.canvasSize[1]);

			// Create metaballs with more variations
			const metaballs = config.positions.map(pos => ({
				x: pos.x + (Math.random() - 0.5) * 4,
				y: pos.y + (Math.random() - 0.5) * 4,
				radius: baseRadius + (Math.random() - 0.5) * 6
			}));

			// Vary threshold
			const threshold = 0.3 + Math.random() * 0.3;
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `merge_${config.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Create scattered/random formation variations
function createScatteredFormations() {
	const variations = [];
	const baseRadius = 15;

	const configs = [
		// Small clusters (3-4 particles)
		{ name: 'scatter3', count: 3, canvasSize: [80, 80] },
		{ name: 'scatter4', count: 4, canvasSize: [90, 90] },
		
		// Medium clusters (5-6 particles)
		{ name: 'scatter5', count: 5, canvasSize: [100, 100] },
		{ name: 'scatter6', count: 6, canvasSize: [110, 110] },
		
		// Large clusters (7-10 particles)
		{ name: 'scatter7', count: 7, canvasSize: [120, 120] },
		{ name: 'scatter8', count: 8, canvasSize: [120, 120] },
		{ name: 'scatter9', count: 9, canvasSize: [130, 130] },
		{ name: 'scatter10', count: 10, canvasSize: [140, 140] },
	];

	for (const config of configs) {
		for (let i = 1; i <= 5; i++) { // 5 variations per configuration
			const canvas = createCanvas(config.canvasSize[0], config.canvasSize[1]);
			const centerX = config.canvasSize[0] / 2;
			const centerY = config.canvasSize[1] / 2;
			const maxRadius = Math.min(centerX, centerY) * 0.7; // Keep within bounds

			// Generate random positions in a circular area
			const metaballs = [];
			for (let j = 0; j < config.count; j++) {
				// Random angle and distance from center
				const angle = Math.random() * Math.PI * 2;
				const distance = Math.random() * maxRadius;
				
				const x = centerX + Math.cos(angle) * distance;
				const y = centerY + Math.sin(angle) * distance;
				
				metaballs.push({
					x: x,
					y: y,
					radius: baseRadius + (Math.random() - 0.5) * 8
				});
			}

			// Vary threshold for different densities
			const threshold = 0.25 + Math.random() * 0.4; // 0.25 to 0.65
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `${config.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Create asymmetric formation variations
function createAsymmetricFormations() {
	const variations = [];
	const baseRadius = 16;

	const configs = [
		// Teardrop shapes
		{ name: 'tear_up', positions: [{ x: 40, y: 50 }, { x: 35, y: 35 }, { x: 45, y: 35 }, { x: 40, y: 20 }], canvasSize: [80, 70] },
		{ name: 'tear_down', positions: [{ x: 40, y: 20 }, { x: 35, y: 35 }, { x: 45, y: 35 }, { x: 40, y: 50 }], canvasSize: [80, 70] },
		{ name: 'tear_left', positions: [{ x: 50, y: 40 }, { x: 35, y: 35 }, { x: 35, y: 45 }, { x: 20, y: 40 }], canvasSize: [70, 80] },
		{ name: 'tear_right', positions: [{ x: 20, y: 40 }, { x: 35, y: 35 }, { x: 35, y: 45 }, { x: 50, y: 40 }], canvasSize: [70, 80] },

		// Comet/tail shapes
		{ name: 'comet_ne', positions: [{ x: 50, y: 50 }, { x: 45, y: 45 }, { x: 35, y: 35 }, { x: 25, y: 25 }, { x: 20, y: 20 }], canvasSize: [70, 70] },
		{ name: 'comet_nw', positions: [{ x: 20, y: 50 }, { x: 25, y: 45 }, { x: 35, y: 35 }, { x: 45, y: 25 }, { x: 50, y: 20 }], canvasSize: [70, 70] },
		{ name: 'comet_se', positions: [{ x: 20, y: 20 }, { x: 25, y: 25 }, { x: 35, y: 35 }, { x: 45, y: 45 }, { x: 50, y: 50 }], canvasSize: [70, 70] },
		{ name: 'comet_sw', positions: [{ x: 50, y: 20 }, { x: 45, y: 25 }, { x: 35, y: 35 }, { x: 25, y: 45 }, { x: 20, y: 50 }], canvasSize: [70, 70] },

		// Flame-like shapes
		{ name: 'flame_tall', positions: [{ x: 40, y: 55 }, { x: 35, y: 40 }, { x: 45, y: 40 }, { x: 30, y: 25 }, { x: 50, y: 25 }, { x: 40, y: 15 }], canvasSize: [80, 70] },
		{ name: 'flame_wide', positions: [{ x: 40, y: 45 }, { x: 25, y: 35 }, { x: 55, y: 35 }, { x: 20, y: 25 }, { x: 40, y: 25 }, { x: 60, y: 25 }], canvasSize: [80, 70] },
		{ name: 'flame_left', positions: [{ x: 55, y: 40 }, { x: 40, y: 35 }, { x: 40, y: 45 }, { x: 25, y: 30 }, { x: 25, y: 50 }, { x: 15, y: 40 }], canvasSize: [70, 80] },
		{ name: 'flame_right', positions: [{ x: 15, y: 40 }, { x: 30, y: 35 }, { x: 30, y: 45 }, { x: 45, y: 30 }, { x: 45, y: 50 }, { x: 55, y: 40 }], canvasSize: [70, 80] },

		// Wave-like shapes
		{ name: 'wave_h', positions: [{ x: 15, y: 35 }, { x: 30, y: 25 }, { x: 45, y: 45 }, { x: 60, y: 35 }], canvasSize: [75, 70] },
		{ name: 'wave_v', positions: [{ x: 35, y: 15 }, { x: 25, y: 30 }, { x: 45, y: 45 }, { x: 35, y: 60 }], canvasSize: [70, 75] },
		{ name: 'wave_s', positions: [{ x: 20, y: 20 }, { x: 35, y: 30 }, { x: 45, y: 40 }, { x: 60, y: 50 }], canvasSize: [80, 70] },
	];

	for (const config of configs) {
		for (let i = 1; i <= 3; i++) {
			const canvas = createCanvas(config.canvasSize[0], config.canvasSize[1]);

			// Create metaballs with variations
			const metaballs = config.positions.map(pos => ({
				x: pos.x + (Math.random() - 0.5) * 3,
				y: pos.y + (Math.random() - 0.5) * 3,
				radius: baseRadius + (Math.random() - 0.5) * 5
			}));

			// Vary threshold
			const threshold = 0.3 + Math.random() * 0.3;
			renderMetaballs(canvas, metaballs, threshold);

			const trimmedCanvas = trimCanvas(canvas);
			variations.push({
				name: `asym_${config.name}_${i}.png`,
				canvas: trimmedCanvas
			});
		}
	}

	return variations;
}

// Clear existing files and generate fire metaballs
async function generateFireMetaBalls() {
	console.log('Clearing existing fire metaball textures...');

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

	console.log('Generating fire metaball textures...');

	const allVariations = [
		...createSingleParticles(),
		...createTwoParticleMerges(),
		...createThreeParticleMerges(),
		...createFourParticleMerges(),
		...createScatteredFormations(),
		...createAsymmetricFormations()
	];

	for (const variation of allVariations) {
		const buffer = variation.canvas.toBuffer('image/png');
		const filePath = path.join(outputDir, variation.name);
		await fs.promises.writeFile(filePath, buffer);
		console.log(`Generated ${variation.name}`);
	}

	console.log(`Generated ${allVariations.length} fire metaball textures in resources/fireMetaBalls/`);
}

// Run the generation
generateFireMetaBalls().catch(error => {
	console.error('Error generating fire metaball textures:', error);
});