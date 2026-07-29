import Container from '@/components/ui/Container';
import SectionBridge from '@/components/ui/SectionBridge';
import SectionLink from '@/components/ui/SectionLink';
import { about } from '@/content/aboutContent';
import { ANALYSIS_INDEX_HREF, ANALYSIS_INDEX_LABEL } from '@/content/analysisPagesContent';
import { TUTORIAL_HREF, TUTORIAL_LABEL } from '@/content/tutorialContent';
import AboutCarousel from '@/sections/about/AboutCarousel';

// "What is Code-XR": the explanation next to a carousel of real v1.2.0
// screenshots. Text column left, carousel right on desktop; stacked on mobile.
const About = () => {
  return (
    <section id="about" className="border-t border-edge py-16 sm:py-24">
      <Container>
        {/* The carousel column takes the larger share and, thanks to the
            default items-stretch, matches the height of the text column. */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)]">
          {/* @container so the prose inside justifies on its OWN width: this
              column is only ~361px on a wide screen (the carousel takes the
              rest), and justified text below ~450px opens word gaps of 7x a
              normal space. */}
          <div className="@container">
            <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
              {about.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {about.heading}
            </h2>

            <div className="mt-5 space-y-4">
              {about.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base hyphens-auto @md:text-justify text-ink-muted sm:text-lg"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {about.features.map((feature) => (
                <li key={feature.id} className="text-sm hyphens-auto @md:text-justify">
                  <span className="font-semibold text-ink">{feature.label}:</span>{' '}
                  <span className="text-ink-muted">{feature.description}</span>
                </li>
              ))}
            </ul>

            {/* Straight under the four chips, which are the /analysis/ index in
                miniature. Default (in-site) arrow because it stays on the site. */}
            <p className="mt-4 text-sm text-pretty text-ink-muted">
              {about.analysesLink.text}
            </p>
            <p className="mt-1 text-sm text-pretty text-ink-muted">{about.tutorialLink.text}</p>

            {/* flex-wrap, not two stacked links: side by side they read as the
                two ways in that they are, and they wrap to one per line on a
                narrow column instead of overflowing it. */}
            <div className="mt-4 flex flex-wrap gap-3">
              <SectionLink href={ANALYSIS_INDEX_HREF}>{ANALYSIS_INDEX_LABEL}</SectionLink>
              <SectionLink href={TUTORIAL_HREF}>{TUTORIAL_LABEL}</SectionLink>
            </div>
          </div>

          <AboutCarousel />
        </div>

        {/* A sibling of the grid, never a third grid child — as a child it
            would land in the 361px text column or under the carousel. Full
            container width under both columns is what says "the section is
            over". It also has to stay inside <Container>: a second direct-child
            div of the <section> would pick up its own scroll reveal (see the
            animation-range note in main.css) and pop in separately. */}
        <SectionBridge
          className="mt-10 sm:mt-12"
          text={about.bridge.text}
          label={about.bridge.label}
          href={about.bridge.href}
        />
      </Container>
    </section>
  );
};

export default About;
