# V2 Implementation Plan: Absolute Positioning Overlay

## Overview

This document provides a complete implementation plan for refactoring the CPS Software Booking app to use absolute positioning for booking blocks. A fresh Claude context can use this document to implement V2 without prior conversation history.

**Rollback**: If V2 fails, revert with: `git checkout v1.1-quick-fix`

---

## 1. Project Overview

### What the App Does
CPS Software Booking is a time slot booking application where users (Jack/Bonnie) can reserve time blocks on a calendar. Features include:
- Day View: Single day with 16 hourly slots (6am-10pm)
- Week View: 7-day grid showing availability at a glance
- Multi-hour bookings: Users can book 1-3 hour blocks
- Keyboard shortcuts: J/B for user, 1/2/3 for duration, W for week view

### Current File Structure
```
src/
├── App.jsx                 # Main app container
├── App.css                 # App-level styles
├── index.css               # Global styles, CSS variables
├── main.jsx                # Entry point
├── components/
│   ├── Header.jsx/css      # App header with navigation
│   ├── TimeStrip.jsx/css   # Day view container
│   ├── TimeSlot.jsx/css    # Individual time slot (REFACTOR TARGET)
│   ├── WeekView.jsx/css    # Week grid view
│   └── BookingPanel.jsx/css # Booking form sidebar
├── hooks/
│   ├── useBookings.js      # Booking state management (REFACTOR TARGET)
│   └── useKeyboard.js      # Keyboard shortcuts
└── utils/
    ├── time.js             # Time formatting utilities
    └── storage.js          # localStorage persistence
```

### Key Components and Their Roles

| Component | Role | V2 Changes |
|-----------|------|------------|
| `TimeStrip.jsx` | Renders day view | Add booking overlay container |
| `TimeSlot.jsx` | Individual slots | Simplify - just background grid |
| `useBookings.js` | Slot status logic | Simplify - no position calcs needed |
| `WeekView.jsx` | Week grid | May keep as-is or add mini overlays |

---

## 2. Problem Statement

### Why Current Slot-Based Approach Fails

The current implementation renders each hour as a separate `TimeSlot` component. Multi-hour bookings use CSS tricks (negative margins, border-radius manipulation) to appear as unified blocks.

**Issues**:
1. **Border Discontinuity**: Each slot has its own border. When slots are filtered or styled differently, borders appear cut off.
2. **Label Positioning**: Labels are attached to the "start" slot. When that slot is hidden/past, complex logic is needed to shift labels.
3. **Dynamic Updates**: As time passes, bookings need to visually "shrink" - impossible with slot-based rendering.

### Visual Problem (ASCII)
```
Current Slot-Based (V1):          Desired Overlay (V2):
┌─────────┐                       ┌─────────┐
│ 10:00   │ ← Hidden/past         │ 10:00   │
├─────────┤                       ├─────────┤
│ 11:00   │ ← Border cut off!     │ 11:00   │ ┌─────────┐
├─────────┤                       ├─────────┤ │ Jack    │
│ 12:00   │                       │ 12:00   │ │ (2hr)   │
├─────────┤                       ├─────────┤ └─────────┘
│ 1:00    │                       │ 1:00    │
└─────────┘                       └─────────┘
                                  ↑ Booking is ONE element
                                    positioned over grid
```

---

## 3. Solution: Absolute Positioning Overlay

### Architecture Overview

