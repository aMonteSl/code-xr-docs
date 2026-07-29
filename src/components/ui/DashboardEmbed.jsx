import { useState } from 'react';
import { ExternalLink, LoaderCircle } from 'lucide-react';

// Dumb component: a real Code-XR dashboard export, embedded live. Ported from
// the previous site and retokenised. The only state is "has the iframe fired
// load yet", which drives the overlay — trivial UI state, no data, no copy:
// every string arrives through `labels`.
//
// Just the frame: the heading above it belongs to the section, so the video
// block and this one are introduced the same way.
//
// The exports are ~1.7 MB each with their own runtime, so the parent must only
// mount this when the visitor has actually asked to see it.
const DashboardEmbed = ({ title, url, labels, className = '' }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={`overflow-hidden rounded-card border border-edge bg-surface-raised shadow-card ${className}`}
    >
      <div className="relative">
        <div className="aspect-[16/11] bg-surface-sunken md:aspect-[4/3] xl:aspect-[16/10]">
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
