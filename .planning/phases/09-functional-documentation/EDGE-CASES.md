# EDGE-CASES.md (FUNC-04)

**Functional Specification: Comprehensive Edge Case Catalog**

---

## Overview

This document catalogs ALL boundary conditions, failure modes, and unexpected scenarios across the entire booking system. Each edge case documents what happens, the expected behavior, why this approach works, and warning signs if implementation is incorrect.

**Purpose:**
- Exhaustive "what if" catalog for implementers
- No vague "handle gracefully" outcomes - every scenario has specific expected behavior
- Organized by category (not feature) for easy reference
- Cross-references to other specifications where relevant

**Format for each edge case:**
- **What Happens:** The specific scenario
- **Expected Behavior:** Exact system response (not "handle appropriately")
- **Why This Works:** Rationale for this approach
- **Warning Signs:** (Optional) How to detect if implementation is wrong

---

## Category: Booking Conflicts

### EC-01: Two Users Book Same Slot Simultaneously (Race Condition)

**What Happens:**

Given:
- Alice and Bob are both viewing today's calendar
- 2:00 PM slot is available for both users
- Alice clicks 2:00 PM slot at 2:45:01 PM
- Bob clicks 2:00 PM slot at 2:45:02 PM
- Alice completes booking (selects user, duration) at 2:45:05 PM
- Bob completes booking at 2:45:06 PM

**Expected Behavior:**

