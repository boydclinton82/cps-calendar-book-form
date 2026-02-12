import { useState, useEffect } from 'react';

/**
 * Hook that triggers a re-render on the hour.
 * Used to dynamically clip past time slots as hours pass.
 */
export function useHourlyRefresh() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const scheduleHourlyRefresh = () => {
      const now = new Date();
      const msUntilNextHour =
        (60 - now.getMinutes()) * 60 * 1000 -
        now.getSeconds() * 1000 -
        now.getMilliseconds();

      return setTimeout(() => {
        setTick((t) => t + 1); // Force re-render
        scheduleHourlyRefresh(); // Schedule next hour
      }, msUntilNextHour);
    };

    const timeoutId = scheduleHourlyRefresh();
    return () => clearTimeout(timeoutId);
  }, []);

  return tick;
}
