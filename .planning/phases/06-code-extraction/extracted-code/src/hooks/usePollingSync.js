import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook for polling-based real-time sync
 *
 * @param {Function} fetchFn - Async function to call for fetching data
 * @param {Function} onUpdate - Callback when new data is received
 * @param {Object} options - Configuration options
 * @param {number} options.interval - Polling interval in milliseconds (default: 7000)
 * @param {boolean} options.enabled - Whether polling is enabled (default: true)
 */
export function usePollingSync(fetchFn, onUpdate, options = {}) {
  const { interval = 7000, enabled = true } = options;

  const intervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!isMountedRef.current || !enabled) return;

    try {
      const data = await fetchFn();
      if (isMountedRef.current && data !== null) {
        onUpdate(data);
      }
    } catch (error) {
      // Silently handle polling errors - don't interrupt user
      console.warn('Polling sync failed:', error.message);
    }
  }, [fetchFn, onUpdate, enabled]);

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

  // Return a function to manually trigger a sync
  return { triggerSync: poll };
}
