// Timezone preference storage

const TZ_PREFERENCE_KEY = 'cps-timezone-preference';

export function getTimezonePreference() {
  try {
    const value = localStorage.getItem(TZ_PREFERENCE_KEY);
    return value === 'NSW';
  } catch (error) {
    console.error('Error reading timezone preference:', error);
    return false; // Default to QLD
  }
}

export function saveTimezonePreference(useNSW) {
  try {
    localStorage.setItem(TZ_PREFERENCE_KEY, useNSW ? 'NSW' : 'QLD');
    return true;
  } catch (error) {
    console.error('Error saving timezone preference:', error);
    return false;
  }
}
