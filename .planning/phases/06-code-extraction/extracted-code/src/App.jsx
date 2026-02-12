// BEHAVIOR: Main application orchestrator - manages global state, coordinates user interactions,
// and delegates to specialized modules (bookings, keyboard, config)
// DATA_FLOW: Config loaded -> bookings loaded -> user interacts -> state updates -> UI refreshes
// VALIDATION: Multiple interaction modes with strict state transitions:
//            - NAVIGATION MODE: No selection, can browse dates, select slots
//            - PANEL MODE: Slot selected, user picks person and duration
//            - POPUP MODE: Booking selected for editing
// EDGE_CASE: Only one mode active at a time; opening panel/popup disables other interactions

import { useState, useCallback, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { TimeStrip } from './components/TimeStrip';
import { BookingPanel } from './components/BookingPanel';
import { BookingPopup } from './components/BookingPopup';
import { WeekView } from './components/WeekView';
import { useBookings } from './hooks/useBookings';
import { getTimezonePreference, saveTimezonePreference } from './utils/storage';
import { useKeyboard } from './hooks/useKeyboard';
import { useHourlyRefresh } from './hooks/useHourlyRefresh';
import { useConfig } from './hooks/useConfig';
import { addDays, formatDate, formatHour, formatTimeKey, START_HOUR, END_HOUR, generateTimeSlots, isToday, isSlotPast } from './utils/time';
import './App.css';

const TIME_SLOTS = generateTimeSlots();

function App() {
  // DATA_FLOW: On initialization, fetch instance config (title, user list) from server
  const { loading, error, title, users } = useConfig();

  // BEHAVIOR: Track current view state - which date, which view mode, what's selected
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isWeekView, setIsWeekView] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);  // PANEL MODE: Which slot user is booking
  const [selectedUser, setSelectedUser] = useState(null);  // PANEL MODE: Who the booking is for
  const [focusedSlotIndex, setFocusedSlotIndex] = useState(null);  // Keyboard navigation focus
  const [selectedBooking, setSelectedBooking] = useState(null);  // POPUP MODE: Which booking is being edited
  const [useNSWTime, setUseNSWTime] = useState(() => getTimezonePreference());  // Timezone display toggle

  // DATA_FLOW: Connect to booking management module for all booking operations
  const { bookings, createBooking, removeBooking, updateBooking, getSlotStatus, canBook, canChangeDuration } = useBookings();

  // BEHAVIOR: Calculate which time slots should be visible on current date
  // EDGE_CASE: For today, hide past slots; for future dates, show all slots
  // WHY: Users shouldn't see slots they can't book
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

  // BEHAVIOR: Automatically refresh UI every hour to update which slots are past
  // WHY: At 10:00 AM, the 9:00 AM slot should disappear from today's view
  useHourlyRefresh();

  // BEHAVIOR: Save timezone preference whenever user toggles it
  // DATA_FLOW: User presses [T] key -> useNSWTime changes -> save to localStorage
  useEffect(() => {
    saveTimezonePreference(useNSWTime);
  }, [useNSWTime]);

  // BEHAVIOR: Determine if "Book Now" button should be visible
  // VALIDATION: Current hour must be within booking hours, not past, and available
  // EDGE_CASE: At 9:45 AM, 9:00 AM slot is still bookable, so "Book Now" appears
  const currentHourAvailable = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    // Outside booking hours?
    if (currentHour < START_HOUR || currentHour >= END_HOUR) {
      return false;
    }

    // Slot is past?
    if (isSlotPast(now, currentHour)) {
      return false;
    }

    // Check if slot is available (not booked, not blocked)
    const todayKey = formatDate(now);
    const timeKey = formatTimeKey(currentHour);
    const status = getSlotStatus(todayKey, timeKey, currentHour);

    return status.status === 'available';
  }, [getSlotStatus, bookings]);

  // BEHAVIOR: Navigate forward/backward in time
  // EDGE_CASE: In week view, moves by 7 days (to next/previous week)
  //           In day view, moves by 1 day
  // WHY: Arrow keys move by different amounts depending on view mode
  const handleNavigate = useCallback((direction) => {
    const daysToMove = isWeekView ? 7 : 1;
    setCurrentDate((prev) => addDays(prev, direction * daysToMove));
    setFocusedSlotIndex(null); // Reset keyboard focus on date change
  }, [isWeekView]);

  // BEHAVIOR: Switch between day view (single day, full details) and week view (7 days, compact)
  // VALIDATION: Clears any active selection when toggling views
  const handleWeekToggle = useCallback(() => {
    setIsWeekView((prev) => !prev);
    setSelectedSlot(null);
    setSelectedUser(null);
  }, []);

  // BEHAVIOR: Toggle between Queensland time and NSW time display
  // WHY: NSW users can see times in their local timezone during daylight saving
  const handleTimezoneToggle = useCallback(() => {
    setUseNSWTime(prev => !prev);
  }, []);

  // BEHAVIOR: When user clicks a day in week view, switch to day view for that date
  // DATA_FLOW: Week view -> click day -> switch to day view -> show that day's slots
  const handleDaySelect = useCallback((date) => {
    setCurrentDate(date);
    setIsWeekView(false);
  }, []);

  // BEHAVIOR: User clicks/selects a time slot - opens booking panel for that slot
  // DATA_FLOW: Slot selected -> panel opens -> user picks person and duration -> booking created
  const handleSlotSelect = useCallback((slot) => {
    setSelectedSlot(slot);
    setSelectedUser(null);
  }, []);

  // BEHAVIOR: "Book Now" button - instantly opens panel for current hour
  // WHY: Fastest path to book current time - single click instead of finding current slot
  const handleBookNow = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const slot = {
      hour: currentHour,
      time: formatHour(currentHour),
      key: formatTimeKey(currentHour),
      dateKey: formatDate(now),
    };
    handleSlotSelect(slot);
  }, [handleSlotSelect]);

  // BEHAVIOR: Close booking panel without creating booking
  // DATA_FLOW: Panel open -> user presses Escape -> panel closes -> no booking created
  const handleCancelPanel = useCallback(() => {
    setSelectedSlot(null);
    setSelectedUser(null);
  }, []);

  // BEHAVIOR: User selects who the booking is for
  // DATA_FLOW: Panel open -> user presses [J] for Jack -> selectedUser = "Jack" -> awaiting duration
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  // BEHAVIOR: User selects duration - completes booking creation
  // DATA_FLOW: Slot + user selected -> user presses [2] -> validate availability -> create booking -> close panel
  // VALIDATION: Only creates booking if all slots in duration range are available
  // EDGE_CASE: If validation fails (conflict detected), silently ignores - no booking created, panel stays open
  const handleDurationSelect = useCallback((duration) => {
    if (!selectedSlot || !selectedUser) return;

    // Validate that booking is possible for this duration
    if (!canBook(selectedSlot.dateKey, selectedSlot.key, selectedSlot.hour, duration)) {
      return;
    }

    // Create the booking
    createBooking(selectedSlot.dateKey, selectedSlot.key, selectedUser, duration);

    // Close panel - booking created successfully
    setSelectedSlot(null);
    setSelectedUser(null);
  }, [selectedSlot, selectedUser, canBook, createBooking]);

  // BEHAVIOR: Delete an existing booking (from day view)
  // DATA_FLOW: User clicks X button on booking -> booking removed from server and local cache -> UI updates
  const handleSlotCancel = useCallback((dateKey, timeKey) => {
    removeBooking(dateKey, timeKey);
  }, [removeBooking]);

  // BEHAVIOR: User clicks on existing booking - opens popup to edit it
  // DATA_FLOW: Click booking -> open popup with current values -> can change user, duration, or delete
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

  // BEHAVIOR: Close edit popup - saves any changes that were made
  // WHY: Changes are applied immediately via optimistic updates; closing just dismisses UI
  const handlePopupClose = useCallback(() => {
    setSelectedBooking(null);
  }, []);

  // BEHAVIOR: Change who a booking is assigned to
  // DATA_FLOW: User presses [J] in popup -> update booking on server -> update local cache -> update popup display
  const handlePopupUserChange = useCallback((user) => {
    if (!selectedBooking) return;
    updateBooking(selectedBooking.dateKey, selectedBooking.timeKey, { user });
    setSelectedBooking((prev) => ({ ...prev, user }));
  }, [selectedBooking, updateBooking]);

  // BEHAVIOR: Change duration of existing booking
  // VALIDATION: Only works if new duration doesn't conflict with other bookings
  // DATA_FLOW: User presses [3] in popup -> validate -> update booking -> update display
  const handlePopupDurationChange = useCallback((duration) => {
    if (!selectedBooking) return;
    updateBooking(selectedBooking.dateKey, selectedBooking.timeKey, { duration });
    setSelectedBooking((prev) => ({ ...prev, duration }));
  }, [selectedBooking, updateBooking]);

  // BEHAVIOR: Delete booking from edit popup
  // DATA_FLOW: User presses [D] in popup -> delete from server -> remove from cache -> close popup
  const handlePopupDelete = useCallback(() => {
    if (!selectedBooking) return;
    removeBooking(selectedBooking.dateKey, selectedBooking.timeKey);
    setSelectedBooking(null);
  }, [selectedBooking, removeBooking]);

  // BEHAVIOR: Validate if duration can be changed for booking being edited
  // VALIDATION: Duration must not exceed END_HOUR and must not conflict with other bookings
  // EDGE_CASE: If booking is at 21:00 (9 PM) and user tries 3-hour duration, would go to 24:00 - rejected
  const canPopupChangeDuration = useCallback((newDuration) => {
    if (!selectedBooking) return false;
    // Check if duration would exceed time range (latest slot is 21:00, so max 1-hour booking there)
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

  // BEHAVIOR: Validate if a duration option should be enabled in booking panel
  // VALIDATION: Duration must not exceed END_HOUR and all slots must be available
  // EDGE_CASE: If selecting 21:00 slot, only 1-hour duration allowed (2 or 3 hours disabled)
  const canBookDuration = useCallback((duration) => {
    if (!selectedSlot) return false;

    // Check if booking would exceed time range
    if (selectedSlot.hour + duration > END_HOUR) {
      return false;
    }

    return canBook(selectedSlot.dateKey, selectedSlot.key, selectedSlot.hour, duration);
  }, [selectedSlot, canBook]);

  // BEHAVIOR: Keyboard navigation - move focus up to previous available slot
  // EDGE_CASE: Skips booked/blocked slots - only focuses available slots
  // EDGE_CASE: Wraps around - pressing up at first available slot jumps to last available slot
  // WHY: Provides keyboard-only navigation path for accessibility
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

  // BEHAVIOR: Keyboard navigation - move focus down to next available slot
  // EDGE_CASE: Skips booked/blocked slots - only focuses available slots
  // EDGE_CASE: Wraps around - pressing down at last available slot jumps to first available slot
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

  // BEHAVIOR: Confirm selection of focused slot (via Enter key)
  // DATA_FLOW: User presses Up/Down arrows to focus slot -> presses Enter -> opens booking panel for that slot
  const handleFocusedSlotSelect = useCallback(() => {
    if (focusedSlotIndex === null || focusedSlotIndex >= visibleSlots.length) return;

    const slot = visibleSlots[focusedSlotIndex];
    handleSlotSelect({ ...slot, dateKey });
    setFocusedSlotIndex(null);
  }, [focusedSlotIndex, visibleSlots, dateKey, handleSlotSelect]);

  // BEHAVIOR: Wire up keyboard shortcuts with context-aware activation
  // VALIDATION: Shortcuts are only enabled when appropriate for current mode:
  //            - Popup mode: Only popup shortcuts active
  //            - Panel mode: Only panel and some navigation shortcuts active
  //            - Navigation mode: Full navigation shortcuts active
  // EDGE_CASE: When popup is open, all navigation is disabled - user must close popup first
  // WHY: Prevents conflicting keyboard interactions (e.g., pressing W shouldn't toggle week view while editing booking)
  useKeyboard({
    users,  // Pass users from config for dynamic user key bindings
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
    // General navigation (disabled when popup open)
    onWeekToggle: !selectedBooking ? handleWeekToggle : undefined,
    onBookNow: !selectedBooking && currentHourAvailable ? handleBookNow : undefined,
    onTimezoneToggle: !selectedBooking ? handleTimezoneToggle : undefined,
    onNavigate: !selectedBooking ? handleNavigate : undefined,
    onSlotFocusUp: !isWeekView && !selectedSlot && !selectedBooking ? handleSlotFocusUp : undefined,
    onSlotFocusDown: !isWeekView && !selectedSlot && !selectedBooking ? handleSlotFocusDown : undefined,
    onSlotSelect: !isWeekView && !selectedSlot && !selectedBooking && focusedSlotIndex !== null ? handleFocusedSlotSelect : undefined,
    isWeekView,
    enabled: !loading,  // Disable all keyboard shortcuts while config is loading
  });

  // BEHAVIOR: Determine "current user" for highlighting own bookings in UI
  // EDGE_CASE: In prototype, always assumes first user in config is the logged-in user
  // WHY: Real system would have authentication; prototype hardcodes for simplicity
  const currentUser = users.length > 0 ? users[0].name : 'User';

  // Show loading state
  if (loading) {
    return (
      <div className="app app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="app app-error">
        <div className="error-message">
          <h2>Configuration Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        title={title}
        currentDate={currentDate}
        onNavigate={handleNavigate}
        onWeekToggle={handleWeekToggle}
        isWeekView={isWeekView}
        showBookNow={currentHourAvailable}
        onBookNow={handleBookNow}
        useNSWTime={useNSWTime}
        onTimezoneToggle={handleTimezoneToggle}
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
              users={users}
              useNSWTime={useNSWTime}
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
              users={users}
              useNSWTime={useNSWTime}
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
          users={users}
          useNSWTime={useNSWTime}
        />

        <BookingPopup
          isOpen={!!selectedBooking}
          booking={selectedBooking}
          onUserChange={handlePopupUserChange}
          onDurationChange={handlePopupDurationChange}
          onDelete={handlePopupDelete}
          onClose={handlePopupClose}
          canChangeDuration={canPopupChangeDuration}
          users={users}
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
