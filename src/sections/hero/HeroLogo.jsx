import { CODE_XR_LOGO } from '@/lib/logoPaths';

// Section-private choreography for the Code-XR mark. It builds its own SVG
// from the shared path data rather than using components/ui/CodeXrLogo,
// because the three parts animate independently and a dumb component should
// not grow prop plumbing for one caller's art direction.
//
// Entrance: blueprint draw-on. Each path carries pathLength="1", which
// normalizes its length so `stroke-dasharray: 1` spans the whole outline; the
// logo-draw keyframe then traces the stroke (dashoffset 1 -> 0), fades the
// fill in and the stroke out. Staggered shell -> X -> R, ~1.8s total. The
// inner counters (the shell's cutout, the R's bowl) trace in parallel with
// their outline, which is exactly how a technical drawing reads.
//
// The base classes hold the FINAL state (fill on, stroke invisible), so
// `motion-reduce:animate-none` lands on the solid mark with zero extra CSS.
//
// Idle: a 7s float, transform-only so it stays on the compositor. No glow —
// the whole site is free of ambient light effects.
const DRAW_PATH_CLASS =
  'motion-reduce:animate-none animate-logo-draw stroke-current [stroke-dasharray:1] [stroke-opacity:0] [stroke-width:10] [stroke-linejoin:round]';

const HeroLogo = () => {
  return (
    <div
      data-hero-logo
      className="mx-auto flex size-20 items-center justify-center motion-reduce:animate-none animate-logo-float sm:size-24 md:size-28"
    >
      <svg
        viewBox={CODE_XR_LOGO.viewBox}
        fill="currentColor"
        role="img"
        aria-label="Code-XR"
        className="size-full text-ink"
      >
        <path fillRule="nonzero" pathLength="1" d={CODE_XR_LOGO.shell} className={DRAW_PATH_CLASS} />
        <path
          fillRule="nonzero"
          pathLength="1"
          d={CODE_XR_LOGO.letterX}
          className={`${DRAW_PATH_CLASS} [animation-delay:250ms]`}
        />
        <path
          fillRule="nonzero"
          pathLength="1"
          d={CODE_XR_LOGO.letterR}
          className={`${DRAW_PATH_CLASS} [animation-delay:400ms]`}
        />
      </svg>
    </div>
  );
};

export default HeroLogo;
