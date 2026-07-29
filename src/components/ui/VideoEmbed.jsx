import { Play } from 'lucide-react';
import Picture from '@/components/ui/Picture';

// Dumb component: a video that starts itself, silently, once the parent says
// it is on screen. Until then only the poster (one of our own screenshots) is
// rendered and nothing external has been requested.
//
// `poster` is a `{ src, sources }` pair from getReleaseImageSources, so the
// still costs a few tens of kB — it is the one thing that loads before the
// visitor has asked for anything, on every video tile in the gallery.
//
// The frame keeps a fixed aspect ratio in both states, so swapping the poster
// for the iframe shifts no layout.
//
// The play badge is a real control. It used to be a 56px filled accent circle
// centred over the poster, `aria-hidden` and with no handler — a large button
// that ignored clicks, because playback came only from `isActive`. Now it is
// small, translucent, corner-anchored (it no longer covers the screenshot,
// which is the actual content) and it starts the video on click. Pass
// `onActivate` to get the button; without it the same badge renders as the
// decorative marker it looks like.
//
// 44px hit area with a 16px glyph: the touch-target floor is non-negotiable,
// the visual weight is not.
const BADGE =
  'absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full border border-edge bg-surface/75 text-accent backdrop-blur-sm';

const VideoEmbed = ({
  isActive,
  src,
  title,
  poster,
  posterAlt,
  posterSizes,
  onActivate,
  playLabel,
  className = '',
}) => {
  return (
    // `isolate` plus a radius on the iframe itself: an iframe gets its own
    // compositing layer, so an ancestor's overflow-hidden + border-radius does
    // NOT clip it and its corners render square next to the carousel's.
    <div
      className={`relative isolate aspect-video overflow-hidden rounded-card border border-edge bg-surface-sunken shadow-card ${className}`}
    >
      {isActive ? (
        <iframe
          src={src}
          title={title}
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          // 11px, not rounded-card's 12px: the iframe covers the padding box,
          // whose corner radius is the outer radius minus the 1px border.
          // Matching it exactly makes the curve identical to the carousel's,
          // where the image is simply clipped by the same padding box.
          className="absolute inset-0 size-full rounded-[11px]"
        />
      ) : (
        <>
          <Picture
            src={poster.src}
            sources={poster.sources}
            alt={posterAlt}
            sizes={posterSizes}
            loading="lazy"
            decoding="async"
            className="size-full object-contain"
          />
          {onActivate ? (
            <button
              type="button"
              onClick={onActivate}
              aria-label={playLabel}
              className={`${BADGE} transition-[background-color,border-color] duration-300 hover:border-accent/40 hover:bg-surface motion-reduce:transition-none`}
            >
              <Play aria-hidden="true" className="size-4 translate-x-px fill-current" />
            </button>
          ) : (
            <span aria-hidden="true" className={BADGE}>
              <Play className="size-4 translate-x-px fill-current" />
            </span>
          )}
        </>
      )}
    </div>
  );
};

export default VideoEmbed;
