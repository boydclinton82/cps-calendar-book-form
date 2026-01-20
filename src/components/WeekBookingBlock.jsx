import { START_HOUR } from '../utils/time';
import './WeekBookingBlock.css';

// Layout constants for Week View - must match WeekView.css
const SLOT_HEIGHT = 30;
const SLOT_GAP = 4;

// Format time range (e.g., 17-19 -> "5-7 PM", 11-13 -> "11 AM-1 PM")
function formatTimeRange(startHour, endHour) {
  const startPeriod = startHour >= 12 ? 'PM' : 'AM';
  const endPeriod = endHour >= 12 ? 'PM' : 'AM';
  const startDisplay = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
  const endDisplay = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;

  if (startPeriod === endPeriod) {
    return `${startDisplay}-${endDisplay} ${endPeriod}`;
  } else {
    return `${startDisplay} ${startPeriod}-${endDisplay} ${endPeriod}`;
  }
}

export function WeekBookingBlock({
  booking,
  startHour,
  date,
  currentUser,
  onClick,
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
    // Today - calculate how many hours are past
    const currentHour = now.getHours();
    for (let i = 0; i < duration; i++) {
      if (startHour + i < currentHour) {
        clipHours++;
      }
    }
    // If entire booking is past, don't render
    if (clipHours >= duration) {
      return null;
    }
  }

  // In Week View, we show all slots (including past) for grid alignment
  // But we clip the booking block to show only remaining time
  const effectiveSlotHeight = SLOT_HEIGHT + SLOT_GAP;

  // Calculate slot index from START_HOUR (Week View shows all slots)
  const effectiveStartHour = startHour + clipHours;
  const slotIndex = effectiveStartHour - START_HOUR;

  if (slotIndex < 0) {
    return null;
  }

  const remainingDuration = duration - clipHours;

  // Calculate top position and height
  const top = slotIndex * effectiveSlotHeight;
  const height = remainingDuration * effectiveSlotHeight - SLOT_GAP;

  // Calculate display time range
  const endHour = effectiveStartHour + remainingDuration;
  const timeRangeText = formatTimeRange(effectiveStartHour, endHour);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`week-booking-block ${isOwn ? 'own' : 'other'}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${user} (${timeRangeText}) - click to edit`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <span className="week-booking-block-label">
        {user} ({timeRangeText})
      </span>
    </div>
  );
}
