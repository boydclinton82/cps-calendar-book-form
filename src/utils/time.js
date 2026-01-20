// Time range: 6:00 AM - 10:00 PM (16 hourly slots)
export const START_HOUR = 6;
export const END_HOUR = 22;
export const SLOT_COUNT = END_HOUR - START_HOUR;

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

export function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
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
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate < now;
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
