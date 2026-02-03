import { formatDisplayDate, isToday, getNSWOffsetLabel } from '../utils/time';
import './Header.css';

export function Header({ title, currentDate, onNavigate, onWeekToggle, isWeekView, showBookNow, onBookNow, useNSWTime, onTimezoneToggle }) {
  return (
    <header className="header">
      <div className="header-top">
        <h1 className="header-title mono">{title}</h1>
        <div className="header-actions">
          {showBookNow && (
            <button
              className="book-now-btn"
              onClick={onBookNow}
              aria-label="Book current hour"
            >
              <span className="mono">[B]</span> Book Now
            </button>
          )}
          <button
            className={`week-toggle ${isWeekView ? 'active' : ''}`}
            onClick={onWeekToggle}
            aria-pressed={isWeekView}
          >
            <span className="mono">[W]</span> {isWeekView ? 'Day View' : 'Week View'}
          </button>
          <button
            className={`timezone-toggle ${useNSWTime ? 'active' : ''}`}
            onClick={onTimezoneToggle}
            aria-pressed={useNSWTime}
            aria-label="Toggle timezone display"
          >
            <span className="mono">[T]</span> {useNSWTime ? `NSW ${getNSWOffsetLabel()}` : 'QLD'}
          </button>
        </div>
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
