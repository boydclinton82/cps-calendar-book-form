import { isSlotPast, START_HOUR } from '../utils/time';
import './BookingBlock.css';

// Layout constants for Day View - must match TimeStrip/TimeSlot CSS
const SLOT_HEIGHT = 48;  // Approximate height of a TimeSlot
const SLOT_GAP = 8;      // Gap from TimeStrip.css

export function BookingBlock({
  booking,
  startHour,
  date,
  currentUser,
  onCancel,
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
    if (isOwn && onCancel) {
      onCancel();
    }
  };

  const durationText = remainingDuration > 1 ? `(${remainingDuration}hr)` : '(1hr)';

  return (
    <div
      className={`booking-block ${isOwn ? 'own' : 'other'}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      onClick={handleClick}
      role="button"
      tabIndex={isOwn ? 0 : -1}
      aria-label={`Booking by ${user} for ${remainingDuration} hour${remainingDuration > 1 ? 's' : ''}${isOwn ? ', click to cancel' : ''}`}
    >
      <span className="booking-block-info">
        {user} {durationText}
      </span>
      {isOwn && <span className="booking-block-cancel-hint">click to cancel</span>}
    </div>
  );
}
