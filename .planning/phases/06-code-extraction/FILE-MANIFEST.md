# File Manifest: CPS Calendar Book Form

**Source:** Extracted from React 18 + Vite 6 + Vercel Serverless codebase
**Purpose:** Index for Rails Claude to understand what each file does
**Cross-references:** Phase 5 screenshots in `.planning/phases/05-visual-capture/screenshots/`

---

## How to Use This Manifest

1. **Start with Data Structures** to understand the domain objects
2. **Read Core Logic files** (hooks, utils, services) for business rules
3. **Read API Endpoints** for server contract
4. **Skim Components** for UI structure (but rely on Phase 5 screenshots for visual truth)
5. **CSS files** are visual reference only — do not port syntax

---

## Data Structures

### Booking Object

The core data structure representing a scheduled booking.

**Fields:**
- `user` (string) — User name from configured users list (e.g., "Jack", "Bonnie")
- `duration` (integer 1-8) — Number of hours booked (typically 1-3)

**Constraints:**
- User must match a configured user name
- Duration must be between 1-8 hours
- Duration cannot extend beyond available slots or overlap with other bookings

**Example:**
```json
{ "user": "Jack", "duration": 2 }
```

### Bookings Storage Structure

Nested object organizing bookings by date and time.

**Structure:**
```
{
  [dateKey]: {
    [timeKey]: Booking
  }
}
```

**Keys:**
- `dateKey` (string) — Date in YYYY-MM-DD format (e.g., "2026-02-14")
- `timeKey` (string) — Time in HH:00 format, 24-hour (e.g., "07:00", "14:00")

**Example:**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

### Slot Status

Computed status for a time slot based on current bookings.

**Status values:**
- `"available"` — Slot can be booked
- `"booked"` — Slot has a direct booking starting at this hour
- `"blocked"` — Slot is blocked by a multi-hour booking that started earlier

**Return object:**
```javascript
{
  status: "available" | "booked" | "blocked",
  booking?: Booking  // Present if status is "booked" or "blocked"
}
```

### Config Object

Instance configuration loaded from API or fallback.

**Fields:**
- `slug` (string) — Instance identifier (e.g., "cps-software")
- `title` (string) — Display title (e.g., "CPS Software Booking")
- `users` (array) — List of user objects with name and keyboard shortcut
- `createdAt` (string ISO 8601) — Creation timestamp

**User object:**
```javascript
{
  name: "Jack",      // Display name
  key: "j",          // Keyboard shortcut (single letter)
  colorIndex?: 0-5   // Optional: explicit color assignment (0-5)
}
```

**Example:**
```json
{
  "slug": "cps-software",
  "title": "CPS Software Booking",
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" }
  ],
  "createdAt": "2026-02-13T00:00:00Z"
}
```

### Time Slot Object

Represents an hourly time slot in the calendar.

**Fields:**
- `hour` (integer 6-21) — Hour in 24-hour format (6 AM = 6, 9 PM = 21)
- `time` (string) — Formatted display time (e.g., "7:00 AM", "2:00 PM")
- `key` (string) — Storage key format HH:00 (e.g., "07:00", "14:00")

**Operating hours:**
- START_HOUR: 6 (6:00 AM)
- END_HOUR: 22 (10:00 PM)
- Total slots: 16 hours

### Date/Time Formats

**Key formats used throughout:**
- `dateKey`: YYYY-MM-DD (e.g., "2026-02-14") — for storage and API
- `timeKey`: HH:00 in 24-hour (e.g., "07:00", "14:00") — for storage and API
- Display date: "Wednesday, February 14, 2026" (long format via toLocaleDateString)
- Display time: "7:00 AM" or "2:00 PM" (12-hour format)
- Short date: "Wed, Feb 14" (week view)

**Timezone handling:**
- Base timezone: Queensland (AEST, UTC+10)
- NSW timezone: AEDT during DST (UTC+11, +1h display offset)
- `useNSWTime` boolean flag toggles display format only
- Storage always uses QLD time (no timezone conversion in data layer)

---

## Core Logic Files

### src/hooks/useBookings.js

**Category:** Business logic
**Purpose:** Manages booking state, CRUD operations, slot status calculations, and real-time sync
**Dependencies:** usePollingSync, services/api, utils/time
**Used by:** App.jsx

**241 lines** — Central business logic for the entire booking system.

#### Key Functions

##### `useBookings() -> object`
**Purpose:** Main hook providing booking state and operations
**Returns:** Object with bookings state, loading/error states, and CRUD functions

**Behavior:**
- Loads all bookings from API on mount
- Sets up polling sync every 7 seconds for real-time updates
- Provides optimistic updates (immediate UI response, rollback on error)
- Exposes slot status calculation and conflict detection

**Returned functions:**
- `getBookingsForDate(dateKey)` — Get all bookings for a specific date
- `createBooking(dateKey, timeKey, user, duration)` — Create new booking with conflict check
- `updateBooking(dateKey, timeKey, updates)` — Update existing booking
- `removeBooking(dateKey, timeKey)` — Delete booking
- `getSlotStatus(dateKey, timeKey, hour)` — Calculate slot status (available/booked/blocked)
- `canBook(dateKey, timeKey, hour, duration)` — Check if booking duration is possible
- `canChangeDuration(dateKey, timeKey, hour, currentDuration, newDuration)` — Check if duration change is valid
- `refreshBookings()` — Manually trigger sync

##### `getSlotStatus(dateKey, timeKey, hour) -> { status, booking? }`
**Purpose:** Determine visual/interactive state of a time slot
**Behavior:**
1. Check if slot has direct booking (status: "booked")
2. Check if blocked by earlier multi-hour booking (status: "blocked")
3. Otherwise, slot is available

**Edge cases:**
- Blocked slots include reference to the booking that blocks them
- Multi-hour bookings only create one booking record at start time

##### `canBook(dateKey, timeKey, hour, duration) -> boolean`
**Purpose:** Validate if a booking with given duration can be created
**Behavior:**
- Checks all slots that would be occupied (start hour through start + duration)
- Returns false if any slot is booked or blocked
- Used to enable/disable duration buttons in UI

##### `canChangeDuration(dateKey, timeKey, hour, currentDuration, newDuration) -> boolean`
**Purpose:** Validate if an existing booking's duration can be changed
**Behavior:**
- Excludes current booking's slots from conflict check
- Only checks NEW slots (beyond current duration)
- Allows shrinking duration without conflict check
- Used for live editing in BookingPopup

**Optimistic update pattern:**
1. Immediately update local state (instant UI response)
2. Call API in background
3. If API fails, trigger sync to get correct state (rollback)

#### Technology-Neutral Notes

This file implements the core booking domain logic. A Rails implementation would:
- Move CRUD operations to a BookingsController
- Implement slot status as a model method or concern
- Replace polling with Action Cable (WebSockets) for real-time sync
- Replace optimistic updates with turbo-streams or similar Rails 7+ pattern

**Key behaviors to preserve:**
- Slot status calculation logic (booked vs blocked)
- Multi-hour booking conflict detection
- Duration validation (check ALL affected slots)

