import Container from '@/components/ui/Container';
import MediaVideo from '@/components/ui/MediaVideo';
import SectionBridge from '@/components/ui/SectionBridge';
import { TUTORIAL_VIDEO, tutorial } from '@/content/tutorialContent';
import { getReleaseImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/media';

const RELEASE = 'v1-2-0';

// Half the 84rem container from lg (624px once it caps), full width below. The
// same slot every other paired video on the site sits in.
const VIDEO_SIZES =
  '(min-width: 1344px) 624px, (min-width: 1024px) calc(50vw - 48px), calc(100vw - 3rem)';

// The tutorial teaser, between Install and Gallery.
//
// It sits there because that is where the page's own comment (App.jsx) says the
// "how do I use this" demand peaks: it is the reason Gallery was moved behind
// Install in the first place. Install above gets a first scene on screen; this
// is the complete tour.
//
// Deliberately short. It surfaces the video and points at the page; it does not
// summarise the twelve steps, which would be a second copy of them. The outline
// is the two parts, read from the same array the page lays itself out with.
const Tutorial = () => {
  const { home } = tutorial;

  return (
    <section id="tutorial" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="@container">
            <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
              {home.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              {home.heading}
            </h2>
            <p className="mt-4 text-base hyphens-auto @md:text-justify text-ink-muted sm:text-lg">
              {home.intro}
            </p>

            <p className="mt-6 text-sm font-semibold text-ink">{home.outlineTitle}</p>
            {/* The two halves, as a real <ol>: they are ordered, and the page
                below presents them in this order. */}
            <ol className="mt-3 space-y-2">
              {tutorial.parts.map((part, index) => (
                <li key={part.id} className="flex gap-3 text-sm">
                  <span
                    aria-hidden="true"
                    className="flex size-6 shrink-0 items-center justify-center rounded-md border border-edge bg-surface-raised text-xs font-bold text-accent-strong tabular-nums dark:text-accent"
                  >
                    {index + 1}
                  </span>
                  {/* Sized flex item, or the text shrink-wraps and the badge
                      drifts away from it on a wrap. */}
                  <span className="min-w-0 flex-1 text-pretty">
                    <span className="font-semibold text-ink">{part.label}</span>
                    {': '}
                    <span className="text-ink-muted">{part.caption}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* lg:self-start so the video keeps its aspect ratio instead of being
              stretched to the height of the copy column. */}
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

        {/* A sibling of the grid, never a third grid child: as a child it would
            land in one of the two columns. Full container width under both is
            what says the section is over. It also has to stay inside Container,
            or it picks up its own scroll reveal and pops in separately. */}
        <SectionBridge
          className="mt-10 sm:mt-12"
          text={home.bridge.text}
          label={home.bridge.label}
          href={home.bridge.href}
        />
      </Container>
    </section>
  );
};

export default Tutorial;
