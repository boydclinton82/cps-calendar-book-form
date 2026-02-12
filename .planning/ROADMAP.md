# Roadmap: CPS Calendar Book Form

## Milestones

- ✅ **v1.0 Universal Booking Improvements** - Phases 1-4 (shipped 2026-02-04)
- 🚧 **v2.0 Booking Spec Package** - Phases 5-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Universal Booking Improvements (Phases 1-4) - SHIPPED 2026-02-04</summary>

### Phase 1: Time Slot Fix
**Goal**: Current hour slot remains bookable until the hour fully elapses
**Depends on**: Nothing (first phase)
**Requirements**: SLOT-01
**Success Criteria** (what must be TRUE):
  1. At 9:01, the 9:00 slot is still visible and bookable
  2. At 9:59, the 9:00 slot is still visible and bookable
  3. At 10:00, the 9:00 slot becomes past/greyed out
  4. User can book the current hour slot at any point during that hour
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md - Fix isSlotPast() to check hour END instead of START ✓

### Phase 2: Quick Booking
**Goal**: Users can instantly book the current hour with one click
**Depends on**: Phase 1 (relies on current hour being visible)
**Requirements**: BOOK-01, BOOK-02, BOOK-03
**Success Criteria** (what must be TRUE):
  1. "Book Now" button visible in header when current hour is available
  2. "Book Now" button hidden when current hour is booked
  3. "Book Now" button hidden when current hour is blocked by multi-hour booking
  4. Clicking "Book Now" opens existing booking panel with current hour pre-selected
  5. Booking flow works identically to clicking a slot (hotkey name selection, then duration)
**Plans**: 1 plan

Plans:
- [x] 02-01-PLAN.md - Add Book Now button with availability logic ✓

### Phase 3: Timezone Display
**Goal**: Users can view times in NSW timezone (AEDT/AEST) instead of QLD
**Depends on**: Nothing (independent feature, but ordered after core functionality)
**Requirements**: TIME-01, TIME-02, TIME-03, TIME-04
**Success Criteria** (what must be TRUE):
  1. Toggle visible in header to switch between QLD and NSW time
  2. When toggled to NSW, all displayed times show +1 hour (during daylight savings)
  3. Toggle shows current offset indicator (e.g., "NSW +1h" vs "QLD")
  4. Closing and reopening browser retains toggle preference
  5. Actual bookings stored in QLD time regardless of display setting
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md - Add timezone toggle, DST detection, and display conversion ✓
- [x] 03-02-PLAN.md - Fix [B] and [T] hotkeys (gap closure) ✓
- [x] 03-03-PLAN.md - Fix booking display timezone and visual overlap (gap closure) ✓

### Phase 4: Deployment
**Goal**: All changes live on all 5 instances
**Depends on**: Phase 3 (all code complete)
**Requirements**: DEPL-01, DEPL-02
**Success Criteria** (what must be TRUE):
  1. Template repo main branch contains all changes
  2. All 4 admin instances auto-deployed with new changes
  3. booking-eureka repo manually synced and deployed
**Plans**: 1 plan

Plans:
- [x] 04-01-PLAN.md - Push template repo to admin instances ✓ (eureka excluded - separate architecture)

</details>

### 🚧 v2.0 Booking Spec Package (In Progress)

**Milestone Goal:** Create an exhaustive specification package enabling Claude Code to perfectly recreate the booking form in Rails.

#### Phase 5: Visual Capture
**Goal**: Every visual state and interaction captured from the deployed booking form
**Depends on**: Nothing (starts v2.0)
**Requirements**: VCAP-01, VCAP-02, VCAP-03, VCAP-04, VCAP-05, VCAP-06, VCAP-07, VCAP-08
**Success Criteria** (what must be TRUE):
  1. Screenshot exists showing initial empty calendar state with no date selected
  2. Screenshot exists showing calendar with selected date and complete time slot grid
  3. Screenshots exist for all slot states (available, booked, past, current hour, multi-hour blocked)
  4. Screenshots exist documenting the complete booking flow from panel open to confirmation
  5. Screenshots exist showing Book Now button visibility conditions and hidden states
  6. Screenshots exist showing both QLD and NSW timezone display modes with offset indicator
  7. Screenshots exist showing responsive layout at mobile/tablet breakpoints
  8. All screenshots are annotated with labels identifying interactive elements and state descriptions
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Setup Playwright/Sharp, capture all raw screenshots (VCAP-01 through VCAP-07) ✓
- [x] 05-02-PLAN.md — Annotate screenshots with labels, create manifest (VCAP-08) ✓

#### Phase 6: Code Extraction
**Goal**: Clean reference code extracted from React implementation and documented
**Depends on**: Nothing (can run parallel with Phase 5)
**Requirements**: CODE-01, CODE-02, CODE-03
**Success Criteria** (what must be TRUE):
  1. All source files powering the single booking version are extracted with dead code removed
  2. File manifest exists documenting the purpose of each file and function
  3. Key logic sections have technology-neutral annotations explaining WHAT and WHY (not React-specific HOW)
