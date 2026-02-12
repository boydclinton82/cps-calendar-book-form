#!/usr/bin/env node

import { chromium } from 'playwright';
import {
  ensureDirs,
  waitForApp,
  waitForAnimation,
  screenshotPath,
  BREAKPOINTS
} from './helpers.mjs';

// Track errors across capture groups
const errors = [];

async function captureGroup1_InitialStates(page) {
  console.log('\n=== Group 1: VCAP-01 + VCAP-02 (Initial States) ===');

  try {
    // VCAP-01: Initial load state BEFORE any navigation
    console.log('Capturing initial load state...');
    await waitForApp(page);
    await page.screenshot({
      path: screenshotPath('01-initial-states', '000-initial-load.png'),
      fullPage: true
    });
    console.log('✓ 000-initial-load.png');

    // Navigate to a FUTURE date (tomorrow) so all 16 slots are visible
    console.log('Navigating to future date...');
    const rightNavBtn = page.locator('.nav-btn').last();
    await rightNavBtn.click();
    await waitForAnimation(page);

    // VCAP-02: Empty calendar with full day visible
    console.log('Capturing empty calendar full day...');
    await page.screenshot({
      path: screenshotPath('01-initial-states', '001-empty-calendar-full-day.png'),
      fullPage: true
    });
    console.log('✓ 001-empty-calendar-full-day.png');

    // Click an available slot to show booking panel
    console.log('Opening booking panel...');
    const availableSlot = page.locator('.time-slot.available').first();
    await availableSlot.click();
    await page.waitForSelector('.booking-panel.open', { timeout: 5000 });
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('01-initial-states', '002-date-selected-with-panel.png'),
      fullPage: true
    });
    console.log('✓ 002-date-selected-with-panel.png');

    // Close panel by pressing Escape
    await page.keyboard.press('Escape');
    await waitForAnimation(page);

    console.log('✓ Group 1 complete');
  } catch (error) {
    console.error('✗ Group 1 failed:', error.message);
    errors.push({ group: 'Group 1', error });
  }
}

async function captureGroup2_SlotStates(page) {
  console.log('\n=== Group 2: VCAP-03 (Slot States) ===');

  try {
    // Navigate to future date (should still be there)
    console.log('Ensuring we are on future date...');
    await waitForAnimation(page);

    // Capture available slots
    console.log('Capturing available slots...');
    await page.screenshot({
      path: screenshotPath('02-slot-states', '001-slot-available.png'),
      fullPage: true
    });
    console.log('✓ 001-slot-available.png');

    // Create a booking to show booked and blocked states
    console.log('Creating a multi-hour booking...');
    const availableSlot = page.locator('.time-slot.available').first();
    await availableSlot.click();
    await page.waitForSelector('.booking-panel.open', { timeout: 5000 });
    await waitForAnimation(page);

    // Click first user option
    const userBtn = page.locator('.option-btn').first();
    await userBtn.click();
    await waitForAnimation(page);

    // Click a multi-hour duration (look for 2h or 3h)
    const durationOptions = page.locator('.option-btn');
    const durationCount = await durationOptions.count();

    // Try to find a multi-hour duration option
    let multiHourBtn = null;
    for (let i = 0; i < durationCount; i++) {
      const text = await durationOptions.nth(i).textContent();
      if (text && (text.includes('2h') || text.includes('3h'))) {
        multiHourBtn = durationOptions.nth(i);
        break;
      }
    }

    if (multiHourBtn) {
      await multiHourBtn.click();
      await waitForAnimation(page, 600); // Wait for booking block to appear
    } else {
      console.log('Warning: Could not find multi-hour duration, using first available duration');
      await durationOptions.first().click();
      await waitForAnimation(page, 600);
    }

    // Screenshot showing booked and blocked slots
    await page.screenshot({
      path: screenshotPath('02-slot-states', '002-slot-booked-and-blocked.png'),
      fullPage: true
    });
    console.log('✓ 002-slot-booked-and-blocked.png');

    // Navigate to YESTERDAY for past slots
    console.log('Navigating to yesterday for past slots...');
    const leftNavBtn = page.locator('.nav-btn').first();

    // Click left arrow multiple times to go back to yesterday
    await leftNavBtn.click();
    await waitForAnimation(page);
    await leftNavBtn.click();
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('02-slot-states', '003-slots-past.png'),
      fullPage: true
    });
    console.log('✓ 003-slots-past.png');

    // Navigate to TODAY for current hour
    console.log('Navigating to today for current hour...');
    const rightNavBtn = page.locator('.nav-btn').last();
    await rightNavBtn.click();
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('02-slot-states', '004-current-hour-slot.png'),
      fullPage: true
    });
    console.log('✓ 004-current-hour-slot.png');

    // Navigate back to future date to show multi-hour booking block
    console.log('Navigating back to future date...');
    await rightNavBtn.click();
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('02-slot-states', '005-multi-hour-booking-block.png'),
      fullPage: true
    });
    console.log('✓ 005-multi-hour-booking-block.png');

    console.log('✓ Group 2 complete');
  } catch (error) {
    console.error('✗ Group 2 failed:', error.message);
    errors.push({ group: 'Group 2', error });
  }
}

