# Phase 5: Visual Capture - Research

**Researched:** 2026-02-13
**Domain:** Screenshot automation and visual documentation for AI-consumable specifications
**Confidence:** HIGH

## Summary

Visual capture for comprehensive UI documentation requires automated screenshot tooling, programmatic state orchestration, and systematic organization. The goal is to capture every visual state of the deployed booking form at https://booking-bmo-financial-solutions.vercel.app for an AI consumer (Claude Code) to perfectly recreate it in Rails.

**Research reveals three core pillars:**

1. **Browser Automation** - Playwright (v1.49+) is the industry standard for programmatic screenshot capture, with support for full-page, element-specific, and viewport screenshots across all major browsers. It offers deterministic control and pixel-perfect consistency.

2. **State Orchestration** - Since the booking form has 20+ distinct states (slot states, booking flows, responsive breakpoints, timezone modes), automation must programmatically trigger each state rather than manual clicking. This requires scripting user interactions and data setup.

3. **Annotation & Organization** - Raw screenshots need systematic labeling (element identification, state descriptions) and hierarchical organization (by category: states, flows, responsive, etc.) to be AI-consumable. Modern tools like Sharp (Node.js) can add programmatic text overlays, while folder structure provides categorization.

**Primary recommendation:** Use Playwright for automated screenshot capture with a script that orchestrates all UI states, output to organized folders (`/01-initial-states/`, `/02-slot-states/`, `/03-booking-flow/`, etc.), then annotate using Sharp or manual tools with consistent naming (`001-empty-calendar-no-selection.png`, `002-date-selected-time-grid-visible.png`).

## Standard Stack

The established libraries/tools for screenshot automation and visual documentation:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Playwright | 1.49+ | Browser automation & screenshots | Industry leader for E2E testing, deterministic, cross-browser, official Microsoft support |
| Sharp | 0.33+ | Image manipulation (Node.js) | High-performance native bindings, text overlay capability, widely adopted |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Playwright MCP | Latest | AI-assisted browser control | If using Claude Code to help write screenshot scripts via MCP integration |
| marker.js | 2.x | Interactive image annotation | If manual annotation workflow preferred over programmatic |
| Jimp | 0.22+ | Pure JS image manipulation | If native dependencies (Sharp) are problematic, or need arrow/shape drawing |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Playwright | Puppeteer | Puppeteer is Chrome-only; Playwright supports Firefox/WebKit and has better API |
| Sharp | Jimp | Jimp is slower but pure JavaScript (no native deps); Sharp lacks arrow drawing but is 4-10x faster |
| Programmatic annotation | Manual (Shottr, Ksnip) | Manual tools offer richer annotation UX but aren't repeatable/scriptable |

**Installation:**
```bash
npm install --save-dev playwright @playwright/test
npm install --save-dev sharp
```

## Architecture Patterns

### Recommended Screenshot Project Structure
```
.planning/phases/05-visual-capture/
├── screenshots/                  # Output directory (gitignored or committed based on config)
│   ├── 01-initial-states/       # Empty calendar, no selection
│   ├── 02-slot-states/          # Available, booked, past, current, blocked
│   ├── 03-booking-flow/         # Panel open → user → duration → confirm
│   ├── 04-book-now-button/      # Visible vs hidden states
│   ├── 05-timezone-toggle/      # QLD vs NSW display modes
│   ├── 06-responsive/           # Mobile/tablet breakpoints
│   └── 07-annotated/            # Final annotated versions
├── scripts/
│   ├── capture-all.mjs          # Main orchestration script
│   ├── capture-states.mjs       # Individual state capture functions
│   ├── annotate.mjs             # Annotation overlay script
│   └── helpers.mjs              # Shared utilities
└── 05-RESEARCH.md               # This file
```

