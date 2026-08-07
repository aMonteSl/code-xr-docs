import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Lightbulb, Play, Search, Settings, Zap } from 'lucide-react';
import { install } from '@/content/installContent';
import { useInView } from '@/hooks/useInView';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import StepProgress from '@/sections/install/StepProgress';

const ICONS = { settings: Settings, play: Play, zap: Zap, search: Search };

// The first-run walkthrough: one step at a time, as the previous site had it,
// with its clock kept intact — while the block is on screen the active step
// counts up to its stated length, is marked as done, and the walkthrough moves
// on to the next step with the counter restarting against ITS duration. Going
// back to a finished step takes its mark off and runs it again from zero.
//
// Two things had to change to survive this codebase, neither of them visible:
//
//   - the deferred reset uses setTimeout, not requestAnimationFrame. The old
//     one used rAF, which fires zero frames in the verification browser, so
//     the reset would never run and could never be checked. Both setState
//     calls also live inside timer callbacks, which is what the compiler-backed
//     react-hooks rule requires.
//   - the arrow and number keys are bound to this block, not to window. The
//     old one listened globally, which would have stolen the arrow keys from
//     the Collaboration carousel and from ordinary page scrolling.
const QuickStart = () => {
  const { quickStart } = install;
  const ref = useRef(null);
  const isInView = useInView(ref);
  const prefersReducedMotion = useReducedMotion();

  const [current, setCurrent] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);
  const [elapsed, setElapsed] = useState(0);

  const step = quickStart.steps[current];
  const total = step.durationMinutes * 60;
  const isCompleted = completedIds.includes(step.id);

  useEffect(() => {
    // Reduced motion also stops the ticker: content advancing on its own
    // under the reader is played-back motion even though no pixel animates.
    // The walkthrough stays fully manual — the pills, arrows and keys below
    // never touch this effect's timers.
    if (!isInView || prefersReducedMotion) {
      return undefined;
    }

    const active = quickStart.steps[current];
    const seconds = active.durationMinutes * 60;
    const done = completedIds.includes(active.id);

    // Deferred so the effect body never calls setState synchronously.
    const seedId = setTimeout(() => setElapsed(done ? seconds : 0), 0);

    if (done) {
      return () => clearTimeout(seedId);
    }

    let value = 0;
    const tickId = setInterval(() => {
      value += 1;
      setElapsed(value);

      if (value >= seconds) {
        clearInterval(tickId);

        const nextIndex = current + 1;
        const hasNext = nextIndex < quickStart.steps.length;
        // Clearing the destination's mark keeps the chain running even over
        // steps that were finished earlier. Only when there IS a next step:
        // on the last one the destination is itself, and wiping its mark
        // would restart it forever.
        const nextId = hasNext ? quickStart.steps[nextIndex].id : null;

        setCompletedIds((previous) => {
          const marked = previous.includes(active.id) ? previous : [...previous, active.id];
          return nextId ? marked.filter((id) => id !== nextId) : marked;
        });

        if (hasNext) {
          setCurrent(nextIndex);
        }
      }
    }, 1000);

    return () => {
      clearTimeout(seedId);
      clearInterval(tickId);
    };
  }, [completedIds, current, isInView, prefersReducedMotion, quickStart.steps]);

  // Navigating to a step starts it over: its mark comes off so the clock runs
  // again from zero. The guard returns the same array when there was nothing
  // to remove, because a fresh array would re-run the effect and reset the
  // progress of a step you only clicked to stay on.
  const go = (index) => {
    const target = Math.min(Math.max(index, 0), quickStart.steps.length - 1);
    const targetId = quickStart.steps[target].id;

    setCurrent(target);
    setCompletedIds((previous) =>
      previous.includes(targetId) ? previous.filter((id) => id !== targetId) : previous
    );
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(current + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(current - 1);
    } else if (event.key >= '1' && event.key <= String(quickStart.steps.length)) {
      event.preventDefault();
      go(Number(event.key) - 1);
    }
  };

  const StepIcon = ICONS[step.icon];
  const navButton =
    'flex min-h-11 items-center gap-2 rounded-lg border border-edge px-4 text-sm font-semibold text-ink transition-[border-color,color] duration-300 hover:border-accent/40 motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-40';

  return (
    // The keydown sits on the wrapper rather than on window: it only acts when
    // focus is already on one of the buttons inside, which is exactly when the
    // visitor means to drive this block.
    <div ref={ref} onKeyDown={onKeyDown}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-lg font-bold tracking-tight text-ink">{quickStart.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-ink-muted">
          <Clock aria-hidden="true" className="size-4 text-accent" />
          {quickStart.totalTime}
        </p>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{quickStart.intro}</p>

      {/* Step picker. Carries each step's length and whether it is done, so the
          whole walkthrough is legible without touring it. */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {quickStart.steps.map((item, index) => {
          const ItemIcon = ICONS[item.icon];
          const isActive = index === current;
          const done = completedIds.includes(item.id);

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(index)}
              aria-current={isActive ? 'step' : undefined}
              aria-label={quickStart.goToStep(index + 1, item.title)}
              className={`flex min-h-11 items-center gap-3 rounded-card border p-3 text-left transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none ${
                isActive
                  ? 'border-transparent bg-accent text-on-accent hover:bg-accent-strong'
                  : 'border-edge bg-surface-raised text-ink hover:border-accent/40'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  isActive ? 'bg-on-accent/15 text-on-accent' : 'border border-edge bg-surface text-accent'
                }`}
              >
                {ItemIcon ? <ItemIcon className="size-4" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.title}</span>
                <span
                  className={`block text-xs ${isActive ? 'text-on-accent' : 'text-ink-muted'}`}
                >
                  {quickStart.minutes(item.durationMinutes)}
                  {done ? ` · ${quickStart.completed}` : ''}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-card border border-edge bg-surface-raised shadow-card">
        <div className="flex flex-col gap-5 border-b border-edge p-5 sm:flex-row sm:items-center sm:p-6">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-card border border-edge bg-surface text-accent"
          >
            {StepIcon ? <StepIcon className="size-6" /> : null}
          </span>

          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
              <span className="font-semibold text-accent-strong dark:text-accent">
                {quickStart.stepLabel(current + 1)}
              </span>
              <span className="flex items-center gap-1">
                <Clock aria-hidden="true" className="size-3.5" />
                {quickStart.minutes(step.durationMinutes)}
              </span>
            </p>
            <h4 className="mt-1 text-xl font-bold tracking-tight text-balance text-ink sm:text-2xl">
              {step.title}
            </h4>
            <p className="mt-1 text-base text-pretty text-ink-muted">{step.description}</p>
          </div>

          <StepProgress
            elapsed={elapsed}
            total={total}
            isCompleted={isCompleted}
            label={quickStart.progressLabel(step.title)}
            completedLabel={quickStart.completed}
          />
        </div>

        <div className="@container space-y-5 p-5 sm:p-6">
          <div>
            <p className="text-sm font-semibold tracking-wide text-ink uppercase">
              {quickStart.detailsTitle}
            </p>
            <ol className="mt-3 space-y-3">
              {step.details.map((detail, index) => (
                <li key={detail} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-xs font-bold tabular-nums text-ink"
                  >
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
                    {detail}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex gap-3 rounded-card border border-accent/40 bg-surface p-4">
            <Lightbulb aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{quickStart.tipTitle}</p>
              <p className="mt-1 text-sm text-pretty text-ink-muted">{step.tip}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-edge p-4 sm:p-5">
          <button
            type="button"
            onClick={() => go(current - 1)}
            disabled={current === 0}
            className={navButton}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">{quickStart.previous}</span>
          </button>

          <div aria-hidden="true" className="flex items-center gap-2">
            {quickStart.steps.map((item, index) => (
              <span
                key={item.id}
                className={`size-2.5 rounded-full transition-[background-color] duration-300 motion-reduce:transition-none ${
                  index === current
                    ? 'bg-accent'
                    : completedIds.includes(item.id)
                      ? 'bg-accent/50'
                      : 'bg-edge'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(current + 1)}
            disabled={current === quickStart.steps.length - 1}
            className={navButton}
          >
            <span className="hidden sm:inline">{quickStart.next}</span>
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickStart;
