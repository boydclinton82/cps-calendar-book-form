---
phase: 06-code-extraction
plan: 03
subsystem: documentation
tags: [annotations, technology-neutral, behavior-specs, rails-prep]
requires: [06-01-extracted-code]
provides: [annotated-code-reference, annotation-legend]
affects: [07-behavior-spec, 08-rails-blueprint]
tech-stack:
  added: []
  patterns: [inline-documentation, technology-neutral-annotations]
key-files:
  created:
    - .planning/phases/06-code-extraction/ANNOTATIONS.md
  modified:
    - .planning/phases/06-code-extraction/extracted-code/src/hooks/useBookings.js
    - .planning/phases/06-code-extraction/extracted-code/src/utils/time.js
    - .planning/phases/06-code-extraction/extracted-code/src/hooks/useKeyboard.js
    - .planning/phases/06-code-extraction/extracted-code/src/services/api.js
    - .planning/phases/06-code-extraction/extracted-code/src/App.jsx
    - .planning/phases/06-code-extraction/extracted-code/src/hooks/usePollingSync.js
    - .planning/phases/06-code-extraction/extracted-code/src/utils/storage.js
    - .planning/phases/06-code-extraction/extracted-code/api/bookings/index.js
    - .planning/phases/06-code-extraction/extracted-code/api/bookings/update.js
    - .planning/phases/06-code-extraction/extracted-code/api/_lib/security.js
    - .planning/phases/06-code-extraction/extracted-code/api/config.js
decisions:
  - choice: Standardized annotation tags (BEHAVIOR, VALIDATION, EDGE_CASE, DATA_FLOW, DATA_CONSTRAINT, WHY, CONSTANT)
    rationale: Consistent tagging makes code scannable and enables systematic Rails translation
    alternatives: [free-form comments, no annotations]
    phase: 06-03
  - choice: Inline annotations rather than separate documentation
    rationale: Keeps context close to code; annotations live with the logic they explain
    alternatives: [separate markdown files, wiki documentation]
    phase: 06-03
  - choice: Technology Translation Guide in ANNOTATIONS.md
    rationale: React→Rails mapping helps Rails developer understand React patterns without learning React
    alternatives: [assume Rails dev knows React, no translation guide]
    phase: 06-03
metrics:
  duration: 9 minutes
  completed: 2026-02-12
  commits: 2
  files-annotated: 11
  annotation-tags-added: 150+
---

# Phase 06 Plan 03: Code Annotation Summary

**One-liner:** 11 extracted code files annotated with 150+ technology-neutral tags explaining WHAT and WHY without React jargon

## What Was Delivered

### Annotation Legend (ANNOTATIONS.md)
Created comprehensive annotation guide with:
- 7 standardized tag definitions (BEHAVIOR, VALIDATION, EDGE_CASE, DATA_FLOW, DATA_CONSTRAINT, WHY, CONSTANT)
- Technology Translation Guide mapping React concepts → Rails equivalents
- Annotation principles (focus on business logic, avoid framework jargon)
- Examples showing before/after annotation quality

### Annotated Core Logic Files (7 files)
**src/hooks/useBookings.js** (11 BEHAVIOR, 3 EDGE_CASE, 5 DATA_FLOW tags):
- Booking management operations (create/update/delete)
- Optimistic update pattern explained
- Conflict detection validation rules
- Multi-hour booking blocking logic
- Data structure: `{ "YYYY-MM-DD": { "HH:00": { user, duration } } }`

**src/utils/time.js** (12 BEHAVIOR, 3 EDGE_CASE, 6 DATA_CONSTRAINT tags):
- Time slot generation (6 AM - 10 PM, 16 slots)
- Queensland timezone as source of truth
- NSW daylight saving offset display logic
- Current hour availability edge case (stays bookable until next hour)
- Multi-hour booking block detection algorithm

**src/hooks/useKeyboard.js** (21 BEHAVIOR, 5 EDGE_CASE, 3 VALIDATION tags):
- Context-aware keyboard shortcuts (popup/panel/navigation modes)
- User hotkeys from config (dynamic, not hardcoded)
- Duration selection (1/2/3 hours via number keys)
- Navigation shortcuts (arrows, B for book now, T for timezone)
- Mode isolation (popup blocks navigation shortcuts)

