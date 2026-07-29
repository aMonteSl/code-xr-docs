import { useEffect, useState } from 'react';

// Which section the reader is currently in, for the navbar's active link.
//
// Driven by scroll position rather than IntersectionObserver on purpose. With
// sections this tall the honest question is "which one is under the navbar",
// and an observer answers a different one — which are *visible*, often three at
// once on a wide screen, with no ordering between the callbacks to break the
// tie. Reading the tops and taking the last one past the line is both simpler
// and exactly the question.
//
// Matches `scroll-padding-top: 4.5rem` in main.css (72px): an anchor jump
// leaves the target's top at 72, so the line sits just below that and the
// section it landed on is active the moment it arrives.
const OFFSET = 88;

// `ids` must be a stable reference — a fresh array every render would re-run
// the effect every render. Callers keep it at module scope.
export const useActiveSection = (ids) => {
  // Null, not ids[0]: above the first listed section the reader is in the hero,
  // which has no nav entry, and nothing should be highlighted.
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const update = () => {
      // The last section is usually too short to ever reach the line — the page
      // stops scrolling first — so at the bottom it is claimed outright.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

      if (scrolledToBottom) {
        setActiveId(ids.at(-1) ?? null);
        return;
      }

      let current = null;

      for (const id of ids) {
        const element = document.getElementById(id);

        if (element && element.getBoundingClientRect().top <= OFFSET) {
          current = id;
        }
      }

      setActiveId(current);
    };

    // Deliberately not called here: a synchronous setState in an effect is what
    // the compiler-backed lint rule rejects, and it would be redundant anyway —
    // null is already correct for a load at the top, and a load that restores
    // scroll or jumps to a hash fires the listener below.
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [ids]);

  return activeId;
};
