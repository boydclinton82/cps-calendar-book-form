---
phase: 08-architecture-documentation
plan: 01
subsystem: architecture-documentation
tags: [documentation, architecture, storage-schema, configuration, vercel-kv, environment-variables]
requires: [06-code-extraction, 07-ui-ux-documentation]
provides: [data-storage-schema, instance-configuration-spec, kv-key-structure, environment-setup-guide]
affects: [08-02-api-contracts, 08-03-state-management]
tech-stack:
  added: []
  patterns: [namespace-isolation, read-modify-write, graceful-fallback]
key-files:
  created:
    - .planning/phases/08-architecture-documentation/DATA-STORAGE.md
    - .planning/phases/08-architecture-documentation/INSTANCE-CONFIG.md
  modified: []
decisions:
  - id: namespace-isolation
    what: Instance isolation via slug-based key prefixes
    why: Multiple teams can share same KV database with complete data separation
    impact: Each instance reads/writes to `instance:{slug}:*` keys only
  - id: read-modify-write
    what: Full object replacement on every write operation
    why: Simplifies KV usage, acceptable for low-concurrency booking system
    impact: Last write wins, no locking, conflicts recovered via polling
  - id: graceful-fallback
    what: Hardcoded fallback config when API unavailable
    why: Application must never crash due to missing configuration
    impact: Works offline, seamless degradation, no error modals
metrics:
  duration: 4 minutes
  completed: 2026-02-13
---

# Phase 08 Plan 01: Data Storage and Instance Configuration Summary

**One-liner:** Complete storage schema (KV keys, booking structure, multi-hour representation) and instance configuration (env vars, fallback, isolation) documented for technology-neutral implementation

---

## What Was Built

Created two foundational architecture documents that define the data layer and configuration system:

1. **DATA-STORAGE.md (ARCH-01)** — 629 lines
   - Complete Vercel KV key structure with namespace patterns
   - Booking data schema with nested dateKey/timeKey structure
   - Multi-hour booking representation (single record, duration field)
   - Empty states and date cleanup on delete
   - Read-modify-write update pattern with concurrency analysis
   - Date/time format reference with timezone handling
   - Validation patterns (regex for keys, range checks for duration)
   - Conflict detection algorithms

2. **INSTANCE-CONFIG.md (ARCH-05)** — 652 lines
   - All 4 environment variables documented (KV credentials, slug, API toggle)
   - Instance isolation explanation (separate namespaces per slug)
   - Config object schema with user keyboard shortcuts
   - Complete fallback configuration with 6 users
   - Config loading order with critical dependency explanation (config before bookings)
   - Per-instance customization scope (title, users, data)
   - Global constants (operating hours, duration options, polling interval)
   - Validation and graceful degradation patterns

**Total documentation:** 1,281 lines of technology-neutral architecture specs

---

## Tasks Completed

| Task | Description | Files | Commit |
|------|-------------|-------|--------|
| 1 | Create DATA-STORAGE.md (ARCH-01) | DATA-STORAGE.md (629 lines) | 193ec52 |
| 2 | Create INSTANCE-CONFIG.md (ARCH-05) | INSTANCE-CONFIG.md (652 lines) | c884534 |

---

## Decisions Made

### 1. Namespace Isolation via Slug-Based Key Prefixes

**Context:** Multiple teams might want to use the same KV database

**Decision:** Use `instance:{slug}:{resource}` pattern for all keys

**Rationale:**
- Complete data isolation between instances
- Single KV database can host multiple teams
- No risk of data leakage or conflicts
- Simple to understand and implement

**Impact:**
- Instance "cps-software" → `instance:cps-software:config` and `instance:cps-software:bookings`
- Instance "sydney-office" → `instance:sydney-office:config` and `instance:sydney-office:bookings`
- Future instances just need different `INSTANCE_SLUG` environment variable

**Alternatives considered:**
- Separate KV databases per instance (more expensive, harder to manage)
- Instance field inside shared data structure (complex filtering, easier to leak data)

---

### 2. Read-Modify-Write Pattern for All Updates

**Context:** Need simple update mechanism for booking operations

**Decision:** Always read full object, modify in memory, write entire object back

**Rationale:**
- KV stores JSON values atomically
- Simple to implement (no partial update logic)
- Low concurrency makes race conditions rare
- 7-second polling recovers from conflicts automatically

**Impact:**
- All CRUD operations follow same pattern
- Last write wins (no locking)
- Acceptable data loss risk for booking use case
- NOT suitable for high-concurrency or financial systems

**Documented trade-offs:**
- Concurrency scenario documented in DATA-STORAGE.md
- Clear statement: "Acceptable for low-concurrency, not for high-concurrency"
- Rails developer will understand when this pattern is appropriate

---

### 3. Graceful Fallback Configuration

**Context:** Application should work even without backend

**Decision:** Hardcode fallback config with production values

**Rationale:**
- No startup crashes from missing config
- Demo mode / offline mode possible
- Development without backend setup
- Seamless degradation for users

**Impact:**
- Application always has working config
- Fallback uses real CPS Software user roster
- Console warning logged (for debugging)
- No error modals or blocking states

