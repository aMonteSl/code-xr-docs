import Container from '@/components/ui/Container';
import DefinitionGrid from '@/components/ui/DefinitionGrid';
import LinkCard from '@/components/ui/LinkCard';
import MediaVideo from '@/components/ui/MediaVideo';
import SectionBridge from '@/components/ui/SectionBridge';
import SectionLink from '@/components/ui/SectionLink';
import {
  ANALYSIS_INDEX_HREF,
  ANALYSIS_INDEX_LABEL,
  analysisPages,
} from '@/content/analysisPagesContent';
import { site } from '@/content/siteContent';
import {
  TUTORIAL_VIDEO,
  tutorial,
  tutorialSectionIds,
  tutorialSections,
} from '@/content/tutorialContent';
import { whatsNew } from '@/content/whatsNewContent';
import FloatingActions from '@/sections/fab/FloatingActions';
import Footer from '@/sections/footer/Footer';
import Navbar from '@/sections/navbar/Navbar';
import TutorialPart from '@/sections/tutorial/TutorialPart';
import { getReleaseImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/media';

const RELEASE = 'v1-2-0';

// Half the 84rem container from lg (624px once it caps), full width below. The
// same slot the analysis pages give their demo video.
const VIDEO_SIZES =
  '(min-width: 1344px) 624px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 3rem)';

// Two columns with a 24px gap inside the 1280px content box: 628px per card.
// Same grid, same number, as the /analysis/ index.
const CARD_SIZES =
  '(min-width: 1344px) 628px, (min-width: 768px) calc(50vw - 44px), calc(100vw - 3rem)';

// The deep tutorial: the written form of the twelve-minute video.
//
// It covers the sidebar and the room, which nothing else on the site does, and
// hands the four analyses over to their own pages rather than explaining them a
// third time. See the note at the top of tutorialContent.js.
//
// Every block is a <section> wrapping exactly one Container, which is what the
// scroll-reveal selector in main.css keys on, so this page inherits the reveal
// with no new CSS. The two <dialog> lightboxes live in TutorialPart, outside its
// Container, for the reason documented there.
const TutorialPage = () => {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        {site.a11y.skipToContent}
      </a>

      {/* This page's own sections, never the home's: the links are in-page
          anchors. The list is built once at module scope in tutorialContent,
          because useActiveSection keys its effect on the ids array. */}
      <Navbar sections={tutorialSections} sectionIds={tutorialSectionIds} />

      <main id="main" className="bg-surface pt-16 text-ink">
        {/* The title and the video side by side: the video IS the tutorial, so
            it belongs level with the h1 rather than below the fold. */}
        <section className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
              <div className="@container">
                <SectionLink href={tutorial.backHref} icon="left">
                  {tutorial.backLabel}
                </SectionLink>

                <p className="mt-6 text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
                  {tutorial.eyebrow}
                </p>
                <h1 className="mt-2 text-[clamp(1.875rem,5vw,3rem)] leading-tight font-bold tracking-tight text-balance">
                  {tutorial.heading}
                </h1>
                <p className="mt-4 text-base hyphens-auto @md:text-justify text-ink-muted text-pretty sm:text-lg">
                  {tutorial.intro}
                </p>
              </div>

              {/* lg:self-start so the video keeps its aspect ratio instead of
                  being stretched to the height of the copy column. */}
              <div className="lg:self-start">
                <MediaVideo
                  title={TUTORIAL_VIDEO.title}
                  src={getYouTubeEmbedUrl(TUTORIAL_VIDEO.id)}
                  poster={getReleaseImageSources(RELEASE, TUTORIAL_VIDEO.posterFile)}
                  posterAlt={TUTORIAL_VIDEO.posterAlt}
                  posterSizes={VIDEO_SIZES}
                  playLabel={tutorial.playLabel}
                  badge={TUTORIAL_VIDEO.durationLabel}
                  watchUrl={getYouTubeWatchUrl(TUTORIAL_VIDEO.id)}
                  watchLabel={tutorial.watchLabel}
                />
              </div>
            </div>
          </Container>
        </section>

        <section id={tutorial.what.id} className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="@container max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {tutorial.what.heading}
              </h2>
              <div className="mt-4 space-y-4">
                {tutorial.what.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base hyphens-auto @md:text-justify text-ink-muted text-pretty"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Two columns, not the default three: four items in three leave one
                orphan on its own row, and these four read as two pairs. */}
            <DefinitionGrid items={tutorial.what.items} columns={2} className="mt-6" />
          </Container>
        </section>

        {tutorial.parts.map((part) => (
          <TutorialPart key={part.id} part={part} />
        ))}

        {/* Steps 9 to 12 of the script, as four pointers. The titles and
            summaries are read from the same places the /analysis/ index uses, so
            nothing is restated. */}
        <section id={tutorial.analyses.id} className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="@container max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {tutorial.analyses.heading}
              </h2>
              <p className="mt-3 text-base hyphens-auto @md:text-justify text-ink-muted text-pretty">
                {tutorial.analyses.intro}
              </p>
            </div>

            {/* items-stretch (the grid default) plus flex-1 inside the card, so
                all four share the tallest one's height and their arrows line
                up. */}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
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
                    sizes={CARD_SIZES}
                    label={tutorial.analyses.cardLabel}
                  />
                );
              })}
            </div>

            <SectionLink href={ANALYSIS_INDEX_HREF} className="mt-8">
              {ANALYSIS_INDEX_LABEL}
            </SectionLink>
          </Container>
        </section>

        <section id={tutorial.next.id} className="border-t border-edge py-12 sm:py-16">
          <Container>
            <div className="@container max-w-3xl">
              <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
                {tutorial.next.heading}
              </h2>
            </div>

            <DefinitionGrid items={tutorial.next.items} className="mt-6" />

            <p className="mt-6 max-w-3xl rounded-card border border-edge bg-surface-raised p-4 text-sm text-pretty text-ink-muted shadow-card">
              {tutorial.next.note}
            </p>

            <SectionBridge
              className="mt-10 sm:mt-12"
              text={tutorial.bridge.text}
              label={tutorial.bridge.label}
              href={tutorial.bridge.href}
            />
          </Container>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </>
  );
};

export default TutorialPage;
