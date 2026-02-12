# API Contracts

**Specification ID:** ARCH-02
**Last Updated:** 2026-02-13
**Purpose:** Complete API endpoint documentation for Rails reimplementation
**Source:** Extracted from api/config.js, api/bookings/index.js, api/bookings/update.js, api/_lib/security.js

## Overview

The booking system exposes 5 API operations across 3 endpoint paths. All endpoints are JSON-based, wrapped with security middleware, and use Vercel KV for persistent storage.

**Base Configuration:**
- Base URL: `/api` (relative, same origin)
- Content-Type: `application/json` for all requests and responses
- Authentication: None (public API)
- Security: All endpoints wrapped with `withSecurity()` middleware
- Storage: Vercel KV with instance-scoped keys

**Operations:**
1. `GET /api/config` - Retrieve instance configuration
2. `GET /api/bookings` - Retrieve all bookings
3. `POST /api/bookings` - Create a new booking
4. `PUT /api/bookings/update` - Update an existing booking
5. `DELETE /api/bookings/update` - Delete a booking

## Security Middleware (Cross-Cutting Concerns)

All API endpoints are wrapped with `withSecurity(handler)`, which applies the following security measures in order:

### 1. Security Headers

Set on every response, regardless of success or failure:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### 2. CORS (Cross-Origin Resource Sharing)

**Allowed Methods:**
```
GET, POST, PUT, DELETE, OPTIONS
```

**Allowed Headers:**
```
Content-Type, Authorization
```

**Max-Age:**
```
86400 (24 hours)
```

**Origin Handling:**

1. **No origin header** (same-origin requests, curl, etc.):
   - Response: `Access-Control-Allow-Origin: *`

2. **Explicitly allowed origins:**
   - `http://localhost:5173`
   - `http://localhost:3000`
   - Any domain ending in `.vercel.app`
   - Response: `Access-Control-Allow-Origin: {requesting-origin}`

3. **Unlisted origins:**
   - Permissive fallback: Request is allowed
   - Warning logged: `CORS: Allowing unlisted origin: {origin}`
   - Response: `Access-Control-Allow-Origin: {requesting-origin}`

**Preflight Handling:**
- `OPTIONS` requests receive 200 status with CORS headers
- No body returned
- Request processing stops (handler not invoked)

### 3. Rate Limiting

**Configuration:**
- Window: 60 seconds (rolling window)
- Limit: 60 requests per minute per IP
- Storage: Vercel KV key `ratelimit:{ip}` with 120-second TTL

**IP Detection (in order of precedence):**
1. `X-Forwarded-For` header (first entry, comma-separated list)
2. `X-Real-IP` header
3. Fallback: `"unknown"`

**Rate Limit State Management:**
- Current window tracked with `{ count: N, windowStart: timestamp }`
- Window resets if `windowStart < (now - 60000)`
- Count incremented on each request within window
- State saved to KV with 120-second expiry (2x window size)

**Response Headers:**
- All responses include: `X-RateLimit-Remaining: {remaining}`
- Remaining calculated as: `max(0, 60 - count)`

**Rate Limit Exceeded:**
- Status: 429 Too Many Requests
- Body: `{ "error": "Too many requests. Please try again later." }`
- Request processing stops (handler not invoked)

**Error Handling:**
- If rate limit check fails (KV error, etc.): Request is allowed (fail-open)
- Error logged to console
- Response includes: `X-RateLimit-Remaining: 60`

### 4. Input Sanitization

All booking endpoints use `sanitizeBookingInput(body)` to sanitize user input before validation.

**Field: `dateKey`**
- Expected format: `YYYY-MM-DD`
- Validation: Must match regex `/^\d{4}-\d{2}-\d{2}$/`
- If invalid: Set to `null`

**Field: `timeKey`**
- Expected format: `HH:00` (two-digit hour)
- Validation: Must match regex `/^\d{2}:00$/`
- If invalid: Set to `null`

**Field: `user`**
- Type: String
- Sanitization steps:
  1. Remove all HTML tags: `/<[^>]*>/g`
  2. Remove injection characters: `/[<>'"]/g`
  3. Trim whitespace
  4. Truncate to 100 characters
