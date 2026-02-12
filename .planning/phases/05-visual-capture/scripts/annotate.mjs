#!/usr/bin/env node

import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const screenshotsDir = join(__dirname, '..', 'screenshots');
const outputDir = join(screenshotsDir, '07-annotated');

// Ensure output directory exists
if (!existsSync(outputDir)) {
  await mkdir(outputDir, { recursive: true });
}

/**
 * Annotation definitions for each screenshot
 * Format: { filename: [{ x, y, text }] }
 */
const annotations = {
  // 01-initial-states
  '01-initial-states/000-initial-load.png': [
    { x: 20, y: 35, text: 'Header — BMO Financial Solutions branding' },
    { x: 510, y: 35, text: 'Book Now [B] — Quick action for current hour' },
    { x: 590, y: 35, text: 'Week View [W] — Navigation mode' },
    { x: 670, y: 35, text: 'Timezone [T] — QLD/NSW toggle' },
    { x: 280, y: 65, text: 'Date Navigation — Left/Right arrows' },
    { x: 360, y: 65, text: 'Current Date — Friday, February 13, 2026' },
    { x: 360, y: 120, text: 'Time Slot Grid — 6:00 AM start time' },
    { x: 360, y: 250, text: 'Available Slots — Clickable, cyan border' },
  ],
  '01-initial-states/001-empty-calendar-full-day.png': [
    { x: 20, y: 35, text: 'BMO Financial Solutions — Company header' },
    { x: 360, y: 65, text: 'Saturday, February 14, 2026 — Selected date' },
    { x: 360, y: 120, text: '6:00 AM — First slot of day' },
    { x: 360, y: 435, text: '9:00 PM — Last slot of day (16 total slots)' },
    { x: 360, y: 180, text: 'All Available — Empty calendar, all slots open' },
  ],
  '01-initial-states/002-date-selected-with-panel.png': [
    { x: 360, y: 140, text: '7:00 AM — Selected time slot highlighted' },
    { x: 600, y: 60, text: 'Booking Panel — Slides in from right' },
    { x: 600, y: 95, text: 'WHO? — User selection section' },
    { x: 600, y: 125, text: '[J] Jack — Hotkey J selects user' },
    { x: 600, y: 155, text: '[G] Giuliano — Hotkey G selects user' },
    { x: 600, y: 185, text: 'DURATION? — Time length options' },
    { x: 600, y: 215, text: '[1] 1 hour — Default duration' },
    { x: 600, y: 245, text: '[2] 2 hours — Extended booking' },
    { x: 600, y: 275, text: '[3] 3 hours — Maximum duration' },
  ],

  // 02-slot-states
  '02-slot-states/001-slot-available.png': [
    { x: 360, y: 120, text: 'Available Slot — Cyan border, clickable' },
    { x: 360, y: 180, text: 'CSS class: .slot-available' },
    { x: 360, y: 240, text: 'Hover state: Brightens slightly' },
  ],
  '02-slot-states/002-slot-booked-and-blocked.png': [
    { x: 360, y: 160, text: 'Booked Slot — Orange/salmon fill' },
    { x: 360, y: 210, text: 'CSS class: .slot-booked' },
    { x: 360, y: 260, text: 'Non-interactive — No click handler' },
    { x: 360, y: 310, text: 'Shows existing booking committed' },
  ],
  '02-slot-states/003-slots-past.png': [
    { x: 360, y: 120, text: 'Past Slots — Dimmed appearance' },
    { x: 360, y: 170, text: 'CSS class: .slot-past' },
    { x: 360, y: 220, text: 'Disabled — Cannot be selected' },
    { x: 360, y: 270, text: 'Visual: Lower opacity, grayed' },
  ],
  '02-slot-states/004-current-hour-slot.png': [
    { x: 360, y: 200, text: 'Current Hour — Special highlighting' },
    { x: 360, y: 250, text: 'Triggers Book Now button visibility' },
    { x: 360, y: 300, text: 'Can be booked if available' },
  ],
  '02-slot-states/005-multi-hour-booking-block.png': [
    { x: 360, y: 160, text: 'Multi-hour Block — 2-3 hour booking' },
    { x: 360, y: 210, text: 'Spans consecutive slots vertically' },
    { x: 360, y: 260, text: 'All slots show .slot-booked state' },
    { x: 360, y: 310, text: 'Single booking entity, multiple slots' },
  ],

  // 03-booking-flow
  '03-booking-flow/001-panel-open-slot-selected.png': [
    { x: 270, y: 140, text: '7:00 AM — Slot highlighted on click' },
    { x: 600, y: 60, text: 'Panel Appears — Right side of screen' },
    { x: 600, y: 95, text: 'Step 1: WHO? — User selection required' },
    { x: 600, y: 125, text: '[J] Jack — Click or press J' },
    { x: 600, y: 155, text: '[G] Giuliano — Click or press G' },
    { x: 600, y: 185, text: 'DURATION? — Appears after user selected' },
    { x: 600, y: 435, text: 'Cancel — ESC or click to dismiss' },
  ],
  '03-booking-flow/002-user-selected.png': [
    { x: 600, y: 125, text: 'Jack Selected — Highlighted state' },
    { x: 600, y: 185, text: 'Duration Options Active — Next step enabled' },
    { x: 600, y: 215, text: '[1] 1 hour — Press 1 or click' },
    { x: 600, y: 245, text: '[2] 2 hours — Extended option' },
    { x: 600, y: 275, text: '[3] 3 hours — Maximum length' },
  ],
  '03-booking-flow/003-duration-options-visible.png': [
    { x: 600, y: 185, text: 'Duration Choice — Final step' },
    { x: 600, y: 215, text: '[1] 1 hour — Default selection' },
    { x: 600, y: 245, text: '[2] 2 hours — Available' },
    { x: 600, y: 275, text: '[3] 3 hours — Available' },
    { x: 360, y: 300, text: 'Selecting duration completes booking' },
  ],
  '03-booking-flow/004-booking-confirmed.png': [
    { x: 270, y: 140, text: 'Booked Slot — Orange fill indicates confirmed' },
    { x: 600, y: 95, text: 'Booking Complete — Panel shows result' },
    { x: 360, y: 350, text: 'Calendar Updated — Slot now marked booked' },
    { x: 600, y: 435, text: 'Panel Dismissible — ESC or click Cancel' },
  ],

  // 04-book-now-button
  '04-book-now-button/001-book-now-visible.png': [
    { x: 510, y: 35, text: 'Book Now [B] — Visible when current hour available' },
    { x: 510, y: 60, text: 'Pulses/Animated — Draws attention' },
    { x: 510, y: 85, text: 'Hotkey: B — Instant booking current hour' },
    { x: 360, y: 180, text: 'Current Hour Slot — Must be available' },
    { x: 510, y: 110, text: 'Hidden states: Past, booked, outside hours' },
  ],

  // 05-timezone-toggle
  '05-timezone-toggle/001-qld-default.png': [
    { x: 670, y: 35, text: '[T] QLD — Default timezone (no offset)' },
    { x: 360, y: 120, text: '6:00 AM — QLD time (no DST)' },
    { x: 360, y: 200, text: '10:00 AM — Standard time labels' },
    { x: 670, y: 60, text: 'Toggle: Press T to switch NSW' },
  ],
  '05-timezone-toggle/002-nsw-active.png': [
    { x: 670, y: 35, text: '[T] NSW — +1 hour offset (DST active)' },
    { x: 360, y: 120, text: '7:00 AM — NSW time (+1h from QLD)' },
    { x: 360, y: 200, text: 'Time Labels Shifted — All slots +1 hour' },
    { x: 670, y: 60, text: 'Visual Indicator — NSW highlighted' },
  ],
  '05-timezone-toggle/003-nsw-time-slots.png': [
    { x: 360, y: 120, text: '7:00 AM — First slot in NSW time' },
    { x: 360, y: 180, text: '8:00 AM — +1h offset from QLD 7:00' },
    { x: 360, y: 240, text: 'All Slots Adjusted — Consistent +1h' },
    { x: 670, y: 35, text: 'NSW Active — Toggle state persists' },
  ],

  // 06-responsive
  '06-responsive/desktop-full-page.png': [
    { x: 360, y: 65, text: 'Desktop Layout — 1440px viewport' },
    { x: 360, y: 250, text: 'Centered Time Grid — Optimal width' },
    { x: 20, y: 35, text: 'Full Header — All buttons visible' },
  ],
  '06-responsive/mobile-full-page.png': [
    { x: 187, y: 65, text: 'Mobile Layout — 375px width' },
    { x: 187, y: 120, text: 'Stacked Slots — Full width' },
    { x: 187, y: 250, text: 'Touch-optimized — Larger tap targets' },
  ],
  '06-responsive/mobile-with-panel.png': [
    { x: 187, y: 60, text: 'Panel Overlay — Full screen on mobile' },
    { x: 187, y: 120, text: 'Dark Backdrop — Dims calendar behind' },
    { x: 187, y: 180, text: 'User Selection — Full width buttons' },
    { x: 187, y: 280, text: 'Mobile-optimized — Easy touch interaction' },
  ],
  '06-responsive/tablet-full-page.png': [
    { x: 384, y: 65, text: 'Tablet Layout — 768px viewport' },
    { x: 384, y: 200, text: 'Intermediate Sizing — Between mobile/desktop' },
    { x: 384, y: 300, text: 'Optimized Grid — Comfortable touch targets' },
  ],
};

