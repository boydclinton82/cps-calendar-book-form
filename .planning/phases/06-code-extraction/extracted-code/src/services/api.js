/**
 * API Service Layer
 *
 * Provides methods for interacting with the backend API.
 * Falls back to localStorage when API is unavailable or disabled.
 */

const API_BASE = '/api';
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * Helper to make API requests with error handling
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * LocalStorage fallback implementation
 */
const localStorage = {
  BOOKINGS_KEY: 'cps-bookings',

  getBookings() {
    try {
      const data = window.localStorage.getItem(this.BOOKINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveBookings(bookings) {
    try {
      window.localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
};

/**
 * Fetch instance configuration
 */
export async function fetchConfig() {
  if (!USE_API) {
    // Return null to signal ConfigContext should use mock data
    return null;
  }

  return apiRequest('/config');
}

/**
 * Fetch all bookings
 */
export async function fetchBookings() {
  if (!USE_API) {
    return localStorage.getBookings();
  }

  try {
    return await apiRequest('/bookings');
  } catch (error) {
    console.warn('API unavailable, falling back to localStorage');
    return localStorage.getBookings();
  }
}

/**
 * Create a new booking
 */
export async function createBooking({ dateKey, timeKey, user, duration }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey]) {
      bookings[dateKey] = {};
    }

    // Check for conflicts
    if (bookings[dateKey][timeKey]) {
      throw new Error('Slot already booked');
    }

    const startHour = parseInt(timeKey.split(':')[0], 10);
    for (let i = 1; i < duration; i++) {
      const checkHour = startHour + i;
      const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;
      if (bookings[dateKey][checkKey]) {
        throw new Error(`Slot ${checkKey} conflicts with booking duration`);
      }
    }

    bookings[dateKey][timeKey] = { user, duration };
    localStorage.saveBookings(bookings);

    return { success: true, booking: { dateKey, timeKey, user, duration } };
  }

  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify({ dateKey, timeKey, user, duration }),
  });
}

/**
 * Update an existing booking
 */
export async function updateBooking({ dateKey, timeKey, updates }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
      throw new Error('Booking not found');
    }

    const currentBooking = bookings[dateKey][timeKey];

    // Check for duration conflicts
    if (updates.duration && updates.duration !== currentBooking.duration) {
      const startHour = parseInt(timeKey.split(':')[0], 10);
      for (let i = currentBooking.duration; i < updates.duration; i++) {
        const checkHour = startHour + i;
        const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;
        if (bookings[dateKey][checkKey]) {
          throw new Error(`Cannot extend: slot ${checkKey} is already booked`);
        }
      }
    }

    bookings[dateKey][timeKey] = { ...currentBooking, ...updates };
    localStorage.saveBookings(bookings);

    return { success: true, booking: bookings[dateKey][timeKey] };
  }

  return apiRequest('/bookings/update', {
    method: 'PUT',
    body: JSON.stringify({ dateKey, timeKey, updates }),
  });
}

/**
 * Delete a booking
 */
export async function deleteBooking({ dateKey, timeKey }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
      throw new Error('Booking not found');
    }

    delete bookings[dateKey][timeKey];

    // Clean up empty date objects
    if (Object.keys(bookings[dateKey]).length === 0) {
      delete bookings[dateKey];
    }

    localStorage.saveBookings(bookings);
    return { success: true };
  }

  return apiRequest('/bookings/update', {
    method: 'DELETE',
    body: JSON.stringify({ dateKey, timeKey }),
  });
}

/**
 * Check if API is enabled
 */
export function isApiEnabled() {
  return USE_API;
}
