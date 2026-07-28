import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { site } from '@/content/siteContent';

// Placeholder hero while the v1.2.0 site is built out. It exists to prove the
// conventions end to end: content from @/content, dumb components from
// @/components/ui, semantic color tokens only.
const Hero = () => {
  return (
    <section id="hero" className="flex min-h-screen items-center py-24">
      <Container className="text-center">
        <p className="text-sm font-semibold tracking-widest text-accent uppercase">
          {site.name} · {site.version}
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
          {site.tagline}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted">
          {site.description}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href={site.links.marketplace} rel="noopener noreferrer">
            Install from Marketplace
          </Button>
          <Button href={site.links.github} variant="secondary" rel="noopener noreferrer">
            View on GitHub
          </Button>
        </div>
        <p className="mt-16 text-sm text-ink-faint">
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
