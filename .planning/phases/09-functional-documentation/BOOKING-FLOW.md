# FUNC-01: Booking Flow Specification

**Document ID:** FUNC-01
**Phase:** 09 - Functional Documentation
**Created:** 2026-02-13
**Purpose:** Complete functional specification for booking lifecycle (create, edit, delete)

---

## Overview

This document specifies the complete booking workflow as experienced by end users. It covers three primary flows:

1. **Booking Creation** - User selects available slot, picks person, chooses duration
2. **Booking Editing** - User clicks existing booking, changes person or duration inline
3. **Booking Deletion** - User removes existing booking

All flows use **optimistic updates** (local state changes immediately, API call happens in background, rollback on error).

**Related specifications:**
- **DATA-STORAGE.md** - Data structure and storage format
- **API-CONTRACTS.md** - HTTP endpoints for booking operations
- **STATE-MANAGEMENT.md** - How state flows through application

**Technology-neutral language:**
- "System" refers to the booking application (not "React component" or "Rails controller")
- "User" refers to the person interacting with the application
- Outcomes are described functionally (what happens) not mechanically (how code executes)

---

## Application Modes

The booking system operates in **three mutually exclusive interaction modes**. Only one mode is active at any given time.

### Mode Definitions

| Mode | Active When | User Can | User Cannot |
|------|-------------|----------|-------------|
| **NAVIGATION MODE** | No slot or booking selected | Browse dates (arrow keys), toggle views (W key), select slots, use keyboard navigation | Create/edit bookings |
| **PANEL MODE** | Available slot selected, booking panel open | Pick person (user buttons/hotkeys), pick duration (duration buttons/hotkeys), cancel (Esc) | Navigate dates, toggle views, select other slots |
| **POPUP MODE** | Existing booking selected, edit popup open | Change booking user, change booking duration, delete booking, close popup | Navigate dates, toggle views, select slots, create new bookings |

### Mode Transitions

| From State | Event | To State | Side Effects |
|------------|-------|----------|--------------|
| NAVIGATION MODE | User clicks available slot | PANEL MODE | Panel slides in from right, slot highlighted |
| NAVIGATION MODE | User presses Enter on keyboard-focused slot | PANEL MODE | Panel slides in from right, slot highlighted |
| NAVIGATION MODE | User clicks existing booking | POPUP MODE | Modal overlay appears, popup shows booking details |
| PANEL MODE | User presses Esc | NAVIGATION MODE | Panel closes, selection cleared |
| PANEL MODE | User clicks Cancel button | NAVIGATION MODE | Panel closes, selection cleared |
| PANEL MODE | User selects duration (completes booking) | NAVIGATION MODE | Booking created, panel closes, selection cleared |
| POPUP MODE | User presses Esc | NAVIGATION MODE | Popup closes, booking selection cleared |
| POPUP MODE | User clicks Close (X) button | NAVIGATION MODE | Popup closes, booking selection cleared |
| POPUP MODE | User presses Enter key | NAVIGATION MODE | Popup closes, booking selection cleared |
| POPUP MODE | User clicks backdrop overlay | NAVIGATION MODE | Popup closes, booking selection cleared |
| POPUP MODE | User presses D (delete) | NAVIGATION MODE | Booking deleted, popup closes |

### Critical Mode Rules

**Rule 1: Mutual Exclusivity**
- PANEL MODE and POPUP MODE cannot be active simultaneously
- Selecting a slot while popup is open has no effect (popup must be closed first)
- Clicking a booking while panel is open has no effect (panel must be closed first)

**Rule 2: Keyboard Trap**
- When POPUP MODE is active, all navigation shortcuts are disabled
- Week toggle (W), timezone toggle (Z), date navigation (arrows), Book Now (N) are all ignored
- This prevents accidental navigation while editing a booking

**Rule 3: View Mode Interaction**
- Toggling between day view and week view (W key) automatically closes panel if open
- Week view does not support keyboard navigation (up/down arrows)
- Clicking a day in week view switches to day view for that date

**Source reference:** See App.jsx lines 323-345 for keyboard shortcut context-aware activation logic

---

## Booking Creation Flow

User creates a new booking by selecting an available slot, choosing who it's for, and selecting duration.

### Step 1: Slot Selection

**User Action:** User clicks available time slot OR presses Enter key while slot is keyboard-focused

**System Behavior:**
1. Capture slot metadata: `{ hour, time, key, dateKey }`
2. Open booking panel (slide-in animation from right on desktop, full-screen on mobile)
3. Highlight selected slot in calendar
4. Clear any previous user selection
5. Transition to PANEL MODE

**Decision Table: Slot Click Behavior**

| Slot Status | Slot Date | User Action | System Response |
|-------------|-----------|-------------|-----------------|
| Available | Any | Click slot | Open booking panel for that slot |
| Available | Today or future | Press Enter on focused slot | Open booking panel for that slot |
| Booked (direct) | Any | Click slot | Open booking popup (edit flow, not create) |
| Blocked (multi-hour) | Any | Click slot | Open booking popup for blocking booking's start time |
| Past | Today | Click slot | No response (cursor: not-allowed) |
| Available | Any | Click while popup open | No response (popup must close first) |
| Available | Any | Click while panel open | No response (closes current panel, opens new panel for clicked slot) |

**Keyboard Navigation Path:**

1. User presses Down arrow in NAVIGATION MODE
2. System focuses first available slot (visual highlight)
3. User presses Down arrow again
4. System focuses next available slot
5. User presses Enter key
6. System opens booking panel for focused slot

