# Roadmap: CPS Calendar Book Form

## Overview

This milestone delivers three improvements to the booking calendar: fixing the premature slot disappearance bug, adding a quick "Book Now" button for the current hour, and adding an NSW timezone toggle for Sydney users. Changes deploy automatically to admin instances and manually to the eureka instance.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Time Slot Fix** - Fix current hour visibility bug ✓
- [x] **Phase 2: Quick Booking** - Add "Book Now" button for current hour ✓
- [x] **Phase 3: Timezone Display** - Add NSW timezone toggle ✓
- [ ] **Phase 4: Deployment** - Deploy to all instances

## Phase Details

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
**Plans**: 1 plan

Plans:
- [x] 03-01-PLAN.md - Add timezone toggle, DST detection, and display conversion ✓

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
- [ ] 04-01-PLAN.md - Push template repo and sync to eureka

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Time Slot Fix | 1/1 | ✓ Complete | 2026-02-04 |
| 2. Quick Booking | 1/1 | ✓ Complete | 2026-02-04 |
| 3. Timezone Display | 1/1 | ✓ Complete | 2026-02-04 |
| 4. Deployment | 0/1 | Not started | - |

---
*Roadmap created: 2026-02-04*
*Milestone: v1.0 Universal Booking Improvements*