### Pattern 1: State Orchestration Script
**What:** Playwright script that programmatically triggers every UI state before capturing
**When to use:** Always, for comprehensive coverage and repeatability
**Example:**
```javascript
// Source: Playwright official docs + research synthesis
import { chromium } from 'playwright';

async function captureInitialStates() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('https://booking-bmo-financial-solutions.vercel.app');

  // VCAP-01: Initial empty state
  await page.screenshot({
    path: 'screenshots/01-initial-states/001-empty-calendar-no-selection.png',
    fullPage: true
  });

  // VCAP-02: Date selected showing time grid
  await page.click('[data-day="2"]'); // Click a future date
  await page.waitForTimeout(200); // Wait for animation
  await page.screenshot({
    path: 'screenshots/01-initial-states/002-date-selected-time-grid.png',
    fullPage: true
  });

  await browser.close();
}
```

### Pattern 2: Element-Specific Capture
**What:** Capture individual UI components in isolation for close-up documentation
**When to use:** When documenting specific interactive elements or states
**Example:**
```javascript
// Capture just the Book Now button (visible state)
await page.locator('.book-now-button').screenshot({
  path: 'screenshots/04-book-now-button/book-now-visible.png'
});
```

### Pattern 3: Responsive Breakpoint Testing
**What:** Capture at standard breakpoints using viewport sizing
**When to use:** VCAP-07 requirement for mobile/tablet views
**Example:**
```javascript
// Source: BrowserStack responsive testing guide 2026
const breakpoints = [
  { name: 'mobile', width: 375, height: 667 },   // iPhone SE
  { name: 'tablet', width: 768, height: 1024 },  // iPad
  { name: 'desktop', width: 1440, height: 900 }
];

for (const bp of breakpoints) {
  await page.setViewportSize({ width: bp.width, height: bp.height });
  await page.screenshot({
    path: `screenshots/06-responsive/${bp.name}-view.png`,
    fullPage: true
  });
}
```

### Pattern 4: Annotation Overlay
**What:** Add text labels and descriptions to screenshots programmatically
**When to use:** VCAP-08 requirement for annotated screenshots
**Example:**
```javascript
// Source: Sharp documentation + research synthesis
import sharp from 'sharp';

async function annotateScreenshot(inputPath, outputPath, annotations) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Create SVG overlay with text labels
  const svgOverlay = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <style>
        .label { fill: #FF0000; font-family: Arial; font-size: 16px; font-weight: bold; }
        .arrow { stroke: #FF0000; stroke-width: 3; fill: none; marker-end: url(#arrowhead); }
      </style>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#FF0000" />
        </marker>
      </defs>
      ${annotations.map(a => `
        <text x="${a.x}" y="${a.y}" class="label">${a.text}</text>
      `).join('')}
    </svg>
  `;

  await image
    .composite([{ input: Buffer.from(svgOverlay), top: 0, left: 0 }])
    .toFile(outputPath);
}

// Usage:
await annotateScreenshot(
  'screenshots/02-slot-states/available.png',
  'screenshots/07-annotated/available-annotated.png',
  [
    { x: 100, y: 50, text: 'Header: Book Now Button' },
    { x: 200, y: 300, text: 'Available Slot (green)' }
  ]
);
```

### Anti-Patterns to Avoid
- **Manual screenshot workflow** - Not repeatable when UI changes; automation ensures consistency
- **Single viewport capture** - Misses responsive states; always test mobile/tablet breakpoints
- **No state setup** - Clicking randomly produces incomplete coverage; orchestrate all states programmatically
- **Inconsistent naming** - `Screenshot 2026-02-13 at 3.24.15 PM.png` vs `001-empty-calendar.png`; use descriptive, sortable names
- **Repository bloat** - Committing large PNGs without compression; use Git LFS or external storage if images exceed 5MB total

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Browser automation | Custom HTTP requests + DOM parsing | Playwright | Handles JS rendering, waiting, animations, cross-browser differences |
| Image annotation overlays | Custom canvas drawing | Sharp (SVG composite) or marker.js | Text rendering, positioning, anti-aliasing already solved |
| Screenshot diffing/comparison | Pixel-by-pixel comparison loops | Percy, Chromatic, or Playwright visual regression | Handles anti-aliasing differences, smart diffing algorithms |
| Responsive testing | Manual window resizing | Playwright viewport API | Precise dimensions, device emulation, touch events |
| State orchestration | Manual clicking in DevTools | Playwright scripts | Repeatable, fast, can run in CI, catches all edge cases |

**Key insight:** Screenshot automation is deceptively complex. Timing issues (animations, async rendering), cross-browser rendering differences, and state coverage gaps plague hand-rolled solutions. Playwright's ecosystem has battle-tested these problems across thousands of projects.

## Common Pitfalls

### Pitfall 1: Screenshot Staleness
**What goes wrong:** Screenshots quickly become outdated when UI changes, making documentation untrustworthy
**Why it happens:** Manual screenshot workflows are time-consuming to update; changes slip through
**How to avoid:**
- Automate screenshot capture in a script that can be re-run on demand
- Version control screenshots alongside code if commit_docs is true
- Add comments in script linking each screenshot to its requirement (e.g., `// VCAP-01`)
**Warning signs:** User says "these screenshots don't match what I see" or notices outdated styling

