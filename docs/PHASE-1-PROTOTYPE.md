# Phase 1: Prototype Enhancements

## Overview

This document contains full specifications for implementing edit/delete functionality and week view booking in the CPS Calendar Booking prototype.

---

## Feature 1: Edit/Delete Popup

### Description
When a user clicks on an existing booking, a popup modal appears with options to Delete, Edit, or Cancel.

### User Stories
- As a user, I can click on my booking to see options for modifying it
- As a user, I can delete a booking I created
- As a user, I can edit a booking's user and/or duration (time slot stays fixed)
- As a user, I can cancel the popup without making changes

### UI Design

```
┌─────────────────────────────────┐
│  Edit Booking                   │
│  10:00 - 12:00                 │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  WHO?                           │
│  ┌─────────────────────────┐   │
│  │ [J] Jack          ✓     │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [B] Bonnie              │   │
│  └─────────────────────────┘   │
│                                 │
│  DURATION?                      │
│  ┌─────────────────────────┐   │
│  │ [1] 1 hour              │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [2] 2 hours        ✓    │   │
│  └─────────────────────────┘   │
│  ┌─────────────────────────┐   │
│  │ [3] 3 hours   (blocked) │   │
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [D] Delete              │   │ ← Red styling
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ [Esc] Cancel            │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Interaction Flow

1. **Open Popup**: User clicks on a booked slot
2. **Initial State**: Shows current user (selected) and current duration (selected)
3. **Edit User**: Click or press J/B to change user
4. **Edit Duration**: Click or press 1/2/3 to change duration
   - Disabled durations show visual feedback (greyed out)
   - Duration change happens immediately (saves on selection)
5. **Delete**: Click Delete button or press D
   - Booking is removed immediately (no confirmation dialog)
6. **Cancel**: Click Cancel, press Escape, or click outside popup
   - Changes are already saved; this just closes the popup

### Hotkeys

| Key | Action |
|-----|--------|
| `J` | Select Jack as user (saves immediately) |
| `B` | Select Bonnie as user (saves immediately) |
| `1` | Set 1 hour duration (saves immediately if valid) |
| `2` | Set 2 hours duration (saves immediately if valid) |
| `3` | Set 3 hours duration (saves immediately if valid) |
| `D` | Delete booking |
| `Escape` | Close popup |

### Overlap Detection

When changing duration, check if the new duration would overlap with another booking:

```javascript
// Example: Booking at 10:00 for 2 hours
// User tries to change to 3 hours
// Must check if 12:00 slot is available

canUpdateDuration(dateKey, startTime, startHour, newDuration, currentBookingKey) {
  // Skip checking the current booking's slots
  // Check only NEW slots that would be occupied
}
```

### Styling (Cyberpunk Theme)

- Background: `var(--glass-bg)` with `backdrop-filter: blur(20px)`
- Border: `1px solid var(--glass-border)`
- Box shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
- Delete button: Red-tinted with hover glow
- Selected options: Cyan glow (`var(--accent)`)
- Disabled options: `opacity: 0.35`

### Files to Create/Modify

| File | Changes |
|------|---------|
| `src/components/BookingPopup.jsx` | NEW - Modal component |
| `src/components/BookingPopup.css` | NEW - Styling |
| `src/App.jsx` | Add popup state, handlers |
| `src/hooks/useBookings.js` | Add `updateBooking()` |
| `src/hooks/useKeyboard.js` | Add D hotkey for delete |

---

## Feature 2: Week View Booking

### Description
Add ability to create bookings directly from the week view (currently view-only).

### User Stories
- As a user, I can click on an available time slot in week view to open the booking panel
- As a user, I can create bookings without switching to day view
- As a user, I can use the same hotkeys in week view as day view

### UI Changes

1. **Cursor Change**: Available slots show `cursor: pointer` on hover
2. **Hover Effect**: Subtle glow/highlight on available slots
3. **Click Handler**: Opens BookingPanel (same as day view)
4. **Panel Position**: Same right-side panel as day view

### Interaction Flow

1. User is in week view
2. Clicks on an available slot (not past, not booked)
3. BookingPanel slides in from right
4. User selects user and duration (same flow as day view)
5. Booking is created and appears in week view
6. Panel closes, user returns to week view

### Slot Click Target

In week view, slots are small. Need to ensure good click targets:
- Each slot should be at least 20px tall
- Click on booking block opens edit popup (not new booking)
- Click on empty/available slot opens booking panel

### State Changes

```javascript
// App.jsx needs to track:
// - selectedSlot (now includes dateKey for week view)
// - Current slot structure: { key, time, hour, dateKey }
```

### Booking Panel Modifications

The BookingPanel already receives `selectedSlot` which includes `dateKey`. No changes needed to BookingPanel itself.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/WeekView.jsx` | Add click handlers to slots |
| `src/components/WeekView.css` | Hover/cursor states |
| `src/App.jsx` | Pass booking handlers to WeekView |

---

## Implementation Checklist

### Edit/Delete Popup
- [ ] Create `BookingPopup.jsx` component
- [ ] Create `BookingPopup.css` styles
- [ ] Add `updateBooking()` to `useBookings.js`
- [ ] Add popup state to `App.jsx` (selectedBooking vs selectedSlot)
- [ ] Add click handler to booking blocks in TimeStrip
- [ ] Add D hotkey to `useKeyboard.js`
- [ ] Test edit user flow
- [ ] Test edit duration flow
- [ ] Test overlap blocking
- [ ] Test delete flow
- [ ] Test cancel/escape flow

### Week View Booking
- [ ] Add click handlers to WeekView slots
- [ ] Add hover styles to WeekView.css
- [ ] Pass booking handlers from App.jsx to WeekView
- [ ] Test booking creation in week view
- [ ] Test that bookings appear in both views
- [ ] Test hotkeys work in week view

---

## Acceptance Criteria

### Edit/Delete Popup
1. Clicking a booked slot opens the edit popup
2. Current user and duration are pre-selected
3. Changing user saves immediately
4. Changing duration saves immediately (if valid)
5. Blocked durations are visually disabled
6. D key deletes the booking
7. Escape key closes the popup
8. Clicking outside closes the popup
9. Matches cyberpunk design aesthetic

### Week View Booking
1. Available slots show hover state
2. Clicking available slot opens booking panel
3. Booking panel shows correct date/time for selected slot
4. Created booking appears in week view immediately
5. Same booking appears when switching to day view
6. All hotkeys (J, B, 1, 2, 3, Esc) work in week view
7. Past slots cannot be clicked
8. Booked slots open edit popup (not new booking)

---

## Testing Plan

```bash
# Start dev server
npm run dev
```

### Manual Testing Steps

#### Edit/Delete Popup
1. Create a 2-hour booking for Jack at 10:00
2. Click the booking → popup opens
3. Verify Jack is selected, 2 hours is selected
4. Press B → user changes to Bonnie (verify immediately)
5. Press 1 → duration changes to 1 hour (verify immediately)
6. Press D → booking deleted
7. Create another booking
8. Click it, press Escape → popup closes
9. Click it, click outside → popup closes

#### Week View Booking
1. Press W to switch to week view
2. Hover over an available slot → cursor changes
3. Click available slot → booking panel opens
4. Select user and duration → booking created
5. Verify booking appears in week view
6. Press W to go back to day view
7. Navigate to the same date
8. Verify booking appears in day view

#### Edge Cases
1. Try to extend duration when blocked by another booking
2. Create booking that spans to end of day (17:00)
3. Try to create booking on past slot
4. Edit booking in week view (click booked slot)
