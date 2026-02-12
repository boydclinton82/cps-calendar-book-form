// BEHAVIOR: Timezone preference persistence - stores user's timezone display choice
// DATA_CONSTRAINT: Stores "NSW" or "QLD" in browser localStorage with key 'cps-timezone-preference'
// WHY: User's timezone preference should persist across sessions

const TZ_PREFERENCE_KEY = 'cps-timezone-preference';

// BEHAVIOR: Retrieve timezone preference from browser storage
// DATA_CONSTRAINT: Returns boolean - true if user prefers NSW time, false for QLD time (default)
// EDGE_CASE: If storage is unavailable or key doesn't exist, defaults to false (QLD time)
export function getTimezonePreference() {
  try {
    const value = localStorage.getItem(TZ_PREFERENCE_KEY);
    return value === 'NSW';
  } catch (error) {
    console.error('Error reading timezone preference:', error);
    return false; // Default to QLD
  }
}

// BEHAVIOR: Save timezone preference to browser storage
// VALIDATION: Converts boolean to string "NSW" or "QLD" for storage
// EDGE_CASE: Returns false if storage fails (private mode, quota exceeded)
export function saveTimezonePreference(useNSW) {
  try {
    localStorage.setItem(TZ_PREFERENCE_KEY, useNSW ? 'NSW' : 'QLD');
    return true;
  } catch (error) {
    console.error('Error saving timezone preference:', error);
    return false;
  }
}
