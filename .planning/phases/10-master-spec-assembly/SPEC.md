# BMO Financial Booking System -- Specification

**Version:** 2.0
**Last Updated:** 2026-02-13
**Target Consumer:** Claude Code (Rails implementation)
**Source Truth:** https://booking-bmo-financial-solutions.vercel.app

---

## Overview

This is the master specification for a single-page booking calendar system. It manages hourly time slot reservations for shared resources through an intuitive visual interface with multi-hour booking support, real-time synchronization, and comprehensive keyboard navigation.

**Core value:** Another Claude Code instance can perfectly recreate this booking form from this spec alone.

The specification package consists of 40+ documents across 6 phases: visual capture (screenshots), code extraction (React reference), UI/UX documentation, architecture documentation, functional documentation, and this master assembly. Together, they provide complete implementation guidance for recreating this system in any technology stack.

---

## How to Use This Spec

### First Time Reading

Follow this numbered sequence for efficient comprehension:

1. **Start here (SPEC.md)** - You are currently reading the master entry point
2. **Read SYSTEM-SUMMARY.md** - Get complete mental model of all features and behaviors (technology-neutral overview)
3. **Study Phase 05 screenshots** - See exactly what you're building (visual truth)
4. **Read Phase 09 functional specs** - Understand all business rules and behavior logic
5. **Read Phase 08 architecture specs** - Learn data flow, API contracts, and system architecture
6. **Read Phase 07 UI/UX specs** - Get visual design details and interaction patterns
7. **Reference Phase 06 code extraction** - See React implementation patterns (adapt, don't port)

**Time investment:** Approximately 3-4 hours to read entire specification package. Essential for accurate implementation.

### During Implementation

Use this task-specific navigation to find relevant specs quickly:

| When Working On... | Start With | Supporting Docs |
|--------------------|------------|-----------------|
| **API endpoints** | API-CONTRACTS.md | DATA-STORAGE.md, STATE-MANAGEMENT.md |
| **Booking creation** | BOOKING-FLOW.md | API-CONTRACTS.md, EDGE-CASES.md |
| **UI layout** | LAYOUT-STRUCTURE.md | Screenshots (07-annotated/), DESIGN-TOKENS.md |
| **Visual styling** | DESIGN-TOKENS.md | COMPONENT-STATES.md, Screenshots |
| **Keyboard shortcuts** | KEYBOARD-SHORTCUTS.md | BOOKING-FLOW.md (modes), COMPONENT-STATES.md |
| **Time/date logic** | TIME-DATE-HANDLING.md | TIMEZONE-TOGGLE.md, EDGE-CASES.md |
| **Validation rules** | BOOKING-FLOW.md | EDGE-CASES.md, DATA-STORAGE.md |
| **Real-time sync** | POLLING-SYNC.md | STATE-MANAGEMENT.md, API-CONTRACTS.md |
| **Responsive design** | RESPONSIVE-BEHAVIOR.md | Screenshots (06-responsive/), LAYOUT-STRUCTURE.md |

### Document Hierarchy

When specifications appear to conflict, use this hierarchy:

**Source of truth for visuals:** Phase 05 screenshots (annotated versions)
- Colors, spacing, sizing, layout → Trust screenshots over text descriptions
- Example: If text says "cyan border" but screenshot shows blue, screenshot wins

**Source of truth for behavior:** Phase 09 functional specs
- Business logic, validation rules, user flows → Trust functional specs over code
- Example: If code has bug but functional spec describes correct behavior, implement per spec

**Source of truth for data:** Phase 08 architecture specs + Phase 06 data structures
- Storage formats, API contracts, state management → Trust architecture docs over code
- Example: If code uses different field names, use names from DATA-STORAGE.md

**Reference only:** Phase 06 React code (understand patterns, don't port syntax)
- React code shows HOW it was implemented, not WHAT must be implemented
- Translate patterns to Rails idioms, don't replicate React-specific approaches
- See ANNOTATIONS.md for React→Rails translation guide

### Conflict Resolution

If you encounter apparent contradictions:

**Screenshots vs text for visual details:**
- Screenshots are precise measurements
- Text descriptions may be approximations or outdated
- Resolution: Use screenshot values

**Functional specs vs code for behavior:**
- Code may contain bugs
- Functional specs describe intended behavior
- Resolution: Implement per functional specs

**Architecture specs vs code for data structures:**
- Architecture specs are authoritative
- Code may have evolved away from spec (technical debt)
- Resolution: Use architecture spec formats

**Multiple specs describe same thing differently:**
- Check "last updated" dates (newer likely more accurate)
- Consult EDGE-CASES.md for clarification
- Ask human if genuinely ambiguous (don't guess)

---

## Specification Package Contents

All file paths below are relative to `.planning/phases/` directory.

### Phase 10: Master Spec Assembly

**Entry points and navigation:**

| File | Purpose | Read When |
|------|---------|-----------|
| **10-master-spec-assembly/SPEC.md** | Master entry point (this file) | First (you are here) |
| **10-master-spec-assembly/SYSTEM-SUMMARY.md** | Technology-neutral system overview | Immediately after SPEC.md |

These two files, combined with Phase 5-9 deliverables, form the complete v2.0 specification package.

### Phase 05: Visual Capture

**Purpose:** Screenshot-based visual truth for UI/UX

| File | Contents | Read When |
|------|----------|-----------|
| **05-visual-capture/SCREENSHOT-MANIFEST.md** | Index of all screenshots with descriptions | Before viewing screenshots |
| **05-visual-capture/screenshots/01-initial-states/** | Initial load, empty calendar views | Implementing initial state |
| **05-visual-capture/screenshots/02-slot-states/** | Available, booked, blocked, past slot visuals | Implementing slot rendering |
| **05-visual-capture/screenshots/03-booking-flow/** | Step-by-step booking creation sequence | Implementing booking panel |
| **05-visual-capture/screenshots/04-book-now-button/** | Quick booking feature states | Implementing Book Now |
| **05-visual-capture/screenshots/05-timezone-toggle/** | QLD/NSW timezone toggle states | Implementing timezone feature |
| **05-visual-capture/screenshots/06-responsive/** | Mobile (375px), tablet (768px), desktop (1440px) | Implementing responsive layout |
| **05-visual-capture/screenshots/07-annotated/** | All screenshots with labels and callouts | Reference throughout implementation |

**Screenshot naming convention:** `{category}--{number}-{description}.png`

**Use for:** Visual design reference, exact color values, spacing measurements, layout verification

### Phase 06: Code Extraction

**Purpose:** Clean React reference code with technology-neutral annotations

| File | Contents | Read When |
|------|----------|-----------|
| **06-code-extraction/FILE-MANIFEST.md** | Index of all extracted files with descriptions | Before exploring code |
| **06-code-extraction/ANNOTATIONS.md** | Technology translation guide (React → Rails) | Before reading React code |
| **06-code-extraction/DEPENDENCIES.json** | React package dependencies (reference only) | Understanding React dependencies |
| **06-code-extraction/extracted-code/api/** | API endpoint implementations (Vercel serverless) | Implementing API layer |
| **06-code-extraction/extracted-code/src/** | React components, hooks, utilities | Understanding client-side patterns |
| **06-code-extraction/extracted-code/src/App.jsx** | Main application component | Understanding app structure |
| **06-code-extraction/extracted-code/src/hooks/** | Custom React hooks (useBookings, usePollingSync, etc.) | Understanding state management |
| **06-code-extraction/extracted-code/src/utils/** | Utility functions (time, colors, storage) | Understanding helper logic |
| **06-code-extraction/extracted-code/styles-note.md** | CSS organization explanation | Understanding styling approach |

**WARNING:** This is React code. Adapt patterns, don't port syntax. See ANNOTATIONS.md for guidance.

**Use for:** Understanding implementation patterns, business logic reference, NOT as code to copy

### Phase 07: UI/UX Documentation

**Purpose:** Complete visual and interaction specifications

| File | Contents | Read When |
|------|----------|-----------|
| **07-ui-ux-documentation/LAYOUT-STRUCTURE.md** | Spatial hierarchy, containment, positioning, grid system | Implementing page layout |
| **07-ui-ux-documentation/DESIGN-TOKENS.md** | Colors (hex + RGB), typography, spacing, shadows (exact values) | Implementing visual design |
| **07-ui-ux-documentation/COMPONENT-STATES.md** | Interactive states (default, hover, active, disabled, focus) | Implementing interactions |
| **07-ui-ux-documentation/KEYBOARD-SHORTCUTS.md** | All keyboard interactions (context-aware modes) | Implementing keyboard nav |
| **07-ui-ux-documentation/RESPONSIVE-BEHAVIOR.md** | Breakpoints (375/768/1440), layout transformations | Implementing responsive design |
| **07-ui-ux-documentation/ANIMATIONS.md** | Transitions, motion, glass morphism effects | Implementing animations |

**Critical:** DESIGN-TOKENS.md provides exact values. Don't approximate colors or spacing.

**Use for:** Visual implementation, styling, interaction patterns, responsive behavior

### Phase 08: Architecture Documentation

**Purpose:** System architecture, data flow, API contracts

| File | Contents | Read When |
|------|----------|-----------|
| **08-architecture-documentation/DATA-STORAGE.md** | Storage structure, key formats, validation patterns | Implementing data layer |
| **08-architecture-documentation/INSTANCE-CONFIG.md** | Configuration format, environment variables, fallback | Setting up deployment |
| **08-architecture-documentation/API-CONTRACTS.md** | All 5 endpoints with request/response examples, error codes | Implementing API |
| **08-architecture-documentation/POLLING-SYNC.md** | Real-time sync mechanism (7-second polling), conflict resolution | Implementing sync |
| **08-architecture-documentation/STATE-MANAGEMENT.md** | Data flow, state updates, optimistic update pattern | Implementing state |

**Critical:** API-CONTRACTS.md defines exact request/response formats. Rails API must match precisely for client compatibility.

**Use for:** Backend implementation, database schema, API design, state synchronization

### Phase 09: Functional Documentation

**Purpose:** Complete behavior specifications, all business rules

| File | Contents | Read When |
|------|----------|-----------|
| **09-functional-documentation/BOOKING-FLOW.md** | Create/edit/delete flows, decision tables (154 table rows), state machines | Implementing booking operations |
| **09-functional-documentation/BOOK-NOW-FEATURE.md** | Quick booking feature specification, visibility rules | Implementing Book Now |
| **09-functional-documentation/TIMEZONE-TOGGLE.md** | QLD/NSW toggle behavior, DST detection via IANA | Implementing timezone |
| **09-functional-documentation/TIME-DATE-HANDLING.md** | Date formats, past slot detection, hourly refresh, week navigation | Implementing time logic |
| **09-functional-documentation/EDGE-CASES.md** | 41 edge cases across 9 categories with expected behaviors | Testing and validation |

**Critical:** BOOKING-FLOW.md decision tables are exhaustive. Every conditional branch documented.

**Use for:** Business logic implementation, validation rules, edge case handling

---

## Build Instructions

Implement the booking system in 8 milestone phases. Each milestone builds on the previous, enabling incremental verification.

### Milestone 1: Data Model and Storage

**What to build:** Database schema, storage layer, configuration system

**Read:**
- DATA-STORAGE.md (complete storage schema)
- INSTANCE-CONFIG.md (configuration structure)

**Implement:**
1. Create bookings storage structure:
   - Nested hash/JSON structure: `{ dateKey: { timeKey: { user, duration } } }`
   - Support Redis, PostgreSQL, or equivalent key-value/document store
2. Create configuration storage:
   - Instance slug, title, users array, creation timestamp
   - Environment variable for INSTANCE_SLUG
   - Hardcoded fallback configuration
3. Implement key formats:
   - dateKey: `YYYY-MM-DD` validation with regex `/^\d{4}-\d{2}-\d{2}$/`
   - timeKey: `HH:00` validation with regex `/^\d{2}:00$/`
   - Instance namespacing: `instance:{slug}:{resource}`

**Acceptance criteria:**
- Can store and retrieve bookings by date and time
- Can store and retrieve configuration by instance slug
- Validation rejects invalid date/time formats
- Empty date cleanup on deletion works (remove date key when last booking deleted)

### Milestone 2: API Endpoints

**What to build:** All 5 HTTP endpoints with exact contracts

**Read:**
- API-CONTRACTS.md (complete endpoint specifications)
- Functional specs for validation rules

**Implement:**
1. Security middleware (CORS, rate limiting, sanitization)
2. GET /api/config (return configuration or fallback)
3. GET /api/bookings (return all bookings nested structure)
4. POST /api/bookings (create booking with conflict detection)
5. PUT /api/bookings/update (update user/duration with extension validation)
6. DELETE /api/bookings/update (delete booking with empty date cleanup)

**Acceptance criteria:**
- All endpoints match exact request/response formats from API-CONTRACTS.md
- Security headers set on all responses
- Rate limiting enforces 60 requests/minute per IP
- Input sanitization prevents XSS (HTML tags removed, injection chars stripped)
- Conflict detection returns 409 with exact error messages
- Extension validation only checks NEW slots (not current booking's slots)

### Milestone 3: Core Booking Logic

**What to build:** Booking creation, editing, deletion with all validation rules

**Read:**
- BOOKING-FLOW.md (complete workflows and decision tables)
- EDGE-CASES.md (conflict scenarios)
- TIME-DATE-HANDLING.md (past slot detection, date handling)

**Implement:**
1. canBook() validation:
   - Check all slots in duration range (start + 0 through start + duration - 1)
   - Detect direct bookings and blocking by multi-hour bookings
2. canChangeDuration() validation:
   - Check only NEW slots beyond current duration
   - Allow shrinking without validation
3. Past slot detection:
   - End-of-hour boundary rule (slot past when next hour begins)
   - Today vs future date logic
4. Multi-hour blocking algorithm:
   - Single record at start time with duration field
   - Blocked status calculated: hour > bookingStart AND hour < (bookingStart + duration)

**Acceptance criteria:**
- All 154 decision table rows from BOOKING-FLOW.md pass
- canBook() rejects conflicts at any hour in range
- canChangeDuration() allows extension into user's own slots
- Past slots hidden on today, all slots visible on future dates
- Multi-hour booking stored as single record, blocks correct hours

### Milestone 4: UI Layout and Styling

**What to build:** Page layout, component structure, visual design

**Read:**
- LAYOUT-STRUCTURE.md (spatial hierarchy)
- DESIGN-TOKENS.md (exact values for colors, spacing, typography)
- Screenshots in 07-annotated/ (visual verification)

**Implement:**
1. Header (title, Book Now button, timezone toggle)
2. Calendar view container (day view and week view modes)
3. Slot grid (16 rows × 1 column for day view, 16 rows × 7 columns for week view)
4. Booking panel (slide-in from right on desktop, full-screen on mobile)
5. Booking popup (modal overlay with booking details)
6. Apply all design tokens:
   - Colors from DESIGN-TOKENS.md (exact hex/RGB values)
   - Typography (Inter font family, specified sizes and weights)
   - Spacing (8px base unit, specified gaps and padding)
   - Shadows (exact CSS shadow specifications)

**Acceptance criteria:**
- Visual appearance matches annotated screenshots
- All colors match DESIGN-TOKENS.md hex values exactly
- Spacing follows 8px grid system
- Layout responsive at 375px, 768px, 1440px breakpoints
- Glass morphism effect on booking blocks (backdrop-filter: blur)

### Milestone 5: Interactive States and Keyboard

**What to build:** Interactive states, keyboard navigation, mode system

**Read:**
- COMPONENT-STATES.md (all interactive states)
- KEYBOARD-SHORTCUTS.md (complete shortcut reference)
- BOOKING-FLOW.md (three interaction modes)

**Implement:**
1. Three mutually exclusive modes: NAVIGATION, PANEL, POPUP
2. Slot interactive states: default, hover, active, focus, disabled
3. Button interactive states: default, hover, active, focus, disabled
4. Keyboard navigation:
   - Arrow keys for date/slot navigation (context-aware)
   - User hotkeys (dynamic from configuration)
   - Duration hotkeys (1, 2, 3)
   - Global shortcuts (W, Z, N, Esc, Enter, D)
5. Mode transition rules (see BOOKING-FLOW.md mode transition table)
6. Keyboard trap in POPUP mode (disable navigation shortcuts)

**Acceptance criteria:**
- Only one mode active at any time
- Keyboard shortcuts match mode (navigation disabled in POPUP)
- Arrow keys skip booked/blocked slots
- User hotkeys come from configuration (not hardcoded)
- Tab navigation follows logical order
- Focus indicators visible on all interactive elements

### Milestone 6: Features (Book Now, Timezone)

**What to build:** Book Now button, timezone toggle

**Read:**
- BOOK-NOW-FEATURE.md (complete feature spec)
- TIMEZONE-TOGGLE.md (QLD/NSW toggle logic)
- TIME-DATE-HANDLING.md (DST detection)

**Implement:**
1. Book Now button:
   - Visibility calculation (current hour available AND within operating hours)
   - Auto-select current hour on activation
   - Switch to today if viewing different date
   - Hotkey: N key
2. Timezone toggle:
   - QLD mode: Display hour = Storage hour
   - NSW mode: Display hour = Storage hour + (isDST ? 1 : 0)
   - DST detection via IANA timezone ("Australia/Sydney")
   - Client-side preference storage (localStorage)
   - No API calls on toggle (display-only change)
3. Hourly refresh:
   - Calculate milliseconds to next hour
   - Fire at HH:00:00.000 exactly
   - Recalculate past slot visibility
   - Recalculate Book Now visibility

**Acceptance criteria:**
- Book Now hidden when current hour unavailable
- Book Now books current Queensland hour (not NSW display hour)
- Timezone toggle changes display immediately (no delay)
- Storage remains Queensland time regardless of toggle
- DST detection works on transition day (no hardcoded dates)
- Hourly refresh fires at exact hour boundary

### Milestone 7: Real-Time Sync

**What to build:** Polling synchronization, optimistic updates

**Read:**
- POLLING-SYNC.md (sync mechanism)
- STATE-MANAGEMENT.md (optimistic update pattern)
- API-CONTRACTS.md (API error handling)

**Implement:**
1. Polling sync:
   - 7-second interval
   - Complete state replacement (GET /api/bookings)
   - Continues on network errors (graceful degradation)
2. Optimistic updates:
   - Create: Add to local state immediately, API call background
   - Update: Change local state immediately, API call background
   - Delete: Remove from local state immediately, API call background
3. Rollback on failure:
   - On 409 Conflict: Trigger immediate sync
   - On 500 Error: Trigger immediate sync
   - Replace local state with server truth
   - Show error message to user
4. State initialization order:
   - Configuration loads first
   - Bookings load second
   - Polling starts third

**Acceptance criteria:**
- Changes from other users appear within 7 seconds
- Optimistic updates feel instant (no delay)
- Conflicts rollback automatically (no manual refresh)
- Network errors don't crash application
- Polling continues after errors (auto-retry)

### Milestone 8: Responsive and Polish

**What to build:** Responsive behavior, final polish, edge case handling

**Read:**
- RESPONSIVE-BEHAVIOR.md (breakpoint transformations)
- ANIMATIONS.md (transitions and motion)
- EDGE-CASES.md (all 41 scenarios)
- Screenshots in 06-responsive/ (visual verification)

**Implement:**
1. Responsive breakpoints:
   - Mobile (375px): Full-screen panel, simplified header, vertical layout
   - Tablet (768px): Side panel, full header, hybrid layout
   - Desktop (1440px): All features, optimal spacing
2. Animations:
   - Panel slide-in (300ms ease-out)
   - Popup fade-in (200ms)
   - Button hover transitions (150ms)
   - Focus ring animations
3. Edge case handling:
   - Test all 41 scenarios from EDGE-CASES.md
   - Verify expected behaviors match spec
   - Add defensive checks where needed

**Acceptance criteria:**
- Visual appearance matches responsive screenshots exactly
- Layout doesn't break at any viewport width
- All animations smooth (60fps)
- All 41 edge cases handled per EDGE-CASES.md
- Deployed version behaves identically to reference app (https://booking-bmo-financial-solutions.vercel.app)

---

## Boundaries

These explicit permission rules guide what you can do autonomously vs when to ask for human review.

### Always Do (No Approval Needed)

You have full autonomy to:

- Create models, controllers, services, views following Rails conventions
- Add tests for all business logic (aim for >90% coverage on booking operations)
- Update this spec when you discover missing details or ambiguities
- Commit working features with descriptive commit messages
- Add database migrations for new tables or schema changes
- Refactor code while maintaining identical behavior
- Fix bugs discovered during implementation
- Add logging and error handling
- Implement all features described in functional specs
- Use any Rails gems that match spec requirements (e.g., Redis for KV storage)

### Ask First (Requires Human Review)

Get approval before:

- Changing API contracts (URL paths, request/response formats, error codes)
  - Reason: Frontend depends on exact contracts from API-CONTRACTS.md
  - Exception: Bug fixes that correct contract to match spec (no approval needed)
- Modifying core business rules from functional specs
  - Reason: Behavior must match React version precisely
  - Exception: Fixing implementation to match spec (no approval needed)
- Changing data storage structure (key formats, nesting, field names)
  - Reason: API and frontend depend on exact structure from DATA-STORAGE.md
  - Exception: Bug fixes to match spec (no approval needed)
- Adding new features not in specification
  - Reason: Scope management, avoid feature creep
  - Exception: Features needed to satisfy functional specs (no approval needed)
- Changing technology stack components (database, cache, web framework)
  - Reason: Deployment environment constraints
  - Exception: Using equivalents that satisfy same contracts (e.g., PostgreSQL instead of MySQL)

### Never Do (Hard Stop)

Do not under any circumstances:

- Commit secrets, API keys, credentials, or tokens
  - Use environment variables for all sensitive configuration
  - Add .env to .gitignore
- Skip tests for booking operations
  - Core booking logic MUST have test coverage
  - Validation rules MUST be tested
  - Conflict detection MUST be tested
- Change technology-neutral behavior specs in this specification
  - Behaviors must match React version
  - If spec is wrong, report to human (don't modify spec yourself)
- Implement features explicitly out of scope
  - No user authentication (current spec has none)
  - No email notifications (not in spec)
  - No reporting/analytics (not in spec)
- Force push to main branch
  - Use pull requests for review
  - Protect main branch from force pushes

---

## Technology Stack

### Required

You must use these technologies to satisfy the specification:

- **Rails:** 7.x or later (or equivalent Ruby web framework)
- **Ruby:** 3.x or later
- **Database:** PostgreSQL (recommended) or MySQL for relational data
  - Schema must support nested JSON storage for bookings
  - Alternative: NoSQL database if it supports exact data structure from DATA-STORAGE.md
- **Key-Value Store:** Redis (recommended) or equivalent for bookings storage
  - Must support namespace isolation via key prefixes
  - Must support atomic read-modify-write operations
- **Web Server:** Puma, Unicorn, or equivalent Rack-compatible server

### Optional

You may use these technologies if they help implementation:

- **Background Jobs:** Sidekiq, Resque, or equivalent (useful for async operations)
- **API Testing:** RSpec, Minitest, or equivalent
- **Frontend:** Hotwire/Turbo, ViewComponent, or traditional Rails views
  - Specification assumes separate frontend consuming API
  - If building integrated Rails frontend, adapt UI specs to Rails patterns
- **Caching:** Redis, Memcached (useful for configuration caching)
- **Monitoring:** Application monitoring tools (New Relic, Sentry, etc.)

### Technology Constraints

**Display-only frontend:** This spec describes API contracts. If building Rails views, you must:
- Implement same visual design from screenshots
- Implement same keyboard shortcuts
- Implement same interaction modes
- Maintain exact API contracts (frontend consumes same API)

**Storage backend:** Any storage that satisfies:
- Nested JSON structure for bookings
- Instance isolation via namespace prefixes
- Atomic read-modify-write for conflict detection
- No TTL on booking data (persists indefinitely)

**Authentication:** Not required by spec. If adding:
- Don't break API contracts
- Maintain instance isolation via slug
- Add authentication as middleware (don't modify core booking logic)

---

## Success Criteria

Implementation is complete when ALL of the following are true:

### Functional Requirements

- [ ] All Phase 09 functional requirements implemented
  - [ ] Booking creation follows exact flow from BOOKING-FLOW.md
  - [ ] Booking editing supports inline user/duration changes
  - [ ] Booking deletion removes booking with empty date cleanup
  - [ ] All validation rules from decision tables pass
  - [ ] Three interaction modes (NAVIGATION, PANEL, POPUP) work correctly

- [ ] All Phase 08 API contracts satisfied
  - [ ] GET /api/config returns exact format from spec
  - [ ] GET /api/bookings returns nested structure
  - [ ] POST /api/bookings validates and creates
  - [ ] PUT /api/bookings/update supports partial updates
  - [ ] DELETE /api/bookings/update removes booking
  - [ ] All error codes and messages match API-CONTRACTS.md

### Visual Requirements

- [ ] Visual appearance matches Phase 05 screenshots
  - [ ] All colors match DESIGN-TOKENS.md hex values
  - [ ] Spacing follows 8px grid system
  - [ ] Typography matches Inter font specifications
  - [ ] Glass morphism effect on booking blocks
  - [ ] Responsive behavior at 375px, 768px, 1440px

- [ ] Interactive states match COMPONENT-STATES.md
  - [ ] Hover states visible on all interactive elements
  - [ ] Focus indicators meet accessibility standards
  - [ ] Disabled states visually distinct
  - [ ] Active states provide feedback

### Edge Cases and Testing

- [ ] All 41 edge cases from EDGE-CASES.md handled
  - [ ] Concurrent booking attempts (EC-01)
  - [ ] End-of-hour boundary (EC-05)
  - [ ] Multi-hour blocking (EC-04)
  - [ ] DST transitions (EC-15)
  - [ ] Week navigation (EC-11, EC-12)
  - [ ] Keyboard trap in popup (EC-28)
  - [ ] Empty date cleanup (EC-29)
  - [ ] All other 34 scenarios

- [ ] Test coverage >90% for booking operations
  - [ ] Booking creation validation
  - [ ] Booking update validation
  - [ ] Conflict detection (canBook, canChangeDuration)
  - [ ] Multi-hour blocking algorithm
  - [ ] Past slot detection

### Deployment and Verification

- [ ] Deployed version accessible and functional
- [ ] Deployed version behaves identically to reference app
  - [ ] Create booking: Same validation, same visuals, same API
  - [ ] Edit booking: Same inline editing, same optimistic updates
  - [ ] Delete booking: Same instant feedback, same cleanup
  - [ ] Real-time sync: Changes from other users appear within 7 seconds
- [ ] All keyboard shortcuts work as specified
- [ ] Timezone toggle works (QLD/NSW display offset)
- [ ] Book Now button appears/hides correctly

---

## Questions During Implementation

If you encounter issues while implementing:

### Missing Detail in Spec

**What to do:**
1. Check cross-referenced documents (e.g., if API spec unclear, check DATA-STORAGE.md)
2. Check EDGE-CASES.md for related scenarios
3. Check screenshots for visual clarification
4. If still unclear, update spec with your question and proposed answer
5. Mark section with `<!-- AI-QUESTION: [your question] -->`
6. Implement your best interpretation (document assumption)
7. Flag for human review in pull request

**Example:**
```markdown
<!-- AI-QUESTION: Should duration validation happen before or after user validation? -->
Implementation assumes: Duration validation after user validation (fail fast on user)
```

### Unclear Requirement

**Resolution order:**
1. Check functional specs first (BOOKING-FLOW.md, EDGE-CASES.md)
2. Check screenshots second (visual clarification)
3. Check code third (reference implementation)
4. If still unclear, ask human (don't guess on critical behavior)

**Example:**
- Question: "What happens if user changes duration while another user books the extension slot?"
- Check: EDGE-CASES.md → EC-18 (Polling tick during booking creation)
- Answer: Validation recalculates, extension may become unavailable (optimistic update rolls back)

### Conflicting Information

**When specs seem to disagree:**

**Screenshots vs text:**
- Screenshots are precise, text may be approximate
- Use screenshot values for colors, spacing, sizing
- Use text for behavior descriptions

**Functional specs vs code:**
- Code may have bugs or outdated implementations
- Functional specs describe intended behavior
- Implement per functional specs, not per code

**Multiple specs describe same thing:**
- Check "Last Updated" dates (newer likely more accurate)
- Check EDGE-CASES.md for definitive answer
- If genuinely ambiguous, ask human (mark with AI-QUESTION)

### Out of Scope Feature

**If you discover a feature that seems important but isn't in spec:**

**Ask yourself:**
1. Is this required for a functional requirement in Phase 09? → Implement
2. Is this needed for an edge case in EDGE-CASES.md? → Implement
3. Is this a security/data integrity requirement? → Implement
4. Is this a "nice to have" improvement? → Ask human first

**Examples:**
- User wants email notifications → Out of scope, ask human
- API needs CSRF protection → Security requirement, implement
- Booking needs "notes" field → Not in spec, ask human
- canChangeDuration needs to check blocked slots → Required for EC-02, implement

---

## Implementation Verification

Use this checklist to verify your implementation matches the spec:

### API Contract Verification

Run these cURL tests to verify API contracts:

```bash
# Test 1: Get configuration
curl -X GET http://localhost:3000/api/config
# Expected: JSON with slug, title, users array, createdAt

# Test 2: Get empty bookings
curl -X GET http://localhost:3000/api/bookings
# Expected: {}

# Test 3: Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"dateKey":"2026-02-14","timeKey":"09:00","user":"Jack","duration":2}'
# Expected: 201 with {"success":true,"booking":{...}}

# Test 4: Conflict on create
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{"dateKey":"2026-02-14","timeKey":"09:00","user":"Bonnie","duration":1}'
# Expected: 409 with {"error":"Slot already booked"}

# Test 5: Update booking
curl -X PUT http://localhost:3000/api/bookings/update \
  -H "Content-Type: application/json" \
  -d '{"dateKey":"2026-02-14","timeKey":"09:00","updates":{"user":"Bonnie"}}'
# Expected: 200 with {"success":true,"booking":{"user":"Bonnie","duration":2}}

# Test 6: Delete booking
curl -X DELETE http://localhost:3000/api/bookings/update \
  -H "Content-Type: application/json" \
  -d '{"dateKey":"2026-02-14","timeKey":"09:00"}'
# Expected: 200 with {"success":true}

# Test 7: Verify empty cleanup
curl -X GET http://localhost:3000/api/bookings
# Expected: {} (date key removed after last booking deleted)
```

### Visual Verification

Compare your deployed version against annotated screenshots:

1. Open `../05-visual-capture/screenshots/07-annotated/`
2. For each screenshot:
   - Open same state in your application
   - Visual diff: colors, spacing, sizing, typography
   - Note any discrepancies
3. Key screenshots to verify:
   - `01-initial-states--001-empty-calendar.png` - Initial load
   - `02-slot-states--001-slot-available.png` - Available slot styling
   - `02-slot-states--002-slot-booked.png` - Booked slot styling
   - `03-booking-flow--002-panel-open.png` - Booking panel layout
   - `07-annotated--all` - All annotated versions for measurements

### Behavior Verification

Test these scenarios manually:

1. **Booking creation:**
   - Click available slot → Panel opens
   - Select user → User highlighted
   - Select duration → Booking created, panel closes

2. **Multi-hour booking:**
   - Create booking with duration 3
   - Verify start slot shows "booked"
   - Verify next 2 slots show "blocked"
   - Verify slot after duration shows "available"

3. **Conflict detection:**
   - Create booking at 9:00 AM with duration 2
   - Attempt to create at 10:00 AM → Should fail (slot blocked)
   - Attempt to create at 8:00 AM with duration 2 → Should fail (would overlap 9:00)

4. **Duration extension:**
   - Create booking with duration 1
   - Edit booking, change duration to 3
   - If slots available → Extension succeeds
   - If slot occupied → Extension disabled (button grayed)

5. **Timezone toggle:**
   - Toggle to NSW mode
   - Verify all times shifted +1 hour (during DST)
   - Create booking → Verify stored in QLD time
   - Toggle back to QLD → Verify times return to original

6. **Keyboard navigation:**
   - Press Down arrow → First available slot focused
   - Press Down again → Next available slot focused (skips booked)
   - Press Enter → Panel opens
   - In popup, press W → No effect (keyboard trap)

---

**End of Master Specification**

For detailed implementation guidance, proceed to SYSTEM-SUMMARY.md (complete mental model), then Phase 05-09 specifications as outlined in "How to Use This Spec" section above.
