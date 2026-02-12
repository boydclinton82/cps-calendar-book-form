# Keyboard Shortcuts Specification

## Overview

The booking interface provides comprehensive keyboard shortcuts for all operations, enabling power users to complete bookings without using a mouse. The system is **context-aware** with three distinct interaction modes, each activating different shortcuts based on what's open.

**Technology note:** This document describes WHAT keys do WHAT and WHEN, not the React implementation. The Rails application must implement equivalent behavior through its own keyboard handling system.

---

## Interaction Modes

The keyboard system operates in one of three mutually exclusive modes. Only shortcuts for the active mode respond to keypresses.

### Mode Priority Diagram

```
Keypress received
  |
  +-- Is popup open? ───────────> POPUP MODE shortcuts only
  |                               (editing existing booking)
  |
  +-- Is panel open? ───────────> PANEL MODE shortcuts only
  |                               (creating new booking)
  |
  +-- Neither open ─────────────> NAVIGATION MODE shortcuts
                                  (calendar navigation)
```

### Navigation Mode (Default)

**When active:** Neither booking panel nor popup is open
**Purpose:** Navigate calendar, switch views, quick booking

**Active shortcuts:**
- B, W, T — Quick actions
- Left/Right arrows — Date navigation
- Up/Down arrows — Keyboard focus navigation
- Enter — Select focused slot

**Use case:** User browsing calendar, checking availability, navigating dates

---

### Panel Mode (Creating Booking)

**When active:** Booking panel is open (after clicking available slot)
**Purpose:** Select user and duration to complete booking

**Active shortcuts:**
- User hotkeys (J/T/C/etc based on config) — Select user
- 1/2/3 — Select duration
- Escape — Cancel and close panel

**Use case:** User has selected an available slot and is choosing who to book for and for how long

**Blocked shortcuts:** All navigation shortcuts (B, W, T, arrows) are ignored while panel is open

---

### Popup Mode (Editing Booking)

**When active:** Popup is open (after clicking existing booking block)
**Purpose:** Edit or delete existing booking

**Active shortcuts:**
- D — Delete booking
- Escape — Close without changes
- Enter — Confirm changes and close
- User hotkeys — Change booking's user
- 1/2/3 — Change booking's duration (if valid)

**Use case:** User clicked an existing booking to modify or delete it

**Blocked shortcuts:** All other shortcuts ignored while popup is open

---

## Global Validation Rules

These rules apply to **ALL modes** before any shortcut is processed:

| Validation | Behavior | Source |
|------------|----------|--------|
| **Focus in INPUT/TEXTAREA** | All shortcuts ignored | useKeyboard.js:52-54 |
| **Keyboard system disabled** | All shortcuts ignored | useKeyboard.js:49 |

**Why:** Prevent shortcuts from interfering when user is typing text (e.g., entering notes, if that feature existed)

---

## Complete Shortcut Reference

### Navigation Mode Shortcuts

Active when neither panel nor popup is open.

| Key | Action | Condition | Visual Feedback | Source |
|-----|--------|-----------|-----------------|--------|
| **B** | Book Now — Jump to today and select current hour | Current hour must be available (within booking hours, not occupied, not past) | Jumps to today, scrolls to current hour, selects slot, opens booking panel | useKeyboard.js:148-155 |
| **W** | Toggle Week/Day view | Always available in navigation mode | View switches between single-day grid and 7-day week grid | useKeyboard.js:142-146 |
| **T** | Toggle timezone display (QLD/NSW) | Always available in navigation mode | Timezone button changes state, time labels update | useKeyboard.js:159-163 |
| **Left Arrow** | Navigate to previous day/week | Always available in navigation mode | Date display updates (moves back 1 day in day view, 7 days in week view) | useKeyboard.js:195-199 |
| **Right Arrow** | Navigate to next day/week | Always available in navigation mode | Date display updates (moves forward 1 day in day view, 7 days in week view) | useKeyboard.js:200-205 |
| **Up Arrow** | Move keyboard focus to previous available slot | Keyboard navigation active, day view only | Gold border moves up one slot (wraps to bottom if at top) | useKeyboard.js:168-172 |
| **Down Arrow** | Move keyboard focus to next available slot | Keyboard navigation active, day view only | Gold border moves down one slot (wraps to top if at bottom) | useKeyboard.js:176-180 |
| **Enter** | Select keyboard-focused slot | A slot has keyboard focus (via arrow navigation) | Opens booking panel for focused slot | useKeyboard.js:184-188 |

