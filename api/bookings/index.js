import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput } from '../_lib/security.js';
import { CREATE_BOOKING_LUA } from '../_lib/booking-scripts.js';
import { logAudit, getClientIp } from '../_lib/audit.js';

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

      // Atomic claim: GET -> check overlap -> SET inside one EVAL, so concurrent
      // POSTs cannot lose each other's writes (fixes the lost-update race).
      const result = await kv.eval(
        CREATE_BOOKING_LUA,
        [key],
        [dateKey, timeKey, user, String(duration)]
      );

      if (result === 'BADTIME') {
        return res.status(400).json({ error: 'Invalid time or duration' });
      }
      if (result === 'CONFLICT') {
        await logAudit({ action: 'conflict', dateKey, timeKey, user, duration, ip: getClientIp(req), result: 'conflict' });
        return res.status(409).json({ error: 'Slot already booked' });
      }

      await logAudit({ action: 'create', dateKey, timeKey, user, duration, ip: getClientIp(req), result: 'ok' });
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
