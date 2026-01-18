import { getWeekDays, getStartOfWeek, formatDate, formatShortDate, generateTimeSlots, isToday, isSlotPast } from '../utils/time';
import './WeekView.css';

const TIME_SLOTS = generateTimeSlots();

export function WeekView({ currentDate, bookings, getSlotStatus, onDaySelect }) {
  const weekStart = getStartOfWeek(currentDate);
  const weekDays = getWeekDays(weekStart);

  const getSlotClass = (date, slot) => {
    const dateKey = formatDate(date);
    const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
    const isPast = isSlotPast(date, slot.hour);

    const classes = ['week-slot'];

    if (isPast) {
      classes.push('past');
    } else if (slotStatus.status === 'booked' || slotStatus.status === 'blocked') {
      classes.push('booked');
    } else {
      classes.push('available');
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
      return `${slot.time}: Blocked`;
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

              {TIME_SLOTS.map((slot) => (
                <div
                  key={slot.key}
                  className={getSlotClass(day, slot)}
                  title={getSlotTitle(day, slot)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
