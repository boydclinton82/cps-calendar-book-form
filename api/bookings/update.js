import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput, isWithinBookableWindow } from '../_lib/security.js';
import {
  UPDATE_BOOKING_LUA,
  DELETE_BOOKING_LUA,
  UPDATE_BOOKING_DAY_LUA,
  DELETE_BOOKING_DAY_LUA,
} from '../_lib/booking-scripts.js';
import { dayKey } from '../_lib/bookings-range.js';
import { logAudit, getClientIp } from '../_lib/audit.js';

// Per-instance flag. Unset => legacy single-blob behavior (zero behavior change).
const PERDAY = process.env.BOOKING_MODEL === 'perday';

/**
 * PUT /api/bookings/update - Update an existing booking
 * DELETE /api/bookings/update - Delete a booking
 */
async function handler(req, res) {
  const slug = process.env.INSTANCE_SLUG || 'cps-software';
  const key = `instance:${slug}:bookings`;

  try {
    if (req.method === 'PUT') {
      // Sanitize input
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey, updates } = sanitized;

      // Validate required fields
      if (!dateKey || !timeKey || !updates) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey, updates'
        });
      }

      // If the duration is changing, the resulting booking must stay inside the
      // bookable window server-side (closes the cross-midnight hole for extends).
      if (updates.duration != null && !isWithinBookableWindow(timeKey, updates.duration)) {
        return res.status(400).json({ error: 'Outside bookable hours (06:00-22:00)' });
      }

      if (PERDAY) {
        const result = await kv.eval(
          UPDATE_BOOKING_DAY_LUA,
          [dayKey(slug, dateKey)],
          [
            timeKey,
            updates.user != null ? String(updates.user) : '',
            updates.duration != null ? String(updates.duration) : '',
          ]
        );
        if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });
        if (result === 'CONFLICT') {
          await logAudit({ action: 'conflict', dateKey, timeKey, ip: getClientIp(req), result: 'conflict' });
          return res.status(409).json({ error: 'Cannot extend: slot is already booked' });
        }
        // result is the stored record { user, duration } (auto-parsed) - no extra kv.get needed
        await logAudit({ action: 'update', dateKey, timeKey, user: result?.user, duration: result?.duration, ip: getClientIp(req), result: 'ok' });
        return res.status(200).json({ success: true, booking: result });
      }

      // Atomic update inside one EVAL (read-modify-write cannot race).
      const result = await kv.eval(
        UPDATE_BOOKING_LUA,
        [key],
        [
          dateKey,
          timeKey,
          updates.user != null ? String(updates.user) : '',
          updates.duration != null ? String(updates.duration) : '',
        ]
      );

      if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });
      if (result === 'CONFLICT') {
        await logAudit({ action: 'conflict', dateKey, timeKey, ip: getClientIp(req), result: 'conflict' });
        return res.status(409).json({ error: 'Cannot extend: slot is already booked' });
      }

      const fresh = await kv.get(key);
      const booking = fresh?.[dateKey]?.[timeKey] || null;
      await logAudit({ action: 'update', dateKey, timeKey, user: booking?.user, duration: booking?.duration, ip: getClientIp(req), result: 'ok' });
      return res.status(200).json({ success: true, booking });
    }

    if (req.method === 'DELETE') {
      // Sanitize input
      const sanitized = sanitizeBookingInput(req.body);
      const { dateKey, timeKey } = sanitized;

      // Validate required fields
      if (!dateKey || !timeKey) {
        return res.status(400).json({
          error: 'Missing or invalid fields: dateKey, timeKey'
        });
      }

      if (PERDAY) {
        const result = await kv.eval(DELETE_BOOKING_DAY_LUA, [dayKey(slug, dateKey)], [timeKey]);
        if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });
        await logAudit({ action: 'delete', dateKey, timeKey, ip: getClientIp(req), result: 'ok' });
        return res.status(200).json({ success: true });
      }

      // Atomic delete inside one EVAL.
      const result = await kv.eval(DELETE_BOOKING_LUA, [key], [dateKey, timeKey]);
      if (result === 'NOTFOUND') return res.status(404).json({ error: 'Booking not found' });

      await logAudit({ action: 'delete', dateKey, timeKey, ip: getClientIp(req), result: 'ok' });
      return res.status(200).json({ success: true });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling booking update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export default withSecurity(handler);
