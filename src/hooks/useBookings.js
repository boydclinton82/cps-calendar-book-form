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

  const getSlotStatus = useCallback((dateKey, timeKey, hour) => {
    const dayBookings = bookings[dateKey] || {};

    // Helper to calculate effective position (accounting for past hours)
    const calculateEffectivePosition = (bookingStartHour, duration) => {
      const now = new Date();
      const slotDate = new Date(dateKey + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      slotDate.setHours(0, 0, 0, 0);

      let pastHoursCount = 0;

      if (slotDate.getTime() < today.getTime()) {
        // Past date - all hours are past
        pastHoursCount = duration;
      } else if (slotDate.getTime() === today.getTime()) {
        // Today - count hours that have passed
        const currentHour = now.getHours();
        for (let i = 0; i < duration; i++) {
          const checkHour = bookingStartHour + i;
          if (checkHour < currentHour) {
            pastHoursCount++;
          }
        }
      }
      // Future date - pastHoursCount stays 0

      const remainingDuration = duration - pastHoursCount;
      const firstNonPastPosition = pastHoursCount; // 0-indexed position of first non-past slot

      return { pastHoursCount, remainingDuration, firstNonPastPosition };
    };

    // Check if this slot has a direct booking
    if (dayBookings[timeKey]) {
      const booking = dayBookings[timeKey];
      const duration = booking.duration || 1;
      const isMultiHour = duration > 1;
      const bookingStartHour = hour; // This is the start slot

      const { pastHoursCount, remainingDuration, firstNonPastPosition } =
        calculateEffectivePosition(bookingStartHour, duration);

      // isEffectiveStart: this slot is the first non-past slot of the booking
      // For the start slot, it's effective start only if no hours are past yet
      const isEffectiveStart = pastHoursCount === 0;

      return {
        status: 'booked',
        booking,
        isStart: true,
        isEnd: duration === 1,
        isMiddle: false,
        duration,
        positionInBooking: 0,
        isMultiHour,
        // New properties for dynamic styling
        isEffectiveStart,
        remainingDuration,
        pastHoursCount,
        bookingStartHour,
      };
    }

    // Check if this slot is blocked by a multi-hour booking
    const blockInfo = isSlotBlocked(dayBookings, hour);
    if (blockInfo.blocked) {
      const duration = blockInfo.booking.duration || 1;
      const bookingStartHour = blockInfo.bookingHour;
      const positionInBooking = hour - bookingStartHour;
      const isEnd = positionInBooking === duration - 1;
      const isMiddle = !isEnd;

      const { pastHoursCount, remainingDuration, firstNonPastPosition } =
        calculateEffectivePosition(bookingStartHour, duration);

      // isEffectiveStart: this slot is the first non-past slot of the booking
      const isEffectiveStart = positionInBooking === firstNonPastPosition && remainingDuration > 0;

      return {
        status: 'blocked',
        booking: blockInfo.booking,
        bookingHour: blockInfo.bookingHour,
        isStart: false,
        isEnd,
        isMiddle,
        duration,
        positionInBooking,
        isMultiHour: true,
        // New properties for dynamic styling
        isEffectiveStart,
        remainingDuration,
        pastHoursCount,
        bookingStartHour,
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
