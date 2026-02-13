# Book Now Feature (FUNC-02)

**Document ID:** FUNC-02
**Phase:** 09 - Functional Documentation
**Created:** 2026-02-13
**Purpose:** Complete specification of the Book Now button feature including visibility rules, interaction flow, and edge cases

---

## Feature Overview

**Purpose:** Provide one-click access to book the current hour (fastest path to book "right now")

**Location:** Header bar, positioned next to Week/Day view toggle and timezone toggle

**Keyboard shortcut:** `[B]` key (when not in popup/panel keyboard trap)

**Visual characteristics:**
- Pulsing animation when visible (draws user attention)
- Hotkey indicator `[B]` displayed on button face
- Hidden entirely (not disabled) when unavailable
- Appearance changes based on availability (no disabled state)

**Design principle:** Book Now eliminates the need for users to:
1. Navigate to today's date
2. Scroll to find the current hour
3. Click the current hour slot

Instead: Single click opens the booking panel for the current hour.

---

## Visibility Decision Table

The Book Now button is only shown when ALL of the following conditions are true:

1. Current hour is within operating hours (6 AM - 9 PM inclusive)
2. Current hour slot has not yet passed
3. Current hour slot is available (not booked, not blocked)

### Complete Visibility Truth Table

| Current Hour in Range (6-21) | Slot Past? | Slot Status | Button Visible | Reason |
|------------------------------|------------|-------------|----------------|--------|
| Yes | No | available | **YES** (pulsing) | User can book right now |
| Yes | No | booked | NO | Already booked by someone |
| Yes | No | blocked | NO | Blocked by multi-hour booking starting earlier |
| Yes | Yes | available | NO | Hour has ended (cannot book past time) |
| Yes | Yes | booked | NO | Hour has ended |
| Yes | Yes | blocked | NO | Hour has ended |
| No (hour < 6) | - | - | NO | Outside operating hours (before 6 AM) |
| No (hour ≥ 22) | - | - | NO | Outside operating hours (after 9 PM) |

**Operating hours definition:**
- START_HOUR: 6 (6:00 AM)
- END_HOUR: 22 (10:00 PM last bookable hour, slots end at 22:00)
- Valid booking hours: 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21
- Current hour must be: `currentHour >= 6 AND currentHour < 22`

**"Slot Past" definition:**
- A slot is considered "past" when the NEXT hour begins
- Example: At 9:45 AM, the 9:00 AM slot is still current (not past)
- Example: At 10:00 AM, the 9:00 AM slot becomes past
- Calculation: Current time >= (slot hour + 1):00

**"Slot Status" definition:**
- **available:** No booking exists for current hour AND not blocked by multi-hour booking
- **booked:** A booking exists for current hour (any duration, any user)
- **blocked:** No booking at current hour, but blocked by multi-hour booking starting earlier
  - Example: 2-hour booking at 8:00 AM blocks 9:00 AM slot

---

## Current Hour Edge Cases

### Edge Case: What is "current hour"?

