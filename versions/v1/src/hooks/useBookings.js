import { useState, useCallback, useEffect } from 'react';
import { getBookings, saveBookings, removeBooking as removeFromStorage } from '../utils/storage';
import { isSlotBlocked } from '../utils/time';

export function useBookings() {
  const [bookings, setBookings] = useState(() => getBookings());

  // Sync with localStorage on mount
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'cps-bookings') {
        setBookings(getBookings());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const getBookingsForDate = useCallback((date) => {
    return bookings[date] || {};
  }, [bookings]);

  const createBooking = useCallback((date, time, user, duration) => {
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (!newBookings[date]) {
        newBookings[date] = {};
      }
      newBookings[date] = {
        ...newBookings[date],
        [time]: { user, duration },
      };
      saveBookings(newBookings);
      return newBookings;
    });
  }, []);

  const removeBooking = useCallback((date, time) => {
    setBookings((prev) => {
      const newBookings = { ...prev };
      if (newBookings[date] && newBookings[date][time]) {
        delete newBookings[date][time];
        if (Object.keys(newBookings[date]).length === 0) {
          delete newBookings[date];
        }
        saveBookings(newBookings);
      }
      return newBookings;
    });
  }, []);

  const getSlotStatus = useCallback((date, timeKey, hour) => {
    const dayBookings = bookings[date] || {};

    // Check if this slot has a direct booking
    if (dayBookings[timeKey]) {
      return {
        status: 'booked',
        booking: dayBookings[timeKey],
        isStart: true,
      };
    }

    // Check if this slot is blocked by a multi-hour booking
    const blockInfo = isSlotBlocked(dayBookings, hour);
    if (blockInfo.blocked) {
      return {
        status: 'blocked',
        booking: blockInfo.booking,
        bookingHour: blockInfo.bookingHour,
        isStart: false,
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

  return {
    bookings,
    getBookingsForDate,
    createBooking,
    removeBooking,
    getSlotStatus,
    canBook,
  };
}