---

### src/hooks/useKeyboard.js

**Category:** UI interaction logic
**Purpose:** Centralized keyboard shortcut handling with context-aware behavior
**Dependencies:** None (pure UI logic)
**Used by:** App.jsx

**172 lines** — Handles all keyboard shortcuts with conditional logic based on UI state.

#### Key Functions

##### `useKeyboard(options) -> void`
**Purpose:** Register keyboard event listeners for the entire application
**Parameters:** Configuration object with callback functions for different actions

**Behavior:**
- Listens to global keydown events
- Ignores keypresses when user is typing in input/textarea
- Different behavior based on current UI state (popup vs panel vs navigation)
- Blocks other shortcuts when popup is open (modal keyboard trap)

**Shortcuts (popup mode - editing existing booking):**
- `D` — Delete booking
- `Escape` — Close popup
- `Enter` — Confirm changes and close
- `[user.key]` — Change booking user (dynamic based on config)
- `1`, `2`, `3` — Change duration (if valid)

**Shortcuts (panel mode - creating new booking):**
- `[user.key]` — Select user (dynamic based on config)
- `1`, `2`, `3` — Select duration
- `Escape` — Cancel booking flow

**Shortcuts (global navigation):**
- `W` — Toggle week view
- `B` — Book Now (jump to current hour)
- `T` — Toggle timezone (QLD/NSW)
- `←` / `→` — Navigate days (-1/+1 in day view, -7/+7 in week view)
- `↑` / `↓` — Navigate time slots (day view only)
- `Enter` — Select focused slot

**Edge cases:**
- User keyboard shortcuts are DYNAMIC (read from config, not hardcoded)
- Duration shortcuts in popup are CONDITIONAL (only work if duration change is valid)
- Arrow key behavior changes between day view and week view
- Popup shortcuts take precedence over all other shortcuts (modal trap)

#### Constant: DURATIONS

**Purpose:** Fixed duration options for all instances
**Value:**
```javascript
[
  { key: '1', value: 1, label: '1 hour' },
  { key: '2', value: 2, label: '2 hours' },
  { key: '3', value: 3, label: '3 hours' }
]
```

**Note:** Unlike users (configurable per instance), duration options are NOT configurable.

#### Technology-Neutral Notes

Keyboard shortcuts are a React-specific implementation detail. Rails implementation could:
- Use Stimulus controllers for keyboard handling
- Implement similar conditional logic based on Turbo Frame state
- Consider hotkey library like Hotkeys.js or Mousetrap

**Key behaviors to preserve:**
- Dynamic user shortcuts based on config
- Modal keyboard trap when popup is open
- Context-aware shortcut behavior (popup vs panel vs navigation)
- Block shortcuts during text input

---

### src/hooks/usePollingSync.js

**Category:** Real-time sync mechanism
**Purpose:** Poll API at intervals for real-time booking updates
**Dependencies:** None (pure timing logic)
**Used by:** useBookings

**53 lines** — Simple polling implementation for multi-user sync.

#### Key Functions

##### `usePollingSync(fetchFn, onUpdate, options) -> { triggerSync }`
**Purpose:** Set up interval-based polling for real-time data sync
**Parameters:**
- `fetchFn` — Async function to call for fetching data
- `onUpdate` — Callback when new data is received
- `options.interval` — Polling interval in milliseconds (default: 7000)
- `options.enabled` — Whether polling is enabled (default: true)

