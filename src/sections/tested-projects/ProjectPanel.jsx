import { useRef, useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import Button from '@/components/ui/Button';
import DashboardEmbed from '@/components/ui/DashboardEmbed';
import VideoEmbed from '@/components/ui/VideoEmbed';
import { testedProjects } from '@/content/testedProjectsContent';
import { useInView } from '@/hooks/useInView';
import { getAssetPath, getHeroImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/media';

// These demos have no still of their own, so they share the hero render as a
// poster, the same way the walkthroughs in the gallery do. With the real
// hero ladder behind it: this player spans the accordion body — up to 1232
// CSS px — where a bare 640 was painted upscaled (and worse than that at
// DPR 2).
const SHARED_POSTER = getHeroImageSources();

// The player spans the accordion body: Container content (100vw − 48,
// sm: 100vw − 64, capped at 1280 once the viewport hits 1344) minus this
// panel's own p-5 → 40 / sm:p-6 → 48. The article's 1px borders are ignored,
// same convention as every other sizes literal on the site.
const POSTER_SIZES =
  '(min-width: 1344px) 1232px, (min-width: 640px) calc(100vw - 112px), calc(100vw - 88px)';

// The open half of one project. Its own component so it can hold the useInView
// that starts the demo video, and so nothing inside it — neither the ~1.7 MB
// dashboard export nor the player — exists until the panel is actually opened.
const ProjectPanel = ({ project }) => {
  const ref = useRef(null);
  const isInView = useInView(ref);
  // Sticky once started by hand, so scrolling past does not tear the player
  // down mid-watch.
  const [wasActivated, setWasActivated] = useState(false);
  const { labels } = testedProjects;

  return (
    <div ref={ref} className="@container border-t border-edge p-5 sm:p-6">
      <p className="max-w-3xl text-base text-pretty text-ink-muted hyphens-auto @md:text-justify">
        {project.body}
      </p>
      <p className="mt-3 max-w-3xl text-sm font-semibold text-accent-strong dark:text-accent">
        {project.subtitle}
      </p>

      {/* Stacked, video first and dashboard under it: the order the previous
          site used, and the order that reads correctly — watch what the
          analysis does, then go and touch the thing it produced. Side by side
          also halved both of them for no gain. */}
      <div className="mt-8 space-y-8">
        <div>
          <p className="text-base font-semibold text-ink">{labels.videoBlockTitle}</p>
          <p className="mt-1 text-sm text-pretty text-ink-muted">
            {labels.videoBlockBody(project.title)}
          </p>
          <VideoEmbed
            isActive={isInView || wasActivated}
            src={getYouTubeEmbedUrl(project.youtubeId)}
            title={labels.videoTitle(project.title)}
            poster={SHARED_POSTER}
            posterAlt=""
            posterSizes={POSTER_SIZES}
            onActivate={() => setWasActivated(true)}
            playLabel={labels.playVideo(project.title)}
            className="mt-3"
          />
        </div>

        {project.dashboardPreview ? (
          <div>
            <p className="text-base font-semibold text-ink">{labels.dashboardTitle}</p>
            <p className="mt-1 text-sm text-pretty text-ink-muted">{labels.dashboardBody}</p>
            <DashboardEmbed
              title={project.title}
              url={getAssetPath(`dashboards/${project.id}/index.html`)}
              labels={{
                open: labels.dashboardOpen,
                loading: labels.dashboardLoading,
                interact: labels.dashboardInteract,
                frameLabel: labels.dashboardLabel,
                openLabel: labels.dashboardOpenLabel,
              }}
              className="mt-3"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row">
        <Button href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden="true" className="size-4" />
          {labels.repository}
        </Button>
        <Button
          href={getYouTubeWatchUrl(project.youtubeId)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          <Play aria-hidden="true" className="size-4" />
          {labels.watchOnYouTube}
        </Button>
      </div>
    </div>
  );
};

export default ProjectPanel;
