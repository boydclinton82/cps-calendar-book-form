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
  const {
    status,
    booking,
    isStart,
    isEnd,
    isMiddle,
    duration,
    positionInBooking,
    isMultiHour,
    isEffectiveStart,
    remainingDuration,
  } = slotStatus;

  const isBooked = status === 'booked';
  const isBlocked = status === 'blocked';
  const isOwnBooking = (isBooked || isBlocked) && booking?.user === currentUser;
  // Can cancel from the effective start (first visible slot)
  const canCancel = isOwnBooking && isEffectiveStart && !isPast;

  // Show booking info on the EFFECTIVE START slot (first non-past slot)
  const shouldShowBookingInfo = (isBooked || isBlocked) && isEffectiveStart && !isPast;

  const getSlotClass = () => {
    const classes = ['time-slot'];

    if (isPast) {
      classes.push('past');
    } else if (isBooked || isBlocked) {
      classes.push('booked');
      if (isOwnBooking) {
        classes.push('own');
      }
    } else {
      classes.push('available');
    }

    // Add position classes for multi-hour bookings
    if (isMultiHour && !isPast) {
      classes.push('multi-hour');
      if (isEffectiveStart) {
        classes.push('booking-start');
      } else if (isEnd) {
        classes.push('booking-end');
      } else {
        classes.push('booking-middle');
      }
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
    // For multi-hour bookings, only show booking info on the effective start slot
    if (isBooked || isBlocked) {
      if (shouldShowBookingInfo) {
        // Show remaining duration (hours left that aren't past)
        const displayDuration = remainingDuration ?? duration;
        const durationText = displayDuration > 1 ? `(${displayDuration}hr)` : '(1hr)';
        return (
          <span className="booking-info">
            {booking.user} {durationText}
            {canCancel && <span className="cancel-hint">click to cancel</span>}
          </span>
        );
      }
      // Non-effective-start slots show nothing
      return null;
    }

    return <span className="available-indicator"></span>;
  };

  return (
    <button
      className={getSlotClass()}
      onClick={handleClick}
      disabled={isPast || isBlocked}
      data-duration={duration}
      aria-label={
        isPast
          ? `${time} - Past`
          : isBooked || isBlocked
          ? `${time} - Booked by ${booking?.user}`
          : `${time} - Available, click to book`
      }
    >
      <span className="time-label mono">{time}</span>
      <div className="slot-content">{renderContent()}</div>
    </button>
  );
}