**Edge Case: Week View Slot Selection**

- In week view, user can click time slot within any visible day
- System captures both date and time from clicked slot
- System switches to day view for that date with panel open

**Source reference:** See App.jsx lines 129-132 (handleSlotSelect), lines 308-314 (handleFocusedSlotSelect)

### Step 2: User Selection

**User Action:** User clicks user button OR presses user's hotkey (e.g., "J" for Jack)

**System Behavior:**
1. Mark selected user (button highlighted, visual indicator)
2. Store selected user name
3. Enable duration selection section
4. Wait for duration selection

**Visual State:**
- Selected user button shows highlighted state (different background color)
- Other user buttons remain in default state
- Duration buttons become visually active (no longer greyed out)

**User Button Structure:**

Each user button displays:
- Keyboard shortcut in brackets: `[J]`
- User name: `Jack`
- Visual state: normal / selected

**Dynamic User Hotkeys:**

User hotkeys are **not hardcoded** - they come from configuration.

Configuration example:
```json
{
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" },
    { "name": "John", "key": "h" }
  ]
}
```

Hotkey mapping:
- Jack → J key
- Bonnie → B key
- John → H key (not J, because J is taken)

**Decision Table: User Selection**

| Panel State | User Action | System Response |
|-------------|-------------|-----------------|
| No user selected | Click user button | Select that user, highlight button |
| No user selected | Press user hotkey | Select that user, highlight button |
| User already selected | Click different user button | Change selection to new user |
| User already selected | Press different user hotkey | Change selection to new user |
| User already selected | Click same user button | No change (already selected) |
| User already selected | Press Esc | Clear selection, return to "Who?" prompt |

**Source reference:** See App.jsx lines 157-159 (handleUserSelect), BookingPanel.jsx lines 44-55 (user buttons)

### Step 3: Duration Selection

**User Action:** User clicks duration button OR presses duration hotkey (1, 2, or 3)

**System Behavior:**
1. Validate duration (check END_HOUR constraint and conflict detection)
2. If valid: Create booking immediately (no "Submit" button)
3. Update local state optimistically
4. Send API request in background
5. Close panel
6. Clear slot and user selection
7. Transition to NAVIGATION MODE

**Duration Options:**

| Duration | Hotkey | Label | Hours Occupied |
|----------|--------|-------|----------------|
| 1 hour | 1 | "1 hour" | Start hour only |
| 2 hours | 2 | "2 hours" | Start hour + next hour |
| 3 hours | 3 | "3 hours" | Start hour + next 2 hours |

**Decision Table: Duration Validation**

| Condition | Duration 1hr | Duration 2hr | Duration 3hr |
|-----------|--------------|--------------|--------------|
| Slot at 06:00, no conflicts | Enabled | Enabled | Enabled |
| Slot at 20:00 (8 PM, END_HOUR-2) | Enabled | Enabled | Disabled (would extend to 23:00, past END_HOUR 22:00) |
| Slot at 21:00 (9 PM, END_HOUR-1) | Enabled | Disabled (would extend to 23:00) | Disabled (would extend to 24:00) |
| Slot at 09:00, slot 10:00 is booked | Enabled | Disabled (conflict) | Disabled (conflict) |
| Slot at 09:00, slot 11:00 is booked | Enabled | Enabled | Disabled (conflict) |
| Slot at 09:00, slot 10:00 is blocked | Enabled | Disabled (conflict) | Disabled (conflict) |

**Conflict Detection Logic: canBook()**

System checks **all slots** in the proposed duration range for conflicts.

**Algorithm:**

```
FOR each hour in range [startHour, startHour + duration):
  checkKey = format hour as "HH:00"

  IF bookings[dateKey][checkKey] exists:
    RETURN false (direct booking conflict)

  IF slot is blocked by another booking:
    RETURN false (blocked by multi-hour booking)

RETURN true (all slots available)
```

**Example: 3-Hour Booking at 09:00**

Checks performed:
1. Check 09:00 → Available ✓
2. Check 10:00 → **Booked** (conflict detected)
3. **Result:** Duration disabled, cannot book 3 hours

**Instant Booking (No Submit Button):**

**Why:** Duration selection completes the booking flow. No additional confirmation step.

User flow:
1. Click slot → Panel opens
2. Press J (Jack) → User selected
3. Press 2 (2 hours) → Booking created immediately, panel closes

**Source reference:** See App.jsx lines 165-179 (handleDurationSelect), useBookings.js lines 201-222 (canBook)

### Step 4: Booking Confirmation (Optimistic Update)

**System Behavior After Duration Selected:**

**Immediate (Optimistic Update):**
1. Add booking to local state: `bookings[dateKey][timeKey] = { user, duration }`
2. Booking block appears in calendar instantly
3. Panel closes
4. Slot becomes "booked" status
5. If multi-hour: subsequent slots become "blocked" status

**Background (API Call):**
6. Send POST /api/bookings with `{ dateKey, timeKey, user, duration }`
7. If API succeeds (201 Created): No further action (optimistic update was correct)
8. If API fails (409 Conflict, 500 Error): Rollback via `triggerSync()`

**Rollback on Error:**

