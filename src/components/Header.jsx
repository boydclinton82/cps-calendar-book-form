import { formatDisplayDate, isToday } from '../utils/time';
import './Header.css';

export function Header({ currentDate, onNavigate, onWeekToggle, isWeekView }) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title mono">CPS Software Booking</h1>
        <button
          className={`week-toggle ${isWeekView ? 'active' : ''}`}
          onClick={onWeekToggle}
          aria-pressed={isWeekView}
        >
          <span className="mono">[W]</span> {isWeekView ? 'Day View' : 'Week View'}
        </button>
      </div>

      <div className="header-nav">
        <button
          className="nav-btn"
          onClick={() => onNavigate(-1)}
          aria-label={isWeekView ? "Previous week" : "Previous day"}
        >
          <span className="mono">&larr;</span>
        </button>

        <div className="header-date">
          <span className="date-text">{formatDisplayDate(currentDate)}</span>
          {isToday(currentDate) && <span className="today-badge">Today</span>}
        </div>

        <button
          className="nav-btn"
          onClick={() => onNavigate(1)}
          aria-label={isWeekView ? "Next week" : "Next day"}
        >
          <span className="mono">&rarr;</span>
        </button>
      </div>

    </header>
  );
}