- If not a string: Return unchanged

**Field: `duration`**
- Type: Integer
- Validation: Must be 1-8 (inclusive)
- Parse: `parseInt(value, 10)`
- If invalid: Set to `null`

**Field: `updates.user`** (for PUT operations)
- Same sanitization as `user`

**Field: `updates.duration`** (for PUT operations)
- Same validation as `duration`

**Sanitized Output:**
All fields returned in a new object. Unsanitized fields not present in output. Fields that fail validation become `null`.

## Endpoint: GET /api/config

**Purpose:** Retrieve instance configuration (title, user roster).

### Request

**Method:** `GET`
**Path:** `/api/config`
**Body:** None
**Query Parameters:** None

### Response

**Success: 200 OK**

Returns the configuration object. If no configuration exists in KV, returns hardcoded default.

**Default Configuration Structure:**
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
  "createdAt": "2026-02-13T10:30:00.000Z"
}
```

**Field Definitions:**
- `slug` (string): Instance identifier, sourced from `process.env.INSTANCE_SLUG` or defaults to `"cps-software"`
- `title` (string): Display title for the booking interface
- `users` (array): List of user objects with `name` and `key` (keyboard shortcut)
- `createdAt` (string): ISO 8601 timestamp of config creation

**Error: 405 Method Not Allowed**

Returned if any method other than GET is used.

```json
{
  "error": "Method not allowed"
}
```

**Error: 500 Internal Server Error**

Returned if KV fetch fails.

```json
{
  "error": "Failed to fetch configuration"
}
```

### Implementation Details

**KV Key Construction:**
```javascript
const slug = process.env.INSTANCE_SLUG || 'cps-software';
const key = `instance:${slug}:config`;
```

**Fetch Logic:**
1. Attempt to fetch config from KV using constructed key
2. If `null`, generate default config with current timestamp
3. Return config as JSON

**Environment Variable:**
- `INSTANCE_SLUG`: Optional, defaults to `"cps-software"` if not set

## Endpoint: GET /api/bookings

**Purpose:** Retrieve all bookings for all dates.

### Request

**Method:** `GET`
**Path:** `/api/bookings`
**Body:** None
**Query Parameters:** None

### Response

**Success: 200 OK**

Returns nested object of bookings, organized by date and time. If no bookings exist, returns empty object.

**Empty State:**
```json
{}
```

**With Bookings:**
```json
{
  "2026-02-13": {
    "07:00": {
      "user": "Jack",
      "duration": 2
    },
    "09:00": {
      "user": "Bonnie",
      "duration": 1
    },
    "14:00": {
      "user": "Giuliano",
      "duration": 3
    }
  },
  "2026-02-14": {
    "08:00": {
      "user": "John",
      "duration": 1
    }
  }
}
```

**Structure:**
- Top level: Date keys in `YYYY-MM-DD` format
- Second level: Time keys in `HH:00` format
- Third level: Booking object with `user` (string) and `duration` (integer 1-8)

**Error: 500 Internal Server Error**

Returned if KV fetch fails.

```json
{
  "error": "Internal server error"
}
```

### Implementation Details

**KV Key Construction:**
```javascript
const slug = process.env.INSTANCE_SLUG || 'cps-software';
const key = `instance:${slug}:bookings`;
```

**Fetch Logic:**
1. Attempt to fetch bookings from KV
2. If `null`, return `{}`
3. Otherwise return bookings object as-is

## Endpoint: POST /api/bookings

**Purpose:** Create a new booking at a specified date and time.

### Request

**Method:** `POST`
**Path:** `/api/bookings`
**Content-Type:** `application/json`

**Body:**
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "user": "Jack",
  "duration": 2
}
```

**Field Definitions:**
- `dateKey` (string, required): Date in `YYYY-MM-DD` format
- `timeKey` (string, required): Start hour in `HH:00` format
- `user` (string, required): Name of person making booking (max 100 chars after sanitization)
- `duration` (integer, required): Number of hours (1-8)

### Response

**Success: 201 Created**

Booking created successfully.

```json
{
  "success": true,
  "booking": {
    "dateKey": "2026-02-13",
    "timeKey": "07:00",
    "user": "Jack",
    "duration": 2
  }
}
```

