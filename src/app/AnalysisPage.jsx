import Container from '@/components/ui/Container';
import LinkCard from '@/components/ui/LinkCard';
import SectionBridge from '@/components/ui/SectionBridge';
import { analysisPages } from '@/content/analysisPagesContent';
import { site } from '@/content/siteContent';
import { whatsNew } from '@/content/whatsNewContent';
import { getReleaseImageSources } from '@/lib/assets';
import AnalysisHero from '@/sections/analysis/AnalysisHero';
import AnalysisOverview from '@/sections/analysis/AnalysisOverview';
import AnalysisSpecs from '@/sections/analysis/AnalysisSpecs';
import MediaGroup from '@/sections/analysis/MediaGroup';
import FloatingActions from '@/sections/fab/FloatingActions';
import Footer from '@/sections/footer/Footer';
import Navbar from '@/sections/navbar/Navbar';

// One analysis detail page. `slug` picks which; everything else is looked up.
//
// The shared facts (title, description, bullets, videoId) come from
// whatsNew.analyses — the same objects the home page renders — so the two can
// never drift. analysisPagesContent adds only what is specific to the page.
//
// The navbar gets THIS page's sections, never the home's: its links are in-page
// `#` anchors, so the home's list would point at ids that do not exist here and
// useActiveSection's bottom-of-page branch would highlight the home's last
// section forever (see the note in Navbar). The list is built once at module
// scope in analysisPagesContent — it must stay a stable reference. Brand still
// goes to `/`, since this is not the home.
//
// Every block is a <section> wrapping exactly one Container, which is what the
// scroll-reveal selector in main.css keys on — so these pages inherit the
// reveal with no new CSS.
const RELEASE = 'v1-2-0';

// Three cards in a 1/2/3-column grid with a 24px gap, inside the Container's
// 1280px content box: (1280 - 48) / 3 = 411px at the cap.
const SIBLING_SIZES =
  '(min-width: 1344px) 411px, (min-width: 1024px) calc(33vw - 33px), (min-width: 640px) calc(50vw - 44px), calc(100vw - 3rem)';

const AnalysisPage = ({ slug }) => {
  const page = analysisPages.pages.find((item) => item.slug === slug) ?? null;
  const analysis = page ? whatsNew.analyses.find((item) => item.id === page.id) : null;

  if (!page || !analysis) {
    throw new Error(`AnalysisPage: no analysis for slug "${slug}".`);
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {site.a11y.skipToContent}
      </a>

      <Navbar sections={page.sections} sectionIds={page.sectionIds} />

      <main id="main" className="bg-surface pt-16 text-ink">
        <AnalysisHero analysis={analysis} />

        {/* Explain it before showing it: what the thing represents and what the
            visual channels mean, then the concrete list of charts (or, for the
            dependency graph, layouts and edge modes), then what each number
            actually means. The screenshots come after, so a reader arrives at
            them already knowing what they are looking at.

            The ids are the navbar's anchors and they come from the same list it
            renders — see the section block at the bottom of the content module. */}
        <AnalysisOverview
          id="overview"
          heading={page.overview.heading}
          paragraphs={page.overview.paragraphs}
          channelsTitle={page.overview.channelsTitle}
          channels={page.overview.channels}
          note={page.overview.note}
        />

        <AnalysisSpecs
          id="specs"
          heading={page.specs.heading}
          intro={page.specs.intro}
          items={page.specs.items}
        />

        <AnalysisSpecs
          id="glossary"
          heading={page.glossary.heading}
          intro={page.glossary.intro}
          items={page.glossary.items}
        />

        {page.groups.map((group) => (
          <MediaGroup key={group.label} group={group} />
        ))}

        {/* The other three, so the way onward is not only back up to the index.
            Same components and same data the index and the tutorial use: the
            title from whatsNew.analyses, the summary and the cover from the page
            entry. Nothing is restated. */}
        <section className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="@container max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {analysisPages.siblings.heading}
              </h2>
              <p className="mt-3 text-base hyphens-auto @md:text-justify text-ink-muted text-pretty">
                {analysisPages.siblings.intro}
              </p>
            </div>

            {/* items-stretch (the grid default) plus flex-1 inside the card, so
                all three share the tallest one's height and their arrows line
                up. */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {analysisPages.pages
                .filter((item) => item.slug !== page.slug)
                .map((sibling) => {
                  const siblingAnalysis = whatsNew.analyses.find(
                    (item) => item.id === sibling.id
                  );
                  const cover = sibling.groups[0].images[0];

                  return (
                    <LinkCard
                      key={sibling.slug}
                      href={`/analysis/${sibling.slug}/`}
                      title={siblingAnalysis.title}
                      description={sibling.summary}
                      image={getReleaseImageSources(RELEASE, cover.file)}
                      alt={cover.alt}
                      sizes={SIBLING_SIZES}
                      label={analysisPages.siblings.cardLabel}
                    />
                  );
                })}
            </div>
          </Container>
        </section>

        <section className="border-t border-edge py-12 sm:py-16">
          <Container>
            <SectionBridge
              text={analysisPages.bridge.text}
              label={analysisPages.bridge.label}
              href={analysisPages.bridge.href}
            />
          </Container>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </>
  );
};

export default AnalysisPage;
