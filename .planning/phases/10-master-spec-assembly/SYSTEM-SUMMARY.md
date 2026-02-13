# BMO Financial Booking System - System Summary

**Document ID:** SPEC-03
**Phase:** 10 - Master Spec Assembly
**Created:** 2026-02-13
**Purpose:** Technology-neutral feature and behavior overview for AI-driven reimplementation

---

## What This System Does

This booking system manages hourly time slot reservations for a shared resource through a single-page calendar interface. Users select available time slots, assign bookings to configured personnel, and manage multi-hour reservations with real-time synchronization across multiple concurrent users.

**Core capabilities:**

- **Display availability** - Shows 16 hourly slots (6 AM to 9 PM) for current and future dates with clear visual status indicators
- **Prevent conflicts** - Validates all booking operations against existing reservations, blocking overlapping time slots
- **Multi-hour bookings** - Supports reservations spanning 1-8 consecutive hours with automatic blocking of intermediate slots
- **Real-time synchronization** - Polls server every 7 seconds to reflect changes from other users with optimistic updates for instant feedback
- **Keyboard-driven interaction** - Complete keyboard navigation with context-aware shortcuts and three mutually exclusive interaction modes
- **Timezone display toggle** - Optional NSW time offset display (Queensland +1 hour during DST) without affecting data storage

---

## Key Behaviors

### Booking Creation

**Full flow from slot selection to persistence:**

1. User selects available time slot (click or keyboard Enter)
2. System transitions to PANEL mode, opens booking panel
3. User selects person from configured user list (click button or press hotkey)
4. User selects duration (1-8 hours via button or number key)
5. System validates: slot availability, duration within operating hours, no conflicts
6. System applies optimistic update (booking appears immediately in local view)
7. System sends API request in background (POST /api/bookings)
8. On success: booking persists, panel closes
9. On failure: system fetches server state, rolls back optimistic change, shows error

**Validation rules:**
- Start slot must not have existing booking
- All slots in duration range (start hour + 0 through start hour + duration - 1) must be available
- Duration + start hour must not exceed operating hours endpoint (22:00)
- User must match one of the configured users

### Booking Editing

**Change user or duration on existing booking:**

1. User clicks existing booking block (any hour within multi-hour booking)
2. System transitions to POPUP mode, opens edit modal
3. User can change assigned person (buttons or hotkeys)
   - System validates user exists in configuration
   - Change applies immediately (optimistic update)
   - PUT /api/bookings/update sent in background
4. User can change duration (buttons or number keys)
   - System validates only NEW slots beyond current duration for conflicts
   - Shrinking duration always succeeds (no validation needed)
   - Extending duration checks additional slots for availability
   - Change applies immediately if valid (optimistic update)
   - PUT /api/bookings/update sent in background
5. User closes popup (Esc, Enter, click backdrop, or X button)
6. All changes already saved (no "Save" button exists)

**Critical difference from creation:** Duration extension validation checks only slots beyond current booking range, not the slots already occupied by this booking. This allows users to extend their own bookings without being blocked by themselves.

### Booking Deletion

**Remove existing booking:**

1. User opens booking popup (click booking block)
2. User presses D key or clicks Delete button
3. System applies optimistic delete (booking disappears immediately)
4. System sends DELETE /api/bookings/update in background
5. On success: deletion confirmed
6. On failure: system fetches server state, restores booking if still exists

**Empty date cleanup:** If deleted booking was the last booking on that date, the system removes the date key entirely from storage to prevent accumulation of empty date objects.

### Conflict Prevention

**Validation checks performed at different stages:**

**Before creating booking:**
- Check start slot: Does a booking record exist at target time?
- Check duration range: For multi-hour booking, check every hour in range (start + 0, start + 1, ... start + duration - 1)
- Check blocking: Is any slot in range blocked by an earlier multi-hour booking?
- All checks must pass for booking to proceed

