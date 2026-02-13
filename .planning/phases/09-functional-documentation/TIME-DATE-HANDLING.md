# TIME-DATE-HANDLING.md (FUNC-05)

**Functional Specification: Time and Date Logic**

---

## Overview

This document specifies ALL time and date logic in the booking system. All calculations for slot generation, date formatting, past detection, timezone display, and week navigation are defined here.

**What this covers:**
- Time slot generation (16 hourly slots per day)
- Date formatting (storage vs display formats)
- Current hour and "past" detection logic
- Multi-hour booking slot blocking
- Week navigation with Monday-start convention
- Hourly refresh mechanism
- Timezone display offset (QLD vs NSW)

**Storage timezone:** All times are stored in Queensland time (Australia/Brisbane, AEST, UTC+10, no DST).

**Why Queensland:**
1. Business operates in Queensland
2. No daylight saving time simplifies storage and calculations
3. NSW conversion is display-only, not storage

**IANA timezone reference:** Australia/Brisbane (UTC+10 year-round, no DST)

---

## Operating Hours

The booking system has fixed operating hours that apply to all instances:

- **START_HOUR:** 6 (6:00 AM)
- **END_HOUR:** 22 (10:00 PM)
- **Total bookable slots per day:** 16 slots (hours 6 through 21 inclusive)

**Why these are constants:**
- All instances of the booking system share the same operating hours
- These are not configurable per instance
- Hours 6-21 inclusive means slots run from 6:00 AM through 9:00 PM
- The last slot is at 21:00 (9:00 PM), ending at 22:00 (10:00 PM)

**Note:** Hour 22 (10:00 PM) is the END_HOUR boundary but is NOT a bookable slot. Bookable slots run from START_HOUR to END_HOUR-1.

---

## Time Slot Generation

The system generates a static list of 16 time slots representing each bookable hour of the day.

**Generation logic:**
1. Loop from START_HOUR (6) to END_HOUR-1 (21)
2. For each hour, create a slot object with three properties:
   - `hour` (integer): The hour in 24-hour format (6-21)
   - `time` (string): Human-readable 12-hour format (e.g., "6:00 AM", "2:00 PM")
   - `key` (string): Storage format HH:00 with leading zero (e.g., "06:00", "14:00")

**When slots are generated:**
- Once at application initialization
- Static list reused throughout the application lifecycle
- No dynamic generation required

**Complete slot table:**

| Hour | Time (12-hour) | Key (Storage) |
|------|----------------|---------------|
| 6    | 6:00 AM        | 06:00         |
| 7    | 7:00 AM        | 07:00         |
| 8    | 8:00 AM        | 08:00         |
| 9    | 9:00 AM        | 09:00         |
| 10   | 10:00 AM       | 10:00         |
| 11   | 11:00 AM       | 11:00         |
| 12   | 12:00 PM       | 12:00         |
| 13   | 1:00 PM        | 13:00         |
| 14   | 2:00 PM        | 14:00         |
| 15   | 3:00 PM        | 15:00         |
| 16   | 4:00 PM        | 16:00         |
| 17   | 5:00 PM        | 17:00         |
| 18   | 6:00 PM        | 18:00         |
| 19   | 7:00 PM        | 19:00         |
| 20   | 8:00 PM        | 20:00         |
| 21   | 9:00 PM        | 21:00         |

**Total slots:** 16 (hours 6 through 21 inclusive)

---

## Date Formatting

The system uses different date formats for different purposes:

### Storage Format (dateKey)

**Format:** `YYYY-MM-DD` (ISO 8601 date)

**Examples:**
- `2026-02-14`
- `2026-12-25`
- `2026-01-01`

**Where used:**
- API request parameters
- Storage keys in data structures
- Booking lookups
- Week navigation calculations

**How generated:**
- Extract date portion from ISO string
- JavaScript: `date.toISOString().split('T')[0]`

### Display Format (Long)

**Format:** "Weekday, Month Day, Year"

**Examples:**
- `Wednesday, February 14, 2026`
- `Friday, December 25, 2026`
- `Thursday, January 1, 2026`

**Where used:**
- Header showing current date in day view
- User-facing date display for clarity

### Display Format (Short)

**Format:** "Day, Mon DD"

**Examples:**
- `Wed, Feb 14`
- `Fri, Dec 25`
- `Thu, Jan 1`

**Where used:**
- Week view day headers (7 days shown simultaneously)
- Compact date display

### Date Format Usage Table

