import { getWeekDays, getStartOfWeek, formatDate, formatShortDate, generateTimeSlots, isToday, isSlotPast } from '../utils/time';
import { WeekDayOverlay } from './WeekDayOverlay';
import './WeekView.css';

const TIME_SLOTS = generateTimeSlots();

export function WeekView({ currentDate, bookings, getSlotStatus, onDaySelect, onSlotSelect, onBookingClick, currentUser, users = [] }) {
  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekDays(weekStart);

  const getSlotClass = (date, slot) => {
    const dateKey = formatDate(date);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
    const isPast = isSlotPast(date, slot.hour);

    const classes = ['week-slot'];
    const isBooked = slotStatus.status === 'booked' || slotStatus.status === 'blocked';

    if (isPast) {
      classes.push('past');
    } else if (isBooked) {
      // Occupied slots are transparent - overlay shows the booking
      classes.push('occupied');
    } else {
      classes.push('available', 'clickable');
    }

    return classes.join(' ');
  };

  const handleSlotClick = (day, slot) => {
    const dateKey = formatDate(day);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
    const isPast = isSlotPast(day, slot.hour);

    // Don't allow clicking on past or booked slots (bookings handled by overlay)
    if (isPast || slotStatus.status === 'booked' || slotStatus.status === 'blocked') {
      return;
    }

    // Select this slot for booking
    onSlotSelect?.({ ...slot, dateKey });
  };

  const handleBookingClickWrapper = (dateKey, timeKey, booking) => {
    onBookingClick?.(dateKey, timeKey, booking);
  };

  const getSlotTitle = (date, slot) => {
    const dateKey = formatDate(date);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);

    if (slotStatus.status === 'booked') {
      return `${slot.time}: ${slotStatus.booking.user} (${slotStatus.booking.duration}hr)`;
    }
    if (slotStatus.status === 'blocked') {
      return `${slot.time}: Blocked by ${slotStatus.booking?.user}`;
    }
    return `${slot.time}: Available`;
  };

  return (
    <div className="week-view">
      <div className="week-grid">
        {/* Time column */}
        <div className="time-column">
          <div className="column-header"></div>
          {TIME_SLOTS.map((slot) => (
            <div key={slot.key} className="time-cell mono">
              {slot.time}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, index) => {
          const dateKey = formatDate(day);
          const dayBookings = bookings[dateKey] || {};
          const isCurrentDay = dateKey === formatDate(currentDate);
          const isTodayDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={`day-column ${isCurrentDay ? 'current' : ''}`}
              style={{ '--delay': `${index * 50}ms` }}
            >
              <button
                className={`column-header ${isTodayDay ? 'today' : ''}`}
                onClick={() => onDaySelect(day)}
              >
                <span className="day-name">{formatShortDate(day).split(',')[0]}</span>
                <span className="day-date mono">{day.getDate()}</span>
              </button>

              {/* Slots container with overlay */}
              <div className="slots-container">
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.key}
                    className={getSlotClass(day, slot)}
                    title={getSlotTitle(day, slot)}
                    onClick={() => handleSlotClick(day, slot)}
                  />
                ))}
                <WeekDayOverlay
                  dayBookings={dayBookings}
                  date={day}
                  currentUser={currentUser}
                  onBookingClick={(timeKey, booking) => handleBookingClickWrapper(dateKey, timeKey, booking)}
                  users={users}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
