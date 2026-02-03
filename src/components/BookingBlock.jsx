import { isSlotPast, START_HOUR, isNSWInDST } from '../utils/time';
import { getUserColorClass } from '../utils/colors';
import './BookingBlock.css';

// Layout constants for Day View - must match TimeStrip/TimeSlot CSS
const SLOT_HEIGHT = 36;  // Approximate height of a TimeSlot
const SLOT_GAP = 6;      // Gap from TimeStrip.css

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
  currentUser,
  onCancel,
  onClick,
  users = [],  // Accept users from config
  useNSWTime = false,
}) {
  const { user, duration } = booking;
  const isOwn = user === currentUser;

  // Calculate how many hours have passed for today
  const now = new Date();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);

  let clipHours = 0;

  if (bookingDate < today) {
    // Past date - entire booking is past
    return null;
  } else if (bookingDate.getTime() === today.getTime()) {
    // Today - calculate how many hours are past using isSlotPast logic
    for (let i = 0; i < duration; i++) {
      const slotDate = new Date(date);
      slotDate.setHours(startHour + i, 0, 0, 0);
      if (slotDate < now) {
        clipHours++;
      }
    }
    // If entire booking is past, don't render
    if (clipHours >= duration) {
      return null;
    }
  }

  // Calculate position relative to visible slots
  // For today, slots before current hour are filtered out in TimeStrip
  const effectiveSlotHeight = SLOT_HEIGHT + SLOT_GAP;

  // The slot index is relative to the first visible slot
  // Match isSlotPast logic: a slot is past if slotDate (set to hour:00:00) < now
  // So if it's 4:30 PM, the 4:00 PM slot is past, first visible is 5:00 PM
  let firstVisibleHour = START_HOUR;
  if (bookingDate.getTime() === today.getTime()) {
    // Find first hour that isn't past
    for (let h = START_HOUR; h < 24; h++) {
      const slotDate = new Date(date);
      slotDate.setHours(h, 0, 0, 0);
      if (slotDate >= now) {
        firstVisibleHour = h;
        break;
      }
    }
  }

  // Calculate the effective start position (accounting for clipped hours)
  const effectiveStartHour = startHour + clipHours;
  const slotIndex = effectiveStartHour - firstVisibleHour;

  // If start is before first visible slot, this shouldn't happen with proper clipping
  if (slotIndex < 0) {
    return null;
  }

  const remainingDuration = duration - clipHours;

  // Calculate top position and height
  const top = slotIndex * effectiveSlotHeight;
  const height = remainingDuration * effectiveSlotHeight - SLOT_GAP;

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
      style={{ top: `${top}px`, height: `${height}px` }}
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
