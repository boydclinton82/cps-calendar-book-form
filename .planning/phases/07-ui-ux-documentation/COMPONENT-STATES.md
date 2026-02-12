# Component States Documentation

**Phase:** 07-ui-ux-documentation
**Created:** 2026-02-13
**Purpose:** Complete state matrix for every interactive element in the booking form

This document provides exhaustive state specifications for all interactive components. Each state includes trigger conditions, visual properties, CSS source references, and screenshot references where available.

## Overview

Interactive elements in the booking form have carefully designed state transitions to provide clear visual feedback. States range from basic (default, hover, focus) to complex (keyboard-focused, just-booked, disabled). Every state change is intentional and documented here for accurate Rails recreation.

**State Documentation Structure:**
- **CSS Class/Selector**: Applied class or pseudo-selector
- **Trigger**: What causes this state
- **Visual Properties**: All CSS changes (background, border, box-shadow, opacity, transform, cursor)
- **Source**: CSS file and line numbers
- **Screenshot**: Reference to Phase 5 screenshots (if captured)

---

## 1. Time Slot States

Time slots are the most complex interactive elements with 7 distinct states covering all possible conditions.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Opacity | Cursor | Transform | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|---------|--------|-----------|------------|--------|
| **Default** | `.time-slot` | Base state | rgba(15,25,45,0.5) | 1px solid rgba(0,229,229,0.2) | None | 1.0 | default | none | 01-initial-states/001 | TimeSlot.css:1-16 |
| **Available** | `.available` | Slot is bookable, not occupied, not past | rgba(15,25,45,0.7) | 1px solid var(--accent) #00E5E5 | 0 0 8px cyan glow + inset 0 0 12px | 1.0 | pointer | none | 02-slot-states/001 | TimeSlot.css:19-27 |
| **Available:hover** | `.available:hover` | Mouse over available slot | rgba(0,229,229,0.08) | 1px solid var(--accent) | 0 0 16px + 0 0 32px cyan glow + inset 0 0 20px | 1.0 | pointer | translateY(-1px) | 02-slot-states/001 | TimeSlot.css:29-37 |
| **Selected** | `.selected` | User clicked slot, booking panel open | rgba(0,229,229,0.15) | 2px solid var(--accent) | 0 0 20px + 0 0 40px + 0 0 60px cyan glow + inset 0 0 30px | 1.0 | default | none | 01-initial-states/002 | TimeSlot.css:40-49 |
| **Occupied** | `.occupied` | Booking exists for this slot (overlay shows booking block) | transparent | transparent | none | 1.0 | default | none | 02-slot-states/002 | TimeSlot.css:52-57 |
| **Past** | `.past` | Time has passed (current time > slot time) | rgba(30,58,95,0.3) | transparent | none | 0.35 | not-allowed | none | 02-slot-states/003 | TimeSlot.css:60-65 |
| **Keyboard-focused** | `.keyboard-focused` | Tab key navigation, slot has keyboard focus | (inherits available bg) | 2px solid #fbbf24 (gold) | 0 0 0 3px + 0 0 16px gold/amber glow (animated) | 1.0 | pointer | none | Not captured (CSS-only) | TimeSlot.css:105-112 |
| **Just-booked** | `.just-booked` | Immediately after booking confirmation (brief animation) | (inherits current state) | (inherits) | Animated pulse 0 → 0 0 30px cyan glow → 0 | 1.0 | default | none | Not captured (transient) | TimeSlot.css:100-102 |

### Time Label States

The time label inside each slot changes color and shadow based on slot state:

| State | Selector | Color | Text-Shadow | Visibility | Source |
|-------|----------|-------|-------------|------------|--------|
| **Default** | `.time-label` | rgba(140,170,200,0.9) | none | visible | TimeSlot.css:68-73 |
| **Available** | `.time-slot.available .time-label` | var(--accent) #00E5E5 | none | visible | TimeSlot.css:75-77 |
| **Available:hover** | `.time-slot.available:hover .time-label` | var(--accent) #00E5E5 | 0 0 10px cyan glow | visible | TimeSlot.css:79-83 |
| **Selected** | `.time-slot.selected .time-label` | var(--accent) #00E5E5 | 0 0 10px cyan glow | visible | TimeSlot.css:79-83 |
| **Occupied** | `.time-slot.occupied .time-label` | (inherited) | none | hidden | TimeSlot.css:86-88 |
| **Keyboard-focused** | `.time-slot.keyboard-focused .time-label` | #fbbf24 (gold) | 0 0 10px gold glow | visible | TimeSlot.css:114-117 |

