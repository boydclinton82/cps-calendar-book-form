# Timezone Toggle Feature (FUNC-03)

**Document ID:** FUNC-03
**Phase:** 09 - Functional Documentation
**Created:** 2026-02-13
**Purpose:** Complete specification of the timezone toggle feature including DST detection, display conversion, and preference persistence

---

## Feature Overview

**Purpose:** Enable NSW-based users to view booking times in their local timezone

**Design principle:** Display-only toggle — all stored data remains in Queensland time

**Location:** Header bar, positioned after Week/Day toggle

**Keyboard shortcut:** `[T]` key (when not in popup/panel keyboard trap)

**Visual characteristics:**
- Toggle button shows current timezone mode: "QLD" or "NSW"
- NSW mode shows offset label: "+1h" during DST, "+0h" outside DST
- Hotkey indicator `[T]` displayed on button face
- Active state styling when NSW mode enabled

**Why this feature exists:**

The business operates in Queensland, which does NOT observe daylight saving time (DST). All bookings are stored in Queensland time (AEST, UTC+10 year-round).

However, NSW-based staff members observe DST (AEDT, UTC+11) from October to April. During these months, NSW clocks are 1 hour ahead of Queensland.

Without the toggle, NSW users must mentally convert times:
- "A booking at 9:00 AM QLD time is actually 10:00 AM my time"
- "I need to book 2:00 PM my time, which is 1:00 PM QLD time"

The timezone toggle eliminates this mental math by displaying all times in NSW time during DST months, while keeping all storage in QLD time.

---

## Timezone Context

### Queensland (Australia/Brisbane)

- **IANA timezone:** `Australia/Brisbane`
- **Standard abbreviation:** AEST (Australian Eastern Standard Time)
- **UTC offset:** UTC+10 (year-round, no changes)
- **Daylight saving:** NO — Queensland does not observe DST
- **Time zone stability:** Always UTC+10

### NSW (Australia/Sydney)

- **IANA timezone:** `Australia/Sydney`
- **Standard abbreviation:** AEST (Australian Eastern Standard Time) when DST not active
- **DST abbreviation:** AEDT (Australian Eastern Daylight Time) when DST active
- **UTC offset:** UTC+10 (standard), UTC+11 (during DST)
- **Daylight saving:** YES — NSW observes DST
- **DST period:** Approximately first Sunday in October to first Sunday in April
- **DST transition:** Clocks forward 1 hour at 2:00 AM on DST start, back 1 hour at 3:00 AM on DST end

### Time Difference

| Period | QLD Time Zone | NSW Time Zone | Offset | Example |
|--------|---------------|---------------|--------|---------|
| October - April (DST active) | AEST (UTC+10) | AEDT (UTC+11) | NSW +1h | QLD 9:00 AM = NSW 10:00 AM |
| April - October (DST not active) | AEST (UTC+10) | AEST (UTC+10) | NSW +0h | QLD 9:00 AM = NSW 9:00 AM |

**Key insight:** The offset is NOT constant. It changes twice per year when NSW transitions DST.

---

## DST Detection Logic

The system must dynamically detect whether NSW is currently observing DST to determine the correct offset.

### Detection Algorithm

**Method:** Use browser's Intl API with IANA timezone name

**Steps:**
1. Get current date/time
2. Format using `Intl.DateTimeFormat` with timezone `Australia/Sydney`
3. Extract timezone abbreviation from formatted parts
4. Check abbreviation:
   - If "AEDT" → DST is active
   - If "AEST" → DST is not active

**Why this approach:**
- DST rules change by legislation (e.g., 2006 NSW extended DST period)
- Hardcoded dates (e.g., "first Sunday in October") become wrong when rules change
- IANA timezone database is maintained by platform (browser/OS)
- Platform handles rule updates automatically
- System always uses current DST rules without code changes

### DST Detection Decision Table

| Timezone Abbreviation | DST Active? | NSW Offset vs QLD | Display Label |
|-----------------------|-------------|-------------------|---------------|
| AEDT | Yes | +1 hour | "NSW +1h" |
| AEST | No | +0 hours | "NSW +0h" |

