/**
 * BEHAVIOR: API client layer - handles all HTTP communication with backend
 * DATA_FLOW: Application -> API client -> HTTP request -> server -> response -> application
 * WHY: Abstracts API communication; provides fallback to localStorage when server unavailable
 * EDGE_CASE: If API is disabled or unavailable, automatically falls back to browser localStorage
 */

const API_BASE = '/api';
const USE_API = import.meta.env.VITE_USE_API === 'true';

/**
 * BEHAVIOR: Generic HTTP request helper with error handling
 * DATA_FLOW: Endpoint + options -> fetch -> parse JSON response -> return data or throw error
 * VALIDATION: Checks response status; throws error on non-2xx responses
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
 * BEHAVIOR: LocalStorage fallback implementation - provides same interface as API when offline
 * WHY: Development mode and offline scenarios need working booking system without backend
 * DATA_CONSTRAINT: Stores bookings in browser localStorage with key 'cps-bookings'
 * EDGE_CASE: localStorage may fail (quota exceeded, private mode) - gracefully returns empty data
 */
const localStorage = {
  BOOKINGS_KEY: 'cps-bookings',

  // BEHAVIOR: Retrieve all bookings from browser storage
  // DATA_CONSTRAINT: Returns same structure as API: { "YYYY-MM-DD": { "HH:00": { user, duration } } }
  getBookings() {
    try {
      const data = window.localStorage.getItem(this.BOOKINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  // BEHAVIOR: Save bookings to browser storage
  // EDGE_CASE: Fails silently if storage quota exceeded
  saveBookings(bookings) {
    try {
      window.localStorage.setItem(this.BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
};

/**
 * BEHAVIOR: Fetch instance configuration (title, user list, colors, etc.)
 * DATA_FLOW: GET /api/config -> returns { slug, title, users: [{ name, key }] }
 * DATA_CONSTRAINT: Response shape: { slug: string, title: string, users: [{ name: string, key: string }] }
 * EDGE_CASE: If API disabled, returns null to signal that mock data should be used
 */
export async function fetchConfig() {
  if (!USE_API) {
    // Return null to signal ConfigContext should use mock data
    return null;
  }

  return apiRequest('/config');
}

/**
 * BEHAVIOR: Fetch all bookings from server
 * DATA_FLOW: GET /api/bookings -> returns entire booking dataset
 * DATA_CONSTRAINT: Response: { "YYYY-MM-DD": { "HH:00": { user: string, duration: number } } }
 * EDGE_CASE: If API fails, falls back to localStorage
 * WHY: Single endpoint returns all bookings; UI filters by date locally
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
 * BEHAVIOR: Create a new booking
 * DATA_FLOW: POST /api/bookings with { dateKey, timeKey, user, duration } -> returns { success, booking }
 * VALIDATION: Server checks for conflicts (slot already booked, duration overlaps)
 * DATA_CONSTRAINT: Request body: { dateKey: "YYYY-MM-DD", timeKey: "HH:00", user: string, duration: 1-8 }
 * EDGE_CASE: If localStorage mode, performs conflict checks locally before storing
 *
 * Request example:
 * POST /api/bookings
 * { "dateKey": "2026-02-13", "timeKey": "09:00", "user": "Jack", "duration": 2 }
 *
 * Response success:
 * 201 { "success": true, "booking": { "dateKey": "2026-02-13", ... } }
 *
 * Response conflict:
 * 409 { "error": "Slot already booked" }
 */
export async function createBooking({ dateKey, timeKey, user, duration }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey]) {
      bookings[dateKey] = {};
    }

    // VALIDATION: Check if slot is already booked
    if (bookings[dateKey][timeKey]) {
      throw new Error('Slot already booked');
    }

    // VALIDATION: Check if duration conflicts with existing bookings
    // EDGE_CASE: 3-hour booking starting at 09:00 must check that 10:00 and 11:00 are free
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
 * BEHAVIOR: Update an existing booking (change user or duration)
 * DATA_FLOW: PUT /api/bookings/update with { dateKey, timeKey, updates: { user?, duration? } }
 * VALIDATION: Server checks duration changes don't conflict with other bookings
 *
 * Request example:
 * PUT /api/bookings/update
 * { "dateKey": "2026-02-13", "timeKey": "09:00", "updates": { "duration": 3 } }
 *
 * Response success:
 * 200 { "success": true, "booking": { "user": "Jack", "duration": 3 } }
 *
 * Response conflict:
 * 409 { "error": "Cannot extend: slot 11:00 is already booked" }
 */
export async function updateBooking({ dateKey, timeKey, updates }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
      throw new Error('Booking not found');
    }

    const currentBooking = bookings[dateKey][timeKey];

    // VALIDATION: Check for duration conflicts when extending booking
    // EDGE_CASE: If changing from 2 hours to 3 hours, only need to check the new 3rd hour slot
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
 * BEHAVIOR: Delete a booking
 * DATA_FLOW: DELETE /api/bookings/update with { dateKey, timeKey }
 *
 * Request example:
 * DELETE /api/bookings/update
 * { "dateKey": "2026-02-13", "timeKey": "09:00" }
 *
 * Response:
 * 200 { "success": true }
 *
 * Response not found:
 * 404 { "error": "Booking not found" }
 */
export async function deleteBooking({ dateKey, timeKey }) {
  if (!USE_API) {
    const bookings = localStorage.getBookings();

    if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
      throw new Error('Booking not found');
    }

    delete bookings[dateKey][timeKey];

    // Clean up empty date objects to keep storage tidy
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
 * BEHAVIOR: Check if API mode is enabled
 * WHY: Polling and other network features should only run when API is available
 */
export function isApiEnabled() {
  return USE_API;
}