| Context | Format | Example | Why |
|---------|--------|---------|-----|
| API calls | YYYY-MM-DD | `2026-02-14` | Standard storage format, sortable |
| Storage keys | YYYY-MM-DD | `2026-02-14` | Booking data keyed by date |
| Header (day view) | Weekday, Month Day, Year | `Wednesday, February 14, 2026` | Clear, unambiguous for user |
| Week view headers | Day, Mon DD | `Wed, Feb 14` | Compact, fits 7 days |
| Booking lookups | YYYY-MM-DD | `2026-02-14` | Consistent with storage |

---

## Current Hour and isSlotPast Logic

**Critical rule:** A slot is considered "past" ONLY when the NEXT hour begins.

### The End-of-Hour Boundary Rule

**Implementation:**
1. Determine the END of the slot hour (start of next hour)
2. Set time to hour+1, minute 0, second 0, millisecond 0
3. Compare this boundary to current time
4. Slot is past only when current time >= boundary

**Why this approach:**
- Users should be able to book "right now" even if 45 minutes have passed
- A 9:00 AM slot represents the entire hour from 9:00:00 to 9:59:59
- Only when the clock hits 10:00:00 does the 9:00 AM slot become unbookable

### Examples at Different Times

| Current Time | Slot Hour | Slot End Boundary | Is Slot Past? | Reasoning |
|--------------|-----------|-------------------|---------------|-----------|
| 9:00 AM      | 9         | 10:00 AM          | No            | Boundary not reached yet |
| 9:01 AM      | 9         | 10:00 AM          | No            | Still 59 minutes left in hour |
| 9:30 AM      | 9         | 10:00 AM          | No            | Still 30 minutes left in hour |
| 9:45 AM      | 9         | 10:00 AM          | No            | Still 15 minutes left in hour |
| 9:59 AM      | 9         | 10:00 AM          | No            | Still 1 minute left in hour |
| 10:00 AM     | 9         | 10:00 AM          | Yes           | Next hour has begun, slot is past |
| 10:01 AM     | 9         | 10:00 AM          | Yes           | Well into next hour |

### Worked Example: 9:00 AM Slot

**Scenario:** Current time is 9:45 AM

1. Slot hour: 9
2. Calculate slot end: hour 9 + 1 = hour 10, set to 10:00:00.000
3. Current time: 9:45:00 (or any time within 9:00-9:59)
4. Compare: 9:45:00 < 10:00:00
5. Result: Slot is NOT past

**Scenario:** Current time is 10:00 AM

1. Slot hour: 9
2. Calculate slot end: hour 9 + 1 = hour 10, set to 10:00:00.000
3. Current time: 10:00:00
4. Compare: 10:00:00 >= 10:00:00
5. Result: Slot IS past

**Business reasoning:** "Book the current hour" means users can still book 9:00 AM even if they're at 9:45 AM. This is the expected behavior for a booking system focused on current-hour availability.

---

## Today's View vs Future Date View

The system applies different slot visibility rules depending on whether the user is viewing today or a future/past date.

### Today's View (Current Date)

**Rule:** Show only slots that are NOT past

**Filter logic:**
1. Generate all 16 slots
2. For each slot, check if `isSlotPast(today, slot.hour)` returns true
3. Remove slots where `isSlotPast` is true
4. Display remaining slots

**Result:** As hours pass, slots disappear from today's view

**Example at 10:30 AM:**
- Slots 6-9 (6:00 AM - 9:00 AM): Hidden (past)
- Slots 10-21 (10:00 AM - 9:00 PM): Visible (not past yet)
- Total visible: 12 slots

**Why:** Today's view is action-oriented. Users want to see "what can I book NOW", not what already passed.

### Future Date View (Any Date After Today)

**Rule:** Show ALL 16 slots

**No filtering applied**

**Result:** All 16 slots visible regardless of current time

**Why:** Future dates are informational. Users might be planning ahead, checking availability, or viewing existing bookings. All hours are relevant.

### Past Date View (Any Date Before Today)

**Rule:** Show ALL 16 slots

**No filtering applied**

**Result:** All 16 slots visible (all will have "past" status for interaction purposes)

**Why:** Past dates are for historical reference. Users might be reviewing what was booked. All hours should be visible even though none are bookable.

### Summary Table

| View Type | Slot Visibility | Slots Shown | Why |
|-----------|----------------|-------------|-----|
| Today | Only non-past slots | Varies (decreases as day progresses) | Action-oriented: "What can I book now?" |
| Future date | All slots | Always 16 | Informational: Planning and availability checking |
| Past date | All slots | Always 16 | Historical: Review what was booked |

---

## Hourly Refresh Mechanism

