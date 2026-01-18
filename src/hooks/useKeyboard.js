import { useEffect, useCallback } from 'react';

export const USERS = [
  { key: 'j', name: 'Jack' },
  { key: 'b', name: 'Bonnie' },
];

export const DURATIONS = [
  { key: '1', value: 1, label: '1 hour' },
  { key: '2', value: 2, label: '2 hours' },
  { key: '3', value: 3, label: '3 hours' },
];

export function useKeyboard({
  onUserSelect,
  onDurationSelect,
  onCancel,
  onWeekToggle,
  onNavigate,
  enabled = true,
}) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();

    // User selection: J or B
    const user = USERS.find((u) => u.key === key);
    if (user && onUserSelect) {
      e.preventDefault();
      onUserSelect(user.name);
      return;
    }

    // Duration selection: 1, 2, or 3
    const duration = DURATIONS.find((d) => d.key === key);
    if (duration && onDurationSelect) {
      e.preventDefault();
      onDurationSelect(duration.value);
      return;
    }

    // Cancel: Escape
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
      return;
    }

    // Week view toggle: W
    if (key === 'w' && onWeekToggle) {
      e.preventDefault();
      onWeekToggle();
      return;
    }

    // Navigation: Arrow keys
    if (onNavigate) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate(1);
        return;
      }
    }
  }, [enabled, onUserSelect, onDurationSelect, onCancel, onWeekToggle, onNavigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
