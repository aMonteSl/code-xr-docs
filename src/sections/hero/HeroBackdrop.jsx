import { getHeroImage, getHeroSrcSet } from '@/lib/assets';

// The hero's background: a restrained vertical gradient, the release render at
// low opacity, and a fine monochrome grain on top that unifies the three.
// Purely decorative — the wrapper is aria-hidden and the image has no alt.
//
// The gradient and the grain are static background-images (defined as
// utilities in main.css so no color syntax leaks into JSX): painted once,
// never animated. inset-0 layers cannot overflow the parent, so the section
// needs no overflow-hidden — which matters, because clipping would eat the
// focus ring of anything near the section edge, and object-fit already clips
// the photo internally.
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
  'absolute inset-0 size-full opacity-[0.14] dark:opacity-[0.12]',
  'object-contain object-bottom',
  '[@media(min-aspect-ratio:5/4)]:object-cover [@media(min-aspect-ratio:5/4)]:object-center',
].join(' ');

const HeroBackdrop = () => {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
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
