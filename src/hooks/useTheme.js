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

// Scopes the theme-reveal rules in main.css to THIS transition. Without it,
// the ::view-transition-*(root) rules written for the theme circle would also
// style every cross-document navigation (the @view-transition opt-in in
// main.css), replaying the reveal from its 50%/50% fallback origin on every
// page change.
const THEME_SWITCHING_CLASS = 'theme-switching';

// The most recent theme transition. A second toggle before the first finishes
// SKIPS the first, whose `finished` promise then settles and would strip the
// class out from under the still-running second one — only the latest owner
// may clean up.
let activeThemeTransition = null;

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

    // The class goes on synchronously BEFORE startViewTransition, so it is
    // present when the old snapshot is captured and the scoped CSS applies
    // for the transition's whole life.
    root.classList.add(THEME_SWITCHING_CLASS);

    // flushSync, not a bare call: the store notifies React, but a re-render
    // scheduled from inside a click handler would not commit until the handler
    // returns — after the "new" snapshot was taken. The sun/moon icon would
    // then be captured in its OLD state and pop once the transition ended.
    const transition = document.startViewTransition(() => flushSync(toggleThemeStore));
    activeThemeTransition = transition;

    // `finished` settles whether the transition ran or was skipped, but it
    // REJECTS if the update callback throws — cleanup therefore lives in
    // finally, and the trailing catch keeps that rejection from surfacing as
    // an unhandled one. A class left hanging would misroute the NEXT
    // cross-document navigation into the theme keyframes.
    transition.finished
      .finally(() => {
        if (activeThemeTransition === transition) {
          root.classList.remove(THEME_SWITCHING_CLASS);
          activeThemeTransition = null;
        }
      })
      .catch(() => {});
  }, []);

  return { theme, toggleTheme };
};