**Edge case:** What if abbreviation is neither AEDT nor AEST?
- **Behavior:** Treat as AEST (no DST, +0h offset)
- **Reason:** Fail-safe fallback to no offset
- **Likelihood:** Extremely rare (would indicate platform error)

---

## Display Conversion Rules

When timezone toggle is set to NSW, all displayed times are converted by adding the current NSW offset.

### Conversion Table

| Toggle State | DST Active? | Offset Applied | Display Formula |
|--------------|-------------|----------------|-----------------|
| QLD | - | +0 hours | Display hour = Storage hour |
| NSW | No (AEST) | +0 hours | Display hour = Storage hour |
| NSW | Yes (AEDT) | +1 hour | Display hour = Storage hour + 1 |

### Example Conversions

**During DST (October - April):**

| Stored Hour (QLD) | Storage Key | QLD Display | NSW Display | Notes |
|-------------------|-------------|-------------|-------------|-------|
| 6 | 06:00 | 6:00 AM | 7:00 AM | First bookable hour |
| 12 | 12:00 | 12:00 PM | 1:00 PM | Midday |
| 18 | 18:00 | 6:00 PM | 7:00 PM | Evening |
| 21 | 21:00 | 9:00 PM | 10:00 PM | Last bookable hour |

**Outside DST (April - October):**

| Stored Hour (QLD) | Storage Key | QLD Display | NSW Display | Notes |
|-------------------|-------------|-------------|-------------|-------|
| 6 | 06:00 | 6:00 AM | 6:00 AM | Same as QLD |
| 12 | 12:00 | 12:00 PM | 12:00 PM | Same as QLD |
| 18 | 18:00 | 6:00 PM | 6:00 PM | Same as QLD |
| 21 | 21:00 | 9:00 PM | 9:00 PM | Same as QLD |

### Storage vs Display Separation

**Critical principle:** Storage is ALWAYS in Queensland time. The toggle only changes what the USER sees.

**What changes with toggle:**
- Time slot labels in day view
- Time slot labels in week view
- Time display in booking panel
- Header timezone indicator

**What does NOT change with toggle:**
- Storage keys (always HH:00 in QLD time)
- Date keys (always YYYY-MM-DD)
- API request payloads (always QLD time)
- Server-side data (always QLD time)
- Internal time calculations (always QLD time)

**Example:**
- NSW user books "10:00 AM" (displayed time during DST)
- System stores timeKey: "09:00" (QLD time)
- API receives: `{ dateKey: "2026-02-13", timeKey: "09:00", ... }`
- QLD users see: "9:00 AM"
- NSW users see: "10:00 AM" (when toggle is ON)

---

## Affected Display Elements

The timezone toggle affects the following visual elements:

### 1. Time Slot Labels (Day View)
- Every slot shows its hour label (e.g., "9:00 AM", "10:00 AM")
- QLD mode: Shows storage hour as-is
- NSW mode (DST): Shows storage hour + 1

### 2. Time Slot Labels (Week View)
- Every slot in all 7 days shows its hour label
- QLD mode: Shows storage hour as-is
- NSW mode (DST): Shows storage hour + 1

### 3. Booking Panel Slot Time
- When booking panel opens, selected slot time is displayed
- QLD mode: Shows slot.time as-is
- NSW mode (DST): Recalculates display time with +1 offset

### 4. Header Timezone Indicator
- Toggle button text changes to show current mode
- QLD mode: "QLD"
- NSW mode: "NSW +1h" (during DST) or "NSW +0h" (outside DST)

### Not Affected

The following elements do NOT change with timezone toggle:

- **Date labels:** Dates remain the same (no timezone offset for dates)
- **Booking metadata:** Created timestamps, user names, duration values
- **Navigation controls:** Week/Day toggle, arrow buttons
- **Storage keys:** All data persisted to storage remains in QLD time

---

## Toggle Interaction

### Activating the Toggle

**Method 1: Click button**
- User clicks timezone toggle button in header
- Toggle state flips immediately

**Method 2: Keyboard shortcut**
- User presses `[T]` key
- Toggle state flips immediately
- **Exception:** Key is blocked when popup is open (keyboard trap)

### Visual Feedback

**Immediate update:** No loading state, no animation, instant switch

