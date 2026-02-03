---
title: "feat: Dual-Login Column Calendar Fork"
type: feat
date: 2026-01-28
brainstorm: docs/brainstorms/2026-01-28-dual-login-columns-brainstorm.md
---

# Dual-Login Column Calendar Fork

## Overview

Create a forked variant of the calendar booking app that displays **two side-by-side columns** in day view, each representing a distinct software login/username. Users can book time slots independently in either column. Week view uses a toggle to switch between login views.

**Deployment:** Separate Vercel project with its own KV namespace (isolated from existing 4+ production instances).

## Problem Statement

One organization needs to schedule work across two different software logins (e.g., "AdminAccount" and "UserAccount"). Currently, this requires two separate booking instances with different URLs—cumbersome for the same team managing both.

## Proposed Solution

Fork the codebase and modify:
1. **Day View:** Render two `TimeStrip` columns side-by-side with configurable headers
2. **Week View:** Add login toggle/tab; display one login's bookings at a time
3. **Data Model:** Store bookings in separate KV collections per login
4. **Config:** Extend schema with `logins` array for customizable names

## Technical Approach

### Data Model

**KV Storage Pattern:**
```
instance:{slug}:config
├── title, users, colors (unchanged)
└── logins: [{ id: "login1", name: "Admin Account" }, { id: "login2", name: "User Account" }]

instance:{slug}:bookings:login1
└── {date}: {time}: { user, duration }

instance:{slug}:bookings:login2
└── {date}: {time}: { user, duration }
```

Each login has its own booking collection—completely independent pools.

### Config Schema Extension

```javascript
// ConfigContext.jsx - extended config
{
  slug: 'acme-dual',
  title: 'Acme Dual Booking',
  users: [
    { name: 'Jack', key: 'j' },
    { name: 'Bonnie', key: 'b' }
  ],
  logins: [
    { id: 'login1', name: 'Admin Account' },
    { id: 'login2', name: 'User Account' }
  ]
}
```

### Component Architecture

```
App.jsx
├── state: activeLogin (for week view toggle)
├── state: focusedColumn (for keyboard navigation)
│
├── Day View Mode
│   └── DualColumnDayView.jsx (NEW)
│       ├── LoginColumnHeader (login1.name)
│       ├── TimeStrip (login1 bookings)
│       ├── LoginColumnHeader (login2.name)
│       └── TimeStrip (login2 bookings)
│
└── Week View Mode
    ├── LoginToggle.jsx (NEW) - tabs/buttons for login1/login2
    └── WeekView.jsx (modified) - filters by activeLogin
```

### Keyboard Navigation Model

| Key | Day View | Week View |
|-----|----------|-----------|
| ↑/↓ | Navigate within current column | Navigate within day |
| ←/→ | Switch between Login1/Login2 columns | Navigate between days |
| Tab | Switch columns (alternative) | Toggle Login1/Login2 |
| Enter | Open booking panel for focused column | Open booking panel |
| W | Toggle week view | Toggle day view |

### API Changes

**Existing endpoints work unchanged** - they accept arbitrary booking keys.

Only change: `useBookings.js` prefixes API calls with login context:
- `GET /api/bookings?login=login1`
- `POST /api/bookings` body includes `{ login: 'login1', date, time, user, duration }`

API handler splits storage by login:
```javascript
// api/bookings/index.js
const kvKey = `instance:${slug}:bookings:${login || 'default'}`;
```

## Implementation Phases

### Phase 1: Fork & Setup

- [ ] Copy codebase to new folder `cps-calendar-dual`
- [ ] Create new Vercel project
- [ ] Set unique `INSTANCE_SLUG` env var
- [ ] Verify deployment works unchanged

**Files:** `vercel.json`, Vercel dashboard

### Phase 2: Config Schema

- [ ] Extend `FALLBACK_CONFIG` with `logins` array
- [ ] Update `ConfigContext` to expose `logins`
- [ ] Update `api/config.js` to return logins from KV

**Files:**
- `src/context/ConfigContext.jsx` (lines 5-17, 55-65)
- `api/config.js` (lines 14-44)

### Phase 3: Data Layer

- [ ] Update `useBookings.js` to accept `login` parameter
- [ ] Modify `createBooking`, `updateBooking`, `deleteBooking` to include login
- [ ] Update `getSlotStatus` to check login-specific bookings
- [ ] Update API endpoint to use `bookings:{login}` KV keys

