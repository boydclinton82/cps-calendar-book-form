# ARCH-04: Application State Management

**Status:** Implemented
**Category:** State & Data Flow
**Related:** ARCH-03 (Polling & Sync), API-01 (Booking API)

## Overview

This document describes **what state exists** in the booking application, **how state is initialized**, **how state changes** (triggers and patterns), and **how state flows through the application**.

State management is intentionally simple:
- **Server state** (bookings, config) is fetched from API and kept synchronized via polling
- **Client state** (UI selections, navigation) is maintained in browser memory
- **Optimistic updates** make the UI feel instant while API calls happen in background
- **Rollback on error** keeps state consistent when operations fail

---

## State Categories

### 1. Server State (Persisted, Shared Across Users)

**Bookings**

Structure:
```javascript
{
  "[dateKey]": {
    "[timeKey]": {
      user: "String",      // User name (e.g., "Jack")
      duration: Number     // Hours occupied (1-4)
    }
  }
}
```

Example:
```javascript
{
  "2026-02-14": {
    "07:00": { user: "Jack", duration: 2 },
    "10:00": { user: "Bonnie", duration: 1 }
  },
  "2026-02-15": {
    "14:00": { user: "Giuliano", duration: 3 }
  }
}
```

- **Stored:** Cloudflare KV storage (server-side)
- **Fetched:** GET /api/bookings on initial load
- **Synchronized:** Every 7 seconds via polling (see ARCH-03)
- **Modified:** Via POST, PUT, DELETE API calls (optimistic updates + server confirmation)

**Configuration**

Structure:
```javascript
{
  slug: "String",          // Instance identifier (e.g., "cps-software")
  title: "String",         // Display title (e.g., "CPS Software Booking")
  users: [                 // Available users for booking
    {
      name: "String",      // Display name (e.g., "Jack")
      key: "String"        // Keyboard shortcut (e.g., "j")
    }
  ],
  createdAt: "ISO8601"     // Creation timestamp
}
```

Example:
```javascript
{
  slug: "cps-software",
  title: "CPS Software Booking",
  users: [
    { name: "Jack", key: "j" },
    { name: "Bonnie", key: "b" },
    { name: "Giuliano", key: "g" }
  ],
  createdAt: "2026-01-15T08:00:00Z"
}
```

- **Stored:** Cloudflare KV storage (server-side)
- **Fetched:** GET /api/config on initial load (once per session)
- **Not Synchronized:** Does not change during runtime (polling only applies to bookings)
- **Fallback:** If API disabled or fetch fails, hardcoded fallback config is used

### 2. Client State (Per-Browser, Not Shared)

**Navigation State**

- **Current Date:** Date object representing which day is being viewed
  - Default: Today's date
  - Modified: Left/right arrow navigation, "Book Now" button, week view day selection

- **Week View Toggle:** Boolean (true = week view, false = day view)
  - Default: false (day view)
  - Modified: "W" key, week toggle button

**Booking Flow State**

- **Selected Slot:** Object or null
  - Structure: `{ hour: Number, time: String, key: String, dateKey: String }`
  - Example: `{ hour: 7, time: "7:00 AM", key: "07:00", dateKey: "2026-02-14" }`
  - Set when: User clicks available slot or uses keyboard navigation + Enter
  - Cleared when: Booking created, panel cancelled, or week view toggled

- **Selected User:** String or null
  - Value: User name (e.g., "Jack")
  - Set when: User clicks user button or presses user hotkey in panel mode
  - Cleared when: Booking created, panel cancelled, or slot selection changes

**Edit Flow State**

- **Selected Booking:** Object or null
  - Structure: `{ dateKey: String, timeKey: String, hour: Number, user: String, duration: Number }`
  - Set when: User clicks existing booking block
  - Cleared when: Popup closed, booking deleted

**Keyboard Navigation State**

- **Focused Slot Index:** Integer or null
  - Value: Index in visible slots array (0-15 for full day)
  - Set when: Up/down arrow keys pressed in navigation mode
  - Cleared when: Enter pressed (selects slot), date changes, or week view toggled

**Timezone Display State**

- **Use NSW Time:** Boolean (true = NSW display, false = QLD display)
  - Default: false (QLD) unless localStorage has "NSW" preference
  - Modified: "Z" key, timezone toggle button
  - Persisted: Saved to localStorage on every toggle

