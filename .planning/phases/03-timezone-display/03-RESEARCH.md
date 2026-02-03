# Phase 3: Timezone Display - Research

**Researched:** 2026-02-04
**Domain:** JavaScript timezone conversion and localStorage persistence
**Confidence:** HIGH

## Summary

Phase 3 adds timezone display toggle functionality, allowing users to view booking times in either Queensland (UTC+10) or New South Wales (AEDT/AEST) timezone. The key challenge is that Queensland does NOT observe daylight saving time, while NSW does, creating a dynamic offset that changes twice per year.

The implementation requires:
1. Display-only timezone conversion using JavaScript's native Intl.DateTimeFormat API
2. Dynamic DST detection to show correct offset label (+0h or +1h)
3. localStorage persistence for toggle state across sessions
4. All bookings remain stored in Queensland time (UTC+10) regardless of display setting

This is a pure display feature requiring no new dependencies - the project's existing React 18 setup and vanilla JavaScript are sufficient.

**Primary recommendation:** Use JavaScript's native Date object with manual hour offset for display conversion. Use Intl.DateTimeFormat to detect DST status for NSW. Persist toggle state in localStorage using existing storage patterns from src/utils/storage.js.

## Standard Stack

### Core

The existing project stack is sufficient - no new libraries required.

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | UI state management | Already in project, useState perfect for toggle |
| localStorage | Native | Toggle persistence | Native browser API, already used in storage.js |
| Date | Native JS | Timezone calculations | Native, no library needed for simple +1 hour offset |
| Intl.DateTimeFormat | Native JS | DST detection | Native API, handles DST automatically |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None required | - | - | Project needs are satisfied by native APIs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native Date | moment-timezone | Overkill for simple +1h offset, adds 67KB+ bundle size |
| Native Date | date-fns-tz | Better than moment, but still unnecessary for this use case |
| Native Intl | Manual DST date ranges | Breaks when Australia changes DST rules, Intl is authoritative |

**Installation:**
```bash
# No new packages needed - using native browser APIs only
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── utils/
│   ├── time.js              # Add timezone conversion functions here
│   └── storage.js           # Add timezone preference persistence here
├── components/
│   └── Header.jsx           # Add timezone toggle button here
└── App.jsx                  # Add timezone state management here
```

### Pattern 1: Display-Only Timezone Conversion

**What:** Convert stored QLD time to NSW display time by adding offset hours
**When to use:** When rendering time labels in UI components
**Example:**
```javascript
// Source: Research findings - manual offset approach
export function convertToNSW(qldHour, useNSWTime) {
  if (!useNSWTime) return qldHour;

  // Check if NSW is currently in AEDT (DST active)
  const isDST = isNSWInDST();
  const offset = isDST ? 1 : 0; // +1 during AEDT, +0 during AEST

  return qldHour + offset;
}

export function formatHourWithTimezone(hour, useNSWTime = false) {
  const displayHour = convertToNSW(hour, useNSWTime);
  const period = displayHour >= 12 ? 'PM' : 'AM';
  const hour12 = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
  return `${hour12}:00 ${period}`;
}
```

### Pattern 2: DST Detection Using Intl.DateTimeFormat

**What:** Detect if NSW is currently observing daylight saving time (AEDT vs AEST)
**When to use:** To determine current offset label and conversion amount
**Example:**
```javascript
// Source: MDN Intl.DateTimeFormat
export function isNSWInDST() {
  const now = new Date();

  // Get NSW timezone offset using Intl API
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney', // Sydney = NSW timezone
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(now);
  const tzName = parts.find(part => part.type === 'timeZoneName')?.value;

  // AEDT = Daylight time (UTC+11), AEST = Standard time (UTC+10)
  return tzName === 'AEDT';
}

export function getNSWOffsetLabel() {
  return isNSWInDST() ? '+1h' : '+0h';
}
```

### Pattern 3: localStorage Toggle Persistence