**Error: 400 Bad Request**

One or more required fields missing or invalid after sanitization.

```json
{
  "error": "Missing or invalid fields: dateKey, timeKey, user, duration"
}
```

**Triggers:**
- `dateKey` is null (failed regex `/^\d{4}-\d{2}-\d{2}$/`)
- `timeKey` is null (failed regex `/^\d{2}:00$/`)
- `user` is empty after sanitization
- `duration` is null (not in range 1-8)

**Error: 409 Conflict**

Start slot already booked:

```json
{
  "error": "Slot already booked"
}
```

Duration conflicts with existing booking:

```json
{
  "error": "Slot 08:00 conflicts with booking duration"
}
```

**Error: 500 Internal Server Error**

KV operation failed.

```json
{
  "error": "Internal server error"
}
```

### Implementation Details

**Processing Steps:**

1. **Sanitize Input:**
   - Apply `sanitizeBookingInput()` to request body
   - Extract `{ dateKey, timeKey, user, duration }`

2. **Validate Required Fields:**
   - Check all four fields are truthy after sanitization
   - Return 400 if any are null/empty

3. **Fetch Current Bookings:**
   - Fetch from KV using `instance:{slug}:bookings`
   - Default to `{}` if null

4. **Initialize Date:**
   - If `bookings[dateKey]` doesn't exist, create empty object
   - `bookings[dateKey] = {}`

5. **Check Start Slot:**
   - If `bookings[dateKey][timeKey]` exists, return 409 "Slot already booked"

6. **Check Duration Conflicts:**
   - Parse start hour: `parseInt(timeKey.split(':')[0], 10)`
   - Loop from `i = 1` to `i < duration`
   - For each iteration:
     - Calculate check hour: `startHour + i`
     - Format as `HH:00`: `checkHour.toString().padStart(2, '0') + ':00'`
     - If `bookings[dateKey][checkKey]` exists, return 409 with specific slot

7. **Create Booking:**
   - Set `bookings[dateKey][timeKey] = { user, duration }`

8. **Save to KV:**
   - Write entire bookings object back to KV

9. **Return Success:**
   - Status 201 with booking details

### Conflict Detection Examples

**Scenario 1: Start Slot Already Booked**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 1 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "user": "Bonnie",
  "duration": 1
}
```

Response: `409 { "error": "Slot already booked" }`

**Scenario 2: Duration Conflicts with Existing Booking**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
}
```

