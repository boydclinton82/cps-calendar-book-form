import { USERS, DURATIONS } from '../hooks/useKeyboard';
import './BookingPopup.css';

export function BookingPopup({
  isOpen,
  booking,
  onUserChange,
  onDurationChange,
  onDelete,
  onClose,
  canChangeDuration,
}) {
  if (!isOpen || !booking) {
    return null;
  }

  // Calculate time range display
  const startHour = parseInt(booking.timeKey.split(':')[0], 10);
  const endHour = startHour + booking.duration;
  const endTime = `${endHour.toString().padStart(2, '0')}:00`;

  return (
    <>
      <div className="popup-overlay" onClick={onClose} />
      <div className="booking-popup">
        <div className="popup-header">
          <h2 className="popup-title">Edit Booking</h2>
          <span className="popup-time mono">
            {booking.timeKey} - {endTime}
          </span>
        </div>

        <div className="popup-section">
          <h3 className="section-title">Who?</h3>
          <div className="option-group">
            {USERS.map((user) => (
              <button
                key={user.key}
                className={`option-btn ${booking.user === user.name ? 'selected' : ''}`}
                onClick={() => onUserChange(user.name)}
              >
                <span className="option-key mono">[{user.key.toUpperCase()}]</span>
                <span className="option-label">{user.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="popup-section">
          <h3 className="section-title">Duration?</h3>
          <div className="option-group">
            {DURATIONS.map((duration) => {
              const canChange = canChangeDuration(duration.value);
              return (
                <button
                  key={duration.key}
                  className={`option-btn ${booking.duration === duration.value ? 'selected' : ''} ${!canChange ? 'disabled' : ''}`}
                  onClick={() => canChange && onDurationChange(duration.value)}
                  disabled={!canChange}
                >
                  <span className="option-key mono">[{duration.key}]</span>
                  <span className="option-label">{duration.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="popup-actions">
          <button className="done-btn" onClick={onClose}>
            <span className="option-key mono">[Enter]</span>
            <span>Done</span>
          </button>

          <button className="delete-btn" onClick={onDelete}>
            <span className="option-key mono">[D]</span>
            <span>Delete</span>
          </button>

          <button className="close-btn" onClick={onClose}>
            <span className="option-key mono">[Esc]</span>
            <span>Close</span>
          </button>
        </div>
      </div>
    </>
  );
}
