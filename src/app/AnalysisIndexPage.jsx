import Container from '@/components/ui/Container';
import LinkCard from '@/components/ui/LinkCard';
import SectionBridge from '@/components/ui/SectionBridge';
import { analysisPages } from '@/content/analysisPagesContent';
import { site } from '@/content/siteContent';
import { whatsNew } from '@/content/whatsNewContent';
import FloatingActions from '@/sections/fab/FloatingActions';
import Footer from '@/sections/footer/Footer';
import Navbar from '@/sections/navbar/Navbar';
import { getReleaseImageSources } from '@/lib/assets';

const RELEASE = 'v1-2-0';

// Derived from the real grid: the Container caps at 84rem (1344px) with 32px
// gutters, so the content box tops out at 1280. Two columns with a 24px gap
// gives 628px per card at the cap.
const SIZES =
  '(min-width: 1344px) 628px, (min-width: 768px) calc(50vw - 44px), calc(100vw - 3rem)';

// The /analysis/ index: the four analyses side by side, each card navigating to
// its own page.
//
// It does not replace the four direct links in the release section — those are
// the way in for someone reading the page top to bottom. This is the way in for
// someone who wants to choose.
//
// Each analysis's name and card image come from the same places the detail
// pages use: the title from whatsNew.analyses, the image from the first group
// of screenshots. Nothing is restated.
const AnalysisIndexPage = () => {
  const { index } = analysisPages;

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {site.a11y.skipToContent}
      </a>

      {/* No section links: they are in-page anchors that mean nothing here, and
          useActiveSection would otherwise highlight the home's last section.
          See the note in Navbar. */}
      <Navbar />

      <main id="main" className="bg-surface pt-16 text-ink">
        <section className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="@container max-w-3xl">
              <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
                {index.eyebrow}
              </p>
              <h1 className="mt-2 text-[clamp(1.875rem,5vw,3rem)] leading-tight font-bold tracking-tight text-balance">
                {index.heading}
              </h1>
              <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
                {index.intro}
              </p>
            </div>

            {/* items-stretch (the grid default) plus flex-1 inside the card, so
                all four cards share the tallest one's height and their arrows
                line up. */}
            <div className="mt-8 grid gap-6 sm:mt-10 md:grid-cols-2">
              {analysisPages.pages.map((page) => {
                const analysis = whatsNew.analyses.find((item) => item.id === page.id);
                const cover = page.groups[0].images[0];

                return (
                  <LinkCard
                    key={page.slug}
                    href={`/analysis/${page.slug}/`}
                    title={analysis.title}
                    description={page.summary}
                    image={getReleaseImageSources(RELEASE, cover.file)}
                    alt={cover.alt}
                    sizes={SIZES}
                    label={index.cardLabel}
                  />
                );
              })}
            </div>
          </Container>
        </section>

        <section className="border-t border-edge py-12 sm:py-16">
          <Container>
            <SectionBridge
              text={index.bridge.text}
              label={index.bridge.label}
              href={index.bridge.href}
            />
          </Container>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </>
  );
};

export default AnalysisIndexPage;