**Before extending duration:**
- Check only NEW slots (hours beyond current duration)
- Current booking's occupied slots explicitly excluded from checks
- Algorithm: Loop from (current duration) to (new duration), check each new slot
- Shrinking duration requires no checks (always succeeds)

**Conflict resolution:**
- Client-side validation prevents most conflicts (disabled buttons)
- Server-side validation catches race conditions
- Optimistic updates rolled back on server rejection
- Polling sync ensures all clients see current truth within 7 seconds

### Multi-Hour Blocking

**Algorithm for occupied slot calculation:**

When booking created at hour H with duration D:
- Hour H: "booked" status (has direct booking record in storage)
- Hours H+1 through H+D-1: "blocked" status (no storage record, calculated dynamically)
- Hour H+D: "available" status (first hour after booking ends)

**Example:** Booking at 9:00 AM with duration 3
- 9:00 AM: Booked (record exists: `{ user: "Jack", duration: 3 }`)
- 10:00 AM: Blocked (hour 10 > 9 and hour 10 < 9+3)
- 11:00 AM: Blocked (hour 11 > 9 and hour 11 < 9+3)
- 12:00 PM: Available (hour 12 = 9+3, outside booking range)

**Storage efficiency:** Only one database record per booking, regardless of duration. Blocked status computed dynamically during slot rendering.

**Interaction with blocked slots:** Clicking any slot within a multi-hour booking (whether start slot or blocked slot) opens the edit popup for the original booking. User sees full booking context and can modify from any affected hour.

### Book Now / Quick Booking

**Header button for instant current-hour booking:**

**Visibility calculation:**
- Button appears when: current hour is within operating hours (6-21) AND current hour slot is available
- Button hidden when: current hour past operating hours OR current hour slot booked/blocked
- Recalculation triggers: hourly refresh, polling sync, booking operations

**Behavior:**
1. User presses N key or clicks Book Now button
2. System auto-selects current hour slot based on internal Queensland time
3. If user viewing different date, system switches to today
4. Booking panel opens with current hour pre-selected
5. User continues normal flow (select person, select duration)

**Timezone interaction:** NSW users with timezone toggle enabled see offset display (+1 hour during DST), but Book Now always books current Queensland hour. "Book now" means current business hour (Queensland time), not current display hour.

**Hourly refresh:** At top of each hour (HH:00:00.000), button visibility recalculates. If current hour becomes unavailable (booked by another user or now past operating hours), button disappears.

### Timezone Toggle

**Display-only offset, storage unchanged:**

**Modes:**
- QLD mode (default): Display hour = Storage hour
- NSW mode (optional): Display hour = Storage hour + (isDST ? 1 : 0)

**DST detection:**
- Uses IANA timezone database via JavaScript Intl API
- Checks current DST status for "Australia/Sydney" timezone
- Automatically handles DST transitions (no hardcoded dates)
- Offset calculation: isDST = timeZoneAbbreviation.includes("AEDT")

**Data isolation:**
- All storage in Queensland time (AEST, UTC+10, no DST)
- Timezone preference stored client-side only (browser localStorage)
- Toggle changes display immediately (no API calls)
- Same booking appears at different visual positions based on toggle state

**Example:**
- Booking stored: `"14:00": { user: "Jack", duration: 2 }`
- QLD display: "2:00 PM" in time slot labeled 14:00
- NSW display (DST active): "3:00 PM" in visual position 15:00
- Storage remains: "14:00" regardless of display mode

**Operating hours display:** In NSW mode during DST, last available slot shows as "10:00 PM" (display hour 22), but represents storage hour 21 (valid booking hour).

### Real-Time Sync

**Polling mechanism:**
- Interval: 7 seconds between fetches
- Operation: GET /api/bookings retrieves entire booking state
- Replacement: Complete state replacement (no diffing of changes)
- Active: Polling runs continuously while application loaded