**Elements that update:**
- All time slot labels re-render with new offset
- Booking panel time (if panel is open)
- Toggle button text changes ("QLD" ↔ "NSW +Xh")
- Toggle button active state styling

**Performance:** Display update is synchronous (all times recalculate in single render)

---

## Preference Persistence

The timezone preference is saved to browser local storage so users don't have to re-toggle every session.

### Storage Mechanism

**Storage API:** Browser localStorage
**Storage key:** `"cps-timezone-preference"`
**Stored value:** String "NSW" or "QLD"

### Read on Initialization

**When:** Application loads (before first render)

**Logic:**
1. Attempt to read from localStorage using key `"cps-timezone-preference"`
2. If value is "NSW" → Set toggle state to true (NSW mode)
3. If value is "QLD" → Set toggle state to false (QLD mode)
4. If key doesn't exist → Default to false (QLD mode)
5. If localStorage throws error → Default to false (QLD mode)

**Error handling:**
- Silent fallback to QLD mode on any error
- No error message shown to user
- Errors logged to console for debugging

**Why default to QLD:**
- Business operates in Queensland time
- QLD mode is the "source of truth" display
- Safer to default to storage time than apply incorrect offset

### Write on Toggle

**When:** Immediately after user toggles timezone

**Logic:**
1. User clicks toggle or presses `[T]` key
2. Toggle state flips (true ↔ false)
3. Attempt to write to localStorage:
   - If toggle is true → Write "NSW"
   - If toggle is false → Write "QLD"
4. If write fails → Log error, continue (state is still updated in memory)

**Error handling:**
- Silent failure on write error
- User sees toggle state change in UI
- Preference won't persist if storage unavailable
- No error message shown to user

**When localStorage might fail:**
- Private browsing mode (some browsers block localStorage)
- Storage quota exceeded (rare for simple string value)
- Browser security settings
- Incognito/private window

---

## Edge Case Scenarios (Given-When-Then)

### Scenario 1: Toggle during DST (times shift +1h)

**Given** current date is 2026-02-13 (within DST period)
**And** NSW is in AEDT (DST active)
**And** timezone toggle is set to QLD
**And** user is viewing day view with slots from 6:00 AM to 9:00 PM
**When** user clicks timezone toggle (or presses `[T]`)
**Then** toggle state changes to NSW
**And** DST detection runs → detects AEDT → offset is +1h
**And** all slot labels update:
- 6:00 AM → 7:00 AM
- 9:00 AM → 10:00 AM
- 12:00 PM → 1:00 PM
- 9:00 PM → 10:00 PM
**And** toggle button text changes to "NSW +1h"
**And** preference is saved to localStorage as "NSW"

---

### Scenario 2: Toggle outside DST (no visible change in times)

**Given** current date is 2026-06-15 (outside DST period)
**And** NSW is in AEST (DST not active)
**And** timezone toggle is set to QLD
**And** user is viewing day view with slot at 9:00 AM
**When** user clicks timezone toggle
**Then** toggle state changes to NSW
**And** DST detection runs → detects AEST → offset is +0h
**And** slot label remains "9:00 AM" (no change, same as QLD)
**And** toggle button text changes to "NSW +0h"
**And** preference is saved to localStorage as "NSW"
**Because** no DST means no offset, so QLD and NSW times are identical

---

### Scenario 3: Toggle while viewing week view (all 7 days update)

**Given** current date is 2026-02-13 (DST active)
**And** user is in week view showing 7 days
**And** each day shows slots from 6:00 AM to 9:00 PM
**And** timezone toggle is set to QLD
**When** user clicks timezone toggle
**Then** toggle state changes to NSW (+1h offset)
**And** all slot labels in all 7 days update simultaneously:
- Every 6:00 AM → 7:00 AM
- Every 9:00 AM → 10:00 AM
- Every 12:00 PM → 1:00 PM
- Every 9:00 PM → 10:00 PM
**And** toggle button text changes to "NSW +1h"
**Because** timezone toggle affects all displayed times, not just current day

---

### Scenario 4: Preference persists after browser refresh

**Given** user has toggled to NSW mode
**And** preference "NSW" is saved to localStorage
**When** user refreshes the page (F5 or Cmd+R)
**Then** application loads
**And** initialization reads localStorage
**And** finds value "NSW"
**And** toggle state initializes to true (NSW mode)
**And** DST detection runs → determines current offset
**And** all times display with NSW offset from first render
**Because** stored preference is loaded before initial render

