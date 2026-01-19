import { START_HOUR } from '../utils/time';
import './WeekBookingBlock.css';

// Layout constants for Week View - must match WeekView.css
const SLOT_HEIGHT = 36;
const SLOT_GAP = 6;

export function WeekBookingBlock({
  booking,
  startHour,
  date,
  currentUser,
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

  const hourText = remainingDuration === 1 ? 'hr' : 'hrs';

  return (
    <div
      className={`week-booking-block ${isOwn ? 'own' : 'other'}`}
      style={{ top: `${top}px`, height: `${height}px` }}
      title={`${user} (${remainingDuration}${hourText})`}
    >
      <span className="week-booking-block-label">
        {user} {remainingDuration}{hourText}
      </span>
    </div>
  );
}
