// BEHAVIOR: Core booking management module - tracks all bookings across all dates,
// provides operations to create/update/delete bookings, and validates booking constraints
// DATA_FLOW: On initialization -> fetch from server -> cache locally
//            Every 7 seconds -> poll server for updates -> merge into cache
//            On mutation (create/update/delete) -> update cache immediately -> send to server -> on failure, re-sync from server
// DATA_CONSTRAINT: Booking data structure: { "YYYY-MM-DD": { "HH:00": { user: string, duration: number } } }
//                  Example: { "2026-02-13": { "09:00": { user: "Jack", duration: 2 } } }

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

// CONSTANT: POLLING_INTERVAL = 7000ms (7 seconds) - how often to check server for booking changes
const POLLING_INTERVAL = 7000;

export function useBookings() {
  const [bookings, setBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // BEHAVIOR: On initialization, fetch all bookings from server and cache locally
  // DATA_FLOW: Server -> local cache -> mark as loaded
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

  // BEHAVIOR: When polling detects changes, replace entire booking cache with server data
  // WHY: Simple merge strategy - server is source of truth
  const handlePollingUpdate = useCallback((data) => {
    if (data && typeof data === 'object') {
      setBookings(data);
    }
  }, []);

  // BEHAVIOR: Continuously poll server every 7 seconds to detect changes from other users
  // WHY: Multiple users can book simultaneously; polling keeps everyone's view synchronized
  const { triggerSync } = usePollingSync(
    apiFetchBookings,
    handlePollingUpdate,
    {
      interval: POLLING_INTERVAL,
      enabled: isApiEnabled(),
    }
  );

  // BEHAVIOR: Retrieve all bookings for a specific date
  // DATA_CONSTRAINT: Returns object keyed by timeKey ("HH:00") or empty object if no bookings
  const getBookingsForDate = useCallback((date) => {
    return bookings[date] || {};
  }, [bookings]);

  // BEHAVIOR: Create a new booking - immediately update local cache, then persist to server
  // DATA_FLOW: Update local cache optimistically -> send to server -> on error, re-sync from server to rollback
  // VALIDATION: Server will reject if slot already booked or duration conflicts with existing bookings
  // WHY: Optimistic update provides instant UI feedback; rollback on failure maintains consistency
  const createBooking = useCallback(async (date, time, user, duration) => {
    // Optimistic update - assume success and update UI immediately
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
      // EDGE_CASE: If create fails (conflict, network error), rollback by re-fetching truth from server
      console.error('Failed to create booking:', err);
      setError(err.message);
      triggerSync();
    }
  }, [triggerSync]);

  // BEHAVIOR: Delete a booking - immediately remove from local cache, then persist to server
  // DATA_FLOW: Remove from local cache optimistically -> send delete to server -> on error, re-sync from server
  const removeBooking = useCallback(async (date, time) => {
    // Optimistic update - remove immediately
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (newBookings[date] && newBookings[date][time]) {
        delete newBookings[date][time];
        // Clean up empty date object
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
      // EDGE_CASE: If delete fails, rollback by re-fetching truth from server
      console.error('Failed to delete booking:', err);
      setError(err.message);
      triggerSync();
    }
  }, [triggerSync]);

  // BEHAVIOR: Update fields of an existing booking (user or duration)
  // DATA_FLOW: Merge updates into local cache optimistically -> send to server -> on error, re-sync
  // VALIDATION: Server validates duration doesn't conflict with other bookings
  const updateBooking = useCallback(async (date, time, updates) => {
    // Store previous value for rollback
    const previousBooking = bookings[date]?.[time];

    // Optimistic update - apply changes immediately
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
      // EDGE_CASE: If update fails (conflict, validation error), rollback by re-syncing
      console.error('Failed to update booking:', err);
      setError(err.message);
      triggerSync();
    }
  }, [bookings, triggerSync]);

  // BEHAVIOR: Determine the status of a single time slot (available, booked, or blocked)
  // VALIDATION: 'booked' = slot has a direct booking starting at this time
  //            'blocked' = slot is in the middle of a multi-hour booking that started earlier
  //            'available' = slot is free
  // DATA_CONSTRAINT: Returns { status: string, booking?: object }
  const getSlotStatus = useCallback((dateKey, timeKey, hour) => {
    const dayBookings = bookings[dateKey] || {};

    // Check if this slot has a direct booking (booking starts at this hour)
    if (dayBookings[timeKey]) {
      const booking = dayBookings[timeKey];
      return {
        status: 'booked',
        booking,
      };
    }

    // Check if this slot is blocked by a multi-hour booking that started earlier
    // EDGE_CASE: If someone books 09:00 for 3 hours, slots 10:00 and 11:00 are "blocked"
    const blockInfo = isSlotBlocked(dayBookings, hour);
    if (blockInfo.blocked) {
      return {
        status: 'blocked',
        booking: blockInfo.booking,
      };
    }

    return { status: 'available' };
  }, [bookings]);

  // BEHAVIOR: Check if a booking can be created at a given slot for a given duration
  // VALIDATION: Returns false if any slot in the range is already booked or blocked
  // EDGE_CASE: For a 3-hour booking starting at 09:00, checks 09:00, 10:00, 11:00 for conflicts
  const canBook = useCallback((date, timeKey, hour, duration) => {
    const dayBookings = bookings[date] || {};

    // Check all slots that would be occupied by this booking
    for (let i = 0; i < duration; i++) {
      const checkHour = hour + i;
      const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;

      // Check if slot is already booked (has a booking starting at this hour)
      if (dayBookings[checkKey]) {
        return false;
      }

      // Check if slot is blocked by another booking (is in the middle of a multi-hour booking)
      const blockInfo = isSlotBlocked(dayBookings, checkHour);
      if (blockInfo.blocked) {
        return false;
      }
    }

    return true;
  }, [bookings]);

  // BEHAVIOR: Check if an existing booking's duration can be changed to a new duration
  // VALIDATION: Only checks slots beyond the current duration (already-occupied slots are allowed)
  // EDGE_CASE: If booking is 09:00 for 2 hours (occupies 09:00, 10:00), changing to 3 hours only checks 11:00 for conflicts
  // WHY: User is extending/shrinking their existing booking; only new slots need validation
  const canChangeDuration = useCallback((date, timeKey, hour, currentDuration, newDuration) => {
    const dayBookings = bookings[date] || {};

    // Check all slots that would be occupied by new duration
    for (let i = 0; i < newDuration; i++) {
      const checkHour = hour + i;
      const checkKey = `${checkHour.toString().padStart(2, '0')}:00`;

      // Skip slots that are part of current booking (these are already occupied by this booking)
      if (i < currentDuration) {
        continue;
      }

      // Check if slot is already booked by another booking
      if (dayBookings[checkKey]) {
        return false;
      }

      // Check if slot is blocked by another booking (not by current booking)
      // EDGE_CASE: Must exclude blocks caused by the current booking itself
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