The booking at 07:00 with duration 2 occupies slots 07:00 and 08:00.

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "08:00",
  "user": "Bonnie",
  "duration": 1
}
```

Response: `409 { "error": "Slot already booked" }`

(08:00 start slot is directly occupied by Jack's booking)

**Scenario 3: New Booking Duration Overlaps Existing**

Existing state:
```json
{
  "2026-02-13": {
    "09:00": { "user": "Jack", "duration": 1 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "user": "Bonnie",
  "duration": 3
}
```

New booking would occupy 07:00, 08:00, 09:00. Slot 09:00 conflicts.

Response: `409 { "error": "Slot 09:00 conflicts with booking duration" }`

**Scenario 4: Successful Multi-Hour Booking**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 },
    "11:00": { "user": "John", "duration": 1 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "09:00",
  "user": "Bonnie",
  "duration": 2
}
```

Check: 09:00 (not booked), 10:00 (not booked). Success.

Response: `201 { "success": true, "booking": {...} }`

## Endpoint: PUT /api/bookings/update

**Purpose:** Update an existing booking (change user and/or duration).

### Request

**Method:** `PUT`
**Path:** `/api/bookings/update`
**Content-Type:** `application/json`

**Body:**
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": {
    "user": "Bonnie",
    "duration": 3
  }
}
```

**Field Definitions:**
- `dateKey` (string, required): Date of existing booking
- `timeKey` (string, required): Start time of existing booking
- `updates` (object, required): Fields to update
  - `updates.user` (string, optional): New user name
  - `updates.duration` (integer, optional): New duration (1-8)

**Partial Updates Allowed:**
- Can update `user` only
- Can update `duration` only
- Can update both

### Response

**Success: 200 OK**

Booking updated successfully. Returns merged booking object.

```json
{
  "success": true,
  "booking": {
    "user": "Bonnie",
    "duration": 3
  }
}
```

**Error: 400 Bad Request**

Missing or invalid required fields.

```json
{
  "error": "Missing or invalid fields: dateKey, timeKey, updates"
}
```

**Triggers:**
- `dateKey` is null after sanitization
- `timeKey` is null after sanitization
- `updates` is not present or falsy

**Error: 404 Not Found**

Booking does not exist at specified date and time.

```json
{
  "error": "Booking not found"
}
```

**Triggers:**
- `bookings[dateKey]` doesn't exist
- `bookings[dateKey][timeKey]` doesn't exist

**Error: 409 Conflict**

Cannot extend duration because new slots are already booked.

```json
{
  "error": "Cannot extend: slot 09:00 is already booked"
}
```

**Error: 500 Internal Server Error**

KV operation failed.

```json
{
  "error": "Internal server error"
}
```

### Implementation Details

**Processing Steps:**

1. **Sanitize Input:**
   - Apply `sanitizeBookingInput()` to request body
   - Extract `{ dateKey, timeKey, updates }`

2. **Validate Required Fields:**
   - Check `dateKey`, `timeKey`, and `updates` are truthy
   - Return 400 if any are null/empty

3. **Fetch Current Bookings:**
   - Fetch from KV
   - Default to `{}` if null

4. **Check Booking Exists:**
   - Verify `bookings[dateKey]` exists
   - Verify `bookings[dateKey][timeKey]` exists
   - Return 404 if not found

5. **Get Current Booking:**
   - `currentBooking = bookings[dateKey][timeKey]`

6. **Duration Change Conflict Check:**
   - Check if `updates.duration` is present AND different from `currentBooking.duration`
   - If YES:
     - Parse start hour from `timeKey`
     - Loop from `i = currentBooking.duration` to `i < updates.duration`
     - For each iteration:
       - Calculate check hour: `startHour + i`
       - Format as `HH:00`
       - If `bookings[dateKey][checkKey]` exists, return 409 with specific slot
   - If NO: Skip conflict check (shrinking duration or user-only change)

7. **Merge Updates:**
   - `bookings[dateKey][timeKey] = { ...currentBooking, ...updates }`

8. **Save to KV:**
   - Write entire bookings object back

9. **Return Success:**
   - Status 200 with merged booking

### Duration Change Conflict Detection

**Critical Behavior: Only NEW slots are checked for conflicts.**

The current booking's occupied slots are implicitly excluded from conflict detection because the loop starts at `currentBooking.duration` (the first NEW slot).

**Example 1: Extending Duration (Conflict)**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 },
    "09:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

Jack's booking occupies 07:00 and 08:00.

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "duration": 3 }
}
```

Conflict check:
- Current duration: 2
- New duration: 3
- Loop: `i = 2` to `i < 3` (one iteration)
- Check slot: 07:00 + 2 = 09:00
- 09:00 is booked by Bonnie

Response: `409 { "error": "Cannot extend: slot 09:00 is already booked" }`

**Example 2: Extending Duration (Success)**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "duration": 4 }
}
```

Conflict check:
- Current duration: 2
- New duration: 4
- Loop: `i = 2` to `i < 4` (two iterations)
- Check slot 09:00: Not booked ✓
- Check slot 10:00: Not booked ✓

Response: `200 { "success": true, "booking": { "user": "Jack", "duration": 4 } }`

**Example 3: Shrinking Duration (No Check)**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 4 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "duration": 2 }
}
```

Conflict check:
- Current duration: 4
- New duration: 2
- Loop condition: `i = 4` to `i < 2` (never executes)
- No slots checked

Response: `200 { "success": true, "booking": { "user": "Jack", "duration": 2 } }`

**Example 4: User-Only Change (No Check)**

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "user": "Bonnie" }
}
```

Conflict check:
- `updates.duration` is not present
- Check skipped entirely

Response: `200 { "success": true, "booking": { "user": "Bonnie", "duration": 2 } }`

## Endpoint: DELETE /api/bookings/update

**Purpose:** Delete an existing booking.

### Request

**Method:** `DELETE`
**Path:** `/api/bookings/update`
**Content-Type:** `application/json`

**Body:**
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00"
}
```

