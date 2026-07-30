import { useState } from 'react';
import ImageCarousel from '@/components/ui/ImageCarousel';
import Lightbox from '@/components/ui/Lightbox';
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

  const autoplay = !prefersReducedMotion && !isExpanded && isInView;
  const { index, next, prev, isFrozen, setPaused } = useCarousel(slides.length, {
    intervalMs: INTERVAL_MS,
    autoplay,
  });

  const current = slides[index];
  // A block with a single screenshot is a figure, not a deck: no timer (the
  // hook already refuses below two), no controls (ImageCarousel drops them),
  // and no "1 / 1" in front of the lightbox caption either.
  const isStatic = slides.length < 2;

  return (
    <div style={{ '--carousel-duration': `${INTERVAL_MS}ms` }}>
      <ImageCarousel
        slides={slides}
        index={index}
        isPaused={isFrozen}
        showProgress={autoplay && !isStatic}
        frameClassName={frameClassName}
        sizes={sizes}
        onPrev={prev}
        onNext={next}
        onExpand={() => setIsExpanded(true)}
        onPauseChange={setPaused}
        labels={whatsNew.carousel}
      />

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
        labels={whatsNew.carousel}
      />
    </div>
  );
};

export default SectionCarousel;
