import { WeekBookingBlock } from './WeekBookingBlock';
import './WeekDayOverlay.css';

export function WeekDayOverlay({
  dayBookings,
  date,
  currentUser,
  onBookingClick,
}) {
  // dayBookings is an object: { "07:00": { user: "Jack", duration: 2 }, ... }
  const bookingEntries = Object.entries(dayBookings || {});

  if (bookingEntries.length === 0) {
    return null;
  }

  return (
    <div className="week-day-overlay">
      {bookingEntries.map(([timeKey, booking]) => {
        const startHour = parseInt(timeKey.split(':')[0], 10);
        return (
          <WeekBookingBlock
            key={timeKey}
            booking={booking}
            startHour={startHour}
            date={date}
            currentUser={currentUser}
            onClick={() => onBookingClick?.(timeKey, booking)}
          />
        );
      })}
    </div>
  );
}