**Field Definitions:**
- `dateKey` (string, required): Date of booking to delete
- `timeKey` (string, required): Start time of booking to delete

### Response

**Success: 200 OK**

Booking deleted successfully.

```json
{
  "success": true
}
```

**Error: 400 Bad Request**

Missing or invalid required fields.

```json
{
  "error": "Missing or invalid fields: dateKey, timeKey"
}
```

**Triggers:**
- `dateKey` is null after sanitization
- `timeKey` is null after sanitization

**Error: 404 Not Found**

Booking does not exist at specified date and time.

```json
{
  "error": "Booking not found"
}
```

**Triggers:**
- `bookings[dateKey]` doesn't exist
- `bookings[dateKey][timeKey]` doesn't exist

**Error: 500 Internal Server Error**

KV operation failed.

```json
{
  "error": "Internal server error"
}
```

### Implementation Details

**Processing Steps:**

1. **Sanitize Input:**
   - Apply `sanitizeBookingInput()` to request body
   - Extract `{ dateKey, timeKey }`

2. **Validate Required Fields:**
   - Check `dateKey` and `timeKey` are truthy
   - Return 400 if either is null/empty

3. **Fetch Current Bookings:**
   - Fetch from KV
   - Default to `{}` if null

4. **Check Booking Exists:**
   - Verify `bookings[dateKey]` exists
   - Verify `bookings[dateKey][timeKey]` exists
   - Return 404 if not found

5. **Delete Booking:**
   - `delete bookings[dateKey][timeKey]`

6. **Cleanup Empty Date:**
   - Check if `Object.keys(bookings[dateKey]).length === 0`
   - If YES: `delete bookings[dateKey]`
   - This prevents empty date objects from accumulating in storage

7. **Save to KV:**
   - Write entire bookings object back

8. **Return Success:**
   - Status 200 with `{ success: true }`

### Date Cleanup Example

**Before Delete:**
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 1 }
  },
  "2026-02-14": {
    "08:00": { "user": "Bonnie", "duration": 2 },
    "10:00": { "user": "John", "duration": 1 }
  }
}
```

**Request:**
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00"
}
```

**After Delete:**
```json
{
  "2026-02-14": {
    "08:00": { "user": "Bonnie", "duration": 2 },
    "10:00": { "user": "John", "duration": 1 }
  }
}
```

The `"2026-02-13"` key is completely removed because it had no remaining bookings.

## Edge Cases and Scenarios

### 1. Multi-Hour Booking at End of Day

**Scenario:** User attempts to book duration that extends beyond business hours.

**Implementation Note:** The current API does NOT validate against business hours. The frontend enforces this constraint. If `duration: 8` is requested for `timeKey: "07:00"`, it will succeed and occupy 07:00 through 14:00.

**Expected Rails Behavior:** Match the API implementation (no validation). Business hours enforcement remains a frontend concern.

### 2. Concurrent Booking Attempts

**Scenario:** Two users attempt to book the same slot simultaneously.

**Behavior:**
- Both requests reach API at nearly the same time
- First request to complete the KV write transaction wins
- Second request fetches bookings, sees slot occupied, returns 409

**Example Timeline:**
```
t=0ms:  User A POST 07:00 → Read KV (empty)
t=1ms:  User B POST 07:00 → Read KV (empty)
t=2ms:  User A → Check conflicts (none) → Write KV → 201 Success
t=3ms:  User B → Check conflicts (sees User A) → 409 Conflict
```

**Critical Implementation Detail:** This race condition protection relies on KV's atomic read-write semantics. Rails implementation must use database transactions or equivalent locking to prevent double-booking.

### 3. Extending Duration into Occupied Slot

**Scenario:** User extends an existing booking, new duration overlaps with another booking.

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 2 },
    "10:00": { "user": "Bonnie", "duration": 1 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "duration": 4 }
}
```

Jack's booking currently occupies 07:00-08:00. Extension to duration 4 would occupy 07:00-10:00. Slot 10:00 is occupied by Bonnie.

Conflict check:
- Loop: `i = 2` to `i < 4`
- Check 09:00: Empty ✓
- Check 10:00: Occupied by Bonnie ✗

Response: `409 { "error": "Cannot extend: slot 10:00 is already booked" }`

### 4. Shrinking Duration (Always Succeeds)

**Scenario:** User reduces booking duration. No conflict check performed.

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 5 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "duration": 1 }
}
```