/**
 * Generate SVG overlay with text labels
 */
function generateSVG(labels, imageWidth, imageHeight) {
  const elements = labels.map(({ x, y, text }) => {
    // Estimate text width (rough approximation)
    const textWidth = text.length * 10.5;
    const rectX = x - 5;
    const rectY = y - 22;

    return `
      <rect x="${rectX}" y="${rectY}" width="${textWidth + 10}" height="28" rx="4" fill="rgba(0,0,0,0.85)" />
      <text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#FF0000" stroke="rgba(0,0,0,0.5)" stroke-width="0.5">${escapeXml(text)}</text>
    `;
  }).join('');

  return `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      ${elements}
    </svg>
  `;
}

/**
 * Escape XML special characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Process a single screenshot
 */
async function annotateScreenshot(inputPath, relativePath) {
  const labels = annotations[relativePath];

  if (!labels || labels.length === 0) {
    console.log(`⚠️  No annotations defined for: ${relativePath}`);
    return false;
  }

  try {
    // Read image metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Generate SVG overlay
    const svg = generateSVG(labels, metadata.width, metadata.height);
    const svgBuffer = Buffer.from(svg);

    // Composite SVG onto image
    const outputFilename = relativePath.replace(/\//g, '--');
    const outputPath = join(outputDir, outputFilename);

    await image
      .composite([{
        input: svgBuffer,
        top: 0,
        left: 0,
      }])
      .toFile(outputPath);

    console.log(`✅ Annotated: ${relativePath} → ${outputFilename}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to annotate ${relativePath}:`, error.message);
    return false;
  }
}

/**
 * Process all screenshots in all directories
 */
async function annotateAll() {
  const directories = [
    '01-initial-states',
    '02-slot-states',
    '03-booking-flow',
    '04-book-now-button',
    '05-timezone-toggle',
    '06-responsive',
  ];

  let totalProcessed = 0;
  let totalSuccess = 0;

  for (const dir of directories) {
    const dirPath = join(screenshotsDir, dir);
    const files = await readdir(dirPath);

    for (const file of files) {
      if (!file.endsWith('.png')) continue;

      const inputPath = join(dirPath, file);
      const relativePath = `${dir}/${file}`;

      totalProcessed++;
      const success = await annotateScreenshot(inputPath, relativePath);
      if (success) totalSuccess++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`📊 Annotation Summary`);
  console.log('='.repeat(60));
  console.log(`Total screenshots processed: ${totalProcessed}`);
  console.log(`Successfully annotated: ${totalSuccess}`);
  console.log(`Failed: ${totalProcessed - totalSuccess}`);
  console.log(`Output directory: ${outputDir}`);
  console.log('='.repeat(60));

  if (totalSuccess !== totalProcessed) {
    process.exit(1);
  }
}

// Run the annotation process
await annotateAll();
