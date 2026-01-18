import { generateTimeSlots, formatDate, isToday, isSlotPast } from '../utils/time';
import { TimeSlot } from './TimeSlot';
import './TimeStrip.css';

const TIME_SLOTS = generateTimeSlots();

export function TimeStrip({
  date,
  bookings,
  getSlotStatus,
  selectedSlot,
  onSlotSelect,
  onSlotCancel,
  currentUser,
}) {
  const dateKey = formatDate(date);
  const dayBookings = bookings[dateKey] || {};

  // Filter out past slots for today - they simply won't render
  const visibleSlots = isToday(date)
    ? TIME_SLOTS.filter(slot => !isSlotPast(date, slot.hour))
    : TIME_SLOTS;

  return (
    <div className="time-strip">
      {visibleSlots.map((slot) => {
        const slotStatus = getSlotStatus(dateKey, slot.key, slot.hour);
        const isSelected = selectedSlot?.timeKey === slot.key;

        return (
          <TimeSlot
            key={slot.key}
            time={slot.time}
            hour={slot.hour}
            timeKey={slot.key}
            date={date}
            slotStatus={slotStatus}
            currentUser={currentUser}
            isSelected={isSelected}
            onClick={() => onSlotSelect?.({ ...slot, dateKey })}
            onCancel={() => onSlotCancel?.(dateKey, slot.key)}
          />
        );
      })}
    </div>
  );
}
