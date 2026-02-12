// Time range: 6:00 AM - 10:00 PM (16 hourly slots)
export const START_HOUR = 6;
export const END_HOUR = 22;

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

export function formatTimeKey(hour) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function isSlotPast(date, hour) {
  const now = new Date();
  const slotEnd = new Date(date);
  slotEnd.setHours(hour + 1, 0, 0, 0);  // Sets to END of hour (start of next hour)
  return slotEnd <= now;  // True only when the next hour begins
}

export function isToday(date) {
  const today = new Date();
  return formatDate(date) === formatDate(today);
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getWeekDays(startDate) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startDate, i));
  }
  return days;
}

export function getStartOfWeek(date) {
  const result = new Date(date);
  const day = result.getDay();
  // Adjust to Monday (day 1) - if Sunday (0), go back 6 days
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

// Check if a slot is blocked by a multi-hour booking
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

// Timezone utilities for NSW/QLD display conversion

// Detect if NSW is currently in Daylight Saving Time (AEDT vs AEST)
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

// Get the current offset label for NSW relative to QLD
export function getNSWOffsetLabel() {
  return isNSWInDST() ? '+1h' : '+0h';
}