**What:** Save timezone preference to localStorage and restore on page load
**When to use:** When user toggles timezone setting
**Example:**
```javascript
// Source: Existing pattern from src/utils/storage.js
const TZ_KEY = 'cps-timezone-preference';

export function getTimezonePreference() {
  try {
    const value = localStorage.getItem(TZ_KEY);
    return value === 'NSW'; // Returns true if NSW selected, false otherwise
  } catch (error) {
    console.error('Error reading timezone preference:', error);
    return false; // Default to QLD
  }
}

export function saveTimezonePreference(useNSW) {
  try {
    localStorage.setItem(TZ_KEY, useNSW ? 'NSW' : 'QLD');
    return true;
  } catch (error) {
    console.error('Error saving timezone preference:', error);
    return false;
  }
}
```

### Pattern 4: React State Management for Toggle

**What:** Use useState with lazy initialization from localStorage
**When to use:** In App.jsx to manage timezone display state
**Example:**
```javascript
// Source: React best practices for localStorage persistence
import { useState, useEffect } from 'react';
import { getTimezonePreference, saveTimezonePreference } from './utils/storage';

function App() {
  // Lazy initial state - only reads localStorage once on mount
  const [useNSWTime, setUseNSWTime] = useState(() => getTimezonePreference());

  // Persist changes to localStorage
  useEffect(() => {
    saveTimezonePreference(useNSWTime);
  }, [useNSWTime]);

  const handleTimezoneToggle = () => {
    setUseNSWTime(prev => !prev);
  };

  // Pass useNSWTime down to components that display times
  return <Header useNSWTime={useNSWTime} onTimezoneToggle={handleTimezoneToggle} />;
}
```

### Pattern 5: Prop Threading for Timezone Context

**What:** Pass useNSWTime boolean down through component tree
**When to use:** To ensure all time displays use the same timezone setting
**Example:**
```javascript
// App.jsx passes to Header, TimeSlot, TimeStrip, WeekView, etc.
<TimeStrip
  useNSWTime={useNSWTime}
  // ... other props
/>

// TimeSlot.jsx uses it for display
export function TimeSlot({ time, hour, useNSWTime, ...props }) {
  const displayTime = formatHourWithTimezone(hour, useNSWTime);
  return <button>{displayTime}</button>;
}
```

### Anti-Patterns to Avoid

- **Storing NSW time in bookings:** Always store in QLD time (UTC+10). Display conversion happens at render time only.
- **Hard-coded DST date ranges:** Never manually calculate "first Sunday in October" - use Intl API which handles rule changes.
- **Using timezone offset numbers directly:** Don't assume "NSW = UTC+11". Use IANA timezone names (Australia/Sydney) with Intl.
- **Converting all hours at state level:** Keep stored hours in QLD time, convert only during display formatting.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DST detection | Manual date range checks | Intl.DateTimeFormat with Australia/Sydney | DST rules can change, Intl stays current |
| Timezone conversion | Custom offset calculations | Simple +1 hour with Intl DST check | For single hour offset, native is sufficient |
| localStorage wrapper | Generic cache system | Existing storage.js pattern | Already proven in codebase |
| Timezone names | Hard-coded abbreviations | Intl timezone database | IANA names are canonical |

**Key insight:** For this simple QLD→NSW conversion, native JavaScript APIs provide everything needed. External timezone libraries add unnecessary complexity and bundle size for a single-hour offset use case.

## Common Pitfalls

### Pitfall 1: Mutating Stored Booking Data

**What goes wrong:** Converting stored booking times from QLD to NSW permanently changes the data
**Why it happens:** Confusion between storage format vs display format
**How to avoid:**
- NEVER modify booking hour values based on timezone toggle
- Always store bookings using original QLD hours (6-22)
- Apply timezone conversion ONLY in formatting functions (formatHour, formatTimeKey)
**Warning signs:**
- Bookings shift by 1 hour after toggling timezone
- Booking keys change from "09:00" to "10:00"
- Data in localStorage shows NSW hours instead of QLD hours

### Pitfall 2: Hard-Coding DST Dates

**What goes wrong:** App breaks when Australia changes DST start/end rules
**Why it happens:** Assuming "first Sunday in October/April" is permanent
**How to avoid:**
- Use Intl.DateTimeFormat with 'Australia/Sydney' timezone
- Let the browser's timezone database handle DST transitions
- Never write manual date range checks for DST
**Warning signs:**
- Code contains month/date checks like "if (month === 9)"
- Comments reference specific DST transition dates
- Offset calculation uses Date.getMonth() or Date.getDate()

