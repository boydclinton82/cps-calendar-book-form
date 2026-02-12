// BEHAVIOR: Booking modification endpoint - handles updating existing bookings and deleting bookings
// DATA_FLOW: PUT -> validate input -> check duration conflicts -> update in KV -> return updated booking
//           DELETE -> validate input -> remove from KV -> clean up empty dates -> return success
// VALIDATION: Both operations require dateKey and timeKey; PUT additionally validates duration conflicts

import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput } from '../_lib/security.js';

/**
 * PUT /api/bookings/update - Update an existing booking
 * DELETE /api/bookings/update - Delete a booking
 *
 * REQUEST (PUT):
 *   Body: { "dateKey": "YYYY-MM-DD", "timeKey": "HH:00", "updates": { "user"?: string, "duration"?: number } }
 *   Example: { "dateKey": "2026-02-13", "timeKey": "09:00", "updates": { "duration": 3 } }
 *   Example: { "dateKey": "2026-02-13", "timeKey": "09:00", "updates": { "user": "Teagan" } }
 *
 * RESPONSE (PUT):
 *   200 { "success": true, "booking": { "user": "Jack", "duration": 3 } }
 *   400 { "error": "Missing or invalid fields: dateKey, timeKey, updates" }
 *   404 { "error": "Booking not found" }
 *   409 { "error": "Cannot extend: slot 11:00 is already booked" }
 *
 * REQUEST (DELETE):
 *   Body: { "dateKey": "YYYY-MM-DD", "timeKey": "HH:00" }
 *   Example: { "dateKey": "2026-02-13", "timeKey": "09:00" }
 *
 * RESPONSE (DELETE):
 *   200 { "success": true }
 *   400 { "error": "Missing or invalid fields: dateKey, timeKey" }
 *   404 { "error": "Booking not found" }
 */
async function handler(req, res) {
  // DATA_CONSTRAINT: Instance slug from environment determines storage key
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  const key = `instance:${slug}:bookings`;

  try {
    if (req.method === 'PUT') {
      // BEHAVIOR: Update an existing booking (change user or duration)
      // DATA_FLOW: Sanitize input -> fetch current -> validate exists -> check duration conflicts -> merge updates -> save

      // VALIDATION: Sanitize input to prevent XSS and injection attacks
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey, updates } = sanitized;

      // VALIDATION: All fields required for updating
      if (!dateKey || !timeKey || !updates) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey, updates'
        });
      }

      // DATA_FLOW: Read current bookings from storage
      let bookings = await kv.get(key) || {};

      // VALIDATION: Booking must exist to update it
      if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const currentBooking = bookings[dateKey][timeKey];

      // VALIDATION: If duration is being changed, check for conflicts with other bookings
      // EDGE_CASE: If extending from 2 hours to 3 hours, only need to validate new 3rd hour slot
      // WHY: Existing slots (1st and 2nd hour) are already occupied by this booking
      if (updates.duration && updates.duration !== currentBooking.duration) {
        const startHour = parseInt(timeKey.split(':')[0], 10);

        // Check new slots (beyond current duration)
        for (let i = currentBooking.duration; i < updates.duration; i++) {
          const checkHour = startHour + i;
          const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;
          if (bookings[dateKey][checkKey]) {
            return res.status(409).json({
              error: `Cannot extend: slot ${checkKey} is already booked`
            });
          }
        }
      }

      // BEHAVIOR: Merge updates into existing booking (partial update)
      bookings[dateKey][timeKey] = {
        ...currentBooking,
        ...updates,
      };

      // DATA_FLOW: Save updated bookings back to Vercel KV
      await kv.set(key, bookings);

      return res.status(200).json({
        success: true,
        booking: bookings[dateKey][timeKey]
      });
    }

    if (req.method === 'DELETE') {
      // BEHAVIOR: Delete a booking completely
      // DATA_FLOW: Sanitize input -> fetch current -> validate exists -> delete from object -> clean up empty dates -> save

      // VALIDATION: Sanitize input
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey } = sanitized;

      // VALIDATION: Both fields required for deletion
      if (!dateKey || !timeKey) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey'
        });
      }

      // DATA_FLOW: Read current bookings from storage
      let bookings = await kv.get(key) || {};

      // VALIDATION: Booking must exist to delete it
      if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // BEHAVIOR: Remove the booking from the data structure
      delete bookings[dateKey][timeKey];

      // EDGE_CASE: Clean up empty date objects to keep storage tidy
      // WHY: If this was the last booking on a date, remove the date key entirely
      if (Object.keys(bookings[dateKey]).length === 0) {
        delete bookings[dateKey];
      }

      // DATA_FLOW: Save updated bookings back to Vercel KV
      await kv.set(key, bookings);

      return res.status(200).json({ success: true });
    }

    // EDGE_CASE: Method not allowed - only PUT and DELETE supported on this endpoint
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling booking update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// BEHAVIOR: Wrap handler with security middleware (CORS, rate limiting, header injection)
export default withSecurity(handler);
