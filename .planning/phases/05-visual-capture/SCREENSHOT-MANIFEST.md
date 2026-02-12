# Visual Capture Manifest

## Overview

**Total screenshots:** 20 raw + 20 annotated (40 total)
**Captured from:** https://booking-bmo-financial-solutions.vercel.app
**Capture date:** 2026-02-13
**Primary viewport:** 1440x900 (desktop default)
**Additional viewports:** 375px (mobile), 768px (tablet)

**Purpose:** Provide comprehensive visual documentation of the BMO Financial Solutions booking form for AI-powered recreation. Every interactive element, state, and responsive behavior is captured and annotated.

## Requirements Coverage

| Req ID  | Requirement                              | Screenshots | Status   |
|---------|------------------------------------------|-------------|----------|
| VCAP-01 | Initial load state                       | 1           | Complete |
| VCAP-02 | Date selected + time grid                | 2           | Complete |
| VCAP-03 | All slot visual states                   | 5           | Complete |
| VCAP-04 | Complete booking flow sequence           | 4           | Complete |
| VCAP-05 | Book Now button visibility               | 1           | Complete |
| VCAP-06 | Timezone toggle (QLD/NSW)                | 3           | Complete |
| VCAP-07 | Responsive layouts                       | 4           | Complete |
| VCAP-08 | Annotated versions with labels           | 20          | Complete |

**Total coverage:** 8/8 requirements (100%)

---

## Screenshot Index

### 01-initial-states/ (3 screenshots)

Initial page load and empty calendar views.

| File                              | Requirement | Description                                                                 | Key Elements                                          |
|-----------------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| 000-initial-load.png              | VCAP-01     | App initial load, today's date (Feb 13), time slots 6AM-10PM visible       | Header, Book Now button, date navigation, time grid   |
| 001-empty-calendar-full-day.png   | VCAP-02     | Empty calendar for Saturday Feb 14, all 16 slots available                  | Full day grid, all slots in available state           |
| 002-date-selected-with-panel.png  | VCAP-02     | 7:00 AM slot selected, booking panel slides in from right                  | Selected slot highlight, panel with WHO/DURATION      |

**Annotated versions:** All 3 files in `07-annotated/` with prefix `01-initial-states--`

---

### 02-slot-states/ (5 screenshots)

Visual states for individual time slots showing CSS classes and interaction modes.

| File                           | Requirement | Description                                                                 | Key Elements                                          |
|--------------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| 001-slot-available.png         | VCAP-03     | Available slot with cyan border, clickable                                  | CSS: .slot-available, hover state                     |
| 002-slot-booked-and-blocked.png| VCAP-03     | Booked slot with orange/salmon fill, non-interactive                        | CSS: .slot-booked, disabled state                     |
| 003-slots-past.png             | VCAP-03     | Past time slots dimmed/grayed out, disabled                                 | CSS: .slot-past, lower opacity                        |
| 004-current-hour-slot.png      | VCAP-03     | Current hour slot with special highlighting                                 | Triggers Book Now button visibility                   |
| 005-multi-hour-booking-block.png| VCAP-03    | Multi-hour booking spanning 2-3 consecutive slots                           | Vertical block, all slots marked booked               |

**Annotated versions:** All 5 files in `07-annotated/` with prefix `02-slot-states--`

---

### 03-booking-flow/ (4 screenshots)

Sequential booking flow from slot selection to confirmation.

| File                                | Requirement | Description                                                                 | Key Elements                                          |
|-------------------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| 001-panel-open-slot-selected.png    | VCAP-04     | Step 1: 7:00 AM slot clicked, panel appears with WHO section                | Slot highlighted, user selection buttons with hotkeys |
| 002-user-selected.png               | VCAP-04     | Step 2: Jack selected via [J] hotkey, duration options enabled              | User highlighted, duration buttons active             |
| 003-duration-options-visible.png    | VCAP-04     | Step 3: Duration options shown ([1] 1hr, [2] 2hr, [3] 3hr)                 | Three duration choices, hotkey indicators             |
| 004-booking-confirmed.png           | VCAP-04     | Step 4: Duration selected, booking confirmed, slot turns orange             | Booked slot state, panel shows completion             |

**Annotated versions:** All 4 files in `07-annotated/` with prefix `03-booking-flow--`

---

### 04-book-now-button/ (1 screenshot)

Book Now button visible/hidden states based on current hour availability.

| File                   | Requirement | Description                                                                 | Key Elements                                          |
|------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| 001-book-now-visible.png| VCAP-05    | Book Now [B] button visible and pulsing when current hour is available      | Button in header, hotkey indicator, animated pulse    |

**Annotated versions:** 1 file in `07-annotated/` with prefix `04-book-now-button--`

**Note:** Book Now button is hidden when current hour is booked, past, or outside operating hours. Only the visible state was captured as the hidden state is absence of the button.