### Pitfall 2: Incomplete State Coverage
**What goes wrong:** Missing critical UI states (e.g., forgot to capture "blocked by multi-hour booking" slot)
**Why it happens:** No checklist or systematic approach; relying on memory
**How to avoid:**
- Create state coverage matrix from requirements before starting
- Cross-reference each screenshot filename with requirement ID
- Automated script ensures every state is hit
**Warning signs:** During planning, planner asks "what does X look like?" and no screenshot exists

### Pitfall 3: Timing Issues in Screenshots
**What goes wrong:** Capturing screenshots before animations complete, resulting in half-rendered states
**Why it happens:** `page.screenshot()` executes immediately; doesn't wait for CSS transitions/animations
**How to avoid:**
- Use `await page.waitForTimeout(300)` after interactions that trigger animations
- Wait for network idle: `await page.waitForLoadState('networkidle')`
- For specific elements: `await page.waitForSelector('.element', { state: 'visible' })`
**Warning signs:** Screenshots show elements mid-transition or partially rendered

### Pitfall 4: Annotation Inconsistency
**What goes wrong:** Different annotation styles (colors, fonts, label formats) across screenshots confuse the reader
**Why it happens:** Manual annotation with different tools or no style guide
**How to avoid:**
- Use programmatic annotation with predefined styles
- If manual, create annotation style guide (font, color, arrow style)
- Keep all annotations in same color scheme (e.g., red for interactive elements, blue for state descriptions)
**Warning signs:** Screenshots look like they're from different documentation sets

### Pitfall 5: Mobile/Responsive Assumptions
**What goes wrong:** Assuming desktop layout scales cleanly to mobile; missing mobile-specific interactions
**Why it happens:** Testing only at desktop resolution; not checking actual mobile breakpoints
**How to avoid:**
- Test at standard breakpoints: 375px (mobile), 768px (tablet), 1440px (desktop)
- Check touch targets (buttons sized for fingers, not mouse cursors)
- Capture both portrait and landscape on mobile if applicable
**Warning signs:** Mobile users report layout issues not visible in screenshots

### Pitfall 6: File Size Bloat
**What goes wrong:** Full-page PNG screenshots at 4K resolution create 5-10MB files each; 50 screenshots = 250MB+ repo bloat
**Why it happens:** Default screenshot settings use lossless PNG at full resolution
**How to avoid:**
- Use `quality` parameter for JPEG format where acceptable
- Resize images to max 1920px width if higher resolution isn't needed
- Use Git LFS for large binary files if committing to repo
- Compress PNGs with tools like pngquant if staying with PNG
**Warning signs:** Git operations slow down, PRs take forever to load, clone times increase

## Code Examples

Verified patterns from official sources:

### Full Screenshot Capture Script
```javascript
// Source: Playwright screenshots documentation
// https://playwright.dev/docs/screenshots

import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';

async function captureAll() {
  // Create output directories
  await mkdir('screenshots/01-initial-states', { recursive: true });
  await mkdir('screenshots/02-slot-states', { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  // Navigate to deployed app
  await page.goto('https://booking-bmo-financial-solutions.vercel.app', {
    waitUntil: 'networkidle'
  });

  // VCAP-01: Initial empty calendar
  await page.screenshot({
    path: 'screenshots/01-initial-states/001-empty-calendar-no-selection.png',
    fullPage: true
  });

  // VCAP-02: Date selected with time grid
  const futureDate = await page.locator('.calendar-day:not(.past):not(.today)').first();
  await futureDate.click();
  await page.waitForTimeout(300); // Wait for grid animation
  await page.screenshot({
    path: 'screenshots/01-initial-states/002-date-selected-time-grid.png',
    fullPage: true
  });

  await browser.close();
}

captureAll().catch(console.error);
```

