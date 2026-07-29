import Container from '@/components/ui/Container';
import MediaVideo from '@/components/ui/MediaVideo';
import SectionLink from '@/components/ui/SectionLink';
import { analysisPages } from '@/content/analysisPagesContent';
import { getReleaseImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/media';

const RELEASE = 'v1-2-0';

// Half the 84rem container from lg (624px once it caps), full width below —
// the same slot the home page's analysis video sits in.
const VIDEO_SIZES =
  '(min-width: 1344px) 624px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 3rem)';

// The top of an analysis detail page: a way back, the title, the description,
// the bullets, and the demo video.
//
// `analysis` is the entry from whatsNew.analyses — the same object the home
// page renders — so the title, description, bullets and videoId are read, never
// restated. `page` carries only what is specific to this page.
//
// No <h1> competition: this is the page's only h1, where the home's is the
// brand. The section shell matches every other section on the site
// (border-t + py) so the shared scroll-reveal selector picks it up unchanged.
const AnalysisHero = ({ analysis }) => {
  const poster = analysis.images[0];

  return (
    <section className="border-t border-edge py-12 sm:py-16">
      <Container>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="@container">
            <SectionLink href={analysisPages.backHref} icon="left">
              {analysisPages.backLabel}
            </SectionLink>

            <p className="mt-6 text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
              {analysisPages.eyebrow}
            </p>
            <h1 className="mt-2 text-[clamp(1.875rem,5vw,3rem)] leading-tight font-bold tracking-tight text-balance">
              {analysis.title}
            </h1>
            <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
              {analysis.description}
            </p>

            <ul className="mt-5 space-y-2">
              {analysis.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm text-ink-muted">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {/* Sized flex item, or `justify` has no slack to distribute. */}
                  <span className="min-w-0 flex-1 hyphens-auto @md:text-justify">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* lg:self-start so the video keeps its aspect ratio instead of being
              stretched to the height of the copy column. */}
          <div className="lg:self-start">
            <MediaVideo
              title={analysis.videoTitle}
              src={getYouTubeEmbedUrl(analysis.videoId)}
              poster={getReleaseImageSources(RELEASE, poster.file)}
              posterAlt={poster.alt}
              posterSizes={VIDEO_SIZES}
              playLabel={`${analysisPages.watchLabel}: ${analysis.videoTitle}`}
              watchUrl={getYouTubeWatchUrl(analysis.videoId)}
              watchLabel={analysisPages.watchOnYouTube}
            />
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AnalysisHero;
