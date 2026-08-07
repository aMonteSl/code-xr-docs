import { Check, Clock } from 'lucide-react';

const RADIUS = 28;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
};

// The step clock, ported from the previous site: a ring that fills while you
// are on a step, and a filled mark once it has run its stated length.
//
// Done is the solid accent circle, not a green one. Introducing a second hue
// for one state would break the palette, which differentiates by weight; the
// filled disc against the outlined ring already reads as finished.
//
// The ring is aria-hidden and is deliberately NOT a progressbar. It used to be
// one, with aria-valuenow rewritten once a second for the whole length of a
// step — and a progressbar whose value moves is reported by screen readers on
// their own initiative: NVDA beeps on every change, JAWS speaks a percentage.
// That is an interruption per second, for minutes, four steps running. Nothing
// is lost by hiding it: the step's stated length is in the picker above, the
// elapsed figure below the ring stays exposed as ordinary text, and "Completed"
// is on the picker's own button. A graphic that duplicates text it sits next to
// does not need a role.
const StepProgress = ({ elapsed, total, isCompleted, completedLabel }) => {
  if (isCompleted) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span
          aria-hidden="true"
          className="flex size-16 items-center justify-center rounded-full bg-accent text-on-accent"
        >
          <Check className="size-7" />
        </span>
        <span className="text-xs font-semibold text-accent-strong dark:text-accent">
          {completedLabel}
        </span>
      </div>
    );
  }

  return (
    // The whole running clock is hidden, ring AND figure. Hiding only the ring
    // left the elapsed reading below it as a bare unlabelled duration —
    // "1min 23s" with nothing saying what it counts, which is worse than
    // silence. It carries nothing a reader needs: the step's stated length is
    // in the picker above and the walkthrough is fully operable without it.
    <div aria-hidden="true" className="flex flex-col items-center gap-1">
      <div className="relative size-16">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            className="stroke-edge"
          />
          <circle
            cx="32"
            cy="32"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(elapsed / total, 1))}
            className="stroke-accent transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
          />
        </svg>
        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
          <Clock className="size-5 text-ink-muted" />
        </span>
      </div>
      <span className="text-xs font-medium tabular-nums text-ink-muted">{formatTime(elapsed)}</span>
    </div>
  );
};

export default StepProgress;
