import { useEffect, useState } from 'react';

// Cycles 0..count-1 on an interval. Pass `enabled: false` (reduced motion, a
// single item) to freeze it at 0.
//
// The timer pauses while the tab is hidden so returning to it never lands on a
// jump cut mid-transition.
export const useRotatingIndex = (count, { intervalMs = 5000, enabled = true } = {}) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || count < 2) {
      return undefined;
    }

    let timerId = null;

    const start = () => {
      timerId ??= setInterval(() => setIndex((current) => (current + 1) % count), intervalMs);
    };

    const stop = () => {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const handleVisibilityChange = () => (document.hidden ? stop() : start());

    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [count, intervalMs, enabled]);

  // If the list shrinks below the current index, clamp rather than render blank.
  return count > 0 ? index % count : 0;
};