**Behavior:**
- Starts polling on mount (if enabled)
- Calls fetchFn every `interval` milliseconds
- Silently handles errors (logs to console, doesn't interrupt user)
- Cleans up interval on unmount
- Exposes `triggerSync()` for manual sync

**Edge cases:**
- Polling errors are non-fatal (user can continue working)
- Component unmount cancels polling immediately
- Manual sync (triggerSync) can be called outside interval

**Polling interval:** 7000ms (7 seconds)

#### Technology-Neutral Notes

Polling is a simple sync mechanism suitable for low-concurrency scenarios. Rails implementation should:
- Replace with Action Cable (WebSockets) for real-time push updates
- Implement broadcast on booking create/update/delete
- Subscribe to booking channel on frontend

**Key behaviors to preserve:**
- Non-blocking sync (errors don't break UI)
- Automatic background updates
- Manual refresh capability

---

### src/hooks/useConfig.js

**Category:** Configuration accessor
**Purpose:** Access instance configuration from React context
**Dependencies:** context/ConfigContext
**Used by:** App.jsx, components

**24 lines** — Simple context accessor with error handling.

#### Key Functions

##### `useConfig() -> { config, loading, error, title, users, slug, apiEnabled }`
**Purpose:** Access configuration context with convenience getters
**Returns:** Config object with loading/error states

**Behavior:**
- Throws error if used outside ConfigProvider (development safety)
- Provides direct access to config object
- Exposes convenience getters (title, users, slug)
- Indicates whether API is enabled

**Error handling:**
- Throws descriptive error if context is null (improves debugging)

#### Technology-Neutral Notes

Rails implementation would load config differently:
- Load from database (Instance model) instead of React context
- Pass to frontend via data attributes or JSON endpoint
- Consider caching config in session or Rails.cache

**Key behaviors to preserve:**
- Config loaded once at app initialization
- Config available globally to all components
- Fallback config if API unavailable

---

### src/hooks/useHourlyRefresh.js

**Category:** Timer utility
**Purpose:** Trigger re-render on the hour to update past slot visibility
**Dependencies:** None (pure timing logic)
**Used by:** App.jsx

**29 lines** — Precision timer that fires exactly at the start of each hour.

#### Key Functions

##### `useHourlyRefresh() -> number`
**Purpose:** Schedule re-render at the start of each hour
**Returns:** Tick counter (increments each hour, forces re-render)

**Behavior:**
1. Calculate milliseconds until next hour
2. Set timeout for that duration
3. When timeout fires, increment tick counter (triggers re-render)
4. Schedule next hour's timeout
5. Clean up timeout on unmount

**Precision:**
- Accounts for minutes, seconds, AND milliseconds
- Fires exactly at HH:00:00.000

**Use case:**
- Slots are marked "past" when the hour ends
- Component needs to re-render when hour changes to update visual state
- Example: At 7:59:59, 7 AM slot is current. At 8:00:00, 7 AM becomes past.

#### Technology-Neutral Notes

Rails implementation might handle this differently:
- Cache slot status for current minute, not hour
- Use Turbo Streams to push updates when hour changes
- Let browser handle with CSS `:has()` or similar

**Key behaviors to preserve:**
- Slots visually update when they become "past"
- Automatic update without user interaction
- Update happens precisely at hour boundary

---

### src/utils/time.js

**Category:** Pure utility
**Purpose:** Time calculations, formatting, timezone handling, slot logic
**Dependencies:** None (pure functions)
**Used by:** App, components, hooks

**119 lines** — All time-related utilities.

#### Constants

- `START_HOUR = 6` (6:00 AM)
- `END_HOUR = 22` (10:00 PM)

#### Key Functions

##### `generateTimeSlots() -> Array<{ hour, time, key }>`
**Purpose:** Generate array of all time slots for the day
**Returns:** 16 slot objects (6 AM - 10 PM)

##### `formatHour(hour, useNSWTime) -> string`
**Purpose:** Format hour as 12-hour display time (e.g., "7:00 AM")
**Behavior:**
- Converts 24-hour to 12-hour format
- Adds AM/PM
- If `useNSWTime` is true AND NSW is in DST, adds +1 hour to display

**Example:**
- `formatHour(7, false)` → "7:00 AM"
- `formatHour(7, true)` → "8:00 AM" (if NSW in DST)

##### `formatTimeKey(hour) -> string`
**Purpose:** Format hour as storage key (e.g., "07:00", "14:00")
**Behavior:** Zero-pads hour to 2 digits, adds ":00"

##### `formatDate(date) -> string`
**Purpose:** Format date as storage key (YYYY-MM-DD)
**Behavior:** Uses ISO string, takes date portion only

##### `formatDisplayDate(date) -> string`
**Purpose:** Format date for display (e.g., "Wednesday, February 14, 2026")

##### `formatShortDate(date) -> string`
**Purpose:** Format date for week view (e.g., "Wed, Feb 14")

##### `isSlotPast(date, hour) -> boolean`
**Purpose:** Check if a time slot is in the past
**Behavior:**
- Creates Date object for END of slot (hour + 1)
- Compares to current time
- Returns true ONLY when next hour has begun

**Example:**
- At 7:30 AM: `isSlotPast(today, 7)` → false (slot still active)
- At 8:00 AM: `isSlotPast(today, 7)` → true (slot ended)

##### `isToday(date) -> boolean`
**Purpose:** Check if date is today

##### `addDays(date, days) -> Date`
**Purpose:** Add days to a date (handles negative for subtraction)

##### `getWeekDays(startDate) -> Array<Date>`
**Purpose:** Get 7 consecutive days starting from startDate

##### `getStartOfWeek(date) -> Date`
**Purpose:** Get Monday of the week containing date
**Behavior:** Adjusts to Monday (day 1), handles Sunday (day 0) by going back 6 days

##### `isSlotBlocked(bookings, hour) -> { blocked, booking?, bookingHour?, startKey? }`
**Purpose:** Check if a slot is blocked by a multi-hour booking
**Behavior:**
- Iterates through all bookings for the day
- For each booking, calculates occupied hours (start to start + duration)
- If `hour` falls INSIDE another booking's range (not at start), returns blocked

**Example:**
- Booking at 7:00 with duration 3 occupies 7, 8, 9
- `isSlotBlocked(bookings, 7)` → false (slot is booked, not blocked)
- `isSlotBlocked(bookings, 8)` → true (blocked by 7:00 booking)

##### `isNSWInDST() -> boolean`
**Purpose:** Detect if NSW is currently in Daylight Saving Time
**Behavior:**
- Uses Intl.DateTimeFormat with Australia/Sydney timezone
- Checks if timezone name is "AEDT" (vs "AEST")

##### `getNSWOffsetLabel() -> string`
**Purpose:** Get display label for NSW offset ("+1h" or "+0h")

#### Technology-Neutral Notes

All time logic is pure and portable. Rails implementation should:
- Use ActiveSupport::TimeZone for timezone handling
- Consider Time.current instead of Date.today for server timezone consistency
- Store times in UTC, convert to QLD/NSW for display

**Key behaviors to preserve:**
- Slot past detection uses END of hour, not start
- NSW timezone is DISPLAY only, storage stays in QLD time
- Multi-hour blocking logic (slot is blocked if inside another booking's range, not at start)

---

### src/utils/storage.js

**Category:** Storage abstraction
**Purpose:** localStorage wrapper for timezone preference
**Dependencies:** None (browser API only)
**Used by:** App.jsx

**23 lines** — Simple localStorage persistence.

#### Key Functions

##### `getTimezonePreference() -> boolean`
**Purpose:** Load timezone preference from localStorage
**Returns:** true if NSW, false if QLD (default)

##### `saveTimezonePreference(useNSW) -> boolean`
**Purpose:** Save timezone preference to localStorage
**Returns:** true if successful, false on error

**Storage key:** `"cps-timezone-preference"`
**Stored value:** `"NSW"` or `"QLD"` (string)

**Error handling:**
- Returns false on error (e.g., localStorage disabled)
- Logs error to console
- Defaults to QLD (false) on read error

#### Technology-Neutral Notes

Rails implementation would handle preferences differently:
- Store in session or user preferences table
- Use Rails session cookies instead of localStorage
- If not user-specific, localStorage approach is fine (frontend-only setting)

**Key behaviors to preserve:**
- Timezone preference persists across sessions
- Defaults to QLD if not set or on error
- Errors don't break functionality (graceful fallback)

---

### src/utils/colors.js

**Category:** Pure utility
**Purpose:** User color assignment based on position or explicit config
**Dependencies:** None (pure function)
**Used by:** BookingBlock, WeekBookingBlock

**29 lines** — Color class assignment logic.

#### Key Functions

##### `getUserColorClass(userName, users) -> string`
**Purpose:** Get CSS class name for a user's color
**Returns:** CSS class like "user-1", "user-2", etc.

**Behavior:**
1. Find user in users array by name
2. If user has explicit `colorIndex` (0-5), use that (colorIndex + 1 = CSS class)
3. Otherwise, use position in array (index + 1 = CSS class)
4. Cap at "user-6" maximum

**Color mapping (set in CSS):**
- Position 0 → user-1 (green)
- Position 1 → user-2 (magenta)
- Position 2 → user-3 (gold)
- Position 3 → user-4 (purple)
- Position 4 → user-5 (coral)
- Position 5 → user-6 (rose)

**Edge cases:**
- User not found → defaults to "user-1"
- More than 6 users → cycles colors (position 6 = "user-6", position 7 = "user-6")

**Config support:**
- `colorIndex` field on user object overrides position-based assignment
- Allows admin to explicitly assign colors (avoids color changes when users added/removed)

#### Technology-Neutral Notes

Color assignment is a visual concern. Rails implementation could:
- Store colorIndex in User or InstanceUser model
- Assign colors on user creation (random or round-robin)
- Use data attributes or inline styles instead of CSS classes

**Key behaviors to preserve:**
- Each user gets consistent color
- Up to 6 distinct colors
- Position-based fallback if no explicit assignment

---

### src/services/api.js

**Category:** HTTP client
**Purpose:** Fetch wrapper for API calls with error handling and localStorage fallback
**Dependencies:** None (browser fetch API)
**Used by:** useBookings, ConfigContext

**198 lines** — Complete API client with fallback mode.

#### Configuration

**Environment variable:**
- `VITE_USE_API` — "true" to use API, "false" for localStorage mode

**API base:** `/api` (relative, same origin)

#### Key Functions

##### `fetchConfig() -> Promise<Config | null>`
**Purpose:** Load instance configuration
**HTTP:** GET /api/config
**Response:** Config object or null (triggers fallback)

##### `fetchBookings() -> Promise<Bookings>`
**Purpose:** Load all bookings
**HTTP:** GET /api/bookings
**Response:** Bookings object (nested by date/time)
**Fallback:** localStorage if API unavailable

##### `createBooking({ dateKey, timeKey, user, duration }) -> Promise<{ success, booking }>`
**Purpose:** Create new booking
**HTTP:** POST /api/bookings
**Body:** `{ dateKey, timeKey, user, duration }`
**Response:** `{ success: true, booking: {...} }`
**Errors:** 409 if slot conflict, 400 if validation fails
**Fallback:** localStorage with same validation

##### `updateBooking({ dateKey, timeKey, updates }) -> Promise<{ success, booking }>`
**Purpose:** Update existing booking (user or duration)
**HTTP:** PUT /api/bookings/update
**Body:** `{ dateKey, timeKey, updates: { user?, duration? } }`
**Response:** `{ success: true, booking: {...} }`
**Errors:** 404 if not found, 409 if duration conflict
**Fallback:** localStorage with same validation

##### `deleteBooking({ dateKey, timeKey }) -> Promise<{ success }>`
**Purpose:** Delete booking
**HTTP:** DELETE /api/bookings/update
**Body:** `{ dateKey, timeKey }`
**Response:** `{ success: true }`
**Errors:** 404 if not found
**Fallback:** localStorage

##### `isApiEnabled() -> boolean`
**Purpose:** Check if API mode is enabled

#### localStorage Fallback

**Key:** `"cps-bookings"`
**Format:** Same as API response (nested object)

**Validation:**
- Slot conflict checking (same logic as API)
- Duration overlap detection
- Booking existence checks

**Behavior:**
- Synchronous operations (no network delay)
- Validates same constraints as API
- Throws same error messages for consistency

#### Technology-Neutral Notes

Rails implementation would:
- Remove localStorage fallback (API is always available)
- Move conflict validation to model validations
- Use Rails error responses (422 Unprocessable Entity for validation)
- Consider ActiveModel::Serializer for consistent JSON structure

**API contract to preserve:**
- Request/response formats (same JSON structure)
- Error status codes (409 for conflicts, 404 for not found)
- Validation rules (slot conflicts, duration overlaps)

---

### src/context/ConfigContext.jsx

**Category:** Global state provider
**Purpose:** Load and provide instance configuration to entire app
**Dependencies:** services/api
**Used by:** main.jsx (wraps App), useConfig hook

**72 lines** — React context for configuration.

#### Key Functions

##### `ConfigProvider({ children }) -> JSX`
**Purpose:** Load config from API and provide via context
**Behavior:**
1. Calls fetchConfig() on mount
2. If API returns config, uses it
3. If API returns null or errors, uses fallback config
4. Provides loading/error states

**Fallback config:**
```javascript
{
  slug: 'cps-software',
  title: 'CPS Software Booking',
  users: [
    { name: 'Jack', key: 'j' },
    { name: 'Bonnie', key: 'b' },
    { name: 'Giuliano', key: 'g' },
    { name: 'John', key: 'h' },
    { name: 'Rue', key: 'r' },
    { name: 'Joel', key: 'l' }
  ],
  createdAt: [timestamp]
}
```

**Context value:**
```javascript
{
  config,           // Full config object
  loading,          // Boolean: still loading?
  error,            // String: error message if failed
  title,            // Convenience: config.title
  users,            // Convenience: config.users
  slug,             // Convenience: config.slug
  apiEnabled        // Boolean: is API enabled?
}
```

**Error handling:**
- Errors don't break app (fallback always available)
- Logs warning to console
- `error` field is NOT set when using fallback (only on true failures)

#### Technology-Neutral Notes

Rails implementation would:
- Load config from database (Instance.find_by(slug: ...))
- Pass to frontend via `data-config` attribute or JSON endpoint
- Use Rails session or cache for config persistence
- Consider Stimulus values API for passing config to controllers

**Key behaviors to preserve:**
- Config loaded once at app initialization
- Fallback config ensures app always works
- Config accessible globally

---

## API Endpoints

### api/config.js

**Category:** API endpoint
**Purpose:** Return instance configuration
**Dependencies:** @vercel/kv, security wrapper
**HTTP Method:** GET
**Path:** /api/config

#### Request

**Method:** GET
**Headers:** None required
**Body:** None

#### Response

**Success (200):**
```json
{
  "slug": "cps-software",
  "title": "CPS Software Booking",
  "users": [
    { "name": "Jack", "key": "j" },
    { "name": "Bonnie", "key": "b" }
  ],
  "createdAt": "2026-02-13T00:00:00Z"
}
```

**Error (500):**
```json
{
  "error": "Failed to fetch configuration"
}
```

**Error (405):**
```json
{
  "error": "Method not allowed"
}
```

#### Behavior

1. Get instance slug from `process.env.INSTANCE_SLUG` (default: "cps-software")
2. Construct KV key: `instance:{slug}:config`
3. Fetch from Vercel KV
4. If no config exists, return default hardcoded config
5. Return config as JSON

**Storage:** Vercel KV (Redis)
**Key pattern:** `instance:{slug}:config`

#### Security

- Wrapped with `withSecurity()` (CORS, rate limiting, security headers)
- No authentication required (public config)
- Rate limited: 60 requests per minute per IP

#### Technology-Neutral Notes

Rails implementation:
- Replace with ConfigsController#show or InstancesController#show
- Load from ActiveRecord: `Instance.find_by!(slug: params[:slug])`
- Serialize with Jbuilder or ActiveModel::Serializer
- Add caching: `Rails.cache.fetch("instance:#{slug}:config", expires_in: 1.hour)`

**API contract to preserve:**
- Response format (JSON with slug, title, users, createdAt)
- User object structure (name, key, colorIndex?)
- Default fallback if instance not found

---

### api/bookings/index.js

**Category:** API endpoint
**Purpose:** Get all bookings or create new booking
**Dependencies:** @vercel/kv, security wrapper
**HTTP Methods:** GET, POST
**Path:** /api/bookings

#### GET Request

**Method:** GET
**Headers:** None required
**Body:** None

**Success (200):**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

**Behavior:**
- Returns all bookings for all dates
- Empty object `{}` if no bookings exist

#### POST Request

**Method:** POST
**Headers:** Content-Type: application/json
**Body:**
```json
{
  "dateKey": "2026-02-14",
  "timeKey": "07:00",
  "user": "Jack",
  "duration": 2
}
```

**Success (201):**
```json
{
  "success": true,
  "booking": {
    "dateKey": "2026-02-14",
    "timeKey": "07:00",
    "user": "Jack",
    "duration": 2
  }
}
```

**Validation error (400):**
```json
{
  "error": "Missing or invalid fields: dateKey, timeKey, user, duration"
}
```

**Conflict error (409):**
```json
{
  "error": "Slot already booked"
}
```
OR
```json
{
  "error": "Slot 08:00 conflicts with booking duration"
}
```

**Server error (500):**
```json
{
  "error": "Internal server error"
}
```

#### Validation Rules

**Input sanitization:**
- `dateKey`: Must match YYYY-MM-DD format
- `timeKey`: Must match HH:00 format
- `user`: String, max 100 chars, HTML tags stripped
- `duration`: Integer 1-8

**Conflict detection:**
1. Check if start slot is already booked
2. For multi-hour bookings, check ALL occupied slots (start + duration)
3. Reject if any slot in range is booked

**Example:**
- Existing booking at 07:00 with duration 2 (occupies 07:00 and 08:00)
- New booking at 08:00 with duration 1 → REJECTED (08:00 is occupied)
- New booking at 09:00 with duration 1 → ALLOWED

#### Storage

**Backend:** Vercel KV (Redis)
**Key pattern:** `instance:{slug}:bookings`
**Value:** Entire bookings object (nested by date/time)

**Write strategy:**
- Read entire bookings object
- Modify in memory
- Write back entire object
- No TTL (persists indefinitely)

#### Security

- Wrapped with `withSecurity()` (CORS, rate limiting)
- Input sanitization prevents XSS/injection
- Rate limited: 60 requests per minute per IP

#### Technology-Neutral Notes

Rails implementation:
- Replace with BookingsController#index and #create
- Model: Booking with validations
- Validate uniqueness of [date, time] combination
- Add custom validation for duration overlap
- Return JSON via Jbuilder or json builder block

**API contract to preserve:**
- Request/response formats
- Error status codes (400, 409, 500)
- Conflict detection logic (check all slots in duration range)

---

### api/bookings/update.js

**Category:** API endpoint
**Purpose:** Update or delete existing booking
**Dependencies:** @vercel/kv, security wrapper
**HTTP Methods:** PUT, DELETE
**Path:** /api/bookings/update

#### PUT Request (Update)

**Method:** PUT
**Headers:** Content-Type: application/json
**Body:**
```json
{
  "dateKey": "2026-02-14",
  "timeKey": "07:00",
  "updates": {
    "user": "Bonnie",
    "duration": 3
  }
}
```

**Success (200):**
```json
{
  "success": true,
  "booking": {
    "user": "Bonnie",
    "duration": 3
  }
}
```

**Not found (404):**
```json
{
  "error": "Booking not found"
}
```

**Conflict error (409):**
```json
{
  "error": "Cannot extend: slot 09:00 is already booked"
}
```

**Validation error (400):**
```json
{
  "error": "Missing or invalid fields: dateKey, timeKey, updates"
}
```

#### DELETE Request

**Method:** DELETE
**Headers:** Content-Type: application/json
**Body:**
```json
{
  "dateKey": "2026-02-14",
  "timeKey": "07:00"
}
```

**Success (200):**
```json
{
  "success": true
}
```

**Not found (404):**
```json
{
  "error": "Booking not found"
}
```

#### Behavior (Update)

**Duration change validation:**
1. If duration unchanged or shrinking → allow immediately (no conflict possible)
2. If duration increasing:
   - Check slots from `currentDuration` to `newDuration`
   - Only NEW slots are checked (current booking's slots are excluded)
   - Reject if any new slot is occupied

**Example:**
- Current booking at 07:00 with duration 2 (occupies 07:00, 08:00)
- Update to duration 3 (would occupy 07:00, 08:00, 09:00)
- Only check if 09:00 is available (07:00 and 08:00 are current booking's)

**User change:**
- No validation required
- Simply updates user field

#### Behavior (Delete)

1. Find booking by dateKey + timeKey
2. Delete from nested object
3. Clean up empty date objects (if no bookings remain for that date)
4. Save updated bookings object

#### Storage

Same as create: Vercel KV with full object read-modify-write.

#### Security

Same as create: Input sanitization, rate limiting, CORS.

#### Technology-Neutral Notes

Rails implementation:
- Replace with BookingsController#update and #destroy
- Use ActiveRecord validations
- Add custom validator for duration extension conflicts
- DELETE returns 204 No Content (Rails convention)

**API contract to preserve:**
- Duration change conflict detection (only check NEW slots)
- Clean up empty date objects
- Error messages and status codes

---

### api/_lib/security.js

**Category:** Security middleware
**Purpose:** CORS, rate limiting, input sanitization, security headers
**Dependencies:** @vercel/kv
**Used by:** All API endpoints

**186 lines** — Complete security wrapper for API endpoints.

#### Key Functions

##### `withSecurity(handler, options) -> function`
**Purpose:** Wrap API handler with security checks
**Parameters:**
- `handler` — The actual API endpoint function
- `options.rateLimit` — Enable rate limiting (default: true)

**Behavior:**
1. Set security headers (CSP, X-Frame-Options, etc.)
2. Handle CORS (preflight OPTIONS, allow headers)
3. Check rate limit (if enabled)
4. Call handler if all checks pass

**Usage:**
```javascript
export default withSecurity(handler);
```

##### `handleCors(req, res) -> boolean`
**Purpose:** Set CORS headers and handle preflight
**Returns:** false if request was OPTIONS (already handled), true to continue

**Allowed origins:**
- localhost:5173 (Vite dev)
- localhost:3000 (common dev port)
- *.vercel.app (all Vercel deployments)
- Any origin (logs warning if not in allowed list)

**CORS headers:**
- Access-Control-Allow-Origin
- Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
- Access-Control-Allow-Headers: Content-Type, Authorization
- Access-Control-Max-Age: 86400 (24 hours)

##### `checkRateLimit(req) -> Promise<{ allowed, remaining }>`
**Purpose:** Rate limit by IP address
**Behavior:**
- Get client IP from X-Forwarded-For or X-Real-IP
- Use KV to track request count per IP
- Window: 1 minute rolling
- Limit: 60 requests per minute
- Returns allowed status and remaining count

**Storage key:** `ratelimit:{ip}`
**TTL:** 2 minutes (allows window to expire)

**Error handling:**
- If rate limit check fails, allows request (fail-open)
- Logs error to console

##### `setSecurityHeaders(res) -> void`
**Purpose:** Set security headers on all responses

**Headers:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy: default-src 'self'

##### `sanitizeString(str) -> string`
**Purpose:** Remove HTML tags and potential injection characters
**Behavior:**
- Remove all HTML tags
- Remove `<`, `>`, `'`, `"`
- Trim whitespace
- Limit to 100 characters

##### `sanitizeBookingInput(body) -> object`
**Purpose:** Validate and sanitize all booking input fields
**Returns:** Object with sanitized fields (null if invalid)

**Validation:**
- `dateKey`: YYYY-MM-DD regex
- `timeKey`: HH:00 regex
- `user`: sanitizeString
- `duration`: Integer 1-8
- `updates.user`: sanitizeString
- `updates.duration`: Integer 1-8

#### Technology-Neutral Notes

Rails implementation would use:
- Rack::Cors for CORS handling
- Rack::Attack for rate limiting
- Strong parameters for input sanitization
- SecureHeaders gem for security headers

**Security behaviors to preserve:**
- Rate limiting by IP (60 req/min)
- Input sanitization (prevent XSS/injection)
- CORS for cross-origin requests
- CSP and other security headers

---

## UI Components

### src/main.jsx

**Category:** Application entry point
**Purpose:** Mount React app with config provider
**Dependencies:** App, ConfigContext
**Used by:** index.html

**13 lines** — Minimal entry point.

**Behavior:**
1. Render App inside ConfigProvider
2. Use StrictMode for development warnings
3. Mount to `#root` element

**Technology-Neutral Notes:**
Rails would use ERB template instead. No direct equivalent to this file.

---

### src/App.jsx

**Category:** UI orchestrator
**Purpose:** Main application component managing all state and routing between views
**Visual reference:** All screenshots (main container)
**Dependencies:** All components, hooks, utils
**Props/inputs:** None (root component)

**400 lines** — Central orchestrator for entire application.

#### Behavior

**State management:**
- Current date (for calendar view)
- Week view toggle (day vs week)
- Selected slot (for booking panel)
- Selected user (during booking flow)
- Focused slot index (for keyboard navigation)
- Selected booking (for popup)
- NSW timezone toggle (display only)

**Event handling:**
- Slot click → open booking panel
- Booking click → open booking popup
- Keyboard shortcuts → delegated to useKeyboard
- Navigation (left/right arrows) → change date
- Week toggle → switch between day and week view
- Book Now → jump to current hour + open panel

**Rendering:**
- Conditionally renders day view (TimeStrip) OR week view (WeekView)
- Shows BookingPanel when slot selected
- Shows BookingPopup when booking clicked
- Passes all necessary props down to children

#### States

**Views:**
- Day view (default): Single date with vertical time strip
- Week view: 7-day horizontal grid

**Panel states:**
- Closed (no slot selected)
- Open with slot selected (booking flow)

**Popup states:**
- Closed (no booking selected)
- Open with booking details (edit/delete)

**Timezone:**
- QLD (default)
- NSW (+1h display offset)

#### Technology-Neutral Notes

Rails implementation would:
- Split state into Turbo Frames (panel, popup as separate frames)
- Use Stimulus controllers for state management
- URL state for current date (params[:date])
- Replace conditional rendering with Turbo Stream updates

**Key behaviors to preserve:**
- Single selected slot (panel) vs single selected booking (popup)
- Week view changes navigation (7 days instead of 1)
- Keyboard shortcuts context-aware
- Timezone toggle is display-only (no data changes)

---

### src/components/Header.jsx

**Category:** UI component
**Purpose:** Top navigation bar with date, navigation, Book Now button, timezone toggle
**Visual reference:** 01-initial-states/000-initial-load.png, 04-book-now-button/001-book-now-visible.png
**Dependencies:** utils/time
**Props/inputs:**
- `currentDate` — Date object for display
- `onNavigate(direction)` — Callback for prev/next day
- `onBookNow` — Callback for Book Now button
- `currentHourAvailable` — Boolean: show Book Now button?
- `useNSWTime` — Boolean: timezone display toggle
- `onTimezoneToggle` — Callback for timezone toggle

**62 lines**

#### Behavior

**Displays:**
- Current date in long format (e.g., "Wednesday, February 14, 2026")
- Previous day button (←)
- Next day button (→)
- Book Now button (conditional)
- Timezone toggle (QLD/NSW)

**Book Now button:**
- Only visible when `currentHourAvailable` is true
- Pulsing animation (CSS)
- Hotkey indicator: [B]

**Timezone toggle:**
- Shows "QLD" or "NSW" based on `useNSWTime`
- Hotkey indicator: [T]
- Shows offset label when NSW selected ("+1h" or "+0h")

#### States

- Book Now visible vs hidden (based on prop)
- QLD vs NSW timezone selected
- Default vs mobile layout (responsive)

#### Technology-Neutral Notes

Rails implementation:
- Stimulus controller for navigation
- Turbo Drive for date navigation (update URL param)
- CSS animation for Book Now pulse

**Visual truth:** See screenshots in 01-initial-states/ and 04-book-now-button/

---

### src/components/TimeStrip.jsx

**Category:** UI component
**Purpose:** Vertical grid of time slots for a single day
**Visual reference:** 01-initial-states/001-empty-calendar-full-day.png, 02-slot-states/
**Dependencies:** TimeSlot, BookingOverlay, utils/time
**Props/inputs:**
- `date` — Date object for this day
- `slots` — Array of time slot objects
- `onSlotClick(slot)` — Callback when slot clicked
- `selectedSlot` — Currently selected slot (for highlight)
- `focusedSlotIndex` — Keyboard-focused slot index
- `useNSWTime` — Timezone display toggle

**73 lines**

#### Behavior

**Renders:**
- Grid of TimeSlot components (one per hour)
- BookingOverlay components for each multi-hour booking

**Layout:**
- Vertical stack of slots
- Bookings rendered as overlays (absolute positioned)

**Slot rendering:**
- Each slot knows its own status (available/booked/blocked/past)
- Selected slot gets visual highlight
- Focused slot gets keyboard focus indicator

#### States

- Empty calendar (all available)
- Some slots booked
- Some slots blocked (multi-hour)
- Some slots past (grayed out)
- Slot selected (highlighted)

#### Technology-Neutral Notes

Rails implementation:
- Partial for each slot
- Server-rendered booking blocks
- Turbo Frames for slot interactions

**Visual truth:** See screenshots in 01-initial-states/ and 02-slot-states/

---

### src/components/TimeSlot.jsx

**Category:** UI component
**Purpose:** Individual hourly time slot cell
**Visual reference:** 02-slot-states/001-slot-available.png, 002-slot-booked-and-blocked.png, 003-slots-past.png
**Dependencies:** utils/time
**Props/inputs:**
- `slot` — Slot object { hour, time, key }
- `date` — Date object
- `status` — "available" | "booked" | "blocked"
- `isSelected` — Boolean: is this slot selected?
- `isFocused` — Boolean: is this slot keyboard-focused?
- `onClick` — Callback when clicked
- `useNSWTime` — Timezone display toggle

**68 lines**

#### Behavior

**Displays:**
- Time label (formatted based on timezone)
- Status indicator (CSS classes)

**Interactions:**
- Click → call onClick (if available)
- Disabled if booked, blocked, or past

**CSS classes:**
- `.slot-available` — clickable, cyan border
- `.slot-booked` — orange fill, non-interactive
- `.slot-blocked` — gray fill, non-interactive
- `.slot-past` — dimmed, non-interactive
- `.slot-selected` — highlighted border
- `.slot-focused` — keyboard focus indicator

#### States

- Available (clickable)
- Booked (shows user, non-interactive)
- Blocked (part of multi-hour, non-interactive)
- Past (grayed out, non-interactive)
- Selected (highlighted)
- Focused (keyboard indicator)

#### Technology-Neutral Notes

Rails implementation:
- Partial: `_time_slot.html.erb`
- Data attributes for status
- CSS classes for visual states

**Visual truth:** See screenshots in 02-slot-states/

---

### src/components/BookingPanel.jsx

**Category:** UI component
**Purpose:** Side panel for creating new bookings (user + duration selection)
**Visual reference:** 01-initial-states/002-date-selected-with-panel.png, 03-booking-flow/
**Dependencies:** utils/time, useKeyboard (DURATIONS)
**Props/inputs:**
- `isOpen` — Boolean: panel visible?
- `selectedSlot` — Slot object being booked
- `selectedUser` — Currently selected user (during flow)
- `canBookDuration(duration)` — Function to check if duration is valid
- `onUserSelect(userName)` — Callback when user selected
- `onDurationSelect(duration)` — Callback when duration selected
- `onCancel` — Callback to close panel
- `users` — Array of user objects from config
- `useNSWTime` — Timezone display toggle

**84 lines**

#### Behavior

**Slides in from right when opened**
**Two-step flow:**
1. Select user (WHO section)
2. Select duration (DURATION section)

**User buttons:**
- Show user name + keyboard shortcut
- Highlight selected user
- Hotkey: user's configured key

**Duration buttons:**
- Three options: [1] 1hr, [2] 2hr, [3] 3hr
- Disabled if duration not available (conflict)
- Hotkey: 1, 2, 3

**Cancel button:**
- ESC key or click Cancel

**Auto-submit:**
- When duration selected, automatically creates booking (no submit button)

#### States

- Closed (off-screen)
- Open, no user selected (only WHO section active)
- Open, user selected (DURATION section active)
- Booking created (panel closes)

#### Technology-Neutral Notes

Rails implementation:
- Turbo Frame for panel content
- Stimulus controller for slide-in animation
- Form with user select + duration select
- Submit via Turbo Stream

**Visual truth:** See screenshots in 03-booking-flow/

---

### src/components/BookingPopup.jsx

**Category:** UI component
**Purpose:** Popup modal for viewing/editing existing bookings
**Visual reference:** 02-slot-states/002-slot-booked-and-blocked.png
**Dependencies:** useKeyboard
**Props/inputs:**
- `isOpen` — Boolean: popup visible?
- `booking` — Booking object { user, duration }
- `slot` — Slot object { hour, time, key }
- `date` — Date object
- `onUserChange(userName)` — Callback to change user
- `onDurationChange(duration)` — Callback to change duration
- `onDelete` — Callback to delete booking
- `onClose` — Callback to close popup
- `canChangeDuration(duration)` — Function to check if duration change valid
- `users` — Array of user objects from config
- `useNSWTime` — Timezone display toggle

**102 lines**

#### Behavior

**Shows:**
- Booking details (user, time, duration)
- User change buttons (inline editing)
- Duration change buttons (inline editing)
- Delete button [D]
- Close button (X icon + ESC)

**Inline editing:**
- Click different user → immediately updates booking
- Click different duration → immediately updates booking (if valid)
- No submit button (changes are instant)

**Delete confirmation:**
- Click Delete or press D
- Booking deleted immediately (no confirmation dialog)

**Keyboard shortcuts:**
- ESC or Enter → close
- D → delete
- [user.key] → change user
- 1, 2, 3 → change duration (if valid)

**Backdrop:**
- Click outside popup → closes popup
- Semi-transparent dark overlay

#### States

- Closed (hidden)
- Open showing booking details
- User changed (updated immediately)
- Duration changed (updated immediately)
- Booking deleted (popup closes)

#### Technology-Neutral Notes

Rails implementation:
- Turbo Frame modal
- Stimulus controller for backdrop click
- Inline forms with Turbo Stream responses
- Delete link with turbo_method: :delete

**Visual truth:** See booking popup in 02-slot-states/002-slot-booked-and-blocked.png

---

### src/components/BookingBlock.jsx

**Category:** UI component
**Purpose:** Visual block representing a multi-hour booking in day view
**Visual reference:** 02-slot-states/005-multi-hour-booking-block.png
**Dependencies:** utils/colors, utils/time
**Props/inputs:**
- `booking` — Booking object { user, duration }
- `startHour` — Integer: starting hour
- `onClick` — Callback when clicked
- `users` — Array of user objects (for color)

**143 lines**

#### Behavior

**Renders:**
- Colored block spanning multiple slots
- User name label
- Duration indicator

**Sizing:**
- Height = duration × slot height
- Positioned absolutely over slots

**Color:**
- Determined by `getUserColorClass(user, users)`
- Consistent color per user

**Interaction:**
- Click → opens BookingPopup for editing

#### States

- 1 hour (single slot height)
- 2 hours (double slot height)
- 3 hours (triple slot height)

#### Technology-Neutral Notes

Rails implementation:
- Partial with inline styles for height
- CSS classes for user colors
- Data attributes for booking ID

**Visual truth:** See multi-hour bookings in 02-slot-states/005-multi-hour-booking-block.png

---

### src/components/BookingOverlay.jsx

**Category:** UI component
**Purpose:** Container for booking blocks positioned over time slots
**Dependencies:** BookingBlock
**Props/inputs:**
- `bookings` — Object of bookings for the day
- `onBookingClick(booking, slot)` — Callback when booking clicked
- `users` — Array of user objects

**40 lines**

#### Behavior

**Renders:**
- Absolute positioned container
- Maps bookings to BookingBlock components
- Calculates position for each block

**Layout:**
- Overlays the TimeStrip grid
- Uses absolute positioning to align with slots

#### Technology-Neutral Notes

Rails implementation:
- Absolute positioned divs over slot grid
- Calculate top position server-side

---

### src/components/WeekView.jsx

**Category:** UI component
**Purpose:** 7-day horizontal calendar grid
**Visual reference:** 06-responsive/ (may show week view if captured)
**Dependencies:** WeekDayOverlay, utils/time
**Props/inputs:**
- `startDate` — Date object (Monday of the week)
- `onDayClick(date)` — Callback when day clicked
- `useNSWTime` — Timezone display toggle

**122 lines**

#### Behavior

**Displays:**
- 7 columns (Monday - Sunday)
- Each day shows:
  - Day name + date
  - Time slots (6 AM - 10 PM)
  - Bookings as blocks

**Interaction:**
- Click day → switch to day view for that date

**Navigation:**
- Left/right arrows move by 7 days (previous/next week)

#### States

- Current week
- Week with some bookings
- Week with no bookings

#### Technology-Neutral Notes

Rails implementation:
- Grid layout with 7 columns
- Each column is a day partial
- Turbo Frame for week navigation

---

### src/components/WeekBookingBlock.jsx

**Category:** UI component
**Purpose:** Booking block for week view (more compact than day view)
**Visual reference:** Week view screenshots (if captured)
**Dependencies:** utils/colors, utils/time
**Props/inputs:**
- `booking` — Booking object
- `startHour` — Integer: starting hour
- `onClick` — Callback when clicked
- `users` — Array of user objects

**114 lines**

#### Behavior

Similar to BookingBlock but more compact for week view.

**Displays:**
- User initials (not full name)
- Smaller font, tighter spacing
- Same color scheme

---

### src/components/WeekDayOverlay.jsx

**Category:** UI component
**Purpose:** Booking overlay for a single day column in week view
**Dependencies:** WeekBookingBlock
**Props/inputs:**
- `bookings` — Object of bookings for the day
- `onBookingClick` — Callback when booking clicked
- `users` — Array of user objects

**38 lines**

#### Behavior

Similar to BookingOverlay but for week view columns.

---

## CSS Files (Visual Reference Only)

**Note:** CSS files document visual intent only. Rails implementation will use different styling approach (Tailwind, CSS-in-Rails, or asset pipeline). Extract color values, spacing patterns, and responsive breakpoints, but do not port syntax directly.

### CSS File List

| File | Component Styled | Key Visual Concerns |
|------|------------------|---------------------|
| src/index.css | Global styles | Typography, CSS custom properties (colors), reset |
| src/App.css | App container | Layout, view transitions, modal backdrop |
| src/components/Header.css | Header | Navigation buttons, Book Now pulse animation, timezone toggle |
| src/components/TimeStrip.css | TimeStrip | Grid layout, slot spacing |
| src/components/TimeSlot.css | TimeSlot | Slot states (available/booked/blocked/past), hover effects |
| src/components/BookingPanel.css | BookingPanel | Slide-in animation, button styles, responsive mobile overlay |
| src/components/BookingPopup.css | BookingPopup | Modal positioning, backdrop, button layout |
| src/components/BookingBlock.css | BookingBlock | Block sizing, user colors (user-1 through user-6), positioning |
| src/components/BookingOverlay.css | BookingOverlay | Absolute positioning container |
| src/components/WeekView.css | WeekView | 7-column grid, day headers |
| src/components/WeekBookingBlock.css | WeekBookingBlock | Compact block styles for week view |
| src/components/WeekDayOverlay.css | WeekDayOverlay | Day column overlay positioning |

### Color Values (Extract These)

**User colors (from BookingBlock.css):**
- user-1 (green): #10b981 background, #059669 border
- user-2 (magenta): #ec4899 background, #db2777 border
- user-3 (gold): #f59e0b background, #d97706 border
- user-4 (purple): #8b5cf6 background, #7c3aed border
- user-5 (coral): #ef4444 background, #dc2626 border
- user-6 (rose): #f43f5e background, #e11d48 border

**Slot states (from TimeSlot.css):**
- Available: cyan border (#06b6d4)
- Booked: orange/salmon background (#fb923c)
- Blocked: gray background (#6b7280)
- Past: reduced opacity (0.4)

**Theme colors (from index.css):**
- Background: #1a1a1a (dark gray)
- Text: #e5e5e5 (light gray)
- Border: #333 (medium gray)

### Responsive Breakpoints (Extract These)

**From CSS media queries:**
- Mobile: max-width 768px
- Tablet: 768px - 1024px
- Desktop: min-width 1024px

**Key responsive changes:**
- BookingPanel: Full-screen overlay on mobile, side panel on desktop
- TimeStrip: Wider slots on mobile (larger touch targets)
- Header: Stacked buttons on mobile, horizontal on desktop

### Animations (Extract Behavior)

**Book Now pulse (Header.css):**
- Keyframe animation: scale from 1.0 to 1.05 and back
- Duration: 2s infinite
- Only active when button visible

**Panel slide-in (BookingPanel.css):**
- Transition: transform 0.3s ease
- Starts off-screen right (translateX(100%))
- Slides to on-screen (translateX(0))

---

## File Summary

| File | Category | Lines | Key Concern |
|------|----------|-------|-------------|
| **Root Files** |
| src/main.jsx | Entry point | 13 | App initialization, config provider |
| src/App.jsx | Orchestrator | 400 | State management, event routing, view logic |
| **Hooks (Business Logic)** |
| src/hooks/useBookings.js | Business logic | 241 | Booking CRUD, slot status, conflict detection |
| src/hooks/useKeyboard.js | UI interaction | 172 | Keyboard shortcuts, context-aware behavior |
| src/hooks/usePollingSync.js | Real-time sync | 53 | Polling mechanism for multi-user updates |
| src/hooks/useConfig.js | Config accessor | 24 | Access instance configuration |
| src/hooks/useHourlyRefresh.js | Timer utility | 29 | Hourly re-render for past slot updates |
| **Utilities (Pure Functions)** |
| src/utils/time.js | Time logic | 119 | Date/time formatting, slot calculations, timezone |
| src/utils/storage.js | Persistence | 23 | localStorage for timezone preference |
| src/utils/colors.js | Color assignment | 29 | User color class mapping |
| **Services (HTTP)** |
| src/services/api.js | HTTP client | 198 | API calls with localStorage fallback |
| src/context/ConfigContext.jsx | Global state | 72 | Config loading and React context |
| **Components (UI)** |
| src/components/Header.jsx | Header bar | 62 | Date nav, Book Now, timezone toggle |
| src/components/TimeStrip.jsx | Day view grid | 73 | Vertical slot list container |
| src/components/TimeSlot.jsx | Slot cell | 68 | Individual hourly slot |
| src/components/BookingPanel.jsx | Booking flow | 84 | User + duration selection panel |
| src/components/BookingPopup.jsx | Booking editor | 102 | Edit/delete existing booking modal |
| src/components/BookingBlock.jsx | Booking visual | 143 | Multi-hour booking block (day view) |
| src/components/BookingOverlay.jsx | Overlay container | 40 | Absolute positioning layer |
| src/components/WeekView.jsx | Week grid | 122 | 7-day horizontal calendar |
| src/components/WeekBookingBlock.jsx | Week booking | 114 | Compact booking block (week view) |
| src/components/WeekDayOverlay.jsx | Week overlay | 38 | Booking overlay for week columns |
| **API Endpoints** |
| api/config.js | Config endpoint | 46 | GET instance configuration |
| api/bookings/index.js | Bookings CRUD | 85 | GET all bookings, POST new booking |
| api/bookings/update.js | Booking updates | 109 | PUT update booking, DELETE booking |
| api/_lib/security.js | Security layer | 186 | CORS, rate limiting, sanitization |
| **CSS Files (Visual Reference)** |
| src/index.css | Global styles | ~50 | Theme colors, typography |
| src/App.css | App container | ~40 | Layout, transitions |
| src/components/*.css | Component styles | ~30 each | Visual states, animations, responsive |
| **TOTAL** | | **2,375** | **Full application** |

---

**Manifest complete.** All 39 files documented with purpose, functions, dependencies, and cross-references.

**Next steps:**
1. Read this manifest to understand file structure
2. Cross-reference components with Phase 5 screenshots for visual truth
3. Extract behavior (not syntax) for Rails implementation
4. Focus on data structures and API contracts as the stable interface

---

*Manifest created: 2026-02-13*
*Phase: 06-code-extraction, Plan: 02*
