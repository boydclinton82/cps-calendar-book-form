# Instance Configuration (ARCH-05)

**Document ID:** ARCH-05
**Phase:** 08 - Architecture Documentation
**Created:** 2026-02-13
**Purpose:** Complete reference for environment variables, instance configuration, and per-instance customization

---

## Overview

The booking application supports multiple isolated instances using environment-based configuration. Each instance has its own title, user roster, and separate data namespace in the key-value store.

This document defines all environment variables, configuration loading behavior, fallback mechanisms, and per-instance customization scope.

---

## Environment Variables

All environment variables required for application deployment and operation.

| Variable | Required | Default | Format | Description |
|----------|----------|---------|--------|-------------|
| `KV_REST_API_URL` | Yes | None | HTTPS URL | Vercel KV database URL |
| `KV_REST_API_TOKEN` | Yes | None | Token string | Vercel KV access token |
| `INSTANCE_SLUG` | No | `"cps-software"` | Lowercase alphanumeric + hyphens | Instance identifier |
| `VITE_USE_API` | No | `"true"` | `"true"` or `"false"` | Enable/disable API backend |

### KV_REST_API_URL

**Purpose:** Specifies the Vercel KV database connection URL

**Format:** HTTPS URL provided by Vercel KV dashboard

**Example:**
```
KV_REST_API_URL=https://abc123.kv.vercel-storage.com
```

**Behavior:**
- Required for API endpoints to function
- Missing value causes API calls to fail (falls back to localStorage mode)
- Used by `@vercel/kv` library to connect to database

**Validation:**
- Must be valid HTTPS URL
- Must be accessible from deployment environment
- Provided by Vercel KV service (not user-generated)

---

### KV_REST_API_TOKEN

**Purpose:** Authenticates API requests to Vercel KV database

**Format:** Token string provided by Vercel KV dashboard

**Example:**
```
KV_REST_API_TOKEN=AXx...token...xyz
```

**Behavior:**
- Required for API endpoints to authenticate with KV
- Missing value causes authentication errors (falls back to localStorage mode)
- Sensitive credential (must not be committed to version control)

**Security:**
- Keep secret (use `.env.local`, not `.env`)
- Rotate if exposed
- Different tokens for development/production

---

### INSTANCE_SLUG

**Purpose:** Identifies which instance's configuration and data to load

**Format:** Lowercase alphanumeric characters and hyphens

**Default:** `"cps-software"`

**Example:**
```
INSTANCE_SLUG=cps-software
```

**Other examples:**
```
INSTANCE_SLUG=sydney-office
INSTANCE_SLUG=design-team
INSTANCE_SLUG=studio-a
```

**Behavior:**
- Determines KV key prefix: `instance:{slug}:config` and `instance:{slug}:bookings`
- Different slugs access completely separate data namespaces
- Default value used if environment variable not set

**Validation:**
- Must match regex: `/^[a-z0-9-]+$/`
- Typically 2-20 characters
- Cannot be empty

**Instance isolation:**
- Instance "cps-software" → reads from `instance:cps-software:config`
- Instance "sydney-office" → reads from `instance:sydney-office:config`
- No data sharing between instances (separate namespaces)

---

### VITE_USE_API

**Purpose:** Enable or disable the API backend (for development/offline mode)

**Format:** String `"true"` or `"false"`

**Default:** `"true"`

**Example:**
```
VITE_USE_API=true
```

**Behavior:**
- `"true"` → Application uses API endpoints for config and bookings
- `"false"` → Application uses localStorage for bookings, hardcoded fallback for config
- Checked at application initialization (frontend)

**Use cases:**
- Development without backend: `VITE_USE_API=false`
- Offline mode / demo mode: `VITE_USE_API=false`
- Production deployment: `VITE_USE_API=true` (or omit, uses default)

**Fallback behavior:**
- When `false`, config uses hardcoded fallback (see Fallback Configuration section)
- When `false`, bookings stored in browser localStorage (key: `"cps-bookings"`)
- No server communication when disabled

---

## Instance Isolation

How `INSTANCE_SLUG` creates separate data spaces for different deployments.

### Namespace Separation

Each instance slug creates a separate KV key namespace:

