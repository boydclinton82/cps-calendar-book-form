import { kv } from '@vercel/kv';
import { withSecurity, sanitizeBookingInput } from '../_lib/security.js';

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

      // Get current bookings
      let bookings = await kv.get(key) || {};

      // Check if booking exists
      if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const currentBooking = bookings[dateKey][timeKey];

      // If duration is being changed, check for conflicts
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

      // Update the booking
      bookings[dateKey][timeKey] = {
        ...currentBooking,
        ...updates,
      };

      // Save to KV
      await kv.set(key, bookings);

      return res.status(200).json({
        success: true,
        booking: bookings[dateKey][timeKey]
      });
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

      // Get current bookings
      let bookings = await kv.get(key) || {};

      // Check if booking exists
      if (!bookings[dateKey] || !bookings[dateKey][timeKey]) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Delete the booking
      delete bookings[dateKey][timeKey];

      // Clean up empty date objects
      if (Object.keys(bookings[dateKey]).length === 0) {
        delete bookings[dateKey];
      }

      // Save to KV
      await kv.set(key, bookings);

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
