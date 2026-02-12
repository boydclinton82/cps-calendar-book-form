// BEHAVIOR: Background polling mechanism for real-time data synchronization
// DATA_FLOW: Every N seconds -> fetch from server -> if data changed, notify caller
// WHY: Multiple users can modify bookings; polling keeps everyone's view synchronized
// EDGE_CASE: Polling only runs when API is enabled; disabled in localStorage mode

import { useEffect, useRef, useCallback } from 'react';

/**
 * BEHAVIOR: Sets up recurring background fetch to keep local data synchronized with server
 * CONSTANT: Default interval is 7000ms (7 seconds) between polls
 * DATA_FLOW: Timer triggers -> call fetchFn -> receive fresh data -> call onUpdate with data
 * VALIDATION: Silently handles errors (logs but doesn't interrupt user experience)
 * WHY: Errors in background sync shouldn't show error messages to user
 *
 * @param {Function} fetchFn - Async function to call for fetching data (e.g., fetchBookings)
 * @param {Function} onUpdate - Callback when new data is received (e.g., update local cache)
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 7000)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 */
export function usePollingSync(fetchFn, onUpdate, options = {}) {
  const { interval = 7000, enabled = true } = options;

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  // BEHAVIOR: Execute a single poll - fetch data and notify if successful
  // EDGE_CASE: If component unmounts during fetch, discard result
  // EDGE_CASE: If fetch returns null, don't call onUpdate (preserves existing data)
  const poll = useCallback(async () => {
    if (!isMountedRef.current || !enabled) return;

    try {
      const data = await fetchFn();
      if (isMountedRef.current && data !== null) {
        onUpdate(data);
      }
    } catch (error) {
      // VALIDATION: Silently handle polling errors - don't interrupt user
      // WHY: Background sync failures shouldn't show error dialogs
      console.warn('Polling sync failed:', error.message);
    }
  }, [fetchFn, onUpdate, enabled]);

  // BEHAVIOR: Start polling when module initializes; stop when it unmounts
  // DATA_FLOW: Mount -> start interval timer -> every N seconds call poll() -> unmount -> stop timer
  // WHY: Continuous sync keeps multiple users' views consistent
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      return;
    }

    // Start polling
    intervalRef.current = setInterval(poll, interval);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [poll, interval, enabled]);

  // BEHAVIOR: Return a function to manually trigger a sync (e.g., after mutation error)
  // WHY: Optimistic updates need rollback mechanism - manual sync re-fetches truth from server
  return { triggerSync: poll };
}
