import { isSlotPast } from '../utils/time';
import './TimeSlot.css';

export function TimeSlot({
  time,
  hour,
  timeKey,
  date,
  slotStatus,
  isSelected,
  isFocused,
  onClick,
}) {
  const isPast = isSlotPast(date, hour);
  const { status } = slotStatus;

  const isBooked = status === 'booked';
  const isBlocked = status === 'blocked';
  const isOccupied = isBooked || isBlocked;

  const getSlotClass = () => {
    const classes = ['time-slot'];

    if (isPast) {
      classes.push('past');
    } else if (isOccupied) {
      // Occupied slots are transparent - the overlay shows the booking
      classes.push('occupied');
    } else {
      classes.push('available');
    }

    if (isSelected) {
      classes.push('selected');
    }

    // Keyboard focus highlight (only for available slots)
    if (isFocused && !isPast && !isOccupied) {
      classes.push('keyboard-focused');
    }

    return classes.join(' ');
  };

  const handleClick = () => {
    if (isPast || isOccupied) return;
    onClick?.();
  };

  return (
    <button
      className={getSlotClass()}
      onClick={handleClick}
      disabled={isPast || isOccupied}
      aria-label={
        isPast
          ? `${time} - Past`
          : isOccupied
          ? `${time} - Occupied`
          : `${time} - Available, click to book`
      }
    >
      <span className="time-label mono">{time}</span>
    </button>
  );
}