---

### Scenario 5: localStorage disabled (graceful fallback)

**Given** user is in private browsing mode
**And** localStorage is blocked by browser
**When** application loads
**Then** attempt to read localStorage throws error
**And** error is caught and logged
**And** toggle state defaults to false (QLD mode)
**And** application continues normally with QLD display

**Given** toggle state is QLD (false)
**When** user clicks timezone toggle
**Then** toggle state changes to NSW (true) in memory
**And** all times display with NSW offset
**And** attempt to write to localStorage throws error
**And** error is caught and logged
**And** UI shows NSW mode successfully
**Because** in-memory state works even when persistence fails

**When** user refreshes page
**Then** toggle resets to QLD mode (default)
**Because** preference could not be saved

---

### Scenario 6: DST transition day (edge case)

**Given** DST ends at 3:00 AM on 2026-04-05
**And** at 2:59 AM, NSW is in AEDT (+1h offset)
**And** user has NSW toggle enabled
**And** user is viewing booking form
**When** clock reaches 3:00 AM (clocks fall back to 2:00 AM)
**And** NSW transitions from AEDT to AEST
**Then** DST detection runs on next render
**And** detects AEST → offset changes to +0h
**And** toggle button label changes from "NSW +1h" to "NSW +0h"
**And** all displayed times shift back 1 hour:
- 10:00 AM → 9:00 AM
- 1:00 PM → 12:00 PM
**Because** system re-detects DST status dynamically

**Note:** User would need to be actively using app at 3 AM for this to occur. More likely, they load app AFTER transition and see correct offset immediately.

**Given** DST starts at 2:00 AM on 2026-10-04
**And** at 1:59 AM, NSW is in AEST (+0h offset)
**And** user has NSW toggle enabled
**When** clock reaches 2:00 AM (clocks spring forward to 3:00 AM)
**Then** DST detection runs on next render
**And** detects AEDT → offset changes to +1h
**And** toggle button label changes from "NSW +0h" to "NSW +1h"
**And** all displayed times shift forward 1 hour:
- 9:00 AM → 10:00 AM
- 12:00 PM → 1:00 PM
**Because** system re-detects DST status dynamically

---

### Scenario 7: Book Now button with NSW toggle active

**Given** timezone toggle is set to NSW
**And** DST is active (+1h offset)
**And** actual QLD time is 9:37 AM
**And** displayed time on slots is "10:37 AM NSW time"
**And** Book Now button is visible
**When** user clicks Book Now
**Then** system uses internal QLD time (9:37 AM)
**And** constructs slot object for hour 9 (not hour 10)
**And** booking panel opens for "9:00 AM QLD time"
**And** panel displays "10:00 AM" because NSW toggle is active
**And** if booking is created, storage key is "09:00"
**Because** all internal logic uses QLD time; toggle only affects display

**This is correct behavior:** Book Now books "right now" in QLD time (the business time), not "right now" in NSW time.

---

### Scenario 8: Booking created with NSW toggle (storage verification)

