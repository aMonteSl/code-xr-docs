import { useRef, useState } from 'react';
import SectionLink from '@/components/ui/SectionLink';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { analysisPages } from '@/content/analysisPagesContent';
import { whatsNew } from '@/content/whatsNewContent';
import { useInView } from '@/hooks/useInView';
import { getReleaseImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl } from '@/lib/media';
import SectionCarousel from '@/sections/whats-new/SectionCarousel';

const RELEASE = 'v1-2-0';

// Half of the 84rem container minus the 32px gap, so 624px once the container
// caps at a 1344px viewport and exactly 50vw-48px between lg and there.
const SIZES =
  '(min-width: 1344px) 624px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 3rem)';

// One analysis: the copy on top at reading width, then its screenshots on the
// left and the demo video on the right.
//
// A single useInView on the block governs both: the carousel only rotates and
// the video only loads and plays while the block is on screen. Nothing is
// requested from YouTube until then.
const AnalysisBlock = ({ analysis }) => {
  // The detail page for this analysis, matched on the same id both modules use.
  const page = analysisPages.pages.find((item) => item.id === analysis.id);
  const blockRef = useRef(null);
  const isInView = useInView(blockRef);
  // Only the video is sticky. The carousel keeps following isInView alone —
  // there is no reason for a hand-started video to keep a carousel rotating
  // off screen.
  const [wasActivated, setWasActivated] = useState(false);

  return (
    <div ref={blockRef}>
      <div className="@container max-w-3xl">
        <h3 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">
          {analysis.title}
        </h3>

        <p className="mt-3 text-base hyphens-auto @md:text-justify text-ink-muted">
          {analysis.description}
        </p>

        <ul className="mt-4 space-y-2">
          {analysis.points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm text-ink-muted">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
              {/* The text needs its own sized flex item: as a bare text node it
                  becomes an anonymous item shrink-wrapped to its content, and
                  justify has no slack to distribute. */}
              <span className="min-w-0 flex-1 hyphens-auto @md:text-justify">{point}</span>
            </li>
          ))}
        </ul>

        {/* Default (in-site) arrow, not up-right: on this site the up-right
            arrow means the link leaves the SITE (StatCard, TechStrip, the
            FAQ's issue link). This is another page of the same site. */}
        <SectionLink href={`/analysis/${page.slug}/`} className="mt-6">
          {analysisPages.exploreLabel(page.name)}
        </SectionLink>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <SectionCarousel
          images={analysis.images}
          isInView={isInView}
          frameClassName="aspect-video"
          sizes={SIZES}
        />

        <div>
          <VideoEmbed
            isActive={isInView || wasActivated}
            src={getYouTubeEmbedUrl(analysis.videoId)}
            title={analysis.videoTitle}
            poster={getReleaseImageSources(RELEASE, analysis.images[0].file)}
            posterAlt=""
            posterSizes={SIZES}
            onActivate={() => setWasActivated(true)}
            playLabel={`${whatsNew.watchLabel}: ${analysis.videoTitle}`}
          />
          {/* Mirrors the carousel's caption row exactly: a 44px row (its
              height is set by the carousel's 44px controls) holding a 40px
              text box, centred. Without the outer row this column ended 4px
              short of the carousel's and its text sat 2px higher. */}
          <div className="mt-3 flex min-h-11 items-center">
            <p className="line-clamp-2 min-h-10 text-sm text-pretty text-ink-muted">
              {whatsNew.watchLabel}: {analysis.videoTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisBlock;
