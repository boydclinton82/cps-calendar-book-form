# Requirements: CPS Calendar Book Form

**Defined:** 2026-02-13
**Core Value:** Another Claude Code instance can perfectly recreate the single booking form from this spec alone

## v2.0 Requirements

Requirements for milestone v2.0: Booking Spec Package.

### Visual Capture

- [x] **VCAP-01**: Screenshot of initial load state (empty calendar, no date selected)
- [x] **VCAP-02**: Screenshot of calendar with date selected showing time slot grid
- [x] **VCAP-03**: Screenshots of all slot visual states (available, booked, past, current hour, blocked by multi-hour)
- [x] **VCAP-04**: Screenshots of complete booking flow (panel open → name selection → duration → confirmation)
- [x] **VCAP-05**: Screenshots of Book Now button (visible state and hidden state with reasons)
- [x] **VCAP-06**: Screenshots of timezone toggle (QLD default and NSW active with offset indicator)
- [x] **VCAP-07**: Screenshots of mobile/responsive view at key breakpoints
- [x] **VCAP-08**: All screenshots annotated with interactive elements and state descriptions

### UI/UX Specification

- [x] **UIUX-01**: Document complete layout structure (header, calendar, time grid, booking panel, overlays)
- [x] **UIUX-02**: Document color palette, typography, and spacing values extracted from live site
- [x] **UIUX-03**: Document every interactive element with behavior on hover, click, active, and disabled states
- [x] **UIUX-04**: Document all animations and transitions (Book Now pulse, slot highlighting, panel transitions)
- [x] **UIUX-05**: Document all keyboard shortcuts and their conditional behavior (B, T, hotkey names)
- [x] **UIUX-06**: Document responsive breakpoints and mobile layout adaptations

### Architecture & Data

- [x] **ARCH-01**: Document data storage schema (Vercel KV key structure, booking data format)
- [x] **ARCH-02**: Document all API endpoints with request/response formats and error handling
- [x] **ARCH-03**: Document polling mechanism (interval, triggers, conflict detection)
- [x] **ARCH-04**: Document application state management (what state exists, how it flows between components)
- [x] **ARCH-05**: Document instance configuration (environment variables, per-instance settings, how instances differ)

### Functional Specification

- [x] **FUNC-01**: Document complete booking flow step-by-step with all decision points
- [x] **FUNC-02**: Document Book Now feature with all visibility conditions and interaction flow
- [x] **FUNC-03**: Document timezone toggle with DST detection logic and display conversion rules
- [x] **FUNC-04**: Document all edge cases (booking conflicts, past hours, multi-hour bookings, midnight boundary, week transitions)
- [x] **FUNC-05**: Document time/date handling (QLD timezone storage, slot calculation, current hour logic, week navigation)

### Reference Code

- [x] **CODE-01**: Extract all source files powering the current single version, stripped of dead code
- [x] **CODE-02**: Create file manifest documenting what each file/function does
- [x] **CODE-03**: Annotate key logic sections with technology-neutral explanations

### Master Specification

- [ ] **SPEC-01**: Write SPEC.md as AI-consumable entry point with build instructions
- [ ] **SPEC-02**: Include package directory structure and "how to use this spec" guide
- [ ] **SPEC-03**: Include technology-neutral system summary covering all features and behaviors

## Future Requirements

Deferred to later milestones.

### Admin Spec Package

- **ADMIN-01**: Spec package for the admin app (instance creation, management)
- **ADMIN-02**: Spec for admin-to-instance deployment pipeline

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dual/eureka version spec | Different architecture, not needed for Rails recreation |
| Rails implementation | That's the consuming project's job — spec only |
| Mobile-native specs | Web-first; current form is desktop-focused |
| Deployment/hosting specs | Rails project has its own infrastructure |
| Admin app spec | Separate milestone later |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VCAP-01 | Phase 5 | Complete |
| VCAP-02 | Phase 5 | Complete |
| VCAP-03 | Phase 5 | Complete |
| VCAP-04 | Phase 5 | Complete |
| VCAP-05 | Phase 5 | Complete |
| VCAP-06 | Phase 5 | Complete |
| VCAP-07 | Phase 5 | Complete |
| VCAP-08 | Phase 5 | Complete |
| UIUX-01 | Phase 7 | Complete |
| UIUX-02 | Phase 7 | Complete |
| UIUX-03 | Phase 7 | Complete |
| UIUX-04 | Phase 7 | Complete |
| UIUX-05 | Phase 7 | Complete |
| UIUX-06 | Phase 7 | Complete |
| ARCH-01 | Phase 8 | Complete |
| ARCH-02 | Phase 8 | Complete |
| ARCH-03 | Phase 8 | Complete |
| ARCH-04 | Phase 8 | Complete |
| ARCH-05 | Phase 8 | Complete |
| FUNC-01 | Phase 9 | Complete |
| FUNC-02 | Phase 9 | Complete |
| FUNC-03 | Phase 9 | Complete |
| FUNC-04 | Phase 9 | Complete |
| FUNC-05 | Phase 9 | Complete |
| CODE-01 | Phase 6 | Complete |
| CODE-02 | Phase 6 | Complete |
| CODE-03 | Phase 6 | Complete |
| SPEC-01 | Phase 10 | Pending |
| SPEC-02 | Phase 10 | Pending |
| SPEC-03 | Phase 10 | Pending |

**Coverage:**
- v2.0 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-13*
*Traceability updated: 2026-02-13 — Phase 9 FUNC requirements complete*
