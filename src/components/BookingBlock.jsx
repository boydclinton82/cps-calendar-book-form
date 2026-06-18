import { isNSWInDST } from '../utils/time';
import { getUserColorClass } from '../utils/colors';
import './BookingBlock.css';

// Format hour to short time string (e.g., 17 -> "5 PM", 9 -> "9 AM", 12 -> "12 PM")
function formatShortHour(hour, useNSWTime = false) {
  let displayHour = hour;
  if (useNSWTime && isNSWInDST()) {
    displayHour = hour + 1;
  }
  const period = displayHour >= 12 ? 'PM' : 'AM';
  const h = displayHour > 12 ? displayHour - 12 : displayHour === 0 ? 12 : displayHour;
  return `${h} ${period}`;
}

// Format time range (e.g., 17-19 -> "5-7 PM", 11-13 -> "11 AM-1 PM")
function formatTimeRange(startHour, endHour, useNSWTime = false) {
  let startDisplay = startHour;
  let endDisplay = endHour;

  if (useNSWTime && isNSWInDST()) {
    startDisplay = startHour + 1;
    endDisplay = endHour + 1;
  }

  const startPeriod = startDisplay >= 12 ? 'PM' : 'AM';
  const endPeriod = endDisplay >= 12 ? 'PM' : 'AM';
  const startH = startDisplay > 12 ? startDisplay - 12 : startDisplay === 0 ? 12 : startDisplay;
  const endH = endDisplay > 12 ? endDisplay - 12 : endDisplay === 0 ? 12 : endDisplay;

  if (startPeriod === endPeriod) {
    // Same period: "5-7 PM"
    return `${startH}-${endH} ${endPeriod}`;
  } else {
    // Different periods: "11 AM-1 PM"
    return `${startH} ${startPeriod}-${endH} ${endPeriod}`;
  }
}

export function BookingBlock({
  booking,
  startHour,
  date,
  firstVisibleHour,  // First hour rendered by TimeStrip (single source of truth)
  currentUser,
  onCancel,
  onClick,
  users = [],  // Accept users from config
  useNSWTime = false,
}) {
  const { user, duration } = booking;

  // Past dates render nothing. Today's past-slot clipping is NOT re-derived
  // here: firstVisibleHour comes from TimeStrip, which already filters the
  // visible slots, so the strip and the blocks can't disagree at an hour
  // boundary. Any hour earlier than firstVisibleHour is a clipped (past) hour.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);
  if (bookingDate < today) {
    return null;
  }

  const clipHours = Math.max(0, firstVisibleHour - startHour);
  const remainingDuration = duration - clipHours;
  if (remainingDuration <= 0) {
    // Entire booking is before the first visible row (fully past) - skip it.
    return null;
  }

  // Place the block on the overlay grid by hour row. grid-row is 1-based, and
  // the overlay shares the slot row geometry, so this lands exactly on the
  // booking's hour rows with no pixel math.
  const effectiveStartHour = startHour + clipHours;
  const rowStart = effectiveStartHour - firstVisibleHour + 1;

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Calculate display time range (using effective start after clipping)
  const displayStartHour = effectiveStartHour;
  const displayEndHour = effectiveStartHour + remainingDuration;
  const timeRangeText = formatTimeRange(displayStartHour, displayEndHour, useNSWTime);

  // Generate position-based user class (user-1 through user-6)
  const userClass = getUserColorClass(user, users);

  return (
    <div
      className={`booking-block ${userClass}`}
      style={{ gridRow: `${rowStart} / span ${remainingDuration}` }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Booking by ${user} from ${formatShortHour(displayStartHour, useNSWTime)} to ${formatShortHour(displayEndHour, useNSWTime)}, click to edit`}
    >
      <span className="booking-block-info">
        {user} ({timeRangeText})
      </span>
      <span className="booking-block-cancel-hint">click to edit</span>
    </div>
  );
}