The system automatically re-evaluates which slots are "past" when each hour changes.

### How It Works

**Precision timing:**
1. Calculate milliseconds until the next hour begins
2. Formula: `(60 - currentMinutes) * 60000 - currentSeconds * 1000 - currentMilliseconds`
3. Schedule a timer to fire at exactly HH:00:00.000
4. When timer fires, trigger UI refresh
5. After refresh, schedule the next hourly refresh

**Example calculation at 9:37:24.583:**
1. Minutes until next hour: 60 - 37 = 23 minutes
2. Convert to milliseconds: 23 * 60 * 1000 = 1,380,000 ms
3. Subtract remaining seconds: 24 * 1000 = 24,000 ms
4. Subtract remaining milliseconds: 583 ms
5. Total: 1,380,000 - 24,000 - 583 = 1,355,417 ms until 10:00:00.000
6. Schedule timer for 1,355,417 ms from now

### Effect on Today's View

**At 9:59:59.999:**
- All slots from current hour onward are visible
- 9:00 AM slot is still visible and bookable

**At 10:00:00.000 (timer fires):**
- UI refreshes
- `isSlotPast` re-evaluates for all slots
- 9:00 AM slot now returns true for `isSlotPast`
- 9:00 AM slot removed from today's view
- Remaining slots (10:00 AM onward) stay visible

### Why This Is Necessary

**Without hourly refresh:**
- User opens page at 9:00 AM, sees slots 6-21 (assuming 6-8 are past)
- User leaves page open
- At 10:00 AM, slots 6-9 should be hidden, but UI hasn't updated
- User sees stale availability
- User might try to book 9:00 AM slot, which is now past
- Server would reject the booking

**With hourly refresh:**
- UI automatically updates at each hour boundary
- Past slots disappear without user needing to refresh page
- Availability always reflects current time
- Reduces booking conflicts and failed attempts

### Interaction with Other Features

**Book Now button:**
- Also recalculates visibility at hour boundaries
- If current hour becomes unavailable (booked/past), button disappears

**Week view:**
- Hourly refresh affects the current day's column
- Other days (future/past) show all 16 slots regardless

**Polling:**
- Hourly refresh and polling are independent mechanisms
- Polling (every 7 seconds) updates booking data
- Hourly refresh updates time-based visibility

---

## Multi-Hour Booking Slot Logic

When a booking occupies multiple consecutive hours, the system must determine which other slots are "blocked" by that booking.

### Blocking Rules

**For a booking at hour H with duration D:**
- Hour H: Status "booked" (the booking starts here)
- Hours H+1 through H+D-1: Status "blocked" (occupied by this booking)
- Hour H+D: Status "available" (first free hour after booking)

**Key insight:** The start hour and the hour immediately after the booking are NOT blocked.

### Worked Example: 9:00 AM Booking with Duration 3

**Booking details:**
- Start time: 9:00 AM (hour 9)
- Duration: 3 hours
- Occupies: 9:00 AM, 10:00 AM, 11:00 AM
- Ends at: 12:00 PM (hour 12)

**Slot status table:**

| Hour | Time    | Status    | Reasoning |
|------|---------|-----------|-----------|
| 8    | 8:00 AM | Available | Before booking |
| 9    | 9:00 AM | Booked    | Direct booking starts here |
| 10   | 10:00 AM| Blocked   | Hour 10 is > 9 and < 9+3 (12) |
| 11   | 11:00 AM| Blocked   | Hour 11 is > 9 and < 9+3 (12) |
| 12   | 12:00 PM| Available | Hour 12 = 9+3, first free hour |
| 13   | 1:00 PM | Available | After booking |

**Algorithm:**
```
For each hour H in range [6, 21]:
  For each booking at timeKey with duration D:
    bookingHour = extract hour from timeKey
    if H > bookingHour AND H < bookingHour + D:
      return { blocked: true, booking, bookingHour, startKey }
  return { blocked: false }
```

### Multi-Hour Booking Examples

| Booking Start | Duration | Booked Slot | Blocked Slots | Next Available |
|---------------|----------|-------------|---------------|----------------|
| 09:00 | 1 | 09:00 | None | 10:00 |
| 09:00 | 2 | 09:00 | 10:00 | 11:00 |
| 09:00 | 3 | 09:00 | 10:00, 11:00 | 12:00 |
| 14:00 | 1 | 14:00 | None | 15:00 |
| 14:00 | 2 | 14:00 | 15:00 | 16:00 |
| 14:00 | 4 | 14:00 | 15:00, 16:00, 17:00 | 18:00 |
| 20:00 | 2 | 20:00 | 21:00 | 22:00 (outside hours) |

