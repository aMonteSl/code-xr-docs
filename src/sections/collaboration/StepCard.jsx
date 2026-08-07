import Picture from '@/components/ui/Picture';
import { getReleaseImageSources } from '@/lib/assets';

const RELEASE = 'v1-2-0';

// Derived from the real track, not guessed. Formula (re-derive if StepCarousel
// changes --step-w or its paddings, this card its own, or Container its
// gutters):
//   image col = frac × (stepW × (100vw − gutters) − slidePad − cardPad − colGap)
// with, per breakpoint:
//   gutters:  Container px-6 → 48px, sm:px-8 → 64px; content caps at 1280px
//             (84rem − 64) once the viewport hits 1344.
//   stepW:    --step-w 94% / sm 84% / lg 80% (StepCarousel track).
//   slidePad: px-2 → 16px, sm:px-3 → 24px.  cardPad: p-4 → 32px, sm:p-6 → 48px.
//   frac/gap: single column below lg (frac 1, no gap); at lg the card splits
//             with gap-8 (32px) and the image column takes at most 5/8.
//   ≥1344: 5/8 × (0.80 × 1280 − 24 − 48 − 32)        = 575px
//   ≥1024: 5/8 × (0.80(100vw − 64) − 24 − 48 − 32)   = 50vw − 97px
//   ≥640:  0.84(100vw − 64) − 24 − 48                 = 84vw − 126px
//   base:  0.94(100vw − 48) − 16 − 32                 = 94vw − 93px
// Several images are capped well below all of this by their own pixel width
// (the `min(100%, Wpx)` below) — which only makes an overshoot here free.
const SIZES =
  '(min-width: 1344px) 575px, (min-width: 1024px) calc(50vw - 97px), (min-width: 640px) calc(84vw - 126px), calc(94vw - 93px)';

// Role chips differentiate by WEIGHT, not hue (the palette rule): the host is
// the solid fill, the guest the outline, and shared steps stay neutral.
const ROLE_CHIP = {
  host: 'bg-accent text-on-accent',
  guest: 'border border-accent text-accent-strong dark:text-accent',
  both: 'border border-edge text-ink-muted',
};

// How each card splits its width, because a 50/50 grid wastes space on both
// sides here: step 6 is a long script next to a 266x75 strip (the text wants
// the room), while step 4 is one line of caption next to a 920x792 capture
// (the image wants it). Mirrored steps place the image in the FIRST grid
// track, so every weight needs its flipped twin — hence the pairs.
const SPLIT = {
  balanced: { normal: 'lg:grid-cols-2', mirrored: 'lg:grid-cols-2' },
  textWide: { normal: 'lg:grid-cols-[3fr_2fr]', mirrored: 'lg:grid-cols-[2fr_3fr]' },
  imageWide: { normal: 'lg:grid-cols-[2fr_3fr]', mirrored: 'lg:grid-cols-[3fr_2fr]' },
  textWidest: { normal: 'lg:grid-cols-[5fr_3fr]', mirrored: 'lg:grid-cols-[3fr_5fr]' },
};

// Keyed by step id. A wider column makes a capture bigger but also makes it
// TALLER, so the two portrait-ish steps (2 and 5) deliberately take less width
// instead of driving every other card's height up with them.
const STEP_SPLIT = {
  share: 'imageWide',
  identity: 'textWide',
  code: 'imageWide',
  connect: 'imageWide',
  burnt: 'textWide',
  control: 'textWidest',
};

// One step of the walkthrough, living inside the step carousel: it carries its
// own card chrome and fills the track's equalized height. The side still
// encodes the role (host text-left, guest/both mirrored).
//
// Filling that equalized height is the whole point of the layout here. The
// tallest step sets the height for all six, so every other card had a void
// under it. Instead:
//   - the text row is auto-sized and the image row takes ALL the rest
//     (grid-rows-[auto_minmax(0,1fr)]; on lg the two become columns and the
//     single row is the full card height),
//   - each capture claims an equal share of that leftover with flex-1, and
//     grows into it — no fixed max-height cap.
// Growth stops at the file's own pixel size (max-w from `w`): these are flat
// screenshots, and one of them is a 266x75 strip, so upscaling would only
// blur it. Together with width/height that also reserves the box before load.
const StepCard = ({ step, position, roleLabel, expandLabel, onExpand, isActive = true }) => {
  const mirrored = step.role !== 'host';
  const split = SPLIT[STEP_SPLIT[step.id] ?? 'balanced'][mirrored ? 'mirrored' : 'normal'];

  return (
    <div
      className={`grid h-full grid-rows-[auto_minmax(0,1fr)] gap-6 rounded-card border border-edge bg-surface-raised p-4 shadow-card sm:p-6 lg:grid-rows-[minmax(0,1fr)] lg:gap-8 ${split}`}
    >
      <div className={`@container self-start ${mirrored ? 'lg:order-2' : ''}`}>
        <div className="flex flex-wrap items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-bold tabular-nums text-ink shadow-card"
          >
            {position}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${ROLE_CHIP[step.role]}`}
          >
            {roleLabel}
          </span>
          <h3 className="w-full text-lg font-bold tracking-tight text-balance sm:w-auto sm:text-xl">
            {step.title}
          </h3>
        </div>

        <div className="mt-3 space-y-3">
          {step.body.map((paragraph) => (
            <p
              key={paragraph}
              className="text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-base"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <div
        className={`flex h-full min-h-0 flex-col items-center justify-center gap-4 ${mirrored ? 'lg:order-1' : ''}`}
      >
        {step.images.map((image) => (
          // The button only hands the image its height budget (flex-1 makes it
          // definite, which is what max-h-full below resolves against); the
          // visible frame is on the <img> itself, so it hugs the capture
          // instead of leaving a large empty bordered box around a 266x75
          // strip.
          <button
            key={image.file}
            type="button"
            onClick={() => onExpand(image)}
            aria-label={expandLabel}
            tabIndex={isActive ? undefined : -1}
            className="group flex min-h-0 w-full flex-1 cursor-zoom-in items-center justify-center"
          >
            <Picture
              {...getReleaseImageSources(RELEASE, image.file)}
              alt={image.alt}
              sizes={SIZES}
              width={image.w}
              height={image.h}
              // Whichever binds first: the column, or the file's own pixels.
              style={{ maxWidth: `min(100%, ${image.w}px)` }}
              loading="lazy"
              decoding="async"
              className="h-auto max-h-full w-auto rounded-lg border border-edge bg-surface object-contain transition-[border-color] duration-300 group-hover:border-accent/40 motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default StepCard;
