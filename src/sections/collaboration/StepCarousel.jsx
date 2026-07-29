import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCarousel } from '@/hooks/useCarousel';
import StepCard from '@/sections/collaboration/StepCard';

// The walkthrough as a track: the active step centered, the previous and next
// steps peeking in from the sides, dimmed and slightly scaled down — you can
// always see where you came from and where you are going, which is exactly
// what the stacked layout gave up when it stopped scrolling.
//
// Deliberately NO autoplay: this is a tutorial, the reader sets the pace.
// Navigation: the arrows, clicking a peeking card, or the numbered pill for
// any step (each pill carries its role, so the host/guest sequence is visible
// at a glance without touring the steps).
//
// Height: all six cards share the tallest one's height (items-stretch), so the
// card edges and the peeking neighbours line up at every step and the section
// never resizes as you navigate. The leftover space inside the shorter steps
// is not left empty — the card hands it to its capture, see StepCard.
//
// Geometry: every slide is var(--step-w) wide inside a full-width track, so
// translateX percentages (which resolve against the track's own box) line up
// with the outer container.
const StepCarousel = ({ steps, roles, labels, expandLabel, onExpand }) => {
  const { index, goTo } = useCarousel(steps.length, { autoplay: false });

  // useCarousel's goTo wraps modulo-length; a tutorial must not loop, so all
  // navigation goes through this clamp and the arrows disable at the ends.
  const goClamped = (target) => goTo(Math.min(Math.max(target, 0), steps.length - 1));

  const arrowClass =
    'flex size-11 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-ink transition-[border-color,opacity] duration-300 hover:border-accent/40 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-40';

  return (
    <div>
      {/* Controls sit above the track, not over it: the track's height follows
          the active card, and arrows centered inside it would drift under the
          cursor on every step change. */}
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => goClamped(index - 1)}
          disabled={index === 0}
          aria-label={labels.previousStep}
          className={arrowClass}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {steps.map((step, position) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goClamped(position)}
              aria-label={labels.goToStep(position + 1, step.title)}
              aria-current={position === index ? 'step' : undefined}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none sm:px-3.5 ${
                position === index
                  ? 'border-transparent bg-accent text-on-accent hover:bg-accent-strong'
                  : 'border-edge text-ink-muted hover:border-accent/40 hover:text-ink'
              }`}
            >
              <span className="tabular-nums">{position + 1}</span>
              <span className="text-xs font-medium uppercase tracking-wide opacity-80">
                {roles[step.role]}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => goClamped(index + 1)}
          disabled={index === steps.length - 1}
          aria-label={labels.nextStep}
          className={arrowClass}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>
      </div>

      {/* The track. It clips its own overflow (the peeks); the section and the
          document never scroll horizontally because of it. */}
      <div className="relative mt-6 overflow-hidden [--step-w:86%] sm:[--step-w:84%] lg:[--step-w:80%]">
        <div
          className="flex items-stretch transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{
            transform: `translateX(calc(50% - (var(--step-w) * ${index}) - (var(--step-w) / 2)))`,
          }}
        >
          {steps.map((step, position) => {
            const isActive = position === index;

            return (
              <div
                key={step.id}
                aria-hidden={isActive ? undefined : 'true'}
                className={`relative w-[var(--step-w)] shrink-0 px-2 transition-[opacity,transform] duration-500 motion-reduce:transition-none sm:px-3 ${
                  isActive ? 'opacity-100 scale-100' : 'opacity-50 sm:scale-[0.96]'
                }`}
              >
                <StepCard
                  step={step}
                  position={position + 1}
                  roleLabel={roles[step.role]}
                  expandLabel={expandLabel}
                  onExpand={onExpand}
                  isActive={isActive}
                />

                {/* Peek cards navigate on click. A transparent sibling overlay
                    rather than wrapping the card: the card contains buttons,
                    and a button inside a button is invalid HTML. */}
                {!isActive ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => goClamped(position)}
                    aria-label={labels.goToStep(position + 1, step.title)}
                    className="absolute inset-0 z-10"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StepCarousel;