### Edge Case: Booking at End of Operating Hours

**Scenario:** Booking at 21:00 (9:00 PM) with duration 1

- Hour 21: Booked
- Hour 22: Would be "next available" but 22 is outside operating hours
- No blocked slots (duration is 1)

**Scenario:** Booking at 20:00 (8:00 PM) with duration 2

- Hour 20: Booked
- Hour 21: Blocked
- Hour 22: Would be "next available" but 22 is outside operating hours

**Validation rule:** System must prevent bookings that would extend beyond END_HOUR (22). See BOOKING-FLOW.md for duration validation logic.

---

## Week Navigation

Week view displays 7 consecutive days starting from a Monday.

### Monday-Start Convention

**Rule:** Weeks always start on Monday and run through Sunday

**Why Monday:**
- Australian business convention
- ISO 8601 standard (Monday = day 1 of week)
- Consistent with most business calendar systems

### getStartOfWeek Logic

Given any date, find the Monday of the week containing that date.

**Day-of-week mapping:**
- Sunday = 0
- Monday = 1
- Tuesday = 2
- Wednesday = 3
- Thursday = 4
- Friday = 5
- Saturday = 6

**Algorithm:**
1. Get day-of-week for input date
2. If Sunday (day 0): Go back 6 days to reach Monday
3. If Monday (day 1): Stay at current date (already Monday)
4. If Tuesday-Saturday (days 2-6): Go back (day - 1) days to reach Monday

**Calculation table:**

| Current Day | Day Value | Days to Subtract | Target (Monday) |
|-------------|-----------|------------------|-----------------|
| Sunday      | 0         | 6                | Previous Monday |
| Monday      | 1         | 0                | Same Monday     |
| Tuesday     | 2         | 1                | This Monday     |
| Wednesday   | 3         | 2                | This Monday     |
| Thursday    | 4         | 3                | This Monday     |
| Friday      | 5         | 4                | This Monday     |
| Saturday    | 6         | 5                | This Monday     |

**Worked example: February 16, 2026 (Sunday)**

1. Current date: Sunday, February 16, 2026
2. Day value: 0 (Sunday)
3. Days to subtract: 6
4. Result: Monday, February 10, 2026

**Worked example: February 19, 2026 (Wednesday)**

1. Current date: Wednesday, February 19, 2026
2. Day value: 3 (Wednesday)
3. Days to subtract: 3 - 1 = 2
4. Result: Monday, February 17, 2026

### getWeekDays Logic

Generate an array of 7 consecutive dates starting from a given date.

**Algorithm:**
1. Start with input date (typically a Monday from getStartOfWeek)
2. For i = 0 to 6:
   - Add i days to start date
   - Append to array
3. Return array of 7 dates

**Example starting Monday, February 17, 2026:**

| Index | Days Added | Date | Weekday |
|-------|------------|------|---------|
| 0 | 0 | Feb 17 | Monday |
| 1 | 1 | Feb 18 | Tuesday |
| 2 | 2 | Feb 19 | Wednesday |
| 3 | 3 | Feb 20 | Thursday |
| 4 | 4 | Feb 21 | Friday |
| 5 | 5 | Feb 22 | Saturday |
| 6 | 6 | Feb 23 | Sunday |

### Week Navigation Controls

**In Week View:**
- Left arrow: Move back 7 days (to previous Monday)
- Right arrow: Move forward 7 days (to next Monday)

**In Day View:**
- Left arrow: Move back 1 day
- Right arrow: Move forward 1 day

**Navigation calculation:**

| View Mode | Direction | Days to Move | Result |
|-----------|-----------|--------------|--------|
| Week | Left | -7 | Previous week starting Monday |
| Week | Right | +7 | Next week starting Monday |
| Day | Left | -1 | Previous day |
| Day | Right | +1 | Next day |

### Week View Display Example

**User views week of February 17-23, 2026:**

1. System calls `getStartOfWeek(currentDate)`
2. Returns Monday, February 17, 2026
3. System calls `getWeekDays(Monday Feb 17)`
4. Returns array: [Feb 17, Feb 18, Feb 19, Feb 20, Feb 21, Feb 22, Feb 23]
5. UI displays 7 columns, one for each date
6. Each column shows 16 time slots (or fewer for today)

**User clicks Right arrow:**

1. Add 7 days to current start date
2. New start date: Monday, February 24, 2026
3. System calls `getWeekDays(Monday Feb 24)`
4. Returns array: [Feb 24, Feb 25, Feb 26, Feb 27, Feb 28, Mar 1, Mar 2]
5. UI updates to show new week

