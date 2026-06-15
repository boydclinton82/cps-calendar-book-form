import { useState, useCallback, useEffect, useRef } from 'react';
import { isSlotBlocked } from '../utils/time';
import {
  fetchBookings as apiFetchBookings,
  createBooking as apiCreateBooking,
  updateBooking as apiUpdateBooking,
  deleteBooking as apiDeleteBooking,
  isApiEnabled,
} from '../services/api';
import { usePollingSync } from './usePollingSync';

// Polling interval in milliseconds
const POLLING_INTERVAL = 7000;

const pkey = (date, time) => `${date}|${time}`;

// Map a thrown API error to a user-facing notice (no em dashes).
function noticeForError(err) {
  const msg = (err && err.message) || '';
  if (/booked|already/i.test(msg)) {
    return 'That time was just booked by someone else. Please pick another slot.';
  }
  return 'Could not save that booking. Please try again.';
}

export function useBookings() {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // `${date}|${time}` -> optimistic booking, or null for an in-flight delete.
  // A ref so writing it never re-renders and keeps handlePollingUpdate stable.
  const pendingRef = useRef(new Map());
  const [notice, setNotice] = useState(null);

  // Initial fetch on mount
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiFetchBookings();
        setBookings(data || {});
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Handle updates from polling. MERGE the server snapshot with any in-flight
  // optimistic ops so a just-made booking is not wiped off the booker's screen
  // before the server confirms it.
  const handlePollingUpdate = useCallback((data) => {
    if (!data || typeof data !== 'object') return;
    setBookings(() => {
      const merged = {};
      for (const date of Object.keys(data)) merged[date] = { ...data[date] };
      for (const [pk, optimistic] of pendingRef.current.entries()) {
        const [date, time] = pk.split('|');
        if (optimistic === null) {
          if (merged[date]) {
            delete merged[date][time];
            if (Object.keys(merged[date]).length === 0) delete merged[date];
          }
        } else {
          if (!merged[date]) merged[date] = {};
          merged[date][time] = optimistic;
        }
      }
      return merged;
    });
  }, []);

  // Setup polling for real-time sync (only when API is enabled)
  const { triggerSync } = usePollingSync(
    apiFetchBookings,
    handlePollingUpdate,
    {
      interval: POLLING_INTERVAL,
      enabled: isApiEnabled(),
    }
  );

  const getBookingsForDate = useCallback((date) => {
    return bookings[date] || {};
  }, [bookings]);

  const createBooking = useCallback(async (date, time, user, duration) => {
    const pk = pkey(date, time);
    const optimistic = { user, duration };
    // Register pending BEFORE the optimistic write so a poll mid-flight re-applies it.
    pendingRef.current.set(pk, optimistic);

    // Optimistic update
    setBookings((prev) => {
      const newBookings = { ...prev };
      newBookings[date] = { ...(newBookings[date] || {}), [time]: optimistic };
      return newBookings;
    });

    try {
      const res = await apiCreateBooking({ dateKey: date, timeKey: time, user, duration });
      // Reconcile from the server response (write only { user, duration }).
      const b = res?.booking;
      if (b) {
        const reconciled = { user: b.user, duration: b.duration };
        pendingRef.current.set(pk, reconciled);
        setBookings((prev) => {
          const newBookings = { ...prev };
          newBookings[date] = { ...(newBookings[date] || {}), [time]: reconciled };
          return newBookings;
        });
      }
    } catch (err) {
      console.error('Failed to create booking:', err);
      setError(err.message);
      // Roll back THAT slot only.
      setBookings((prev) => {
        const newBookings = { ...prev };
        if (newBookings[date]) {
          newBookings[date] = { ...newBookings[date] };
          delete newBookings[date][time];
          if (Object.keys(newBookings[date]).length === 0) delete newBookings[date];
        }
        return newBookings;
      });
      setNotice(noticeForError(err));
      triggerSync();
    } finally {
      pendingRef.current.delete(pk);
    }
  }, [triggerSync]);

  const removeBooking = useCallback(async (date, time) => {
    const pk = pkey(date, time);
    const previousBooking = bookings[date]?.[time];
    // Register pending delete (null) BEFORE the optimistic write.
    pendingRef.current.set(pk, null);

    // Optimistic update
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (newBookings[date] && newBookings[date][time]) {
        newBookings[date] = { ...newBookings[date] };
        delete newBookings[date][time];
        if (Object.keys(newBookings[date]).length === 0) delete newBookings[date];
      }
      return newBookings;
    });

    try {
      await apiDeleteBooking({ dateKey: date, timeKey: time });
    } catch (err) {
      console.error('Failed to delete booking:', err);
      setError(err.message);
      // Restore the specific booking we removed.
      if (previousBooking) {
        setBookings((prev) => {
          const newBookings = { ...prev };
          newBookings[date] = { ...(newBookings[date] || {}), [time]: previousBooking };
          return newBookings;
        });
      }
      setNotice(noticeForError(err));
      triggerSync();
    } finally {
      pendingRef.current.delete(pk);
    }
  }, [bookings, triggerSync]);

  const updateBooking = useCallback(async (date, time, updates) => {
    const pk = pkey(date, time);
    // Store previous value for rollback
    const previousBooking = bookings[date]?.[time];
    const optimistic = { ...(previousBooking || {}), ...updates };
    pendingRef.current.set(pk, optimistic);

    // Optimistic update
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (newBookings[date] && newBookings[date][time]) {
        newBookings[date] = {
          ...newBookings[date],
          [time]: { ...newBookings[date][time], ...updates },
        };
      }
      return newBookings;
    });

    try {
      const res = await apiUpdateBooking({ dateKey: date, timeKey: time, updates });
      // PUT returns the full stored { user, duration } - write it directly.
      const b = res?.booking;
      if (b) {
        pendingRef.current.set(pk, b);
        setBookings((prev) => {
          const newBookings = { ...prev };
          if (newBookings[date]) {
            newBookings[date] = { ...newBookings[date], [time]: b };
          }
          return newBookings;
        });
      }
    } catch (err) {
      console.error('Failed to update booking:', err);
      setError(err.message);
      // Restore previous value.
      if (previousBooking) {
        setBookings((prev) => {
          const newBookings = { ...prev };
          newBookings[date] = { ...(newBookings[date] || {}), [time]: previousBooking };
          return newBookings;
        });
      }
      setNotice(noticeForError(err));
      triggerSync();
    } finally {
      pendingRef.current.delete(pk);
    }
  }, [bookings, triggerSync]);

  // Simplified getSlotStatus - only returns status and booking info
  // Position calculation is now handled by overlay components
  const getSlotStatus = useCallback((dateKey, timeKey, hour) => {
    const dayBookings = bookings[dateKey] || {};

    // Check if this slot has a direct booking
    if (dayBookings[timeKey]) {
      const booking = dayBookings[timeKey];
      return {
        status: 'booked',
        booking,
      };
    }

    // Check if this slot is blocked by a multi-hour booking
    const blockInfo = isSlotBlocked(dayBookings, hour);
    if (blockInfo.blocked) {
      return {
        status: 'blocked',
        booking: blockInfo.booking,
      };
    }

    return { status: 'available' };
  }, [bookings]);

  const canBook = useCallback((date, timeKey, hour, duration) => {
    const dayBookings = bookings[date] || {};

    // Check all slots that would be occupied
    for (let i = 0; i < duration; i++) {
      const checkHour = hour + i;
      const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;

      // Check if slot is already booked
      if (dayBookings[checkKey]) {
        return false;
      }

      // Check if slot is blocked by another booking
      const blockInfo = isSlotBlocked(dayBookings, checkHour);
      if (blockInfo.blocked) {
        return false;
      }
    }

    return true;
  }, [bookings]);

  // Check if duration can be changed for an existing booking
  // Excludes the current booking's slots from conflict check
  const canChangeDuration = useCallback((date, timeKey, hour, currentDuration, newDuration) => {
    const dayBookings = bookings[date] || {};

    // Check all slots that would be occupied by new duration
    for (let i = 0; i < newDuration; i++) {
      const checkHour = hour + i;
      const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;

      // Skip slots that are part of current booking
      if (i < currentDuration) {
        continue;
      }

      // Check if slot is already booked by another booking
      if (dayBookings[checkKey]) {
        return false;
      }

      // Check if slot is blocked by another booking (not by current booking)
      const blockInfo = isSlotBlocked(dayBookings, checkHour);
      if (blockInfo.blocked && blockInfo.startKey !== timeKey) {
        return false;
      }
    }

    return true;
  }, [bookings]);

  return {
    bookings,
    loading,
    error,
    notice,
    dismissNotice: useCallback(() => setNotice(null), []),
    getBookingsForDate,
    createBooking,
    removeBooking,
    updateBooking,
    getSlotStatus,
    canBook,
    canChangeDuration,
    // Expose sync function for manual refresh
    refreshBookings: triggerSync,
  };
}