```
┌─────────────────────────────────────────┐
│ TimeStrip Container (position: relative)│
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │ Background  │  │ Booking Overlay │  │
│  │ Grid        │  │ (position:      │  │
│  │ (TimeSlots) │  │  absolute)      │  │
│  │             │  │                 │  │
│  │ ┌─────────┐ │  │  ┌───────────┐  │  │
│  │ │ 6:00 AM │ │  │  │ Jack 3hr  │  │  │
│  │ ├─────────┤ │  │  │ top: 240px│  │  │
│  │ │ 7:00 AM │ │  │  │ height:   │  │  │
│  │ ├─────────┤ │  │  │ 144px     │  │  │
│  │ │ ...     │ │  │  └───────────┘  │  │
│  │ └─────────┘ │  │                 │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### How Professional Calendars Solve This

**FullCalendar** (most popular calendar library):
- Time grid is a background reference
- Events are absolutely positioned divs
- Position calculated from: `top = (startTime - dayStart) * pixelsPerHour`
- Height calculated from: `height = duration * pixelsPerHour`

**Google Calendar**:
- Same pattern - events float over a time grid
- Smooth animations when events are dragged/resized
- Dynamic clipping for multi-day events

---

## 4. Implementation Plan

### Step 1: Create BookingBlock Component

**New File**: `src/components/BookingBlock.jsx`

```jsx
import './BookingBlock.css';

const SLOT_HEIGHT = 48; // Must match TimeSlot height
const DAY_START_HOUR = 6;

