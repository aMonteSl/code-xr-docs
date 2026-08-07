import { useState } from 'react';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Lightbox from '@/components/ui/Lightbox';
import LiveRegion from '@/components/ui/LiveRegion';
import { about } from '@/content/aboutContent';
import { useCarousel } from '@/hooks/useCarousel';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getReleaseImageSources } from '@/lib/assets';
import { buildSpreadSequence } from '@/lib/spreadShuffle';

const RELEASE = 'v1-2-0';

// Single source of truth for the dwell time: it drives both the autoplay
// interval and the progress bar's CSS animation, so they cannot drift apart.
const INTERVAL_MS = 6000;

// Height tracks the text column on wide screens (h-full against the grid's
// default items-stretch). With object-contain a taller frame never shrinks an
// image, so this is a pure win: measured against the previous 624x390 frame,
// wide shots go 624x312 -> 687x343 and the vertical panels 172x351 -> 396x808.
// The max-h is a guard for mid widths, where the text column narrows and its
// height would otherwise run away.
const FRAME_CLASS = 'aspect-video lg:aspect-auto lg:h-full lg:max-h-[52rem] lg:min-h-[26rem]';

// Derived from About's grid, not guessed: 1fr/1.9fr with a 40px gap inside the
// 84rem container, so this column is 1.9/2.9 of (container - 40) — 812px once
// the container caps at 1344px viewport, and 66vw-68px between lg and there.
// It is the widest image slot on the page; a 50/50 assumption served it a 640
// variant into an 812px box.
const SIZES =
  '(min-width: 1344px) 812px, (min-width: 1024px) calc(66vw - 68px), calc(100vw - 3rem)';

// Section-private wiring: materializes the slide sequence, owns the autoplay
// policy and the lightbox state, and feeds the dumb ImageCarousel/Lightbox.
//
// The whole permutation is built ONCE, in the useState initializer (never
// useMemo — this must survive any re-render untouched). That single decision
// delivers all three hard requirements: the order is semi-random per visit,
// no image repeats (it is a permutation), and prev/next have perfect memory
// because navigation is just index arithmetic over a fixed array.
const AboutCarousel = () => {
  const prefersReducedMotion = useReducedMotion();
  const [slides] = useState(() => {
    const excluded = new Set(about.excludedImages);
    const pool = about.images.filter((image) => !excluded.has(image.file));

    return [
      { ...getReleaseImageSources(RELEASE, about.heroImage.file), alt: about.heroImage.alt },
      ...buildSpreadSequence(pool, (image) => image.group).map((image) => ({
        ...getReleaseImageSources(RELEASE, image.file),
        alt: image.alt,
      })),
    ];
  });

  const [isExpanded, setIsExpanded] = useState(false);
  // Written by stepTo below and by nothing else. That restriction is the whole
  // design — see the comment on stepTo.
  const [announcement, setAnnouncement] = useState('');
  // This one autoplays unconditionally. In-view gating was tried here and
  // stopped it rotating, so it stays out: it is the only carousel on its
  // section and there is nothing to coordinate it with.
  const autoplay = !prefersReducedMotion && !isExpanded;
  const { index, goTo, next, prev, isFrozen, setPaused } = useCarousel(slides.length, {
    intervalMs: INTERVAL_MS,
    // Hover, focus and the open lightbox all pause via setPaused; reduced
    // motion disables autoplay outright (manual navigation still works).
    autoplay,
  });

  const current = slides[index];

  // Manual navigation is announced to screen readers; the six-second tick is
  // not, and this deck is ~40 slides sitting second on the home page — a live
  // region that followed the tick would interrupt a screen-reader user every
  // six seconds for the entire visit.
  //
  // The safety is structural, not a flag: the message is SNAPSHOTTED here, in
  // the click handler, rather than derived from `index` during render. A
  // derived string changes whenever the index changes, which includes every
  // autoplay tick; a string only this function can write cannot be moved by a
  // timer at all, whatever hover, focus and visibility do to the rotation.
  //
  // Two consecutive calls can never write the same sentence — while a pointer
  // or focus is inside the frame the rotation is paused, so the only thing
  // moving the index is the delta below, which is never zero. That matters
  // because a live region whose text does not actually change says nothing.
  //
  // The modulo is the one goTo would apply anyway; it is computed here because
  // the sentence has to name the slide being arrived AT, not the one being
  // left.
  const stepTo = (delta) => {
    const target = (index + delta + slides.length) % slides.length;

    goTo(target);
    setAnnouncement(about.carousel.announcement(target + 1, slides.length, slides[target].alt));
  };

  return (
    <div
      className="flex h-full flex-col justify-center"
      style={{ '--carousel-duration': `${INTERVAL_MS}ms` }}
    >
      <ImageCarousel
        slides={slides}
        index={index}
        isPaused={isFrozen}
        showProgress={autoplay}
        frameClassName={FRAME_CLASS}
        sizes={SIZES}
        onPrev={() => stepTo(-1)}
        onNext={() => stepTo(1)}
        onExpand={() => setIsExpanded(true)}
        onPauseChange={(paused) => {
          setPaused(paused);

          // Pointer out or focus out is the exact moment autoplay is free to
          // resume, and from the next tick the snapshot would be describing a
          // slide that is no longer on screen. Clearing it is silent: the
          // default aria-relevant reports additions and text, not removals.
          //
          // On touch this fires BEFORE the click (a non-hovering pointer gets
          // pointerup, then pointerout/pointerleave, and only then the
          // compatibility mouse events and click), so a tap clears first and
          // announces second. Do not defer this behind a timer to "protect"
          // the announcement — there is nothing to protect it from.
          if (!paused) {
            setAnnouncement('');
          }
        }}
        labels={about.carousel}
      />

      {/* Sibling of the figure, not inside it: ImageCarousel is dumb and cannot
          tell a tick from a click — knowing that is autoplay policy, and
          autoplay policy lives here. */}
      <LiveRegion message={announcement} />

      {/* onPrev/onNext give the expanded view its arrows AND its arrow keys —
          the dialog's own onKeyDown handles both. A document-level key
          listener used to live here instead; wiring the props without
          removing it would have fired every keystroke twice (the dialog's
          preventDefault does not stop the bubble to document). Touch users
          get navigation at all only through these arrows.

          Deliberately `prev`/`next` and not `stepTo`: the expanded view has an
          announcer of its own (see Lightbox), and routing it through this one
          would say the same thing twice. */}
      <Lightbox
        isOpen={isExpanded}
        src={current.src}
        sources={current.sources}
        alt={current.alt}
        caption={`${about.carousel.counter(index + 1, slides.length)}  ${current.alt}`}
        onClose={() => setIsExpanded(false)}
        onPrev={prev}
        onNext={next}
        labels={about.carousel}
      />
    </div>
  );
};

export default AboutCarousel;
