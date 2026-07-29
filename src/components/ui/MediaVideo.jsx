import { useRef, useState } from 'react';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { useInView } from '@/hooks/useInView';

// Dumb component: a video tile. The player starts itself, silently, once the
// tile is on screen, and nothing is requested from YouTube before that. Not
// wrapped in a button — the iframe has to stay interactive, so unlike a
// MediaCard this one is not a lightbox trigger.
//
// Was `sections/gallery/GalleryVideo`; the gallery grid and the analysis detail
// pages both need it. Its two pieces of state are the trivial UI kind this
// layer allows: a viewport flag and a one-way "already started" latch. Every
// string still arrives as a prop.
//
// It exists as its own component because it needs its own ref, and hooks
// cannot be called inside the parent's map.
const MediaVideo = ({
  title,
  src,
  poster,
  posterAlt,
  posterSizes,
  playLabel,
  badge,
  watchUrl,
  watchLabel,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref);
  // Sticky once set: a video started by hand must not be torn down again the
  // moment the tile scrolls out, which is exactly what isInView alone would do.
  const [wasActivated, setWasActivated] = useState(false);

  return (
    <div ref={ref} className="flex flex-col">
      <VideoEmbed
        isActive={isInView || wasActivated}
        src={src}
        title={title}
        poster={poster}
        posterAlt={posterAlt}
        posterSizes={posterSizes}
        onActivate={() => setWasActivated(true)}
        playLabel={`${playLabel}: ${title}`}
      />

      <div className="mt-2 flex items-start gap-2">
        <p className="min-w-0 flex-1 text-sm font-semibold text-pretty text-ink">{title}</p>
        {badge ? (
          <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
            {badge}
          </span>
        ) : null}
      </div>

      {watchUrl ? (
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="-my-2 inline-flex min-h-11 w-fit items-center text-xs font-semibold text-accent-strong underline underline-offset-4 transition-[color] duration-300 hover:text-ink motion-reduce:transition-none dark:text-accent"
        >
          {watchLabel}
        </a>
      ) : null}
    </div>
  );
};

export default MediaVideo;
