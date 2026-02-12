// BEHAVIOR: Keyboard shortcut handler - provides hotkeys for all booking operations
// WHY: Power users can complete full booking workflow without mouse (select user -> select duration -> book)
// VALIDATION: Keyboard shortcuts are context-aware - only active when appropriate
//            Example: User selection hotkeys only work when booking panel is open
// EDGE_CASE: When editing existing booking (popup mode), different hotkeys become active

import { useEffect, useCallback } from 'react';

// CONSTANT: DURATIONS - Available booking duration options (1, 2, or 3 hours)
// VALIDATION: These are the only allowed durations in the system
// DATA_CONSTRAINT: { key: string (keyboard shortcut), value: number (hours), label: string (display) }
export const DURATIONS = [
  { key: '1', value: 1, label: '1 hour' },
  { key: '2', value: 2, label: '2 hours' },
  { key: '3', value: 3, label: '3 hours' },
];

// BEHAVIOR: Global keyboard event listener that routes keypresses to appropriate actions
// DATA_FLOW: Keypress -> check if popup open -> route to popup handlers or panel/navigation handlers
// VALIDATION: Shortcuts are mode-aware:
//            - POPUP MODE (editing existing booking): D=delete, Esc/Enter=close, user keys, duration keys
//            - PANEL MODE (creating new booking): user keys, duration keys, Esc=cancel
//            - NAVIGATION MODE (no panel/popup): B=book now, W=week toggle, T=timezone, arrows=navigate/focus
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
  onBookNow,
  onTimezoneToggle,
  onNavigate,
  onSlotFocusUp,
  onSlotFocusDown,
  onSlotSelect,
  isWeekView = false,
  enabled = true,
}) {
  const handleKeyDown = useCallback((e) => {
    if (!enabled) return;

    // VALIDATION: Ignore keypresses when user is typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();

    // === POPUP MODE (edit existing booking) ===
    // BEHAVIOR: When popup is open, only popup-specific shortcuts are active
    // WHY: User is focused on editing one booking; other shortcuts would be confusing
    if (onPopupClose || onPopupDelete || onPopupUserSelect || onPopupDurationSelect) {
      // BEHAVIOR: [D] key deletes the booking being edited
      if (key === 'd' && onPopupDelete) {
        e.preventDefault();
        onPopupDelete();
        return;
      }

      // BEHAVIOR: [Escape] key closes popup without changes
      if (e.key === 'Escape' && onPopupClose) {
        e.preventDefault();
        onPopupClose();
        return;
      }

      // BEHAVIOR: [Enter] key confirms changes and closes popup
      if (e.key === 'Enter' && onPopupClose) {
        e.preventDefault();
        onPopupClose();
        return;
      }

      // BEHAVIOR: User hotkeys (J/T/C/etc based on config) change booking owner
      // DATA_CONSTRAINT: User keys are defined in instance config, not hardcoded
      // EDGE_CASE: If config has user "Jack" with key "j", pressing J reassigns booking to Jack
      const user = users.find((u) => u.key.toLowerCase() === key);
      if (user && onPopupUserSelect) {
        e.preventDefault();
        onPopupUserSelect(user.name);
        return;
      }

      // BEHAVIOR: Duration keys (1/2/3) change booking duration
      // VALIDATION: Only works if new duration doesn't conflict with other bookings
      // EDGE_CASE: If extending from 1 hour to 3 hours would overlap another booking, shortcut is ignored
      const duration = DURATIONS.find((d) => d.key === key);
      if (duration && onPopupDurationSelect && canPopupChangeDuration) {
        if (canPopupChangeDuration(duration.value)) {
          e.preventDefault();
          onPopupDurationSelect(duration.value);
        }
        return;
      }

      // EDGE_CASE: Block all other keys while popup is open (prevent navigation shortcuts)
      return;
    }

    // === PANEL MODE (create new booking) ===
    // BEHAVIOR: When booking panel is open (slot selected), user can select person and duration

    // BEHAVIOR: User hotkeys select who the booking is for
    // DATA_CONSTRAINT: User keys are defined in instance config (e.g., J=Jack, T=Teagan)
    const user = users.find((u) => u.key.toLowerCase() === key);
    if (user && onUserSelect) {
      e.preventDefault();
      onUserSelect(user.name);
      return;
    }

    // BEHAVIOR: Duration keys (1/2/3) complete the booking with selected duration
    // VALIDATION: Only works if slot, user, and duration are valid (checked by caller)
    // DATA_FLOW: User selected -> duration selected -> booking created -> panel closes
    const duration = DURATIONS.find((d) => d.key === key);
    if (duration && onDurationSelect) {
      e.preventDefault();
      onDurationSelect(duration.value);
      return;
    }

    // BEHAVIOR: [Escape] key cancels booking panel (clears slot selection)
    if (e.key === 'Escape' && onCancel) {
      e.preventDefault();
      onCancel();
      return;
    }

    // === NAVIGATION MODE (no panel/popup open) ===
    // BEHAVIOR: Global shortcuts for view navigation and quick booking

    // BEHAVIOR: [W] key toggles between day view and week view
    if (key === 'w' && onWeekToggle) {
      e.preventDefault();
      onWeekToggle();
      return;
    }

    // BEHAVIOR: [B] key books current hour (if available)
    // VALIDATION: Only available if current hour is within booking hours and not already booked
    // WHY: Fastest way to book right now - single keypress
    if (key === 'b' && onBookNow) {
      e.preventDefault();
      onBookNow();
      return;
    }

    // BEHAVIOR: [T] key toggles timezone display between QLD time and NSW time
    // WHY: NSW users can see times in their local timezone during daylight saving
    if (key === 't' && onTimezoneToggle) {
      e.preventDefault();
      onTimezoneToggle();
      return;
    }

    // BEHAVIOR: [Up Arrow] moves focus to previous available slot (day view only)
    // EDGE_CASE: Wraps around - pressing up at first slot focuses last slot
    // WHY: Keyboard-only navigation through available slots
    if (e.key === 'ArrowUp' && onSlotFocusUp) {
      e.preventDefault();
      onSlotFocusUp();
      return;
    }

    // BEHAVIOR: [Down Arrow] moves focus to next available slot (day view only)
    // EDGE_CASE: Wraps around - pressing down at last slot focuses first slot
    if (e.key === 'ArrowDown' && onSlotFocusDown) {
      e.preventDefault();
      onSlotFocusDown();
      return;
    }

    // BEHAVIOR: [Enter] selects the currently focused slot (opens booking panel)
    // DATA_FLOW: Slot focused (via arrow keys) -> Enter pressed -> panel opens for that slot
    if (e.key === 'Enter' && onSlotSelect) {
      e.preventDefault();
      onSlotSelect();
      return;
    }

    // BEHAVIOR: [Left/Right Arrows] navigate to previous/next date
    // EDGE_CASE: In week view, moves by 7 days (previous/next week)
    //           In day view, moves by 1 day
    // WHY: Quick date navigation without clicking calendar
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
  }, [enabled, users, onPopupUserSelect, onPopupDurationSelect, onPopupDelete, onPopupClose, canPopupChangeDuration, onUserSelect, onDurationSelect, onCancel, onWeekToggle, onBookNow, onTimezoneToggle, onNavigate, onSlotFocusUp, onSlotFocusDown, onSlotSelect, isWeekView]);

  // BEHAVIOR: Register global keyboard listener when module initializes
  // WHY: Shortcuts work from anywhere in the app
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
