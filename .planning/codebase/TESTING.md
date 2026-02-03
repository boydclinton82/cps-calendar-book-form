# Testing Patterns

**Analysis Date:** 2026-02-04

## Test Framework

**Runner:**
- Not detected - no test runner configured (no Jest, Vitest, etc.)

**Assertion Library:**
- Not detected - no testing libraries in package.json

**Run Commands:**
- No test commands available - testing infrastructure not set up

## Test File Organization

**Location:**
- Not applicable - no test files exist in the codebase
- No `*.test.js`, `*.test.jsx`, `*.spec.js`, or `*.spec.jsx` files found in `src/` or `api/` directories
- `node_modules` contains test files from dependencies but these are not project tests

**Naming Convention:**
- Would follow `[Component/Function].test.jsx` or `[Component/Function].spec.jsx` pattern if implemented

**Structure:**
- Would follow standard convention of collocated test files next to source code

## Test Coverage

**Requirements:**
- Not enforced - no test coverage tooling configured

**Current Status:**
- Zero test coverage - no tests exist

## Test Architecture

**Manual Testing Approach:**
- Development and validation through visual inspection in browser
- Run server with `npm run dev` (Vite dev server on localhost:5173)
- Test in browser at different viewport sizes (mobile, tablet, desktop)

**QA Areas Implied by Code:**
- Keyboard shortcuts (hotkeys) - tested through UI interaction
- Booking creation and editing - tested through UI forms
- Date navigation (day/week views) - tested through UI controls
- Slot blocking logic - visual validation in calendar
- API fallback (localStorage) - tested by disabling API via env var

## Testing Strategy Needed

**Unit Test Candidates:**

**Time utilities (`src/utils/time.js`):**
- `generateTimeSlots()` - verify slot generation (6 AM to 10 PM, 16 slots)
- `formatHour()` - verify time formatting (12-hour format with AM/PM)
- `formatTimeKey()` - verify key format (HH:00)
- `formatDate()` - verify ISO date format
- `isSlotPast()` - verify past slot detection logic
- `isToday()` - verify today detection
- `addDays()` - verify date arithmetic
- `getWeekDays()` - verify week generation
- `getStartOfWeek()` - verify Monday-start week calculation
- `isSlotBlocked()` - verify multi-hour booking blockage

**Example test structure for `isSlotBlocked()`:**
```javascript
describe('isSlotBlocked', () => {
  it('returns false when no bookings', () => {
    const result = isSlotBlocked({}, 14);
    expect(result.blocked).toBe(false);
  });

  it('detects blocking when hour falls within multi-hour booking', () => {
    const bookings = { '14:00': { user: 'John', duration: 3 } };
    const result = isSlotBlocked(bookings, 15); // 3-5 PM booking, check 3 PM
    expect(result.blocked).toBe(true);
    expect(result.bookingHour).toBe(14);
  });

  it('does not block the booking start hour', () => {
    const bookings = { '14:00': { user: 'John', duration: 3 } };
    const result = isSlotBlocked(bookings, 14);
    expect(result.blocked).toBe(false);
  });
});
```

**Color utility (`src/utils/colors.js`):**
- `getUserColorClass()` - verify user-to-color mapping
- Test with both `colorIndex` and position-based fallback

**Security validation (`api/_lib/security.js`):**
- `sanitizeString()` - verify HTML/script tag removal, length limits
- `sanitizeBookingInput()` - verify dateKey/timeKey format validation, duration bounds
- Date format validation (YYYY-MM-DD)
- Time format validation (HH:00)
- Duration bounds (1-8 hours)

**Hook Integration Tests:**

**`useBookings` hook:**
- Mock API responses with `fetchBookings`, `createBooking`, etc.
- Test optimistic updates and rollback on error
- Test polling sync trigger on error
- Verify booking state structure (nested by date, then time)
- Test `getSlotStatus()` with various booking states

**`useKeyboard` hook:**
- Mock keyboard events using `new KeyboardEvent()`
- Test user selection via keyboard (dynamic based on config)
- Test duration selection (1, 2, 3)
- Test navigation keys (arrows, W for week toggle)
- Test Escape for cancel
- Test that input/textarea fields don't trigger shortcuts

**`useConfig` hook:**
- Test context access and error if outside provider
- Verify fallback config loading

**Integration Tests:**

**API error handling flow:**
- Create booking → API fails → state reverts → sync triggered
- Test localStorage fallback when API disabled

**Keyboard navigation flow:**
- Navigate slots with arrow keys → confirm with Enter
- Switch users → change duration → create booking

**State synchronization:**
- Multiple operations in sequence maintain consistent state
- Polling updates don't overwrite local changes

## Error Scenarios to Test

**Validation Errors:**
- Invalid date format in API request
- Invalid time format in API request
- Duration outside 1-8 hour range
- Missing required fields (dateKey, timeKey, user, duration)

