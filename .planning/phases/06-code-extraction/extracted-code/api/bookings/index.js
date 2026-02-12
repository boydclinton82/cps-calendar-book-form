// BEHAVIOR: Main bookings endpoint - handles fetching all bookings and creating new bookings
// DATA_FLOW: GET -> fetch from Vercel KV -> return all bookings
//           POST -> validate input -> check conflicts -> save to KV -> return success
// VALIDATION: POST requires dateKey, timeKey, user, duration; checks for slot conflicts
// DATA_CONSTRAINT: Vercel KV key format: "instance:{slug}:bookings"
//                  Booking data structure: { "YYYY-MM-DD": { "HH:00": { user: string, duration: number } } }

import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput } from '../_lib/security.js';

/**
 * GET /api/bookings - Get all bookings
 * POST /api/bookings - Create a new booking
 *
 * REQUEST (GET):
 *   No body required
 *
 * RESPONSE (GET):
 *   200 { "2026-02-13": { "09:00": { user: "Jack", duration: 2 }, "14:00": { user: "Teagan", duration: 1 } } }
 *   200 {} (empty object if no bookings exist)
 *
 * REQUEST (POST):
 *   Body: { "dateKey": "YYYY-MM-DD", "timeKey": "HH:00", "user": "string", "duration": 1-8 }
 *   Example: { "dateKey": "2026-02-13", "timeKey": "09:00", "user": "Jack", "duration": 2 }
 *
 * RESPONSE (POST):
 *   201 { "success": true, "booking": { "dateKey": "2026-02-13", "timeKey": "09:00", "user": "Jack", "duration": 2 } }
 *   400 { "error": "Missing or invalid fields: dateKey, timeKey, user, duration" }
 *   409 { "error": "Slot already booked" }
 *   409 { "error": "Slot 10:00 conflicts with booking duration" }
 */
async function handler(req, res) {
  // DATA_CONSTRAINT: Instance slug from environment determines storage key
  // WHY: Multiple instances can share same Vercel KV database with isolated data
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  const key = `instance:${slug}:bookings`;

  try {
    if (req.method === 'GET') {
      // BEHAVIOR: Fetch all bookings from Vercel KV storage
      // DATA_FLOW: Read from KV -> return entire dataset (no filtering)
      // WHY: Client handles date filtering locally; single fetch is simpler than per-date API calls
      let bookings = await kv.get(key);

      // EDGE_CASE: If key doesn't exist in KV (fresh instance), return empty object
      if (!bookings) {
        bookings = {};
      }

      return res.status(200).json(bookings);
    }

    if (req.method === 'POST') {
      // BEHAVIOR: Create a new booking after validating input and checking for conflicts
      // DATA_FLOW: Sanitize input -> validate required fields -> check conflicts -> save to KV -> respond

      // VALIDATION: Sanitize input to prevent XSS and injection attacks
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey, user, duration } = sanitized;

      // VALIDATION: All fields are required for creating a booking
      if (!dateKey || !timeKey || !user || !duration) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey, user, duration'
        });
      }

      // DATA_FLOW: Read current bookings from storage
      let bookings = await kv.get(key) || {};

      // Initialize date object if this is first booking on this date
      if (!bookings[dateKey]) {
        bookings[dateKey] = {};
      }

      // VALIDATION: Check if slot is already booked (direct conflict)
      // EDGE_CASE: If exact slot has a booking, reject immediately
      if (bookings[dateKey][timeKey]) {
        return res.status(409).json({
          error: 'Slot already booked'
        });
      }

      // VALIDATION: Check if duration would overlap with existing bookings
      // EDGE_CASE: If booking 09:00 for 3 hours, must check that 10:00 and 11:00 are free
      // WHY: Multi-hour bookings occupy consecutive slots; can't overlap
      const startHour = parseInt(timeKey.split(':')[0], 10);
      for (let i = 1; i < duration; i++) {
        const checkHour = startHour + i;
        const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;
        if (bookings[dateKey][checkKey]) {
          return res.status(409).json({
            error: `Slot ${checkKey} conflicts with booking duration`
          });
        }
      }

      // BEHAVIOR: Create the booking by adding to bookings object
      bookings[dateKey][timeKey] = { user, duration };

      // DATA_FLOW: Save updated bookings back to Vercel KV
      await kv.set(key, bookings);

      return res.status(201).json({
        success: true,
        booking: { dateKey, timeKey, user, duration }
      });
    }

    // EDGE_CASE: Method not allowed - only GET and POST supported on this endpoint
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// BEHAVIOR: Wrap handler with security middleware (CORS, rate limiting, header injection)
// WHY: All API endpoints need consistent security without duplicating code
export default withSecurity(handler);
