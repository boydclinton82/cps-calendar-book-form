# Research: Dynamic Booking Blocks

## Problem Statement

The CPS Software Booking app displays time slots for booking resources. When multi-hour bookings span past and present hours, the current slot-based rendering approach causes visual issues:

1. **Cut-off Borders**: Multi-hour bookings that start in the past appear with incomplete/cut-off top borders when the past slots are hidden or styled differently
2. **Label Positioning**: Booking labels (user name, duration) are positioned on the start slot. When that slot becomes "past", the label disappears or needs to shift to the first visible slot
3. **Duration Display**: The displayed duration should update to show remaining hours, not original booking length

### Current Implementation Analysis

The app uses a **slot-based architecture**:
- `TimeStrip.jsx` renders a list of `TimeSlot` components (16 slots: 6am-10pm)
- Each `TimeSlot` is a separate DOM element with its own borders/styling
- Multi-hour bookings use negative margins and border-radius manipulation to appear as a unified block
- `useBookings.js` calculates `isEffectiveStart` to position labels on the first non-past slot

**Why slot-based fails for dynamic time updates:**
- CSS cannot dynamically change which element is "first" in a visual block
- Negative margin tricks break when slots are filtered out
- Border styling is applied per-slot, so partial blocks look incomplete

---

## Solution Approaches Researched

### Approach 1: Don't Render Past Slots (V1.1 - IMPLEMENTED)

**Concept**: For today's date, simply filter out time slots that have already passed. Past slots don't render at all.

**Pros**:
- Simple implementation - just filter the array before mapping
- Labels naturally appear on first rendered slot
- No complex CSS or position calculations needed

**Cons**:
- Doesn't solve the visual "block" continuity for multi-hour bookings
- Works well for Day View but breaks Week View grid alignment
- Booking block appears to "start" at current hour, losing visual context

**Implementation**:
```jsx
const visibleSlots = isToday(date)
  ? TIME_SLOTS.filter(slot => !isSlotPast(date, slot.hour))
  : TIME_SLOTS;
```

**Status**: Implemented as quick fix (V1.1)

---

### Approach 2: Absolute Positioning Overlay (V2 - RECOMMENDED)

**Concept**: Render time slots as a static background grid, then overlay bookings as absolutely-positioned elements calculated from time values.

**How Professional Calendars Do It**:
- FullCalendar, Google Calendar, Mobiscroll all use this pattern
- Slots form a visual grid reference
- Events/bookings are separate DOM elements positioned with CSS `top` and `height`

**Key Formulas**:
```javascript
const SLOT_HEIGHT = 48; // pixels per hour
const DAY_START_HOUR = 6;

// For a booking starting at 11am with 3-hour duration:
const eventTop = SLOT_HEIGHT * (startHour - DAY_START_HOUR);  // 48 * 5 = 240px
const eventHeight = SLOT_HEIGHT * duration;                    // 48 * 3 = 144px

// Dynamic adjustment for current time:
const now = new Date();
const currentHour = now.getHours();
if (isToday && startHour < currentHour) {
  // Clip the top of the booking to current hour
  const hoursInPast = currentHour - startHour;
  eventTop = SLOT_HEIGHT * (currentHour - DAY_START_HOUR);
  eventHeight = SLOT_HEIGHT * (duration - hoursInPast);
}
```

**Pros**:
- Bookings render as single, unified elements (no border issues)
- Easy to dynamically resize/reposition as time passes
- Industry-standard approach used by all major calendar libraries
- Clean separation: slots = visual reference, bookings = data-driven overlays

**Cons**:
- Requires architectural changes to existing code
- Need to manage overlay positioning and z-index
- More complex initial setup

**Source References**:
- FullCalendar docs: Event rendering with absolute positioning
- CodyHouse: CSS timeline components
- Mobiscroll: Calendar event block rendering

**Status**: Recommended for V2 implementation

---

### Approach 3: CSS Grid with Dynamic Row Spans

**Concept**: Use CSS Grid where bookings span multiple rows using `grid-row: span N`.

**Example**:
```css
.booking-block {
  grid-row: span 3; /* Spans 3 hour rows */
}
```

**Pros**:
- Native CSS handling of multi-row elements
- No JavaScript position calculations

**Cons**:
- Still slot-based, just using grid instead of flex
- Dynamic updates require re-rendering grid structure
- Complex to handle partially-visible bookings

**Status**: Not recommended - doesn't solve the core problem

---

### Approach 4: Virtual Scrolling / Viewport Clipping

**Concept**: Render all slots but use CSS `clip-path` or overflow to hide past portions.

**Example**:
```css
.time-strip {
  clip-path: inset(120px 0 0 0); /* Hide top 120px (past hours) */
}
```

**Pros**:
- Simple CSS-only solution
- Bookings remain intact visually

**Cons**:
- Hides content but still renders it (performance)
- Scrolling/interaction becomes confusing
- Doesn't update booking duration display

**Status**: Not recommended - hack that creates UX issues

---

### Approach 5: Re-render on Time Change

**Concept**: Use a timer to completely re-render the component every hour (or more frequently).

**Example**:
```jsx
useEffect(() => {
  const interval = setInterval(() => {
    forceUpdate(); // Trigger re-render
  }, 60000); // Every minute
  return () => clearInterval(interval);
}, []);
```

**Pros**:
- Works with existing slot-based architecture
- Simple to implement

**Cons**:
- Doesn't solve the visual block continuity issue
- Jarring UX when components suddenly change
- Still need to solve the position/border problems

**Status**: Partial solution - useful for triggering updates but doesn't fix visual issues

---

## Recommendation

**For Quick Fix (V1.1)**: Approach 1 - Don't Render Past Slots
- Already implemented
- Good enough for Day View
- Week View keeps all slots for grid alignment

**For V2**: Approach 2 - Absolute Positioning Overlay
- Industry-standard solution
- Cleanly separates time grid from booking data
- Enables smooth dynamic updates
- Worth the architectural investment for long-term maintainability

---

## Implementation Priority

1. **V1.1 (Done)**: Filter past slots in Day View - simple, immediate improvement
2. **V2 (Next)**: Refactor to absolute positioning overlay architecture
3. **Future**: Add real-time updates with useEffect timer to reposition bookings

---

## Related Files

| File | Role |
|------|------|
| `src/components/TimeStrip.jsx` | Day view container - renders time slots |
| `src/components/TimeSlot.jsx` | Individual slot component |
| `src/components/WeekView.jsx` | Week grid view |
| `src/hooks/useBookings.js` | Booking state and slot status logic |
| `src/utils/time.js` | Time formatting and calculation utilities |