**Special Animations:**

**glowPulse (booking confirmation):**
- **Duration:** 0.6s ease-out (single play)
- **Keyframes:** box-shadow pulses from 0 → 0 0 30px var(--accent-glow-strong) → 0
- **Source:** TimeSlot.css:91-98

**keyboardFocusPulse (keyboard focus indicator):**
- **Duration:** 1.5s ease-in-out infinite
- **Keyframes:** Gold box-shadow oscillates between subtle and strong
  - 0%, 100%: 0 0 0 3px rgba(251,191,36,0.3) + 0 0 16px rgba(251,191,36,0.4)
  - 50%: 0 0 0 4px rgba(251,191,36,0.5) + 0 0 24px rgba(251,191,36,0.6)
- **Source:** TimeSlot.css:119-130

**Notes:**
- **Occupied state** has transparent background and hidden time label because BookingBlock overlay shows user/time info
- **Keyboard-focused** uses gold (#fbbf24) to visually distinguish from cyan mouse focus (selected)
- **Past state** has reduced opacity (0.35) and not-allowed cursor to indicate non-interactivity

---

## 2. Book Now Button States

The Book Now button appears in the header when the current hour is available for booking.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Animation | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|-----------|------------|--------|
| **Visible (default)** | `.book-now-btn` | Current hour is available (not booked, not past) | var(--accent) #00E5E5 | 2px solid var(--accent) | 0 0 16px glow + inset 0 0 12px white highlight | none | pulse-glow 2s infinite | 04-book-now-button/001 | Header.css:41-55 |
| **Visible:hover** | `.book-now-btn:hover` | Mouse over button | var(--available-hover) #00ffff | 2px solid var(--accent) | 0 0 28px + 0 0 40px cyan glow | scale(1.05) | none (paused) | 04-book-now-button/001 | Header.css:66-71 |
| **Hidden** | (not rendered) | Current hour is unavailable, past, or booked | N/A | N/A | N/A | N/A | N/A | N/A | Conditional rendering |

**Button Content:**
- Text: "Book Now" (dark text color var(--bg-primary) #0a1628)
- Keyboard shortcut: "B" in monospace (opacity 0.9, font-size 0.8rem)

**pulse-glow Animation:**
- **Duration:** 2s ease-in-out infinite
- **Keyframes:**
  - 0%, 100%: box-shadow: 0 0 16px var(--accent-glow-strong), inset 0 0 12px rgba(255,255,255,0.1)
  - 50%: box-shadow: 0 0 24px var(--accent-glow-strong), 0 0 32px var(--accent-glow), inset 0 0 16px rgba(255,255,255,0.15)
- **Purpose:** Draws attention to quick booking action
- **Source:** Header.css:57-64

---

## 3. Week Toggle Button States

Toggles between day view and week view.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Color | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-------|------------|--------|
| **Default (inactive)** | `.week-toggle` | Week view is OFF (showing day view) | transparent | 2px solid var(--accent) | 0 0 12px cyan glow + inset 0 0 12px | var(--accent) #00E5E5 | 01-initial-states/001 | Header.css:78-91 |
| **Default:hover** | `.week-toggle:hover` | Mouse over while inactive | rgba(0,229,229,0.1) | 2px solid var(--accent) | 0 0 20px stronger glow + inset 0 0 20px | var(--accent) | N/A | Header.css:93-96 |
| **Active** | `.week-toggle.active` | Week view is ON (showing week view) | var(--accent) #00E5E5 | 2px solid var(--accent) | 0 0 24px strong glow | var(--bg-primary) #0a1628 (dark) | Not captured (week view) | Header.css:98-102 |

**Button Content:**
- Text: "Week" + keyboard shortcut "W" in monospace (opacity 0.8, font-size 0.8rem)

**Notes:**
- Hidden on mobile (max-width 600px) via `display: none`

---

## 4. Timezone Toggle Button States

Switches between Queensland (QLD) and New South Wales (NSW) timezones.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Color | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-------|------------|--------|
| **Default (QLD)** | `.timezone-toggle` | QLD timezone active | transparent | 2px solid var(--accent) | 0 0 12px cyan glow + inset 0 0 12px | var(--accent) #00E5E5 | 05-timezone-toggle/001 | Header.css:109-122 |
| **Default:hover** | `.timezone-toggle:hover` | Mouse over | rgba(0,229,229,0.1) | 2px solid var(--accent) | 0 0 20px stronger glow + inset 0 0 20px | var(--accent) | N/A | Header.css:124-127 |
| **Active (NSW)** | `.timezone-toggle.active` | NSW timezone active | var(--accent) #00E5E5 | 2px solid var(--accent) | 0 0 24px strong glow | var(--bg-primary) #0a1628 (dark) | 05-timezone-toggle/002 | Header.css:129-133 |

**Button Content:**
- Text: "QLD" or "NSW" + keyboard shortcut "T" in monospace (opacity 0.8, font-size 0.8rem)

**Notes:**
- Styling identical to week toggle but with different text and keyboard shortcut
- Smaller padding on mobile (8px 12px vs 10px 20px)

---

## 5. Navigation Button States

Four navigation buttons: previous day, next day, previous week, next week.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|------------|--------|
| **Default** | `.nav-btn` | Button idle | var(--accent) #00E5E5 | none (implicit) | 0 0 16px cyan glow + 0 4px 12px black depth | none | 01-initial-states/001 | Header.css:148-161 |
| **Hover** | `.nav-btn:hover` | Mouse over | var(--available-hover) #00ffff | none | 0 0 24px stronger glow + 0 6px 16px deeper shadow | scale(1.08) | N/A | Header.css:163-167 |
| **Active (pressed)** | `.nav-btn:active` | Mouse button down | (inherits hover) | none | (inherits) | scale(0.98) | N/A | Header.css:169-171 |

**Button Properties:**
- Size: 48x48px square
- Border-radius: 12px
- Font-size: 1.5rem (arrow symbols)
- Color: var(--bg-primary) #0a1628 (dark text on cyan background)

**Notes:**
- Press-down effect (scale 0.98) provides tactile feedback

---

## 6. Booking Panel Option Buttons

User selection buttons and duration selection buttons in the booking panel.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Cursor | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|--------|------------|--------|
| **Default** | `.option-btn` | Option not selected | var(--bg-tertiary) #1a2942 | 2px solid transparent | none | none | pointer | 03-booking-flow/001 | BookingPanel.css:68-79 |
| **Hover** | `.option-btn:hover:not(.disabled)` | Mouse over non-disabled option | rgba(0,229,229,0.1) | 2px solid var(--border-glow) rgba(0,229,229,0.4) | none | translateX(4px) | pointer | N/A | BookingPanel.css:81-85 |
| **Selected** | `.option-btn.selected` | User selected this option | var(--accent) #00E5E5 | 2px solid var(--accent) | 0 0 20px cyan glow | none | pointer | 03-booking-flow/002-003 | BookingPanel.css:87-92 |
| **Disabled** | `.option-btn.disabled` | Option unavailable (e.g., duration conflicts with existing booking) | var(--bg-tertiary) (dimmed) | transparent | none | none | not-allowed | Not captured | BookingPanel.css:99-101 |

**Option Content States:**

| Element | Selector | Default Color | Selected Color | Source |
|---------|----------|---------------|----------------|--------|
| **Keyboard Key** | `.option-key` | var(--accent) #00E5E5, opacity 0.8 | var(--bg-primary) #0a1628, opacity 0.8 | BookingPanel.css:104-108, 94-97 |
| **Label Text** | `.option-label` | var(--text-primary) #e2e8f0 | var(--bg-primary) #0a1628 | BookingPanel.css:110-118 |

**Notes:**
- **translateX(4px)** on hover creates indent effect suggesting selection
- **Disabled state** uses opacity 0.35 for entire button

---

## 7. Booking Panel Cancel Button

Cancel button at bottom of booking panel.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Color | Screenshot | Source |
|-------|-----------|---------|------------|--------|-------|------------|--------|
| **Default** | `.cancel-btn` | Button idle | transparent | 2px solid var(--border-subtle) rgba(0,229,229,0.15) | var(--text-secondary) #8caac8 | 03-booking-flow/001 | BookingPanel.css:120-133 |
| **Hover** | `.cancel-btn:hover` | Mouse over | rgba(220,38,38,0.1) (red tint) | 2px solid rgba(220,38,38,0.4) (red) | #f87171 (red) | N/A | BookingPanel.css:135-139 |

**Button Content:**
- Text: "Cancel" + keyboard shortcut "Esc" in monospace
- Key color: var(--text-muted) in default, inherits red on hover

**Notes:**
- Red color on hover signals destructive action (discarding booking)

---

## 8. Booking Popup Buttons

Three action buttons in the booking popup: Done, Delete, Close.

### Done Button

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|------------|--------|
| **Default** | `.done-btn` | Button idle | var(--accent) #00E5E5 | 2px solid var(--accent) | 0 0 20px cyan glow | none | 02-slot-states/004 | BookingPopup.css:162-176 |
| **Hover** | `.done-btn:hover` | Mouse over | var(--accent-light) #00ffff | 2px solid var(--accent-light) | 0 0 30px stronger glow | scale(1.02) | N/A | BookingPopup.css:178-183 |

**Content:**
- Text: "Done" (color: var(--bg-primary) #0a1628)
- Keyboard shortcut: "Enter" in monospace (opacity 0.8)

### Delete Button

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|------------|--------|
| **Default** | `.delete-btn` | Button idle | rgba(220,38,38,0.15) (red tint) | 2px solid rgba(220,38,38,0.3) (red) | none | none | 02-slot-states/004 | BookingPopup.css:191-203 |
| **Hover** | `.delete-btn:hover` | Mouse over | rgba(220,38,38,0.25) (stronger red) | 2px solid rgba(220,38,38,0.5) (stronger red) | 0 0 20px rgba(220,38,38,0.3) (red glow) | scale(1.02) | N/A | BookingPopup.css:205-210 |

**Content:**
- Text: "Delete Booking" (color: #f87171 red)
- Keyboard shortcut: "Shift+D" in monospace

### Close Button

| State | CSS Class | Trigger | Background | Border | Color | Screenshot | Source |
|-------|-----------|---------|------------|--------|-------|------------|--------|
| **Default** | `.close-btn` | Button idle | transparent | 2px solid var(--border-subtle) rgba(0,229,229,0.15) | var(--text-secondary) #8caac8 | 02-slot-states/004 | BookingPopup.css:218-231 |
| **Hover** | `.close-btn:hover` | Mouse over | rgba(0,229,229,0.05) (cyan tint) | 2px solid var(--border-glow) rgba(0,229,229,0.4) | var(--text-primary) #e2e8f0 | N/A | BookingPopup.css:233-236 |

**Content:**
- Text: "Close" + keyboard shortcut "Esc" in monospace

**Notes:**
- All three buttons share 14px 18px padding, 12px border-radius, full width
- Done and Delete have subtle scale(1.02) on hover for emphasis
- Close is visually subdued (no glow, no scale) as secondary action

---

## 9. Booking Block States

Booking blocks overlay occupied time slots with user-colored indicators. Pattern repeats for 6 user positions.

### Per-User Color States (Pattern applies to user-1 through user-6)

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Transform | Cursor | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-----------|--------|------------|--------|
| **Default** | `.booking-block.user-N` | Booking exists for this user at this slot | rgba(var(--user-N-rgb), 0.35) | 1px solid rgba(var(--user-N-rgb), 0.6) | 0 0 8px user glow + inset 0 0 12px | none | pointer | 02-slot-states/002, 005 | BookingBlock.css:18-24 (pattern) |
| **Hover** | `.booking-block.user-N:hover` | Mouse over booking block | rgba(var(--user-N-rgb), 0.18) (lower opacity) | 1px solid rgba(var(--user-N-rgb), 0.8) (stronger) | 0 0 16px + 0 0 32px user glow + inset 0 0 20px | translateY(-1px) | pointer | N/A | BookingBlock.css:32-40 (pattern) |
| **Focus** | `.booking-block.user-N:focus` | Keyboard focus on block | (inherits default) | (inherits) | (inherits) | (inherits) | pointer | Not captured | BookingBlock.css:46-49 (pattern) |

**Focus Outline:** 2px solid rgba(var(--user-N-rgb), 0.6), offset 2px

### User Color Mapping

| User Position | Color Name | Hex | RGB | CSS Classes | Source |
|---------------|------------|-----|-----|-------------|--------|
| **User 1** | Green | #4ADE80 | 74, 222, 128 | `.user-1` | BookingBlock.css:17-49 |
| **User 2** | Magenta | #E879F9 | 232, 121, 249 | `.user-2` | BookingBlock.css:51-83 |
| **User 3** | Gold | #FCD34D | 252, 211, 77 | `.user-3` | BookingBlock.css:85-117 |
| **User 4** | Purple | #A78BFA | 167, 139, 250 | `.user-4` | BookingBlock.css:119-151 |
| **User 5** | Coral | #FB923C | 251, 146, 60 | `.user-5` | BookingBlock.css:153-185 |
| **User 6** | Rose | #FDA4AF | 253, 164, 175 | `.user-6` | BookingBlock.css:187-219 |

### Booking Block Info Text

| State | Selector | Color | Text-Shadow | Font | Source |
|-------|----------|-------|-------------|------|--------|
| **Default** | `.booking-block.user-N .booking-block-info` | var(--user-N-color) | 0 0 6px rgba(var(--user-N-rgb), 0.4) | JetBrains Mono, 0.875rem | BookingBlock.css:26-30 (pattern) |
| **Hover** | `.booking-block.user-N:hover .booking-block-info` | var(--user-N-color) | 0 0 10px rgba(var(--user-N-rgb), 0.5) (stronger) | (inherits) | BookingBlock.css:42-44 (pattern) |

### Cancel Hint (on hover)

| State | Selector | Opacity | Source |
|-------|----------|---------|--------|
| **Default** | `.booking-block-cancel-hint` | 0 (hidden) | BookingBlock.css:227-238 |
| **Hover** | `.booking-block:hover .booking-block-cancel-hint` | 1 (visible) | BookingBlock.css:240-242 |

**Cancel Hint Properties:**
- Position: absolute, bottom 4px, centered
- Font-size: 0.75rem
- Color: var(--text-secondary) #8caac8
- Text: "(click to cancel)"

**Notes:**
- **Position-based colors** mean User 1 is always green regardless of name
- **Lower background opacity on hover** (0.35 → 0.18) makes underlying slot more visible
- **Stronger border on hover** (0.6 → 0.8 opacity) emphasizes interaction
- **Cancel hint fade-in** provides affordance for deletion action

---

## 10. Week View Column Headers

Day column headers in week view (clickable to jump to that day).

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Color | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|-------|------------|--------|
| **Default** | `.column-header` (button) | Day is not today | var(--bg-tertiary) #1a2942 | 2px solid transparent | none | Day name: var(--text-secondary), Date: var(--text-primary) | Not captured (week view) | WeekView.css:87-98 |
| **Hover** | `button.column-header:hover` | Mouse over clickable header | rgba(0,229,229,0.1) (cyan tint) | 2px solid var(--border-glow) | none | (inherits) | N/A | WeekView.css:104-107 |
| **Today** | `.column-header.today` | Header for current day | var(--accent) #00E5E5 | (inherits) | 0 0 20px cyan glow | var(--bg-primary) #0a1628 (dark) for both | Not captured | WeekView.css:109-117 |

**Header Content:**
- **Day name:** 0.7rem, uppercase, letter-spacing 0.05em
- **Day date:** 1.1rem, weight 700
- **Height:** 50px (52px on mobile max-width 768px)

**Notes:**
- Non-clickable headers (e.g., time column header) have transparent background and no border
- Today header uses same cyan background pattern as active toggle buttons

---

## 11. Week View Slot States

Simplified version of day view time slots for week grid.

### State Matrix

| State | CSS Class | Trigger | Background | Border | Box-Shadow | Opacity | Cursor | Screenshot | Source |
|-------|-----------|---------|------------|--------|------------|---------|--------|------------|--------|
| **Default** | `.week-slot` | Base state | none | 1px solid transparent | none | 1.0 | default | Not captured | WeekView.css:134-140 |
| **Available** | `.week-slot.available` | Slot is bookable | rgba(21,34,56,0.5) (dark subtle) | 1px solid rgba(0,229,229,0.1) (faint cyan) | none | 1.0 | default | N/A | WeekView.css:142-145 |
| **Available + Clickable** | `.week-slot.clickable` (with `.available`) | Clickable available slot | (inherits available) | (inherits) | none | 1.0 | pointer | N/A | WeekView.css:147-150 |
| **Available:hover** | `.week-slot.available:hover` | Mouse over available slot | rgba(0,229,229,0.15) (cyan) | 1px solid var(--accent) #00E5E5 | 0 0 12px cyan glow | 1.0 | pointer | N/A | WeekView.css:151-155 |
| **Occupied** | `.week-slot.occupied` | Booking exists (overlay shows block) | transparent | transparent | none | 1.0 | default | N/A | WeekView.css:158-161 |
| **Past** | `.week-slot.past` | Time has passed | rgba(30,58,95,0.2) (muted) | (inherits) | none | 0.4 | default | N/A | WeekView.css:163-166 |

**Slot Properties:**
- Height: 30px (28px on mobile max-width 768px)
- Border-radius: 5px
- Transition: all var(--transition-fast) 150ms ease-out

**Notes:**
- Week slots are more subtle than day view slots (smaller, less glow)
- No selected state (clicking navigates to day view instead of opening panel)
- No keyboard-focused or just-booked states in week view

---

## Summary Statistics

**Total Components Documented:** 11
- Time Slot (most complex: 7 states)
- Book Now Button (3 states)
- Week Toggle Button (3 states)
- Timezone Toggle Button (3 states)
- Navigation Buttons (3 states)
- Booking Panel Option Buttons (4 states)
- Booking Panel Cancel Button (2 states)
- Booking Popup Done Button (2 states)
- Booking Popup Delete Button (2 states)
- Booking Popup Close Button (2 states)
- Booking Block (3 states × 6 user colors = 18 total variations)
- Week View Column Headers (3 states)
- Week View Slots (6 states)

**Total Distinct States Documented:** 47+

**CSS Source References:** 35+

**Screenshot References:** 12+ (some states not captured: keyboard focus, animations, hover states)

**Design Token References:** 15+ (--accent, --bg-primary, --bg-tertiary, --text-primary, --text-secondary, --text-muted, --border-subtle, --border-glow, --glass-bg, --glass-border, --available-hover, --accent-light, --user-1-color through --user-6-color, --user-1-rgb through --user-6-rgb, --accent-glow, --accent-glow-strong, --transition-fast)

---

## Cross-References

**Referenced from LAYOUT-STRUCTURE.md:**
- Header region (buttons, navigation)
- TimeStrip container (time slots)
- BookingPanel region (option buttons, cancel button)
- BookingPopup region (done/delete/close buttons)
- BookingOverlay (booking blocks)
- WeekView grid (column headers, week slots)

**Referenced from DESIGN-TOKENS.md:**
- Color tokens (backgrounds, borders, text, user colors)
- Typography tokens (font families, sizes, weights)
- Spacing tokens (padding, gaps)
- Timing tokens (--transition-fast for all state transitions)
- Shadow tokens (glow patterns, depth shadows, glass effects)

**Referenced from Phase 5 Screenshots:**
- 01-initial-states/ (default states, selected slot, panel open)
- 02-slot-states/ (available, booked, past, multi-hour blocks)
- 03-booking-flow/ (panel states, option selection)
- 04-book-now-button/ (button visible state)
- 05-timezone-toggle/ (QLD default, NSW active)

**For Phase 08 Behavior Specification:**
- State transitions define WHEN visual changes occur (what triggers each state)
- Interaction flows will reference these states (click slot → selected state + panel opens)

---

**Documentation Complete:** 2026-02-13
**Technology-neutral:** All states described by visual properties, not React implementation
**Rails-ready:** Every state traceable to CSS source for accurate recreation