### 3. Derived State (Computed from Other State)

**Slot Status**

For each slot in the time grid:
- **Available:** No booking at this slot, not blocked by multi-hour booking
- **Booked:** Has a booking starting at this exact hour
- **Blocked:** Occupied by a multi-hour booking that started earlier

Calculation: See "Slot Status Calculation" section below

**Current Hour Available**

Boolean indicating if "Book Now" button should be enabled:
- Current hour is within booking range (6 AM - 10 PM)
- Current hour has not passed
- Current hour slot is available (not booked, not blocked)

**Is Slot Past**

For each slot: Boolean indicating if the slot hour has ended
- Used for visual dimming of past slots
- Checked every hour via hourly refresh timer

**Display Times**

Time labels shown in UI:
- Base time: Slot hour (e.g., 7:00 AM)
- If NSW toggle enabled AND NSW in DST: Add 1 hour offset
- Example: 7:00 AM QLD → 8:00 AM NSW (during DST season)

### 4. Persisted Client State

**Timezone Preference**

- **Storage:** localStorage key `"cps-timezone-preference"`
- **Values:** `"NSW"` or `"QLD"`
- **Default:** `"QLD"` if key doesn't exist or read fails
- **Read:** On application load (synchronous)
- **Write:** Every time timezone toggle changes
- **Error Handling:** Read/write failures are logged but don't break app (graceful fallback to QLD)

---

## State Initialization Order

State initialization follows a **strict sequence** to ensure dependencies are satisfied.

### Step 1: Timezone Preference (Synchronous)

**When:** Application first renders
**Source:** localStorage read (`"cps-timezone-preference"`)
**Action:** Set `useNSWTime` state (boolean)
**Fallback:** Default to `false` (QLD) on error
**Why First:** Synchronous operation, no dependencies

### Step 2: Configuration Load (Async)

**When:** Application mount (parallel with Step 1)
**Source:** GET /api/config
**Action:**
- If API enabled and fetch succeeds: Use API response
- If API disabled or fetch fails: Use fallback config (hardcoded)
**Loading State:** `loading = true` during fetch
**Why Second:** Required before bookings can be validated

**Dependency:**
- Bookings validation needs `config.users` array to verify user names
- Keyboard shortcuts need `config.users[].key` for hotkey mappings

### Step 3: Bookings Load (Async)

**When:** After application mount
**Source:** GET /api/bookings
**Action:**
- If API enabled and fetch succeeds: Use API response
- If API disabled: Use localStorage fallback
- If API fetch fails: Use localStorage fallback
**Loading State:** `loading = true` during fetch
**Why Third:** Depends on config for user validation

**Dependency:**
- Config must be loaded first (users list needed for validation)
- Initial bookings state needed before polling can start

### Step 4: Polling Starts (After Bookings Load)

**When:** After initial bookings fetch completes successfully
**Source:** Polling timer (7-second interval)
**Action:** Periodic GET /api/bookings, replace local state on success
**Why Fourth:** Needs initial bookings state to replace

**Dependency:**
- Initial load must complete (can't replace state that doesn't exist)
- Config must be loaded (polling enabled check uses API mode flag)

### Step 5: Hourly Refresh Starts (Independent)

**When:** Application mount
**Source:** Browser timer (fires at hour boundaries)
**Action:** Trigger UI re-evaluation of past slots
**Why Independent:** Only depends on current time, not application state

**No Dependencies:**
- Works immediately on app load
- Doesn't need bookings or config

### Step 6: User Interaction Begins

**When:** Loading completes (`loading = false`)
**Action:** Keyboard shortcuts enabled, UI becomes interactive
**Why Last:** Config needed for user hotkeys, bookings needed for slot status

**Dependency Chain Summary:**

```
App Load
   |
   ├─→ Timezone Preference (sync) → useNSWTime state
   |
   ├─→ Config Load (async) → config state
   |      |
   |      └─→ Bookings Load (async) → bookings state
   |             |
   |             └─→ Polling Starts → periodic bookings updates
   |
   └─→ Hourly Refresh (async, independent) → UI re-evaluation

All complete → User Interaction Enabled
```

**Why Order Matters:**

1. **Config before Bookings:** Booking validation requires users list from config
2. **Bookings before Polling:** Polling replaces state -- need initial state first
3. **All before Interaction:** Keyboard shortcuts need config.users, slot selection needs bookings

