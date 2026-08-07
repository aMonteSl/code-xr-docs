import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { hero } from '@/content/heroContent';
import { site } from '@/content/siteContent';
import { useMarketplaceStats } from '@/hooks/useMarketplaceStats';
import HeroBackdrop from '@/sections/hero/HeroBackdrop';
import HeroLogo from '@/sections/hero/HeroLogo';
import HeroRotatingLine from '@/sections/hero/HeroRotatingLine';
import HeroStats from '@/sections/hero/HeroStats';

// The landing hero. Marketplace data is fetched once here and handed down, so
// the version badge and the stat strip always agree with each other.
const Hero = () => {
  const { status, stats } = useMarketplaceStats();

  return (
    // `relative isolate` scope the backdrop's -z-10; there is deliberately no
    // `overflow-hidden` — inset-0 layers cannot overflow, and clipping would
    // eat the focus ring (outline-offset: 2px) of anything near the edge.
    // pt-24 below sm: on short phones the content exceeds min-h-svh and the
    // padding is what actually separates it from the transparent 64px navbar —
    // py-16 left the logo flush against it, pt-24 gives it 32px of air.
    <section id="hero" className="relative isolate flex min-h-svh items-center pt-24 pb-16 sm:py-20">
      <HeroBackdrop />

      <Container className="text-center">
        <HeroLogo />

        {/* The brand is the title. "XR" takes the accent, echoing the mark
            above, where the X and the R are separate paths.

            The tagline is INSIDE the h1, as a block span keeping its own type
            scale and its own entrance delay. Nothing moves visually — the two
            lines render exactly as they did when the tagline was a sibling <p>
            — but the page's one heading now says what the page is about
            instead of just naming the brand. */}
        <h1 className="mt-8 motion-reduce:animate-none animate-rise-in [animation-delay:300ms]">
          <span className="block text-[clamp(2.5rem,9vw,4.5rem)] leading-[1.05] font-extrabold tracking-tight">
            {hero.title.brandLead}
            <span className="text-accent">{hero.title.brandAccent}</span>
          </span>

          <span className="mx-auto mt-4 block max-w-3xl text-[clamp(1.125rem,3.5vw,1.75rem)] leading-snug font-medium text-balance text-ink motion-reduce:animate-none animate-rise-in [animation-delay:420ms]">
            {hero.title.tagline}
          </span>
        </h1>

        <div className="motion-reduce:animate-none animate-rise-in [animation-delay:540ms]">
          <HeroRotatingLine />
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-4 motion-reduce:animate-none animate-rise-in [animation-delay:660ms] sm:flex-row sm:items-center">
          <Button href={site.links.marketplace} target="_blank" rel="noopener noreferrer">
            {hero.actions.install}
          </Button>
          <Button
            href={site.links.github}
            variant="secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {hero.actions.source}
          </Button>
        </div>

        {/* Last on purpose: on a failed fetch the strip degrades to just the
            two static cards, and being last means the change shifts nothing. */}
        <div className="motion-reduce:animate-none animate-rise-in [animation-delay:780ms]">
          <HeroStats status={status} stats={stats} />
        </div>
      </Container>
    </section>
  );
};

export default Hero;
