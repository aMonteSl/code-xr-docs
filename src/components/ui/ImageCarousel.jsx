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
//
// WITH ONE SLIDE IT IS A STATIC FIGURE, not a carousel of one. The arrows, the
// counter and the progress bar all go: two arrows that cycle back to the same
// image, a "1 / 1", and an accent bar that fills and advances nothing are three
// separate lies about what the thing does. useCarousel already refuses to start
// a timer below two slides, so this is the visual half of the same rule.
//
// The caption row STAYS, expand button included. It is what keeps the frames of
// several cards in a grid on the same line: HighlightCard pins its carousel to
// the card's bottom edge, so dropping a 44px control row from one card would
// leave its screenshot sitting higher than its neighbour's.
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
  const isStatic = count < 2;
  const isMounted = (slideIndex) => Math.abs(slideIndex - index) <= 1;
  // No rotation to pause, so nothing to report. Keeps a static figure from
  // churning the parent's paused state on every hover.
  const reportPause = (paused) => {
    if (!isStatic) {
      onPauseChange(paused);
    }
  };

  const arrowClass =
    // The 44px hit area. The visuals live on the inner pill so it can shrink
    // below sm without shrinking the touch target: there is no swipe, so on
    // touch these arrows are the only way to step and cannot go — but two
    // size-11 pills at left/right-3 covered 41% of a 272px frame; 32px pills
    // at 4px insets cover 26%. The global :focus-visible ring lands on this
    // button, around the full hit area.
    'group/arrow absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center transition-[opacity] duration-300 focus-visible:opacity-100 motion-reduce:transition-none max-lg:opacity-100 lg:opacity-0 lg:group-hover/frame:opacity-100';
  const arrowPillClass =
    // hover:border-accent/40 is the shared signal for a carousel arrow, the
    // same one StepCarousel's use. group-hover/arrow:bg-surface stays on top
    // of it because it does real work here: the pill rests at /80 and
    // solidifying it is legibility over an arbitrary screenshot, not
    // decoration.
    'flex size-8 items-center justify-center rounded-full border border-edge bg-surface/80 text-ink backdrop-blur-sm transition-[background-color,border-color] duration-300 group-hover/arrow:border-accent/40 group-hover/arrow:bg-surface motion-reduce:transition-none sm:size-11';

  return (
    <figure
      className="flex h-full flex-col"
      onPointerEnter={() => reportPause(true)}
      onPointerLeave={() => reportPause(false)}
      onFocus={() => reportPause(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          reportPause(false);
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
        {isStatic ? null : (
          <>
            <button
              type="button"
              onClick={onPrev}
              aria-label={labels.previous}
              className={`${arrowClass} left-1 sm:left-3`}
            >
              <span className={arrowPillClass}>
                <ChevronLeft aria-hidden="true" className="size-4 sm:size-5" />
              </span>
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label={labels.next}
              className={`${arrowClass} right-1 sm:right-3`}
            >
              <span className={arrowPillClass}>
                <ChevronRight aria-hidden="true" className="size-4 sm:size-5" />
              </span>
            </button>
          </>
        )}

        {showProgress && !isStatic ? (
          // How long until the next slide. `key={index}` remounts the fill on
          // every change so the animation restarts from zero — covering the
          // autoplay tick and a manual click alike — and pausing it is the
          // visible feedback that hovering stopped the rotation.
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 z-10 h-0.5 bg-edge">
            <div
              key={index}
              style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
              // motion-reduce belt: today both callers derive showProgress
              // from an autoplay that reduced motion already disables, but a
              // dumb component must not depend on every future caller
              // repeating that derivation.
              className="h-full origin-left bg-accent animate-carousel-progress motion-reduce:animate-none"
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
          {isStatic ? null : (
            <span className="mr-1 text-xs tabular-nums text-ink-muted">
              {labels.counter(index + 1, count)}
            </span>
          )}
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