### Responsive Breakpoint Capture
```javascript
// Source: BrowserStack responsive design guide 2026
// https://www.browserstack.com/guide/responsive-design-breakpoints

const BREAKPOINTS = [
  { name: 'mobile-sm', width: 375, height: 667 },    // iPhone SE
  { name: 'mobile-lg', width: 414, height: 896 },    // iPhone Pro Max
  { name: 'tablet', width: 768, height: 1024 },      // iPad
  { name: 'desktop', width: 1440, height: 900 },     // Common desktop
  { name: 'desktop-xl', width: 1920, height: 1080 }  // Full HD
];

async function captureResponsive(page, url, screenshotName) {
  for (const bp of BREAKPOINTS) {
    await page.setViewportSize({ width: bp.width, height: bp.height });
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500); // Allow layout to settle

    await page.screenshot({
      path: `screenshots/06-responsive/${bp.name}-${screenshotName}.png`,
      fullPage: true
    });
  }
}
```

### Annotation with Sharp
```javascript
// Source: Sharp documentation + research synthesis
// https://sharp.pixelplumbing.com/

import sharp from 'sharp';

async function addTextOverlay(inputPath, outputPath, label, position) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();

  // Create SVG text overlay
  const svgText = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.5"/>
        </filter>
      </defs>
      <text
        x="${position.x}"
        y="${position.y}"
        font-family="Arial"
        font-size="18"
        font-weight="bold"
        fill="#FF0000"
        filter="url(#shadow)">
        ${label}
      </text>
    </svg>
  `;

  await image
    .composite([{ input: Buffer.from(svgText), top: 0, left: 0 }])
    .toFile(outputPath);
}

// Usage:
await addTextOverlay(
  'screenshots/03-booking-flow/001-panel-open.png',
  'screenshots/07-annotated/001-panel-open-annotated.png',
  'Booking Panel (slides from right)',
  { x: 50, y: 50 }
);
```

### State Coverage Checklist Script
```javascript
// Pattern for ensuring all requirements captured

const REQUIRED_SCREENSHOTS = {
  'VCAP-01': ['001-empty-calendar-no-selection.png'],
  'VCAP-02': ['002-date-selected-time-grid.png'],
  'VCAP-03': [
    '003-slot-available.png',
    '004-slot-booked.png',
    '005-slot-past.png',
    '006-slot-current-hour.png',
    '007-slot-blocked-multi-hour.png'
  ],
  'VCAP-04': [
    '008-panel-open.png',
    '009-user-selected.png',
    '010-duration-selected.png',
    '011-confirmation.png'
  ],
  // ... etc
};

