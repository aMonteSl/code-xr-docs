import { hero } from '@/content/heroContent';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useRotatingIndex } from '@/hooks/useRotatingIndex';

const HOLD_AND_FADE_MS = 5000;

// The phrases that explain what Code-XR is, crossfading in place.
//
// Zero layout shift comes from rendering EVERY line permanently, stacked in a
// single CSS grid cell. The container's height is therefore automatically the
// tallest line at the current width — correct at 320px, at any width, for any
// copy, forever. The old site hardcoded `h-24 sm:h-20 md:h-16`, a guess that
// breaks silently the first time someone edits a string.
//
// This is also why AnimatePresence would be the wrong tool: it unmounts the
// outgoing node, which destroys the height guarantee mid-transition. Keeping
// both mounted is also what makes this a true crossfade rather than the old
// site's fade-out-then-swap, which had a dead frame in it.
//
// Inactive lines must use opacity-0, never hidden/display:none — they have to
// keep participating in layout.
const HeroRotatingLine = () => {
  const prefersReducedMotion = useReducedMotion();
  const lines = hero.rotatingLines;
  const index = useRotatingIndex(lines.length, {
    intervalMs: HOLD_AND_FADE_MS,
    enabled: !prefersReducedMotion,
  });

  return (
    <>
      {/* Screen readers get one complete, static sentence instead. A live
          region re-announcing every five seconds would interrupt continuously,
          and none of this is new information. */}
      <p className="sr-only">{hero.accessibleDescription}</p>

      <div aria-hidden="true" className="mt-6 grid">
        {lines.map((line, position) => (
          <p
            key={line}
            data-rotating-line
            className={`col-start-1 row-start-1 mx-auto max-w-2xl text-base text-pretty text-ink-muted transition-[opacity,translate] duration-500 ease-out motion-reduce:transition-none sm:text-lg ${
              position === index
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-2 opacity-0'
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </>
  );
};

export default HeroRotatingLine;