**Instance "cps-software":**
```
instance:cps-software:config   → Config for CPS Software team
instance:cps-software:bookings → Bookings for CPS Software team
```

**Instance "sydney-office":**
```
instance:sydney-office:config   → Config for Sydney office
instance:sydney-office:bookings → Bookings for Sydney office
```

### Multi-Instance Deployment

**Single KV database can host multiple instances:**
- Same Vercel KV database
- Different `INSTANCE_SLUG` values per deployment
- No data leakage between instances
- Each instance sees only its own data

**Deployment pattern:**
```
Deployment 1: INSTANCE_SLUG=cps-software → https://cps.example.com
Deployment 2: INSTANCE_SLUG=sydney-office → https://sydney.example.com
Deployment 3: INSTANCE_SLUG=design-team → https://design.example.com
```

All deployments use same `KV_REST_API_URL` and `KV_REST_API_TOKEN`, but read different keys.

### No Shared Data

**Completely isolated:**
- User roster is per-instance (different teams have different users)
- Bookings are per-instance (no visibility into other instances)
- Configuration is per-instance (title, settings)

**Example:**
- CPS Software instance has users: Jack, Bonnie, Giuliano, John, Rue, Joel
- Sydney Office instance has users: Alice, Bob, Charlie
- Design Team instance has users: Dana, Emma

No overlap, no sharing.

---

## Config Object Schema

Configuration data returned from API or used as fallback.

### Structure

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

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Instance identifier (matches `INSTANCE_SLUG` environment variable) |
| `title` | string | Display title shown in application header |
| `users` | array | List of user objects (2-6 typically) |
| `createdAt` | string | ISO 8601 timestamp of instance creation |

### User Object

