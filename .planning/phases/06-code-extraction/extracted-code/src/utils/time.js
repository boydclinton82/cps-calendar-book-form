// BEHAVIOR: Time and date utilities for booking system - handles time slot generation,
// date formatting, timezone display, and multi-hour booking conflict detection
// DATA_CONSTRAINT: All times are stored in Queensland (Australia/Brisbane) timezone (UTC+10, no DST)
// WHY: Business operates in Queensland; bookings reference Queensland time as source of truth

// CONSTANT: START_HOUR = 6 (6:00 AM) - First available booking slot each day
// CONSTANT: END_HOUR = 22 (10:00 PM) - Last available booking slot each day (slots run 6 AM to 9 PM, 16 total slots)
export const START_HOUR = 6;
export const END_HOUR = 22;

// BEHAVIOR: Generate array of all available time slots for a day
// DATA_CONSTRAINT: Returns array of { hour: number, time: string, key: string }
//                  Example: [{ hour: 6, time: "6:00 AM", key: "06:00" }, ...]
export function generateTimeSlots() {
  const slots = [];
  for (let hour = START_HOUR; hour < END_HOUR; hour++) {
    slots.push({
      hour,
      time: formatHour(hour),
      key: formatTimeKey(hour),
    });
  }
  return slots;
}

// BEHAVIOR: Format hour as 12-hour time string (e.g., "9:00 AM", "2:00 PM")
// EDGE_CASE: When useNSWTime is true and NSW is in daylight saving, adds 1 hour for display only
// WHY: NSW users need to see bookings in their local time during daylight saving period (Oct-Apr)
// DATA_CONSTRAINT: Storage always uses Queensland time; this only affects display
export function formatHour(hour, useNSWTime = false) {
  let displayHour = hour;

  // Apply NSW offset during daylight saving (AEDT = +1h vs QLD)
  if (useNSWTime && isNSWInDST()) {
    displayHour = hour + 1;
  }

  const period = displayHour >= 12 ? 'PM' : 'AM';
  const h = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
  return `${h}:00 ${period}`;
}

// BEHAVIOR: Format hour as storage key (e.g., "06:00", "14:00")
// DATA_CONSTRAINT: Always 24-hour format with leading zero (HH:00)
// WHY: Keys must sort chronologically and match server storage format
export function formatTimeKey(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

// BEHAVIOR: Format JavaScript Date object as YYYY-MM-DD string
// DATA_CONSTRAINT: Returns ISO date format (YYYY-MM-DD)
// WHY: Used as key for booking storage and API requests
export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

// BEHAVIOR: Format date as human-readable string (e.g., "Monday, February 13, 2026")
export function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// BEHAVIOR: Format date as short string (e.g., "Mon, Feb 13")
export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// BEHAVIOR: Check if a time slot is in the past
// EDGE_CASE: Current hour stays available until the next hour begins
//            Example: At 9:45 AM, the 9:00 AM slot is still bookable
//            Only when clock hits 10:00 AM does the 9:00 AM slot become past
// WHY: Users should be able to book "now" even if 45 minutes have passed in current hour
// VALIDATION: Compares end of slot hour (start of next hour) to current time
export function isSlotPast(date, hour) {
  const now = new Date();
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);  // Sets to END of hour (start of next hour)
  return slotEnd <= now;  // True only when the next hour begins
}

// BEHAVIOR: Check if a given date is today
export function isToday(date) {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

// BEHAVIOR: Add or subtract days from a date
// DATA_CONSTRAINT: Returns new Date object (does not mutate input)
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// BEHAVIOR: Generate array of 7 consecutive dates starting from a given date
// DATA_CONSTRAINT: Returns array of Date objects
export function getWeekDays(startDate) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

// BEHAVIOR: Get the Monday of the week containing a given date
// VALIDATION: Sunday (day 0) goes back 6 days to previous Monday
//            Monday (day 1) stays at Monday
//            Tuesday-Saturday go back to Monday of same week
// WHY: Week view always starts on Monday
export function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  // Adjust to Monday (day 1) - if Sunday (0), go back 6 days
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

// BEHAVIOR: Check if a specific hour is blocked by a multi-hour booking
// VALIDATION: Hour is blocked if it falls between start and end of another booking
//            Example: 09:00 booking with duration 3 blocks hours 10 and 11 (not 9 or 12)
// EDGE_CASE: Booking at hour H with duration D blocks hours (H+1) through (H+D-1)
//            The start hour (H) and the hour after end (H+D) are NOT blocked
// DATA_CONSTRAINT: Returns { blocked: boolean, booking?: object, bookingHour?: number, startKey?: string }
// WHY: Multi-hour bookings occupy consecutive slots; this determines which slots are unavailable
export function isSlotBlocked(bookings, hour) {
  for (const [timeKey, booking] of Object.entries(bookings)) {
    const bookingHour = parseInt(timeKey.split(':')[0], 10);
    const duration = booking.duration || 1;
    if (hour > bookingHour && hour < bookingHour + duration) {
      return { blocked: true, booking, bookingHour, startKey: timeKey };
    }
  }
  return { blocked: false };
}

// === Timezone utilities for NSW/QLD display conversion ===
// WHY: Some users are in NSW (Australia/Sydney) which observes daylight saving time
//      October-April: NSW is AEDT (UTC+11), QLD stays AEST (UTC+10) -> 1 hour difference
//      April-October: Both are UTC+10 -> no difference
//      Display times need to show NSW users their local time without changing stored data

// BEHAVIOR: Detect if NSW is currently in Daylight Saving Time (AEDT vs AEST)
// DATA_CONSTRAINT: Returns true if NSW is AEDT, false if AEST
// WHY: Determines if +1 hour offset should be applied to display times for NSW users
export function isNSWInDST() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    timeZoneName: 'short'
  });
  const parts = formatter.formatToParts(now);
  const tzName = parts.find(part => part.type === 'timeZoneName')?.value;
  return tzName === 'AEDT';
}

// BEHAVIOR: Get the current offset label for NSW relative to QLD
// DATA_CONSTRAINT: Returns "+1h" during daylight saving, "+0h" otherwise
// WHY: Displayed in UI to remind NSW users their times are offset
export function getNSWOffsetLabel() {
  return isNSWInDST() ? '+1h' : '+0h';
}
