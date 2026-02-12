# Responsive Behavior Specification

## Overview

The booking interface adapts to three breakpoints: mobile (max 600px), tablet (max 768px), and desktop (769px+). Changes are primarily spacing adjustments, touch target sizing, and full-screen overlays on mobile. The core interaction model and visual design remain consistent across all viewports.

**Technology note:** This document describes WHAT changes at WHICH breakpoints with exact CSS values. The Rails application should implement equivalent responsive behavior using its chosen CSS approach.

---

## Breakpoint Definitions

| Breakpoint | Media Query | Classification | Typical Devices | Source Files |
|------------|-------------|----------------|-----------------|--------------|
| **Mobile** | `max-width: 600px` | Small phones | iPhone SE, Android phones | Header.css:251, BookingBlock.css:244, TimeStrip.css:26 |
| **Tablet** | `max-width: 768px` | Tablets, large phones | iPad mini, large Android tablets | BookingPanel.css:147, BookingPopup.css:244, WeekView.css:174 |
| **Desktop** | `769px+` | Laptops, monitors | MacBooks, desktop displays | All files (default styles, no media query) |

**Media query logic:**
- Mobile styles apply at 600px and below
- Tablet styles apply at 768px and below (includes mobile range)
- Desktop styles are default (no media query wrapper)

**Overlap note:** Some components use mobile breakpoint (600px), others use tablet (768px). This is intentional — panel/popup need full-screen treatment earlier than header/grid components.

---

## Per-Component Responsive Changes

### Header Component

**Breakpoint:** `max-width: 600px` (mobile only)

| Property | Desktop (default) | Mobile (≤600px) | Source |
|----------|-------------------|-----------------|--------|
| Container padding | `16px 32px` | `16px` (reduced horizontal) | Header.css:252-254 |
| `.header-top` layout | `flex-direction: row` (side-by-side) | `flex-direction: column` with `12px` gap (stacked) | Header.css:256-259 |
| Keyboard hints bar | Visible | **Hidden** (`display: none`) | Header.css:261-263 |
| Week toggle button | Visible | **Hidden** (`display: none`) | Header.css:265-267 |
| Timezone toggle padding | `10px 20px` | `8px 12px` (smaller touch target) | Header.css:269-272 |
| Timezone toggle font | `0.9rem` | `0.8rem` (smaller text) | Header.css:269-272 |

**Visual impact:**
- Title and actions stack vertically instead of side-by-side
- Screen space saved by hiding keyboard hints (irrelevant on touch)
- Week toggle hidden to prioritize more critical controls

---

### TimeStrip Component

**Breakpoint:** `max-width: 600px` (mobile only)

| Property | Desktop (default) | Mobile (≤600px) | Source |
|----------|-------------------|-----------------|--------|
| Width | `360px` (fixed) | `100%` (fluid, fills available space) | TimeStrip.css:26-33 |
| Max-width | `360px` | `100%` | TimeStrip.css:26-33 |
| Padding | `12px` | `16px` (slightly more breathing room) | TimeStrip.css:29 |
| Margin | None | `0 12px` (horizontal gutter from screen edges) | TimeStrip.css:31 |

**Visual impact:**
- Desktop: Fixed-width centered column
- Mobile: Full-width slots with small gutters from screen edges
- Allows larger touch targets for time slots

---

### BookingBlock Component

**Breakpoint:** `max-width: 600px` (mobile only)

| Property | Desktop (default) | Mobile (≤600px) | Source |
|----------|-------------------|-----------------|--------|
| Padding | `12px 20px` | `10px 16px` (slightly reduced) | BookingBlock.css:244-248 |
| Font size (`.booking-block-info`) | `0.875rem` | `0.8rem` | BookingBlock.css:249-251 |
| Cancel hint font | `0.75rem` | `0.7rem` | BookingBlock.css:253-255 |

**Visual impact:**
- Slightly more compact text on mobile
- Proportional scaling maintains readability
- No change to hover effects or color scheme

---

### BookingPanel Component

**Breakpoint:** `max-width: 768px` (tablet and mobile)

| Property | Desktop (default) | Tablet/Mobile (≤768px) | Source |
|----------|-------------------|------------------------|--------|
| Width | `340px` (fixed sidebar) | `100%` (full-screen overlay) | BookingPanel.css:147-152 |
| Max-width | None | `100%` | BookingPanel.css:150 |

**Visual impact:**
- **Desktop:** Side panel slides in from right (340px width)
- **Tablet/Mobile:** Full-screen overlay, uses entire viewport width
- Same content layout, just fills the screen
- Dark backdrop behind panel (dims calendar) — see mobile-specific behaviors section