**Keyboard focus system:**
- Focus indicator: Gold/amber border (`#fbbf24`) with pulsing animation
- Distinct from selected state (cyan)
- Tab or arrow keys move focus between slots
- Enter activates focused slot
- Source: TimeSlot.css:105-130

---

### Panel Mode Shortcuts

Active when booking panel is open (after clicking an available slot to create a new booking).

| Key | Action | Condition | Visual Feedback | Source |
|-----|--------|-----------|-----------------|--------|
| **[user key]** | Select user for booking | Panel is open, user key matches config | User button highlights with cyan background and glow | useKeyboard.js:114-119 |
| **1** | Select 1-hour duration | Panel open, user selected | Duration button highlights, "1 hour" badge visible | useKeyboard.js:124-129 |
| **2** | Select 2-hour duration | Panel open, user selected, 2 hours available | Duration button highlights, "2 hours" badge visible | useKeyboard.js:124-129 |
| **3** | Select 3-hour duration | Panel open, user selected, 3 hours available | Duration button highlights, "3 hours" badge visible | useKeyboard.js:124-129 |
| **Escape** | Cancel booking and close panel | Panel is open | Panel slides out (right-side slide animation) | useKeyboard.js:132-136 |

**Duration availability:**
- Duration options are only available if all required consecutive slots are available
- Example: If selecting 2pm and the 3pm slot is occupied, 2-hour and 3-hour durations are disabled
- Pressing a disabled duration key has no effect

**User key collision:**
- If a user's configured key is 'b', 'w', or 't', the user selection takes priority in panel mode
- Example: User "Bonnie" with key "b" will trigger user selection, not "Book Now"

---

### Popup Mode Shortcuts

Active when popup is open (after clicking an existing booking block to edit or delete it).

| Key | Action | Condition | Visual Feedback | Source |
|-----|--------|-----------|-----------------|--------|
| **D** | Delete booking | Popup is open | Booking removed from calendar, popup fades out | useKeyboard.js:63-67 |
| **Escape** | Close popup without saving changes | Popup is open | Popup fades out, no changes applied | useKeyboard.js:70-74 |
| **Enter** | Confirm changes and close popup | Popup is open | Popup fades out, changes saved | useKeyboard.js:77-81 |
| **[user key]** | Change booking's user | Popup is open, user key matches config | User button changes to newly selected user | useKeyboard.js:86-91 |
| **1/2/3** | Change booking's duration | Popup open, new duration valid (no conflicts) | Duration button changes, booking block resizes | useKeyboard.js:96-103 |

**Duration change validation:**
- Extending duration (e.g., 1 hour → 3 hours) only works if additional slots are available
- Shortening duration always works
- If extension would conflict with another booking, key press is ignored
- Validation: `canPopupChangeDuration(newDuration)` function checks availability

---

## Dynamic User Hotkeys

**User hotkeys are NOT hardcoded** — they come from instance configuration.

### Configuration Structure

```json
{
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" },
    { "name": "Teagan", "key": "t" },
    { "name": "Charlie", "key": "c" }
  ]
}
```

### How It Works

