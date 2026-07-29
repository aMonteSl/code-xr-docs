import { nav } from '@/content/navContent';
import { site } from '@/content/siteContent';
import Academic from '@/sections/academic/Academic';
import About from '@/sections/about/About';
import Author from '@/sections/author/Author';
import Collaboration from '@/sections/collaboration/Collaboration';
import FloatingActions from '@/sections/fab/FloatingActions';
import Faq from '@/sections/faq/Faq';
import Features from '@/sections/features/Features';
import Footer from '@/sections/footer/Footer';
import Gallery from '@/sections/gallery/Gallery';
import Install from '@/sections/install/Install';
import Hero from '@/sections/hero/Hero';
import Navbar from '@/sections/navbar/Navbar';
import TestedProjects from '@/sections/tested-projects/TestedProjects';
import Tutorial from '@/sections/tutorial/Tutorial';
import WhatsNew from '@/sections/whats-new/WhatsNew';

// Module scope, not a render-time map: useActiveSection keys its effect on this
// array, and a fresh one every render would re-subscribe every render.
const SECTION_IDS = nav.sections.map((section) => section.id);

// The page is an ordered list of sections. Add or reorder sections here.
const App = () => {
  return (
    <>
      {/* First tab stop: lets keyboard users jump past the fixed navbar. */}
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {site.a11y.skipToContent}
      </a>

      {/* The home is the only page with in-page section anchors. `SECTION_IDS`
          is module scope because useActiveSection keys its effect on it. */}
      <Navbar sections={nav.sections} sectionIds={SECTION_IDS} homeHref="#hero" />

      {/* Tutorial sits right after What's new, high on the page: the release
          section is what makes a reader want the thing, and the twelve-minute
          walkthrough is the fastest way to understand it whole. Everything after
          it (Collaboration, Tested projects, Features) then reads as detail on
          something already seen working.

          Gallery still sits AFTER Install. It is the heaviest section on the page
          and none of its screenshots are new — every still in it has already
          appeared in the About carousel, What's new or Collaboration. In the
          middle of the narrative it pushed Features, the only place that answers
          "does it support my language" and "what do I need installed", past
          screen 16 of 21.

          Keep `nav.sections` in content/navContent.js in this same order: the
          navbar reads it verbatim and does not derive anything from here. */}
      <main id="main" className="bg-surface text-ink">
        <Hero />
        <About />
        <WhatsNew />
        <Tutorial />
        <Collaboration />
        <TestedProjects />
        <Features />
        <Install />
        <Gallery />
        <Faq />
        <Academic />
        <Author />
      </main>

      <Footer />
      <FloatingActions />
    </>
  );
};

export default App;