async function captureGroup3_BookingFlow(page) {
  console.log('\n=== Group 3: VCAP-04 (Booking Flow) ===');

  try {
    // Should be on future date with one booking already created
    console.log('Finding another available slot...');

    // Find an available slot (skip the first one as it might be booked)
    const availableSlots = page.locator('.time-slot.available');
    const slotToBook = availableSlots.nth(1); // Use second available slot

    // Step 1: Panel open with slot selected
    await slotToBook.click();
    await page.waitForSelector('.booking-panel.open', { timeout: 5000 });
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('03-booking-flow', '001-panel-open-slot-selected.png'),
      fullPage: true
    });
    console.log('✓ 001-panel-open-slot-selected.png');

    // Step 2: User selected
    const userBtn = page.locator('.option-btn').first();
    await userBtn.click();
    await waitForAnimation(page);

    await page.screenshot({
      path: screenshotPath('03-booking-flow', '002-user-selected.png'),
      fullPage: true
    });
    console.log('✓ 002-user-selected.png');

    // Step 3: Duration options visible (before clicking)
    await page.screenshot({
      path: screenshotPath('03-booking-flow', '003-duration-options-visible.png'),
      fullPage: true
    });
    console.log('✓ 003-duration-options-visible.png');

    // Step 4: Click duration to confirm
    const durationBtn = page.locator('.option-btn').first();
    await durationBtn.click();
    await waitForAnimation(page, 600); // Wait for panel to close and booking to appear

    await page.screenshot({
      path: screenshotPath('03-booking-flow', '004-booking-confirmed.png'),
      fullPage: true
    });
    console.log('✓ 004-booking-confirmed.png');

    console.log('✓ Group 3 complete');
  } catch (error) {
    console.error('✗ Group 3 failed:', error.message);
    errors.push({ group: 'Group 3', error });
  }

  // Ensure booking panel is closed after Group 3
  try {
    const panelOpen = await page.locator('.booking-panel.open').isVisible().catch(() => false);
    if (panelOpen) {
      await page.keyboard.press('Escape');
      await waitForAnimation(page);
    }
  } catch (e) {
    // Ignore cleanup errors
  }
}

async function captureGroup4_BookNowButton(page) {
  console.log('\n=== Group 4: VCAP-05 (Book Now Button) ===');

  try {
    // Navigate to TODAY
    console.log('Navigating to today...');
    const leftNavBtn = page.locator('.nav-btn').first();
    await leftNavBtn.click();
    await waitForAnimation(page);

    // Check if Book Now button is visible
    const bookNowBtn = page.locator('.book-now-btn');
    const isVisible = await bookNowBtn.isVisible().catch(() => false);

    if (isVisible) {
      console.log('Book Now button is visible');
      await page.screenshot({
        path: screenshotPath('04-book-now-button', '001-book-now-visible.png'),
        fullPage: true
      });
      console.log('✓ 001-book-now-visible.png');
    } else {
      console.log('Book Now button is hidden (outside booking hours)');
      await page.screenshot({
        path: screenshotPath('04-book-now-button', '002-book-now-hidden.png'),
        fullPage: true
      });
      console.log('✓ 002-book-now-hidden.png');
    }

    console.log('✓ Group 4 complete');
  } catch (error) {
    console.error('✗ Group 4 failed:', error.message);
    errors.push({ group: 'Group 4', error });
  }
}