1. Alice's browser: Optimistic update shows booking immediately (2:45:05)
2. Alice's API call succeeds, server stores booking (2:45:05)
3. Bob's browser: Optimistic update shows booking immediately (2:45:06)
4. Bob's API call reaches server (2:45:06)
5. Server detects conflict (slot already has Alice's booking)
6. Server rejects Bob's request with 409 Conflict
7. Bob's browser receives error
8. Bob's browser triggers sync (re-fetches from server)
9. Bob's optimistic booking disappears, replaced by Alice's booking
10. Bob sees Alice's booking at 2:00 PM (rollback complete)

**Why This Works:**
- Optimistic updates make UI feel instant for both users
- Server is source of truth for conflict detection
- Automatic rollback via sync ensures consistency
- First successful API call wins (server-enforced ordering)

**Warning Signs:**
- Bob's booking persists after sync (sync failed to rollback)
- Both bookings coexist (server allowed double-booking)
- No visual feedback to Bob that booking failed

**Source reference:** See useBookings.js lines 99-103 for optimistic rollback logic

---

### EC-02: User Extends Duration Into Occupied Slot

**What Happens:**

Given:
- Alice has booking at 2:00 PM, duration 1 hour
- Bob has booking at 3:00 PM, duration 1 hour
- Alice opens her 2:00 PM booking popup
- Alice tries to change duration from 1 hour to 2 hours

**Expected Behavior:**

1. Alice clicks "2 hours" duration button
2. System checks `canChangeDuration(date, "14:00", 14, 1, 2)`
3. System checks if hour 15 (3:00 PM) is available
4. System finds Bob's booking at hour 15
5. Duration change is rejected (silent failure)
6. Duration remains at 1 hour
7. Duration buttons update: "1h" enabled, "2h" disabled (grayed out)
8. No error message shown (visual feedback via disabled state)

**Why This Works:**
- Validation happens client-side before API call (fast feedback)
- No wasted API call for known-invalid operation
- Visual feedback (disabled button) prevents user confusion
- Silent rejection appropriate (user can see why via disabled state)

**Warning Signs:**
- API call made even though client knows it will fail
- Duration changes to 2 hours momentarily then reverts (optimistic update without validation)
- No visual indication that 2 hours is unavailable

**Source reference:** See BOOKING-FLOW.md "Duration Selection Decision Table" for validation logic

---

### EC-03: Adjacent Booking Prevents Extension

**What Happens:**

Given:
- User has booking at 10:00 AM, duration 2 hours (occupies 10:00 and 11:00)
- Another user has booking at 12:00 PM
- User opens 10:00 AM booking popup
- User wants to extend to 3 hours

**Expected Behavior:**

1. System calculates needed hours: 10, 11, 12 (3 hours starting at 10:00)
2. System checks `canChangeDuration(date, "10:00", 10, 2, 3)`
3. Validation checks hour 12 (new slot beyond current duration)
4. Hour 12 has a booking
5. Validation returns false
6. "3h" duration button is disabled
7. Maximum available duration is 2 hours

**Why This Works:**
- `canChangeDuration` only validates NEW slots (hours 12+), not existing slots (10-11)
- User's own booking doesn't block itself
- Adjacent bookings correctly limit maximum duration

**Warning Signs:**
- User can extend into occupied slot (validation missing)
- Validation checks hours 10-11 and blocks user's own booking
- No visual feedback about maximum available duration

**Source reference:** See useBookings.js lines 226-255 for `canChangeDuration` logic

---

### EC-04: Multi-Hour Booking Creates Multiple Blocked Slots

**What Happens:**

Given:
- Alice creates booking at 9:00 AM with duration 4 hours
- Bob views the same day

**Expected Behavior:**

1. Alice's booking stored at key "09:00" with `{ user: "Alice", duration: 4 }`
2. Bob's view shows:
   - 9:00 AM: "Booked" (Alice) - slot has direct booking
   - 10:00 AM: "Blocked" (by Alice's 9:00 booking) - hour 10 > 9 and < 13
   - 11:00 AM: "Blocked" (by Alice's 9:00 booking) - hour 11 > 9 and < 13
   - 12:00 PM: "Blocked" (by Alice's 9:00 booking) - hour 12 > 9 and < 13
   - 1:00 PM: "Available" - hour 13 = 9 + 4, first free slot
3. Clicking 10:00, 11:00, or 12:00 opens popup showing Alice's 9:00 AM booking
4. All 4 slots visually indicate they're part of same booking

**Why This Works:**
- Only one database entry (at start time) for entire multi-hour booking
- `isSlotBlocked` function determines blocked status dynamically
- Clicking blocked slot opens the original booking (user can see full context)

**Warning Signs:**
- 1:00 PM also shows as blocked (off-by-one error in blocking logic)
- Clicking 10:00 AM shows no booking or creates error (blocked slot not linked to original)
- Four separate database entries created (one per hour)

**Source reference:** See TIME-DATE-HANDLING.md "Multi-Hour Booking Slot Logic" for blocking algorithm

---

## Category: Past Hours and Current Hour

### EC-05: Booking Current Hour at 59 Minutes Past

**What Happens:**

Given:
- Current time: 9:59:47 AM
- User viewing today
- 9:00 AM slot is visible
- User clicks 9:00 AM slot

**Expected Behavior:**

1. 9:00 AM slot shows as "Available" (isSlotPast returns false because 9:59 < 10:00)
2. User clicks slot, booking panel opens
3. User selects person and duration
4. User completes booking at 9:59:55 AM
5. API call sent at 9:59:55 AM
6. Server accepts booking (slot not past on server either)
7. Booking created successfully
8. At 10:00:00 AM, hourly refresh fires
9. 9:00 AM slot disappears from today's view (now past)
10. Created booking still visible (past bookings are shown, past available slots are hidden)

**Why This Works:**
- "End of hour" boundary rule allows booking until :59:59
- Users can book "right now" even late in the hour
- Server uses same logic, ensuring client-server consistency
- Hourly refresh cleans up UI after hour passes

**Warning Signs:**
- Slot disappears at 9:01 AM (too early, wrong boundary)
- Slot stays available at 10:05 AM (refresh didn't fire)
- Server rejects booking made at 9:59 AM (client-server logic mismatch)

**Source reference:** See TIME-DATE-HANDLING.md "Current Hour and isSlotPast Logic" for boundary rule

---

### EC-06: Hour Transition While Viewing Today

**What Happens:**

Given:
- Current time: 9:58:30 AM
- User viewing today
- Slots 10:00 AM through 9:00 PM visible (6-9 AM hidden as past)
- User leaves page open without interacting

**Expected Behavior:**

1. At 9:58:30 AM: System calculates next refresh = 1 min 30 sec away
2. User sees slots 10-21 (10 AM to 9 PM)
3. At 10:00:00.000 AM exactly: Timer fires
4. System increments refresh tick (forces re-render)
5. `isSlotPast` recalculates for all slots
6. Hour 9 now returns true (9:00 AM slot end <= 10:00 AM)
7. Slot list recalculates: visible slots are now 10-21 (11 total, was 12)
8. 9:00 AM slot removed from view
9. New timer scheduled for 11:00:00 AM (60 minutes away)

**Why This Works:**
- Precision timing ensures update happens exactly at hour boundary
- Users don't need to refresh page
- Prevents attempts to book past slots
- Hourly refresh is independent of polling (different concerns)

**Warning Signs:**
- Slot removal happens at wrong time (calculation error)
- UI doesn't update until user interacts (refresh not triggering)
- Multiple refreshes fire in same minute (timer not clearing properly)

**Source reference:** See TIME-DATE-HANDLING.md "Hourly Refresh Mechanism" for implementation

---

### EC-07: Viewing Past Slots on Future Dates

**What Happens:**

Given:
- Current time: 2:30 PM (14:30)
- User navigates to tomorrow's date
- Tomorrow is a future date

**Expected Behavior:**

1. System checks `isToday(tomorrow)` → returns false
2. Slot visibility logic: Show ALL 16 slots (no past filtering)
3. User sees slots 6-21 (all 16 slots)
4. Slots 6-13 (6 AM to 1 PM) show as available/booked/blocked based on bookings
5. No slots are hidden due to being "past"
6. This is correct: tomorrow's 8 AM is not past even though today's 8 AM is past

**Why This Works:**
- "Past" is relative to current date AND current time
- Future dates: all hours are in the future, so all should be visible
- Users planning ahead need to see full day
- Existing bookings for future dates should be fully visible

**Warning Signs:**
- Future date shows only slots after current hour (wrong filtering)
- Future date shows zero slots (past filtering applied incorrectly)
- User can't book 9 AM slot tomorrow even though it's future

**Source reference:** See TIME-DATE-HANDLING.md "Today's View vs Future Date View" for filtering rules

---

### EC-08: Book Now Button at Hour Boundary

**What Happens:**

Given:
- Current time: 9:59:58 AM
- Book Now button visible (9:00 AM slot available)
- User watching Book Now button
- At 10:00:00 AM, hour changes

**Expected Behavior:**

1. At 9:59:58 AM: `currentHourAvailable` returns true (9:00 AM not past, available)
2. Book Now button visible with pulsing animation
3. At 10:00:00 AM: Hourly refresh fires
4. `currentHourAvailable` recalculates
5. Check: current hour is 10
6. Check: is 10:00 AM slot past? No (end of 10:00 slot is 11:00)
7. Check: is 10:00 AM slot available? (depends on bookings)
8. If available: Button stays visible (now for 10:00 AM slot)
9. If booked/blocked: Button disappears (hidden, not disabled)

**Alternative scenario: Current hour becomes unavailable**

1. At 9:59:58 AM: 9:00 AM available, button visible
2. Another user books 10:00 AM at 9:59:59 AM
3. Polling sync runs at 10:00:01 AM, updates bookings
4. `currentHourAvailable` recalculates
5. 10:00 AM slot is booked
6. Button disappears

**Why This Works:**
- Book Now automatically tracks the "current hour"
- Hourly refresh ensures button reflects current state
- Visibility is dynamic based on availability
- Hidden state clearer than disabled state

**Warning Signs:**
- Button stays visible for 9:00 AM slot after 10:00 AM (not updating)
- Button shows disabled state instead of hiding
- Button visible for booked slot (validation missing)

**Source reference:** See BOOK-NOW-FEATURE.md "Complete Visibility Truth Table" for all conditions

---

## Category: Multi-Hour Bookings

### EC-09: Duration Limited by End of Operating Hours

**What Happens:**

Given:
- User selects 9:00 PM slot (21:00, hour 21)
- END_HOUR is 22
- User in booking panel choosing duration

**Expected Behavior:**

1. System calculates maximum duration: END_HOUR - selected hour = 22 - 21 = 1
2. Duration buttons show:
   - "1h" → Enabled (21:00 to 22:00)
   - "2h" → Disabled (would extend to 23:00, beyond operating hours)
   - "3h" → Disabled (would extend to 24:00, beyond operating hours)
3. User can only select 1 hour
4. If user somehow bypasses validation (client bug), server rejects booking with 400 Bad Request

**Alternative scenario: 8:00 PM slot**

1. Selected hour: 20
2. Maximum duration: 22 - 20 = 2 hours
3. Duration buttons:
   - "1h" → Enabled
   - "2h" → Enabled (20:00 to 22:00)
   - "3h" → Disabled (would extend to 23:00, beyond hours)

**Why This Works:**
- Client-side validation prevents invalid selections
- Visual feedback (disabled buttons) shows constraints
- Server-side validation catches any client bugs
- Maximum duration formula simple: `END_HOUR - selectedHour`

**Warning Signs:**
- User can select 3 hours for 9 PM slot (validation missing)
- Booking created at 9 PM for 3 hours (server validation missing)
- All duration buttons enabled regardless of time (constraint not applied)

**Source reference:** See BOOKING-FLOW.md "Duration Selection Decision Table" for validation logic

---

### EC-10: Multi-Hour Booking Display in Week View

**What Happens:**

Given:
- Alice has booking: Wednesday 2:00 PM, duration 3 hours
- User viewing week view containing Wednesday

**Expected Behavior:**

1. Wednesday column shows Wednesday's 16 slots
2. For 2:00 PM slot (hour 14):
   - Slot status: "Booked"
   - Visual: Colored block with Alice's name
   - Height: 3x normal height (spans 3 hour rows visually)
3. For 3:00 PM slot (hour 15):
   - Slot status: "Blocked"
   - Visual: Part of the same colored block (no separate box)
   - Click opens Alice's 2:00 PM booking
4. For 4:00 PM slot (hour 16):
   - Slot status: "Blocked"
   - Visual: Part of the same colored block
   - Click opens Alice's 2:00 PM booking
5. For 5:00 PM slot (hour 17):
   - Slot status: "Available" (or booked by someone else)
   - Visual: Normal slot rendering

**Why This Works:**
- Visual height communicates duration at a glance
- Clicking any part of multi-hour block opens the original booking
- Week view shows same information as day view, just more compact
- One visual object per booking (not three separate boxes)

**Warning Signs:**
- Three separate boxes shown for hours 14, 15, 16 (should be one unified block)
- Clicking hour 15 does nothing or shows error (blocked slot not linked)
- Visual height doesn't reflect duration (all bookings same size)

**Source reference:** See BOOKING-FLOW.md "Booking Popup Opening" for blocked slot interaction

---

## Category: Week Transitions

### EC-11: Navigating from Sunday to Next Week

**What Happens:**

Given:
- Current date: Sunday, February 23, 2026
- User in week view
- User clicks right arrow (next week)

**Expected Behavior:**

1. Current week: Monday Feb 17 - Sunday Feb 23
2. User clicks right arrow
3. System adds 7 days to start of week: Feb 17 + 7 = Feb 24
4. `getStartOfWeek(Feb 24)` called
5. Feb 24 is Monday (day 1)
6. Calculation: day = 1, diff = 1 - 1 = 0
7. Start of week stays at Feb 24 (already Monday)
8. `getWeekDays(Feb 24)` generates: [Feb 24, Feb 25, Feb 26, Feb 27, Feb 28, Mar 1, Mar 2]
9. New week: Monday Feb 24 - Sunday Mar 2
10. View updates to show new week

**Why This Works:**
- Week navigation always moves by 7 days (full weeks)
- Start date is always Monday (week view enforces this)
- Month boundaries handled automatically by JavaScript Date

**Warning Signs:**
- Next week starts on Tuesday (miscalculated start of week)
- Skips or repeats days (incorrect day calculation)
- Week view shows 6 or 8 days instead of 7

**Source reference:** See TIME-DATE-HANDLING.md "Week Navigation" for getStartOfWeek logic

---

### EC-12: getStartOfWeek for Sunday Date

**What Happens:**

Given:
- Input date: Sunday, February 23, 2026
- System calls `getStartOfWeek(Feb 23)`

**Expected Behavior:**

1. Get day-of-week for Feb 23: Sunday = 0
2. Calculation: day = 0, diff = 0 === 0 ? -6 : 1 - 0
3. Since day is 0 (Sunday), diff = -6
4. Subtract 6 days from Feb 23: Feb 23 - 6 = Feb 17
5. Return: Monday, February 17, 2026

**Result:** Sunday returns the PREVIOUS Monday (start of the week containing Sunday)

**Why This Works:**
- Sunday is the LAST day of the week (in Monday-start convention)
- To find the Monday that starts Sunday's week, go back 6 days
- Consistent with ISO 8601 week date system

**Warning Signs:**
- Sunday returns Sunday itself (should return previous Monday)
- Sunday returns next Monday (off by a week)
- Sunday calculation different from other days (inconsistent week definition)

**Source reference:** See TIME-DATE-HANDLING.md "getStartOfWeek Logic" for day-of-week calculation

---

### EC-13: Week View Shows Today Highlight

**What Happens:**

Given:
- Today: Wednesday, February 19, 2026
- User viewing week view containing today (Mon Feb 17 - Sun Feb 23)

**Expected Behavior:**

1. Week view displays 7 columns (Mon-Sun)
2. Wednesday column (Feb 19) has visual highlight:
   - Border around column or background color change
   - Label shows "Today" or similar indicator
3. Wednesday column shows filtered slots (past hours hidden)
4. Other columns (Mon, Tue, Thu, Fri, Sat, Sun) show all 16 slots
5. Other columns have normal styling (no highlight)

**Why This Works:**
- Users can quickly identify "today" in week view
- Today's column has different slot visibility (past filtering)
- Other days are informational (show full day)

**Warning Signs:**
- No visual distinction for today's column
- All days show filtered slots (past filtering applied to future dates)
- Today column shows all slots (past filtering not applied)

**Source reference:** See BOOKING-FLOW.md "View Mode Interaction" for today detection

---

### EC-14: Switching from Week View to Day View

**What Happens:**

Given:
- User in week view
- User presses W key to toggle to day view

**Expected Behavior:**

1. System captures current date (e.g., Wednesday, February 19)
2. Week view closes
3. Day view opens showing Wednesday, February 19
4. If booking panel was open, it closes (mode transition to NAVIGATION MODE)
5. Keyboard focus cleared
6. Day view shows filtered slots if today, all slots if future/past date

**Alternative: Clicking a day in week view**

1. User clicks Thursday column in week view
2. System captures Thursday's date (February 20)
3. Week view closes
4. Day view opens showing Thursday, February 20 (not today)
5. Day view shows all 16 slots (future date)

**Why This Works:**
- Week toggle maintains current date context
- Day click allows jumping to specific date
- Mode transition ensures no orphaned UI state
- View change clears selections to prevent confusion

**Warning Signs:**
- Switching to day view shows different date than expected
- Booking panel stays open after view toggle (should close)
- Week view and day view show different slot lists for same date

**Source reference:** See BOOKING-FLOW.md "Application Modes" for mode transition rules

---

## Category: Timezone Edge Cases

### EC-15: DST Transition Day (Spring Forward)

**What Happens:**

Given:
- Date: First Sunday of October 2026 (DST begins in NSW)
- At 2:00 AM, clocks spring forward to 3:00 AM in NSW
- User viewing booking system during transition

**Expected Behavior:**

1. System queries current DST status via Intl API
2. Before 2:00 AM: `isNSWInDST()` returns false (AEST)
3. After 3:00 AM: `isNSWInDST()` returns true (AEDT)
4. If NSW toggle ON before transition: times show QLD hours (offset = 0)
5. If NSW toggle ON after transition: times show QLD + 1 (offset = 1)
6. Storage remains Queensland time (no change)
7. Bookings created during transition use QLD time (6-21)
8. No lost or duplicate hours in booking system (unlike real-world clocks)

**Why This Works:**
- IANA database handles DST rules automatically
- Intl API returns correct abbreviation regardless of transition
- Storage in QLD time (no DST) avoids ambiguity
- Display-only conversion immune to DST edge cases

**Warning Signs:**
- Hardcoded DST dates stop working after legislation change
- Times jump or skip during transition period
- Bookings created with wrong timezone during transition

**Source reference:** See TIMEZONE-TOGGLE.md "DST Detection Logic" and "Implementation Constraints"

---

### EC-16: NSW Display Shows Hour Beyond Operating Hours

**What Happens:**

Given:
- NSW toggle ON
- NSW in DST (offset = +1)
- User viewing 9:00 PM slot (hour 21)

**Expected Behavior:**

1. Storage hour: 21
2. Display calculation: 21 + 1 = 22
3. Format as 12-hour time: 22 → 10:00 PM
4. Slot label shows: "10:00 PM"
5. This is END_HOUR boundary (22), but displayed as a bookable slot
6. User can book this slot (it's hour 21 in storage)
7. Booking stored with timeKey "21:00"
8. Next slot after this doesn't exist (hour 22 is END_HOUR)

**Why This Works:**
- Display hour 22 represents storage hour 21 (valid)
- No actual booking created for hour 22 (stored as hour 21)
- Timezone is display-only, doesn't affect validity
- Storage timezone (QLD) determines valid hours, not display

**Warning Signs:**
- Slot shows "11:00 PM" (wrong 12-hour conversion)
- Booking stored with timeKey "22:00" (should be "21:00")
- Validation rejects hour 22 display (shouldn't, it's display of valid hour 21)

**Source reference:** See TIMEZONE-TOGGLE.md "Display Conversion Rules" for offset calculation

---

### EC-17: Timezone Toggle Doesn't Affect Booking Data

**What Happens:**

Given:
- User creates booking at 2:00 PM with NSW toggle OFF
- Booking stored: `{ "14:00": { user: "Alice", duration: 2 } }`
- User toggles to NSW time (DST active, offset +1)
- User views the same booking

**Expected Behavior:**

1. Storage key remains: "14:00"
2. Display hour: 14 + 1 = 15 → "3:00 PM"
3. Booking visually appears at 3:00 PM row
4. Clicking booking opens popup showing "3:00 PM"
5. Toggling back to QLD time
6. Booking visually moves to 2:00 PM row
7. Storage key unchanged: still "14:00"
8. No API calls made during toggle (pure display change)

**Why This Works:**
- Timezone affects DISPLAY only, not DATA
- Same booking appears at different visual positions
- No data migration or API updates required
- Toggle is instant and reversible

**Warning Signs:**
- Booking stored with different key after toggle (data mutated)
- API call made when toggling timezone (unnecessary)
- Booking disappears or duplicates after toggle

**Source reference:** See TIMEZONE-TOGGLE.md "Storage vs Display Separation" for isolation rules

---

## Category: Polling and Sync

### EC-18: Polling Tick During Booking Creation

**What Happens:**

Given:
- User creating booking (panel open, selected user, selecting duration)
- Polling tick fires (7-second interval reached)
- Sync fetches latest bookings from server

**Expected Behavior:**

1. User in PANEL MODE with partial booking (slot + user selected)
2. Polling interval reached
3. Background fetch to `/api/bookings` initiated
4. Server returns latest booking data
5. System replaces entire bookings object
6. If selected slot now occupied:
   - Slot status changes to "booked" or "blocked"
   - Duration validation recalculates
   - Some duration options may become disabled
   - Panel remains open
   - User's selection (slot + user) preserved
7. If selected slot still available:
   - No change to user experience
   - Panel stays open, selections preserved

**Alternative: Conflict detected on completion**

1. User completes booking (clicks duration)
2. Optimistic update shows booking
3. API call sent
4. Server finds slot now occupied (another user booked during user's selection)
5. Server returns 409 Conflict
6. Client triggers sync
7. Sync replaces optimistic booking with actual state
8. User's booking disappears (rollback)

**Why This Works:**
- Polling doesn't interrupt user workflow
- Background updates keep data fresh
- Validation recalculates with latest data
- Optimistic updates + rollback handle race conditions gracefully

**Warning Signs:**
- Panel closes during polling tick (shouldn't)
- User's partial selection cleared by sync (should preserve)
- Conflict detection fails (sync doesn't rollback)

**Source reference:** See STATE-MANAGEMENT.md "Polling Sync Pattern" for sync behavior

---

### EC-19: Network Error During Polling

**What Happens:**

Given:
- Polling enabled, ticking every 7 seconds
- Network becomes unavailable (user offline, server down, etc.)
- Polling fetch fails

**Expected Behavior:**

1. Polling interval reached
2. Fetch to `/api/bookings` initiated
3. Network error occurs (timeout, connection refused, etc.)
4. Fetch promise rejects
5. Error logged to console
6. No update to bookings state (preserve existing data)
7. Polling timer continues (next tick in 7 seconds)
8. Next tick attempts fetch again
9. If network restored, fetch succeeds and state updates
10. If network still down, error logged again

**Why This Works:**
- Graceful degradation: app continues with stale data
- No crash or UI corruption
- Automatic recovery when network restored
- User can continue viewing and creating bookings (may conflict later)

**Warning Signs:**
- App crashes on network error
- Bookings state cleared (should preserve)
- Polling stops permanently after error (should retry)
- No console logging of error (debugging impossible)

**Source reference:** See usePollingSync.js lines 28-30 for error handling

---

### EC-20: API Failure During Booking Creation

**What Happens:**

Given:
- User completes booking (slot + user + duration selected)
- API call to `/api/bookings` fails (500 error, network timeout, etc.)

**Expected Behavior:**

1. User clicks duration button
2. Optimistic update: booking appears immediately in UI
3. API call sent to `/api/bookings` (POST)
4. API call fails (network error, server error, etc.)
5. Error caught in try/catch
6. Error logged to console
7. `triggerSync()` called to rollback
8. Background fetch to `/api/bookings` (GET) retrieves truth
9. Server response doesn't include the failed booking
10. State replaced with server data
11. Optimistic booking disappears from UI
12. User sees slot is still available (rollback complete)

**Why This Works:**
- Optimistic update provides instant feedback
- Server is source of truth (if API fails, booking didn't happen)
- Automatic rollback via sync ensures consistency
- User can retry booking immediately

**Warning Signs:**
- Booking persists in UI despite API failure (no rollback)
- App crashes or freezes on API error
- No indication to user that booking failed
- Sync doesn't fire after failure

**Source reference:** See useBookings.js lines 91-103 for create error handling

---

### EC-21: Rapid Successive Operations

**What Happens:**

Given:
- User rapidly creates booking at 2:00 PM
- Before API responds, user deletes same booking
- Both API calls in flight simultaneously

**Expected Behavior:**

1. Time 0ms: User creates booking
   - Optimistic update: booking appears
   - POST /api/bookings sent
2. Time 500ms: User deletes booking
   - Optimistic update: booking disappears
   - DELETE /api/bookings sent
3. Time 800ms: POST responds (success)
   - No state update (triggerSync not called on success)
4. Time 900ms: DELETE responds (404 Not Found)
   - Server says "booking doesn't exist" (never created or already deleted)
   - Error logged
   - triggerSync called
5. Time 1000ms: Sync fetch completes
   - Server returns actual state
   - Booking either exists (POST succeeded) or doesn't (DELETE succeeded)
6. UI matches server truth

**Why This Works:**
- Both operations apply optimistically (instant UI)
- Server handles race in API calls
- Final sync resolves any inconsistency
- Last sync always shows truth regardless of operation order

**Warning Signs:**
- UI shows booking exists but server says deleted (no final sync)
- Both operations fail due to race condition (should handle)
- UI freezes during rapid operations

**Source reference:** See STATE-MANAGEMENT.md "Optimistic Update Pattern" for multiple operation handling

---

## Category: Configuration

### EC-22: API Unavailable at Startup

**What Happens:**

Given:
- Application loads
- API endpoint unreachable (server down, network error, wrong URL)
- Config fetch fails

**Expected Behavior:**

1. App initialization calls `/api/config`
2. Fetch fails (timeout, 500 error, network error)
3. Error caught, logged to console
4. App falls back to hardcoded default config:
   ```
   {
     title: "CPS Booking Calendar",
     users: [
       { name: "Jack", key: "j", color: "blue" },
       { name: "Nino", key: "n", color: "green" },
       // ... etc
     ]
   }
   ```
5. App continues loading with default config
6. User can create bookings using default users
7. Bookings stored in localStorage (API mode disabled)

**Why This Works:**
- Application must never crash due to missing config
- Hardcoded fallback ensures app always usable
- localStorage mode allows offline operation
- Default config matches prototype user list

**Warning Signs:**
- App shows loading spinner forever (no fallback)
- App crashes with "Cannot read property 'users'" (no default)
- No indication to user that API unavailable

**Source reference:** See useConfig.js and DATA-STORAGE.md "Configuration Storage" for fallback logic

---

### EC-23: Dynamic Keyboard Shortcuts from Config

**What Happens:**

Given:
- Config specifies 6 users with keys: J, N, M, L, R, S
- User in PANEL MODE (booking panel open)
- User presses "J" key

**Expected Behavior:**

1. Keyboard listener captures "j" keypress
2. System checks current mode: PANEL MODE
3. Mode allows user hotkeys
4. System looks up "j" in config user list
5. Finds user: `{ name: "Jack", key: "j", color: "blue" }`
6. Equivalent to clicking "Jack" button
7. Selected user changes to "Jack"
8. Panel advances to duration selection state

**Alternative: More than 6 users in config**

Given: Config has 8 users with keys J, N, M, L, R, S, A, B

1. Only first 6 users get hotkeys (J, N, M, L, R, S)
2. Users 7-8 (A, B) have no keyboard shortcuts
3. Users 7-8 can only be selected via mouse click
4. This is acceptable (keyboard optimization for most common users)

**Why This Works:**
- Keyboard shortcuts adapt to actual user list
- No hardcoded assumptions about user names
- First 6 users get hotkeys (most frequently used)
- System works with any config (2 users, 6 users, 10 users)

**Warning Signs:**
- Hardcoded shortcuts for specific names (breaks on config change)
- All users get shortcuts regardless of config
- Shortcuts don't work for non-default users

**Source reference:** See useKeyboard.js lines 85-90 for dynamic user hotkey mapping

---

### EC-24: More Than 6 Users in Config

**What Happens:**

Given:
- Config returns 10 users
- UI designed for 6 user buttons
- User creating booking

**Expected Behavior:**

1. Booking panel displays all 10 users as buttons
2. Layout may wrap or scroll (responsive design)
3. First 6 users have keyboard shortcuts (keys from config)
4. Users 7-10 have no keyboard shortcuts
5. All users clickable with mouse
6. Duration buttons appear after user selection (all 10 users work)

**Why This Works:**
- No artificial limit on user count
- UI adapts to actual user list
- Keyboard shortcuts prioritize most common users
- Mouse interaction works for all users

**Warning Signs:**
- Only 6 users shown (others hidden)
- UI breaks or overlaps with >6 users
- Users 7-10 can't be selected

**Source reference:** See BOOKING-FLOW.md "User Selection Decision Table" for user button behavior

---

## Category: Keyboard Navigation

### EC-25: Arrow Keys Skip Booked/Blocked Slots

**What Happens:**

Given:
- Today's view showing slots 10:00 AM through 9:00 PM (hours 10-21)
- 2:00 PM booked, 3:00 PM and 4:00 PM blocked
- User focuses 1:00 PM slot (keyboard navigation)
- User presses Down arrow

**Expected Behavior:**

1. Current focus: 1:00 PM (hour 13)
2. System builds available indices: [10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21]
   - Hour 14 omitted (booked)
   - Hours 15-16 present (wait, these are blocked - checking logic)
   - Actually: Available means status === 'available', so blocked slots excluded
   - Corrected available indices: [10, 11, 12, 13, 17, 18, 19, 20, 21]
3. Current index in available list: 3 (hour 13)
4. Down arrow: next index = 4 → hour 17 (5:00 PM)
5. Focus jumps from 1:00 PM to 5:00 PM (skipping booked/blocked slots)

**Why This Works:**
- Keyboard navigation only focuses bookable slots
- Prevents user from getting stuck on unavailable slots
- Down arrow always moves to next action the user can take
- Matches user mental model ("show me next available")

**Warning Signs:**
- Focus lands on booked slot (should skip)
- Down arrow does nothing when on available slot before gap
- Focus order non-sequential (jumping randomly)

**Source reference:** See BOOKING-FLOW.md "Keyboard Navigation" for available slot filtering

---

### EC-26: Keyboard Navigation in Week View

**What Happens:**

Given:
- User in week view
- User presses Up or Down arrow key

**Expected Behavior:**

1. Keyboard listener captures arrow key
2. System checks current mode: NAVIGATION MODE (correct)
3. System checks view mode: WEEK VIEW
4. Week view does not support keyboard slot navigation
5. Arrow key is ignored (no action)
6. User can still use Left/Right arrows for date navigation (previous/next week)

**Alternative: Day view keyboard navigation**

1. User in day view
2. Up/Down arrows navigate between available slots
3. Left/Right arrows navigate to previous/next day

**Why This Works:**
- Week view is for overview (7 days × 16 slots = 112 slots)
- Keyboard navigation impractical with 112 slots
- Click-based interaction more appropriate for week view
- Day view optimized for keyboard navigation

**Warning Signs:**
- Arrow keys navigate slots in week view (confusing with 112 slots)
- No keyboard navigation works in day view

**Source reference:** See BOOKING-FLOW.md "Application Modes" for view-specific keyboard behavior

---

### EC-27: Typing in Input Fields Doesn't Trigger Shortcuts

**What Happens:**

Given:
- Future feature: User editing a text input field (notes, custom user name, etc.)
- User types "w" as part of a word

**Expected Behavior:**

1. Keyboard listener captures "w" keypress
2. System checks event target: HTMLInputElement or HTMLTextAreaElement
3. Keyboard shortcut handler ignores event (input field has focus)
4. Letter "w" appears in input field
5. Week toggle shortcut does NOT fire

**Why This Works:**
- Users expect to type freely in input fields
- Keyboard shortcuts only active when no input focused
- Standard web convention (don't hijack typing)

**Warning Signs:**
- Typing "w" in input field toggles week view (shortcut not disabled)
- Shortcuts work everywhere (no input field exemption)

**Source reference:** See useKeyboard.js for event.target checking (standard pattern)

---

### EC-28: Popup Keyboard Trap (All Navigation Disabled)

**What Happens:**

Given:
- User opens booking popup (existing booking)
- User presses W key (week toggle)

**Expected Behavior:**

1. Keyboard listener captures "w" keypress
2. System checks current mode: POPUP MODE
3. Mode check: POPUP MODE blocks all navigation shortcuts
4. Week toggle does NOT fire
5. "w" keypress ignored
6. Popup stays open
7. User must close popup (Esc, X button, Enter) before navigating

**Same behavior for:**
- Z (timezone toggle)
- Left/Right arrows (date navigation)
- B (Book Now)
- W (week toggle)

**Still allowed in POPUP MODE:**
- User hotkeys (J, N, M, L, R, S) - reassign booking
- Duration hotkeys (1, 2, 3) - change duration
- D (delete booking)
- Esc (close popup)
- Enter (close popup)

**Why This Works:**
- Prevents accidental navigation while editing
- User focused on current booking, shouldn't navigate away
- Clear mental model: "I'm in a modal, must close it first"
- Keyboard trap is a standard accessibility pattern for modals

**Warning Signs:**
- Week toggle works while popup open (should be blocked)
- User can navigate dates while editing booking (confusing state)
- No way to close popup with keyboard (accessibility fail)

**Source reference:** See BOOKING-FLOW.md "Critical Mode Rules" for keyboard trap specification

---

## Category: Data Integrity

### EC-29: Empty Date Cleanup on Delete

**What Happens:**

Given:
- Booking data: `{ "2026-02-14": { "09:00": { user: "Alice", duration: 1 } } }`
- User deletes the only booking on Feb 14

**Expected Behavior:**

1. User clicks booking, opens popup
2. User presses D key (delete)
3. Optimistic update:
   - Delete `bookings["2026-02-14"]["09:00"]`
   - Check: Are there other bookings on this date?
   - `Object.keys(bookings["2026-02-14"]).length === 0`
   - Result: Yes, date object is empty
   - Delete `bookings["2026-02-14"]` entirely
4. Final state: `{}`
5. API call sent: DELETE /api/bookings?dateKey=2026-02-14&timeKey=09:00
6. Server performs same cleanup

**Why this matters:**

- Prevents accumulation of empty date objects
- Keeps data structure clean: `{ date: { time: booking } }`
- No orphaned `{ "2026-02-14": {} }` entries
- Faster iteration (fewer keys to check)

**Alternative: Multiple bookings on date**

Given: `{ "2026-02-14": { "09:00": {...}, "14:00": {...} } }`

1. User deletes 09:00 booking
2. Optimistic update: Delete `bookings["2026-02-14"]["09:00"]`
3. Check: Are there other bookings? Yes, 14:00 remains
4. Keep date object: `{ "2026-02-14": { "14:00": {...} } }`

**Warning Signs:**
- Empty date objects accumulate: `{ "2026-02-14": {}, "2026-02-15": {} }`
- Iteration over dates returns empty objects
- Storage size grows with deleted bookings

**Source reference:** See useBookings.js lines 115-117 for empty date cleanup

---

### EC-30: Invalid Booking Data from Server

**What Happens:**

Given:
- Server returns malformed booking data
- Example: `{ "2026-02-14": { "09:00": null } }` or `{ "2026-02-14": "not-an-object" }`

**Expected Behavior:**

1. Polling tick fetches data
2. Server returns malformed structure
3. Client receives response
4. Type check: Is response an object?
   - If not object: Log error, don't update state, preserve existing data
   - If object but bookings are malformed: Depends on validation level
5. If individual booking is null:
   - `getSlotStatus` returns { status: 'available' } (treats as no booking)
6. If date value is not an object:
   - `getBookingsForDate` returns {} (empty object fallback)

**Why This Works:**
- Defensive programming prevents crashes
- Graceful degradation (show as available rather than crash)
- Logging enables debugging
- Existing bookings preserved on validation failure

**Warning Signs:**
- App crashes with "Cannot read property of null"
- Invalid data causes infinite re-render loop
- No error logging (silent failure)

**Source reference:** See useBookings.js lines 50-53 for data validation

---

### EC-31: Booking for Date Not in Current View

**What Happens:**

Given:
- User viewing today (February 14)
- Polling sync returns booking for February 20
- User hasn't navigated to Feb 20 yet

**Expected Behavior:**

1. Sync updates bookings state:
   ```
   {
     "2026-02-14": { ... },
     "2026-02-20": { "09:00": { user: "Alice", duration: 1 } }
   }
   ```
2. Current view still shows Feb 14
3. Feb 14 slots render normally
4. Feb 20 booking exists in state but not visible (different date)
5. User navigates to Feb 20
6. Feb 20 view shows Alice's 9:00 AM booking
7. No data fetch needed (already in state)

**Why This Works:**
- State contains all bookings across all dates
- View filters state to show current date
- Polling keeps all dates up to date
- Navigation instant (data already loaded)

**Warning Signs:**
- Booking appears on wrong date (Feb 20 booking shown on Feb 14)
- Navigation to Feb 20 triggers new fetch (should use cached state)
- Bookings for invisible dates not stored

**Source reference:** See STATE-MANAGEMENT.md "State Shape" for multi-date structure

---

## Cross-References

**Booking Flow:**
- EC-01, EC-02, EC-03, EC-04 → See BOOKING-FLOW.md for booking creation/edit workflows
- EC-25, EC-26, EC-27, EC-28 → See BOOKING-FLOW.md "Application Modes" for keyboard context rules

**Book Now Feature:**
- EC-05, EC-08 → See BOOK-NOW-FEATURE.md for current hour visibility logic
- EC-08 → See BOOK-NOW-FEATURE.md "Recalculation Triggers" for hourly refresh interaction

**Timezone Toggle:**
- EC-15, EC-16, EC-17 → See TIMEZONE-TOGGLE.md for complete DST handling
- EC-15 → See TIMEZONE-TOGGLE.md "Implementation Constraints" for IANA requirement

**Time/Date Handling:**
- EC-05, EC-06, EC-07 → See TIME-DATE-HANDLING.md for isSlotPast logic and hourly refresh
- EC-09, EC-10 → See TIME-DATE-HANDLING.md "Multi-Hour Booking Slot Logic"
- EC-11, EC-12, EC-13, EC-14 → See TIME-DATE-HANDLING.md "Week Navigation"
- EC-16 → See TIME-DATE-HANDLING.md "Timezone Display Offset"

**Data Storage:**
- EC-29, EC-30, EC-31 → See DATA-STORAGE.md for booking data structure
- EC-22 → See DATA-STORAGE.md "Configuration Storage" for fallback config

**Polling/Sync:**
- EC-18, EC-19, EC-20, EC-21 → See STATE-MANAGEMENT.md "Polling Sync Pattern"
- EC-01, EC-02 → See STATE-MANAGEMENT.md "Optimistic Update Pattern" for conflict resolution

---

**Document version:** FUNC-04
**Technology level:** Technology-neutral behavior specification
**Total edge cases:** 31 scenarios across 9 categories
**Audience:** Developers implementing booking system in any framework