If API returns error:
1. System shows error message to user (e.g., "Slot already booked")
2. System immediately fetches current state from server (`GET /api/bookings`)
3. System replaces entire local state with server response
4. Booking disappears from UI (optimistic booking was invalid)
5. User sees current truth (may show another user's booking that caused conflict)

**Edge Case: Concurrent Booking Attempt**

Timeline:
- t=0ms: User A selects 09:00 slot, picks Jack, selects 2 hours
- t=0ms: User A's optimistic update shows booking locally
- t=50ms: User A's API request reaches server
- t=100ms: User B (different browser) selects same 09:00 slot, picks Bonnie, selects 1 hour
- t=100ms: User B's optimistic update shows booking locally
- t=150ms: User B's API request reaches server
- t=200ms: Server responds to User A: 201 Created (first to arrive, wins)
- t=250ms: Server responds to User B: 409 Conflict (slot already taken)
- t=260ms: User B's client triggers sync, fetches server state
- t=300ms: User B's client replaces local state, now shows Jack's booking (not Bonnie's)

**Why This Works:**

- Server is source of truth (last-write-wins at server level)
- Optimistic updates provide instant feedback (feels responsive)
- Automatic rollback on conflict (users see errors and corrections immediately)
- 7-second polling keeps all clients synchronized

**Source reference:** See useBookings.js lines 77-104 (createBooking with optimistic update), STATE-MANAGEMENT.md "Optimistic Update Pattern"

### Cancel Flow

**User Action:** User presses Esc key OR clicks Cancel button

**System Behavior:**
1. Close booking panel
2. Clear selected slot
3. Clear selected user
4. Return to NAVIGATION MODE
5. No booking created
6. No API call made

**Decision Table: Cancel Actions**

| Panel State | User Action | Result |
|-------------|-------------|--------|
| Slot selected, no user | Press Esc | Panel closes, no booking |
| Slot selected, no user | Click Cancel | Panel closes, no booking |
| User selected, no duration | Press Esc | Panel closes, no booking |
| User selected, no duration | Click Cancel | Panel closes, no booking |
| Duration selected (booking created) | Press Esc | No effect (panel already closed) |

**Mobile Behavior:**

On mobile, panel appears full-screen with overlay backdrop.

- User can tap backdrop → Panel closes (same as Cancel)
- User can tap Cancel button → Panel closes
- User can swipe down → Panel closes (gesture support)

**Source reference:** See App.jsx lines 150-153 (handleCancelPanel)

---

## Booking Edit Flow

User clicks existing booking block to open edit popup, can change user or duration inline, or delete the booking.

### Step 1: Booking Click

**User Action:** User clicks booking block in day view or week view

**System Behavior:**
1. Capture booking metadata: `{ dateKey, timeKey, hour, user, duration }`
2. Open edit popup (modal overlay with booking details)
3. Transition to POPUP MODE
4. Disable all navigation shortcuts (keyboard trap)

**Popup Display:**

Popup shows:
- Time range: "07:00 - 09:00" (calculated from startTime + duration)
- Current user (highlighted button)
- Current duration (highlighted button)
- User selection buttons (same as panel)
- Duration selection buttons (some may be disabled)
- Delete button ([D])
- Close button ([Esc] or [Enter])

**Decision Table: Click Behavior by Block Type**

| Block Type | Represents | Click Action |
|------------|------------|--------------|
| Booked block (start hour) | Booking starts at this hour | Open popup for this booking |
| Blocked block (multi-hour) | Hour is within booking range | Open popup for the blocking booking's start time |
| Available slot | No booking | Open booking panel (create flow) |

**Example: Multi-Hour Booking Click**

Booking exists at 07:00 with duration 3 (occupies 07:00, 08:00, 09:00):

- User clicks 07:00 block → Popup opens showing 07:00-10:00 booking
- User clicks 08:00 block → Popup opens showing 07:00-10:00 booking (same booking)
- User clicks 09:00 block → Popup opens showing 07:00-10:00 booking (same booking)

All three clicks open the same popup because they all reference the booking starting at 07:00.

**Source reference:** See App.jsx lines 189-198 (handleBookingClick), BookingPopup.jsx lines 30-45 (popup structure)

### Step 2: Inline User Change

**User Action:** User clicks different user button OR presses different user hotkey

**System Behavior:**
1. Update local state immediately: `bookings[dateKey][timeKey].user = newUser`
2. Update popup display (new user button highlighted)
3. Booking block changes color in calendar (reflects new user's color)
4. Send API request: PUT /api/bookings/update with `{ user: newUser }`
5. If API succeeds (200 OK): No further action
6. If API fails: Rollback via `triggerSync()`, show error

**No Save Button:**

Changes are applied **immediately** when user clicks a button. There is no "Save" or "Apply" button.

User flow:
1. Click booking → Popup opens showing Jack
2. Press B (Bonnie) → Booking user changes to Bonnie instantly
3. Popup still open, shows Bonnie highlighted
4. User can press Esc to close popup

**Visual Feedback:**

- New user button becomes highlighted
- Previous user button returns to normal state
- Booking block in calendar changes from Jack's color to Bonnie's color
- Change is instant (no loading spinner)

**Decision Table: User Change Scenarios**

| Current User | User Clicks | Result |
|--------------|-------------|--------|
| Jack | Bonnie button | User changes to Bonnie, API called |
| Jack | Jack button | No change (already selected) |
| Jack | Press B hotkey | User changes to Bonnie, API called |
| Jack | Press J hotkey | No change (already selected) |

**Source reference:** See App.jsx lines 208-212 (handlePopupUserChange), useBookings.js lines 138-166 (updateBooking)

### Step 3: Inline Duration Change

**User Action:** User clicks different duration button OR presses different duration hotkey

**System Behavior:**
1. Validate new duration (check END_HOUR and conflicts)
2. If valid:
   - Update local state immediately
   - Update popup display (new duration button highlighted)
   - Booking block extends/shrinks in calendar
   - Send API request: PUT /api/bookings/update with `{ duration: newDuration }`
3. If invalid:
   - No change (button is disabled, click has no effect)

**Conflict Detection Logic: canChangeDuration()**

System checks **only NEW slots** beyond current duration for conflicts.

**Critical Difference from canBook():**

- **canBook()**: Checks ALL slots in range (used for creating new bookings)
- **canChangeDuration()**: Checks only slots beyond current duration (used for extending existing bookings)

**Algorithm:**

```
FOR each hour in range [startHour, startHour + newDuration):
  IF hour < startHour + currentDuration:
    SKIP (already occupied by this booking)

  checkKey = format hour as "HH:00"

  IF bookings[dateKey][checkKey] exists:
    RETURN false (conflict with another booking)

  IF slot is blocked by ANOTHER booking (not this one):
    RETURN false (blocked by different booking)

RETURN true (new slots available)
```

**Example: Extending from 2 Hours to 3 Hours**

Current booking: 07:00 with duration 2 (occupies 07:00, 08:00)
New duration: 3 (would occupy 07:00, 08:00, 09:00)

Checks performed:
1. Hour 7 (i=0): Skip (i < currentDuration=2)
2. Hour 8 (i=1): Skip (i < currentDuration=2)
3. Hour 9 (i=2): Check → Available ✓
4. **Result:** Extension allowed

**Example: Extension Blocked by Conflict**

Current booking: 07:00 with duration 2
Other booking: 09:00 with duration 1
Attempting: Change to duration 3

Checks performed:
1. Hour 7 (i=0): Skip
2. Hour 8 (i=1): Skip
3. Hour 9 (i=2): Check → **Booked** (conflict with 09:00 booking)
4. **Result:** Extension blocked, duration 3 button disabled

**Decision Table: Duration Change Validation**

| Current Duration | New Duration | Slot Check | Result |
|------------------|--------------|------------|--------|
| 2 hours | 3 hours | Hour 3 available | Enabled, change allowed |
| 2 hours | 3 hours | Hour 3 booked | Disabled, change blocked |
| 3 hours | 2 hours | No check (shrinking) | Enabled, always allowed |
| 2 hours | 2 hours | No check (same) | Disabled (no change needed) |
| 1 hour at 21:00 | 2 hours | Would extend to 23:00 (past END_HOUR 22:00) | Disabled, exceeds time range |

**Shrinking Duration (Always Succeeds):**

If user reduces duration from 3 to 1:
- No conflict check needed (freeing slots, not claiming new ones)
- Change is instant
- Freed slots become available immediately

**Visual Feedback:**

- Duration buttons show enabled/disabled state
- Selected duration button is highlighted
- Booking block in calendar extends or shrinks instantly
- If extending: block grows downward (more slots occupied)
- If shrinking: block shrinks (fewer slots occupied)

**Source reference:** See App.jsx lines 217-221 (handlePopupDurationChange), useBookings.js lines 228-255 (canChangeDuration)

### Step 4: Close Popup

**User Action:** User presses Esc, presses Enter, clicks Close button, or clicks backdrop overlay

**System Behavior:**
1. Close popup modal
2. Clear selected booking
3. Return to NAVIGATION MODE
4. Re-enable navigation shortcuts
5. All changes already saved (optimistic updates completed)

**No Unsaved Changes Warning:**

Because changes are applied immediately (no "Save" button), closing the popup does not lose any work.

**Decision Table: Close Actions**

| User Action | System Response |
|-------------|-----------------|
| Press Esc | Close popup |
| Press Enter | Close popup |
| Click Close (X) button | Close popup |
| Click backdrop overlay | Close popup |
| Click outside popup | Close popup |
| Press W (week toggle) | No effect (navigation disabled in POPUP MODE) |

**Mobile Behavior:**

- Swipe down gesture → Close popup
- Tap backdrop → Close popup
- Tap Close button → Close popup

**Source reference:** See App.jsx lines 202-204 (handlePopupClose), BookingPopup.jsx lines 84-97 (close actions)

---

## Booking Deletion Flow

User deletes a booking from the edit popup. Booking is removed immediately with optimistic update.

### Deletion Process

**User Action:** User presses D key OR clicks Delete button in popup

**System Behavior:**

**Immediate (Optimistic Update):**
1. Remove booking from local state: `delete bookings[dateKey][timeKey]`
2. Check if date object is now empty: `if (Object.keys(bookings[dateKey]).length === 0)`
3. If empty, remove date key: `delete bookings[dateKey]`
4. Booking block disappears from calendar
5. Close popup
6. Clear selected booking
7. Return to NAVIGATION MODE

**Background (API Call):**
8. Send DELETE /api/bookings/update with `{ dateKey, timeKey }`
9. If API succeeds (200 OK): No further action
10. If API fails (404 Not Found, 500 Error): Rollback via `triggerSync()`

**Empty Date Cleanup:**

When the last booking on a date is deleted, the date key is removed from the bookings object.

**Before deletion:**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 1 }
  }
}
```

**After deleting 07:00 booking:**
```json
{}
```

The `"2026-02-14"` key is completely removed because it has no remaining bookings.

**Why:** Prevents empty date objects from accumulating in storage. Server implements same cleanup logic.

**Decision Table: Delete Scenarios**

| Scenario | Result |
|----------|--------|
| Delete only booking on date | Booking removed, date key removed from object |
| Delete one of multiple bookings on date | Booking removed, date key remains (other bookings still exist) |
| Delete multi-hour booking | All blocked slots become available instantly |
| Delete while another user edited same booking | API returns 404, triggerSync fetches current state |
| Delete while offline | API fails, triggerSync restores booking from server |

**Visual Feedback:**

- Booking block disappears instantly (no fade-out animation)
- Popup closes immediately
- Calendar updates to show slot as available
- If multi-hour: all blocked slots become available

**Error Handling:**

If deletion fails:
1. User sees error message
2. System fetches current state from server
3. If booking still exists: booking reappears in calendar
4. If booking was deleted by another user: stays deleted (optimistic update was accidentally correct)

**Source reference:** See App.jsx lines 225-229 (handlePopupDelete), useBookings.js lines 108-133 (removeBooking)

---

## Booking Panel State Machine

The booking panel guides users through the creation flow with distinct states.

### States

| State | Description | Visible Elements |
|-------|-------------|------------------|
| **CLOSED** | Panel hidden, no slot selected | None |
| **AWAITING_USER** | Panel open, waiting for user selection | Time display, user buttons (all enabled), duration buttons (all disabled/greyed) |
| **AWAITING_DURATION** | Panel open, user selected, waiting for duration | Time display, user buttons (selected user highlighted), duration buttons (enabled/disabled based on validation) |

### State Transitions

| From State | Event | To State | Visual Change |
|------------|-------|----------|---------------|
| CLOSED | Slot clicked (available) | AWAITING_USER | Panel slides in, shows "Who?" section |
| CLOSED | Enter pressed (focused slot) | AWAITING_USER | Panel slides in, shows "Who?" section |
| AWAITING_USER | User button clicked | AWAITING_DURATION | User button highlighted, duration buttons become active |
| AWAITING_USER | User hotkey pressed | AWAITING_DURATION | User button highlighted, duration buttons become active |
| AWAITING_USER | Esc pressed | CLOSED | Panel slides out |
| AWAITING_USER | Cancel clicked | CLOSED | Panel slides out |
| AWAITING_DURATION | Duration button clicked (valid) | CLOSED | Booking created, panel slides out |
| AWAITING_DURATION | Duration hotkey pressed (valid) | CLOSED | Booking created, panel slides out |
| AWAITING_DURATION | Duration button clicked (invalid) | AWAITING_DURATION | No change (button is disabled) |
| AWAITING_DURATION | Different user button clicked | AWAITING_DURATION | User selection changes, duration validation recalculated |
| AWAITING_DURATION | Esc pressed | CLOSED | No booking created, panel slides out |
| AWAITING_DURATION | Cancel clicked | CLOSED | No booking created, panel slides out |

### State-Dependent Button States

**In AWAITING_USER state:**
- All user buttons: **Enabled**
- All duration buttons: **Disabled** (greyed out, not clickable)
- Cancel button: **Enabled**

**In AWAITING_DURATION state:**
- All user buttons: **Enabled** (can change selection)
- Selected user button: **Highlighted**
- Duration buttons: **Conditionally enabled** (based on canBookDuration validation)
- Cancel button: **Enabled**

**Source reference:** See BookingPanel.jsx lines 36-84 (panel structure), App.jsx lines 252-261 (canBookDuration)

---

## Booking Popup State Machine

The edit popup is simpler than the panel - it's either open or closed, with inline editing.

### States

| State | Description | Visible Elements |
|-------|-------------|------------------|
| **CLOSED** | Popup hidden, no booking selected | None |
| **VIEWING** | Popup open, showing booking details, can edit inline | Time range, user buttons (current user highlighted), duration buttons (conditionally enabled), Delete button, Close button |

### State Transitions

| From State | Event | To State | Side Effects |
|------------|-------|----------|--------------|
| CLOSED | Booking clicked | VIEWING | Popup appears with modal overlay, booking details displayed |
| VIEWING | User button clicked | VIEWING | User changes, booking updates (optimistic), popup stays open |
| VIEWING | Duration button clicked (valid) | VIEWING | Duration changes, booking updates (optimistic), popup stays open |
| VIEWING | Delete button clicked | CLOSED | Booking deleted, popup closes |
| VIEWING | D key pressed | CLOSED | Booking deleted, popup closes |
| VIEWING | Esc key pressed | CLOSED | Popup closes (changes already saved) |
| VIEWING | Enter key pressed | CLOSED | Popup closes (changes already saved) |
| VIEWING | Close (X) button clicked | CLOSED | Popup closes (changes already saved) |
| VIEWING | Backdrop clicked | CLOSED | Popup closes (changes already saved) |

### Inline Editing Pattern

Unlike the panel (which has distinct steps), the popup allows **continuous editing** without leaving VIEWING state.

User can:
1. Change user → Stays in VIEWING
2. Change duration → Stays in VIEWING
3. Change user again → Stays in VIEWING
4. Change duration again → Stays in VIEWING
5. Press Esc → Closes popup

Each change is saved immediately (optimistic update + API call). No "Save" or "Apply" step.

**Source reference:** See BookingPopup.jsx lines 36-100 (popup structure and event handlers)

---

## Keyboard Shortcuts in Booking Context

Keyboard shortcuts change availability based on current mode.

### Shortcut Activation by Mode

| Shortcut | Key | NAVIGATION MODE | PANEL MODE | POPUP MODE |
|----------|-----|-----------------|------------|------------|
| **Book Now** | N | ✓ (if current hour available) | ✗ | ✗ |
| **Week Toggle** | W | ✓ | ✗ | ✗ |
| **Timezone Toggle** | Z | ✓ | ✓ | ✗ |
| **Navigate Left** | ← | ✓ | ✗ | ✗ |
| **Navigate Right** | → | ✓ | ✗ | ✗ |
| **Slot Focus Up** | ↑ | ✓ (day view only) | ✗ | ✗ |
| **Slot Focus Down** | ↓ | ✓ (day view only) | ✗ | ✗ |
| **Select Focused** | Enter | ✓ (if slot focused) | ✗ | ✓ (closes popup) |
| **User Hotkey** | J/B/G/etc. | ✗ | ✓ | ✓ |
| **Duration 1hr** | 1 | ✗ | ✓ (if user selected) | ✓ (if valid) |
| **Duration 2hr** | 2 | ✗ | ✓ (if user selected) | ✓ (if valid) |
| **Duration 3hr** | 3 | ✗ | ✓ (if user selected) | ✓ (if valid) |
| **Delete Booking** | D | ✗ | ✗ | ✓ |
| **Cancel/Close** | Esc | ✗ | ✓ | ✓ |

**✓** = Shortcut active and functional
**✗** = Shortcut disabled, key press ignored

### Dynamic User Hotkeys

User hotkeys are **configuration-driven**, not hardcoded.

**Configuration determines mapping:**

```json
{
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" },
    { "name": "Giuliano", "key": "g" },
    { "name": "John", "key": "h" },
    { "name": "Rue", "key": "r" },
    { "name": "Joel", "key": "l" }
  ]
}
```

**Resulting hotkeys:**
- J → Jack
- B → Bonnie
- G → Giuliano
- H → John (not J, which is taken)
- R → Rue
- L → Joel (not J, which is taken)

**Why Dynamic:**
- Different teams have different rosters
- Hotkeys should match user names when possible
- Configuration allows customization per deployment

### Duration Hotkey Validity

Duration hotkeys are **conditionally active** based on validation.

**In PANEL MODE:**

- If slot at 21:00 selected:
  - Press 1 → Creates 1-hour booking (valid)
  - Press 2 → No response (would exceed END_HOUR, button disabled)
  - Press 3 → No response (would exceed END_HOUR, button disabled)

**In POPUP MODE:**

- If editing booking at 09:00 with duration 2, and slot 11:00 is booked:
  - Press 1 → Shrinks to 1 hour (valid)
  - Press 2 → No change (already 2 hours)
  - Press 3 → No response (would conflict with 11:00 booking, button disabled)

**Implementation Pattern:**

Hotkey handler checks button state before acting:

```
IF duration button is enabled:
  Execute duration select action
