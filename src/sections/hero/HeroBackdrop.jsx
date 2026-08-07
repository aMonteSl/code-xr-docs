import { getHeroImage, getHeroSrcSet } from '@/lib/assets';

// The hero's background: a restrained vertical gradient, the release render at
// low opacity, and a fine monochrome grain on top that unifies the three.
// Purely decorative — the wrapper is aria-hidden and the image has no alt.
//
// The gradient and the grain are static background-images (defined as
// utilities in main.css so no color syntax leaks into JSX): painted once,
// never animated. The photo is the sanctioned exception: it drifts 24px on
// scroll (.hero-drift, main.css), a compositor-only transform. That drift is
// what makes THIS wrapper carry overflow-hidden — the 24px that leave the
// section's box clip here, inside an aria-hidden subtree with nothing
// focusable, so the SECTION still needs no overflow-hidden and the focus
// rings near its edge stay whole.
//
// The photo behaves two ways, switched on the VIEWPORT'S SHAPE rather than a
// width breakpoint, because the problem is the shape of the hole it has to
// fill:
//   - wide enough (>= 5/4): object-cover, full bleed, barely any crop
//   - narrower or portrait: object-contain pinned to the bottom, so the whole
//     scene reads as a band at the foot of the hero instead of a sliver.
//     Cover would crop HORIZONTALLY in a tall box (a 320x1100 hero shows 17%
//     of the width), and a bottom anchor could not fix that.
//
// Opacity is lower in dark: the render is a mostly light-grey room, so it
// washes out a dark surface faster than a light one.
//
// 0.14 in light, not 0.18: sampling the real pixels behind the copy, 0.18 left
// the muted text at 4.54:1 against a 4.5 floor, which is not a margin. 0.14
// lands it at 5.0 and the large accent headline at 4.58 (needs 3). Dark has
// room to spare at 0.12 (worst case 5.69).
//
// sizes=100vw with a 1672px ceiling upscales ~1.5x on 2560+ viewports —
// accepted, see optimize-hero.mjs: no wider source exists, and at this
// opacity under the grain layer the stretch is not visible.
const IMAGE_CLASS = [
  // hero-drift: the scroll-linked 24px slide (main.css). In contain mode the
  // drift sinks the bottom band and progressively crops its last 24px — at
  // this opacity under the grain, imperceptible; in cover mode object-fit
  // already crops internally and the drift only reframes.
  'hero-drift absolute inset-0 size-full opacity-[0.14] dark:opacity-[0.12]',
  'object-contain object-bottom',
  '[@media(min-aspect-ratio:5/4)]:object-cover [@media(min-aspect-ratio:5/4)]:object-center',
].join(' ');

const HeroBackdrop = () => {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="hero-gradient absolute inset-0" />

      <picture>
        <source type="image/avif" srcSet={getHeroSrcSet('avif')} sizes="100vw" />
        <source type="image/webp" srcSet={getHeroSrcSet('webp')} sizes="100vw" />
        <img
          src={getHeroImage(1024, 'webp')}
          alt=""
          decoding="async"
          // Decoration: it must not compete with the font or the critical JS.
          // Not lazy either — it sits above the fold and would arrive late.
          fetchPriority="low"
          className={IMAGE_CLASS}
        />
      </picture>

      <div className="hero-grain absolute inset-0 opacity-[0.025] dark:opacity-[0.04]" />
    </div>
  );
};

export default HeroBackdrop;