**Plans**: 3 plans

Plans:
- [x] 06-01-PLAN.md — Extract clean source files with dead code removal and dependency graph (CODE-01) ✓
- [x] 06-02-PLAN.md — Create FILE-MANIFEST.md documenting all files, functions, and data structures (CODE-02) ✓
- [x] 06-03-PLAN.md — Add technology-neutral inline annotations to key logic files (CODE-03) ✓

#### Phase 7: UI/UX Documentation
**Goal**: Complete interface specification documented from visual captures and code
**Depends on**: Phase 5 (visual captures) and Phase 6 (code extraction)
**Requirements**: UIUX-01, UIUX-02, UIUX-03, UIUX-04, UIUX-05, UIUX-06
**Success Criteria** (what must be TRUE):
  1. Complete layout structure documented (header, calendar, time grid, booking panel, all overlays)
  2. Color palette, typography, and spacing values extracted and documented from live site
  3. Every interactive element documented with all state behaviors (hover, click, active, disabled)
  4. All animations and transitions documented (Book Now pulse, slot highlighting, panel slide)
  5. All keyboard shortcuts documented with their conditional behavior rules
  6. Responsive breakpoints documented with mobile/tablet layout adaptations
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Layout structure hierarchy and design token reference (UIUX-01, UIUX-02) ✓
- [x] 07-02-PLAN.md — Component state matrices and animation specifications (UIUX-03, UIUX-04) ✓
- [x] 07-03-PLAN.md — Keyboard shortcuts and responsive behavior (UIUX-05, UIUX-06) ✓

#### Phase 8: Architecture Documentation
**Goal**: System internals and data flows documented for Rails reimplementation
**Depends on**: Phase 6 (code extraction)
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05
**Success Criteria** (what must be TRUE):
  1. Data storage schema documented (Vercel KV key structure, booking data format, field types)
  2. All API endpoints documented with request/response formats and error handling patterns
  3. Polling mechanism documented (interval timing, what triggers polls, conflict detection logic)
  4. Application state documented (what state exists, how it flows, what triggers updates)
  5. Instance configuration documented (environment variables, per-instance settings, differences between instances)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD (to be planned)

#### Phase 9: Functional Documentation
**Goal**: All behaviors and edge cases documented as technology-neutral specifications
**Depends on**: Phase 5 (visual captures), Phase 6 (code extraction), and Phase 8 (architecture)
**Requirements**: FUNC-01, FUNC-02, FUNC-03, FUNC-04, FUNC-05
**Success Criteria** (what must be TRUE):
  1. Complete booking flow documented step-by-step with all decision points and branching logic
  2. Book Now feature fully specified with all visibility conditions and interaction behaviors
  3. Timezone toggle fully specified with DST detection logic and display conversion rules
  4. All edge cases documented (booking conflicts, past hours, multi-hour bookings, midnight boundary, week transitions)
  5. Time/date handling fully specified (QLD storage, slot calculation, current hour logic, week navigation)
**Plans**: TBD

Plans:
- [ ] 09-01: TBD (to be planned)

#### Phase 10: Master Spec Assembly
**Goal**: AI-consumable specification package complete and ready for Rails Claude
**Depends on**: Phase 7 (UI/UX docs), Phase 8 (architecture docs), and Phase 9 (functional docs)
**Requirements**: SPEC-01, SPEC-02, SPEC-03
**Success Criteria** (what must be TRUE):
  1. SPEC.md exists as the entry point with build instructions for Rails Claude Code
  2. Package directory structure documented with "how to use this spec" guide
  3. Technology-neutral system summary exists covering all features and behaviors
**Plans**: TBD

Plans:
- [ ] 10-01: TBD (to be planned)

## Progress

**Execution Order:**
Phases execute in numeric order: 5 → 6 (can parallel with 5) → 7 → 8 → 9 → 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Time Slot Fix | v1.0 | 1/1 | Complete | 2026-02-04 |
| 2. Quick Booking | v1.0 | 1/1 | Complete | 2026-02-04 |
| 3. Timezone Display | v1.0 | 3/3 | Complete | 2026-02-04 |
| 4. Deployment | v1.0 | 1/1 | Complete | 2026-02-04 |
| 5. Visual Capture | v2.0 | 2/2 | Complete | 2026-02-13 |
| 6. Code Extraction | v2.0 | 3/3 | Complete | 2026-02-13 |
| 7. UI/UX Documentation | v2.0 | 3/3 | Complete | 2026-02-13 |
| 8. Architecture Documentation | v2.0 | 0/TBD | Not started | - |
| 9. Functional Documentation | v2.0 | 0/TBD | Not started | - |
| 10. Master Spec Assembly | v2.0 | 0/TBD | Not started | - |

---
*Roadmap created: 2026-02-04*
*v2.0 milestone added: 2026-02-13*
*Last updated: 2026-02-13 — Phase 7 complete*
