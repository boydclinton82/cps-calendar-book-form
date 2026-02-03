# Requirements: CPS Calendar Book Form

**Defined:** 2026-02-04
**Core Value:** Users can quickly see availability and book time slots without conflicts

## v1 Requirements

Requirements for milestone v1.0: Universal Booking Improvements.

### Time Slots

- [ ] **SLOT-01**: Current hour slot remains visible and bookable until the hour fully elapses (e.g., 9:00 slot visible until 9:59:59)

### Quick Booking

- [ ] **BOOK-01**: User can click "Book Now" button to open booking panel for the current hour
- [ ] **BOOK-02**: "Book Now" button only appears when current hour is available (not booked, not past, not blocked by multi-hour booking)
- [ ] **BOOK-03**: "Book Now" reuses existing booking panel workflow (user selects name via hotkey, then duration)

### Timezone Display

- [ ] **TIME-01**: User can toggle time display between QLD (UTC+10) and NSW timezone (AEDT/AEST)
- [ ] **TIME-02**: Toggle shows visual indicator of current offset (e.g., "+1 hour" during daylight savings)
- [ ] **TIME-03**: Timezone toggle affects display only — bookings stored in QLD time
- [ ] **TIME-04**: Toggle state persists in localStorage so user doesn't have to re-enable each visit

### Deployment

- [ ] **DEPL-01**: Changes committed and pushed to template repo trigger auto-deploy to 4 admin instances
- [ ] **DEPL-02**: Changed files manually synced to booking-eureka repo and pushed

## Future Requirements

Deferred to later milestones. Not in current roadmap.

### Notifications

- **NOTF-01**: User receives notification when their booking is about to start
- **NOTF-02**: User receives notification if someone books the slot they were viewing

### Mobile

- **MOBL-01**: Responsive design for mobile browsers
- **MOBL-02**: Native mobile app

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-day bookings | Current hourly model sufficient for use case |
| User authentication | Single-user/same-device model works |
| Admin app changes | This milestone is template repo only |
| VIC timezone option | NSW covers Sydney/Melbourne users; can add if requested |
| Automatic Eureka sync | Manual sync acceptable given low change frequency |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SLOT-01 | Phase 1 | Pending |
| BOOK-01 | Phase 2 | Pending |
| BOOK-02 | Phase 2 | Pending |
| BOOK-03 | Phase 2 | Pending |
| TIME-01 | Phase 3 | Pending |
| TIME-02 | Phase 3 | Pending |
| TIME-03 | Phase 3 | Pending |
| TIME-04 | Phase 3 | Pending |
| DEPL-01 | Phase 4 | Pending |
| DEPL-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-04*
*Last updated: 2026-02-04 after initial definition*
