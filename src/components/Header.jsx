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
          aria-label="Previous day"
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
          aria-label="Next day"
        >
          <span className="mono">&rarr;</span>
        </button>
      </div>

      <div className="header-hints mono">
        <span className="hint"><kbd>J</kbd> Jack</span>
        <span className="hint"><kbd>B</kbd> Bonnie</span>
        <span className="hint-separator">|</span>
        <span className="hint"><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Duration</span>
        <span className="hint-separator">|</span>
        <span className="hint"><kbd>&larr;</kbd><kbd>&rarr;</kbd> Navigate</span>
      </div>
    </header>
  );
}
