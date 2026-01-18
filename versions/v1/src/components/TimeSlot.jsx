import { isSlotPast } from '../utils/time';
import './TimeSlot.css';

export function TimeSlot({
  time,
  hour,
  timeKey,
  date,
  slotStatus,
  currentUser,
  isSelected,
  onClick,
  onCancel,
}) {
  const isPast = isSlotPast(date, hour);
  const { status, booking, isStart } = slotStatus;

  const isBooked = status === 'booked';
  const isBlocked = status === 'blocked';
  const isOwnBooking = isBooked && booking?.user === currentUser;
  const canCancel = isOwnBooking && isStart;

  const getSlotClass = () => {
    const classes = ['time-slot'];

    if (isPast) {
      classes.push('past');
    } else if (isBooked || isBlocked) {
      classes.push('booked');
      if (isOwnBooking || (isBlocked && booking?.user === currentUser)) {
        classes.push('own');
      }
      if (!isStart) {
        classes.push('continuation');
      }
    } else {
      classes.push('available');
    }

    if (isSelected) {
      classes.push('selected');
    }

    return classes.join(' ');
  };

  const handleClick = () => {
    if (isPast) return;

    if (canCancel) {
      onCancel?.();
    } else if (status === 'available') {
      onClick?.();
    }
  };

  const renderContent = () => {
    if (isBlocked) {
      return <span className="blocked-indicator">---</span>;
    }

    if (isBooked) {
      const durationText = booking.duration > 1 ? `(${booking.duration}hr)` : '(1hr)';
      return (
        <span className="booking-info">
          {booking.user} {durationText}
          {canCancel && <span className="cancel-hint">click to cancel</span>}
        </span>
      );
    }

    return <span className="available-indicator"></span>;
  };

  return (
    <button
      className={getSlotClass()}
      onClick={handleClick}
      disabled={isPast || isBlocked}
      aria-label={
        isPast
          ? `${time} - Past`
          : isBooked
          ? `${time} - Booked by ${booking.user}`
          : `${time} - Available, click to book`
      }
    >
      <span className="time-label mono">{time}</span>
      <div className="slot-content">{renderContent()}</div>
    </button>
  );
}
