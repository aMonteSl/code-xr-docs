import Container from '@/components/ui/Container';
import SectionBridge from '@/components/ui/SectionBridge';
import { analysisPages } from '@/content/analysisPagesContent';
import { site } from '@/content/siteContent';
import { whatsNew } from '@/content/whatsNewContent';
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