1. **Configuration defines keys:** Each user object has a `key` property (single lowercase letter)
2. **Keyboard handler iterates:** When a key is pressed, system checks all users' `key` values
3. **Match triggers action:** `e.key.toLowerCase() === user.key` activates user selection
4. **Different instances, different keys:** One deployment might use J/B/T/C, another could use A/S/D/F

### Implications for Rails Implementation

- User hotkeys must be read from configuration data
- UI must display configured keys (not hardcoded labels)
- Collision detection: If user key conflicts with system shortcut (B/W/T), user key takes priority in panel/popup mode
- Key labels in booking panel/popup must be dynamic (rendered from config)

**Source:** useKeyboard.js:25, 86-91, 114-119

---

## Keyboard Hints Bar

**Location:** Below navigation buttons, above time grid (in Header component)

**Visual style:**
- Glass morphism container with backdrop blur
- Cyan left-edge glow (4px vertical accent bar)
- Dark background: `rgba(10, 20, 35, 0.85)` with `backdrop-filter: blur(12px)`
- Border: `1px solid rgba(0, 229, 229, 0.25)`

**Content:**
- Displays available shortcuts with visual `<kbd>` key indicators
- Key indicators styled as small pill buttons (24px height, cyan text)
- Includes configured user hotkeys (read from config)
- Example: "B Book Now | W Week | T Time Zone | J Jack | T Teagan | 1 1hr | 2 2hrs | 3 3hrs"

**Visibility:**
- **Desktop/Tablet:** Visible
- **Mobile (max-width: 600px):** Hidden (`display: none`)

**Why hidden on mobile:** Limited screen space, touch interface doesn't need keyboard hints

**Source:** Header.css:196-263

---

## Keyboard Focus Visual System

**Purpose:** Allow keyboard-only navigation through available time slots

**Focus indicator appearance:**
- Border color: Gold/amber (`#fbbf24`)
- Border width: `2px`
- Outer glow: `0 0 0 3px rgba(251, 191, 36, 0.3)` plus `0 0 16px rgba(251, 191, 36, 0.4)`
- Animation: Pulsing glow (1.5s cycle)
- Time label color changes to gold

**How it differs from selected state:**
- **Focused:** Gold/amber border with pulse — indicates WHERE keyboard action will apply
- **Selected:** Cyan background and glow — indicates WHICH slot is selected for booking

**Navigation:**
- **Tab key:** Moves focus between interactive elements (follows browser's focus order)
- **Up/Down arrows:** Moves focus between available time slots (custom logic)
- **Enter key:** Activates focused slot (opens booking panel)

**Wrapping behavior:**
- Pressing Up at first available slot wraps to last available slot
- Pressing Down at last available slot wraps to first available slot

**Source:** TimeSlot.css:105-130, useKeyboard.js:168-188

---

## Hidden Elements on Mobile

When viewport width ≤ 600px, the following keyboard-related UI is hidden:

| Element | Reason |
|---------|--------|
| Keyboard hints bar | Screen space + touch interface doesn't use keyboard |
| Week toggle button | Space savings (users can still week-view from desktop) |

**Note:** Keyboard shortcuts STILL WORK on mobile if external keyboard connected. Only the visual hints are hidden.

**Source:** Header.css:261-267

---

## Implementation Notes for Rails

1. **Mode detection:** Track panel/popup open state globally to determine active mode
2. **Event listener:** Single global `keydown` listener, route based on mode
3. **Focus management:** Maintain focused slot index, update on arrow keys
4. **User config:** Load user hotkeys from database/config, render dynamically in UI
5. **Validation:** Check INPUT/TEXTAREA focus before processing any shortcut
6. **Case sensitivity:** Convert `e.key` to lowercase before matching

**Source files for reference:**
- useKeyboard.js — Complete keyboard logic
- Header.css:196-263 — Keyboard hints bar
- TimeSlot.css:105-130 — Keyboard focus styling

---

**Document version:** 1.0
**Last updated:** 2026-02-13
**Part of:** Phase 07 UI/UX Documentation