Conflict check:
- Loop condition: `i = 5` to `i < 1` (never executes)

Response: `200 { "success": true, "booking": { "user": "Jack", "duration": 1 } }`

**Released Slots:** 08:00, 09:00, 10:00, 11:00 become available immediately.

### 5. Changing User on Existing Booking

**Scenario:** User field is updated without changing duration.

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 3 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "updates": { "user": "Giuliano" }
}
```

Behavior:
- No validation that "Giuliano" exists in user roster
- No conflict check (duration unchanged)
- User field directly replaced

Response: `200 { "success": true, "booking": { "user": "Giuliano", "duration": 3 } }`

**Implementation Note:** User validation against roster is a frontend concern, not enforced by API.

### 6. Deleting Last Booking for a Date

**Scenario:** After deletion, date has no remaining bookings.

Existing state:
```json
{
  "2026-02-13": {
    "07:00": { "user": "Jack", "duration": 1 }
  },
  "2026-02-14": {
    "08:00": { "user": "Bonnie", "duration": 2 }
  }
}
```

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00"
}
```

After deletion:
```json
{
  "2026-02-14": {
    "08:00": { "user": "Bonnie", "duration": 2 }
  }
}
```

Date key `"2026-02-13"` is completely removed via cleanup logic.

### 7. HTML Injection in User Field

