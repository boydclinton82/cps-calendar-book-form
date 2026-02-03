# Phase 2: Quick Booking - Research

**Researched:** 2026-02-04
**Domain:** React UI Enhancement + Existing Booking Flow Integration
**Confidence:** HIGH

## Summary

Phase 2 adds a "Book Now" button to the header that allows instant booking of the current hour with one click. This feature leverages the existing booking infrastructure without requiring new libraries or architectural changes. The implementation is straightforward because:

1. All booking logic already exists in `useBookings` hook
2. Current hour determination is already implemented for slot past-checking
3. Booking panel UI already supports pre-selection
4. Availability checking logic handles all edge cases (booked, blocked, past)

The research confirms this is primarily a UI integration task that reuses existing patterns. The main technical consideration is determining button visibility based on current hour availability, which involves checking three conditions: not past, not booked, and not blocked by multi-hour bookings.

**Primary recommendation:** Add button to Header component, connect to existing App.jsx state management, reuse BookingPanel with pre-selected slot.

## Standard Stack

No new libraries required. Phase uses existing React patterns and project conventions.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | Component state management | Already in project, handles button state |
| Existing hooks | Current | `useBookings`, `useCallback`, `useMemo` | Project patterns for availability checking |

### Supporting
N/A - No additional libraries needed.

### Alternatives Considered
N/A - No alternatives needed; feature uses existing architecture.

**Installation:**
```bash
# No new installations required
```

## Architecture Patterns

### Current Booking Flow (Reusable)

The existing booking flow follows this pattern:

1. User clicks time slot → `handleSlotSelect()` called with slot data
2. `selectedSlot` state set → BookingPanel opens
3. User selects name via hotkey → `handleUserSelect()` updates `selectedUser`
4. User selects duration via hotkey → `handleDurationSelect()` creates booking
5. Panel closes, booking created via `createBooking()`

**What Book Now does:** Jump directly to step 1 with current hour pre-selected.

### Pattern 1: Header Action Button

**What:** Action button in header that triggers modal workflow
**When to use:** Quick access to common action from any view
**Example:** Week Toggle button already exists in Header

```jsx
// Source: src/components/Header.jsx (existing pattern)
<button
  className={`week-toggle ${isWeekView ? 'active' : ''}`}
  onClick={onWeekToggle}
  aria-pressed={isWeekView}
>
  <span className="mono">[W]</span> {isWeekView ? 'Day View' : 'Week View'}
</button>
```

**Book Now adaptation:** Follow same pattern with conditional rendering based on availability.

### Pattern 2: Conditional Button Visibility

**What:** Show/hide UI elements based on computed state
**When to use:** When UI element only makes sense in specific conditions
**Implementation approach:**

```jsx
// Source: Existing pattern from App.jsx visibleSlots calculation
const currentHourAvailable = useMemo(() => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDateKey = formatDate(now);

  // Check if current hour is in booking range
  if (currentHour < START_HOUR || currentHour >= END_HOUR) return false;

  // Check availability
  const timeKey = formatTimeKey(currentHour);
  const status = getSlotStatus(currentDateKey, timeKey, currentHour);

  return status.status === 'available';
}, [bookings, getSlotStatus]); // Recompute when bookings change

// In render
{currentHourAvailable && (
  <button onClick={handleBookNow}>Book Now</button>
)}
```

**Key insight:** `useMemo` prevents unnecessary recalculation; dependencies ensure recalculation when bookings update.

### Pattern 3: Slot Pre-Selection

**What:** Open BookingPanel with slot already selected
**When to use:** When user action implies slot selection (like "Book Now")
**Implementation:**

```jsx
// Source: Existing pattern from App.jsx handleSlotSelect
const handleBookNow = useCallback(() => {
  const now = new Date();
  const currentHour = now.getHours();
  const slot = {
    hour: currentHour,
    time: formatHour(currentHour),
    key: formatTimeKey(currentHour),
    dateKey: formatDate(now),
  };
  handleSlotSelect(slot);
}, [handleSlotSelect]);
```

**Why this works:** BookingPanel already accepts `selectedSlot` prop; it doesn't care how slot was selected.

### Anti-Patterns to Avoid

- **Duplicating booking logic:** Don't create separate booking flow for "Book Now"; reuse existing `handleSlotSelect` pathway
- **Manual time calculations:** Don't compute "current hour" in multiple places; create single source of truth
- **Inline conditionals in JSX:** Don't use `{condition ? <Button /> : null}` in Header render; compute `isBookNowVisible` in useMemo for clarity
- **Polling for time updates:** Don't add new interval to check current hour; existing `useHourlyRefresh` hook already handles hour changes

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Check if hour is past | Custom comparison logic | `isSlotPast(date, hour)` from `utils/time.js` | Already handles edge cases, tested in production |
| Check slot availability | New availability function | `getSlotStatus()` from `useBookings` hook | Centralized logic checks booked + blocked states |
| Determine current hour | `new Date().getHours()` in multiple places | Compute once in useMemo, reuse | Prevents inconsistency if computed at different times |
| Open booking panel | New modal system | Existing `handleSlotSelect()` → `selectedSlot` state | BookingPanel already wired to this state |

**Key insight:** Phase 2 requires zero new abstractions. All building blocks exist.

## Common Pitfalls

### Pitfall 1: Stale Current Hour State
**What goes wrong:** Button visibility doesn't update when hour changes (e.g., 9:59 → 10:00)
**Why it happens:** `useMemo` dependencies don't include time-based trigger
**How to avoid:** Add `bookings` as dependency (already updates hourly via `useHourlyRefresh`), or add current date to useMemo if needed
**Warning signs:** Button stays visible for past hour, or doesn't appear when hour becomes available

