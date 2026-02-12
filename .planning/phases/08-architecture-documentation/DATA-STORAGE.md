# Data Storage Schema (ARCH-01)

**Document ID:** ARCH-01
**Phase:** 08 - Architecture Documentation
**Created:** 2026-02-13
**Purpose:** Complete reference for data storage structure, keys, formats, and update patterns

---

## Overview

The booking application stores all persistent data in a key-value database (Vercel KV, Redis-compatible). This document defines the complete storage schema including key structure, data formats, validation patterns, and update semantics.

**Storage technology:** Vercel KV (Redis-compatible key-value store)
**Data format:** JSON values with string keys
**Persistence:** No TTL on data keys (configuration and bookings persist indefinitely)

---

## Key Structure

All keys follow a namespace pattern that isolates data by instance and resource type.

### Namespace Pattern

```
instance:{slug}:{resource}
```

- **`{slug}`** — Instance identifier (e.g., "cps-software")
- **`{resource}`** — Resource type (e.g., "config", "bookings")

### Key Types

| Key Pattern | Example | Purpose | TTL |
|-------------|---------|---------|-----|
| `instance:{slug}:config` | `instance:cps-software:config` | Instance configuration (title, users) | None (persists) |
| `instance:{slug}:bookings` | `instance:cps-software:bookings` | All bookings for instance | None (persists) |
| `ratelimit:{ip}` | `ratelimit:203.0.113.1` | API rate limiting counter | 120 seconds |

### Instance Isolation

Different `INSTANCE_SLUG` values create completely separate data namespaces:

- Instance "cps-software" → keys `instance:cps-software:config` and `instance:cps-software:bookings`
- Instance "other-team" → keys `instance:other-team:config` and `instance:other-team:bookings`
- No data sharing between instances
- Same KV database can host multiple isolated instances

---

## Config Data Schema

Configuration data defines instance identity, display title, and available users.

### Storage Key

```
instance:{slug}:config
```

### Data Structure