**Why full-screen:** Touch interfaces benefit from maximum target sizes and elimination of off-canvas tapping issues

---

### BookingPopup Component

**Breakpoint:** `max-width: 768px` (tablet and mobile)

| Property | Desktop (default) | Tablet/Mobile (≤768px) | Source |
|----------|-------------------|------------------------|--------|
| Width | `340px` | `100%` | BookingPopup.css:244-249 |
| Max-width | `90vw` (10vw margins) | `calc(100vw - 32px)` (16px margins) | BookingPopup.css:247 |

**Visual impact:**
- **Desktop:** Centered modal dialog (340px width, max 90% of viewport)
- **Tablet/Mobile:** Nearly full-width dialog (32px total gutters)
- Larger touch targets for edit actions
- Same content, different container sizing

---

### WeekView Component

**Breakpoint:** `max-width: 768px` (tablet and mobile)

| Property | Desktop (default) | Tablet/Mobile (≤768px) | Source |
|----------|-------------------|------------------------|--------|
| Grid columns | `70px` time column + 7 equal day columns | `60px` time column + 7 equal day columns | WeekView.css:179-181 |
| Column header height | `50px` | `52px` (touch-friendly) | WeekView.css:188-190 |
| Time cell font | `0.7rem` | `0.65rem` (smaller) | WeekView.css:184-186 |
| Time cell height | Default | `28px` (down from 30px) | WeekView.css:186 |
| Day name font | `0.7rem` | `0.6rem` | WeekView.css:193-195 |
| Day date font | `1.1rem` | `0.9rem` | WeekView.css:197-199 |
| Week slot height | `30px` | `28px` | WeekView.css:201-203 |

**Visual impact:**
- Narrower time column saves horizontal space
- Slightly larger header touch targets (52px vs 50px)
- Smaller text throughout to fit more compactly
- Week slots 2px shorter (less whitespace)

---

### TimeSlot Component

**No responsive changes** — TimeSlot.css contains no media queries. Slot height (36px) is consistent across all breakpoints for touch accessibility.

---

### WeekDayOverlay & WeekBookingBlock Components

**No responsive changes** — These components inherit responsive behavior from their parent containers (WeekView) but have no component-specific breakpoint styles.

---

## Mobile-Specific Behaviors

Beyond CSS sizing changes, mobile viewports trigger these special behaviors:

### 1. Full-Screen Booking Panel

**Trigger:** BookingPanel opens on viewport ≤ 768px

**Behavior:**
- Panel fills 100% width and height
- Dark backdrop overlay appears behind panel (dims calendar)
- Backdrop is semi-transparent black with blur: `rgba(0, 0, 0, 0.6)` + `backdrop-filter: blur(4px)`
- Body scroll is locked (class `modal-open` added to `<body>`)
- Tapping backdrop closes panel

**Why:** Touch interfaces need maximum space, avoid accidental off-canvas taps

**Visual reference:** Screenshot `06-responsive/mobile-with-panel.png`

**Source:** BookingPanel.css:147-152 (CSS), parent component logic (JavaScript)

---

### 2. Hidden Keyboard UI Elements

**Trigger:** Viewport ≤ 600px

**Hidden elements:**
- Keyboard hints bar (below navigation, above grid)
- Week toggle button

**Why hidden:**
- **Hints bar:** Touch users don't use keyboard shortcuts; space better used for grid
- **Week toggle:** Space savings; week view still accessible on desktop

**Shortcuts still work:** If external keyboard connected to mobile device, shortcuts function (just no visual hints)

**Source:** Header.css:261-267

---

### 3. Touch Target Sizing

All interactive elements meet minimum 36px touch target size:

| Element | Touch Target | Breakpoint Adjustment |
|---------|--------------|----------------------|
| Time slots | 36px height | No change (already touch-friendly) |
| Week column headers | 50px → 52px | Slightly larger on mobile |
| Nav buttons | 48px × 48px | No change (already adequate) |
| User/duration buttons | 14px padding + content | No change (button height naturally exceeds 36px) |

**Compliance:** Meets WCAG 2.1 Level AAA (target size 44×44px) on most elements, Level AA (24×24px) on all elements

---

## Viewport Screenshot Comparisons

Visual reference for how the interface adapts at each breakpoint.