**Conflict Scenarios:**
- Slot already booked (409 status)
- Duration extends past existing booking (409 status)
- Multiple concurrent booking attempts (race condition)

**API Failures:**
- Network error → fallback to localStorage
- 500 status → error logged, state reverted
- Rate limit (429) → user feedback needed
- CORS failure → fallback mechanism

**Edge Cases:**
- Booking that extends to exactly 10 PM (END_HOUR)
- Booking that would exceed END_HOUR (should fail)
- Past bookings on today's date (should not render)
- Week navigation boundary (before START_HOUR in config)
- Empty bookings object → should show all slots available

## Missing Test Infrastructure

**Required setup to enable testing:**
1. Install test runner: `npm install --save-dev vitest` (or jest)
2. Install assertion library: Vitest includes assertions, or add `@testing-library/react`
3. Create test config file: `vitest.config.js`
4. Create test utilities/helpers for common setup
5. Add test script: `"test": "vitest"` and `"test:ui": "vitest --ui"`

**Test file locations to create:**
- `src/utils/__tests__/time.test.js`
- `src/utils/__tests__/colors.test.js`
- `src/hooks/__tests__/useBookings.test.js`
- `src/hooks/__tests__/useKeyboard.test.js`
- `src/hooks/__tests__/useConfig.test.js`
- `api/__tests__/bookings.test.js`
- `api/__tests__/security.test.js`

**Mock strategies:**
- API calls: Mock `fetch()` using library like MSW (Mock Service Worker) or vitest `vi.mock()`
- localStorage: Mock with `vi.stubGlobal('localStorage', { ... })`
- Date/time: Mock `new Date()` for consistent test results
- Keyboard events: Create synthetic events with `new KeyboardEvent()`

## Example Test File Structure

```javascript
// src/utils/__tests__/time.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateTimeSlots,
  formatHour,
  isSlotPast,
  isToday,
  addDays,
  isSlotBlocked,
} from '../time';

describe('time utilities', () => {
  let originalDate;

  beforeEach(() => {
    // Mock current time to a known value
    const fixedDate = new Date('2024-02-04T14:30:00Z');
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('generateTimeSlots', () => {
    it('generates 16 hourly slots from 6 AM to 10 PM', () => {
      const slots = generateTimeSlots();
      expect(slots).toHaveLength(16);
      expect(slots[0].hour).toBe(6);
      expect(slots[15].hour).toBe(21);
    });

    it('includes formatted time and key for each slot', () => {
      const slots = generateTimeSlots();
      const slot = slots[0];
      expect(slot).toEqual({
        hour: 6,
        time: '6:00 AM',
        key: '06:00',
      });
    });
  });

  describe('isSlotPast', () => {
    it('identifies past slots on today', () => {
      const today = new Date();
      const pastSlot = 13; // 1 PM, current time is 2:30 PM
      expect(isSlotPast(today, pastSlot)).toBe(true);
    });

    it('identifies future slots on today', () => {
      const today = new Date();
      const futureSlot = 16; // 4 PM, current time is 2:30 PM
      expect(isSlotPast(today, futureSlot)).toBe(false);
    });

    it('returns false for slots on past dates', () => {
      const pastDate = new Date('2024-01-15');
      expect(isSlotPast(pastDate, 14)).toBe(true);
    });
  });

  describe('isSlotBlocked', () => {
    it('returns blocked=false for empty bookings', () => {
      const result = isSlotBlocked({}, 14);
      expect(result.blocked).toBe(false);
    });

    it('detects slot blocked by multi-hour booking', () => {
      const bookings = { '14:00': { user: 'John', duration: 3 } };
      const result = isSlotBlocked(bookings, 15);
      expect(result.blocked).toBe(true);
      expect(result.bookingHour).toBe(14);
      expect(result.startKey).toBe('14:00');
    });

    it('does not block the booking start slot', () => {
      const bookings = { '14:00': { user: 'John', duration: 3 } };
      const result = isSlotBlocked(bookings, 14);
      expect(result.blocked).toBe(false);
    });

    it('does not block slots after booking duration', () => {
      const bookings = { '14:00': { user: 'John', duration: 3 } };
      const result = isSlotBlocked(bookings, 17); // After 3-5 PM booking
      expect(result.blocked).toBe(false);
    });
  });
});
```

## Current Testing Reality

**What IS tested implicitly:**
- Manual visual testing in browser during development
- API endpoint validation via running backend
- Keyboard shortcut functionality via user interaction
- Fallback to localStorage via toggling env var `VITE_USE_API`
- Component rendering via `npm run dev` and inspection

**What IS NOT tested:**
- Edge cases in time utilities
- Validation rules in security layer
- API error handling paths
- Keyboard hook interactions
- Hook state management

---

*Testing analysis: 2026-02-04*
