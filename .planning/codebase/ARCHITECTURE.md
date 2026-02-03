# Architecture

**Analysis Date:** 2026-02-04

## Pattern Overview

**Overall:** Layered MVC with dual-layer data persistence (optional Vercel KV backend + localStorage fallback)

**Key Characteristics:**
- Configuration-driven multi-instance deployment (INSTANCE_SLUG environment variable)
- Dual-view UI (day view with time strip, week view grid)
- Real-time sync via polling (7-second interval) when API enabled
- Optimistic updates with server-side validation and rollback on error
- Keyboard-first interaction (single-key hotkeys for users and durations)
- Time slot management with multi-hour booking support (1-3 hours)

## Layers

**Presentation Layer:**
- Purpose: React components for UI rendering and user interaction
- Location: `src/components/`, `src/App.jsx`
- Contains: View components, CSS stylesheets, conditional rendering based on state
- Depends on: State management hooks, configuration context, time utilities
- Used by: React root at `src/main.jsx`

**State Management Layer:**
- Purpose: React hooks that manage application state and coordinate with backend
- Location: `src/hooks/`
- Contains: `useBookings.js` (booking CRUD), `useConfig.js` (config access), `useKeyboard.js` (keyboard events), `usePollingSync.js` (real-time sync), `useHourlyRefresh.js` (hourly stale slot refresh)
- Depends on: API service layer, context providers
- Used by: App component and consumer components

**Context Layer:**
- Purpose: Shared state for configuration across component tree
- Location: `src/context/ConfigContext.jsx`
- Contains: ConfigProvider component wrapping entire app, fallback user list, error handling
- Depends on: API service layer
- Used by: useConfig hook

**Service Layer (Client-side API):**
- Purpose: Abstraction over HTTP requests with localStorage fallback
- Location: `src/services/api.js`
- Contains: Fetch functions for config, bookings, CRUD operations
- Depends on: fetch API, localStorage
- Used by: State management hooks

**Utility Layer:**
- Purpose: Pure functions for calculations and formatting
- Location: `src/utils/` (time.js, colors.js, storage.js)
- Contains: Date/time formatting, slot blocking logic, color utilities
- Depends on: None
- Used by: Hooks, components, API service

**API Layer (Backend serverless):**
- Purpose: Vercel serverless functions for backend operations
- Location: `api/`
- Contains: HTTP handlers with request validation, rate limiting, security headers, KV storage access
- Depends on: Vercel KV store, security middleware
- Used by: Client-side API service layer

**Security Layer:**
- Purpose: Request validation, rate limiting, CORS, injection prevention
- Location: `api/_lib/security.js`
- Contains: Security header middleware, sanitization functions, rate limiter, CORS handler
- Depends on: Vercel KV for rate limit tracking
- Used by: All API handlers via `withSecurity()` wrapper

## Data Flow

**Load Configuration:**

1. App mounts → ConfigContext calls `fetchConfig()`
2. If API enabled: tries `/api/config` → returns instance config or server falls back to default
3. If API disabled: returns `null` → ConfigContext uses FALLBACK_CONFIG
4. Config available via `useConfig()` hook throughout app

**Load Bookings:**

1. useBookings hook mounts → calls `fetchBookings()`
2. If API enabled: fetches from `/api/bookings` (KV store)
3. If API disabled: reads from localStorage
4. Sets state in component tree
5. Polling starts: every 7 seconds calls `fetchBookings()` again and updates state
6. Any error during polling triggers `triggerSync()` to refetch immediately

**Create Booking (Optimistic Update):**

1. User selects slot, user, duration
2. `createBooking()` immediately updates local state (optimistic)
3. In parallel: POST to `/api/bookings` with booking data
4. Server validates (checks for conflicts, sanitizes input, applies rate limit)
5. Server saves to KV store and returns success
6. If error: rollback local state and call `triggerSync()` to fetch server truth

**Update/Delete Booking:**

1. Similar optimistic update pattern
2. PUT/DELETE to `/api/bookings/update`
3. Server validates duration doesn't exceed bounds, checks for conflicts
4. Rollback on error with immediate sync

**Slot Status Determination:**

1. Component calls `getSlotStatus(dateKey, timeKey, hour)`
2. Hook checks:
   - Is there a direct booking at this timeKey?
   - Is this hour blocked by a multi-hour booking? (uses `isSlotBlocked()`)
3. Returns status ('available', 'booked', 'blocked') + booking info if applicable

**Multi-hour Booking Logic:**