export function BookingBlock({
  booking,
  startHour,
  duration,
  isOwn,
  onCancel,
  currentHour // For dynamic clipping on today
}) {
  // Calculate position
  let effectiveStartHour = startHour;
  let effectiveDuration = duration;

  // If booking started in the past, clip to current hour
  if (currentHour !== null && startHour < currentHour) {
    const hoursInPast = currentHour - startHour;
    effectiveStartHour = currentHour;
    effectiveDuration = duration - hoursInPast;

    // If entire booking is past, don't render
    if (effectiveDuration <= 0) return null;
  }

  const top = (effectiveStartHour - DAY_START_HOUR) * SLOT_HEIGHT;
  const height = effectiveDuration * SLOT_HEIGHT;

  return (
    <div
      className={`booking-block ${isOwn ? 'own' : 'other'}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={isOwn ? onCancel : undefined}
    >
      <span className="booking-user">{booking.user}</span>
      <span className="booking-duration">({effectiveDuration}hr)</span>
      {isOwn && <span className="cancel-hint">click to cancel</span>}
    </div>
  );
}
```

**New File**: `src/components/BookingBlock.css`

```css
.booking-block {
  position: absolute;
  left: 80px; /* Space for time labels */
  right: 20px;
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
  transition: all 0.3s ease;
  overflow: hidden;
}

.booking-block.other {
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid rgba(220, 38, 38, 0.4);
  cursor: default;
}

.booking-block.own {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
  cursor: pointer;
}

.booking-block.own:hover {
  background: rgba(34, 197, 94, 0.3);
  border-color: rgba(34, 197, 94, 0.6);
}

.booking-user {
  font-weight: 600;
  color: var(--text-primary);
}

.booking-duration {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.cancel-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
}

.booking-block.own:hover .cancel-hint {
  opacity: 1;
}
```

---

### Step 2: Create BookingOverlay Component

**New File**: `src/components/BookingOverlay.jsx`

```jsx
import { BookingBlock } from './BookingBlock';
import { isToday } from '../utils/time';
import './BookingOverlay.css';

export function BookingOverlay({
  date,
  bookings,
  currentUser,
  onCancel
}) {
  const dateBookings = bookings || {};
  const now = new Date();
  const currentHour = isToday(date) ? now.getHours() : null;

  return (
    <div className="booking-overlay">
      {Object.entries(dateBookings).map(([timeKey, booking]) => {
        const startHour = parseInt(timeKey.split(':')[0], 10);
        const duration = booking.duration || 1;
        const isOwn = booking.user === currentUser;

        return (
          <BookingBlock
            key={timeKey}
            booking={booking}
            startHour={startHour}
            duration={duration}
            isOwn={isOwn}
            currentHour={currentHour}
            onCancel={() => onCancel?.(timeKey)}
          />
        );
      })}
    </div>
  );
}
```

**New File**: `src/components/BookingOverlay.css`

```css
.booking-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none; /* Allow clicks through to slots */
}

.booking-overlay .booking-block {
  pointer-events: auto; /* But blocks are clickable */
}
```

---

### Step 3: Modify TimeStrip.jsx

**File**: `src/components/TimeStrip.jsx`

```jsx
import { generateTimeSlots, formatDate, isToday, isSlotPast } from '../utils/time';
import { TimeSlot } from './TimeSlot';
import { BookingOverlay } from './BookingOverlay';
import './TimeStrip.css';

const TIME_SLOTS = generateTimeSlots();

export function TimeStrip({
  date,
  bookings,
  getSlotStatus,
  selectedSlot,
  onSlotSelect,
  onSlotCancel,
  currentUser,
}) {
  const dateKey = formatDate(date);
  const dayBookings = bookings[dateKey] || {};

  // Filter out past slots for today (background grid)
  const visibleSlots = isToday(date)
    ? TIME_SLOTS.filter(slot => !isSlotPast(date, slot.hour))
    : TIME_SLOTS;

  return (
    <div className="time-strip">
      {/* Background grid - simplified TimeSlots */}
      {visibleSlots.map((slot) => {
        const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
        const isSelected = selectedSlot?.timeKey === slot.key;
        const isAvailable = slotStatus.status === 'available';

        return (
          <TimeSlot
            key={slot.key}
            time={slot.time}
            hour={slot.hour}
            timeKey={slot.key}
            date={date}
            isAvailable={isAvailable}
            isSelected={isSelected}
            onClick={isAvailable ? () => onSlotSelect?.({ ...slot, dateKey }) : undefined}
          />
        );
      })}

      {/* Booking overlay - absolutely positioned blocks */}
      <BookingOverlay
        date={date}
        bookings={dayBookings}
        currentUser={currentUser}
        onCancel={(timeKey) => onSlotCancel?.(dateKey, timeKey)}
      />
    </div>
  );
}
```

---

### Step 4: Simplify TimeSlot.jsx

**File**: `src/components/TimeSlot.jsx`

The TimeSlot component now just renders the background grid - it no longer handles booking display logic.

```jsx
import './TimeSlot.css';

export function TimeSlot({
  time,
  hour,
  timeKey,
  date,
  isAvailable,
  isSelected,
  onClick,
}) {
  const getSlotClass = () => {
    const classes = ['time-slot'];

    if (isAvailable) {
      classes.push('available');
    } else {
      classes.push('occupied'); // Has a booking overlay on top
    }

    if (isSelected) {
      classes.push('selected');
    }

    return classes.join(' ');
  };

  return (
    <button
      className={getSlotClass()}
      onClick={onClick}
      disabled={!isAvailable}
      aria-label={isAvailable ? `${time} - Available, click to book` : `${time} - Occupied`}
    >
      <span className="time-label mono">{time}</span>
    </button>
  );
}
```

---

### Step 5: Update TimeStrip.css

**File**: `src/components/TimeStrip.css`

Add relative positioning to enable absolute overlay:

```css
.time-strip {
  position: relative; /* Enable absolute positioning for overlay */
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* ... existing styles ... */
}
```

---

### Step 6: Simplify TimeSlot.css

Remove all the multi-hour booking styles (negative margins, border manipulation):

```css
/* Remove these sections:
   - .time-slot.booked
   - .time-slot.multi-hour
   - .time-slot.booking-start/middle/end
   - .booking-info
   - .cancel-hint
*/

/* Keep only:
   - Base .time-slot styles
   - .time-slot.available
   - .time-slot.selected
   - .time-slot.occupied (new - just indicates slot has booking)
   - .time-label
*/
```

---

### Step 7: Simplify useBookings.js

The `getSlotStatus` function can be drastically simplified since we no longer need position calculations for rendering:

```javascript
const getSlotStatus = useCallback((dateKey, timeKey, hour) => {
  const dayBookings = bookings[dateKey] || {};

  // Check if this slot has a direct booking
  if (dayBookings[timeKey]) {
    return { status: 'booked', booking: dayBookings[timeKey] };
  }

  // Check if slot is blocked by a multi-hour booking
  const blockInfo = isSlotBlocked(dayBookings, hour);
  if (blockInfo.blocked) {
    return { status: 'blocked', booking: blockInfo.booking };
  }

  return { status: 'available' };
}, [bookings]);
```

Remove the entire `calculateEffectivePosition` function and related properties.

---

## 5. Key Formulas

```javascript
// Constants
const SLOT_HEIGHT = 48;      // Height of each hour slot in pixels
const DAY_START_HOUR = 6;    // First hour of the day (6:00 AM)
const DAY_END_HOUR = 22;     // Last hour of the day (10:00 PM)

// Position calculation
const topPosition = (startHour - DAY_START_HOUR) * SLOT_HEIGHT;
const blockHeight = duration * SLOT_HEIGHT;

// Dynamic adjustment for current time (today only)
if (isToday && startHour < currentHour) {
  const hoursInPast = currentHour - startHour;
  const adjustedStartHour = currentHour;
  const adjustedDuration = duration - hoursInPast;

  if (adjustedDuration <= 0) {
    // Entire booking is in the past - don't render
    return null;
  }

  topPosition = (adjustedStartHour - DAY_START_HOUR) * SLOT_HEIGHT;
  blockHeight = adjustedDuration * SLOT_HEIGHT;
}
```

---

## 6. File-by-File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/BookingBlock.jsx` | CREATE | New component for individual booking blocks |
| `src/components/BookingBlock.css` | CREATE | Styles for booking blocks |
| `src/components/BookingOverlay.jsx` | CREATE | Container for all booking blocks |
| `src/components/BookingOverlay.css` | CREATE | Overlay positioning styles |
| `src/components/TimeStrip.jsx` | MODIFY | Add overlay, simplify slot rendering |
| `src/components/TimeStrip.css` | MODIFY | Add position: relative |
| `src/components/TimeSlot.jsx` | MODIFY | Simplify to just grid cell |
| `src/components/TimeSlot.css` | MODIFY | Remove multi-hour booking styles |
| `src/hooks/useBookings.js` | MODIFY | Remove position calculation logic |

---

## 7. Testing Plan

### Manual Test Cases

1. **Basic Booking Display**
   - [ ] Single-hour booking displays correctly
   - [ ] Multi-hour booking displays as unified block
   - [ ] Own bookings show green, others show red

2. **Dynamic Time Updates**
   - [ ] On today, past portions of bookings are clipped
   - [ ] Booking duration display updates to show remaining hours
   - [ ] Fully-past bookings don't render

3. **Interaction**
   - [ ] Available slots remain clickable
   - [ ] Own bookings are clickable to cancel
   - [ ] Other users' bookings are not clickable

4. **Week View**
   - [ ] Week view still functions (may need separate implementation)
   - [ ] Grid alignment is correct

### Edge Cases

- [ ] Booking that spans 6am-9pm (maximum duration)
- [ ] Multiple bookings on same day
- [ ] Booking at end of day (9pm-10pm)
- [ ] Switching between Day and Week view preserves state

---

## 8. Rollback Instructions

If V2 implementation causes issues:

```bash
# Discard all uncommitted changes
git checkout -- .

# Or revert to V1.1 tag
git checkout v1.1-quick-fix

# To return to main after testing
git checkout main
```

---

## 9. Future Enhancements

After V2 is stable, consider:

1. **Real-time Updates**: Add `useEffect` with timer to reposition blocks every minute
2. **Animations**: Smooth transitions when bookings appear/disappear
3. **Drag to Resize**: Allow users to drag booking edges to change duration
4. **Overlap Handling**: If future requirements allow overlapping bookings, position them side-by-side

---

## Quick Start for New Claude Context

1. Read this document completely
2. Read the current implementation files listed in Section 1
3. Create the new files in order (Steps 1-2)
4. Modify existing files (Steps 3-7)
5. Build and test: `npm run build && npm run dev`
6. Run through testing checklist in Section 7
7. If successful, commit with message: "V2: Absolute positioning for booking blocks"
