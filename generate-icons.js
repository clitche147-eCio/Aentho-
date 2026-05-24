/**
 * Generate app icons for Aentho Dashboard PWA
 * Creates 192x192 and 512x512 PNG icons with animated growth chart
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Ensure images directory exists
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

/**
 * Draw a clean animated growth chart icon
 */
function generateIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const padding = size * 0.1;
  const chartArea = size - padding * 2;

  // Background
  if (isMaskable) {
    // Transparent background for maskable icons
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  } else {
    // White background for regular icons
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(0, 0, size, size);

  // Draw gradient circle background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#2563eb');
  gradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = isMaskable ? gradient : '#f0f7ff';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, chartArea / 2, 0, Math.PI * 2);
  ctx.fill();

  // Chart data points (ascending)
  const dataPoints = [2, 3.5, 2.8, 4.2, 3.8, 5.5, 4.9, 6.8, 8.2, 7.5, 9.1, 8.5];
  const maxValue = Math.max(...dataPoints);
  const barWidth = chartArea / (dataPoints.length * 1.5);
  const barGap = barWidth * 0.3;

  // Draw bars
  ctx.fillStyle = isMaskable ? '#ffffff' : '#2563eb';
  dataPoints.forEach((value, index) => {
    const barHeight = (value / maxValue) * (chartArea * 0.6);
    const x = padding + (index * (barWidth + barGap)) + barGap;
    const y = size - padding - barHeight;
    ctx.fillRect(x, y, barWidth, barHeight);
  });

  // Draw trend line
  if (!isMaskable) {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = size * 0.03;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    dataPoints.forEach((value, index) => {
      const barHeight = (value / maxValue) * (chartArea * 0.6);
      const x = padding + (index * (barWidth + barGap)) + barGap + barWidth / 2;
      const y = size - padding - barHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  }

  // Draw up arrow (growth indicator)
  const arrowSize = size * 0.15;
  const arrowX = size - padding - arrowSize * 0.6;
  const arrowY = padding + arrowSize * 0.6;

  ctx.fillStyle = '#10b981';
  // Arrow shaft
  ctx.fillRect(arrowX - arrowSize * 0.1, arrowY, arrowSize * 0.2, arrowSize * 0.6);
  // Arrow head
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY);
  ctx.lineTo(arrowX - arrowSize * 0.2, arrowY + arrowSize * 0.3);
  ctx.lineTo(arrowX + arrowSize * 0.2, arrowY + arrowSize * 0.3);
  ctx.fill();

  // Add text label for smaller sizes
  if (size >= 192) {
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.12}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Aentho', size / 2, size - padding * 0.5);
  }

  return canvas;
}

/**
 * Generate all required icons
 */
function generateAllIcons() {
  console.log('Generating PWA icons...');

  // 192x192 icons
  console.log('Creating 192x192 icon...');
  const icon192 = generateIcon(192, false);
  const buffer192 = icon192.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'icon-192x192.png'), buffer192);
  console.log('✓ Created icon-192x192.png');

  const icon192Maskable = generateIcon(192, true);
  const buffer192Maskable = icon192Maskable.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'icon-192x192-maskable.png'), buffer192Maskable);
  console.log('✓ Created icon-192x192-maskable.png');

  // 512x512 icons
  console.log('Creating 512x512 icon...');
  const icon512 = generateIcon(512, false);
  const buffer512 = icon512.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'icon-512x512.png'), buffer512);
  console.log('✓ Created icon-512x512.png');

  const icon512Maskable = generateIcon(512, true);
  const buffer512Maskable = icon512Maskable.toBuffer('image/png');
  fs.writeFileSync(path.join(imagesDir, 'icon-512x512-maskable.png'), buffer512Maskable);
  console.log('✓ Created icon-512x512-maskable.png');

  console.log('\n✅ All icons generated successfully!');
  console.log('📍 Location: ./images/');
}

// Run if executed directly
if (require.main === module) {
  try {
    generateAllIcons();
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\nNote: This script requires the "canvas" package.');
    console.log('Install with: npm install canvas');
    process.exit(1);
  }
}

module.exports = { generateIcon, generateAllIcons };
