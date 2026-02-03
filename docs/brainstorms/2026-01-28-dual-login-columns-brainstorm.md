# Dual-Login Columns Brainstorm

**Date:** 2026-01-28
**Status:** Ready for planning

## What We're Building

A forked variant of the calendar booking app that displays **two side-by-side columns** in the day view, each representing a different software login/username. Users can book time slots independently in either column.

### User Story

> As a team member, I need to schedule work across two different software logins (e.g., "AdminAccount" and "UserAccount") without managing two separate booking URLs.

### Key Behaviors

- **Day View:** Two columns displayed side-by-side, each with a configurable label above it
- **Week View:** Single-column display with a toggle/tab to switch between Login 1 and Login 2
- **Bookings:** Completely separate pools - booking 2 PM on Login1 does not affect Login2
- **Users:** Same user list (Jack, Bonnie, etc.) can book in either column

## Why This Approach

**Chosen: One-off Fork Deployment**

Rationale:
1. Zero risk to 4+ production instances already deployed and working
2. Dual-login is a specific workflow need, not a universal feature
3. Simpler implementation without conditional rendering paths
4. Can customize freely without feature flag complexity

**Rejected Alternatives:**
- Feature flag in main codebase - adds testing burden and regression risk
- Configurable N columns - over-engineered for a 2-column need (YAGNI)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Deployment model | Separate Vercel project | Isolation from production instances |
| Day view layout | Side-by-side columns | Natural visual mapping to "two logins" |
| Week view | Toggle/tab switch | Keeps week view clean, simpler than 14 columns |
| Data separation | Completely independent | Users may need to double-book their own time |
| Config location | Same KV pattern with extended schema | Reuse existing infrastructure |

## Implementation Sketch

### Config Schema Extension

```json
{
  "title": "Acme Dual Booking",
  "users": [{"name": "Jack", "key": "j"}, ...],
  "logins": [
    {"id": "login1", "name": "Admin Account"},
    {"id": "login2", "name": "User Account"}
  ]
}
```

### KV Storage Pattern

```
instance:{slug}:bookings:login1
  └── {date}: {time}: {user, duration}

instance:{slug}:bookings:login2
  └── {date}: {time}: {user, duration}
```

### Component Changes

- `TimeStrip.jsx` → Renders two columns with login headers
- `WeekView.jsx` → Adds login toggle, filters by selected login
- `useBookings.js` → Manages two booking pools or prefixed keys
- `App.jsx` → Tracks `activeLogin` state for week view

## Open Questions

1. **Keyboard navigation:** How do arrow keys work across two columns? (Suggest: Left/Right to switch columns, Up/Down within column)
2. **Hotkey booking:** When pressing a user key, which column receives the booking? (Suggest: Whichever column has focus)
3. **Mobile layout:** Stack columns vertically or keep side-by-side? (Suggest: Side-by-side with narrower slots)

## Next Steps

Run `/workflows:plan` to create implementation plan for the fork.
