# Phase 09 Plan 02: Feature Documentation Summary

**Phase:** 09-functional-documentation
**Plan:** 02
**Subsystem:** Documentation / Functional Specifications
**Status:** Complete
**Completed:** 2026-02-13

---

## One-Liner

Complete behavioral specifications for Book Now (one-click current hour booking) and Timezone Toggle (NSW DST display conversion) with exhaustive decision tables, edge cases, and IANA timezone references.

---

## What Was Delivered

### Artifacts Created

1. **BOOK-NOW-FEATURE.md (FUNC-02)** — 412 lines
   - Complete visibility decision table (8 condition combinations)
   - Step-by-step interaction flow from button click to panel open
   - 8 edge case scenarios with Given-When-Then format
   - Recalculation triggers documentation
   - Visual specification and accessibility notes
   - Cross-references to BOOKING-FLOW.md and UI documentation

2. **TIMEZONE-TOGGLE.md (FUNC-03)** — 604 lines
   - Complete DST detection logic using IANA timezone names
   - Display conversion rules with QLD/NSW offset examples
   - Preference persistence via localStorage specification
   - 8 edge case scenarios including DST transition handling
   - Implementation constraints (must-use IANA, forbidden hardcoded dates)
   - Clear separation of storage (QLD) vs display (QLD/NSW)

### Key Characteristics

**Technology-neutral language:**
- "System evaluates" not "useMemo recalculates"
- "User clicks button" not "onClick handler fires"
- "Storage writes to key" not "localStorage.setItem called"

**Exhaustive decision tables:**
- Book Now: All combinations of hour range, slot past, slot status
- Timezone Toggle: DST detection abbreviation mapping

**Complete edge case coverage:**
- Book Now at hour boundaries (9:59 AM → 10:00 AM)
- Timezone toggle during/outside DST periods
- DST transition days (clocks spring forward/fall back)
- localStorage failures (graceful fallback)

**IANA timezone references:**
- Australia/Brisbane (QLD, no DST, UTC+10 year-round)
- Australia/Sydney (NSW, with DST, UTC+10/UTC+11)
- Rationale: DST rules change by legislation; IANA database maintained externally

---

## Technical Decisions Made

### Decision 1: Book Now Uses Internal QLD Time

**Context:** NSW users with timezone toggle enabled see times offset by +1h during DST

**Decision:** Book Now always books the current QLD hour, not the displayed NSW hour

**Rationale:**
- Business operates in Queensland time
- Storage is QLD time
- "Book Now" means "book the current business hour"
- Display offset is visual only, not semantic

**Impact:**
- NSW user at 10:37 AM NSW time (9:37 AM QLD time) clicking Book Now books 9:00 AM slot
- Panel shows "10:00 AM" (because NSW toggle respects display), but timeKey is "09:00"

**Alternative considered:** Book Now could use displayed time
- Rejected: Would create confusion between "now" in business time vs "now" in display time

---

### Decision 2: Visibility Hidden (Not Disabled) for Book Now

**Context:** Book Now button appears/disappears based on current hour availability

**Decision:** Button is completely hidden when unavailable, not shown in disabled state

**Rationale:**
- Disabled button raises question "Why can't I book now?"
- Hidden button is clearer: "Book now not available" is implicit
- Reduces UI clutter when feature is unavailable
- Pulsing animation only shows when action is actually available

**Impact:**
- No disabled state styling needed
- No tooltip explaining why disabled
- Header layout shifts slightly when button appears/disappears

**Alternative considered:** Show disabled button with tooltip
- Rejected: Tooltip adds complexity; hiding is simpler and clearer

---

### Decision 3: DST Detection Must Use IANA Timezone Names

**Context:** NSW DST rules have changed historically (e.g., 2006 extension)

**Decision:** All DST detection uses Intl API with `Australia/Sydney` timezone name

**Rationale:**
- DST rules are legislation-dependent and can change
- Hardcoded dates (e.g., "first Sunday in October") become wrong when rules change
- IANA timezone database is maintained by platform (browser/OS)
- Platform receives automatic updates when DST rules change
- System always uses current rules without code changes

**Impact:**
- Implementation constraint: Must use Intl.DateTimeFormat with timeZone parameter
- Forbidden: Hardcoded month/day calculations
- Forbidden: Static offset assumptions

**Alternative considered:** Calculate DST dates programmatically
- Rejected: Brittle, requires updates when legislation changes

---

### Decision 4: Timezone Preference Stored Client-Side Only