### Pitfall 2: Multi-Hour Blocking Check Omitted
**What goes wrong:** "Book Now" appears when current hour is blocked by earlier multi-hour booking
**Why it happens:** Only checking if current hour has direct booking, not checking `isSlotBlocked()`
**How to avoid:** Use `getSlotStatus()` which already handles both cases
**Warning signs:** Button visible at 11:00 when 10:00-12:00 booking exists

### Pitfall 3: Past Slot Check Missing
**What goes wrong:** Button visible after current hour has elapsed (e.g., showing "Book 10:00" at 10:15)
**Why it happens:** Not using `isSlotPast()` check before showing button
**How to avoid:** Check both `isSlotPast()` AND `getSlotStatus().status === 'available'`
**Warning signs:** Button appears for current hour after minute 00

### Pitfall 4: Week View Confusion
**What goes wrong:** "Book Now" tries to book current hour on wrong date when viewing different week
**Why it happens:** Using `currentDate` state instead of actual current date
**How to avoid:** Always use `new Date()` for "Book Now", ignore `currentDate` state
**Warning signs:** Booking created on wrong date when user is browsing future/past dates

### Pitfall 5: Button Stays After Booking
**What goes wrong:** "Book Now" button remains visible after user books current hour
**Why it happens:** `useMemo` dependencies don't trigger recompute when booking created
**How to avoid:** Include `bookings` in useMemo dependencies; `createBooking` updates this state
**Warning signs:** Button clickable after slot becomes occupied

## Code Examples

Verified patterns from existing codebase:

### Current Hour Availability Check
```javascript
// Source: Adapted from src/utils/time.js + src/hooks/useBookings.js
import { isSlotPast, formatDate, formatTimeKey, START_HOUR, END_HOUR } from '../utils/time';

const currentHourAvailable = useMemo(() => {
  const now = new Date();
  const currentHour = now.getHours();

  // Outside booking hours
  if (currentHour < START_HOUR || currentHour >= END_HOUR) return false;

  // Check if past (handles same-hour edge case)
  if (isSlotPast(now, currentHour)) return false;

  // Check booking status
  const currentDateKey = formatDate(now);
  const timeKey = formatTimeKey(currentHour);
  const status = getSlotStatus(currentDateKey, timeKey, currentHour);

  return status.status === 'available';
}, [getSlotStatus, bookings]);
```

### Book Now Click Handler
```javascript
// Source: Adapted from src/App.jsx handleSlotSelect pattern
import { formatHour, formatTimeKey, formatDate } from '../utils/time';

const handleBookNow = useCallback(() => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDateKey = formatDate(now);

  const slot = {
    hour: currentHour,
    time: formatHour(currentHour),
    key: formatTimeKey(currentHour),
    dateKey: currentDateKey,
  };

  handleSlotSelect(slot);
}, [handleSlotSelect]);
```

### Header Component Integration
```jsx
// Source: Adapted from src/components/Header.jsx structure
export function Header({
  title,
  currentDate,
  onNavigate,
  onWeekToggle,
  onBookNow,
  isWeekView,
  showBookNow = false,
}) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title mono">{title}</h1>
        <div className="header-actions">
          {showBookNow && (
            <button
              className="book-now-btn"
              onClick={onBookNow}
              aria-label="Book current hour"
            >
              <span className="mono">[B]</span> Book Now
            </button>
          )}
          <button
            className={`week-toggle ${isWeekView ? 'active' : ''}`}
            onClick={onWeekToggle}
            aria-pressed={isWeekView}
          >
            <span className="mono">[W]</span> {isWeekView ? 'Day View' : 'Week View'}
          </button>
        </div>
      </div>
      {/* ... rest of header ... */}
    </header>
  );
}
```

## State of the Art

No library updates needed. Feature uses existing React patterns.

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A | useMemo for computed availability | Existing in project | Prevents unnecessary recalculations |
| N/A | useCallback for event handlers | Existing in project | Prevents unnecessary re-renders |

**Deprecated/outdated:**
N/A - All patterns current.

## Open Questions

Things that couldn't be fully resolved:

1. **Keyboard Shortcut for "Book Now"**
   - What we know: [B] key seems unused, [W] already used for Week toggle
   - What's unclear: Whether [B] conflicts with future features, whether hotkey needed at all
   - Recommendation: Use [B] for consistency with keyboard-first design; can be easily changed later if conflict arises

2. **Mobile Responsiveness**
   - What we know: Header already has mobile breakpoint at 600px; Week toggle hidden on mobile
   - What's unclear: Whether "Book Now" should also hide on mobile or take priority over Week toggle
   - Recommendation: Show "Book Now" on mobile (more useful than Week toggle); hide Week toggle first if space limited

## Sources

### Primary (HIGH confidence)
- Existing codebase analysis - `src/App.jsx`, `src/components/Header.jsx`, `src/hooks/useBookings.js`, `src/utils/time.js`
- Project architecture documentation - `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`
- Requirements definition - `.planning/REQUIREMENTS.md` (BOOK-01, BOOK-02, BOOK-03)

### Secondary (MEDIUM confidence)
N/A - No external sources needed.

### Tertiary (LOW confidence)
N/A - All findings from existing codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, uses existing React patterns
- Architecture: HIGH - All patterns verified in existing codebase
- Pitfalls: HIGH - Based on common React issues + project-specific edge cases (multi-hour blocking)

**Research date:** 2026-02-04
**Valid until:** 2026-03-04 (30 days - React patterns stable, no dependencies on fast-moving libraries)
