import DefinitionGrid from '@/components/ui/DefinitionGrid';
import MediaCard from '@/components/ui/MediaCard';
import { getReleaseImageSources, getReleaseImageWidth } from '@/lib/assets';

const RELEASE = 'v1-2-0';

// Reading width, and the cap a lone figure would otherwise take (max-w-3xl).
const FIGURE_MAX_PX = 768;

// `sizes` per image count, derived from the real grid rather than guessed. The
// Container caps at 84rem with 32px gutters, so the content box tops out at
// 1280px; the grids below use a 20px gap (gap-x-5).
//
//   1 image  the frame is capped at reading width (768px), reached once the
//            content box is, i.e. from a 832px viewport (832 - 64 = 768). A
//            master narrower than that is capped at its own width instead (see
//            soleFigureStyle), which only ever makes the real box SMALLER than
//            what this advertises, and the browser then has no larger variant to
//            pick anyway.
//   2 images (1280 - 20) / 2 = 630px at the cap.
//   3 images (1280 - 40) / 3 = 413px at the cap. Identical to MediaGroup's,
//            because it is the identical grid.
const SIZES = {
  1: '(min-width: 832px) 768px, (min-width: 640px) calc(100vw - 4rem), calc(100vw - 3rem)',
  2: '(min-width: 1344px) 630px, (min-width: 640px) calc(50vw - 42px), calc(100vw - 3rem)',
  3: '(min-width: 1344px) 413px, (min-width: 1024px) calc(33vw - 35px), (min-width: 640px) calc(50vw - 42px), calc(100vw - 3rem)',
};

// The grid tracks the count too. A lone screenshot in a 3-column grid renders at
// 413px, too small for the room shot that is the whole point of step 6; capped
// at reading width instead it reads as a deliberate single figure.
const GRID = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

// One numbered step: a badge and a title, the lead sentence, then any
// combination of a definition grid, extra paragraphs and screenshots. Every
// string arrives through `step`; there is no state and no copy here.
//
// It does NOT own a lightbox, on purpose. The <dialog> must not sit inside the
// scroll-revealed subtree (see the animation-range note in main.css), and every
// step here renders inside its part's single Container. So the part owns one
// lightbox as a sibling of that Container and this component just reports which
// image was clicked. `onOpenImage` is called with the index within THIS step;
// the part offsets it into its own flat list.
//
// Fixed-width two-digit number ("01"), so all eight badges are the same size and
// every title starts on the same x.
const TutorialStep = ({ step, expandLabel, onOpenImage }) => {
  const images = step.images ?? [];
  const count = Math.min(images.length, 3);

  // A lone figure takes reading width, but never more than the screenshot's own
  // pixels: MediaCard's frame is object-contain, which scales UP as happily as
  // down, and the 366px server-configuration crop was being painted at 766.
  // An inline maxWidth because the value is a datum from the generated width
  // manifest, not one of a fixed set a utility class could cover.
  const soleFigureStyle =
    count === 1
      ? { maxWidth: `${Math.min(FIGURE_MAX_PX, getReleaseImageWidth(RELEASE, images[0].file) ?? FIGURE_MAX_PX)}px` }
      : undefined;

  return (
    <article>
      {/* items-center, not baseline: a square badge has no text baseline to
          share, and baseline alignment parks it a few pixels high. */}
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-card border border-edge bg-surface text-base font-bold text-accent-strong tabular-nums dark:text-accent"
        >
          {String(step.number).padStart(2, '0')}
        </span>
        <h3 className="min-w-0 text-xl font-bold tracking-tight text-balance text-ink sm:text-2xl">
          {step.title}
        </h3>
      </div>

      <p className="mt-4 max-w-3xl text-base text-pretty text-ink-muted">{step.lead}</p>

      {/* Two columns for exactly four items, three otherwise: four in three
          columns leave one orphan on its own row, where 2+2 is square. At seven
          (step 3) three columns are still the compact choice, orphan and all. */}
      {step.items?.length ? (
        <DefinitionGrid
          items={step.items}
          columns={step.items.length === 4 ? 2 : 3}
          className="mt-5"
        />
      ) : null}

      {step.paragraphs?.length ? (
        <div className="mt-5 max-w-3xl space-y-4">
          {step.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-base text-pretty text-ink-muted">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}

      {images.length ? (
        // items-start so a tile never stretches to match a taller neighbour.
        <div
          className={`mt-6 grid items-start gap-x-5 gap-y-7 ${GRID[count]}`}
          style={soleFigureStyle}
        >
          {images.map((image, index) => (
            <MediaCard
              key={image.file}
              title={image.title}
              image={getReleaseImageSources(RELEASE, image.file)}
              alt={image.alt}
              label={expandLabel}
              sizes={SIZES[count]}
              onOpen={() => onOpenImage(index)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default TutorialStep;