**Failure Handling:**

- Config fails → Use fallback config → Bookings still load
- Bookings fail → Use empty state → App still works (can create bookings)
- Polling fails → Continue with last known state → App still works

---

## Optimistic Update Pattern

All three booking operations (create, update, delete) use **optimistic updates** to make the UI feel instant.

### Pattern Overview

1. **Immediate Local Update:** Change local state instantly (before API call)
2. **UI Updates Immediately:** User sees result right away
3. **Background API Call:** Send request to server
4. **On Success:** Do nothing (optimistic update was correct)
5. **On Error:** Rollback via `triggerSync()` (fetch true server state)

### Create Booking

**Trigger:** User selects slot → selects user → selects duration

**Step-by-Step:**

1. **Optimistic Update:**
   ```javascript
   // IMMEDIATELY add to local state
   bookings[dateKey][timeKey] = { user: selectedUser, duration: selectedDuration }
   ```

2. **UI Update:**
   - Booking block appears instantly in calendar
   - User's selected slot shows as booked
   - Panel closes (selection cleared)

3. **Background API Call:**
   ```
   POST /api/bookings
   {
     dateKey: "2026-02-14",
     timeKey: "07:00",
     user: "Jack",
     duration: 2
   }
   ```

4. **Success Response (201 Created):**
   - No action needed
   - Optimistic update was correct
   - Server now has the booking
   - Other users will see it within 7 seconds (next poll)

