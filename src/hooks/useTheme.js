import { useCallback, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { getTheme, subscribe, toggleTheme as toggleThemeStore } from '@/lib/theme';

// Current theme ('light' | 'dark') plus a toggle. useSyncExternalStore keeps
// this free of setState-in-effect, and the store is the same one the inline
// index.html snippet agrees with.
//
// The toggle wraps the store in a view transition so the whole page changes as
// one composited snapshot. Without it the switch is visibly two things at once:
// `body` fades over 300ms (see main.css) while every card, border and the
// navbar flip on a single frame — worse than no animation, because the page
// disagrees with itself for a third of a second.
//
// The animation itself lives in main.css; this only decides whether to run one
// and where it starts from. Everything degrades to the plain instant switch:
// no API, or reduced motion, and the store is called directly.
const canAnimate = () =>
  typeof document.startViewTransition === 'function' &&
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light');

  // Takes the click event so the reveal can start at the button the reader
  // actually pressed. Keyboard activation gives one too, and its currentTarget
  // is the same button — no mouse coordinates involved.
  const toggleTheme = useCallback((event) => {
    if (!canAnimate()) {
      toggleThemeStore();
      return;
    }

    const rect = event?.currentTarget?.getBoundingClientRect?.();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;

    // Reach the farthest corner, or the circle stops short of the far edge and
    // leaves a wedge of the old theme behind.
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY)
    );

    const root = document.documentElement;
    root.style.setProperty('--theme-origin-x', `${originX}px`);
    root.style.setProperty('--theme-origin-y', `${originY}px`);
    root.style.setProperty('--theme-origin-radius', `${radius}px`);

    // flushSync, not a bare call: the store notifies React, but a re-render
    // scheduled from inside a click handler would not commit until the handler
    // returns — after the "new" snapshot was taken. The sun/moon icon would
    // then be captured in its OLD state and pop once the transition ended.
    document.startViewTransition(() => flushSync(toggleThemeStore));
  }, []);

  return { theme, toggleTheme };
};
