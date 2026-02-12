import { useState, useCallback, useEffect } from 'react';
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

export function useBookings() {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Handle updates from polling
  const handlePollingUpdate = useCallback((data) => {
    if (data && typeof data === 'object') {
      setBookings(data);
    }
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
    // Optimistic update
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (!newBookings[date]) {
        newBookings[date] = {};
      }
      newBookings[date] = {
        ...newBookings[date],
        [time]: { user, duration },
      };
      return newBookings;
    });

    try {
      await apiCreateBooking({
        dateKey: date,
        timeKey: time,
        user,
        duration,
      });
    } catch (err) {
      // Rollback on error
      console.error('Failed to create booking:', err);
      setError(err.message);
      // Trigger sync to get correct state
      triggerSync();
    }
  }, [triggerSync]);

  const removeBooking = useCallback(async (date, time) => {
    // Optimistic update
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (newBookings[date] && newBookings[date][time]) {
        delete newBookings[date][time];
        if (Object.keys(newBookings[date]).length === 0) {
          delete newBookings[date];
        }
      }
      return newBookings;
    });

    try {
      await apiDeleteBooking({
        dateKey: date,
        timeKey: time,
      });
    } catch (err) {
      // Rollback on error
      console.error('Failed to delete booking:', err);
      setError(err.message);
      // Trigger sync to get correct state
      triggerSync();
    }
  }, [triggerSync]);

  const updateBooking = useCallback(async (date, time, updates) => {
    // Store previous value for rollback
    const previousBooking = bookings[date]?.[time];

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
      await apiUpdateBooking({
        dateKey: date,
        timeKey: time,
        updates,
      });
    } catch (err) {
      // Rollback on error
      console.error('Failed to update booking:', err);
      setError(err.message);
      // Trigger sync to get correct state
      triggerSync();
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