**Context:** NSW users want preference to persist across sessions

**Decision:** Store preference in browser localStorage, no server-side storage

**Rationale:**
- Single-instance app (not multi-device)
- No user authentication system (no server-side user profiles)
- Client-side preference is sufficient for browser-based app
- Simpler implementation (no API endpoint needed)

**Impact:**
- Preference is browser-specific (doesn't sync across devices)
- Private browsing mode won't persist preference
- No server-side component for timezone toggle

**Alternative considered:** Server-side preference storage
- Rejected: Requires authentication, API endpoints, unnecessary complexity for single-instance app

---

### Decision 5: Simple Offset Addition (Not Full Timezone Conversion)

**Context:** Need to convert QLD time to NSW time for display

**Decision:** Use simple addition `displayHour = storageHour + (isDST ? 1 : 0)`

**Rationale:**
- We know the offset is always 0 or 1 (QLD and NSW are adjacent timezones)
- Full timezone conversion (UTC → Sydney) is overkill
- Simple arithmetic is faster and clearer
- No edge cases beyond DST detection

**Impact:**
- Implementation constraint: Display conversion is O(1) addition
- Forbidden: Complex timezone conversion libraries
- Performance: Trivial cost even for 112 slots (week view)

**Alternative considered:** Full timezone conversion via library
- Rejected: Unnecessary complexity for known +0/+1 offset

---

## Must-Haves Verification

### Truths

- [x] **Book Now button visibility conditions documented as exhaustive decision table**
  - Location: BOOK-NOW-FEATURE.md, "Complete Visibility Truth Table"
  - 8 rows covering all combinations of hour range, slot past, slot status

- [x] **Book Now interaction flow documented from button click to booking panel open**
  - Location: BOOK-NOW-FEATURE.md, "Interaction Flow" section
  - 5-step flow from trigger to standard booking panel continuation

- [x] **Timezone toggle DST detection logic documented with IANA timezone references**
  - Location: TIMEZONE-TOGGLE.md, "DST Detection Logic" section
  - References Australia/Brisbane and Australia/Sydney (7 occurrences)
  - Decision table mapping AEDT → DST active, AEST → DST not active

- [x] **Display conversion rules documented showing QLD-to-NSW hour offset**
  - Location: TIMEZONE-TOGGLE.md, "Display Conversion Rules" section
  - Conversion table with examples during DST and outside DST
  - Formula: `displayHour = storageHour + (isDST ? 1 : 0)`

- [x] **Timezone preference persistence documented**
  - Location: TIMEZONE-TOGGLE.md, "Preference Persistence" section
  - localStorage key: "cps-timezone-preference"
  - Read on initialization, write on toggle
  - Error handling and graceful fallback

### Artifacts

- [x] **BOOK-NOW-FEATURE.md** — 412 lines (min: 150), contains "Visibility"
  - Provides: Book Now feature specification
  - Contains: Complete visibility decision table, interaction flow, 8 edge cases

- [x] **TIMEZONE-TOGGLE.md** — 604 lines (min: 150), contains "DST"
  - Provides: Timezone toggle specification
  - Contains: DST detection logic, display conversion, persistence, 8 edge cases

### Key Links

- [x] **From BOOK-NOW-FEATURE.md to BOOKING-FLOW.md**
  - Via: "Reuses booking panel flow"
  - Pattern: "booking panel|BOOKING-FLOW"
  - Location: "Integration with Booking Flow" section, cross-references at end

- [x] **From TIMEZONE-TOGGLE.md to DATA-STORAGE.md**
  - Via: "Storage timezone reference"
  - Pattern: "Queensland|QLD|AEST|storage"
  - Location: "Storage vs Display Separation" section, cross-references at end

---

## Deviations from Plan

### Auto-Fixed Issues

None — plan executed exactly as written.

---

## Task Breakdown

| Task | Description | Files Modified | Commit | Lines |
|------|-------------|----------------|--------|-------|
| 1 | Create BOOK-NOW-FEATURE.md (FUNC-02) | BOOK-NOW-FEATURE.md | 7453011 | +412 |
| 2 | Create TIMEZONE-TOGGLE.md (FUNC-03) | TIMEZONE-TOGGLE.md | f34ab55 | +604 |

**Total additions:** 1,016 lines of functional specification

---

## Implementation Guidance for Rails Developer

### Book Now Feature

**What to build:**
1. Button in header (next to Week/Day toggle)
2. Visibility calculation based on:
   - Current hour in range [6, 21]
   - Slot not past (current time < next hour start)
   - Slot status is "available"
3. Click handler:
   - Construct slot object for current hour
   - Switch to today's date if needed
   - Open booking panel with slot pre-selected
4. Keyboard shortcut `[B]` (when not in popup mode)
5. Pulsing animation when visible

**Read these sections:**
- "Visibility Decision Table" for exact conditions
- "Interaction Flow" for step-by-step behavior
- "Recalculation Triggers" for when to re-evaluate
- All edge case scenarios for boundary handling

**Key constraint:** Book Now uses QLD time internally, regardless of timezone toggle state

---

### Timezone Toggle Feature

**What to build:**
1. Toggle button in header showing "QLD" or "NSW +Xh"
2. DST detection using platform timezone API:
   - Format current time with timezone 'Australia/Sydney'
   - Extract abbreviation from formatted parts
   - If "AEDT" → offset = +1h, else → offset = +0h
3. Display conversion:
   - All time slot labels: `displayHour = storageHour + offset`
   - Storage keys unchanged (always QLD time)
4. Preference persistence:
   - Read from localStorage on initialization
   - Write to localStorage on toggle
   - Graceful fallback to QLD if unavailable
5. Keyboard shortcut `[T]` (when not in popup mode)

**Read these sections:**
- "DST Detection Logic" for detection algorithm
- "Display Conversion Rules" for conversion formula
- "Preference Persistence" for storage logic
- "Implementation Constraints" for must-use/forbidden patterns
- All edge case scenarios for DST transitions and fallback behavior

**Key constraint:** Storage and API calls always use QLD time; toggle affects display only

---

## Next Phase Readiness

**Phase 10 (Rails Implementation) is ready when:**
- [x] Book Now feature completely specified
- [x] Timezone toggle feature completely specified
- [ ] All functional features documented (FUNC-01 through FUNC-XX)
- [ ] All user interactions documented (bookings, editing, deletion)

**Current status:** 2/N functional features documented

**Blockers:** None

**Recommendations for next plan:**
- Continue with FUNC-01 (primary booking flow) or other independent features
- Each functional document can be created independently
- Book Now and Timezone Toggle are self-contained and ready for implementation

---

## Dependency Graph

### Requires (Built Upon)

- **Phase 06** — Code extraction (App.jsx, Header.jsx, time.js, storage.js)
- **Phase 08** — DATA-STORAGE.md (storage timezone rationale)
- **09-RESEARCH.md** — Documentation patterns (Given-When-Then, decision tables)

### Provides (Enables)

- **Phase 10** — Rails implementation reference for Book Now feature
- **Phase 10** — Rails implementation reference for timezone toggle feature
- **Future docs** — Pattern reference for other feature specifications

### Affects (Impacts)

- **Phase 09 remaining plans** — Establishes pattern for feature documentation
- **BOOKING-FLOW.md** — Will reference Book Now as entry point to booking panel
- **COMPONENT-STATES.md** — Will reference timezone toggle visual states

---

## Tech Stack

### Tech Added

None (documentation only)

### Patterns Established

1. **Exhaustive decision tables** for complex conditional logic
2. **Given-When-Then scenarios** for edge cases
3. **IANA timezone name references** for DST-dependent behavior
4. **Storage vs Display separation** documentation pattern
5. **Technology-neutral behavior descriptions** for cross-platform specs

### Libraries Referenced

- `Intl.DateTimeFormat` (browser API) for DST detection
- `localStorage` (browser API) for preference persistence

---

## Files Modified

### Created

- `.planning/phases/09-functional-documentation/BOOK-NOW-FEATURE.md` (+412 lines)
- `.planning/phases/09-functional-documentation/TIMEZONE-TOGGLE.md` (+604 lines)

### Modified

None

### Deleted

None

---

## Metrics

**Duration:** ~5 minutes
**Tasks completed:** 2/2
**Lines documented:** 1,016 lines
**Edge cases covered:** 16 scenarios (8 per feature)
**Decision tables:** 3 (visibility, DST detection, display conversion)
**IANA timezone references:** 7 occurrences

---

## Search Keywords

`book now`, `current hour`, `one-click booking`, `timezone toggle`, `DST`, `daylight saving`, `AEDT`, `AEST`, `NSW`, `Queensland`, `Australia/Brisbane`, `Australia/Sydney`, `IANA timezone`, `display conversion`, `localStorage`, `preference persistence`, `visibility decision table`, `Given-When-Then`, `edge cases`, `functional specification`
