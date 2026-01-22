import { useEffect } from 'react';
import { DURATIONS } from '../hooks/useKeyboard';
import './BookingPanel.css';

export function BookingPanel({
  isOpen,
  selectedSlot,
  selectedUser,
  canBookDuration,
  onUserSelect,
  onDurationSelect,
  onCancel,
  users = [],  // Accept users from config
}) {
  // Prevent background scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !selectedSlot) {
    return null;
  }

  return (
    <div className={`booking-panel ${isOpen ? 'open' : ''}`}>
      <div className="panel-header">
        <h2 className="panel-title">Book Slot</h2>
        <span className="panel-time mono">{selectedSlot.time}</span>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Who?</h3>
        <div className="option-group">
          {users.map((user) => (
            <button
              key={user.key}
              className={`option-btn ${selectedUser === user.name ? 'selected' : ''}`}
              onClick={() => onUserSelect(user.name)}
            >
              <span className="option-key mono">[{user.key.toUpperCase()}]</span>
              <span className="option-label">{user.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel-section">
        <h3 className="section-title">Duration?</h3>
        <div className="option-group">
          {DURATIONS.map((duration) => {
            const canBook = canBookDuration(duration.value);
            return (
              <button
                key={duration.key}
                className={`option-btn ${!canBook ? 'disabled' : ''}`}
                onClick={() => canBook && onDurationSelect(duration.value)}
                disabled={!canBook}
              >
                <span className="option-key mono">[{duration.key}]</span>
                <span className="option-label">{duration.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="cancel-btn" onClick={onCancel}>
        <span className="option-key mono">[Esc]</span>
        <span>Cancel</span>
      </button>
    </div>
  );
}
