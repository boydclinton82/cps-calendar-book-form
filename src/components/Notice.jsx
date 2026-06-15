import { useEffect } from 'react';
import './Notice.css';

// Transient, non-blocking toast for user-facing messages (e.g. a slot was just
// taken by someone else). Auto-dismisses after ~5s or on click.
export function Notice({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onDismiss(), 5000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className="notice"
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      {message}
    </div>
  );
}