5. **Error Response (409 Conflict or other):**
   - Set error state (show error message to user)
   - **Call triggerSync()** immediately
   - triggerSync fetches true server state
   - Local state replaced with server truth
   - User's incorrect booking disappears
   - User sees actual current state (may show another user's booking)

**Why This Works:**

- Most creates succeed (conflicts are rare)
- When they fail, user sees error + corrected state immediately
- No "pending" or "syncing" state needed

### Update Booking

**Trigger:** User clicks booking → changes user or duration in popup

**Step-by-Step:**

1. **Optimistic Update:**
   ```javascript
   // IMMEDIATELY update local state
   bookings[dateKey][timeKey] = {
     ...bookings[dateKey][timeKey],
     ...updates  // { user: "Bonnie" } or { duration: 3 }
   }
   ```

2. **UI Update:**
   - Booking block changes color instantly (if user changed)
   - Booking block extends/shrinks instantly (if duration changed)
   - Popup shows new values

3. **Background API Call:**
   ```
   PUT /api/bookings/update
   {
     dateKey: "2026-02-14",
     timeKey: "07:00",
     updates: { duration: 3 }
   }
   ```

4. **Success Response (200 OK):**
   - No action needed
   - Optimistic update was correct

5. **Error Response (409 Conflict, 404 Not Found, etc.):**
   - Set error state (show error message)
   - **Call triggerSync()** immediately
   - Local state replaced with server truth
   - User sees booking revert to previous values (or disappear if deleted by another user)

**Duration Conflict Example:**

User tries to extend booking from 1 hour to 3 hours, but next slot is already booked:
- Optimistic update: Block extends to 3 hours locally
- API call: PUT with duration: 3
- Server response: 409 "Cannot extend: slot 08:00 is already booked"
- triggerSync: Fetch server state
- UI reverts: Block shrinks back to 1 hour
- User sees error: "Cannot extend: slot 08:00 is already booked"

### Delete Booking

**Trigger:** User clicks booking → clicks delete button in popup

**Step-by-Step:**

1. **Optimistic Update:**
   ```javascript
   // IMMEDIATELY remove from local state
   delete bookings[dateKey][timeKey]

   // Clean up empty date objects
   if (Object.keys(bookings[dateKey]).length === 0) {
     delete bookings[dateKey]
   }
   ```

2. **UI Update:**
   - Booking block disappears instantly
   - Popup closes
   - Calendar shows slot as available

3. **Background API Call:**
   ```
   DELETE /api/bookings/update
   {
     dateKey: "2026-02-14",
     timeKey: "07:00"
   }
   ```

4. **Success Response (200 OK):**
   - No action needed
   - Optimistic update was correct
   - Server no longer has the booking

5. **Error Response (404 Not Found):**
   - Set error state (show error message)
   - **Call triggerSync()** immediately
   - Local state replaced with server truth
   - If another user modified the booking: booking reappears with new values
   - If booking truly gone: stays deleted (optimistic update was accidentally correct)

**Why 404 Triggers Sync:**

Even though deleting a non-existent booking achieves the desired end state (booking is gone), we still sync on 404 because:
- User needs to see current truth (maybe another user modified it before deletion)
- Consistent error handling (all errors trigger sync)

### Key Principle

**Optimistic updates make the app feel instant. Errors self-correct via sync.**

**No Complex Conflict Resolution:**
- No CRDT (Conflict-free Replicated Data Types)
- No Operational Transform
- No version vectors or vector clocks
- Just: "Server is truth, fetch it on error"

This works because:
- Write frequency is low (users don't create hundreds of bookings per second)
- Conflicts are rare (most timeslots have room for multiple bookings)
- User tolerance is high (seeing an error + corrected state is acceptable UX)

---

## State Triggers

This table documents **every trigger** that causes application state to change.

| Trigger | State Changed | Change Type | Mechanism |
|---------|---------------|-------------|-----------|
| **App load** | config, bookings | Set | API fetch (GET /api/config, GET /api/bookings) |
| **Slot click** | selectedSlot, selectedUser | Set selectedSlot, Clear selectedUser | User interaction (mouse click) |
| **User button click** | selectedUser | Set | User interaction (mouse click or keyboard) |
| **Duration button click** | bookings (optimistic), selectedSlot, selectedUser | Update bookings, Clear selections | Optimistic update + API POST |
| **Booking click** | selectedBooking | Set | User interaction (mouse click on existing booking) |
| **Popup user change** | bookings (optimistic), selectedBooking.user | Update | Optimistic update + API PUT |
| **Popup duration change** | bookings (optimistic), selectedBooking.duration | Update | Optimistic update + API PUT |
| **Popup delete** | bookings (optimistic), selectedBooking | Delete booking, Clear selectedBooking | Optimistic update + API DELETE |
| **Popup close (X button)** | selectedBooking | Clear | User interaction |
| **Panel cancel** | selectedSlot, selectedUser | Clear both | User interaction (Esc key or cancel button) |
| **Poll tick (every 7s)** | bookings (full replace) | Replace entire object | Background timer (ARCH-03) |
| **API error** | error, bookings (via triggerSync) | Set error, Replace bookings | Error handler → triggerSync → GET /api/bookings |
| **Timezone toggle** | useNSWTime, localStorage | Toggle boolean, Persist | User interaction (Z key or toggle button) |
| **Arrow navigation (L/R)** | currentDate | Add/subtract days | User interaction (arrow keys or nav buttons) |
| **Arrow navigation (U/D)** | focusedSlotIndex | Move through available slots | User interaction (up/down arrow keys) |
| **Enter key (navigation mode)** | selectedSlot, focusedSlotIndex | Set selectedSlot from focused, Clear focus | User interaction |
| **Week toggle** | isWeekView, selectedSlot, selectedUser | Toggle view, Clear selections | User interaction (W key or week button) |
| **Week day select** | currentDate, isWeekView | Set date, Exit week view | User interaction (click day in week view) |
| **Hour boundary** | (No state change, forces UI re-eval) | Re-render | Hourly timer calculates past slots freshly |
| **Book Now click** | selectedSlot, currentDate | Set to current hour, Set to today | User interaction (Book Now button or N key) |

### Trigger Categories

**Direct User Actions:**
- Clicks (slot, user button, duration button, booking, close button)
- Keyboard shortcuts (user hotkeys, duration hotkeys, navigation, toggle keys)

**Background Processes:**
- Polling (every 7 seconds)
- Hourly refresh (at hour boundaries)
- Error recovery (triggerSync on API failure)

**System Events:**
- Application load (initial fetch)
- Application unmount (cleanup, not listed above)

---

## Slot Status Calculation

Slot status is **derived state** computed from bookings for a specific date.

### Status Types

1. **Available:** Slot can be booked
2. **Booked:** Slot has a booking starting at this exact hour
3. **Blocked:** Slot is occupied by a multi-hour booking that started earlier

### Calculation Algorithm

**Input:**
- `dateKey`: String (e.g., "2026-02-14")
- `timeKey`: String (e.g., "07:00")
- `hour`: Number (e.g., 7)

**Steps:**

1. **Get all bookings for date:**
   ```javascript
   const dayBookings = bookings[dateKey] || {}
   ```

2. **Check for direct booking:**
   ```javascript
   if (dayBookings[timeKey]) {
     return { status: 'booked', booking: dayBookings[timeKey] }
   }
   ```

3. **Check if blocked by multi-hour booking:**

   For each booking in `dayBookings`:
   ```javascript
   for (const [otherTimeKey, otherBooking] of Object.entries(dayBookings)) {
     const bookingHour = parseInt(otherTimeKey.split(':')[0], 10)
     const duration = otherBooking.duration || 1

     // Check if current hour falls INSIDE booking's occupied range
     if (hour > bookingHour && hour < bookingHour + duration) {
       return {
         status: 'blocked',
         booking: otherBooking,
         blockingStartKey: otherTimeKey
       }
     }
   }
   ```

4. **If neither booked nor blocked:**
   ```javascript
   return { status: 'available' }
   ```

### Multi-Hour Blocking Example

**Scenario:**
- Booking exists at 07:00 with duration: 3
- Occupied hours: 7, 8, 9

**Slot Status:**

| Hour | Time Key | Status | Reason |
|------|----------|--------|--------|
| 6 | 06:00 | Available | Before booking |
| 7 | 07:00 | **Booked** | Direct booking starts here |
| 8 | 08:00 | **Blocked** | hour=8 > bookingHour=7 AND hour=8 < 7+3=10 |
| 9 | 09:00 | **Blocked** | hour=9 > bookingHour=7 AND hour=9 < 7+3=10 |
| 10 | 10:00 | Available | hour=10 NOT < 10 (booking ends before this hour) |

**Visual Representation:**

```
06:00  [ Available ]
07:00  [ Booked - Jack (3h) ] ← Booking starts here
08:00  [ Blocked by 07:00   ] ← Occupied by 3-hour booking
09:00  [ Blocked by 07:00   ] ← Occupied by 3-hour booking
10:00  [ Available ]         ← Booking ended, slot free
```

### canBook() Function

Checks if ALL slots in a proposed booking duration are available.

**Input:**
- `dateKey`: Date to book
- `timeKey`: Start time
- `hour`: Start hour (number)
- `duration`: Number of hours

**Algorithm:**

```javascript
for (let i = 0; i < duration; i++) {
  const checkHour = hour + i
  const checkKey = formatTimeKey(checkHour)  // "07:00", "08:00", etc.

  // Check if slot is directly booked
  if (dayBookings[checkKey]) {
    return false  // CONFLICT: Slot already has a booking
  }

  // Check if slot is blocked by another booking
  const blockInfo = isSlotBlocked(dayBookings, checkHour)
  if (blockInfo.blocked) {
    return false  // CONFLICT: Slot occupied by multi-hour booking
  }
}

return true  // All slots in range are available
```

**Example:**

User wants to book 3 hours starting at 07:00:
- Check 07:00 → available
- Check 08:00 → available
- Check 09:00 → **BLOCKED** by another booking
- **Result:** `canBook() = false` (cannot book 3 hours)

### canChangeDuration() Function

Similar to `canBook()` but **excludes current booking's own slots** from conflict check.

**Use Case:** User extends/shrinks existing booking's duration

**Input:**
- `dateKey`: Booking's date
- `timeKey`: Booking's start time
- `hour`: Booking's start hour
- `currentDuration`: Existing duration
- `newDuration`: Proposed new duration

**Algorithm:**

```javascript
for (let i = 0; i < newDuration; i++) {
  const checkHour = hour + i
  const checkKey = formatTimeKey(checkHour)

  // Skip slots that are part of CURRENT booking
  // (These are already occupied by this booking, so they're "available" for extension)
  if (i < currentDuration) {
    continue
  }

  // Check NEW slots (beyond current duration)
  if (dayBookings[checkKey]) {
    return false  // CONFLICT: New slot already booked
  }

  const blockInfo = isSlotBlocked(dayBookings, checkHour)
  if (blockInfo.blocked && blockInfo.startKey !== timeKey) {
    // Blocked by ANOTHER booking (not itself)
    return false
  }
}

return true
```

**Example:**

Booking at 07:00 with duration=2 (occupies 7, 8). User changes to duration=4:
- Slot 7 (i=0): Skip (i < currentDuration=2)
- Slot 8 (i=1): Skip (i < currentDuration=2)
- Slot 9 (i=2): Check → available → OK
- Slot 10 (i=3): Check → **BOOKED** by another user
- **Result:** `canChangeDuration() = false` (cannot extend to 4 hours)

---

## Hourly Refresh Mechanism

### Purpose

Force UI to re-evaluate which slots are "past" as hours pass, without requiring polling or manual user action.

### How It Works

**Timer Calculation:**

1. Get current time
2. Calculate milliseconds until next hour boundary:
   ```javascript
   const now = new Date()
   const msUntilNextHour =
     (60 - now.getMinutes()) * 60 * 1000 -
     now.getSeconds() * 1000 -
     now.getMilliseconds()
   ```

3. Set timeout for that exact duration
4. When timeout fires:
   - Increment a "tick" counter (forces component re-render)
   - Schedule next hourly refresh (recursive)

**Example Timeline:**

Current time: 7:45:30.500 AM
- Minutes until next hour: 60 - 45 = 15 minutes = 900,000 ms
- Seconds to subtract: 30 seconds = 30,000 ms
- Milliseconds to subtract: 500 ms
- Total: 900,000 - 30,000 - 500 = **869,500 ms** until 8:00:00.000 AM

Timer fires at: 8:00:00.000 AM (exactly)

### What Changes

**State Changed:** None (no state variable changes)

**UI Re-evaluation:** Components that check `isSlotPast()` re-render:
- Slots at or before current hour become greyed out
- "Book Now" button may disable if current hour just ended

**Example:**

Time: 7:59:59 AM
- Slot 7 AM: `isSlotPast(7) = false` (hour 7 ends at 8:00:00, still current)
- Slot 7 AM appears normal (not dimmed)

Timer fires at 8:00:00 AM
- Slot 7 AM: `isSlotPast(7) = true` (hour 7 ended, now it's 8:00:00)
- Slot 7 AM becomes greyed out
- If user was viewing today, visual change is instant

### Independent of Polling

**Hourly Refresh:** Updates visual state based on time passage
**Polling:** Updates bookings state based on server changes

These are separate concerns:
- Hourly refresh: Client-side timer, no network
- Polling: Network request every 7 seconds

---

## localStorage Persistence

### What Is Persisted

**Only timezone preference** is persisted client-side.

**NOT persisted:**
- Current date (always starts at today)
- Week view toggle (always starts in day view)
- Selected slot/user (always starts clear)
- Bookings (fetched from API, not cached locally in API mode)

### Storage Key and Values

**Key:** `"cps-timezone-preference"`

**Values:**
- `"NSW"`: Use NSW timezone display (add +1h during DST)
- `"QLD"`: Use QLD timezone display (base times)

**Default:** `"QLD"` if key doesn't exist or read fails

### Read/Write Flow

**Read (on app load):**

```javascript
try {
  const value = localStorage.getItem("cps-timezone-preference")
  const useNSWTime = (value === "NSW")
} catch (error) {
  console.error("Error reading timezone preference:", error)
  const useNSWTime = false  // Default to QLD
}
```

**Write (on timezone toggle):**

```javascript
try {
  localStorage.setItem("cps-timezone-preference", useNSWTime ? "NSW" : "QLD")
} catch (error) {
  console.error("Error saving timezone preference:", error)
  // Continue anyway (preference just won't persist)
}
```

### Error Handling

**Read Errors:**
- Logged to console
- App defaults to QLD timezone
- App continues loading normally

**Write Errors:**
- Logged to console
- Current toggle still works (state is in memory)
- Preference just won't persist to next session

**Why Graceful Fallback:**
- localStorage may be unavailable (private browsing mode, storage quota exceeded)
- Timezone preference is a "nice to have" feature, not critical
- App must work even if localStorage is broken

### localStorage in API Fallback Mode

When `VITE_USE_API=false`, bookings are ALSO stored in localStorage:

**Key:** `"cps-bookings"`
**Value:** JSON-stringified bookings object (same structure as server state)

This is separate from timezone preference and only used when API is disabled.

---

## State Flow Summary

### Data Sources

1. **Server (via API):** Config, bookings
2. **localStorage:** Timezone preference, (bookings in fallback mode)
3. **User Interaction:** All UI selections, navigation
4. **Time:** Hourly refresh, current hour calculation

### State Lifecycle

**Load → Interact → Sync → Persist**

1. **Load:** Fetch config + bookings from API
2. **Interact:** User clicks/types → optimistic updates → API calls
3. **Sync:** Polling replaces bookings every 7s, errors trigger immediate sync
4. **Persist:** Only timezone preference saved to localStorage

### State Truth

**Server Is Truth:**
- Bookings: Whatever server returns during poll is correct
- Config: Fetched once, trusted for session

**Client Is Truth:**
- UI selections: Not synced, not persisted (session-only)
- Timezone preference: Persisted locally, never sent to server

---

## Implementation Notes for Rails

### State Management

**Rails Equivalent:**

- **Server State:** Rails session or Stimulus values (for config), fetch API responses (for bookings)
- **Client State:** Stimulus controller state (data attributes, class instance variables)
- **Derived State:** Stimulus getters or Ruby helper methods
- **Persistence:** Browser localStorage (same as current implementation)

**No Framework Dependency:**

State management patterns described here are framework-agnostic:
- "Optimistic update" = Change DOM immediately, undo on error
- "Polling sync" = setInterval + fetch
- "State triggers" = Event listeners

### Technology Translation

**React Implementation:**
- `useState` for all state variables
- `useEffect` for initialization, polling, hourly refresh
- `useCallback` for event handlers
- `useMemo` for derived state

**Rails Implementation:**
- Stimulus values for state variables
- Stimulus lifecycle callbacks (`connect`, `disconnect`) for initialization
- Standard JavaScript (`setInterval`, `setTimeout`) for timers
- Getters for derived state

The patterns transfer directly -- only the syntax changes.

---

## Related Architecture Documents

- **ARCH-03: Polling & Real-Time Sync** -- How polling updates bookings state
- **API-01: Booking API** -- Server endpoints that modify state
- **ARCH-05: Error Handling** -- How errors trigger state corrections (triggerSync)
- **UI-03: Component States** -- Visual representation of state in UI

---

## State Diagram (Booking Flow)

```
┌─────────────────────────────────────────────────────────────┐
│ INITIAL STATE (No Selection)                                │
│ selectedSlot = null                                         │
│ selectedUser = null                                         │
│ selectedBooking = null                                      │
└─────────────────────────────────────────────────────────────┘
                            |
          ┌─────────────────┼─────────────────┐
          v                                   v
  [User clicks slot]              [User clicks existing booking]
          |                                   |
          v                                   v
┌─────────────────────┐            ┌─────────────────────┐
│ SLOT SELECTED       │            │ BOOKING SELECTED    │
│ selectedSlot = {...}│            │ selectedBooking={...}│
│ selectedUser = null │            │ Panel open          │
└─────────────────────┘            └─────────────────────┘
          |                                   |
  [User clicks user]              ┌───────────┼───────────┐
          |                       v           v           v
          v                   [Change     [Change    [Click
┌─────────────────────┐       user]      duration]  delete]
│ USER SELECTED       │          |           |           |
│ selectedSlot = {...}│          v           v           v
│ selectedUser = "..."│      Optimistic  Optimistic  Optimistic
└─────────────────────┘      Update +    Update +    Delete +
          |                  API PUT     API PUT     API DELETE
  [User clicks duration]         |           |           |
          |                      v           v           v
          v                   [Success]   [Success]   [Success]
    Optimistic Update              |           |           |
    bookings[date][time] =         └───────────┴───────────┘
      { user, duration }                      |
          |                                   v
          v                          Popup closes
    POST /api/bookings               selectedBooking = null
          |                                   |
     [Success?]                               v
          |                           Back to INITIAL STATE
    ┌─────┴─────┐
    v           v
  [Yes]       [No - Error]
    |           |
    |           v
    |       triggerSync()
    |       (rollback)
    |           |
    └───────────┘
          |
          v
   Panel closes
   selectedSlot = null
   selectedUser = null
          |
          v
   Back to INITIAL STATE
```

This state diagram shows the two primary flows:
1. **Create Flow:** Slot → User → Duration → Optimistic → API → Close
2. **Edit Flow:** Booking → Modify → Optimistic → API → Close

Both flows use optimistic updates and rollback on error via triggerSync.