ELSE:
  Ignore key press (no visual feedback)
```

**Source reference:** See useKeyboard.js (not shown in extracts, but referenced in App.jsx line 323-345)

---

## Conflict Detection Logic

Conflict detection ensures bookings don't overlap. Different logic applies for creating vs. extending bookings.

### canBook() - For Creating New Bookings

**Purpose:** Validate that ALL slots in proposed duration are available

**Algorithm:**

```
FUNCTION canBook(dateKey, timeKey, startHour, duration):
  dayBookings = bookings[dateKey] OR empty object

  FOR i FROM 0 TO duration-1:
    checkHour = startHour + i
    checkKey = format checkHour as "HH:00"

    // Check for direct booking
    IF dayBookings[checkKey] exists:
      RETURN false  // Conflict: slot already booked

    // Check for blocking by multi-hour booking
    FOR EACH booking IN dayBookings:
      bookingHour = extract hour from booking's timeKey
      bookingEnd = bookingHour + booking.duration

      IF checkHour >= bookingHour AND checkHour < bookingEnd:
        RETURN false  // Conflict: slot blocked by multi-hour booking

  RETURN true  // All slots available
```

**Example Scenarios:**

| Scenario | Existing Bookings | Attempted Booking | Result | Reason |
|----------|-------------------|-------------------|--------|--------|
| **Empty day** | None | 09:00, duration 3 | PASS | All slots (09:00, 10:00, 11:00) available |
| **Direct conflict** | 09:00 (Jack, 1hr) | 09:00, duration 1 | FAIL | 09:00 already booked |
| **Multi-hour conflict** | 09:00 (Jack, 3hr) | 10:00, duration 1 | FAIL | 10:00 blocked by 09:00 booking |
| **Partial range conflict** | 11:00 (Jack, 1hr) | 09:00, duration 3 | FAIL | 11:00 (within range) already booked |
| **Adjacent bookings** | 09:00 (Jack, 2hr) | 11:00, duration 2 | PASS | 09:00 booking ends at 11:00, no overlap |
| **Gap in schedule** | 09:00 (Jack, 1hr), 14:00 (Bonnie, 1hr) | 11:00, duration 2 | PASS | 11:00-12:00 range has no conflicts |

**Source reference:** See useBookings.js lines 201-222

### canChangeDuration() - For Extending Existing Bookings

**Purpose:** Validate that only NEW slots (beyond current duration) are available

**Critical Difference:** Skips slots already occupied by the booking being extended

**Algorithm:**

```
FUNCTION canChangeDuration(dateKey, timeKey, startHour, currentDuration, newDuration):
  dayBookings = bookings[dateKey] OR empty object

  FOR i FROM 0 TO newDuration-1:
    checkHour = startHour + i
    checkKey = format checkHour as "HH:00"

    // Skip slots already occupied by THIS booking
    IF i < currentDuration:
      CONTINUE  // Don't check, already occupied by this booking

    // Check NEW slots only
    IF dayBookings[checkKey] exists:
      RETURN false  // Conflict: new slot already booked

    FOR EACH booking IN dayBookings:
      bookingHour = extract hour from booking's timeKey
      bookingEnd = bookingHour + booking.duration

      // Exclude blocks caused by the booking being edited
      IF booking's timeKey == the booking being edited's timeKey:
        CONTINUE

      IF checkHour >= bookingHour AND checkHour < bookingEnd:
        RETURN false  // Conflict: new slot blocked by ANOTHER booking

  RETURN true  // All NEW slots available
