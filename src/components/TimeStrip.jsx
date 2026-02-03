import { generateTimeSlots, formatDate, isToday, isSlotPast } from '../utils/time';
import { TimeSlot } from './TimeSlot';
import { BookingOverlay } from './BookingOverlay';
import './TimeStrip.css';

const TIME_SLOTS = generateTimeSlots();

export function TimeStrip({
  date,
  bookings,
  getSlotStatus,
  selectedSlot,
  focusedSlotIndex,
  onSlotSelect,
  onSlotCancel,
  onBookingClick,
  currentUser,
  users = [],  // Accept users from config
  useNSWTime = false,
}) {
  const dateKey = formatDate(date);
  const dayBookings = bookings[dateKey] || {};

  // Filter out past slots for today - they simply won't render
  const visibleSlots = isToday(date)
    ? TIME_SLOTS.filter(slot => !isSlotPast(date, slot.hour))
    : TIME_SLOTS;

  const handleOverlayCancel = (timeKey) => {
    onSlotCancel?.(dateKey, timeKey);
  };

  const handleBookingClick = (timeKey, booking) => {
    onBookingClick?.(dateKey, timeKey, booking);
  };

  return (
    <div className="time-strip">
      <div className="slots-container">
        {visibleSlots.map((slot, index) => {
          const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
          const isSelected = selectedSlot?.timeKey === slot.key;
          const isFocused = focusedSlotIndex === index;

          return (
            <TimeSlot
              key={slot.key}
              time={slot.time}
              hour={slot.hour}
              timeKey={slot.key}
              date={date}
              slotStatus={slotStatus}
              currentUser={currentUser}
              isSelected={isSelected}
              isFocused={isFocused}
              onClick={() => onSlotSelect?.({ ...slot, dateKey })}
              useNSWTime={useNSWTime}
            />
          );
        })}
        <BookingOverlay
          dayBookings={dayBookings}
          date={date}
          currentUser={currentUser}
          onCancel={handleOverlayCancel}
          onBookingClick={handleBookingClick}
          users={users}
          useNSWTime={useNSWTime}
        />
      </div>
    </div>
  );
}