### Pitfall 3: Inconsistent Timezone Across Components

**What goes wrong:** Some components show QLD time while others show NSW time
**Why it happens:** Forgetting to pass useNSWTime prop to all time-displaying components
**How to avoid:**
- Thread useNSWTime through all components that display times
- Use single source of truth in App.jsx state
- Audit all formatHour() calls to accept timezone parameter
**Warning signs:**
- Toggle changes header but not time slots
- Week view shows different timezone than day view
- Booking popup displays wrong timezone

### Pitfall 4: Assuming QLD and NSW Are Always Different

**What goes wrong:** Always showing "+1h" label even during AEST (standard time)
**Why it happens:** Not checking current DST status dynamically
**How to avoid:**
- Always call isNSWInDST() to get current status
- Update offset label based on actual DST state
- During AEST (April-October), QLD and NSW are the same (UTC+10)
**Warning signs:**
- Label shows "+1h" in Australian winter (April-October)
- No seasonal variation in offset display
- Conversion adds hour when it shouldn't

### Pitfall 5: localStorage Quota Exceeded

**What goes wrong:** Timezone preference fails to save silently
**Why it happens:** Not wrapping localStorage operations in try-catch
**How to avoid:**
- Follow existing storage.js pattern with error handling
- Log errors to console for debugging
- Gracefully degrade to default (QLD) on failure
**Warning signs:**
- Toggle doesn't persist across page refreshes
- No error messages when storage fails
- Works in normal mode but fails in private browsing

## Code Examples

Verified patterns from official sources and existing codebase:

### Detect NSW DST Status

```javascript
// Source: MDN Intl.DateTimeFormat
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat

export function isNSWInDST() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(now);
  const tzName = parts.find(part => part.type === 'timeZoneName')?.value;

  // AEDT = Daylight (UTC+11), AEST = Standard (UTC+10)
  return tzName === 'AEDT';
}
```

### Convert Display Time with Timezone

```javascript
// Source: Extend existing formatHour from src/utils/time.js

export function formatHour(hour, useNSWTime = false) {
  let displayHour = hour;

  if (useNSWTime && isNSWInDST()) {
    displayHour = hour + 1; // Add 1 hour during AEDT
  }

  const period = displayHour >= 12 ? 'PM' : 'AM';
  const hour12 = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
  return `${hour12}:00 ${period}`;
}
```

### Persist Toggle State

```javascript
// Source: Existing pattern from src/utils/storage.js

const TZ_PREFERENCE_KEY = 'cps-timezone-preference';

export function getTimezonePreference() {
  try {
    const value = localStorage.getItem(TZ_PREFERENCE_KEY);
    return value === 'NSW';
  } catch (error) {
    console.error('Error reading timezone preference:', error);
    return false; // Default to QLD
  }
}

export function saveTimezonePreference(useNSW) {
  try {
    localStorage.setItem(TZ_PREFERENCE_KEY, useNSW ? 'NSW' : 'QLD');
    return true;
  } catch (error) {
    console.error('Error saving timezone preference:', error);
    return false;
  }
}
```

### Header Toggle Component

```javascript
// Source: Extend existing Header.jsx pattern (similar to Week Toggle)

export function Header({ useNSWTime, onTimezoneToggle, ...props }) {
  const offset = useNSWTime ? getNSWOffsetLabel() : '';

  return (
    <header className="header">
      <div className="header-top">
        {/* ... existing title ... */}

        <button
          className={`timezone-toggle ${useNSWTime ? 'active' : ''}`}
          onClick={onTimezoneToggle}
          aria-pressed={useNSWTime}
        >
          <span className="mono">[T]</span>
          {useNSWTime ? `NSW ${offset}` : 'QLD'}
        </button>
      </div>
      {/* ... rest of header ... */}
    </header>
  );
}
```

### React State with Persistence

