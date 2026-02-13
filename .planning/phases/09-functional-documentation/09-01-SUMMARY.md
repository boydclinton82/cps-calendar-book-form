---
phase: 09-functional-documentation
plan: 01
subsystem: documentation
tags: [functional-spec, booking-flow, behavior-specification, technology-neutral, decision-tables, state-machines, given-when-then]

# Dependency graph
requires:
  - phase: 08-architecture-documentation
    provides: DATA-STORAGE.md, API-CONTRACTS.md, STATE-MANAGEMENT.md for cross-referencing
  - phase: 06-code-extraction
    provides: Source code files (App.jsx, useBookings.js, BookingPanel.jsx, BookingPopup.jsx) for behavior extraction
provides:
  - BOOKING-FLOW.md with complete booking lifecycle specification (create, edit, delete)
  - Three interaction modes (NAVIGATION, PANEL, POPUP) with state transitions
  - Conflict detection logic (canBook vs canChangeDuration)
  - 12 Given-When-Then scenarios for testable behavior
  - 154 decision table rows documenting conditional logic
  - Technology-neutral language for cross-framework implementation
affects: [10-verification, future-rails-implementation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Hybrid documentation approach: workflow narratives + decision tables + state machines + Given-When-Then scenarios"
    - "Technology-neutral behavior specification (no React/Rails coupling)"
    - "Exhaustive decision tables for all conditional logic"
    - "State machines for complex UI flows"

key-files:
  created:
    - .planning/phases/09-functional-documentation/BOOKING-FLOW.md
  modified: []

key-decisions:
  - "Use hybrid documentation approach combining workflow narratives, decision tables, and Given-When-Then scenarios per 09-RESEARCH.md"
  - "Document all conditional logic in decision tables (154 rows total) - no vague prose for branching behavior"
  - "Include both canBook() and canChangeDuration() conflict detection logic with worked examples"
  - "Specify three application modes (NAVIGATION, PANEL, POPUP) as mutually exclusive states"
  - "Document keyboard shortcut context-awareness (shortcuts disabled/enabled by mode)"

patterns-established:
  - "Decision tables for all conditional logic: slot click behavior, duration validation, user selection, conflict scenarios"
  - "State machines for UI flows: booking panel (3 states), booking popup (2 states)"
  - "Given-When-Then scenarios for testable specifications (12 scenarios covering happy path and edge cases)"
  - "Cross-references to architecture docs: DATA-STORAGE.md for structure, API-CONTRACTS.md for operations, STATE-MANAGEMENT.md for patterns"
  - "Technology-neutral language: 'System' not 'Component', 'User' not 'onClick', outcomes not mechanisms"

# Metrics
duration: 5min
completed: 2026-02-13
---

# Phase 09 Plan 01: Booking Flow Functional Specification

**Complete booking lifecycle specification with 154 decision table rows, 3-mode state machine, and 12 testable Given-When-Then scenarios**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-13T00:05:13Z
- **Completed:** 2026-02-13T00:10:05Z
- **Tasks:** 1
- **Files modified:** 1 created

## Accomplishments

- **1,154-line BOOKING-FLOW.md** documenting complete booking lifecycle (create, edit, delete)
- **Three application modes** (NAVIGATION, PANEL, POPUP) with mutual exclusivity and keyboard trap rules
- **154 decision table rows** covering slot click behavior, duration validation, conflict detection, mode transitions
- **Two state machines** (booking panel with 3 states, booking popup with 2 states) with full transition tables
- **12 Given-When-Then scenarios** covering happy paths, conflicts, cancellation, keyboard navigation, optimistic rollback
- **Conflict detection logic** with worked examples distinguishing canBook() (all slots) vs canChangeDuration() (only new slots)
- **Technology-neutral language** throughout - Rails developer can implement identical behavior without React knowledge
- **Cross-references** to DATA-STORAGE.md, API-CONTRACTS.md, STATE-MANAGEMENT.md for implementation details

## Task Commits

Each task was committed atomically:

1. **Task 1: Create BOOKING-FLOW.md (FUNC-01)** - `68c9d48` (docs)

## Files Created/Modified

- `.planning/phases/09-functional-documentation/BOOKING-FLOW.md` - Complete functional specification for booking lifecycle including:
  - **Application Modes**: 3 mutually exclusive interaction modes (NAVIGATION, PANEL, POPUP)
  - **Booking Creation Flow**: 4-step workflow (slot selection → user selection → duration selection → confirmation)
  - **Booking Edit Flow**: 4-step workflow (booking click → inline user change → inline duration change → close)
  - **Booking Deletion Flow**: Immediate removal with empty date cleanup
  - **Booking Panel State Machine**: 3 states (CLOSED, AWAITING_USER, AWAITING_DURATION)
  - **Booking Popup State Machine**: 2 states (CLOSED, VIEWING)
  - **Keyboard Shortcuts**: Context-aware activation table (navigation vs panel vs popup mode)
  - **Conflict Detection**: canBook() vs canChangeDuration() algorithms with examples
  - **Given-When-Then Scenarios**: 12 scenarios (happy paths, conflicts, cancellation, keyboard-only, rollback)

## Decisions Made

1. **Three mutually exclusive modes**: NAVIGATION, PANEL, POPUP modes cannot overlap - selecting slot while popup open has no effect, clicking booking while panel open has no effect. **Why:** Prevents UI state conflicts and user confusion.

2. **Keyboard trap in POPUP MODE**: All navigation shortcuts (W, Z, arrows, Book Now) disabled while popup open. **Why:** Prevents accidental navigation while editing booking.

3. **Decision tables for all branching logic**: 154 table rows cover slot click behavior (6 conditions), duration validation (15+ scenarios), mode transitions (11 transitions), etc. **Why:** Tables reveal gaps prose hides; AI and developers can scan tables faster than parsing conditional prose.

4. **Separate conflict logic for create vs extend**: canBook() checks ALL slots, canChangeDuration() checks only NEW slots beyond current duration. **Why:** User extending booking shouldn't be blocked by their own booking's occupied slots.

5. **12 Given-When-Then scenarios**: Cover happy path (create 1hr, edit user), conflicts (3hr with hour 2 booked), edge cases (cancel mid-flow, keyboard-only, optimistic rollback). **Why:** Testable specifications map directly to automated tests.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all source files available, behavior extractable from code annotations and architecture docs.

## User Setup Required

None - no external service configuration required. This is documentation only.

## Next Phase Readiness

**BOOKING-FLOW.md complete and ready for Phase 09 Plan 02** (BOOK-NOW-FEATURE.md).

**Highlights:**
- All must-haves met: 3 flows documented, decision tables exhaustive, state machines complete, 12 Given-When-Then scenarios
- Minimum 400 lines exceeded: 1,154 lines delivered
- Cross-references verified: 11 references to DATA-STORAGE.md, API-CONTRACTS.md, STATE-MANAGEMENT.md
- Technology-neutral language verified: Only 1 React term outside source references
- 154 decision table rows document all conditional logic

**No blockers for next plan.**

---
*Phase: 09-functional-documentation*
*Completed: 2026-02-13*
