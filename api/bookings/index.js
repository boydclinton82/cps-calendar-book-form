import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput, isWithinBookableWindow } from '../_lib/security.js';
import { CREATE_BOOKING_LUA, CREATE_BOOKING_DAY_LUA } from '../_lib/booking-scripts.js';
import { dayKey, enumerateDates, readRange, readAll } from '../_lib/bookings-range.js';
import { logAudit, getClientIp } from '../_lib/audit.js';

// Per-instance flag. Unset => legacy single-blob behavior (zero behavior change).
const PERDAY = process.env.BOOKING_MODEL === 'perday';

/**
 * GET /api/bookings - Get bookings (range read in per-day mode, full blob otherwise)
 * POST /api/bookings - Create a new booking
 */
async function handler(req, res) {
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  const key = `instance:${slug}:bookings`;

  try {
    if (req.method === 'GET') {
      if (!PERDAY) {
        const bookings = await kv.get(key);
        return res.status(200).json(bookings || {});
      }
      const { from, to } = req.query;
      if (from && to) {
        const dates = enumerateDates(String(from), String(to));
        if (!dates) return res.status(400).json({ error: 'Invalid or too-large range' });
        return res.status(200).json(await readRange(slug, dates));
      }
      // no range: compatibility fallback (SCAN-assemble). The client always sends a range.
      return res.status(200).json(await readAll(slug));
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

      // Reject anything outside the bookable window server-side, so a booking can
      // never run past 22:00 / across midnight (the per-day model relies on this).
      if (!isWithinBookableWindow(timeKey, duration)) {
        return res.status(400).json({ error: 'Outside bookable hours (06:00-22:00)' });
      }

      // Atomic claim: check overlap -> write inside one EVAL, so concurrent POSTs
      // cannot lose each other's writes (fixes the lost-update race). In per-day
      // mode the claim is scoped to one day-hash; otherwise it rewrites the blob.
      const result = PERDAY
        ? await kv.eval(CREATE_BOOKING_DAY_LUA, [dayKey(slug, dateKey)], [timeKey, user, String(duration)])
        : await kv.eval(CREATE_BOOKING_LUA, [key], [dateKey, timeKey, user, String(duration)]);

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