1. When creating 2-3 hour booking at 10:00: occupies 10:00, 11:00, 12:00
2. 11:00 and 12:00 show as "blocked" (cannot be booked separately)
3. When checking duration availability: iterates all slots booking would occupy and rejects if any conflict
4. When updating duration: excludes current booking's slots from conflict check

**State Management:**

- Bookings state structure: `{ "2026-02-04": { "10:00": { user: "Jack", duration: 2 } } }`
- Config immutable (set once on app load)
- UI local state in App: currentDate, isWeekView, selectedSlot, selectedUser, focusedSlotIndex, selectedBooking
- Optimistic updates immediately reflect in UI, server confirms or rollback happens

## Key Abstractions

**Slot (TimeSlot):**
- Purpose: Represents single 1-hour time block in calendar
- Examples: `src/components/TimeSlot.jsx`, `src/utils/time.js::generateTimeSlots()`
- Pattern: Immutable object with { hour, time (formatted), key (HH:00), dateKey }
- Usage: Map over TIME_SLOTS array to render time strip

**Booking:**
- Purpose: Represents time slot(s) reserved by user
- Examples: Used throughout `useBookings()`, API handlers
- Pattern: Object { user (name string), duration (1-3 hours) }
- Storage structure: Nested by date then time → `bookings[dateKey][timeKey] = { user, duration }`

**Configuration:**
- Purpose: Instance-specific metadata (title, user list, slug)
- Examples: `src/context/ConfigContext.jsx`, API `/config` endpoint
- Pattern: Set once on app load, read-only thereafter via `useConfig()` hook
- Multi-instance support: Each deployment has INSTANCE_SLUG env var, KV keys namespaced to instance

**Slot Status:**
- Purpose: Determine availability state of time slot
- Examples: Used by `TimeSlot`, `BookingOverlay` components
- Pattern: Returned by `getSlotStatus(dateKey, timeKey, hour)` → { status: 'available'|'booked'|'blocked', booking?: {...} }

## Entry Points

**Frontend Entry:**
- Location: `src/main.jsx`
- Triggers: Browser loads index.html
- Responsibilities: Renders React root with ConfigProvider wrapper, loads App component

**API Entry Points:**

- **GET `/api/config`:** Location: `api/config.js`
  - Triggers: ConfigContext on app load
  - Responsibilities: Return instance config from KV or default config, applies rate limit

- **GET `/api/bookings`:** Location: `api/bookings/index.js`
  - Triggers: Initial load in useBookings, polling sync
  - Responsibilities: Return all bookings for instance from KV

- **POST `/api/bookings`:** Location: `api/bookings/index.js`
  - Triggers: User creates new booking
  - Responsibilities: Validate input, check conflicts, save to KV, return created booking

- **PUT `/api/bookings/update`:** Location: `api/bookings/update.js`
  - Triggers: User updates existing booking
  - Responsibilities: Validate updates, check duration conflicts, save to KV

- **DELETE `/api/bookings/update`:** Location: `api/bookings/update.js`
  - Triggers: User deletes booking
  - Responsibilities: Validate booking exists, delete from KV, cleanup empty date objects

## Error Handling

**Strategy:** Fail-open with fallback to localStorage when API unavailable

**Patterns:**

- **API Request Failure:** API service catches error, falls back to localStorage (if enabled)
- **Config Load Failure:** ConfigContext logs warning, uses FALLBACK_CONFIG
- **Booking Operation Failure:** Hook stores previous state, optimistic update reverts, `triggerSync()` called to fetch server truth, error logged to console
- **Polling Failure:** Silent failure (log warning only), next poll attempt continues
- **Rate Limit:** API returns 429, client shows error message
- **Input Validation:** Server sanitizes all string inputs (removes HTML, limits length), validates formats (dateKey YYYY-MM-DD, timeKey HH:00, duration 1-8)

## Cross-Cutting Concerns

**Logging:** Console methods (console.error, console.warn) used throughout for debugging. No centralized logger.

**Validation:**
- Client-side: Conflict checking in useBookings before sending request
- Server-side: Sanitization via `sanitizeBookingInput()`, format validation, conflict rechecked on server

**Authentication:** Not implemented. Assumes single-user or same-user-on-device model. First user in config treated as "current user" for highlighting.

**Real-time Sync:** Polling-based at 7-second intervals when API enabled. Graceful fallback to request-level sync on operations if polling fails.

---

*Architecture analysis: 2026-02-04*
