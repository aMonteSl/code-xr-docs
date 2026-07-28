import React, { useState } from 'react';
import {
  CalendarDays,
  Monitor,
  SlidersHorizontal,
  Users,
  Zap,
} from 'lucide-react';
import AutoplayVideoPreview from '../components/AutoplayVideoPreview';
import MediaLightbox from '../components/MediaLightbox';
import { latestRelease } from '../content/releaseContent';
import useVSCodeMarketplaceData from '../hooks/useVSCodeMarketplaceData';
import { getAssetPath } from '../utils/assets';

const iconMap = {
  zap: Zap,
  users: Users,
  monitor: Monitor,
  sliders: SlidersHorizontal,
};

const handleCardKeyDown = (event, callback) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    callback();
  }
};

const formatReleaseDate = (value) => {
  if (!value || value === '-') {
    return '-';
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const LatestRelease = () => {
  const [selectedMedia, setSelectedMedia] = useState(null);
  const marketplaceData = useVSCodeMarketplaceData();
  const sceneComparison = latestRelease.comparisonMedia[0];
  const featureScreenshots = latestRelease.comparisonMedia.slice(1);
  const performanceComparison = latestRelease.performanceComparison;
  const publishedDate = formatReleaseDate(
    marketplaceData.lastUpdated !== '-' ? marketplaceData.lastUpdated : latestRelease.publishedAt
  );

  return (
    <section id="latest-release" className="relative overflow-hidden bg-transparent py-24">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,170,255,0.04),transparent_34%)]" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-neon-blue/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-purple-400/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-16 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)] xl:gap-14">
          <div data-aos="fade-up">
            <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl xl:text-[3.5rem]">
              {latestRelease.headline}
            </h2>
            <p className="text-lg leading-relaxed text-gray-300 sm:text-xl">
              {latestRelease.summary}
            </p>
          </div>

          <div className="lg:flex lg:items-end" data-aos="fade-up" data-aos-delay="100">
            <div className="glass-card w-full p-6 sm:p-7">
              <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-slate-950/75 px-4 py-2 text-sm text-gray-300 backdrop-blur-sm">
                <CalendarDays size={15} className="text-neon-blue" />
                <span className="font-medium text-white">Published</span>
                <span>{publishedDate}</span>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-gray-300">
                Jump into the release media or open the extension listing to explore the latest
                collaborative XR workflow in context.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <a
                  href="#gallery"
                  className="btn-primary inline-flex items-center justify-center space-x-2"
                >
                  <span>Browse release media</span>
                </a>
                <a
                  href="https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary inline-flex items-center justify-center space-x-2"
                >
                  <span>Open Marketplace listing</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-8 max-w-3xl" data-aos="fade-up">
            <h3 className="mb-3 text-2xl font-bold text-white md:text-3xl">Release highlights</h3>
            <p className="text-gray-300">
              Four product changes define the v1.1.0 release and give the landing a clear story
              tied to the latest public version.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {latestRelease.highlights.map((highlight, index) => {
              const HighlightIcon = iconMap[highlight.icon];

              return (
                <article
                  key={highlight.id}
                  className="glass-card-hover flex h-full flex-col p-6"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-neon-blue/10 p-3 text-neon-blue">
                      <HighlightIcon size={24} />
                    </div>
                    <span className="text-sm font-semibold text-neon-blue">{highlight.stat}</span>
                  </div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-gray-400">
                    {highlight.eyebrow}
                  </div>
                  <h4 className="mb-3 text-xl font-bold text-white md:min-h-14">
                    {highlight.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-gray-300">{highlight.description}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-8 max-w-3xl" data-aos="fade-up">
            <h3 className="mb-3 text-2xl font-bold text-white md:text-3xl">
              Visual comparison and release media
            </h3>
            <p className="text-gray-300">
              The new scene, the faster analysis pipeline, and the collaborative tools now read as
              one coherent release story.
            </p>
          </div>

          <div className="space-y-6">
            <article className="glass-card overflow-hidden" data-aos="fade-up">
              <div className="border-b border-white/10 p-6">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-neon-blue">
                  Hero comparison
                </div>
                <h4 className="mb-2 text-xl font-bold text-white">{sceneComparison.title}</h4>
                <p className="text-sm leading-relaxed text-gray-300">{sceneComparison.description}</p>
              </div>

              <div className="grid gap-px bg-white/10 md:grid-cols-2">
                <div className="bg-black/60 p-5">
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-gray-300">
                    <span>{sceneComparison.before.label}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-gray-500">
                      Before
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90">
                    <img
                      src={getAssetPath(sceneComparison.before.imagePath)}
                      alt="Code-XR v1.0.0 XR scene"
                      className="aspect-4/3 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="bg-black/60 p-5">
                  <div className="mb-3 flex items-center justify-between text-sm font-semibold text-neon-blue">
                    <span>{sceneComparison.after.label}</span>
                    <span className="text-xs uppercase tracking-[0.18em] text-neon-blue/70">
                      After
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90">
                    <img
                      src={getAssetPath(sceneComparison.after.imagePath)}
                      alt="Code-XR v1.1.0 XR scene"
                      className="aspect-4/3 w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </article>

            <article className="glass-card overflow-hidden" data-aos="fade-up" data-aos-delay="100">
              <div className="border-b border-white/10 p-6">
                <div className="mb-2 text-xs uppercase tracking-[0.2em] text-neon-blue">
                  {performanceComparison.mediaLabel}
                </div>
                <h4 className="mb-2 text-xl font-bold text-white">{performanceComparison.title}</h4>
                <p className="max-w-3xl text-sm leading-relaxed text-gray-300">
                  {performanceComparison.description}
                </p>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-sm">
                      <thead className="bg-black/35">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-white">Metric</th>
                          <th className="px-4 py-3 font-semibold text-gray-300">v1.0.0</th>
                          <th className="px-4 py-3 font-semibold text-neon-blue">v1.1.0</th>
                          <th className="px-4 py-3 font-semibold text-white">Improvement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-slate-950/75">
                        {performanceComparison.comparisonRows.map((row) => (
                          <tr key={row.id}>
                            <td className="px-4 py-3 font-medium text-white">{row.metric}</td>
                            <td className="px-4 py-3 text-gray-300">{row.before}</td>
                            <td className="px-4 py-3 font-semibold text-neon-blue">{row.after}</td>
                            <td className="px-4 py-3 text-white">{row.improvement}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="divide-y divide-white/10 bg-slate-950/75 sm:hidden">
                    {performanceComparison.comparisonRows.map((row) => (
                      <div key={row.id} className="space-y-3 p-4">
                        <div className="text-sm font-semibold text-white">{row.metric}</div>
                        <dl className="grid gap-3 text-sm">
                          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                            <dt className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                              v1.0.0
                            </dt>
                            <dd className="mt-1 text-gray-300">{row.before}</dd>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                            <dt className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                              v1.1.0
                            </dt>
                            <dd className="mt-1 font-semibold text-neon-blue">{row.after}</dd>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                            <dt className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                              Improvement
                            </dt>
                            <dd className="mt-1 text-white">{row.improvement}</dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-px bg-white/10 md:grid-cols-2">
                {[performanceComparison.before, performanceComparison.after].map((item) => (
                  <div key={item.label} className="bg-black/60 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{item.label}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-neon-blue">
                        {item.stat}
                      </span>
                    </div>
                    <div className="flex aspect-16/10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/90 p-3">
                      <img
                        src={getAssetPath(item.imagePath)}
                        alt={`${item.label} performance comparison`}
                        className="h-full w-full rounded-xl object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <div className="pt-2" data-aos="fade-up" data-aos-delay="150">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.2em] text-neon-blue">
                    Feature screenshots
                  </div>
                  <h4 className="text-xl font-bold text-white">Release tools in context</h4>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-gray-300">
                  Virtual screens, in-scene remapping, and collaborative presence stay grouped in a
                  cleaner gallery with more consistent framing.
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {featureScreenshots.map((media, index) => (
                  <article
                    key={media.id}
                    className="glass-card-hover group flex h-full flex-col overflow-hidden text-left"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                    onClick={() => setSelectedMedia(media)}
                    onKeyDown={(event) => handleCardKeyDown(event, () => setSelectedMedia(media))}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="p-4 pb-0">
                      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/90">
                        <img
                          src={getAssetPath(media.imagePath)}
                          alt={media.title}
                          className="aspect-16/10 w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-2 text-xs uppercase tracking-[0.2em] text-neon-blue">
                        {media.mediaLabel}
                      </div>
                      <h4 className="mb-2 text-lg font-bold text-white">{media.title}</h4>
                      <p className="text-sm leading-relaxed text-gray-300">{media.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-8 max-w-3xl" data-aos="fade-up">
            <h3 className="mb-3 text-2xl font-bold text-white md:text-3xl">New workflow videos</h3>
            <p className="text-gray-300">
              The latest release already includes two new XR workflow videos, and both should be
              featured before the legacy tutorial archive.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {latestRelease.latestVideos.map((video, index) => (
              <article
                key={video.id}
                className="glass-card-hover overflow-hidden text-left"
                data-aos="fade-up"
                data-aos-delay={index * 120}
                onClick={() => setSelectedMedia(video)}
                onKeyDown={(event) => handleCardKeyDown(event, () => setSelectedMedia(video))}
                role="button"
                tabIndex={0}
              >
                <div className="relative">
                  <AutoplayVideoPreview
                    videoUrl={video.videoUrl}
                    title={video.title}
                    mediaLabel={video.mediaLabel}
                    className="aspect-16/10 w-full sm:aspect-video"
                  />
                </div>
                <div className="p-6">
                  <h4 className="mb-3 text-xl font-bold text-white">{video.title}</h4>
                  <p className="text-sm leading-relaxed text-gray-300">{video.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <MediaLightbox item={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </section>
  );
};

export default LatestRelease;
