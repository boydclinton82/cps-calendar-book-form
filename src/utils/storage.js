const STORAGE_KEY = 'cps-bookings';

export function getBookings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error reading bookings from localStorage:', error);
    return {};
  }
}

export function saveBookings(bookings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    return true;
  } catch (error) {
    console.error('Error saving bookings to localStorage:', error);
    return false;
  }
}

export function getBookingsForDate(date) {
  const bookings = getBookings();
  return bookings[date] || {};
}

export function setBooking(date, time, booking) {
  const bookings = getBookings();
  if (!bookings[date]) {
    bookings[date] = {};
  }
  bookings[date][time] = booking;
  return saveBookings(bookings);
}

export function removeBooking(date, time) {
  const bookings = getBookings();
  if (bookings[date] && bookings[date][time]) {
    delete bookings[date][time];
    // Clean up empty date entries
    if (Object.keys(bookings[date]).length === 0) {
      delete bookings[date];
    }
    return saveBookings(bookings);
  }
  return false;
}

// Timezone preference storage

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