---

## Date Arithmetic

### addDays Function

**Purpose:** Add or subtract days from a date

**Algorithm:**
1. Create a new Date object (copy of input, NOT mutation)
2. Use setDate to add/subtract days
3. Return new Date object

**Examples:**

| Input Date | Days | Result |
|------------|------|--------|
| Feb 14, 2026 | +1 | Feb 15, 2026 |
| Feb 14, 2026 | +7 | Feb 21, 2026 |
| Feb 14, 2026 | -1 | Feb 13, 2026 |
| Feb 14, 2026 | -7 | Feb 7, 2026 |
| Jan 31, 2026 | +1 | Feb 1, 2026 |
| Mar 1, 2026 | -1 | Feb 28, 2026 |

**Month/year boundaries:** JavaScript Date automatically handles month and year rollovers. Adding 1 day to January 31 correctly produces February 1.

**Immutability:** Input date is NEVER modified. Always returns a new Date object.

---

## Timezone Display Offset

The system supports toggling between Queensland time (storage) and NSW time (display only).

### Storage vs Display Separation

**Storage (always Queensland):**
- All booking data stored with Queensland hours
- API requests use Queensland hours
- Database keys use Queensland hours
- Booking calculations use Queensland hours

**Display (Queensland or NSW):**
- User can toggle to see times in NSW timezone
- Only affects what the user SEES
- Does NOT affect storage, API calls, or booking logic

### NSW Offset Calculation

**During DST (October - April):**
- NSW: AEDT (Australian Eastern Daylight Time, UTC+11)
- QLD: AEST (Australian Eastern Standard Time, UTC+10)
- Offset: +1 hour

**Outside DST (April - October):**
- NSW: AEST (UTC+10)
- QLD: AEST (UTC+10)
- Offset: +0 hours

### Display Conversion Formula

**For time slot display:**
```
displayHour = storageHour + (isNSWInDST() ? 1 : 0)
```

**Examples during DST:**

| Storage Hour (QLD) | Offset | Display Hour (NSW) | Display Label |
|--------------------|--------|---------------------|---------------|
| 6 | +1 | 7 | 7:00 AM |
| 9 | +1 | 10 | 10:00 AM |
| 12 | +1 | 13 | 1:00 PM |
| 21 | +1 | 22 | 10:00 PM |

**Examples outside DST:**

| Storage Hour (QLD) | Offset | Display Hour (NSW) | Display Label |
|--------------------|--------|---------------------|---------------|
| 6 | +0 | 6 | 6:00 AM |
| 9 | +0 | 9 | 9:00 AM |
| 12 | +0 | 12 | 12:00 PM |
| 21 | +0 | 21 | 9:00 PM |

### 12-Hour Formatting

After applying offset, the display hour is formatted to 12-hour time:

- Hour 0 → 12 AM (midnight)
- Hours 1-11 → 1-11 AM
- Hour 12 → 12 PM (noon)
- Hours 13-23 → 1-11 PM

**Edge case: Hour 22 during DST**

When NSW toggle is ON and DST is active:
- Storage hour 21 + offset 1 = display hour 22
- Display hour 22 → 10:00 PM
- This is the latest displayable time (END_HOUR boundary)

**Why simple addition works:**
- QLD and NSW are adjacent timezones
- Offset is always 0 or +1 (never more complex)
- No need for full timezone conversion libraries
- Simple arithmetic is fast and clear

### Cross-Reference

For complete timezone toggle specification including DST detection logic, preference persistence, and edge cases, see **TIMEZONE-TOGGLE.md**.

---

## Implementation References

**Source files (React implementation):**
- `src/utils/time.js` - All time/date utility functions
- `src/hooks/useHourlyRefresh.js` - Hourly refresh mechanism
- `src/App.jsx` - Slot visibility logic and Book Now recalculation

**Architecture documentation:**
- DATA-STORAGE.md - Storage timezone rationale and data structures
- STATE-MANAGEMENT.md - How time-based state updates trigger UI refreshes

**Functional documentation:**
- BOOKING-FLOW.md - How time slots are used in booking creation and editing
- BOOK-NOW-FEATURE.md - How current hour detection drives Book Now visibility
- TIMEZONE-TOGGLE.md - Complete DST detection and display conversion logic
- EDGE-CASES.md - Time-related edge cases including hour boundaries and DST transitions

---

**Document version:** FUNC-05
**Technology level:** Technology-neutral behavior specification
**Audience:** Developers implementing booking system in any framework (Rails, React, Vue, etc.)