async function verifyCompleteness() {
  const { readdir } = await import('fs/promises');
  const allFiles = await readdir('screenshots', { recursive: true });

  for (const [reqId, files] of Object.entries(REQUIRED_SCREENSHOTS)) {
    for (const file of files) {
      if (!allFiles.some(f => f.includes(file))) {
        console.error(`Missing: ${reqId} - ${file}`);
      }
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual screenshots (Cmd+Shift+4) | Playwright automated capture | 2020-2023 | Repeatability, consistency, CI integration |
| Puppeteer (Chrome only) | Playwright (cross-browser) | 2021-2024 | Firefox/WebKit support, better API, MCP integration |
| Screenshot + inspect element for details | MCP Screenshot Server with AI | 2026 | AI agents can capture + analyze autonomously |
| Repository-committed PNGs | Git LFS or cloud storage | 2023-2025 | Reduced repo bloat, faster clones |
| Manual annotation (Photoshop/Sketch) | Programmatic overlays (Sharp/SVG) | 2024-2026 | Automation, consistency, regeneration capability |

**Deprecated/outdated:**
- **Selenium WebDriver screenshots**: Slower, less reliable than Playwright; ecosystem moved to Playwright
- **PhantomJS**: Project abandoned 2018; use headless Chrome/Playwright instead
- **BackstopJS**: Still works but Percy/Chromatic offer better UX for visual regression; BackstopJS good for self-hosted needs

## Open Questions

Things that couldn't be fully resolved:

1. **Should screenshots be committed to .planning or stored externally?**
   - What we know: `commit_docs: true` in config.json suggests committing planning docs
   - What's unclear: Screenshot binary size may bloat repo; Git LFS adds complexity
   - Recommendation: Start with committed PNGs (compressed); move to Git LFS if size exceeds 50MB total

2. **How to handle dynamic content (dates, booking names)?**
   - What we know: Screenshots should show realistic data for spec clarity
   - What's unclear: Should we seed test data or capture live production state?
   - Recommendation: Seed controlled test data via API or localStorage manipulation for consistency

3. **Annotation depth: programmatic vs manual?**
   - What we know: VCAP-08 requires annotations; Sharp can do text overlays
   - What's unclear: Complex arrows, callouts, shape highlighting harder programmatically
   - Recommendation: Use Sharp for simple text labels; manual annotation (Shottr/Ksnip) for complex diagrams, then document annotation process

4. **Should video/GIF capture supplement static screenshots?**
   - What we know: Some interactions (animations, multi-step flows) hard to document in stills
   - What's unclear: Adds file size; Rails consumer may not need animation details
   - Recommendation: Capture static screenshots first; add 1-2 GIFs for key interactions (booking flow, Book Now pulse) if planning reveals gaps

## Sources

### Primary (HIGH confidence)
- [Playwright Screenshots Documentation](https://playwright.dev/docs/screenshots) - Official API reference
- [Sharp Documentation](https://sharp.pixelplumbing.com/) - Image manipulation library
- [BrowserStack Responsive Design Breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints) - Industry standard breakpoints
- [Playwright vs Puppeteer 2026 Comparison](https://www.browserstack.com/guide/playwright-vs-puppeteer) - Tool selection rationale

### Secondary (MEDIUM confidence)
- [Screenshot Testing Complete Guide](https://www.lost-pixel.com/blog/screenshot-testing) - Visual regression best practices
- [UI Testing Checklist](https://www.browserstack.com/guide/ui-testing-checklist) - State coverage patterns
- [Visual Regression Testing 2026 Guide](https://www.getpanto.ai/blog/visual-regression-testing-in-mobile-qa) - Baseline management approaches
- [Screenshot Documentation Pitfalls](https://thisisimportant.net/posts/screenshots-in-documentation/) - Common mistakes
- [File Naming Conventions](https://www.hubrise.com/contributing/screenshots-guide) - Organization best practices

### Tertiary (LOW confidence)
- [Playwright MCP Integration](https://github.com/microsoft/playwright-mcp) - AI-assisted automation (emerging, 2026)
- [Glitter AI Screenshot Annotation](https://www.glitter.io/glossary/screenshot-annotation) - AI-powered annotation (marketing-focused)
- [Screenshot Story Flows Framework](https://appscreenshotstudio.com/blog/screenshot-story-flows-the-2026-framework-for-high-conversio) - App Store optimization (different domain)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Playwright and Sharp are industry standards with official documentation verified
- Architecture: HIGH - Patterns verified from official Playwright docs and community best practices
- Pitfalls: MEDIUM - Based on documentation guides and community articles, not firsthand project failures

**Research date:** 2026-02-13
**Valid until:** 2026-03-13 (30 days - stable domain; Playwright API changes infrequently)

**Notes:**
- No Context7 integration needed; Playwright and Sharp documentation verified via official sources
- React 18 + Vite 6 project context understood from codebase review
- Deployed app at https://booking-bmo-financial-solutions.vercel.app confirmed as screenshot target
- Phase focuses on visual capture only; code extraction is Phase 6 (can run in parallel)
