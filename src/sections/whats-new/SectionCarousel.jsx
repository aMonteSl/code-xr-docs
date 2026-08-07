import { useState } from 'react';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Lightbox from '@/components/ui/Lightbox';
import LiveRegion from '@/components/ui/LiveRegion';
import { whatsNew } from '@/content/whatsNewContent';
import { useCarousel } from '@/hooks/useCarousel';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getReleaseImageSources } from '@/lib/assets';

const RELEASE = 'v1-2-0';

// One source of truth for the dwell time: it drives the autoplay timer and the
// progress bar's CSS animation alike, so the two cannot drift apart.
const INTERVAL_MS = 6000;

// Section-private carousel for the release blocks. Twin of the About one, but
// with a CURATED order (result, then panel, then detail) instead of a shuffle.
//
// `isInView` comes from the parent block: nothing rotates while it is off
// screen, so the page never runs half a dozen timers nobody can see.
//
// It cannot be shared with AboutCarousel: a section may not import from
// another section, and a stateful wrapper does not belong in components/ui.
const SectionCarousel = ({ images, isInView = true, frameClassName, sizes }) => {
  const prefersReducedMotion = useReducedMotion();
  const [slides] = useState(() =>
    images.map((image) => ({ ...getReleaseImageSources(RELEASE, image.file), alt: image.alt }))
  );
  const [isExpanded, setIsExpanded] = useState(false);
  // Written by stepTo alone; see the note there and the fuller one in
  // AboutCarousel.
  const [announcement, setAnnouncement] = useState('');

  const autoplay = !prefersReducedMotion && !isExpanded && isInView;
  const { index, goTo, next, prev, isFrozen, setPaused } = useCarousel(slides.length, {
    intervalMs: INTERVAL_MS,
    autoplay,
  });

  const current = slides[index];
  // A block with a single screenshot is a figure, not a deck: no timer (the
  // hook already refuses below two), no controls (ImageCarousel drops them),
  // no "1 / 1" in front of the lightbox caption, and nothing to announce.
  const isStatic = slides.length < 2;

  // Snapshotted in the handler, never derived from `index` in the render: a
  // derived message would also change on the autoplay tick, and these blocks
  // rotate for as long as they are on screen. Full reasoning in AboutCarousel.
  const stepTo = (delta) => {
    const target = (index + delta + slides.length) % slides.length;

    goTo(target);
    setAnnouncement(whatsNew.carousel.announcement(target + 1, slides.length, slides[target].alt));
  };

  return (
    <div style={{ '--carousel-duration': `${INTERVAL_MS}ms` }}>
      <ImageCarousel
        slides={slides}
        index={index}
        isPaused={isFrozen}
        showProgress={autoplay && !isStatic}
        frameClassName={frameClassName}
        sizes={sizes}
        onPrev={() => stepTo(-1)}
        onNext={() => stepTo(1)}
        onExpand={() => setIsExpanded(true)}
        onPauseChange={(paused) => {
          setPaused(paused);

          // Leaving the frame is when autoplay may resume and the snapshot
          // starts describing a slide that has been replaced. Clearing a live
          // region is silent. (ImageCarousel only reports pause at all when it
          // is not a static figure, so this never runs for a deck of one.)
          if (!paused) {
            setAnnouncement('');
          }
        }}
        labels={whatsNew.carousel}
      />

      {/* Same rule the arrows and the counter follow: a figure of one has
          nothing to step through and so nothing to say. */}
      {isStatic ? null : <LiveRegion message={announcement} />}

      <Lightbox
        isOpen={isExpanded}
        src={current.src}
        sources={current.sources}
        alt={current.alt}
        caption={
          isStatic
            ? current.alt
            : `${whatsNew.carousel.counter(index + 1, slides.length)}  ${current.alt}`
        }
        onClose={() => setIsExpanded(false)}
        // undefined when static keeps the figure rule above: no arrows for a
        // list of one. For real decks this is the touch user's only way to
        // step through the expanded view (keyboard rides the same props).
        onPrev={isStatic ? undefined : prev}
        onNext={isStatic ? undefined : next}
        labels={whatsNew.carousel}
      />
    </div>
  );
};

export default SectionCarousel;