```json
{
  "name": "Jack",
  "key": "j",
  "colorIndex": 0
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | User's display name (shown in booking blocks, user buttons) |
| `key` | string | Yes | Single-letter keyboard shortcut (lowercase) |
| `colorIndex` | integer | No | Explicit color assignment (0-5). If absent, uses position in array. |

### Key Assignment Rules

Each user needs a unique keyboard shortcut (single letter).

**Convention:**
- Prefer first letter of name: "Jack" → "j", "Bonnie" → "b"
- If first letter taken, use another distinctive letter from name:
  - "John" → "h" (because "j" taken by Jack)
  - "Joel" → "l" (because "j" taken by Jack)
- Case-insensitive (stored lowercase, matched case-insensitive)

**Uniqueness requirement:**
- All keys must be unique within the users array
- Keys are validated on config creation
- Duplicate keys are rejected

---

## Default/Fallback Configuration

When API is unavailable or disabled, the application uses a hardcoded fallback configuration.

### Fallback Configuration

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

### Fallback User Roster

Complete user list with exact key mappings:

1. **Jack** → keyboard shortcut `j`
2. **Bonnie** → keyboard shortcut `b`
3. **Giuliano** → keyboard shortcut `g`
4. **John** → keyboard shortcut `h` (not "j" because Jack uses "j")
5. **Rue** → keyboard shortcut `r`
6. **Joel** → keyboard shortcut `l` (not "j" because Jack uses "j")

**Note:** John and Joel use alternative letters because "j" is already assigned to Jack. This prevents keyboard shortcut conflicts.

### When Fallback Is Used

**Triggered in these scenarios:**

1. **API disabled:** `VITE_USE_API=false` in environment
2. **API returns null:** GET /api/config returns no config data
3. **API errors:** Network failure, timeout, 500 error
4. **Missing KV credentials:** `KV_REST_API_URL` or `KV_REST_API_TOKEN` not set

**Behavior:**
- Application continues working with fallback config
- Users can create bookings (stored in localStorage if API disabled)
- No error shown to user (graceful degradation)
- Console warning logged (for debugging)

---

## Config Loading Order

Critical initialization sequence that determines how configuration becomes available to the application.

### Step-by-Step Loading

**Step 1: Application starts**
- Frontend initializes
- ConfigProvider component mounts
- Checks `VITE_USE_API` environment variable

**Step 2: Check if API enabled**
```javascript
if (VITE_USE_API === 'false') {
  // Skip API, use fallback immediately
  setConfig(FALLBACK_CONFIG);
} else {
  // Proceed to Step 3
}
```

**Step 3: Fetch config from API**
```
GET /api/config
```

**Step 4: Handle API response**
```javascript
if (config returned successfully) {
  // Use API config
  setConfig(apiConfig);
} else if (config is null or error) {
  // Use fallback config
  setConfig(FALLBACK_CONFIG);
}
```

**Step 5: Config available globally**
- All components can access config via `useConfig()` hook
- Config includes: title, users, slug

**Step 6: Bookings can be loaded**
- Bookings API calls require user validation
- User validation requires config.users list
- Config MUST be loaded before bookings

### Why Order Matters

**Critical dependency:** Bookings require config to be loaded first.

**Reason:** User validation during booking operations

When creating or updating a booking:
1. API receives `user: "Jack"`
2. API validates user exists in configured users list
3. Validation requires config to be loaded
4. If config not available, validation fails

**Correct order:**
```
1. Load config → 2. Config available → 3. Load bookings → 4. Validate users
```

**Incorrect order (breaks validation):**
```
1. Load bookings → 2. Validate users → ERROR: config not available
```

**Implementation:**
- ConfigProvider loads config on mount (before App renders)
- App waits for `loading: false` from ConfigProvider
- Only then does App load bookings

---

## Per-Instance Customization

What differs between instances and what stays constant.

### Customizable Per Instance

**These settings vary by instance:**

| Setting | Example | Description |
|---------|---------|-------------|
| **Title** | "CPS Software Booking" vs "Sydney Office Booking" | Display name in header |
| **Users** | Jack/Bonnie/Giuliano vs Alice/Bob/Charlie | Different team members |
| **Keyboard shortcuts** | j/b/g vs a/b/c | Custom key mappings per user roster |
| **Optional colors** | User 1 green vs User 1 blue | Explicit color assignments via colorIndex |
| **Data namespace** | `instance:cps:bookings` vs `instance:sydney:bookings` | Separate booking data |

### Not Customizable (Global Constants)

**These settings are the same for ALL instances:**

| Setting | Value | Reason |
|---------|-------|--------|
| **Operating hours** | 6 AM - 10 PM | Fixed business logic |
| **Time slot granularity** | 1 hour | Core system design |
| **Duration options** | 1-8 hours | Fixed UI options (typically 1-3 used) |
| **Polling interval** | 7 seconds | Real-time sync frequency |
| **Rate limiting** | 60 req/min per IP | Security policy |
| **Input validation** | dateKey regex, user max length | Security/data integrity |

**Why not customizable:**
- Operating hours: Changing requires UI redesign (slot grid height)
- Duration options: Hardcoded in frontend (would require dynamic UI generation)
- Polling interval: Performance-tuned for low-latency sync
- Security rules: Consistent policy across all instances

---

## Validation

Error handling for invalid or missing configuration.

### Missing KV Credentials

**Scenario:** `KV_REST_API_URL` or `KV_REST_API_TOKEN` not set

**Behavior:**
1. API endpoints fail on KV connection
2. API returns 500 Internal Server Error
3. Frontend catches error
4. Falls back to localStorage mode (bookings) and fallback config

**Result:** Application works, but without server persistence

**User impact:** None (seamless fallback)

### Missing INSTANCE_SLUG

**Scenario:** `INSTANCE_SLUG` environment variable not set

**Behavior:**
1. API uses default value `"cps-software"`
2. Reads from `instance:cps-software:config` and `instance:cps-software:bookings`
3. If no config exists at this key, returns fallback config

**Result:** Application loads default instance data

**User impact:** None (default slug works)

### Invalid Config from KV

**Scenario:** Config object in KV is malformed or missing required fields

**Behavior:**
1. API returns config as-is (doesn't validate structure)
2. Frontend receives invalid config
3. Frontend uses fallback config instead

**Implementation:**
```javascript
if (!config || !config.users || !Array.isArray(config.users)) {
  config = FALLBACK_CONFIG;
}
```

**Result:** Application uses fallback instead of corrupted data

**User impact:** None (graceful degradation)

### No Startup Crash

**Critical design principle:** Application never crashes due to missing config.

**All config errors result in:**
- Fallback config used
- Console warning logged (for debugging)
- Application continues working
- User sees functional booking system

**No error modals, no blocking states.**

---

## Config Loading Behavior Summary

Visual representation of config loading logic:

```
┌─────────────────────────────────────────────┐
│ Application starts                          │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ VITE_USE_API?      │
         └────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
    "false"             "true"
        │                   │
        │                   ▼
        │         ┌──────────────────┐
        │         │ GET /api/config  │
        │         └────────┬─────────┘
        │                  │
        │         ┌────────┴────────┐
        │         │                 │
        │         ▼                 ▼
        │     Success           Error/Null
        │         │                 │
        │         ▼                 │
        │    Use API config         │
        │                           │
        └────────────┬──────────────┘
                     │
                     ▼
            Use Fallback Config
                     │
                     ▼
         ┌──────────────────────┐
         │ Config Available     │
         │ (global context)     │
         └──────────────────────┘
