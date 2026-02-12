# ARCH-03: Polling & Real-Time Sync

**Status:** Implemented
**Category:** Data Synchronization
**Related:** ARCH-04 (State Management), API-01 (Booking API)

## Overview

The application uses **client-side polling** for multi-user real-time synchronization. This is a pull-based approach where each client periodically fetches the complete bookings state from the server to stay synchronized with changes made by other users.

**Why Polling (Not WebSockets):**
- **Simplicity:** Minimal implementation complexity for a low-concurrency booking application
- **Acceptable Latency:** Maximum 7-second delay to see other users' changes is acceptable for this use case
- **No Server State:** Server doesn't need to track connected clients or maintain WebSocket connections
- **Firewall Friendly:** Standard HTTP requests work everywhere without special configuration

**Rails Alternative:**
While this document describes a polling-based implementation, Rails developers could replace this with Action Cable (Rails' WebSocket framework) for push-based real-time updates. The core pattern remains valid -- polling is intentionally simple and effective for the expected usage scale.

---

## Polling Configuration

### Interval Timing

**Polling Interval:** 7000 milliseconds (7 seconds)
**Location:** Hardcoded constant `POLLING_INTERVAL` in client code
**Not Configurable:** No server endpoint or configuration file controls this value

The 7-second interval balances:
- **Responsiveness:** Users see other bookings within reasonable time
- **Server Load:** Avoids excessive requests when multiple users are active
- **Network Efficiency:** Minimizes unnecessary data transfer

### Enable/Disable Conditions

**Enabled When:**
- API mode is enabled (`VITE_USE_API=true` environment variable)
- Application has completed initial data load
- Application is running (not unmounted/closed)

**Disabled When:**
- localStorage fallback mode (`VITE_USE_API=false`)
- Application is loading configuration or initial bookings
- Application has been closed/unmounted

**No Dynamic Control:** Users cannot enable/disable polling during runtime. It's controlled entirely by the deployment environment configuration.

---

## Polling Lifecycle

### START: Application Load

1. Application renders and begins initialization
2. Configuration loads from API (`GET /api/config`)
3. Initial bookings load from API (`GET /api/bookings`)
4. Loading state completes
5. **Polling timer starts** -- first poll happens 7 seconds after startup

**Why After Initial Load:**
Polling requires an initial state to replace. Starting polling before initial data is available would cause unnecessary fetches.

### TICK: Every 7 Seconds

1. Timer fires exactly 7 seconds after previous tick
2. Execute background fetch: `GET /api/bookings`
3. If fetch succeeds and returns data (not null):
   - **Replace entire local bookings state** with server response
   - No diffing, no merging -- complete replacement
4. If fetch fails:
   - Log warning to console
   - Do NOT update local state
   - Do NOT show error to user
   - Continue polling (next tick happens in 7 seconds)

**No "Smart" Diffing:**
The polling implementation intentionally does NOT compare old state vs new state. It simply replaces the entire bookings object. This is correct because:
- Server is the single source of truth
- Catches ALL changes: creates, updates, deletes by any user
- Simpler than tracking individual booking changes
- Performance impact is negligible (bookings dataset is small)

### UPDATE: State Replacement

When polling receives new data:

```
Old State (local):
{
  "2026-02-14": {
    "07:00": { user: "Jack", duration: 1 }
  }
}

Server Response (from GET /api/bookings):
{
  "2026-02-14": {
    "07:00": { user: "Jack", duration: 1 },
    "08:00": { user: "Bonnie", duration: 2 }
  },
  "2026-02-15": {
    "10:00": { user: "Giuliano", duration: 1 }
  }
}

New State (after replacement):
{
  "2026-02-14": {
    "07:00": { user: "Jack", duration: 1 },
    "08:00": { user: "Bonnie", duration: 2 }
  },
  "2026-02-15": {
    "10:00": { user: "Giuliano", duration: 1 }
  }
}
```

**UI Impact:**
- Booking blocks appear/disappear instantly
- No loading spinner or "syncing" indicator
- User's view of the calendar updates silently in background
- If user is actively booking, their optimistic updates remain until confirmed or rolled back

### STOP: Application Unmount

1. User closes browser tab, navigates away, or application unmounts
2. Cleanup function executes
3. Polling timer is cancelled
4. No further background fetches occur

**No "Unload" Sync:**
When the application closes, there is NO final sync or "save before quit" behavior. All user actions are already persisted via the API during normal operation (see Optimistic Updates in ARCH-04).

---

## Error Handling

### Polling Errors Are NON-FATAL

**Philosophy:** Occasional network failures should not interrupt the user's experience. The application continues functioning with the last known good state.

### On Fetch Error

When a polling fetch fails (network error, server down, timeout):

1. **Log Warning:** `console.warn('Polling sync failed:', error.message)`
2. **No User Notification:** No error message, modal, or toast shown
3. **No State Change:** Local bookings remain unchanged
4. **Timer Continues:** Next poll happens in 7 seconds as scheduled

**User Experience:**
- User sees potentially stale data (maximum 7 seconds old, plus however long the server is unavailable)
- User can still create/update/delete bookings (optimistic updates work locally)
- When server returns, next successful poll restores accurate state

### No Retry Logic

**No Immediate Retry:** Failed polls do NOT trigger an immediate retry
**No Exponential Backoff:** Interval remains fixed at 7 seconds regardless of success/failure
**Rationale:** Simplicity. Network blips are self-correcting -- next scheduled poll will succeed when network returns.

### No Circuit Breaker

**No Failure Threshold:** Application does not track consecutive poll failures
**No Disable After N Failures:** Polling continues indefinitely as long as API mode is enabled
**Rationale:** Server downtime is expected to be temporary. Polling will automatically resume when server returns.

---

## Manual Sync (triggerSync)

### Purpose

`triggerSync()` is a function exposed by the polling mechanism that triggers an **immediate** fetch outside the normal 7-second polling cycle.

### When It Fires

**Automatic Usage (Internal):**
Used by the bookings management system to rollback failed optimistic updates:

1. User attempts to create booking -> POST fails with 409 (conflict) -> `triggerSync()` called
2. User attempts to update booking -> PUT fails with 409 (duration conflict) -> `triggerSync()` called
3. User attempts to delete booking -> DELETE fails with 404 (not found) -> `triggerSync()` called

**Manual Usage (Available but Not Exposed in UI):**
The function is exported and available for:
- Debug/testing purposes
- Future "Refresh" button implementation
- Recovery from known inconsistent state

### Behavior

1. Executes same fetch as regular polling tick: `GET /api/bookings`
2. If successful, replaces local state with server response
3. If fails, logs warning (same as regular poll error handling)
4. **Does NOT reset the polling timer** -- next scheduled poll still fires at its original time

**Example Timeline:**

```
0s:   Polling starts, next poll scheduled for 7s
2s:   User creates booking, POST fails, triggerSync() called
2.1s: Manual sync completes, state updated
7s:   Scheduled poll fires (not affected by manual sync)
14s:  Next scheduled poll
```

### Why Separate from Polling

Manual sync is needed because:
- **Error Recovery:** Optimistic updates need immediate rollback on conflict, can't wait up to 7 seconds
- **User Control:** Future features (refresh button) need on-demand sync
- **Testing:** Developers need ability to force sync during debugging

---

## Conflict Detection and Resolution

### No Explicit Client-Side Conflict Detection

The polling mechanism does NOT:
- Track version numbers or timestamps
- Compare local changes vs server changes
- Implement Last-Write-Wins or Operational Transform algorithms
- Use CRDTs (Conflict-free Replicated Data Types)

### Strategy: "Server Is Truth"

**Core Principle:**
Whatever the server returns during a poll becomes the local state. No questions asked.

**Why This Works:**
- Server enforces all business rules (uniqueness, duration conflicts, validation)
- Clients submit changes via API, which immediately validates
- Failed submissions trigger immediate sync (via `triggerSync()`)
- Successful submissions propagate to other clients via polling within 7 seconds

### Conflict Scenario: Concurrent Booking Attempts

**Setup:**
- User A and User B are both viewing the calendar
- Both see slot 07:00 on 2026-02-14 as available
- Both decide to book it at the same time

**Step-by-Step Resolution:**

**T=0s: User A clicks slot 07:00**
1. User A's browser: Optimistic update adds `{ "07:00": { user: "Jack", duration: 1 } }` to local state
2. User A sees the booking block appear instantly
3. Background: POST to `/api/bookings` begins

**T=0.5s: User A's POST completes (201 Created)**
4. Server validates and persists booking
5. Server now has: `{ "2026-02-14": { "07:00": { user: "Jack", duration: 1 } } }`
6. User A's client receives success response
7. No action needed (optimistic update was correct)

**T=1s: User B clicks slot 07:00**
8. User B's browser: Optimistic update adds `{ "07:00": { user: "Bonnie", duration: 1 } }` to local state
9. User B sees the booking block appear instantly (WRONG -- slot is already taken)
10. Background: POST to `/api/bookings` begins

**T=1.5s: User B's POST completes (409 Conflict)**
11. Server validates and detects: slot 07:00 already booked by Jack
12. Server returns `{ "error": "Slot already booked" }` with 409 status
13. User B's error handler executes
14. **Error displayed to User B:** "Slot already booked"
15. **triggerSync() called immediately**

**T=1.6s: User B's triggerSync completes**
16. GET `/api/bookings` returns server truth:
    ```json
    {
      "2026-02-14": {
        "07:00": { user: "Jack", duration: 1 }
      }
    }
    ```
17. **User B's local state replaced** with server response
18. User B sees Jack's booking appear, their own incorrect booking disappears
19. Conflict resolved

**T=7s: Next polling tick (User A)**
20. User A's scheduled poll fetches bookings
21. No change (User A already has correct state)

**T=8s: Next polling tick (User B)**
22. User B's scheduled poll fetches bookings
23. Receives Jack's booking again (already in correct state from triggerSync)

### Maximum Conflict Duration

**With triggerSync (typical):** Near-instant (< 1 second)
- Failed operation triggers immediate sync
- User sees correct state almost immediately

**Without triggerSync (if it didn't exist):** Maximum 7 seconds
- Next scheduled poll would correct the state
- User would see wrong state until then

### Why This Pattern Is Sufficient

For a booking application:
- **Low Write Frequency:** Users don't create dozens of bookings per second
- **Clear Winner:** First request to reach server wins (simple, fair)
- **Immediate Feedback:** User who loses sees error + corrected state instantly
- **No Data Loss:** Losing user just tries again with corrected view

This is NOT appropriate for:
- Real-time collaborative editing (Google Docs style)
- High-frequency trading or inventory systems
- Applications requiring offline-first capabilities

---

## Polling vs Initial Load

### Initial Load

**When:** Application startup, before polling begins
**Purpose:** Establish initial state
**Behavior:**
- Loading state set to `true`
- UI shows loading spinner or skeleton
- Fetch: `GET /api/bookings`
- On success: Set bookings state, set loading to `false`
- On error: Show error message to user (blocking)

**User Experience:** Clear loading indicator, user waits for data

### Polling

**When:** After initial load, every 7 seconds while application is running
**Purpose:** Keep state synchronized with server changes
**Behavior:**
- No loading state change
- UI remains interactive
- Fetch: `GET /api/bookings` (same endpoint as initial load)
- On success: Replace bookings state silently
- On error: Log warning, no user notification (non-blocking)

**User Experience:** Seamless background updates, no indication polling is happening

### Why Same Endpoint

Both use `GET /api/bookings` because:
- **Same Data Structure:** Both need the complete bookings object
- **Consistent Format:** No special "diff" or "changes since" endpoint needed
- **Simple Implementation:** One API endpoint, one data shape
- **Server Simplicity:** Server doesn't track "what changed" -- just returns current state

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ APPLICATION LOAD                                            │
└─────────────────────────────────────────────────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Initial Fetch   │
                  │ GET /api/bookings│
                  └─────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Set Bookings    │
                  │ State           │
                  └─────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Start Polling   │
                  │ Timer (7s)      │
                  └─────────────────┘
                            |
                            v
┌─────────────────────────────────────────────────────────────┐
│ POLLING LOOP (Every 7 seconds)                              │
└─────────────────────────────────────────────────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Timer Fires     │
                  └─────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Background Fetch│
                  │ GET /api/bookings│
                  └─────────────────┘
                            |
                ┌───────────┴───────────┐
                v                       v
        ┌──────────────┐        ┌──────────────┐
        │ Success?     │        │ Error?       │
        │ Data not null│        │              │
        └──────────────┘        └──────────────┘
                |                       |
                v                       v
        ┌──────────────┐        ┌──────────────┐
        │ Replace Local│        │ Log Warning  │
        │ Bookings     │        │ console.warn │
        │ State        │        └──────────────┘
        └──────────────┘                |
                |                       |
                └───────────┬───────────┘
                            v
                  ┌─────────────────┐
                  │ Continue Polling│
                  │ (Wait 7s)       │
                  └─────────────────┘
                            |
                            v
                    [Back to Timer Fires]

┌─────────────────────────────────────────────────────────────┐
│ MANUAL SYNC (Triggered by Error Recovery)                  │
└─────────────────────────────────────────────────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ triggerSync()   │
                  │ Called          │
                  └─────────────────┘
                            |
                            v
                  ┌─────────────────┐
                  │ Immediate Fetch │
                  │ GET /api/bookings│
                  └─────────────────┘
                            |
                ┌───────────┴───────────┐
                v                       v
        ┌──────────────┐        ┌──────────────┐
        │ Success?     │        │ Error?       │
        └──────────────┘        └──────────────┘
                |                       |
                v                       v
        ┌──────────────┐        ┌──────────────┐
        │ Replace Local│        │ Log Warning  │
        │ State        │        └──────────────┘
        └──────────────┘                |
                |                       |
                └───────────┬───────────┘
                            v
                  ┌─────────────────┐
                  │ Polling Timer   │
                  │ Unaffected      │
                  └─────────────────┘
```

---

## Implementation Notes for Rails

### Polling Mechanism

**Rails Equivalent:**
- JavaScript interval timer in the browser (same as current implementation)
- HTTP client library (e.g., `fetch`, `axios`, or Rails' built-in `fetch` in Turbo)
- Endpoint: `GET /bookings` (Rails controller action)

**No Server-Side Changes Needed:**
Polling is entirely client-side. Rails server only needs to provide the existing `GET /bookings` endpoint.

### Alternative: Action Cable (WebSockets)

If replacing polling with push-based sync:

1. **Server broadcasts** on booking changes:
   ```ruby
   # After booking create/update/delete
   ActionCable.server.broadcast('bookings_channel', {
     action: 'bookings_updated',
     bookings: Booking.all_as_json
   })
   ```

2. **Client subscribes** to channel:
   ```javascript
   consumer.subscriptions.create('BookingsChannel', {
     received(data) {
       // Replace local state with data.bookings
       setBookings(data.bookings);
     }
   });
   ```

3. **Remove polling code** -- updates are pushed instead

**Trade-offs:**
- **Pro:** Lower latency (instant updates vs 7-second delay)
- **Pro:** Lower server load (no periodic GET requests)
- **Con:** More complex (WebSocket connection management, reconnection logic)
- **Con:** Requires WebSocket support (usually fine, but polling works everywhere)

---

## Related Architecture Documents

- **ARCH-04: State Management** -- How polling updates integrate with application state
- **API-01: Booking API** -- Endpoint specifications for GET /api/bookings
- **ARCH-02: Data Persistence** -- Server-side data storage that polling reads from

---

## Technology Translation

**React Implementation:**
- `usePollingSync` custom hook with `useEffect` and `setInterval`
- `useRef` for interval ID to support cleanup
- Callback functions for fetch and state update

**Rails Implementation:**
- Standard browser JavaScript (no framework dependency)
- `setInterval` for timer
- `fetch` API for HTTP requests
- Event listeners or Stimulus controller for lifecycle management

The polling pattern is framework-agnostic. Any client-side JavaScript environment can implement it.