**Optimistic update pattern:**
1. User initiates operation (create, update, delete)
2. System applies change to local state immediately
3. User sees instant feedback (booking appears/changes/disappears)
4. System sends API request in background
5. On API success: No further action (optimistic update was correct)
6. On API failure: Trigger immediate sync, fetch server truth, replace local state

**Conflict resolution:**
- Server is source of truth for all conflict detection
- First successful API call wins (server-enforced ordering)
- Later conflicting operations receive 409 Conflict response
- Failed operation triggers sync, user sees current truth
- Maximum latency for conflict discovery: 7 seconds (next polling tick)

**State initialization order:**
1. Configuration loads first (users list, title, instance identity)
2. Bookings load second (requires configuration for user validation)
3. Polling starts third (requires bookings state to exist)
Dependencies satisfied before dependent operations begin.

### Past Slot Detection

**End-of-hour boundary rule:**

Slot at hour H becomes "past" when next hour begins (H+1:00:00.000). User can book current hour until :59:59 of that hour.

**Example:**
- Time: 9:58:45 AM
- 9:00 AM slot: Available (end of 9:00 slot is 10:00, current time < 10:00)
- User books 9:00 AM at 9:59:55 AM: Success
- Time advances to 10:00:00 AM
- 9:00 AM slot: Past (now 10:00:00, which is >= end of 9:00 slot)

**Hourly refresh mechanism:**
1. System calculates milliseconds until next top-of-hour
2. Sets timeout to fire at HH:00:00.000 exactly
3. At timeout: Increment refresh counter (forces UI re-render)
4. All slot status calculations recompute with current time
5. Past slots disappear from today's view (future dates unaffected)
6. New timeout scheduled for next hour

**Today vs future dates:**
- Today: Past slots hidden (current hour and future visible)
- Future dates: All slots visible (no past filtering)
- Past dates: All slots visible (viewing historical bookings)

**Coordination with Book Now:** Hourly refresh also triggers Book Now visibility recalculation. If current hour becomes past, button hides.

---

## Data Model

### Bookings Storage Shape

**Nested object structure:**

```
{
  [dateKey: "YYYY-MM-DD"]: {
    [timeKey: "HH:00"]: {
      user: string,
      duration: integer (1-8)
    }
  }
}
```

**Concrete example:**

```
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  },
  "2026-02-15": {
    "09:00": { "user": "Giuliano", "duration": 3 }
  }
}
```

**Empty states:**
- No bookings ever: `{}`
- No bookings on specific date: Date key absent from object
- Last booking deleted from date: Date key removed (cleanup prevents empty date objects)

### Booking Object Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| user | string | Non-empty, max 100 chars | User name, must match configured user |
| duration | integer | 1-8 | Number of consecutive hours booked |

**No other fields stored.** User assignment can change, duration can change, but date/time are object keys (not mutable fields).

### Constraints

**User validation:**
- User string must match exactly one user.name from configuration
- Case-sensitive matching
- Validation enforced client-side (server stores any non-empty string)
- User list defined in configuration, not hardcoded

**Duration bounds:**
- Minimum: 1 hour
- Maximum: 8 hours
- Constraint: start hour + duration must not exceed operating hours endpoint (hour 22)
- Example: Hour 21 (9 PM) can book maximum 1 hour duration (would end at 22:00)