**Fallback config:**
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
  ]
}
```

---

## Technical Details

### Key Data Structures Documented

**Bookings storage structure:**
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

**Key formats:**
- dateKey: `YYYY-MM-DD` with regex `/^\d{4}-\d{2}-\d{2}$/`
- timeKey: `HH:00` with regex `/^\d{2}:00$/`
- duration: integer 1-8

**Multi-hour booking logic:**
- Only ONE record at start time
- Duration field indicates occupied slots
- Example: booking at 07:00 with duration 3 occupies 07:00, 08:00, 09:00
- Slot status: 07:00 is "booked", 08:00 and 09:00 are "blocked"

### Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| KV_REST_API_URL | Yes | None | Vercel KV connection URL |
| KV_REST_API_TOKEN | Yes | None | KV authentication token |
| INSTANCE_SLUG | No | "cps-software" | Instance identifier for data namespace |
| VITE_USE_API | No | "true" | Enable/disable API backend |

### Config Loading Order

**Critical sequence documented:**
1. App starts → check VITE_USE_API
2. If enabled → GET /api/config
3. If config returned → use it; if null/error → use fallback
4. Config available globally
5. **Then** bookings can load (requires config for user validation)

**Why order matters:** Booking operations validate user names against config.users list

---

## Deviations from Plan

None - plan executed exactly as written.

Both documents created with:
- Complete schemas with concrete examples
- Regex validation patterns
- Technology-neutral language
- Cross-references to related docs and source files
- 120+ lines requirement exceeded (629 and 652 lines)

---

## Next Phase Readiness

### What's Ready

**For Plan 02 (API Contracts):**
- Data structures fully documented (can reference for request/response formats)
- Key structures documented (API endpoints know which keys to read/write)
- Validation patterns documented (API can implement same validation)

**For Plan 03 (State Management):**
- Storage schema available (frontend knows what data shape to expect)
- Config loading order documented (state management needs this sequence)
- Fallback behavior documented (state management implements graceful degradation)

### What's Needed Next

**Plan 02 must document:**
- GET /api/config → returns config object structure (defined here)
- GET /api/bookings → returns bookings object structure (defined here)
- POST /api/bookings → accepts booking fields, validates against patterns (defined here)
- PUT /api/bookings/update → updates booking, checks duration conflicts (logic defined here)
- DELETE /api/bookings/update → deletes booking, cleans up empty dates (cleanup defined here)

**Plan 03 must document:**
- How frontend caches config globally (uses config structure defined here)
- How frontend caches bookings (uses bookings structure defined here)
- Polling sync mechanism (must understand read-modify-write implications documented here)
- Optimistic updates (must understand eventual consistency from polling)

---

## Verification

### Must-Have Truths (All Satisfied)

- [x] Vercel KV key structure fully documented with prefix patterns, complete key examples, and instance isolation explanation
- [x] Booking data format documented with nested object schema, field types, constraints, and concrete multi-booking examples
- [x] Empty states and edge cases documented (no bookings, empty dates, date cleanup on delete)
- [x] Read-modify-write update pattern explicitly documented with concurrency implications
- [x] All environment variables documented with purpose, format, example values, and validation behavior
- [x] Per-instance differences documented showing how INSTANCE_SLUG creates separate data namespaces
- [x] Fallback configuration documented with exact default values

### Artifact Requirements (All Met)

- [x] DATA-STORAGE.md exists (629 lines, exceeds 120 minimum)
- [x] INSTANCE-CONFIG.md exists (652 lines, exceeds 100 minimum)
- [x] Complete Vercel KV storage schema documentation
- [x] Environment variable and instance configuration documentation

### Key Links (All Present)

- [x] DATA-STORAGE.md links to INSTANCE-CONFIG.md (INSTANCE_SLUG determines KV key prefix)
- [x] Both documents cross-reference API and source files
- [x] Documents include concrete key examples with instance:cps-software namespace

---

## Files Changed

**Created:**
- `.planning/phases/08-architecture-documentation/DATA-STORAGE.md` (629 lines)
- `.planning/phases/08-architecture-documentation/INSTANCE-CONFIG.md` (652 lines)

**Modified:**
- None

---

## Commits

| Hash | Message | Files |
|------|---------|-------|
| 193ec52 | docs(08-01): create DATA-STORAGE.md documentation | DATA-STORAGE.md |
| c884534 | docs(08-01): create INSTANCE-CONFIG.md documentation | INSTANCE-CONFIG.md |

---

## Technology-Neutral Validation

Both documents successfully avoid React-specific terminology:

**What's NOT in these docs:**
- useState, useEffect, props, hooks
- Component lifecycle terms
- React Context API implementation details
- JSX or component patterns

**What IS in these docs:**
- Pure data structures (JSON objects, nested keys)
- Storage operations (read, modify, write)
- Validation logic (regex patterns, range checks)
- Configuration loading sequence (technology-agnostic steps)
- Instance isolation (namespace-based separation)

A Rails developer can read these documents and design equivalent PostgreSQL schema and configuration system without knowing React.

---

## Quality Metrics

- **Documentation lines:** 1,281 (exceeds plan minimums by 5.5x)
- **Concrete examples:** 15+ JSON examples with real production data
- **Cross-references:** 8 references to related docs and source files
- **Validation patterns:** 6 regex patterns and range checks documented
- **Diagrams:** 1 config loading flowchart
- **Technology-neutral:** 100% (no React-specific terms in specs)

---

## Reflection

**What went well:**
- Extracted exact implementation details from source code
- Documented real production data structures (not invented examples)
- Clear namespace isolation pattern makes multi-instance deployment simple
- Graceful fallback ensures application reliability
- Concurrency trade-offs explicitly documented (helps Rails developer make informed decisions)

**Key insight:** Instance isolation via key prefixes is elegant solution for multi-tenancy in KV stores. Same pattern could apply to Redis, DynamoDB, or any key-value system.

**Foundation established:** These two documents define the "contract" between frontend and backend. API contracts (Plan 02) will reference these schemas. State management (Plan 03) will reference these structures. All subsequent architecture docs build on this foundation.

---

*Summary completed: 2026-02-13*
*Phase: 08-architecture-documentation*
*Total duration: 4 minutes*