```

**Example Scenarios:**

| Current Booking | Other Bookings | New Duration | Slots Checked | Result | Reason |
|-----------------|----------------|--------------|---------------|--------|--------|
| 09:00, 2hr | None | 3hr | 11:00 only | PASS | Slot 11:00 available |
| 09:00, 2hr | 11:00 (Bonnie, 1hr) | 3hr | 11:00 only | FAIL | Slot 11:00 booked |
| 09:00, 3hr | None | 2hr | None (shrinking) | PASS | No check needed when shrinking |
| 09:00, 2hr | None | 5hr | 11:00, 12:00, 13:00 | PASS | All new slots available |
| 09:00, 2hr | 13:00 (Bonnie, 1hr) | 5hr | 11:00, 12:00, 13:00 | FAIL | Slot 13:00 booked |
| 09:00, 1hr at 21:00 | None | 2hr | N/A | FAIL | Would extend to 23:00 (exceeds END_HOUR 22:00) |

**Why This Design:**

- User extending booking shouldn't be blocked by their own booking
- Only check if NEW slots (beyond current range) are available
- Shrinking duration never conflicts (freeing slots, not claiming new ones)

**Source reference:** See useBookings.js lines 228-255, App.jsx lines 234-247 (canPopupChangeDuration with END_HOUR check)

---

## Given-When-Then Scenarios

Testable behavior specifications for key flows and edge cases.

### Scenario 1: Create 1-Hour Booking (Happy Path)

**Given** user is viewing day view for tomorrow
**And** no bookings exist for tomorrow
**And** configuration includes user "Jack" with hotkey "j"
**When** user clicks 09:00 slot
**Then** booking panel opens showing "09:00" time
**When** user presses "j" key
**Then** Jack's button becomes highlighted
**When** user presses "1" key
**Then** booking is created for Jack at 09:00 with duration 1
**And** booking panel closes
**And** calendar shows Jack's booking block at 09:00
**And** POST /api/bookings is sent with `{ dateKey: tomorrow, timeKey: "09:00", user: "Jack", duration: 1 }`

### Scenario 2: Create 3-Hour Booking with Conflict at Hour 2

**Given** user is viewing day view for today
**And** existing booking exists: 11:00 (Bonnie, 1 hour)
**When** user clicks 09:00 slot
**And** user selects Jack
**Then** duration buttons show:
- 1 hour: **Enabled** (09:00 available)
- 2 hours: **Enabled** (09:00, 10:00 available)
- 3 hours: **Disabled** (11:00 conflicts with Bonnie's booking)
**When** user presses "3" key
**Then** nothing happens (button is disabled)
**When** user presses "2" key
**Then** booking is created for Jack at 09:00 with duration 2
**And** calendar shows Jack's booking at 09:00-10:00, Bonnie's booking at 11:00

### Scenario 3: Edit Booking User (Happy Path)

**Given** existing booking: 09:00 (Jack, 2 hours)
**And** user is viewing day view with this booking
**When** user clicks the 09:00 booking block
**Then** edit popup opens showing:
- Time range: "09:00 - 11:00"
- Jack's button highlighted
- Duration "2 hours" button highlighted
**When** user presses "b" key (Bonnie's hotkey)
**Then** Bonnie's button becomes highlighted
**And** booking block changes from Jack's color to Bonnie's color
**And** PUT /api/bookings/update is sent with `{ dateKey, timeKey: "09:00", updates: { user: "Bonnie" } }`
**And** popup remains open

### Scenario 4: Extend Booking Duration Successfully

**Given** existing booking: 09:00 (Jack, 1 hour)
**And** slots 10:00 and 11:00 are available
**And** user has popup open for this booking
**When** user presses "3" key
**Then** duration changes to 3 hours
**And** booking block extends to cover 09:00, 10:00, 11:00
**And** PUT /api/bookings/update is sent with `{ dateKey, timeKey: "09:00", updates: { duration: 3 } }`
**And** popup remains open showing "09:00 - 12:00"

### Scenario 5: Extend Booking Duration Blocked by Adjacent Booking

**Given** existing bookings:
- 09:00 (Jack, 2 hours) occupying 09:00, 10:00
- 11:00 (Bonnie, 1 hour)
**And** user has popup open for Jack's 09:00 booking
**Then** duration buttons show:
- 1 hour: **Enabled** (shrinking allowed)
- 2 hours: **Enabled** (current duration, highlighted)
- 3 hours: **Disabled** (would conflict with 11:00 booking)
**When** user presses "3" key
**Then** nothing happens (button is disabled)
**When** user presses "1" key
**Then** duration shrinks to 1 hour
**And** slot 10:00 becomes available

### Scenario 6: Delete Booking

**Given** existing booking: 09:00 (Jack, 2 hours)
**And** user has popup open for this booking
**When** user presses "d" key
**Then** booking is deleted
**And** booking blocks at 09:00 and 10:00 disappear
**And** popup closes
**And** DELETE /api/bookings/update is sent with `{ dateKey, timeKey: "09:00" }`
**And** slots 09:00 and 10:00 become available

### Scenario 7: Cancel Booking Mid-Flow

**Given** user clicks 09:00 slot (panel opens)
**And** user selects Jack
**When** user presses Esc key
**Then** panel closes
**And** no booking is created
**And** no API call is made
**And** 09:00 slot remains available

### Scenario 8: Keyboard-Only Booking Creation

**Given** user is in day view
**And** keyboard focus is not on any slot
**When** user presses Down arrow
**Then** first available slot receives keyboard focus (highlighted)
**When** user presses Down arrow again
**Then** next available slot receives focus
**When** user presses Enter
**Then** booking panel opens for focused slot
**When** user presses "j" (Jack)
**Then** Jack is selected
**When** user presses "2" (2 hours)
**Then** booking is created
**And** panel closes
**And** entire flow completed without mouse

### Scenario 9: Popup Keyboard Trap

**Given** user has edit popup open for a booking
**When** user presses "w" key (week toggle shortcut)
**Then** nothing happens (week toggle is disabled in POPUP MODE)
**When** user presses Left arrow (date navigation)
**Then** nothing happens (navigation is disabled in POPUP MODE)
**When** user presses Esc
**Then** popup closes
**And** user returns to NAVIGATION MODE
**When** user presses "w" key again
**Then** view switches to week view (week toggle now active)

### Scenario 10: Optimistic Update Rollback on Conflict

**Given** user is viewing day view
**And** user selects 09:00 slot, selects Jack, selects 2 hours
**Then** booking appears immediately at 09:00-10:00
**And** panel closes
**And** POST /api/bookings is sent in background
**When** API responds with 409 Conflict (slot already booked by another user)
**Then** system triggers sync (GET /api/bookings)
**And** server response shows Bonnie's booking at 09:00
**Then** local state is replaced with server response
**And** Jack's booking disappears
**And** Bonnie's booking appears
**And** user sees error message: "Slot already booked"

### Scenario 11: Book Now Button - Instant Current Hour Booking

**Given** current time is 10:45 AM
**And** current hour (10:00) is within booking hours (06:00-21:00)
**And** slot 10:00 is available
**And** user is in NAVIGATION MODE
**When** user presses "n" key
**Then** booking panel opens for slot 10:00
**And** current date is set to today (if user was viewing different date)
**When** user selects Jack and 1 hour
**Then** booking created at 10:00 for 1 hour
**And** user sees booking in current time slot

**Because:** Book Now provides fastest path to book current hour - single keypress opens panel for "right now"

### Scenario 12: Book Now Unavailable - Current Hour Booked

**Given** current time is 10:45 AM
**And** slot 10:00 is already booked (Jack, 2 hours)
**When** user views application header
**Then** Book Now button is hidden
**When** user presses "n" key
**Then** nothing happens (shortcut disabled)

**Because:** Book Now only appears when current hour is actually available

---

## Cross-References to Architecture Documentation

This functional specification describes **what happens** when users interact with bookings. Implementation details are documented elsewhere:

### Data Structure References

**Booking object format:**
```json
{
  "user": "Jack",
  "duration": 2
}
```

**See:** DATA-STORAGE.md sections "Bookings Data Schema" and "Multi-Hour Booking Representation" for complete structure

**Date and time key formats:**
- dateKey: `YYYY-MM-DD` (e.g., "2026-02-14")
- timeKey: `HH:00` (e.g., "09:00")

**See:** DATA-STORAGE.md section "Key Formats" for validation patterns

### API Operation References

**Creating a booking:**
- Endpoint: `POST /api/bookings`
- Request body: `{ dateKey, timeKey, user, duration }`

**See:** API-CONTRACTS.md section "Endpoint: POST /api/bookings" for complete contract

**Updating a booking:**
- Endpoint: `PUT /api/bookings/update`
- Request body: `{ dateKey, timeKey, updates: { user?, duration? } }`

**See:** API-CONTRACTS.md section "Endpoint: PUT /api/bookings/update" for validation rules

**Deleting a booking:**
- Endpoint: `DELETE /api/bookings/update`
- Request body: `{ dateKey, timeKey }`

**See:** API-CONTRACTS.md section "Endpoint: DELETE /api/bookings/update" for cleanup behavior

### State Management References

**Optimistic update pattern:**
1. Update local state immediately
2. Send API request in background
3. On error: `triggerSync()` fetches server truth

**See:** STATE-MANAGEMENT.md section "Optimistic Update Pattern" for rollback logic

**Polling synchronization:**
- Interval: 7 seconds
- Behavior: Complete state replacement from server

**See:** STATE-MANAGEMENT.md section "State Triggers" and related ARCH-03 (Polling & Sync)

---

## Summary

**Booking creation:** Slot selection → user selection → duration selection → instant booking (3 steps, no submit button)

**Booking editing:** Click booking → change user or duration inline → close popup (all changes saved immediately)

**Booking deletion:** Click booking → press D → booking removed instantly

**Optimistic updates:** All operations feel instant; errors rollback automatically via sync

**Conflict detection:** canBook() checks all slots for new bookings, canChangeDuration() checks only new slots for extensions

**State machines:** Panel has 3 states (CLOSED, AWAITING_USER, AWAITING_DURATION), popup has 2 states (CLOSED, VIEWING)

**Keyboard shortcuts:** Context-aware activation - navigation disabled in POPUP MODE, panel shortcuts only active in PANEL MODE

**Technology-neutral:** Rails, Django, or any framework can implement identical behavior from this specification

---

*Document version: 1.0*
*Last updated: 2026-02-13*
*Phase: 09-functional-documentation*
