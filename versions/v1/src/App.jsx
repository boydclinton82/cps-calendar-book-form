import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { TimeStrip } from './components/TimeStrip';
import { BookingPanel } from './components/BookingPanel';
import { WeekView } from './components/WeekView';
import { useBookings } from './hooks/useBookings';
import { useKeyboard } from './hooks/useKeyboard';
import { addDays, formatDate, END_HOUR } from './utils/time';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isWeekView, setIsWeekView] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { bookings, createBooking, removeBooking, getSlotStatus, canBook } = useBookings();

  // Navigation
  const handleNavigate = useCallback((direction) => {
    setCurrentDate((prev) => addDays(prev, direction));
  }, []);

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

  // Check if a duration can be booked for current selection
  const canBookDuration = useCallback((duration) => {
    if (!selectedSlot) return false;

    // Check if booking would exceed time range
    if (selectedSlot.hour + duration > END_HOUR) {
      return false;
    }

    return canBook(selectedSlot.dateKey, selectedSlot.key, selectedSlot.hour, duration);
  }, [selectedSlot, canBook]);

  // Keyboard shortcuts
  useKeyboard({
    onUserSelect: selectedSlot ? handleUserSelect : undefined,
    onDurationSelect: selectedSlot && selectedUser ? handleDurationSelect : undefined,
    onCancel: selectedSlot ? handleCancelPanel : undefined,
    onWeekToggle: handleWeekToggle,
    onNavigate: !selectedSlot ? handleNavigate : undefined,
    enabled: true,
  });

  // Determine current user for highlighting own bookings
  // In a real app this would come from auth; for now we just use selected user
  const currentUser = selectedUser;

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
            />
          ) : (
            <TimeStrip
              date={currentDate}
              bookings={bookings}
              getSlotStatus={getSlotStatus}
              selectedSlot={selectedSlot}
              onSlotSelect={handleSlotSelect}
              onSlotCancel={handleSlotCancel}
              currentUser={currentUser}
            />
          )}
        </div>

        <BookingPanel
          isOpen={!!selectedSlot && !isWeekView}
          selectedSlot={selectedSlot}
          selectedUser={selectedUser}
          canBookDuration={canBookDuration}
          onUserSelect={handleUserSelect}
          onDurationSelect={handleDurationSelect}
          onCancel={handleCancelPanel}
        />
      </main>

      {/* Overlay for mobile when panel is open */}
      {selectedSlot && !isWeekView && (
        <div className="panel-overlay" onClick={handleCancelPanel} />
      )}
    </div>
  );
}

export default App;
