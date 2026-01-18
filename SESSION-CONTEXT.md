# CPS Booking Calendar - Session Context

> **Purpose**: This document provides full context for continuing development. Read this at the start of any new session.

---

## Project Overview

### What Is This?
A minimal-friction web app for CPS contractors to coordinate shared software login times. Two users (Jack and Bonnie) need to book time slots to use shared software - this calendar prevents double-bookings.

### Why Was It Built This Way?
- **Keyboard-first**: Contractors want speed. Press `J` then `1` to book in under a second
- **Dark mode**: Matches developer tooling aesthetic, easier on eyes
- **No auth**: Dummy data for now - future versions may add real users
- **localStorage**: Placeholder for future backend - keeps it simple for MVP

### Design Reference
The user provided a sketch at `img0002.jpg` showing the basic layout concept.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + Vite | Fast dev experience, modern tooling |
| Styling | Plain CSS with CSS variables | Simple, no build complexity |
| State | React useState/useContext | Overkill to use Redux for this scale |
| Storage | localStorage | Placeholder for future backend API |
| Fonts | JetBrains Mono + DM Sans | Monospace for time display, clean sans for UI |

---

## File Structure

```
cps-calendar-book-form/
├── index.html              # Entry point, loads Google Fonts
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── img0002.jpg             # User's original design sketch
│
├── public/
│   └── vite.svg            # Favicon
│
└── src/
    ├── main.jsx            # React entry point
    ├── index.css           # Global styles, CSS variables, dark theme
    ├── App.jsx             # Main app component, state orchestration
    ├── App.css             # App layout styles
    │
    ├── components/
    │   ├── Header.jsx      # Title, date display, navigation, week toggle
    │   ├── Header.css
    │   ├── TimeSlot.jsx    # Individual time slot (available/booked/past states)
    │   ├── TimeSlot.css
    │   ├── TimeStrip.jsx   # Vertical list of 16 time slots for a day
    │   ├── TimeStrip.css
    │   ├── BookingPanel.jsx # Slide-in panel for user/duration selection
    │   ├── BookingPanel.css
    │   ├── WeekView.jsx    # 7-day grid overview
    │   └── WeekView.css
    │
    ├── hooks/
    │   ├── useBookings.js  # CRUD operations for bookings + localStorage sync
    │   └── useKeyboard.js  # Global keyboard shortcut handler
    │
    └── utils/
        ├── storage.js      # localStorage wrapper functions
        └── time.js         # Time slot generation, date formatting, helpers
```

---

## Key Components Explained

### `App.jsx` - The Orchestrator
- Holds all state: `currentDate`, `isWeekView`, `selectedSlot`, `selectedUser`
- Wires up keyboard shortcuts via `useKeyboard` hook
- Passes callbacks down to child components
- Manages the booking flow: slot select → user select → duration select → create

### `TimeSlot.jsx` - The Building Block
Each slot can be in one of these states:
- **available**: Green left border, clickable to book
- **booked**: Red border, shows "Jack (2hr)" format
- **booked.own**: Blue border (own booking), clickable to cancel
- **blocked**: Grayed out, part of a multi-hour booking
- **past**: Dimmed, not interactive

### `BookingPanel.jsx` - The Booking Flow
Slides in from the right when a slot is selected. Shows:
1. **Who?** - Jack `[J]` or Bonnie `[B]`
2. **Duration?** - 1hr `[1]`, 2hr `[2]`, 3hr `[3]`
3. **Cancel** - `[Esc]` to close

Keyboard flow: Click slot → Press `J` → Press `2` → Booking created

### `WeekView.jsx` - The Overview
7-day grid showing all slots at a glance. Click a day header to jump to that day view. Animated entrance (days cascade in from right).

### `useBookings.js` - Data Management
```javascript
// Returns functions:
{
  bookings,           // Full booking data object
  getBookingsForDate, // Get bookings for a specific date
  createBooking,      // Add a new booking
  removeBooking,      // Cancel a booking
  getSlotStatus,      // Check if slot is available/booked/blocked
  canBook,            // Check if a duration can be booked at a slot
}
```