```json
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

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `slug` | string | Yes | Instance identifier (lowercase, alphanumeric + hyphens) |
| `title` | string | Yes | Display title for the instance |
| `users` | array | Yes | List of user objects (minimum 1, typically 2-6) |
| `createdAt` | string | Yes | ISO 8601 timestamp of instance creation |

### User Object Structure

```json
{
  "name": "Jack",
  "key": "j",
  "colorIndex": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's display name (max 100 characters) |
| `key` | string | Yes | Keyboard shortcut (single letter, unique within instance) |
| `colorIndex` | integer | No | Explicit color assignment (0-5). If absent, position in array determines color. |

### Key Assignment Rules

- Each user gets a single-letter keyboard shortcut
- Keys must be unique within the instance
- Keys are case-insensitive (stored lowercase)
- When preferred letter is taken, use alternative letter from name:
  - "John" uses "h" (because "j" is taken by "Jack")
  - "Joel" uses "l" (because "j" is taken by "Jack")

### Validation

- `slug`: `/^[a-z0-9-]+$/` (lowercase alphanumeric with hyphens)
- `title`: Non-empty string, max 200 characters
- `users`: Array with 1-20 user objects
- `user.key`: Single letter `/^[a-z]$/i`, unique within users array
- `createdAt`: Valid ISO 8601 timestamp

---

## Bookings Data Schema

Booking data is stored as a nested object organized by date and time.

### Storage Key

```
instance:{slug}:bookings
```

### Data Structure

```typescript
{
  [dateKey: string]: {
    [timeKey: string]: {
      user: string,
      duration: number
    }
  }
}
```

**Top-level:** Object keyed by date strings
**Second-level:** Object keyed by time strings
**Leaf values:** Booking objects with user and duration

### Concrete Example (Multiple Bookings)

```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  },
  "2026-02-15": {
    "09:00": { "user": "Giuliano", "duration": 3 },
    "16:00": { "user": "John", "duration": 1 }
  },
  "2026-02-16": {
    "10:00": { "user": "Rue", "duration": 1 }
  }
}
```

### Key Formats

#### dateKey Format

**Pattern:** `YYYY-MM-DD`
**Regex:** `/^\d{4}-\d{2}-\d{2}$/`
**Examples:**
- `"2026-02-14"` (February 14, 2026)
- `"2026-12-31"` (December 31, 2026)

**Rules:**
- Zero-padded month and day
- Gregorian calendar dates only
- Must be valid calendar date

#### timeKey Format

**Pattern:** `HH:00` (24-hour time)
**Regex:** `/^\d{2}:00$/`
**Examples:**
- `"07:00"` (7:00 AM)
- `"14:00"` (2:00 PM)
- `"21:00"` (9:00 PM)

**Rules:**
- Zero-padded hour (00-23)
- Always at the top of the hour (minutes always "00")
- Valid booking hours: 06-21 (6 AM to 9 PM start times)

### Booking Object Structure

```json
{
  "user": "Jack",
  "duration": 2
}
```

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `user` | string | Max 100 chars, non-empty | User name (must match configured user) |
| `duration` | integer | 1-8 | Number of hours booked |

### Multi-Hour Booking Representation

**Critical:** Multi-hour bookings create only ONE record at the start time.

**Example:** Booking at 07:00 with duration 3

```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 3 }
  }
}
```

**This booking occupies:**
- 07:00 slot (has booking record)
- 08:00 slot (blocked by 07:00 booking, no record)
- 09:00 slot (blocked by 07:00 booking, no record)

**Slot status calculation:**
- 07:00 → Status: "booked" (has record)
- 08:00 → Status: "blocked" (inside range of 07:00 booking)
- 09:00 → Status: "blocked" (inside range of 07:00 booking)
- 10:00 → Status: "available" (outside range)

**Blocking logic:**

A slot at hour H is "blocked" if there exists a booking at hour B where:
- B < H (booking started earlier)
- H < (B + duration) (current hour is within booking's range)

---

## Empty States

### No Bookings At All

```json
{}
```

When no bookings have ever been created, the entire bookings object is an empty object.

### Date With No Bookings

**Structure:**

```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
  // Note: 2026-02-15 is absent (not present in object)
}
```

If a date has never had bookings, the dateKey is absent from the top-level object.

### All Bookings Deleted for a Date

**Behavior:** When the last booking for a date is deleted, the dateKey is removed from the object.

**Before delete:**

```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 1 }
  }
}
```

**After deleting the 07:00 booking:**

```json
{}
```

**Implementation:** Delete handler explicitly removes empty date objects after deletion.

---

## Update Pattern: Read-Modify-Write

All booking operations follow a read-modify-write pattern on the entire bookings object.

### Pattern Steps

1. **Read:** Fetch entire bookings object from KV (`kv.get(key)`)
2. **Modify:** Transform object in memory (add/update/delete booking)
3. **Write:** Replace entire bookings object in KV (`kv.set(key, bookings)`)

### Characteristics

- **No partial updates:** Entire object is replaced on each write
- **No TTL:** Data persists indefinitely until explicitly deleted
- **No transactions:** Single operation per request
- **No locking:** Last write wins

### Concurrency Implications

**Scenario:** Two users create bookings for different time slots simultaneously

1. User A reads bookings object (contains booking X)
2. User B reads bookings object (contains booking X)
3. User A adds booking Y, writes object (now contains X, Y)
4. User B adds booking Z, writes object (now contains X, Z)
5. **Result:** Booking Y is lost (User B's write overwrote User A's changes)

**Acceptable for this application because:**
- Low concurrency (small teams, 2-6 users)
- Conflict detection happens during read (slot already booked errors)
- 7-second polling recovers from conflicts automatically
- Users see conflicts within seconds and can retry

**Not acceptable for:**
- High-concurrency systems (10+ simultaneous users)
- Financial transactions (must not lose writes)
- Systems without real-time sync

### Example: Create Booking

**Operation:** Add new booking at 2026-02-14 14:00

**Read:**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
}
```

**Modify (in memory):**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 },
    "14:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

**Write:** Replace entire object with modified version

### Example: Delete Booking

**Operation:** Delete booking at 2026-02-14 07:00

**Read:**
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
}
```

**Modify (in memory):**
```javascript
delete bookings["2026-02-14"]["07:00"];
// Check if date is now empty
if (Object.keys(bookings["2026-02-14"]).length === 0) {
  delete bookings["2026-02-14"];
}
// Result: {}
```

**Write:** Replace entire object with cleaned-up version

---

## Date/Time Format Reference

Consolidated reference for all date/time formats used in storage and display.

| Context | Format | Example | Description |
|---------|--------|---------|-------------|
| **Storage dateKey** | YYYY-MM-DD | `"2026-02-14"` | ISO 8601 date, top-level key in bookings object |
| **Storage timeKey** | HH:00 | `"07:00"`, `"14:00"` | 24-hour time, zero-padded, second-level key in bookings object |
| **Display date (long)** | Full weekday, month day, year | "Wednesday, February 14, 2026" | Header and date navigation |
| **Display date (short)** | Abbreviated weekday, month day | "Wed, Feb 14" | Week view column headers |
| **Display time** | H:00 AM/PM | "7:00 AM", "2:00 PM" | Time slot labels in calendar |
| **Config createdAt** | ISO 8601 with milliseconds | `"2026-02-13T00:00:00.000Z"` | Timestamp fields |

### Timezone Handling

**Storage timezone:** Queensland (AEST, UTC+10)
**Display timezone:** Queensland (default) or New South Wales (optional, UTC+11 during DST)

**Critical rules:**
1. All stored dates/times are in Queensland timezone
2. NSW display mode adds +1 hour to display ONLY (storage unchanged)
3. Timezone toggle is a display preference only
4. No timezone conversion happens in the data layer

**Example:**

Booking stored as:
```json
{
  "2026-02-14": {
    "07:00": { "user": "Jack", "duration": 1 }
  }
}
```

**Display in QLD mode:** "7:00 AM"
**Display in NSW mode:** "8:00 AM" (during DST)
**Storage remains:** `"07:00"` (unchanged)

---

## Validation Patterns

### dateKey Validation

```javascript
const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;
const isValidDateKey = (key) => {
  if (!dateKeyRegex.test(key)) return false;
  // Additional: verify valid calendar date
  const date = new Date(key);
  return date.toISOString().startsWith(key);
};
```

### timeKey Validation

```javascript
const timeKeyRegex = /^\d{2}:00$/;
const isValidTimeKey = (key) => {
  if (!timeKeyRegex.test(key)) return false;
  const hour = parseInt(key.substring(0, 2), 10);
  return hour >= 0 && hour <= 23;
};
```

### Booking Hours Validation

```javascript
const START_HOUR = 6;   // 6:00 AM
const END_HOUR = 22;    // 10:00 PM (last start time is 9 PM)

const isValidBookingHour = (hour) => {
  return hour >= START_HOUR && hour < END_HOUR;
};
```

### User Name Validation

```javascript
const sanitizeUserName = (name) => {
  return name
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .replace(/[<>'"]/g, '')   // Remove injection characters
    .trim()
    .slice(0, 100);           // Limit length
};
```

### Duration Validation

```javascript
const isValidDuration = (duration) => {
  const dur = parseInt(duration, 10);
  return Number.isInteger(dur) && dur >= 1 && dur <= 8;
};
```

---

## Conflict Detection

Booking conflicts occur when multiple bookings attempt to occupy the same time slot.

### Slot Already Booked

**Check:** Does a booking record exist at the target timeKey?

```javascript
const isSlotBooked = (bookings, dateKey, timeKey) => {
  return bookings[dateKey] && bookings[dateKey][timeKey];
};
```

### Duration Overlap Detection

**Check:** For multi-hour bookings, verify ALL occupied slots are available.

```javascript
const checkDurationConflict = (bookings, dateKey, startHour, duration) => {
  for (let i = 0; i < duration; i++) {
    const hour = startHour + i;
    const timeKey = hour.toString().padStart(2, '0') + ':00';

    if (bookings[dateKey] && bookings[dateKey][timeKey]) {
      return { conflict: true, conflictHour: hour, conflictKey: timeKey };
    }
  }
  return { conflict: false };
};
```

**Example:**

Attempting to create booking at 08:00 with duration 2:
- Check 08:00 → available
- Check 09:00 → **booked**
- Reject: "Slot 09:00 conflicts with booking duration"

### Existing Booking Blocks New Booking

**Check:** Does an earlier multi-hour booking extend into the target slot?

```javascript
const isSlotBlocked = (bookings, dateKey, targetHour) => {
  if (!bookings[dateKey]) return false;

  for (const [timeKey, booking] of Object.entries(bookings[dateKey])) {
    const bookingHour = parseInt(timeKey.substring(0, 2), 10);
    const bookingEnd = bookingHour + booking.duration;

    if (targetHour > bookingHour && targetHour < bookingEnd) {
      return { blocked: true, booking, bookingHour, startKey: timeKey };
    }
  }
  return { blocked: false };
};
```

**Example:**

Existing booking at 07:00 with duration 3 (occupies 07:00, 08:00, 09:00):
- Slot 07:00 → booked (has record)
- Slot 08:00 → blocked (inside 07:00 booking's range)
- Slot 09:00 → blocked (inside 07:00 booking's range)
- Slot 10:00 → available (outside range)

---

## Rate Limiting (Separate Namespace)

API endpoints use rate limiting with temporary KV keys.

### Rate Limit Key

```
ratelimit:{ip}
```

**Example:** `ratelimit:203.0.113.1`

### Rate Limit Data

```json
{
  "count": 45,
  "windowStart": 1739404321000
}
```

| Field | Type | Description |
|-------|------|-------------|
| `count` | integer | Number of requests in current window |
| `windowStart` | integer | Unix timestamp (milliseconds) of window start |

### Rate Limit Configuration

- **Window:** 60 seconds (rolling window)
- **Limit:** 60 requests per minute per IP
- **TTL:** 120 seconds (allows window expiration)
- **Action on limit:** Return 429 Too Many Requests

### Behavior

1. Extract client IP from X-Forwarded-For or X-Real-IP header
2. Construct key `ratelimit:{ip}`
3. Read current count/window from KV
4. If window expired (> 60s old), reset to count=1
5. Otherwise, increment count
6. Write updated count with 120s TTL
7. If count > 60, reject request
8. Otherwise, allow request and return remaining count

---

## Cross-References

**Related documents:**
- [INSTANCE-CONFIG.md](./INSTANCE-CONFIG.md) — Environment variables, INSTANCE_SLUG configuration
- [API Contracts](./API-CONTRACTS.md) — HTTP endpoints that read/write this data
- [State Management](./STATE-MANAGEMENT.md) — How frontend caches and syncs this data

**Source files:**
- `api/bookings/index.js` — Implements read and create operations
- `api/bookings/update.js` — Implements update and delete operations
- `api/config.js` — Implements config read operation
- `api/_lib/security.js` — Implements sanitization and validation

---

## Summary

**Key storage:** Namespace pattern `instance:{slug}:{resource}` isolates instances
**Config structure:** JSON object with slug, title, users array, createdAt timestamp
**Booking structure:** Nested object `{ [dateKey]: { [timeKey]: { user, duration } } }`
**Multi-hour bookings:** Single record at start time, duration field indicates occupied range
**Update pattern:** Read-modify-write on entire object, last write wins, no locking
**Conflict detection:** Check slot availability AND duration overlap before creating bookings
**Empty states:** Empty object `{}` when no bookings, absent dateKey when date has no bookings
**Validation:** Regex patterns for dateKey (YYYY-MM-DD) and timeKey (HH:00), range checks for duration (1-8)

---

*Document version: 1.0*
*Last updated: 2026-02-13*
*Phase: 08-architecture-documentation*
