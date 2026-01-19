import { BookingBlock } from './BookingBlock';
import './BookingOverlay.css';

export function BookingOverlay({
  dayBookings,
  date,
  currentUser,
  onCancel,
}) {
  // dayBookings is an object: { "07:00": { user: "Jack", duration: 2 }, ... }
  const bookingEntries = Object.entries(dayBookings || {});

  if (bookingEntries.length === 0) {
    return null;
  }

  return (
    <div className="booking-overlay">
      {bookingEntries.map(([timeKey, booking]) => {
        const startHour = parseInt(timeKey.split(':')[0], 10);
        return (
          <BookingBlock
            key={timeKey}
            booking={booking}
            startHour={startHour}
            date={date}
            currentUser={currentUser}
            onCancel={() => onCancel?.(timeKey)}
          />
        );
      })}
    </div>
  );
}