**Scenario:** Malicious user attempts to inject HTML/script tags.

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "user": "<script>alert('xss')</script>Jack<b>Bold</b>",
  "duration": 1
}
```

Sanitization:
1. Remove HTML tags: `/<[^>]*>/g` → `alert('xss')JackBold`
2. Remove injection chars: `/[<>'"]/g` → `alert(xss)JackBold`
3. Trim and truncate to 100 chars

Sanitized: `"alert(xss)JackBold"`

Stored in KV:
```json
{
  "user": "alert(xss)JackBold",
  "duration": 1
}
```

**Security Note:** Sanitization prevents stored XSS, but also mangles legitimate input containing quotes or angle brackets. Frontend should prevent submission of such characters.

### 8. Invalid Date Format

**Scenario:** Request includes malformed date.

Request:
```json
{
  "dateKey": "02/13/2026",
  "timeKey": "07:00",
  "user": "Jack",
  "duration": 1
}
```

Sanitization:
- `dateKey` fails regex `/^\d{4}-\d{2}-\d{2}$/` → Set to `null`

Validation:
- Check for required fields → `dateKey` is `null`

Response: `400 { "error": "Missing or invalid fields: dateKey, timeKey, user, duration" }`

### 9. Duration Validation Edge Cases

**Valid Durations:** 1, 2, 3, 4, 5, 6, 7, 8

**Invalid Durations (all become `null`):**
- `0` (below range)
- `9` (above range)
- `-1` (negative)
- `"two"` (non-numeric)
- `2.5` (parsed as `2` via `parseInt`, then validated: `2` is valid)
- `null` (not a number)
- `undefined` (not a number)

**Edge Case: Float Parsed as Integer**

Request:
```json
{
  "dateKey": "2026-02-13",
  "timeKey": "07:00",
  "user": "Jack",
  "duration": 2.9
}
```

Sanitization:
- `parseInt(2.9, 10)` → `2`
- `2` is in range 1-8 → Valid

Stored duration: `2` (not `2.9` or `3`)

## Error Response Summary

| Status Code | Meaning                  | Triggered By                                      | Example Response                                                     |
|-------------|--------------------------|---------------------------------------------------|----------------------------------------------------------------------|
| 200         | Success                  | GET requests, successful PUT/DELETE               | `{ "success": true }`                                                |
| 201         | Created                  | Successful POST                                   | `{ "success": true, "booking": {...} }`                              |
| 400         | Bad Request              | Missing/invalid fields after sanitization         | `{ "error": "Missing or invalid fields: dateKey, timeKey, user, duration" }` |
| 404         | Not Found                | PUT/DELETE on non-existent booking                | `{ "error": "Booking not found" }`                                   |
| 405         | Method Not Allowed       | Using unsupported HTTP method on endpoint         | `{ "error": "Method not allowed" }`                                  |
| 409         | Conflict                 | Start slot occupied, duration overlap, extension conflict | `{ "error": "Slot already booked" }` or `{ "error": "Slot 08:00 conflicts with booking duration" }` |
| 429         | Too Many Requests        | Rate limit exceeded (60 requests/minute)          | `{ "error": "Too many requests. Please try again later." }`          |
| 500         | Internal Server Error    | KV operation failure                              | `{ "error": "Internal server error" }` or `{ "error": "Failed to fetch configuration" }` |

## Rails Implementation Checklist

Use this checklist to verify Rails API matches React API behavior:

**Security Middleware:**
- [ ] All endpoints wrapped with security middleware
- [ ] Security headers set on every response
- [ ] CORS configured with exact allowed origins and permissive fallback
- [ ] OPTIONS preflight returns 200 with CORS headers
- [ ] Rate limiting implemented with 60 requests/minute per IP
- [ ] IP extracted from X-Forwarded-For (first entry) or X-Real-IP
- [ ] Rate limit state stored with 120-second TTL
- [ ] X-RateLimit-Remaining header set on all responses
- [ ] Rate limit failures return 429 with exact error message
- [ ] Rate limit check errors fail-open (allow request)

**Input Sanitization:**
- [ ] dateKey validated with regex `/^\d{4}-\d{2}-\d{2}$/`
- [ ] timeKey validated with regex `/^\d{2}:00$/`
- [ ] user sanitized: HTML tags removed, injection chars removed, trimmed, max 100 chars
- [ ] duration validated as integer 1-8
- [ ] Invalid fields set to null (not rejected outright)

**GET /api/config:**
- [ ] Returns hardcoded default if KV returns null
- [ ] Default includes exact 6 users with correct keys
- [ ] 405 for non-GET methods with exact error message

**GET /api/bookings:**
- [ ] Returns empty object `{}` if KV returns null
- [ ] Returns nested object structure (date → time → booking)

**POST /api/bookings:**
- [ ] 400 if any field is null after sanitization
- [ ] 409 "Slot already booked" if start slot occupied
- [ ] 409 "Slot HH:00 conflicts..." if duration overlaps existing
- [ ] Conflict check loops from i=1 to i<duration
- [ ] 201 with exact response structure on success

**PUT /api/bookings/update:**
- [ ] 404 if booking doesn't exist
- [ ] Duration conflict check ONLY if duration is increasing
- [ ] Conflict check loops from i=currentDuration to i<newDuration
- [ ] 409 "Cannot extend: slot HH:00..." for extension conflicts
- [ ] No conflict check for shrinking duration
- [ ] No conflict check for user-only changes
- [ ] Merged booking object returned in response

**DELETE /api/bookings/update:**
- [ ] 404 if booking doesn't exist
- [ ] Date key deleted if no remaining bookings
- [ ] 200 with `{ "success": true }` on success

**Error Messages:**
- [ ] All error messages match exact strings from this document
- [ ] All status codes match this document
- [ ] All response structures match this document

## Appendix: KV Storage Schema

**Config Key:**
```
instance:{slug}:config
```

**Config Value Structure:**
```json
{
  "slug": "string",
  "title": "string",
  "users": [
    { "name": "string", "key": "string" }
  ],
  "createdAt": "ISO 8601 timestamp"
}
```

**Bookings Key:**
```
instance:{slug}:bookings
```

**Bookings Value Structure:**
```json
{
  "YYYY-MM-DD": {
    "HH:00": {
      "user": "string",
      "duration": 1-8
    }
  }
}
```

**Rate Limit Key:**
```
ratelimit:{ip}
```

**Rate Limit Value Structure:**
```json
{
  "count": "integer",
  "windowStart": "timestamp (milliseconds)"
}
```

**Rate Limit TTL:** 120 seconds

---

**End of API Contracts Specification**
