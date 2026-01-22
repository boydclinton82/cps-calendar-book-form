import { useEffect, useCallback } from 'react';

// Duration options (not configurable per instance)
export const DURATIONS = [
  { key: '1', value: 1, label: '1 hour' },
  { key: '2', value: 2, label: '2 hours' },
  { key: '3', value: 3, label: '3 hours' },
];

export function useKeyboard({
  // Users from config (required for keyboard shortcuts)
  users = [],
  // Popup mode (edit existing booking)
  onPopupUserSelect,
  onPopupDurationSelect,
  onPopupDelete,
  onPopupClose,
  canPopupChangeDuration,
  // Panel mode (create new booking)
  onUserSelect,
  onDurationSelect,
  onCancel,
  // General navigation
  onWeekToggle,
  onNavigate,
  onSlotFocusUp,
  onSlotFocusDown,
  onSlotSelect,
  isWeekView = false,
  enabled = true,
}) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();

    // POPUP MODE (edit existing booking)
    if (onPopupClose || onPopupDelete || onPopupUserSelect || onPopupDurationSelect) {
      // Delete: D key
      if (key === 'd' && onPopupDelete) {
        e.preventDefault();
        onPopupDelete();
        return;
      }

      // Close popup: Escape
      if (e.key === 'Escape' && onPopupClose) {
        e.preventDefault();
        onPopupClose();
        return;
      }

      // Confirm and close popup: Enter
      if (e.key === 'Enter' && onPopupClose) {
        e.preventDefault();
        onPopupClose();
        return;
      }

      // User selection in popup: dynamic based on config
      const user = users.find((u) => u.key === key);
      if (user && onPopupUserSelect) {
        e.preventDefault();
        onPopupUserSelect(user.name);
        return;
      }

      // Duration selection in popup: 1, 2, or 3
      const duration = DURATIONS.find((d) => d.key === key);
      if (duration && onPopupDurationSelect && canPopupChangeDuration) {
        if (canPopupChangeDuration(duration.value)) {
          e.preventDefault();
          onPopupDurationSelect(duration.value);
        }
        return;
      }

      // Block other keys while popup is open
      return;
    }

    // PANEL MODE (create new booking)
    // User selection: dynamic based on config
    const user = users.find((u) => u.key === key);
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

    // Slot focus navigation: Up/Down arrows (day view only)
    if (e.key === 'ArrowUp' && onSlotFocusUp) {
      e.preventDefault();
      onSlotFocusUp();
      return;
    }
    if (e.key === 'ArrowDown' && onSlotFocusDown) {
      e.preventDefault();
      onSlotFocusDown();
      return;
    }

    // Select focused slot: Enter
    if (e.key === 'Enter' && onSlotSelect) {
      e.preventDefault();
      onSlotSelect();
      return;
    }

    // Navigation: Left/Right arrows (week navigation moves by 7 days)
    if (onNavigate) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate(isWeekView ? -7 : -1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate(isWeekView ? 7 : 1);
        return;
      }
    }
  }, [enabled, users, onPopupUserSelect, onPopupDurationSelect, onPopupDelete, onPopupClose, canPopupChangeDuration, onUserSelect, onDurationSelect, onCancel, onWeekToggle, onNavigate, onSlotFocusUp, onSlotFocusDown, onSlotSelect, isWeekView]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
