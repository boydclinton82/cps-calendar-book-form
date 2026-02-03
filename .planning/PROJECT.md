# CPS Calendar Book Form

## What This Is

A multi-instance booking calendar template deployed via Vercel. Each instance allows users to book time slots for shared resources (typically meeting rooms). The admin app creates new instances from this template repo, and all 5 current deployments need to stay in sync.

## Core Value

Users can quickly see availability and book time slots without conflicts.

## Current Milestone: v1.0 Universal Booking Improvements

**Goal:** Fix time slot visibility bug and add quality-of-life features (Book Now button, NSW timezone toggle)

**Target features:**
- Fix current hour visibility bug (slots disappear at hour start instead of hour end)
- Add "Book Now" button for quick booking of current hour
- Add NSW timezone toggle to display times in Sydney time

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet — ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Current hour slot remains visible until the hour ends
- [ ] Users can quickly book the current hour with one click
- [ ] Users can toggle time display between QLD and NSW timezones

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Mobile app — Web-first, mobile later
- Multi-day bookings — Current model is hourly slots only
- User authentication — Single-user/same-device model works for current use case
- Admin app changes — This milestone is template-only

## Context

**Deployment architecture:**
- Template repo: `boydclinton82/cps-calendar-book-form` (this codebase)
- 4 instances deployed via admin app (auto-deploy on push)
- 1 instance (`booking-eureka`) in separate repo requiring manual sync

**Current stack:** React 18 + Vite 6 + Vercel Serverless + Vercel KV

**Known issues:**
- `isSlotPast()` in `src/utils/time.js` checks hour START instead of END
- No quick-book option for common use case (check availability → book now)
- Time display hardcoded to QLD (UTC+10), NSW users need mental math

## Constraints

- **Stack**: React + Vite + Vercel (no changes to core stack)
- **Multi-instance**: All changes must work across all 5 deployments
- **Backwards compatible**: Existing bookings must continue to work

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Store times in QLD timezone | Queensland has no DST, simpler storage | — Pending |
| Display-only timezone toggle | Avoids storage complexity, users convert mentally today | — Pending |

---
*Last updated: 2026-02-04 after milestone v1.0 start*
