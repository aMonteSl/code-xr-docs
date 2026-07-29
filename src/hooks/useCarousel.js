import { useCallback, useEffect, useRef, useState } from 'react';

// Index state + autoplay for a carousel over a fixed-length sequence.
//
// The dwell timer is RESUMABLE: pausing banks how much time was left and
// resuming continues from exactly there. This matters because the progress bar
// is a CSS animation that pauses and resumes the same way — with a plain
// setInterval the two clocks desynchronise, and after a hover the bar reaches
// the end and then sits there waiting for a full fresh interval to elapse.
// One elapsed-time model, two views of it.
//
// Manual navigation resets the timer to full: every slide gets its whole dwell
// time and a click is never trampled by a tick a moment later. The tab being
// hidden freezes it too, so returning never lands on a jump cut.
//
// All setState calls live in timer/event callbacks, clean for the
// compiler-backed react-hooks rule.
export const useCarousel = (length, { intervalMs = 6000, autoplay = true } = {}) => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Time left on the current slide, and when the current run started.
  const remainingRef = useRef(intervalMs);
  const startedAtRef = useRef(null);

  const bankElapsed = useCallback(() => {
    if (startedAtRef.current !== null) {
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
      startedAtRef.current = null;
    }
  }, []);

  const goTo = useCallback(
    (target) => {
      if (length > 0) {
        // A deliberate move restarts the dwell, matching the progress bar,
        // which remounts on index change.
        remainingRef.current = intervalMs;
        startedAtRef.current = null;
        setIndex(((target % length) + length) % length);
      }
    },
    [length, intervalMs]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const handleVisibilityChange = () => setIsHidden(document.hidden);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const isFrozen = isPaused || isHidden;

  useEffect(() => {
    if (!autoplay || isFrozen || length < 2) {
      bankElapsed();
      return undefined;
    }

    startedAtRef.current = Date.now();

    const timerId = setTimeout(() => {
      remainingRef.current = intervalMs;
      startedAtRef.current = null;
      setIndex((current) => (current + 1) % length);
    }, remainingRef.current);

    return () => {
      clearTimeout(timerId);
      bankElapsed();
    };
    // `index` is a deliberate dependency: advancing tears the timer down and
    // sets it up again for the new slide.
  }, [autoplay, isFrozen, length, intervalMs, index, bankElapsed]);

  return { index, goTo, next, prev, isFrozen, setPaused: setIsPaused };
};