```javascript
// Source: React best practices for localStorage
// https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/

function App() {
  // Lazy initialization - only runs once on mount
  const [useNSWTime, setUseNSWTime] = useState(() => getTimezonePreference());

  // Sync to localStorage on change
  useEffect(() => {
    saveTimezonePreference(useNSWTime);
  }, [useNSWTime]);

  const handleTimezoneToggle = useCallback(() => {
    setUseNSWTime(prev => !prev);
  }, []);

  // ... rest of App
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| moment-timezone | Native Intl API | ~2020 | Reduced bundle size, better browser support |
| Manual DST calculations | Intl.DateTimeFormat | ES2020+ | Automatic DST handling, future-proof |
| Global timezone libraries | Simple offset for single tz | 2024+ | Lighter weight for simple use cases |

**Deprecated/outdated:**
- moment.js: Still works but officially in maintenance mode, discouraged for new projects
- Date.toLocaleString() alone: Less control than Intl.DateTimeFormat constructor
- Hard-coded UTC offset numbers: IANA timezone names are now preferred

## Open Questions

1. **Edge case: What happens at exactly 2:00 AM during DST transition?**
   - What we know: Intl API handles transitions automatically
   - What's unclear: Whether hour 2 (2:00-3:00 AM) appears twice when clocks go back
   - Recommendation: Document assumption that booking system closes at 10 PM (before transition), so this edge case doesn't occur in practice

2. **Should we show timezone in time labels themselves?**
   - What we know: Requirements show offset in toggle button ("+1h")
   - What's unclear: Whether individual time labels should say "9:00 AM AEDT"
   - Recommendation: Keep labels simple ("9:00 AM"), rely on header toggle showing current timezone context

3. **What if Queensland changes DST policy in future?**
   - What we know: QLD has rejected DST multiple times and currently doesn't observe it
   - What's unclear: Long-term political stability of this decision
   - Recommendation: If QLD adopts DST, code needs rework to support QLD DST detection, but Intl API will handle it automatically

## Sources

### Primary (HIGH confidence)

- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) - JavaScript timezone formatting API
- [MDN: Date.prototype.getTimezoneOffset()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset) - Timezone offset method
- [NSW Government: Daylight saving in NSW](https://www.nsw.gov.au/about-nsw/daylight-saving) - Official DST dates
- [Time and Date: Daylight Saving Time 2026 in Australia](https://www.timeanddate.com/time/change/australia) - 2026 DST calendar
- [Josh W. Comeau: Persisting React State in localStorage](https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/) - localStorage patterns with React

### Secondary (MEDIUM confidence)

- [CoreUI: How to Manage Date and Time in Specific Timezones](https://coreui.io/blog/how-to-manage-date-and-time-in-specific-timezones-using-javascript/) - JavaScript timezone handling tutorial
- [CoreUI: Persist state with localStorage in React](https://coreui.io/answers/how-to-persist-state-with-localstorage-in-react/) - React localStorage patterns
- [bobbyhadz: Check if DST is in Effect](https://bobbyhadz.com/blog/javascript-date-check-if-dst) - DST detection examples

### Tertiary (LOW confidence)

- Various Medium articles on timezone handling - general background only

## Australian Timezone Facts

**Queensland (QLD):**
- Timezone: AEST (Australian Eastern Standard Time)
- UTC Offset: UTC+10 (year-round, never changes)
- Daylight Saving: NOT observed
- IANA identifier: Australia/Brisbane

**New South Wales (NSW):**
- Timezone: AEST (standard) / AEDT (daylight)
- UTC Offset: UTC+10 (AEST) or UTC+11 (AEDT)
- Daylight Saving: Observed first Sunday in October to first Sunday in April
- IANA identifier: Australia/Sydney

**Key Insight:** During NSW summer (AEDT), NSW is 1 hour ahead of QLD. During NSW winter (AEST), they are the same time. This means the offset is NOT constant - it changes with DST transitions.

**2026 DST Dates:**
- DST ends: Sunday, April 5, 2026 at 3:00 AM AEDT (clocks back to 2:00 AM)
- DST begins: Sunday, October 4, 2026 at 2:00 AM AEST (clocks forward to 3:00 AM)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native APIs are well-documented and stable
- Architecture: HIGH - Patterns match existing codebase conventions
- Pitfalls: HIGH - Based on common JavaScript timezone mistakes and localStorage issues
- DST detection: HIGH - Intl API is authoritative source
- Australian timezone rules: HIGH - Verified with official government sources

**Research date:** 2026-02-04
**Valid until:** 90 days (stable browser APIs, but DST dates should be verified annually)
