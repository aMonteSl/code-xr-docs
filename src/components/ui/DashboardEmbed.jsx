import { useState } from 'react';
import { ExternalLink, Hand, LoaderCircle } from 'lucide-react';

// Dumb component: a real Code-XR dashboard export, embedded live. Ported from
// the previous site and retokenised. The only state is "has the iframe fired
// load yet" plus "has a touch visitor tapped in" — trivial UI state, no data,
// no copy: every string arrives through `labels`.
//
// Just the frame: the heading above it belongs to the section, so the video
// block and this one are introduced the same way.
//
// The exports are ~1.7 MB each with their own runtime, so the parent must only
// mount this when the visitor has actually asked to see it.
const DashboardEmbed = ({ title, url, labels, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-card border border-edge bg-surface-raised shadow-card ${className}`}
    >
      <div className="relative">
        <div className="aspect-[16/11] bg-surface-sunken xl:aspect-[16/10]">
          <iframe
            src={url}
            title={labels.frameLabel(title)}
            allow="fullscreen"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            aria-busy={!isLoaded}
            onLoad={() => setIsLoaded(true)}
            className="size-full border-0"
          />
        </div>

        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm">
            <p className="flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-4 py-2 text-sm text-ink-muted shadow-card">
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-accent motion-reduce:animate-none" />
              <span>{labels.loading}</span>
            </p>
          </div>
        ) : null}

        {/* Touch guard. The A-Frame scene inside the iframe owns every touch
            gesture, so a finger dragged across the frame rotates the camera
            instead of scrolling the page — a visitor scrolling past gets
            caught. Until the first deliberate tap this button absorbs the
            frame (a button does not capture touchmove, so drags over it
            scroll normally); after it, it unmounts and the scene gets the
            gestures it was tapped for. pointer-coarse, not a width breakpoint:
            the problem is the input device, not the viewport — a tablet at
            1024px captures gestures all the same, a narrow desktop with a
            mouse never does. Named by its visible text; sits below the
            "open in a new tab" anchor in the DOM, which therefore stays
            tappable on top. */}
        {isLoaded && !isInteractive ? (
          <button
            type="button"
            onClick={() => setIsInteractive(true)}
            className="absolute inset-0 hidden cursor-pointer items-center justify-center pointer-coarse:flex"
          >
            <span className="flex items-center gap-2 rounded-full border border-edge bg-surface-raised px-4 py-2 text-sm text-ink-muted shadow-card">
              <Hand aria-hidden="true" className="size-4 text-accent" />
              <span>{labels.interact}</span>
            </span>
          </button>
        ) : null}

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.openLabel(title)}
          className="absolute top-2 right-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-edge bg-surface/90 px-3 text-xs font-semibold text-ink backdrop-blur-sm transition-[border-color] duration-300 hover:border-accent/40 motion-reduce:transition-none"
        >
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span>{labels.open}</span>
        </a>
      </div>
    </div>
  );
};

export default DashboardEmbed;
