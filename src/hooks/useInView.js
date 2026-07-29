import { useEffect, useState } from 'react';

// Is this element on screen? Used to keep anything that moves — carousels,
// video embeds — idle until the visitor can actually see it, and to avoid
// requesting a third-party player for a video nobody is looking at.
//
// The observer is created in an effect and the setState lives in its callback,
// so there is no synchronous setState during render for the compiler-backed
// react-hooks rule to flag.
// threshold 0 on purpose: with a fractional threshold an element taller than
// the viewport can never reach the required ratio, so the crossing callback
// never fires and it stays marked as off screen forever. `isIntersecting` at
// threshold 0 answers the actual question, "is any of this visible".
export const useInView = (ref, { threshold = 0, rootMargin = '200px 0px' } = {}) => {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold, rootMargin }
    );

    observer.observe(element);

    // IntersectionObserver's first callback is asynchronous, so anything
    // already on screen at mount would spend a beat marked as off screen —
    // long enough to delay a video that should start as soon as you see it.
    // Seed it from geometry on the next tick (a timer, so this is never a
    // synchronous setState inside the effect body).
    const seedId = setTimeout(() => {
      const rect = element.getBoundingClientRect();

      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setIsInView(true);
      }
    }, 0);

    return () => {
      clearTimeout(seedId);
      observer.disconnect();
    };
  }, [ref, threshold, rootMargin]);

  return isInView;
};