**src/services/api.js** (15 BEHAVIOR, 8 EDGE_CASE tags + request/response examples):
- HTTP client abstraction with localStorage fallback
- All CRUD operations documented with exact data shapes
- Conflict validation in localStorage mode
- Error handling and retry patterns

**src/App.jsx** (20+ BEHAVIOR, 10+ EDGE_CASE, 5 DATA_FLOW tags):
- Main orchestrator state management
- Three interaction modes (navigation/panel/popup)
- Booking flow: slot → user → duration → create
- Edit flow: click booking → change user/duration/delete → close
- "Book Now" logic (current hour availability)

**src/hooks/usePollingSync.js** (5 BEHAVIOR, 2 EDGE_CASE tags):
- 7-second polling interval for multi-user sync
- Silent error handling (doesn't interrupt user)
- Manual sync trigger for rollback

**src/utils/storage.js** (3 BEHAVIOR, 2 EDGE_CASE tags):
- Timezone preference persistence (localStorage)
- Graceful degradation if storage unavailable

### Annotated API Endpoint Files (4 files)
**api/bookings/index.js** (GET/POST with full request/response examples):
- GET: Returns all bookings `{ "YYYY-MM-DD": { "HH:00": { user, duration } } }`
- POST: Creates booking with conflict validation
- Response codes: 200 (success), 201 (created), 400 (validation), 409 (conflict)
- Vercel KV key structure: `instance:{slug}:bookings`

**api/bookings/update.js** (PUT/DELETE with examples):
- PUT: Updates booking (user or duration) with extension conflict check
- DELETE: Removes booking and cleans up empty date objects
- Response codes: 200 (success), 404 (not found), 409 (conflict)

**api/_lib/security.js** (14 BEHAVIOR tags, comprehensive middleware documentation):
- CORS handling (allowed origins, preflight support)
- Rate limiting (60 req/min per IP via Vercel KV)
- Input sanitization (XSS prevention, format validation)
- Security headers (5 standard headers on all responses)
- `withSecurity()` wrapper pattern explained

**api/config.js** (config shape and defaults):
- Instance configuration endpoint (title, users)
- Default config for CPS Software
- User structure: `{ name: string, key: string }` for keyboard shortcuts
- Per-instance isolation via INSTANCE_SLUG env var

## Key Patterns Documented

### Optimistic Update Pattern
Annotated in: `useBookings.js`, `api.js`
- Update local cache immediately (instant UI feedback)
- Send to server asynchronously
- On error: rollback by re-syncing from server
- Why: Better UX than waiting for server round-trip

### Multi-Hour Booking Logic
Annotated in: `time.js`, `useBookings.js`, `api/bookings/index.js`
- Booking at hour H with duration D occupies slots H through H+D-1
- Slots between start and end are "blocked" (not available)
- Conflict detection: check all slots in range before creating
- Extension validation: only check new slots beyond current duration

### Context-Aware Keyboard Shortcuts
Annotated in: `useKeyboard.js`, `App.jsx`
- Popup mode: Only popup shortcuts active (D=delete, Esc=close, user/duration keys)
- Panel mode: User/duration selection active, some navigation blocked
- Navigation mode: Full navigation shortcuts (arrows, W=week, B=book now)
- Prevents conflicting interactions (e.g., W during edit would be confusing)

### Rate Limiting Strategy
Annotated in: `api/_lib/security.js`
- Track requests per IP per minute in Vercel KV
- 60 requests/minute limit
- Fail-open if KV unavailable (logs error, allows request)
- Auto-cleanup via 2-minute TTL on rate limit keys

### Timezone Display Pattern
Annotated in: `time.js`, `App.jsx`, `storage.js`
- Storage always uses Queensland time (UTC+10, no DST)
- NSW users can toggle display to local time
- During DST (Oct-Apr): NSW is AEDT (+1h vs QLD)
- Display offset applied via `formatHour(hour, useNSWTime)`
- Preference persisted to localStorage

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

All verification criteria passed:
✅ ANNOTATIONS.md exists with complete tag legend and translation guide (30+ lines)
✅ useBookings.js has 11 BEHAVIOR tags (required 3+)
✅ time.js has 3 EDGE_CASE tags (required 2+)
✅ useKeyboard.js has 21 BEHAVIOR tags (required 3+)
✅ No React jargon in annotations (grep verified: 0 matches for useEffect/useState/props./re-render/this hook in annotation lines)
✅ All 11 files annotated with standardized tags
✅ Every exported function has at minimum a BEHAVIOR annotation
✅ API files include request/response examples
✅ Conflict detection, validation rules, and edge cases thoroughly documented

## Files Created/Modified

### Created (1 file):
- `.planning/phases/06-code-extraction/ANNOTATIONS.md` (110 lines) - Annotation legend and React→Rails translation guide

### Modified (11 files):
All extracted code files annotated with technology-neutral tags:

**Core logic (7 files):**
- `extracted-code/src/hooks/useBookings.js` (+105 annotation lines)
- `extracted-code/src/utils/time.js` (+58 annotation lines)
- `extracted-code/src/hooks/useKeyboard.js` (+72 annotation lines)
- `extracted-code/src/services/api.js` (+68 annotation lines)
- `extracted-code/src/App.jsx` (+48 annotation lines)
- `extracted-code/src/hooks/usePollingSync.js` (+22 annotation lines)
- `extracted-code/src/utils/storage.js` (+12 annotation lines)

**API endpoints (4 files):**
- `extracted-code/api/bookings/index.js` (+50 annotation lines, request/response examples)
- `extracted-code/api/bookings/update.js` (+45 annotation lines, request/response examples)
- `extracted-code/api/_lib/security.js` (+87 annotation lines, security patterns)
- `extracted-code/api/config.js` (+35 annotation lines, config shape)

## Commits

1. **4f1a9bc** - `docs(06-03): annotate core logic files with technology-neutral tags`
   - ANNOTATIONS.md legend created
   - 7 core logic files annotated
   - Technology Translation Guide added

2. **803bdca** - `docs(06-03): annotate API endpoint files with request/response contracts`
   - 4 API files annotated
   - Request/response examples for all endpoints
   - Security middleware fully documented

## Impact on Future Phases

### 07-behavior-spec Benefits:
- Annotated code provides reference for writing behavior specs
- EDGE_CASE tags identify scenarios requiring explicit spec coverage
- VALIDATION tags document business rules to verify

### 08-rails-blueprint Benefits:
- DATA_CONSTRAINT tags define exact data structures for Rails models
- DATA_FLOW tags show how data moves (guides Rails controller/service design)
- API annotations provide contract Rails must replicate
- Technology Translation Guide enables Rails dev to understand React code without React knowledge

### Rails Developer Experience:
- Can read extracted code focusing on `BEHAVIOR:` tags for "what does this do"
- Can follow `DATA_FLOW:` tags to understand architecture
- Can study `VALIDATION:` and `EDGE_CASE:` tags to replicate business logic correctly
- Can ignore React-specific syntax (`useState`, `useEffect`, etc.) - all critical logic is explained in plain English

## Next Phase Readiness

**Phase 06 Plan 03** is complete. Ready to proceed with:
- Phase 07 (Behavior Spec): Use annotated code as reference for writing specs
- Phase 08 (Rails Blueprint): Use annotations to guide Rails architecture decisions

No blockers. All extracted code now has technology-neutral documentation suitable for Rails recreation.

## Lessons Learned

### What Worked Well:
1. **Standardized tags** made annotation systematic - clear categories for different information types
2. **Inline annotations** kept context close to code - easier to maintain than separate docs
3. **Technology Translation Guide** bridges React→Rails gap without requiring Rails dev to learn React
4. **Request/response examples** in API files provide exact contract for Rails controllers
5. **Avoiding React jargon** makes annotations useful for any language/framework

### What Could Be Improved:
1. Could add diagram showing data flow through entire system (supplement inline annotations)
2. Could extract validation rules into a separate validation matrix (supplement inline tags)
3. Could add performance annotations (e.g., "This loop runs 16 times max per render")

### Recommendations:
- Maintain annotation discipline in future code changes
- Use ANNOTATIONS.md tag definitions consistently across all phases
- When Rails implementation differs from React approach, document WHY in Rails code with same tag style