---

### 05-timezone-toggle/ (3 screenshots)

Timezone toggle between QLD (default) and NSW (+1 hour DST offset).

| File                   | Requirement | Description                                                                 | Key Elements                                          |
|------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| 001-qld-default.png    | VCAP-06     | Default QLD timezone, no offset, time labels show standard time            | [T] QLD button, 6:00 AM first slot                    |
| 002-nsw-active.png     | VCAP-06     | NSW timezone active, visual indicator shows NSW selected                    | [T] NSW button highlighted, +1h indicator             |
| 003-nsw-time-slots.png | VCAP-06     | NSW time slots showing +1 hour offset (7:00 AM first slot instead of 6:00) | All time labels shifted +1 hour                       |

**Annotated versions:** All 3 files in `07-annotated/` with prefix `05-timezone-toggle--`

---

### 06-responsive/ (4 screenshots)

Responsive layout behavior at three breakpoints: desktop, tablet, mobile.

| File                      | Requirement | Description                                                                 | Key Elements                                          |
|---------------------------|-------------|-----------------------------------------------------------------------------|-------------------------------------------------------|
| desktop-full-page.png     | VCAP-07     | Desktop layout at 1440px width, centered grid with optimal spacing          | Full header, centered time grid, all buttons visible  |
| tablet-full-page.png      | VCAP-07     | Tablet layout at 768px width, intermediate sizing                           | Adjusted grid width, touch-friendly targets           |
| mobile-full-page.png      | VCAP-07     | Mobile layout at 375px width, stacked full-width slots                      | Compact header, vertical stacking, large tap targets  |
| mobile-with-panel.png     | VCAP-07     | Mobile booking panel overlay with dark backdrop dimming calendar            | Full-screen panel, backdrop overlay, touch-optimized  |

**Annotated versions:** All 4 files in `07-annotated/` with prefix `06-responsive--`

---

### 07-annotated/ (20 screenshots)

Annotated versions of all raw screenshots with red text labels identifying UI elements and states.

**Annotation style:**
- **Font:** Arial, 18px bold
- **Color:** Red (#FF0000) with subtle black stroke
- **Background:** Semi-transparent dark rectangles (rgba(0,0,0,0.85))
- **Content:** Element name + state description (e.g., "Book Now [B] — Visible when current hour available")

**File naming:** Category prefix with double-dash separator (e.g., `01-initial-states--000-initial-load.png`)

**Total annotated files:** 20 (100% coverage of raw screenshots)

---

## Capture Notes

### Browser & Environment
- **Browser:** Chromium (via Playwright)
- **User agent:** Automated browser (headless: false for accuracy)
- **JavaScript:** Enabled
- **Cookies:** Enabled (session persistence)

### Capture Methodology
1. **Automated script:** Playwright-based capture-all.mjs
2. **Wait strategy:** Explicit waits for UI elements to ensure accurate timing
3. **State setup:** Programmatic interactions (clicks, hotkeys) to reach specific states
4. **Consistency:** Same time of day capture for current hour slot accuracy

### Quality Checks
- ✅ All screenshots > 10KB (no blank/error pages)
- ✅ Interactive elements visible and clearly identifiable
- ✅ Text labels readable at default zoom
- ✅ Consistent dark theme across all captures
- ✅ Responsive breakpoints match actual CSS media queries

### Known Limitations
1. **Dynamic content:** Screenshots capture a specific date (Feb 13-14, 2026). Past/current/future slot logic is time-dependent.
2. **Animation frames:** Static images show one frame of pulsing/animated elements (e.g., Book Now button).
3. **Hover states:** Hover effects not captured (screenshots show default non-hover state).

---

## Usage Guidelines

### For AI Consumers
1. **Start with annotated screenshots** (`07-annotated/`) for labeled reference
2. **Use raw screenshots** (01-06) for pixel-perfect visual truth
3. **Cross-reference manifest** to map visual states to requirements
4. **Read annotations** to understand element names, CSS classes, and interaction patterns

### For Human Reviewers
1. Open annotated versions to quickly identify labeled elements
2. Compare multiple states side-by-side (e.g., all slot states)
3. Verify responsive behavior across breakpoints
4. Check booking flow sequence for completeness

### File Organization
```
screenshots/
├── 01-initial-states/       # Raw: Initial load & empty calendar
├── 02-slot-states/          # Raw: All slot visual states
├── 03-booking-flow/         # Raw: Booking sequence steps
├── 04-book-now-button/      # Raw: Button visibility
├── 05-timezone-toggle/      # Raw: QLD/NSW timezone
├── 06-responsive/           # Raw: Responsive layouts
└── 07-annotated/            # Annotated versions of all above
```

---

**Manifest version:** 1.0
**Last updated:** 2026-02-13
**Maintained by:** Visual Capture Phase (05-02)
