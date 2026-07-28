import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { site } from '@/content/siteContent';

// Placeholder hero while the v1.2.0 site is built out. It exists to prove the
// conventions end to end: content from @/content, dumb components from
// @/components/ui, semantic color tokens only.
const Hero = () => {
  return (
    <section id="hero" className="flex min-h-svh items-center py-20 sm:py-24">
      <Container className="text-center">
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">
          {site.name} · {site.version}
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2rem,7vw,3.75rem)] leading-[1.1] font-extrabold tracking-tight text-balance">
          {site.tagline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base text-pretty text-ink-muted sm:text-lg">
          {site.description}
        </p>
        <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
          <Button href={site.links.marketplace} rel="noopener noreferrer">
            Install from Marketplace
          </Button>
          <Button href={site.links.github} variant="secondary" rel="noopener noreferrer">
            View on GitHub
          </Button>
        </div>
        <p className="mt-12 text-sm text-ink-faint sm:mt-16">
          New site under construction —{' '}
          <a className="underline hover:text-ink-muted" href={site.links.oldSite}>
            browse the previous version
          </a>
        </p>
      </Container>
    </section>
  );
};

export default Hero;
