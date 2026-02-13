---
phase: 09-functional-documentation
plan: 03
subsystem: documentation
tags: [functional-spec, time-date-handling, edge-cases, behavior-specification, technology-neutral]

# Dependency graph
requires:
  - phase: 08-architecture-documentation
    provides: DATA-STORAGE.md, POLLING-SYNC.md, STATE-MANAGEMENT.md for cross-referencing
  - phase: 06-code-extraction
    provides: Source code files (time.js, useBookings.js, App.jsx, useHourlyRefresh.js) for behavior extraction
  - phase: 09-functional-documentation
    plan: ["09-01", "09-02"]
    provides: BOOKING-FLOW.md, BOOK-NOW-FEATURE.md, TIMEZONE-TOGGLE.md for cross-referencing
provides:
  - TIME-DATE-HANDLING.md with complete time/date logic specification
  - EDGE-CASES.md with 31 edge cases across 9 categories
  - Complete Phase 9: All 5 functional requirements satisfied
affects: [10-verification, future-rails-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exhaustive edge case documentation with concrete expected behavior"
    - "Technology-neutral time/date specifications"
    - "Category-based edge case organization for implementer reference"

key-files:
  created:
    - .planning/phases/09-functional-documentation/TIME-DATE-HANDLING.md
    - .planning/phases/09-functional-documentation/EDGE-CASES.md
  modified: []

key-decisions:
  - "Document end-of-hour boundary rule: slot past only when next hour begins"
  - "Document hourly refresh mechanism with precision timing to HH:00:00.000"
  - "Document multi-hour blocking algorithm with worked examples"
  - "Organize edge cases by category (not by feature) for ease of reference"
  - "No vague outcomes: every edge case has specific expected behavior"
  - "Include Given-When-Then format for critical edge cases"

patterns-established:
  - "Complete slot logic documentation: generation, past detection, blocking, visibility"
  - "Week navigation with Monday-start convention and getStartOfWeek algorithm"
  - "Edge case format: What Happens, Expected Behavior, Why This Works, Warning Signs"
  - "Cross-references tie all functional docs together into cohesive specification"
  - "Technology-neutral language throughout: 'System' not 'Component', outcomes not mechanisms"

# Metrics
duration: 8min
completed: 2026-02-13
---

# Phase 09 Plan 03: Time/Date Handling and Edge Cases Documentation

**Complete time/date logic and comprehensive edge case catalog with 31 scenarios, completing Phase 9 functional documentation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-13T00:15:22Z
- **Completed:** 2026-02-13T00:23:09Z
- **Tasks:** 2
- **Files created:** 2
- **Total lines:** 1,916

## Accomplishments

- **646-line TIME-DATE-HANDLING.md** documenting all time and date logic:
  - Operating hours (START_HOUR 6, END_HOUR 22) and 16 hourly slots
  - Time slot generation with complete slot table (hour, time, key)
  - isSlotPast logic with end-of-hour boundary rule (worked examples)
  - Multi-hour booking slot blocking algorithm (worked examples)
  - Week navigation with Monday-start convention (getStartOfWeek, getWeekDays)
  - Date formatting reference table (storage YYYY-MM-DD vs display formats)
  - Hourly refresh mechanism with precision timing
  - Timezone display offset (QLD vs NSW) with conversion formula

- **1,270-line EDGE-CASES.md** cataloging 31 edge cases across 9 categories:
  - **Booking Conflicts:** EC-01 through EC-04 (race conditions, extension conflicts, blocking)
  - **Past Hours and Current Hour:** EC-05 through EC-08 (booking at :59, hour transitions, Book Now)
  - **Multi-Hour Bookings:** EC-09 through EC-10 (duration limits, week view display)
  - **Week Transitions:** EC-11 through EC-14 (Sunday navigation, getStartOfWeek, view switching)
  - **Timezone Edge Cases:** EC-15 through EC-17 (DST transitions, display offset, data isolation)
  - **Polling and Sync:** EC-18 through EC-21 (polling conflicts, network errors, rapid operations)
  - **Configuration:** EC-22 through EC-24 (API unavailable, dynamic shortcuts, >6 users)
  - **Keyboard Navigation:** EC-25 through EC-28 (skip booked slots, week view, input fields, popup trap)
  - **Data Integrity:** EC-29 through EC-31 (empty date cleanup, invalid data, off-screen dates)

- **Complete Phase 9:** All 5 functional requirements satisfied:
  - FUNC-01: BOOKING-FLOW.md (Plan 01)
  - FUNC-02: BOOK-NOW-FEATURE.md (Plan 02)
  - FUNC-03: TIMEZONE-TOGGLE.md (Plan 02)
  - FUNC-04: EDGE-CASES.md (Plan 03) ✓
  - FUNC-05: TIME-DATE-HANDLING.md (Plan 03) ✓

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TIME-DATE-HANDLING.md (FUNC-05)** - `a23b1e9` (docs)
2. **Task 2: Create EDGE-CASES.md (FUNC-04)** - `8d33d27` (docs)

## Files Created/Modified

- `.planning/phases/09-functional-documentation/TIME-DATE-HANDLING.md` (646 lines) - Complete time and date logic specification:
  - Operating hours and slot generation
  - Current hour and isSlotPast logic with end-of-hour boundary rule
  - Multi-hour booking slot blocking with worked examples
  - Week navigation with Monday-start convention
  - Date formatting reference table
  - Hourly refresh mechanism
  - Timezone display offset

- `.planning/phases/09-functional-documentation/EDGE-CASES.md` (1,270 lines) - Comprehensive edge case catalog:
  - 31 edge cases across 9 categories
  - Each with: What Happens, Expected Behavior, Why This Works, Warning Signs
  - Given-When-Then format for critical scenarios
  - No vague outcomes: every scenario has concrete expected behavior
  - 29 cross-references to other functional docs

## Decisions Made

1. **End-of-hour boundary rule for isSlotPast:** Slot is past ONLY when next hour begins (9:00 AM slot available until 10:00:00). **Why:** Users should be able to book "right now" even if 45 minutes have passed in the hour.

2. **Hourly refresh with precision timing:** System calculates exact milliseconds until next hour and fires at HH:00:00.000. **Why:** Ensures past slots disappear from today's view exactly when hour changes, preventing booking attempts on just-past slots.

3. **Multi-hour blocking algorithm documented with worked examples:** Booking at hour H with duration D blocks hours H+1 through H+D-1 (NOT H or H+D). **Why:** Clear algorithm prevents off-by-one errors in blocked slot detection.

4. **Edge cases organized by category, not feature:** Categories include Booking Conflicts, Past Hours, Multi-Hour Bookings, Week Transitions, Timezone, Polling/Sync, Configuration, Keyboard Navigation, Data Integrity. **Why:** Implementers can find all related edge cases together (e.g., all timezone edge cases in one section).

5. **No vague edge case outcomes:** Every edge case has specific expected behavior, not "handle gracefully" or "handle appropriately". **Why:** Implementers need concrete specifications, not interpretation.

6. **Include Given-When-Then format for critical edge cases:** Race conditions, DST transitions, hour boundaries use Given-When-Then. **Why:** Testable specifications map directly to automated tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all source files available, behavior extractable from code annotations and architecture docs.

## User Setup Required

None - no external service configuration required. This is documentation only.

## Next Phase Readiness

**Phase 9 (Functional Documentation) COMPLETE.**

**All 5 functional specifications delivered:**
1. BOOKING-FLOW.md (FUNC-01) - 1,154 lines, 154 decision table rows, 12 Given-When-Then scenarios
2. BOOK-NOW-FEATURE.md (FUNC-02) - 412 lines, visibility decision table, 8 edge cases
3. TIMEZONE-TOGGLE.md (FUNC-03) - 604 lines, DST detection, display conversion, 8 edge cases
4. EDGE-CASES.md (FUNC-04) - 1,270 lines, 31 edge cases across 9 categories
5. TIME-DATE-HANDLING.md (FUNC-05) - 646 lines, complete time/date logic

**Total functional documentation:** 4,086 lines across 5 documents

**Phase 10 (Verification) is ready to begin:**
- Complete behavior specification available
- All edge cases documented with expected behavior
- Technology-neutral language allows Rails implementation
- Cross-references connect all specifications

**No blockers for Phase 10.**

---

## Verification Summary

**Must-haves verification:**

✓ **QLD timezone storage rationale documented** - TIME-DATE-HANDLING.md "Overview" section with IANA reference
✓ **Slot calculation logic documented** - generateTimeSlots, isSlotPast, isSlotBlocked with complete slot table
✓ **Current hour logic with end-of-hour boundary rule** - Worked examples at different times (:01, :30, :45, :59, :00)
✓ **Week navigation with Monday-start** - getStartOfWeek algorithm, getWeekDays, complete calculation table
✓ **All edge cases cataloged with exact expected behavior** - 31 edge cases, no vague "handle gracefully" outcomes
✓ **Booking conflicts with concrete scenarios** - EC-01 through EC-04 with Given-When-Then format
✓ **Midnight boundary and operating hour limits** - START_HOUR/END_HOUR, duration validation edge cases

**Artifact verification:**

✓ TIME-DATE-HANDLING.md: 646 lines (min: 200), contains "Slot", provides time/date specification
✓ EDGE-CASES.md: 1,270 lines (min: 300), contains "Edge Case", provides comprehensive catalog

**Key links verification:**

✓ EDGE-CASES.md → BOOKING-FLOW.md: 4 references (booking creation, edit, optimistic updates)
✓ EDGE-CASES.md → BOOK-NOW-FEATURE.md: 2 references (current hour visibility, recalculation)
✓ EDGE-CASES.md → TIMEZONE-TOGGLE.md: 3 references (DST detection, display conversion, IANA)
✓ TIME-DATE-HANDLING.md → DATA-STORAGE.md: Cross-reference in "Implementation References"

**Pattern verification:**

✓ Technology-neutral language: "System generates" not "function returns"
✓ Worked examples with concrete times and dates
✓ Decision tables and calculation tables
✓ Given-When-Then format for critical edge cases
✓ Warning Signs for implementation validation

---

## Implementation Guidance for Rails Developer

### TIME-DATE-HANDLING.md

**What to build:**
1. **Operating hours constants:** START_HOUR = 6, END_HOUR = 22
2. **Slot generation:** Loop 6-21, create slot objects with hour/time/key
3. **isSlotPast logic:** Compare current time to END of slot (hour + 1, minute 0, second 0)
4. **Multi-hour blocking:** Check if hour > bookingHour AND hour < bookingHour + duration
5. **Week navigation:** getStartOfWeek (Sunday → -6 days, other → go back to Monday)
6. **Hourly refresh:** Calculate ms until next hour, trigger re-render at HH:00:00.000
7. **Date formatting:** YYYY-MM-DD for storage, various formats for display

**Read these sections:**
- "Operating Hours" for constants
- "Time Slot Generation" for slot structure
- "Current Hour and isSlotPast Logic" for exact boundary rule
- "Multi-Hour Booking Slot Logic" for blocking algorithm
- "Week Navigation" for getStartOfWeek calculation
- "Hourly Refresh Mechanism" for precision timing

**Key constraint:** End-of-hour boundary rule is critical for "book now" UX

---

### EDGE-CASES.md

**What to use this for:**
1. **Implementation validation:** Use "Warning Signs" to detect incorrect implementation
2. **Test case generation:** Each edge case maps to an automated test
3. **Boundary condition handling:** Every "what if" scenario has expected behavior
4. **Error case reference:** Polling errors, API failures, invalid data all documented

**Categories to prioritize:**
- **Booking Conflicts (EC-01 to EC-04):** Test race conditions and optimistic rollback
- **Past Hours (EC-05 to EC-08):** Test hour boundary logic with :59 and :00 times
- **Multi-Hour Bookings (EC-09 to EC-10):** Test duration limits and blocking display
- **Polling and Sync (EC-18 to EC-21):** Test network errors and rapid operations
- **Data Integrity (EC-29 to EC-31):** Test empty date cleanup and invalid data handling

**How to use:**
- Read "Expected Behavior" for exact system response
- Read "Why This Works" for implementation rationale
- Read "Warning Signs" to validate your implementation
- Use Given-When-Then scenarios as test specs

---

## Dependency Graph

### Requires (Built Upon)

- **Phase 06** — Code extraction (time.js, useBookings.js, App.jsx, useHourlyRefresh.js)
- **Phase 08** — DATA-STORAGE.md, POLLING-SYNC.md, STATE-MANAGEMENT.md for cross-referencing
- **Phase 09 Plans 01-02** — BOOKING-FLOW.md, BOOK-NOW-FEATURE.md, TIMEZONE-TOGGLE.md for edge case context

### Provides (Enables)

- **Phase 10** — Complete functional specification for verification
- **Future Rails implementation** — Technology-neutral time/date logic reference
- **Future testing** — 31 edge cases map directly to automated tests

### Affects (Impacts)

- **All implementation work** — Time/date logic is foundational for all features
- **Testing strategy** — Edge case catalog defines test coverage
- **Rails developer onboarding** — Edge cases explain "why" for complex logic

---

## Tech Stack

### Tech Added

None (documentation only)

### Patterns Established

1. **End-of-hour boundary rule** for slot past detection
2. **Precision hourly refresh** with millisecond calculation
3. **Category-based edge case organization** for implementer reference
4. **Concrete expected behavior** (no vague "handle gracefully")
5. **Warning signs** for implementation validation

### Libraries Referenced

- JavaScript Date API (for date arithmetic)
- Intl.DateTimeFormat (for DST detection, referenced from TIMEZONE-TOGGLE.md)

---

## Files Modified

### Created

- `.planning/phases/09-functional-documentation/TIME-DATE-HANDLING.md` (+646 lines)
- `.planning/phases/09-functional-documentation/EDGE-CASES.md` (+1,270 lines)

### Modified

None

### Deleted

None

---

## Metrics

**Duration:** 8 minutes
**Tasks completed:** 2/2
**Lines documented:** 1,916 lines
**Edge cases covered:** 31 scenarios across 9 categories
**Cross-references:** 29 links to other functional docs
**Worked examples:** 12+ examples with concrete times and dates

---

## Search Keywords

`time handling`, `date logic`, `slot generation`, `isSlotPast`, `isSlotBlocked`, `current hour`, `end of hour`, `boundary rule`, `multi-hour booking`, `week navigation`, `Monday start`, `getStartOfWeek`, `hourly refresh`, `precision timing`, `edge cases`, `boundary conditions`, `race conditions`, `DST transitions`, `booking conflicts`, `past slots`, `timezone offset`, `operating hours`, `START_HOUR`, `END_HOUR`, `technology-neutral`, `functional specification`, `Given-When-Then`, `expected behavior`, `warning signs`