**At 9:00 AM exactly:**
- Current hour is 9
- 9:00 AM slot is NOT past (hour 10 hasn't begun)
- Book Now checks 9:00 AM slot availability

**At 9:45 AM:**
- Current hour is 9
- 9:00 AM slot is NOT past (hour 10 hasn't begun)
- Book Now checks 9:00 AM slot availability

**At 9:59 AM:**
- Current hour is 9
- 9:00 AM slot is NOT past (hour 10 hasn't begun)
- Book Now checks 9:00 AM slot availability

**At 10:00 AM:**
- Current hour is 10
- 9:00 AM slot becomes past
- Book Now checks 10:00 AM slot availability

**Because:** The slot remains bookable until the next hour begins. This gives users the full hour to book "right now."

---

## Interaction Flow

### Step-by-Step Flow

**Step 1: User triggers Book Now**
- Click the Book Now button in header
- OR press `[B]` key (keyboard shortcut)
- Pre-condition: User is NOT in popup mode (popup keyboard trap would block `[B]` key)

**Step 2: System constructs slot object for current hour**

System creates a slot object with:
- `hour`: Current hour number (0-23)
- `time`: Formatted display time (e.g., "9:00 AM")
- `key`: Time key in HH:00 format (e.g., "09:00")
- `dateKey`: Today's date in YYYY-MM-DD format

Example at 9:37 AM on 2026-02-13:
```
{
  hour: 9,
  time: "9:00 AM",
  key: "09:00",
  dateKey: "2026-02-13"
}
```

**Step 3: System switches to today's date (if needed)**

If user is viewing a different date:
- Current date changes to today
- View updates to show today's slots
- Booking panel opens for today's current hour

If user is already viewing today:
- No date change needed
- Booking panel opens immediately

**Step 4: Booking panel opens with current hour pre-selected**

- Booking panel becomes visible
- Selected slot is set to current hour
- User selection panel shows (awaiting user choice)
- Duration buttons are NOT yet enabled (user must be selected first)

**Step 5: Standard booking flow continues**

From here, the flow follows the normal booking panel flow:
1. User clicks a user button → user is selected
2. Duration buttons become enabled
3. User clicks a duration button → booking is created
4. Booking panel closes

**What Book Now does NOT do:**
- Does NOT auto-select a user
- Does NOT auto-select a duration
- Does NOT create the booking automatically

**Book Now only opens the panel faster.** User still makes all selections.

---

## Recalculation Triggers

The Book Now button visibility recalculates when:

### Trigger 1: Booking State Changes
- New booking created (via user action or polling)
- Booking deleted (via user action or polling)
- Booking updated (via polling)

**Because:** If current hour becomes booked or blocked, button must hide immediately.

### Trigger 2: Hourly Refresh
- Every hour on the hour (e.g., at 10:00:00, 11:00:00)
- System re-evaluates all slot states
- Book Now recalculates for new current hour

**Because:** At 10:00 AM, the 9:00 AM slot becomes past. Book Now must switch to evaluating 10:00 AM slot.

### What Does NOT Trigger Recalculation
- Every second (no continuous polling)
- Timezone toggle (Book Now uses internal QLD time, not display time)
- Week view toggle
- Navigation to different date

**Performance note:** Recalculation is event-driven, not time-driven. The button doesn't check the clock every second.

---

## Edge Case Scenarios (Given-When-Then)

### Scenario 1: Book Now at 9:59 AM (still available)

**Given** current time is 9:59 AM
**And** the 9:00 AM slot is available (not booked, not blocked)
**When** user clicks Book Now
**Then** booking panel opens for 9:00 AM slot
**Because** the 9:00 AM slot is still current (10:00 AM hasn't begun)

---

### Scenario 2: Book Now at 10:00 AM (previous hour becomes past)

**Given** current time is 9:59 AM
**And** Book Now button is visible for 9:00 AM slot
**When** clock changes to 10:00 AM
**Then** hourly refresh triggers
**And** 9:00 AM slot becomes past
**And** system re-evaluates 10:00 AM slot availability
**And** button visibility updates (hide if 10:00 AM unavailable, show if available)
**Because** current hour changed from 9 to 10

---

### Scenario 3: Book Now disappears when someone else books current hour

**Given** current time is 9:37 AM
**And** 9:00 AM slot is available
**And** Book Now button is visible (pulsing)
**When** polling detects another user booked 9:00 AM
**Then** booking state updates with new booking
**And** 9:00 AM slot status changes to "booked"
**And** Book Now button immediately hides
**Because** current hour is no longer available

---

### Scenario 4: Book Now hidden when multi-hour booking blocks current hour

**Given** current time is 9:37 AM
**And** user creates 3-hour booking starting at 8:00 AM (blocks 8, 9, 10)
**When** booking is created
**Then** 9:00 AM slot status changes to "blocked"
**And** Book Now button immediately hides
**Because** current hour (9) is blocked by the 8:00 AM multi-hour booking

**Given** current time is 10:59 AM (still within the 3-hour booking)
**Then** Book Now button remains hidden
**Because** current hour (10) is still blocked by the 8:00 AM booking

**Given** current time changes to 11:00 AM (outside the 3-hour booking)
**When** hourly refresh triggers
**Then** 11:00 AM slot is evaluated (not blocked)
**And** Book Now button becomes visible (if 11:00 AM is available)
**Because** current hour (11) is outside the blocking range

---

### Scenario 5: Book Now outside operating hours

**Given** current time is 5:45 AM (before 6 AM)
**Then** Book Now button is hidden
**Because** current hour (5) is before START_HOUR (6)

**Given** current time is 22:15 PM (after 10 PM)
**Then** Book Now button is hidden
**Because** current hour (22) is >= END_HOUR (22)

**Note:** At 9:00 PM (21:00), Book Now can still appear if the 9:00 PM slot is available. 9 PM is the last bookable hour.

---

### Scenario 6: Book Now when popup is open (keyboard trap)

**Given** user has clicked a booking to view details
**And** booking popup is open
**When** user presses `[B]` key
**Then** nothing happens (key is trapped by popup)
**Because** popup has keyboard trap for accessibility (ESC, Tab, Shift+Tab only)

**When** user closes popup (ESC or clicks outside)
**And** presses `[B]` key
**Then** Book Now activates normally
**Because** keyboard trap is released when popup closes

---

### Scenario 7: Book Now when viewing different date

**Given** user is viewing 2026-02-14 (tomorrow)
**And** current time is 9:37 AM on 2026-02-13 (today)
**And** today's 9:00 AM slot is available
**When** user clicks Book Now
**Then** current date changes to 2026-02-13 (today)
**And** view switches to today's slots
**And** booking panel opens for 9:00 AM slot
**Because** Book Now always books the current hour of the current day

---

### Scenario 8: Book Now with NSW timezone toggle active

**Given** timezone toggle is set to NSW
**And** DST is active (times display +1 hour)
**And** current QLD time is 9:37 AM
**And** display shows "10:37 AM" (NSW time)
**And** slot labels show "7:00 AM, 8:00 AM, 9:00 AM..." in NSW time
**When** user clicks Book Now
**Then** booking panel opens for 9:00 AM QLD time (the actual current hour)
**And** panel shows "10:00 AM" as the slot time (because NSW toggle is active)
**Because** Book Now uses internal QLD time (hour 9), not display time

**Internals vs Display:**
- Internal logic: Always uses QLD time (current hour = 9)
- Display: Respects timezone toggle (shows "10:00 AM" if NSW toggle active)
- Storage: Always QLD time (timeKey = "09:00")

---

## Visual Specification

### Button Appearance When Visible

**Text:** "Book Now"
**Hotkey indicator:** `[B]` displayed before text
**Animation:** Pulsing scale effect
- Scale from 1.0 to 1.05
- Duration: 2 seconds
- Iteration: Infinite
- Easing: Ease-in-out
- Purpose: Draw user attention to the fastest booking path

**Position:** Header actions area, left of Week/Day toggle

### Button Appearance When Hidden

**Display:** `display: none` (completely removed from layout)
**Not disabled:** Button is hidden entirely, not shown in disabled state
**Because:** A disabled Book Now button would confuse users ("why can't I book now?"). Hiding it entirely is clearer.

### Cross-References

- **ANIMATIONS.md** (Phase 7): Pulse animation specification
- **LAYOUT.md** (Phase 7): Header actions layout
- **DESIGN-TOKENS.md** (Phase 7): Button colors and spacing

---

## Integration with Booking Flow

### Relationship to Booking Panel

Book Now is a shortcut entry point to the standard booking panel flow. It does NOT bypass any steps or validation.

**Standard flow:**
1. User clicks time slot → panel opens → user selects person → user selects duration → booking created

**Book Now flow:**
1. User clicks Book Now → panel opens (with current hour pre-selected) → user selects person → user selects duration → booking created

**Shared behavior after panel opens:**
- User selection panel appears
- Duration buttons appear after user selected
- Validation rules apply (duration cannot extend beyond operating hours)
- Booking creation logic is identical
- Error handling is identical

### Cross-Reference to BOOKING-FLOW.md

For complete booking panel behavior after Book Now activates, see:
- **BOOKING-FLOW.md** — User selection panel
- **BOOKING-FLOW.md** — Duration selection rules
- **BOOKING-FLOW.md** — Booking creation and validation

---

## Implementation Notes

### Data Sources for Visibility Calculation

Book Now visibility requires:
1. **Current date/time:** System clock
2. **Booking state:** Current bookings data structure
3. **Operating hours:** START_HOUR (6), END_HOUR (22)
4. **Slot past logic:** isSlotPast function
5. **Slot status logic:** getSlotStatus function

### No State Persistence

Book Now does not persist any state:
- No "last clicked" timestamp
- No "preferred duration" memory
- No "preferred user" memory

Every Book Now click is identical: Open panel for current hour.

### Accessibility Considerations

- **Keyboard shortcut:** `[B]` key must be globally accessible (except in popup mode)
- **ARIA label:** `aria-label="Book current hour"` for screen readers
- **Focus management:** Book Now button can receive keyboard focus
- **Animation:** Pulsing animation should respect `prefers-reduced-motion` preference

---

## Summary

The Book Now feature provides the fastest path to book the current hour. It appears only when the current hour is:
1. Within operating hours (6 AM - 9 PM)
2. Not yet past
3. Available (not booked, not blocked)

When clicked, it opens the standard booking panel with the current hour pre-selected, eliminating the need for users to navigate and find the current hour manually.

**Key design decisions:**
- Hidden (not disabled) when unavailable
- Pulsing animation draws attention
- Uses QLD time internally (timezone toggle only affects display)
- No auto-selection of user or duration
- Recalculates on booking changes and hourly refresh