```

---

## Environment Variable Checklist

Quick reference for deployment:

### Required Variables

- [x] `KV_REST_API_URL` — From Vercel KV dashboard
- [x] `KV_REST_API_TOKEN` — From Vercel KV dashboard

### Optional Variables

- [ ] `INSTANCE_SLUG` — Default: "cps-software" (customize for multi-instance)
- [ ] `VITE_USE_API` — Default: "true" (set "false" for offline/demo mode)

### Security Checklist

- [ ] KV_REST_API_TOKEN in `.env.local` (not `.env`)
- [ ] `.env.local` in `.gitignore`
- [ ] Different KV credentials for dev/production
- [ ] Environment variables set in Vercel deployment settings

---

## Example Configurations

### Single Instance (Default)

```bash
# .env.local
KV_REST_API_URL=https://abc123.kv.vercel-storage.com
KV_REST_API_TOKEN=AXx...token...xyz
INSTANCE_SLUG=cps-software
VITE_USE_API=true
```

**Result:** Loads "cps-software" instance data from KV

---

### Multi-Instance Setup

**Deployment 1 (CPS Software):**
```bash
KV_REST_API_URL=https://shared-kv.kv.vercel-storage.com
KV_REST_API_TOKEN=shared-token
INSTANCE_SLUG=cps-software
VITE_USE_API=true
```

**Deployment 2 (Sydney Office):**
```bash
KV_REST_API_URL=https://shared-kv.kv.vercel-storage.com
KV_REST_API_TOKEN=shared-token
INSTANCE_SLUG=sydney-office
VITE_USE_API=true
```

**Result:** Two deployments, same KV, separate data namespaces

---

### Development Mode (No Backend)

```bash
# .env.local
VITE_USE_API=false
```

**Result:**
- No API calls
- Fallback config used
- Bookings stored in localStorage
- Works offline

---

### Demo/Offline Mode

```bash
# .env.local
VITE_USE_API=false
```

**Result:** Fully functional demo without requiring Vercel KV setup

---

## Cross-References

**Related documents:**
- [DATA-STORAGE.md](./DATA-STORAGE.md) — How INSTANCE_SLUG determines KV key prefixes
- [API Contracts](./API-CONTRACTS.md) — How config is fetched (GET /api/config)
- [State Management](./STATE-MANAGEMENT.md) — How config is cached and provided globally

**Source files:**
- `api/config.js` — Config API endpoint implementation
- `src/context/ConfigContext.jsx` — Config loading and fallback logic
- `src/services/api.js` — API enable/disable check
- `.env.local.example` — Example environment variable file

---

## Summary

**Environment variables:** 4 total (2 required, 2 optional with defaults)
**Instance isolation:** INSTANCE_SLUG creates separate KV key namespaces
**Config structure:** slug, title, users array with keyboard shortcuts
**Fallback config:** Hardcoded CPS Software config with 6 users (Jack/j, Bonnie/b, Giuliano/g, John/h, Rue/r, Joel/l)
**Loading order:** Config MUST load before bookings (user validation dependency)
**Customization scope:** Title, users, data per instance. Operating hours, durations, polling interval are global constants.
**Validation:** Graceful fallback on missing/invalid config, no startup crashes
**Multi-instance support:** Same KV database, different slugs, complete data isolation

---

*Document version: 1.0*
*Last updated: 2026-02-13*
*Phase: 08-architecture-documentation*