**Given** timezone toggle is set to NSW (+1h during DST)
**And** user views slot displaying "10:00 AM" (NSW time)
**And** underlying storage hour is 9
**When** user books that slot
**Then** booking panel shows "10:00 AM" (NSW display)
**And** user selects person and duration
**And** booking is created
**And** API payload contains:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "09:00",
  "hour": 9
}
```
**And** storage writes to key with timeKey "09:00"
**And** other QLD users see booking at "9:00 AM"
**And** other NSW users with toggle enabled see booking at "10:00 AM"
**Because** storage always uses QLD time; toggle only affects display

---

## Implementation Constraints

### Must-Use IANA Timezone Names

**Required:** All DST detection must use IANA timezone names:
- `Australia/Brisbane` for Queensland
- `Australia/Sydney` for NSW

**Forbidden:** Hardcoded DST transition dates
- Do NOT use: "if month >= 10 and month <= 4 then offset = +1"
- Do NOT use: "first Sunday in October" calculations
- Do NOT use: Static date ranges

**Reason:** DST rules change by legislation. IANA database is maintained externally and updated automatically by the platform.

### Display Conversion is Simple Addition

**Allowed:** `displayHour = storageHour + offset`

**Forbidden:** Full timezone conversion libraries
- Do NOT use: Convert storage to UTC, then to NSW timezone
- Do NOT use: Complex timezone conversion APIs

**Reason:** We know the offset is always 0 or 1. Simple addition is sufficient and faster.

### All API Calls Use QLD Time

**Constraint:** API payloads must NEVER contain NSW-adjusted times

**Verification:**
- All timeKey values must be in HH:00 format representing QLD hours
- All hour values must be QLD hours (6-21)
- API does not receive or process timezone preference

**Reason:** Server stores everything in QLD time. Sending NSW-adjusted times would create incorrect bookings.

### Timezone Toggle Has No Server-Side Component

**Constraint:** Toggle state is client-only

**Verification:**
- No API endpoint for getting/setting timezone preference
- No server-side storage of user timezone preference
- Preference is stored in browser localStorage only

**Reason:** Single-instance app, browser-based preference is sufficient

---

## Cross-References

### Related Documentation

**DATA-STORAGE.md (ARCH-01)** — Why all storage uses Queensland time

**Referenced by this document:**
- Storage keys are always QLD time
- Rationale for QLD-only storage
- No timezone metadata in stored bookings

**time.js (extracted code)** — Implementation reference for DST detection

**Contains:**
- `isNSWInDST()` function using Intl API
- `getNSWOffsetLabel()` function returning "+1h" or "+0h"
- `formatHour()` function with NSW offset parameter

**COMPONENT-STATES.md (Phase 7)** — Toggle button visual states

**Contains:**
- Default state (QLD mode)
- Active state (NSW mode)
- Hover/focus states
- Disabled state (not used for timezone toggle)

---

## Accessibility Considerations

**Keyboard shortcut:** `[T]` key must be globally accessible
- Exception: Blocked when popup is open (keyboard trap)

**ARIA attributes:**
- `aria-pressed="true"` when NSW mode active
- `aria-pressed="false"` when QLD mode active
- `aria-label="Toggle timezone display"` for screen readers

**Focus management:**
- Toggle button can receive keyboard focus
- Tab order: After Week/Day toggle, before navigation arrows

**Screen reader announcement:**
- State change should announce: "Timezone set to NSW, plus 1 hour" or "Timezone set to Queensland"

**Visual indicators:**
- Toggle button must clearly show current mode (text change)
- Offset label must be visible ("+1h" or "+0h")

---

## Performance Considerations

### DST Detection Frequency

**When DST detection runs:**
- On application initialization (once)
- On every toggle interaction
- On every render when NSW mode is active (to calculate display hours)

**Optimization:** Result could be memoized for the current day
- Detection result doesn't change multiple times per day
- Cache invalidation: Check at midnight or on date change

### Display Conversion Performance

**Conversion is O(1) simple addition:**
```
displayHour = storageHour + (isDST ? 1 : 0)
```

**Not a performance concern:**
- Conversion happens during render
- Maximum ~16 slots × 7 days = 112 conversions in week view
- Simple arithmetic operation

---

## Summary

The timezone toggle provides NSW-based users with a display-only conversion from Queensland time (AEST, no DST) to NSW time (AEST/AEDT, with DST).

**Key design decisions:**

1. **Storage always QLD:** All data persisted in Queensland time (AEST, UTC+10)
2. **Dynamic DST detection:** Use IANA timezone names via Intl API to detect current NSW DST status
3. **Simple offset addition:** Display conversion is `storageHour + (isDST ? 1 : 0)`
4. **Browser-only persistence:** Preference stored in localStorage, no server involvement
5. **Graceful degradation:** Silent fallback to QLD mode if localStorage unavailable

**Offset rules:**
- October to April (DST active): NSW displays +1 hour
- April to October (DST not active): NSW displays +0 hours (same as QLD)

**Visual feedback:**
- Toggle button shows "QLD" or "NSW +Xh"
- All time slot labels update immediately
- No loading state or animation
- Preference persists across sessions

**Critical constraint:** API calls, storage keys, and all server interactions use QLD time only. The toggle affects DISPLAY exclusively.
