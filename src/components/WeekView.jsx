import { getWeekDays, getStartOfWeek, formatDate, formatShortDate, generateTimeSlots, isToday, isSlotPast } from '../utils/time';
import './WeekView.css';

const TIME_SLOTS = generateTimeSlots();

export function WeekView({ currentDate, bookings, getSlotStatus, onDaySelect, currentUser }) {
  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekDays(weekStart);

  const getSlotClass = (date, slot) => {
    const dateKey = formatDate(date);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
    const isPast = isSlotPast(date, slot.hour);

    const classes = ['week-slot'];
    const isBooked = slotStatus.status === 'booked' || slotStatus.status === 'blocked';
    const isOwnBooking = slotStatus.booking?.user === currentUser;

    if (isPast) {
      classes.push('past');
    } else if (isBooked) {
      classes.push('booked');
      if (isOwnBooking) {
        classes.push('own');
      }
    } else {
      classes.push('available');
    }

    // Add position classes for multi-hour bookings
    if (slotStatus.isMultiHour && !isPast) {
      classes.push('multi-hour');
      if (slotStatus.isEffectiveStart) {
        classes.push('booking-start');
      } else if (slotStatus.isEnd) {
        classes.push('booking-end');
      } else {
        classes.push('booking-middle');
      }
    }

    return classes.join(' ');
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

  const getSlotContent = (date, slot) => {
    const dateKey = formatDate(date);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
    const isPast = isSlotPast(date, slot.hour);

    // Show label on the effective start slot (first non-past slot of a booking)
    const isBooked = slotStatus.status === 'booked' || slotStatus.status === 'blocked';
    if (!isPast && isBooked && slotStatus.isEffectiveStart) {
      // Show remaining duration (hours left that aren't past)
      const displayDuration = slotStatus.remainingDuration ?? slotStatus.duration ?? 1;
      const hourText = displayDuration === 1 ? 'hr' : 'hrs';
      return (
        <span className="week-booking-label">
          {slotStatus.booking.user} {displayDuration}{hourText}
        </span>
      );
    }
    return null;
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
          const isCurrentDay = formatDate(day) === formatDate(currentDate);
          const isTodayDay = isToday(day);

          return (
            <div
              key={formatDate(day)}
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

              {/* Week View keeps all slots for grid alignment; past slots are styled differently */}
              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.key}
                  className={getSlotClass(day, slot)}
                  title={getSlotTitle(day, slot)}
                >
                  {getSlotContent(day, slot)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