async function captureGroup5_TimezoneToggle(page) {
  console.log('\n=== Group 5: VCAP-06 (Timezone Toggle) ===');

  try {
    // Navigate to future date
    console.log('Navigating to future date...');
    const rightNavBtn = page.locator('.nav-btn').last();
    await rightNavBtn.click();
    await waitForAnimation(page);

    // Screenshot with QLD (default)
    console.log('Capturing QLD timezone...');
    await page.screenshot({
      path: screenshotPath('05-timezone-toggle', '001-qld-default.png'),
      fullPage: true
    });
    console.log('✓ 001-qld-default.png');

    // Click timezone toggle to switch to NSW
    console.log('Switching to NSW timezone...');
    const timezoneToggle = page.locator('.timezone-toggle');
    await timezoneToggle.click();
    await waitForAnimation(page, 600); // Wait for re-render

    await page.screenshot({
      path: screenshotPath('05-timezone-toggle', '002-nsw-active.png'),
      fullPage: true
    });
    console.log('✓ 002-nsw-active.png');

    // Capture time slots to show hour labels changed
    await page.screenshot({
      path: screenshotPath('05-timezone-toggle', '003-nsw-time-slots.png'),
      fullPage: true
    });
    console.log('✓ 003-nsw-time-slots.png');

    // Toggle back to QLD
    await timezoneToggle.click();
    await waitForAnimation(page);

    console.log('✓ Group 5 complete');
  } catch (error) {
    console.error('✗ Group 5 failed:', error.message);
    errors.push({ group: 'Group 5', error });
  }
}

async function captureGroup6_Responsive(page) {
  console.log('\n=== Group 6: VCAP-07 (Responsive) ===');

  try {
    // Ensure booking panel is closed before starting
    const panelOpen = await page.locator('.booking-panel.open').isVisible().catch(() => false);
    if (panelOpen) {
      await page.keyboard.press('Escape');
      await waitForAnimation(page);
    }

    // Should be on future date
    for (const breakpoint of BREAKPOINTS) {
      console.log(`Capturing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})...`);

      await page.setViewportSize({
        width: breakpoint.width,
        height: breakpoint.height
      });
      await waitForAnimation(page, 500); // Wait for layout to settle

      await page.screenshot({
        path: screenshotPath('06-responsive', `${breakpoint.name}-full-page.png`),
        fullPage: true
      });
      console.log(`✓ ${breakpoint.name}-full-page.png`);

      // For mobile, also capture with booking panel open
      if (breakpoint.name === 'mobile') {
        const availableSlot = page.locator('.time-slot.available').first();
        await availableSlot.click();
        await page.waitForSelector('.booking-panel.open', { timeout: 5000 });
        await waitForAnimation(page);

        await page.screenshot({
          path: screenshotPath('06-responsive', 'mobile-with-panel.png'),
          fullPage: true
        });
        console.log('✓ mobile-with-panel.png');

        // Close panel
        await page.keyboard.press('Escape');
        await waitForAnimation(page);
      }
    }

    console.log('✓ Group 6 complete');
  } catch (error) {
    console.error('✗ Group 6 failed:', error.message);
    errors.push({ group: 'Group 6', error });
  }
}

async function main() {
  console.log('=== Starting screenshot capture ===\n');

  // Ensure directories exist
  await ensureDirs();

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Execute all capture groups
  await captureGroup1_InitialStates(page);
  await captureGroup2_SlotStates(page);
  await captureGroup3_BookingFlow(page);
  await captureGroup4_BookNowButton(page);
  await captureGroup5_TimezoneToggle(page);
  await captureGroup6_Responsive(page);

  await browser.close();

  // Report results
  console.log('\n=== Capture complete ===\n');

  if (errors.length > 0) {
    console.error('Errors occurred during capture:');
    errors.forEach(({ group, error }) => {
      console.error(`  ${group}: ${error.message}`);
    });
    process.exit(1);
  } else {
    console.log('All screenshots captured successfully!');
    process.exit(0);
  }
}

main();
