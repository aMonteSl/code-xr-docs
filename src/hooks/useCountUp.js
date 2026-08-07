import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const DURATION_MS = 900;

// Ease-out cubic: fast off the mark, gentle landing.
const ease = (t) => 1 - (1 - t) ** 3;

// Ramps 0 → target once, the first time a real number arrives. Returns the
// target immediately under reduced motion, and for anything that isn't a
// finite number.
export const useCountUp = (target) => {
  const prefersReducedMotion = useReducedMotion();
  const isAnimatable = typeof target === 'number' && Number.isFinite(target);
  const [value, setValue] = useState(isAnimatable && !prefersReducedMotion ? 0 : target);
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (!isAnimatable || prefersReducedMotion) {
      return undefined;
    }

    // One ramp per mount: if the value refreshes later (a background
    // revalidation), snap to it instead of replaying the animation.
    if (hasRunRef.current) {
      setValue(target);
      return undefined;
    }

    hasRunRef.current = true;

    let frameId = null;
    let startedAt = null;
    let settled = false;

    const step = (timestamp) => {
      startedAt ??= timestamp;
      const progress = Math.min((timestamp - startedAt) / DURATION_MS, 1);

      setValue(Math.round(target * ease(progress)));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        settled = true;
      }
    };

    frameId = requestAnimationFrame(step);

    // Safety net. requestAnimationFrame does not fire at all while the page is
    // not being rendered — a background tab, a hidden window — so without this
    // the card would sit on a literal "0", which is a WRONG figure rather than
    // a neutral placeholder. setTimeout is throttled in that state but still
    // fires, so it lands the real value. If rAF later resumes, its next frame
    // computes progress >= 1 and agrees, so there is no visible jump.
    const safetyId = setTimeout(() => {
      if (!settled) {
        setValue(target);
      }
    }, DURATION_MS + 600);

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      clearTimeout(safetyId);
    };
  }, [target, isAnimatable, prefersReducedMotion]);

  // Under reduced motion (and for anything not a finite number) the live
  // target is returned directly rather than the state above. That is not
  // belt-and-braces: the effect returns early on both of those paths, so it
  // never calls setValue, and `value` is frozen at whatever the initializer
  // saw on the FIRST render. On a cold cache that is `undefined` — the
  // Marketplace figures arrive a fetch later — so a reduced-motion visitor
  // was left with three permanently blank cards, and on a warm cache with
  // three permanently stale ones. Reading through fixes both without adding
  // an effect the compiler-backed lint rule would object to.
  return isAnimatable && !prefersReducedMotion ? value : target;
};