**Conflict rules:**
- No two bookings can occupy same slot
- Multi-hour booking blocks ALL intermediate hours
- Extending duration checks only new slots for conflicts (current booking doesn't block itself)

**Date/time formats:**
- dateKey: `YYYY-MM-DD` format (e.g., "2026-02-14")
- timeKey: `HH:00` format, zero-padded (e.g., "07:00", "14:00")
- Valid hours: 06-21 (6 AM to 9 PM start times)
- All times stored in Queensland timezone (AEST, UTC+10)

### Configuration Shape

**Instance configuration structure:**

```
{
  slug: string,
  title: string,
  users: [
    { name: string, key: string }
  ],
  createdAt: ISO 8601 timestamp
}
```

**Example:**

```
{
  "slug": "cps-software",
  "title": "CPS Software Booking",
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" },
    { "name": "Giuliano", "key": "g" },
    { "name": "John", "key": "h" },
    { "name": "Rue", "key": "r" },
    { "name": "Joel", "key": "l" }
  ],
  "createdAt": "2026-02-13T00:00:00.000Z"
}
```

**Fields:**
- slug: Instance identifier (lowercase alphanumeric with hyphens)
- title: Display title for booking interface
- users: Array of 1-20 user objects
- user.name: Display name (max 100 chars)
- user.key: Single-letter keyboard shortcut (unique within instance)
- createdAt: Instance creation timestamp

**Dynamic hotkeys:** Keyboard shortcuts come from configuration, not hardcoded. Different deployments can have different user rosters with different hotkeys.

**Fallback configuration:** If API unavailable, system uses hardcoded default configuration to ensure application never crashes due to missing config.

---

## User Experience Flows

### Quick Booking (Book Now)

1. User presses N key or clicks Book Now button in header
2. System auto-selects current hour slot
3. System switches to today's date if user viewing different date
4. Booking panel slides in from right (desktop) or full-screen (mobile)
5. User presses user hotkey (e.g., J for Jack)
6. User presses duration hotkey (e.g., 2 for 2 hours)
7. Booking created instantly, panel closes
8. Total interaction: 3 keystrokes (N, J, 2) for complete booking

**Efficiency:** Fastest path to booking current hour. No mouse required. Entire flow keyboard-driven.

### Normal Booking

1. User navigates to desired date (arrow keys or date picker)
2. User clicks time slot OR presses Down arrow to focus slot, then Enter
3. Booking panel opens showing selected time
4. User clicks user button OR presses user hotkey
5. User clicks duration button OR presses duration hotkey (1, 2, or 3)
6. Booking created instantly, panel closes
7. User returns to calendar view (NAVIGATION mode)

**Keyboard path:** Arrow keys → Enter → user hotkey → duration hotkey (4 keystrokes)
**Mouse path:** Click slot → click user → click duration (3 clicks)

### Edit Booking

1. User clicks existing booking block (any hour within multi-hour booking)
2. Edit popup appears showing time range, current user, current duration
3. User changes person: Click different user button OR press different user hotkey
   - Change applies immediately (no Save button)
   - Booking block changes color in calendar instantly
4. User changes duration: Click different duration button OR press different number key
   - If extending: System validates new slots available
   - If shrinking: Change applies immediately (no validation)
   - Visual height of booking block changes instantly
5. User closes popup: Esc, Enter, click X, or click backdrop
6. All changes already persisted

**Inline editing:** No "Save" or "Apply" button. Every change commits immediately with optimistic update.

### Delete Booking

1. User clicks existing booking block
2. Edit popup opens
3. User presses D key OR clicks Delete button
4. Booking disappears immediately
5. Popup closes automatically
6. Freed slots become available instantly

**Multi-hour cleanup:** Deleting 4-hour booking frees 4 slots simultaneously. All become available immediately.

---

## Interaction Modes

The system operates in exactly one of three mutually exclusive modes at any given time. Modes determine which user actions are valid and which keyboard shortcuts are active.

### NAVIGATION Mode

**Active when:** No slot or booking selected, viewing calendar

**User can:**
- Browse dates (Left/Right arrow keys, date picker clicks)
- Toggle between day view and week view (W key)
- Toggle timezone display (Z key)
- Navigate between available slots (Up/Down arrow keys in day view)
- Select slot for booking (click slot or press Enter on focused slot)
- Click existing booking to edit
- Use Book Now shortcut (N key) if current hour available

**User cannot:**
- Create or edit bookings (panel/popup must be open)
- Access duration hotkeys (no active booking operation)

**Keyboard shortcuts active:** W (week), Z (timezone), N (Book Now), arrows (navigation), Enter (select focused slot)

### PANEL Mode

**Active when:** Available slot selected, booking panel open

**User can:**
- Select person (click user button, press user hotkey)
- Select duration (click duration button, press duration hotkey 1/2/3)
- Cancel operation (Esc key, Cancel button)
- Toggle timezone display (Z key) - panel stays open

**User cannot:**
- Navigate dates (arrow keys disabled)
- Toggle week view (W key disabled)
- Select different slot (clicking other slots has no effect until panel closed)
- Use Book Now (N key disabled)

**Keyboard shortcuts active:** User hotkeys (J/B/G/H/R/L), duration hotkeys (1/2/3), Esc (cancel), Z (timezone)
**Keyboard shortcuts disabled:** W (week), N (Book Now), arrows (navigation)

**Panel closure triggers:** User selects duration (completes booking), user presses Esc, user clicks Cancel, user toggles to week view (panel auto-closes on view change)

### POPUP Mode

**Active when:** Existing booking selected, edit popup open

**User can:**
- Change booking user (click user button, press user hotkey)
- Change booking duration (click duration button, press duration hotkey 1/2/3)
- Delete booking (D key, Delete button)
- Close popup (Esc, Enter, X button, backdrop click)

**User cannot:**
- Navigate dates (arrow keys disabled - keyboard trap)
- Toggle week view (W key disabled)
- Toggle timezone (Z key disabled)
- Use Book Now (N key disabled)
- Select other slots or bookings (must close popup first)

**Keyboard shortcuts active:** User hotkeys (J/B/G/H/R/L), duration hotkeys (1/2/3), D (delete), Esc (close), Enter (close)
**Keyboard shortcuts disabled:** W (week), Z (timezone), N (Book Now), arrows (navigation)

**Keyboard trap rationale:** Prevents accidental navigation while editing. User focused on current booking modification, not exploring calendar. Standard accessibility pattern for modal dialogs.

### Mode Transition Rules

| From Mode | Event | To Mode | Side Effects |
|-----------|-------|---------|--------------|
| NAVIGATION | Click available slot | PANEL | Panel slides in, slot highlighted |
| NAVIGATION | Press Enter on focused slot | PANEL | Panel slides in, slot highlighted |
| NAVIGATION | Click existing booking | POPUP | Modal overlay, popup shows booking details |
| PANEL | Press Esc | NAVIGATION | Panel closes, selection cleared |
| PANEL | Select duration | NAVIGATION | Booking created, panel closes |
| PANEL | Toggle to week view | NAVIGATION | Panel auto-closes, view changes |
| POPUP | Press Esc / Enter | NAVIGATION | Popup closes, all changes saved |
| POPUP | Press D (delete) | NAVIGATION | Booking deleted, popup closes |
| POPUP | Click backdrop | NAVIGATION | Popup closes, all changes saved |

**Critical rule:** PANEL and POPUP cannot be active simultaneously. Opening one automatically closes the other (if somehow both triggered, last action wins).

---

## Edge Cases Handled

This system addresses 41 documented edge case scenarios across 9 categories. For complete scenario details, see EDGE-CASES.md. Summary of categories:

### 1. Booking Conflicts (4 scenarios)
- Simultaneous booking attempts by multiple users
- Extending duration into occupied slot
- Adjacent bookings preventing extension
- Multi-hour bookings creating blocked slots

**Handling:** Server-side conflict detection with 409 responses, optimistic updates with automatic rollback, 7-second polling for state synchronization.

### 2. Past Hours and Current Hour (4 scenarios)
- Booking current hour at 59 minutes past
- Hour transition while viewing today
- Viewing past slots on future dates
- Book Now button at hour boundary

**Handling:** End-of-hour boundary rule (slot past at HH+1:00:00.000), hourly refresh timer for UI updates, separate visibility logic for today vs future dates.

### 3. Multi-Hour Bookings (2 scenarios)
- Duration limited by end of operating hours
- Multi-hour booking display in week view

**Handling:** Maximum duration calculation (END_HOUR - startHour), visual block height spans multiple rows, clicking any part of block opens original booking.

### 4. Week Transitions (4 scenarios)
- Navigating from Sunday to next week
- getStartOfWeek for Sunday date
- Week view shows today highlight
- Switching from week view to day view

**Handling:** Monday-start week convention, Sunday returns previous Monday (6 days back), today column visually distinct, mode transition clears selections.

### 5. Timezone Edge Cases (3 scenarios)
- DST transition day (spring forward)
- NSW display shows hour beyond operating hours
- Timezone toggle doesn't affect booking data

**Handling:** IANA timezone database for DST detection, display-only conversion, storage remains Queensland time, no API calls on toggle.

### 6. Polling and Sync (4 scenarios)
- Polling tick during booking creation
- Network error during polling
- API failure during booking creation
- Rapid successive operations

**Handling:** Background sync doesn't interrupt user flow, graceful degradation on network errors, automatic retry on next tick, optimistic updates with rollback on failure.

### 7. Configuration (3 scenarios)
- API unavailable at startup
- Dynamic keyboard shortcuts from config
- More than 6 users in config

**Handling:** Hardcoded fallback configuration, user hotkeys mapped from config, UI adapts to any number of users, first 6 get hotkeys.

### 8. Keyboard Navigation (4 scenarios)
- Arrow keys skip booked/blocked slots
- Keyboard navigation in week view
- Typing in input fields doesn't trigger shortcuts
- Popup keyboard trap (all navigation disabled)

**Handling:** Available-only slot list for navigation, week view disables Up/Down arrows, event target checking exempts input fields, mode-based shortcut activation.

### 9. Data Integrity (3 scenarios)
- Empty date cleanup on delete
- Invalid booking data from server
- Booking for date not in current view

**Handling:** Delete empty date keys after last booking removed, defensive programming with type checks and fallbacks, state contains all dates with polling sync.

See **../09-functional-documentation/EDGE-CASES.md** for detailed expected behaviors, "why this works" explanations, and warning signs for each scenario.

---

## Technology Constraints

### Must Preserve

These elements define the system's core behavior and must be replicated exactly in any implementation:

**Booking rules:**
- Exact validation logic (slot availability, duration bounds, conflict detection)
- Multi-hour blocking algorithm (hour H + duration D blocks H+1 through H+D-1, NOT H or H+D)
- End-of-hour boundary rule for past slot detection
- canBook() vs canChangeDuration() distinction (all slots vs new slots only)

**User interaction flows:**
- Three mutually exclusive modes (NAVIGATION, PANEL, POPUP)
- Mode transition rules and keyboard trap in POPUP mode
- Optimistic update pattern with automatic rollback
- Book Now current-hour auto-selection

**Visual states:**
- Four slot statuses (available, booked, blocked, past)
- Visual distinction between booked block (start hour) and blocked blocks (subsequent hours)
- Multi-hour booking appears as single unified block (not separate boxes per hour)

**Time handling logic:**
- Queensland storage timezone (AEST, UTC+10, no DST)
- Optional NSW display offset (+1 during DST via IANA detection)
- Display-only conversion (no data migration on toggle)
- Hourly refresh at exact HH:00:00.000 boundaries

**Data structures:**
- Nested object shape: `{ dateKey: { timeKey: { user, duration } } }`
- Single record per booking (multi-hour stored at start time only)
- Empty date cleanup on deletion
- Key formats: YYYY-MM-DD, HH:00

### Can Adapt

These implementation details can be modified for different technology stacks:

**Implementation language:**
- React → Rails, Django, Laravel, Next.js, etc.
- JavaScript → Ruby, Python, PHP, TypeScript
- Technology-neutral behavior specs allow any framework

**Storage backend:**
- Vercel KV → Redis, PostgreSQL, MySQL, MongoDB
- Key-value structure → relational tables, document store
- Must support read-modify-write pattern with conflict detection

**Polling mechanism:**
- React interval → Rails ActionCable, Django Channels, long polling
- 7-second interval adjustable (must balance responsiveness vs server load)
- WebSockets viable alternative (adds complexity, reduces latency)

**UI framework:**
- React components → Rails views with Hotwire/Turbo, Vue, Svelte
- CSS-in-JS → Traditional CSS, Tailwind, SASS
- Client-side rendering → Server-side rendering, hybrid approaches

**API implementation:**
- Vercel serverless functions → Rails controllers, Express routes, FastAPI
- JSON API → GraphQL, REST, tRPC
- Must maintain exact request/response contracts for client compatibility

**Authentication/authorization:**
- Current: None (public API)
- Can add: Session-based auth, JWT tokens, OAuth
- Must: Preserve instance isolation via slug-based namespacing

**Configuration delivery:**
- Current: API endpoint with fallback
- Can use: Environment variables, YAML files, database tables
- Must: Provide users list, instance identity, operating hours

The core principle: **Behaviors transfer, implementation patterns don't.** A Rails implementation must produce identical user-facing behavior (booking rules, interaction flows, visual states, time handling) but can use entirely different code patterns and architecture to achieve it.

---

## Cross-References

For detailed implementation specifications, see:

**Functional behavior:**
- **BOOKING-FLOW.md** - Complete workflows for create/edit/delete with decision tables
- **BOOK-NOW-FEATURE.md** - Quick booking feature specification and visibility rules
- **TIMEZONE-TOGGLE.md** - QLD/NSW toggle behavior and DST detection logic
- **TIME-DATE-HANDLING.md** - Date formats, past slot detection, hourly refresh, week navigation
- **EDGE-CASES.md** - 41 edge case scenarios across 9 categories with expected behaviors

**Architecture specifications:**
- **DATA-STORAGE.md** - Complete storage schema, key formats, conflict detection algorithms
- **API-CONTRACTS.md** - All 5 endpoints with request/response examples and error handling
- **INSTANCE-CONFIG.md** - Configuration structure, environment variables, fallback behavior
- **POLLING-SYNC.md** - Real-time synchronization mechanism and conflict resolution
- **STATE-MANAGEMENT.md** - Data flow, optimistic updates, state initialization order

**UI/UX specifications:**
- **LAYOUT-STRUCTURE.md** - Visual hierarchy and component positioning
- **DESIGN-TOKENS.md** - Colors, typography, spacing, shadows (exact values)
- **COMPONENT-STATES.md** - Interactive states (hover, active, focus, disabled)
- **KEYBOARD-SHORTCUTS.md** - All keyboard interactions with mode-based activation
- **RESPONSIVE-BEHAVIOR.md** - Breakpoints and layout changes
- **ANIMATIONS.md** - Transitions, motion, glass morphism effects

**Visual reference:**
- **../05-visual-capture/SCREENSHOT-MANIFEST.md** - Index of 40+ annotated screenshots
- **../05-visual-capture/screenshots/** - Organized by category (initial states, slot states, booking flow, etc.)

**Code reference (React implementation patterns, adapt don't port):**
- **../06-code-extraction/FILE-MANIFEST.md** - Index of extracted React source files
- **../06-code-extraction/ANNOTATIONS.md** - Technology translation guide (React → Rails)
- **../06-code-extraction/extracted-code/** - Clean React reference code with inline annotations

---

**Document version:** 1.0
**Technology level:** Technology-neutral behavior specification
**Audience:** AI coding agents and developers implementing booking system in any framework
**Phase:** 10-master-spec-assembly
