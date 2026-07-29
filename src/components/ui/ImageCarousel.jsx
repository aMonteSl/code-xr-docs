import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import Picture from '@/components/ui/Picture';

// Dumb, fully controlled carousel. The parent owns the slide sequence, the
// index, the autoplay policy and the lightbox — this only renders and reports.
//
// A slide is `{ src, sources, alt }`: the first two come straight from
// getReleaseImageSources, so the deck costs tens of kB per slide rather than
// the megabytes the 2x originals would. Only the current slide and its two
// neighbors are mounted; the hidden neighbors preload so the next tick or
// click shows instantly. The frame's size comes in through `frameClassName`
// so the component stays reusable and the section decides how big it gets —
// `sizes` is that same decision expressed for the image loader.
const ImageCarousel = ({
  slides,
  index,
  isPaused,
  showProgress = false,
  frameClassName = 'aspect-video',
  sizes,
  onPrev,
  onNext,
  onExpand,
  onPauseChange,
  labels,
}) => {
  const count = slides.length;
  const isMounted = (slideIndex) => Math.abs(slideIndex - index) <= 1;

  const arrowClass =
    // hover:border-accent/40 is the shared signal for a carousel arrow, the
    // same one StepCarousel's use. hover:bg-surface stays on top of it because
    // it does real work here: the pill rests at /80 and solidifying it is
    // legibility over an arbitrary screenshot, not decoration.
    'absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-edge bg-surface/80 text-ink backdrop-blur-sm transition-[background-color,border-color,opacity] duration-300 hover:border-accent/40 hover:bg-surface focus-visible:opacity-100 motion-reduce:transition-none max-lg:opacity-100 lg:opacity-0 lg:group-hover/frame:opacity-100';

  return (
    <figure
      className="flex h-full flex-col"
      onPointerEnter={() => onPauseChange(true)}
      onPointerLeave={() => onPauseChange(false)}
      onFocus={() => onPauseChange(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onPauseChange(false);
        }
      }}
    >
      <div
        className={`group/frame relative overflow-hidden rounded-card border border-edge bg-surface-sunken shadow-card ${frameClassName}`}
      >
        {slides.map((slide, slideIndex) =>
          isMounted(slideIndex) ? (
            <button
              key={slide.src}
              type="button"
              onClick={onExpand}
              aria-label={labels.expand}
              tabIndex={slideIndex === index ? undefined : -1}
              aria-hidden={slideIndex === index ? undefined : 'true'}
              className={`absolute inset-0 cursor-zoom-in transition-[opacity] duration-300 motion-reduce:transition-none ${
                slideIndex === index ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              <Picture
                src={slide.src}
                sources={slide.sources}
                alt={slide.alt}
                sizes={sizes}
                loading="lazy"
                decoding="async"
                className="size-full object-contain"
              />
            </button>
          ) : null
        )}

        {/* Siblings of the expand buttons, never children: a button nested in
            a button is invalid HTML and breaks activation. */}
        <button
          type="button"
          onClick={onPrev}
          aria-label={labels.previous}
          className={`${arrowClass} left-3`}
        >
          <ChevronLeft aria-hidden="true" className="size-5" />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label={labels.next}
          className={`${arrowClass} right-3`}
        >
          <ChevronRight aria-hidden="true" className="size-5" />
        </button>

        {showProgress ? (
          // How long until the next slide. `key={index}` remounts the fill on
          // every change so the animation restarts from zero — covering the
          // autoplay tick and a manual click alike — and pausing it is the
          // visible feedback that hovering stopped the rotation.
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-edge">
            <div
              key={index}
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
              className="h-full origin-left bg-accent animate-carousel-progress"
            />
          </div>
        ) : null}
      </div>

      {/* The caption gets its own full-width row on mobile (sharing a row
          with the controls leaves it ~100px wide and long alts wrapped to 5
          lines — measured CLS 0.116). line-clamp-2 + min-h-10 make its height
          a constant 2 lines by construction, so slide changes shift nothing;
          the full text is always available in the lightbox. */}
      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <figcaption className="line-clamp-2 min-h-10 text-sm text-pretty text-ink-muted sm:flex-1">
          {slides[index]?.alt}
        </figcaption>

        <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
          <span className="mr-1 text-xs tabular-nums text-ink-muted">
            {labels.counter(index + 1, count)}
          </span>
          <button
            type="button"
            onClick={onExpand}
            aria-label={labels.expand}
            className="flex size-11 items-center justify-center rounded-lg text-ink-muted transition-[color,background-color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none"
          >
            <Maximize2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </figure>
  );
};

export default ImageCarousel;
