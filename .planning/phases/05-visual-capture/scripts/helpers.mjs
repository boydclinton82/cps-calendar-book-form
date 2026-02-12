import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constants
export const APP_URL = 'https://booking-bmo-financial-solutions.vercel.app';

export const BREAKPOINTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 }
];

// Base directory for all screenshots
const SCREENSHOTS_BASE = join(__dirname, '..', 'screenshots');

/**
 * Ensure all screenshot subdirectories exist
 */
export async function ensureDirs(baseDir = SCREENSHOTS_BASE) {
  const subdirs = [
    '01-initial-states',
    '02-slot-states',
    '03-booking-flow',
    '04-book-now-button',
    '05-timezone-toggle',
    '06-responsive'
  ];

  for (const subdir of subdirs) {
    await mkdir(join(baseDir, subdir), { recursive: true });
  }
}

/**
 * Navigate to app and wait for it to load fully
 */
export async function waitForApp(page) {
  await page.goto(APP_URL, { waitUntil: 'networkidle' });

  // Wait for the app to be visible (not the loading spinner)
  await page.waitForSelector('.app', { state: 'visible', timeout: 10000 });

  // Additional wait for any initial animations
  await page.waitForTimeout(500);
}

/**
 * Wait for animations to complete
 */
export async function waitForAnimation(page, ms = 400) {
  await page.waitForTimeout(ms);
}

/**
 * Build a screenshot path
 */
export function screenshotPath(category, filename) {
  return join(SCREENSHOTS_BASE, category, filename);
}