**Files:**
- `src/hooks/useBookings.js` (lines 60-172)
- `src/services/api.js` (lines 20-60)
- `api/bookings/index.js` (lines 9, 38-72)

### Phase 4: Day View UI

- [ ] Create `DualColumnDayView.jsx` wrapper component
- [ ] Create `LoginColumnHeader.jsx` for column labels
- [ ] Modify `TimeStrip.jsx` to accept `login` prop
- [ ] Update CSS for side-by-side layout (CSS Grid 2 columns)
- [ ] Wire click handlers to include login context

**Files:**
- `src/components/DualColumnDayView.jsx` (NEW ~80 lines)
- `src/components/LoginColumnHeader.jsx` (NEW ~20 lines)
- `src/components/TimeStrip.jsx` (add login prop)
- `src/components/TimeStrip.css` (grid layout)

### Phase 5: Week View Toggle

- [ ] Create `LoginToggle.jsx` component (tabs/segmented control)
- [ ] Add `activeLogin` state to `App.jsx`
- [ ] Modify `WeekView.jsx` to filter bookings by `activeLogin`
- [ ] Close any open modals on toggle

**Files:**
- `src/components/LoginToggle.jsx` (NEW ~40 lines)
- `src/components/WeekView.jsx` (lines 20-50)
- `src/App.jsx` (add state + handlers)

### Phase 6: Keyboard Navigation

- [ ] Add `focusedColumn` state to `App.jsx`
- [ ] Modify `useKeyboard.js` for Left/Right column switching
- [ ] Add Tab shortcut for week view login toggle
- [ ] Update focus management in `TimeSlot` click handlers

**Files:**
- `src/hooks/useKeyboard.js` (lines 30-80)
- `src/App.jsx` (state management)

### Phase 7: Polish & Edge Cases

- [ ] BookingPanel shows login context in header
- [ ] BookingPopup shows which login the booking belongs to
- [ ] Mobile responsive: narrower columns, consider swipe
- [ ] Accessibility: aria-labels include login name
- [ ] Test optimistic updates work per-login

**Files:**
- `src/components/BookingPanel.jsx`
- `src/components/BookingPopup.jsx`
- Various CSS files

## Acceptance Criteria

### Functional Requirements

- [ ] Day view displays two columns side-by-side with configurable headers
- [ ] Clicking a slot in Login1 column creates booking in Login1 pool
- [ ] Clicking a slot in Login2 column creates booking in Login2 pool
- [ ] Same time slot can be booked independently in both columns
- [ ] Same user can book in both columns simultaneously
- [ ] Week view toggle switches between Login1 and Login2 bookings
- [ ] Keyboard arrow keys navigate between columns (Left/Right)
- [ ] Keyboard Up/Down navigates within column
- [ ] Tab key toggles login in week view

### Non-Functional Requirements

- [ ] Existing single-column instances unaffected (separate deployment)
- [ ] Page load time <2s
- [ ] Real-time sync works for both columns
- [ ] Works on mobile (side-by-side with narrower slots)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Fork vs feature flag | Fork | Zero risk to production instances |
| Data storage | Separate KV keys per login | Clean separation, simple queries |
| Week view toggle | Tab/segmented control | Familiar pattern, keeps grid simple |
| Keyboard column switch | Left/Right arrows | Intuitive 2D navigation |
| Mobile layout | Side-by-side narrower | Consistent with day view mental model |

## Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Modal behavior on toggle | Close modal when toggling logins |
| Initial keyboard focus | Login1 column by default |
| Toggle state persistence | localStorage, default Login1 |
| Week→Day transition | Always shows both columns |

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS layout issues on small screens | Medium | Medium | Test breakpoints early |
| Keyboard navigation complexity | Low | Medium | Keep navigation model simple |
| Data migration needed | None | None | Fresh deployment, no existing data |

## Estimated Scope

**New Files:** 3 components (~140 lines total)
**Modified Files:** 8 files
**Total Changes:** ~400-500 lines

## References

- Brainstorm: `docs/brainstorms/2026-01-28-dual-login-columns-brainstorm.md`
- Current TimeStrip: `src/components/TimeStrip.jsx`
- Current WeekView: `src/components/WeekView.jsx`
- Booking hooks: `src/hooks/useBookings.js`
- Config context: `src/context/ConfigContext.jsx`
