import { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { TimeStrip } from './components/TimeStrip';
import { BookingPanel } from './components/BookingPanel';
import { BookingPopup } from './components/BookingPopup';
import { WeekView } from './components/WeekView';
import { useBookings } from './hooks/useBookings';
import { useKeyboard } from './hooks/useKeyboard';
import { useHourlyRefresh } from './hooks/useHourlyRefresh';
import { addDays, formatDate, END_HOUR, generateTimeSlots, isToday, isSlotPast } from './utils/time';
import './App.css';

const TIME_SLOTS = generateTimeSlots();

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isWeekView, setIsWeekView] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [focusedSlotIndex, setFocusedSlotIndex] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { bookings, createBooking, removeBooking, updateBooking, getSlotStatus, canBook, canChangeDuration } = useBookings();

  // Compute visible slots and available slot indices for keyboard navigation
  const dateKey = formatDate(currentDate);
  const { visibleSlots, availableIndices } = useMemo(() => {
    const visible = isToday(currentDate)
      ? TIME_SLOTS.filter(slot => !isSlotPast(currentDate, slot.hour))
      : TIME_SLOTS;

    const indices = visible
      .map((slot, index) => {
        const status = getSlotStatus(dateKey, slot.key, slot.hour);
        return status.status === 'available' ? index : null;
      })
      .filter(index => index !== null);

    return { visibleSlots: visible, availableIndices: indices };
  }, [currentDate, dateKey, getSlotStatus]);

  // Auto-refresh on the hour to update past slots
  useHourlyRefresh();

  // Navigation - 7 days for week view, 1 day for day view
  const handleNavigate = useCallback((direction) => {
    const daysToMove = isWeekView ? 7 : 1;
    setCurrentDate((prev) => addDays(prev, direction * daysToMove));
    setFocusedSlotIndex(null); // Reset focus on date change
  }, [isWeekView]);

  // Toggle week view
  const handleWeekToggle = useCallback(() => {
    setIsWeekView((prev) => !prev);
    setSelectedSlot(null);
    setSelectedUser(null);
  }, []);

  // Select day from week view
  const handleDaySelect = useCallback((date) => {
    setCurrentDate(date);
    setIsWeekView(false);
  }, []);

  // Slot selection
  const handleSlotSelect = useCallback((slot) => {
    setSelectedSlot(slot);
    setSelectedUser(null);
  }, []);

  // Cancel booking panel
  const handleCancelPanel = useCallback(() => {
    setSelectedSlot(null);
    setSelectedUser(null);
  }, []);

  // User selection
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  // Duration selection and booking creation
  const handleDurationSelect = useCallback((duration) => {
    if (!selectedSlot || !selectedUser) return;

    // Check if booking is possible
    if (!canBook(selectedSlot.dateKey, selectedSlot.key, selectedSlot.hour, duration)) {
      return;
    }

    // Create the booking
    createBooking(selectedSlot.dateKey, selectedSlot.key, selectedUser, duration);

    // Reset selection
    setSelectedSlot(null);
    setSelectedUser(null);
  }, [selectedSlot, selectedUser, canBook, createBooking]);

  // Cancel a booking
  const handleSlotCancel = useCallback((dateKey, timeKey) => {
    removeBooking(dateKey, timeKey);
  }, [removeBooking]);

  // Open booking popup for editing
  const handleBookingClick = useCallback((dateKey, timeKey, booking) => {
    const hour = parseInt(timeKey.split(':')[0], 10);
    setSelectedBooking({
      dateKey,
      timeKey,
      hour,
      user: booking.user,
      duration: booking.duration,
    });
  }, []);

  // Close booking popup
  const handlePopupClose = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  // Change user in booking popup
  const handlePopupUserChange = useCallback((user) => {
    if (!selectedBooking) return;
    updateBooking(selectedBooking.dateKey, selectedBooking.timeKey, { user });
    setSelectedBooking((prev) => ({ ...prev, user }));
  }, [selectedBooking, updateBooking]);

  // Change duration in booking popup
  const handlePopupDurationChange = useCallback((duration) => {
    if (!selectedBooking) return;
    updateBooking(selectedBooking.dateKey, selectedBooking.timeKey, { duration });
    setSelectedBooking((prev) => ({ ...prev, duration }));
  }, [selectedBooking, updateBooking]);

  // Delete booking from popup
  const handlePopupDelete = useCallback(() => {
    if (!selectedBooking) return;
    removeBooking(selectedBooking.dateKey, selectedBooking.timeKey);
    setSelectedBooking(null);
  }, [selectedBooking, removeBooking]);

  // Check if duration can be changed in popup
  const canPopupChangeDuration = useCallback((newDuration) => {
    if (!selectedBooking) return false;
    // Check if duration would exceed time range
    if (selectedBooking.hour + newDuration > END_HOUR) {
      return false;
    }
    return canChangeDuration(
      selectedBooking.dateKey,
      selectedBooking.timeKey,
      selectedBooking.hour,
      selectedBooking.duration,
      newDuration
    );
  }, [selectedBooking, canChangeDuration]);

  // Check if a duration can be booked for current selection
  const canBookDuration = useCallback((duration) => {
    if (!selectedSlot) return false;

    // Check if booking would exceed time range
    if (selectedSlot.hour + duration > END_HOUR) {
      return false;
    }

    return canBook(selectedSlot.dateKey, selectedSlot.key, selectedSlot.hour, duration);
  }, [selectedSlot, canBook]);

  // Focus navigation: move to previous available slot (wrap at boundary)
  const handleSlotFocusUp = useCallback(() => {
    if (availableIndices.length === 0) return;

    setFocusedSlotIndex((prev) => {
      if (prev === null) {
        // Start at last available slot
        return availableIndices[availableIndices.length - 1];
      }
      // Find current position in available indices
      const currentPos = availableIndices.indexOf(prev);
      if (currentPos === -1 || currentPos === 0) {
        // Wrap to end
        return availableIndices[availableIndices.length - 1];
      }
      return availableIndices[currentPos - 1];
    });
  }, [availableIndices]);

  // Focus navigation: move to next available slot (wrap at boundary)
  const handleSlotFocusDown = useCallback(() => {
    if (availableIndices.length === 0) return;

    setFocusedSlotIndex((prev) => {
      if (prev === null) {
        // Start at first available slot
        return availableIndices[0];
      }
      // Find current position in available indices
      const currentPos = availableIndices.indexOf(prev);
      if (currentPos === -1 || currentPos === availableIndices.length - 1) {
        // Wrap to beginning
        return availableIndices[0];
      }
      return availableIndices[currentPos + 1];
    });
  }, [availableIndices]);

  // Select the currently focused slot
  const handleFocusedSlotSelect = useCallback(() => {
    if (focusedSlotIndex === null || focusedSlotIndex >= visibleSlots.length) return;

    const slot = visibleSlots[focusedSlotIndex];
    handleSlotSelect({ ...slot, dateKey });
    setFocusedSlotIndex(null);
  }, [focusedSlotIndex, visibleSlots, dateKey, handleSlotSelect]);

  // Keyboard shortcuts
  useKeyboard({
    // Popup mode (edit existing booking)
    onPopupUserSelect: selectedBooking ? handlePopupUserChange : undefined,
    onPopupDurationSelect: selectedBooking ? handlePopupDurationChange : undefined,
    onPopupDelete: selectedBooking ? handlePopupDelete : undefined,
    onPopupClose: selectedBooking ? handlePopupClose : undefined,
    canPopupChangeDuration: selectedBooking ? canPopupChangeDuration : undefined,
    // Panel mode (create new booking)
    onUserSelect: !selectedBooking && selectedSlot ? handleUserSelect : undefined,
    onDurationSelect: !selectedBooking && selectedSlot && selectedUser ? handleDurationSelect : undefined,
    onCancel: !selectedBooking && selectedSlot ? handleCancelPanel : undefined,
    // General navigation
    onWeekToggle: !selectedBooking ? handleWeekToggle : undefined,
    onNavigate: !selectedBooking ? handleNavigate : undefined,
    onSlotFocusUp: !isWeekView && !selectedSlot && !selectedBooking ? handleSlotFocusUp : undefined,
    onSlotFocusDown: !isWeekView && !selectedSlot && !selectedBooking ? handleSlotFocusDown : undefined,
    onSlotSelect: !isWeekView && !selectedSlot && !selectedBooking && focusedSlotIndex !== null ? handleFocusedSlotSelect : undefined,
    isWeekView,
    enabled: true,
  });

  // Determine current user for highlighting own bookings
  // For prototype: always assume Jack is logged in
  const currentUser = 'Jack';

  return (
    <div className="app">
      <Header
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onWeekToggle={handleWeekToggle}
        isWeekView={isWeekView}
      />

      <main className="main-content">
        <div className={`view-container ${isWeekView ? 'week' : 'day'}`}>
          {isWeekView ? (
            <WeekView
              currentDate={currentDate}
              bookings={bookings}
              getSlotStatus={getSlotStatus}
              onDaySelect={handleDaySelect}
              onSlotSelect={handleSlotSelect}
              onBookingClick={handleBookingClick}
              currentUser={currentUser}
            />
          ) : (
            <TimeStrip
              date={currentDate}
              bookings={bookings}
              getSlotStatus={getSlotStatus}
              selectedSlot={selectedSlot}
              focusedSlotIndex={focusedSlotIndex}
              onSlotSelect={handleSlotSelect}
              onSlotCancel={handleSlotCancel}
              onBookingClick={handleBookingClick}
              currentUser={currentUser}
            />
          )}
        </div>

        <BookingPanel
          isOpen={!!selectedSlot}
          selectedSlot={selectedSlot}
          selectedUser={selectedUser}
          canBookDuration={canBookDuration}
          onUserSelect={handleUserSelect}
          onDurationSelect={handleDurationSelect}
          onCancel={handleCancelPanel}
        />

        <BookingPopup
          isOpen={!!selectedBooking}
          booking={selectedBooking}
          onUserChange={handlePopupUserChange}
          onDurationChange={handlePopupDurationChange}
          onDelete={handlePopupDelete}
          onClose={handlePopupClose}
          canChangeDuration={canPopupChangeDuration}
        />
      </main>

      {/* Overlay for mobile when panel is open */}
      {selectedSlot && (
        <div className="panel-overlay" onClick={handleCancelPanel} />
      )}
    </div>
  );
}

export default App;
