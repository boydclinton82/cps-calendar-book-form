import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput } from '../_lib/security.js';

/**
 * GET /api/bookings - Get all bookings
 * POST /api/bookings - Create a new booking
 */
async function handler(req, res) {
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  const key = `instance:${slug}:bookings`;

  try {
    if (req.method === 'GET') {
      // Get all bookings
      let bookings = await kv.get(key);

      // Return empty object if no bookings exist
      if (!bookings) {
        bookings = {};
      }

      return res.status(200).json(bookings);
    }

    if (req.method === 'POST') {
      // Sanitize input
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey, user, duration } = sanitized;

      // Validate required fields
      if (!dateKey || !timeKey || !user || !duration) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey, user, duration'
        });
      }

      // Get current bookings
      let bookings = await kv.get(key) || {};

      // Initialize date if not exists
      if (!bookings[dateKey]) {
        bookings[dateKey] = {};
      }

      // Check if slot is already booked
      if (bookings[dateKey][timeKey]) {
        return res.status(409).json({
          error: 'Slot already booked'
        });
      }

      // Check if duration would overlap with existing bookings
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

      // Create the booking
      bookings[dateKey][timeKey] = { user, duration };

      // Save to KV
      await kv.set(key, bookings);

      return res.status(201).json({
        success: true,
        booking: { dateKey, timeKey, user, duration }
      });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling bookings:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSecurity(handler);