### `useKeyboard.js` - Hotkey Handler
Listens for global keydown events:
- `J`/`B` → Select user (when panel is open)
- `1`/`2`/`3` → Select duration and confirm (when user is selected)
- `Escape` → Cancel booking panel
- `W` → Toggle week view
- `←`/`→` → Navigate days (when panel is closed)

---

## Data Structure

Bookings are stored in localStorage under key `cps-bookings`:

```javascript
{
  "2025-01-17": {
    "08:00": { user: "Jack", duration: 2 },   // Blocks 8:00 AND 9:00
    "14:00": { user: "Bonnie", duration: 1 }
  },
  "2025-01-18": {
    "10:00": { user: "Jack", duration: 3 }    // Blocks 10:00, 11:00, 12:00
  }
}
```

**Important**: Multi-hour bookings only store the START time. The `isSlotBlocked()` function in `utils/time.js` calculates which subsequent slots are blocked.

---

## Design System

### Color Palette (defined in `src/index.css`)
```css
--bg-primary: #0d0d0d        /* Deep black background */
--bg-secondary: #1a1a1a      /* Card surfaces */
--bg-tertiary: #262626       /* Hover states */

--available: #22c55e         /* Green - available slots */
--booked: #dc2626            /* Red - others' bookings */
--booked-own: #3b82f6        /* Blue - your own bookings */
--past: #404040              /* Gray - past time slots */

--text-primary: #fafafa      /* Bright white */
--text-secondary: #a3a3a3    /* Muted text */
--accent: #22c55e            /* Green accent */
```

### Typography
- **Monospace** (JetBrains Mono): Time displays, keyboard hints, title
- **Sans-serif** (DM Sans): Body text, labels, buttons

---

## Features Implemented

| Feature | Status | Notes |
|---------|--------|-------|
| Day view with 16 hourly slots | Done | 6AM - 10PM |
| Booking via click + panel | Done | Slide-in animation |
| Booking via keyboard shortcuts | Done | J/B for user, 1/2/3 for duration |
| Multi-hour bookings (1-3hr) | Done | Blocks subsequent slots |
| Cancel own bookings | Done | Click to cancel, can't cancel others' |
| Day navigation | Done | Arrows + keyboard |
| Week view | Done | Animated transition |
| localStorage persistence | Done | Survives page refresh |
| Dark theme | Done | "Refined utilitarian" aesthetic |
| Responsive mobile support | Partial | Works but could be improved |

---

## Running the Project

```bash
# Install dependencies
npm install

# Development server (hot reload)
npm run dev
# Opens at http://localhost:5173

# Production build
npm run build
# Output in dist/
```

---

## Known Limitations / Future Work

1. **No real authentication** - Currently just dummy users Jack/Bonnie
2. **No backend** - localStorage only, no multi-device sync
3. **No conflict resolution** - If two people book simultaneously, last write wins
4. **Mobile UX** - Works but keyboard shortcuts don't apply, could use better touch targets
5. **No recurring bookings** - Each booking is one-time only
6. **Week view is read-only** - Can't book directly from week view, must click to day

---

## Quick Reference: User Flows

### Book a Slot
1. Navigate to desired day (arrows or `←`/`→`)
2. Click an available (green) slot
3. Press `J` or `B` to select user
4. Press `1`, `2`, or `3` for duration
5. Booking appears immediately

### Cancel a Booking
1. Find your booking (blue border = yours)
2. Click it
3. Booking is removed

### View the Week
1. Press `W` or click "Week View" button
2. See overview of all 7 days
3. Click a day header to jump to that day

---

## Session History

**Session 1** (this session):
- Implemented full MVP based on plan
- Created all components, hooks, utilities
- Styled with dark theme
- Added keyboard shortcuts
- Tested build - passes with no errors
- Dev server running at localhost:5173

**Next session suggestions**:
- Test edge cases (booking at end of day, overlapping attempts)
- Improve mobile experience
- Add more users or make users configurable
- Consider backend integration