| Viewport | Width | Screenshot | Key Differences |
|----------|-------|------------|-----------------|
| **Desktop** | 1440px | `06-responsive/desktop-full-page.png` | Full header with hints bar, centered 360px time grid, all buttons visible, side panel mode |
| **Tablet** | 768px | `06-responsive/tablet-full-page.png` | Compact header, smaller text in week view, full-screen panel mode begins |
| **Mobile** | 375px | `06-responsive/mobile-full-page.png` | Stacked header layout, full-width time grid (fluid), hints bar hidden, week toggle hidden |
| **Mobile + Panel** | 375px | `06-responsive/mobile-with-panel.png` | Full-screen panel overlay, dark backdrop dimming calendar, body scroll locked |

**Screenshot details:**
- All captured using Playwright at exact breakpoint widths
- Dark theme consistent across all viewports
- Same booking data shown for comparison
- Annotated versions available with red text labels

**Location:** `.planning/phases/05-visual-capture/screenshots/06-responsive/`

**Manifest:** See SCREENSHOT-MANIFEST.md requirement VCAP-07

---

## What Does NOT Change Across Breakpoints

These elements remain consistent regardless of viewport size:

### Design System
- **Color palette:** All CSS custom properties unchanged
- **Font families:** Inter for UI, JetBrains Mono for time labels
- **Animation timings:** All transition/animation durations identical
- **Glow effects:** Cyan glow intensity and blur radius consistent

### Interaction Model
- **Slot states:** Available, occupied, past, selected logic unchanged
- **Booking flow:** User → duration → confirm sequence identical
- **Keyboard shortcuts:** All shortcuts work (hints just hidden on mobile)
- **Hover effects:** Same hover states (though less relevant on touch)

### Visual Hierarchy
- **Header layout order:** Title, actions, navigation, hints (stacks vertically on mobile but order preserved)
- **Panel sections:** User selection → duration selection → cancel button (same order all viewports)
- **Popup actions:** User/duration editing → done/delete buttons (same structure)

**Why consistency matters:** User switching between desktop and mobile sees same app, just adapted for screen size

---

## Responsive Design Patterns

### Pattern 1: Fluid Width with Fixed Max

Used by: TimeStrip

```
Desktop: width: 360px (fixed)
Mobile:  width: 100%, max-width: 100% (fluid)
```

**Purpose:** Fixed desktop layout for visual stability, fluid mobile for maximum space usage

---

### Pattern 2: Sidebar to Full-Screen Overlay

Used by: BookingPanel

```
Desktop: 340px side panel
Mobile:  100% width overlay with backdrop
```

**Purpose:** Desktop users see context (calendar behind panel), mobile users get focus (full-screen)

---

### Pattern 3: Centered Modal to Edge-Gutter Modal

Used by: BookingPopup

```
Desktop: 340px centered, max 90vw
Mobile:  100% width, max calc(100vw - 32px)
```

**Purpose:** Desktop has breathing room, mobile maximizes target sizes while avoiding absolute edges

---

### Pattern 4: Proportional Text Scaling

Used by: WeekView, BookingBlock

```
Desktop: Base font sizes
Mobile:  10-15% smaller fonts
```

**Purpose:** Fit more information in less space while maintaining readability

---

## CSS Media Query Syntax Reference

For Rails implementation, here are the exact media queries used:

### Mobile Breakpoint (600px)

```css
@media (max-width: 600px) {
  /* Header, TimeStrip, BookingBlock */
}
```

**Used by:** Header.css:251, TimeStrip.css:26, BookingBlock.css:244

---

### Tablet Breakpoint (768px)

```css
@media (max-width: 768px) {
  /* BookingPanel, BookingPopup, WeekView */
}
```

**Used by:** BookingPanel.css:147, BookingPopup.css:244, WeekView.css:174

---

## Implementation Notes for Rails

1. **Choose breakpoint strategy:** Match React (600px/768px) or use framework conventions (Tailwind: sm/md/lg)
2. **Test full-screen overlays:** Ensure panel/popup body scroll lock works on mobile
3. **Touch target audit:** Verify all interactive elements meet 36px minimum
4. **Hidden elements:** Implement display logic for hints bar and week toggle based on viewport
5. **Backdrop overlay:** Implement semi-transparent backdrop for mobile panel (not needed on desktop)

**Source files for reference:**
- Header.css:251-273 — Mobile header adaptations
- TimeStrip.css:26-33 — Fluid width logic
- BookingPanel.css:147-152 — Full-screen overlay
- BookingPopup.css:244-249 — Edge-gutter modal
- WeekView.css:174-204 — Week view tablet/mobile sizing
- BookingBlock.css:244-256 — Mobile text sizing

---

**Document version:** 1.0
**Last updated:** 2026-02-13
**Part of:** Phase 07 UI/UX Documentation
