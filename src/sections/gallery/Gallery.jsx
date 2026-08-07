import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import Container from '@/components/ui/Container';
import Lightbox from '@/components/ui/Lightbox';
import MediaCard from '@/components/ui/MediaCard';
import MediaVideo from '@/components/ui/MediaVideo';
import { gallery } from '@/content/galleryContent';
import { getHeroImageSources, getReleaseImageSources } from '@/lib/assets';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '@/lib/media';
import GalleryFilters from '@/sections/gallery/GalleryFilters';

const RELEASE = 'v1-2-0';

// "All" is an index, not a dump: showing every tile made the section 8004px,
// taller than the release section and half the page. Each group previews this
// many and offers its own chip to see the rest.
//
// Two, not four: at two columns that is exactly ONE row per category, which is
// what an index should be. Four made this the heaviest section on the page
// (6.2 screens, 28.5% of the document) for content that is not new — every
// still here has already appeared in the About carousel, What's new or
// Collaboration. Nothing is removed by this: the chips still report the real
// counts and "View all N" still opens the full set.
//
// The grid stays at two columns. Three was rejected on purpose: the
// screenshots have to be big enough to read the UI text inside them (536px at
// 1440, against 352 at three columns), and fewer-but-larger is the whole point.
const PREVIEW_PER_CATEGORY = 2;

// The shared poster for the videos rescued from the previous site, which have
// no still of their own. The hero render is already optimised and committed,
// and the hero backdrop has almost certainly warmed it in cache. With the
// real ladder behind it: "640px is more than the ~630px a card ever renders"
// only held at DPR 1 — a retina tile asks for ~1260 physical px and was
// getting a 640 stretched to double.
const SHARED_POSTER = getHeroImageSources();

// Two columns from sm inside the 84rem container, 20px gap: 630px per tile
// once the container caps at a 1344px viewport, 50vw-42px between sm and there.
const SIZES =
  '(min-width: 1344px) 630px, (min-width: 640px) calc(50vw - 42px), calc(100vw - 3rem)';

const thumbFor = (item) => {
  if (item.kind === 'video') {
    return item.poster ? getReleaseImageSources(RELEASE, item.poster) : SHARED_POSTER;
  }

  return getReleaseImageSources(item.release ?? RELEASE, item.file);
};

// Every screenshot and video in one browsable place, with filters. Also the
// home of the walkthroughs rescued from the previous site — this is the only
// place they exist.
//
// The previous release lives behind its own chip and is kept OUT of "All", so
// a v1.1.0 screenshot is only ever seen on purpose. See galleryContent.
const Gallery = () => {
  const [activeId, setActiveId] = useState('all');
  const [openIndex, setOpenIndex] = useState(null);

  const included = useMemo(
    () => gallery.items.filter((item) => !gallery.excluded.includes(item.file)),
    []
  );

  const byCategory = useMemo(
    () =>
      gallery.categories.map((category) => ({
        ...category,
        items: included.filter((item) => item.category === category.id),
      })),
    [included]
  );

  const archiveItems = useMemo(
    () => included.filter((item) => item.category === gallery.archive.id),
    [included]
  );

  const isArchive = activeId === gallery.archive.id;
  const isAll = activeId === 'all';

  // The flat list the lightbox steps through, in exactly the order the grid
  // renders — so "next" always means the tile to the right.
  const visibleItems = useMemo(() => {
    if (isAll) {
      return byCategory.flatMap((category) => category.items.slice(0, PREVIEW_PER_CATEGORY));
    }

    if (isArchive) {
      return archiveItems;
    }

    return byCategory.find((category) => category.id === activeId)?.items ?? [];
  }, [activeId, archiveItems, byCategory, isAll, isArchive]);

  const filters = useMemo(
    () => [
      { id: 'all', label: gallery.labels.all, count: byCategory.reduce((total, c) => total + c.items.length, 0) },
      ...byCategory.map((category) => ({ id: category.id, label: category.label, count: category.items.length })),
    ],
    [byCategory]
  );

  const selectFilter = (id) => {
    setActiveId(id);
    // The open item may not exist in the new list; never leave a stale index.
    setOpenIndex(null);
  };

  // The lightbox is for images only — videos play in place, so their tile is
  // not a trigger. Stepping therefore walks the images of the current view.
  const visibleImages = useMemo(
    () => visibleItems.filter((item) => item.kind === 'image'),
    [visibleItems]
  );

  const open = visibleImages[openIndex ?? -1] ?? null;
  const canStep = visibleImages.length > 1;
  const step = (delta) =>
    setOpenIndex((current) => (current + delta + visibleImages.length) % visibleImages.length);

  const renderGrid = (items) => (
    <div className="stagger-cards-2 grid grid-cols-1 gap-x-5 gap-y-7 sm:grid-cols-2">
      {items.map((item) => {
        const badge = item.category === gallery.archive.id ? gallery.archive.badge : null;

        if (item.kind === 'video') {
          return (
            <MediaVideo
              key={item.id}
              title={item.title}
              src={getYouTubeEmbedUrl(item.videoId)}
              poster={thumbFor(item)}
              posterAlt={item.alt}
              posterSizes={SIZES}
              playLabel={gallery.labels.openVideo}
              badge={badge}
              watchUrl={getYouTubeWatchUrl(item.videoId)}
              watchLabel={gallery.labels.watchOnYouTube}
            />
          );
        }

        return (
          <MediaCard
            key={item.id}
            title={item.title}
            image={thumbFor(item)}
            alt={item.alt}
            badge={badge}
            sizes={SIZES}
            label={gallery.labels.openImage}
            onOpen={() => setOpenIndex(visibleImages.findIndex((image) => image.id === item.id))}
          />
        );
      })}
    </div>
  );

  return (
    <section id="gallery" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {gallery.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {gallery.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {gallery.intro}
          </p>
        </div>

        <div className="mt-8 sm:mt-10">
          <GalleryFilters
            filters={filters}
            activeId={activeId}
            onSelect={selectFilter}
            archive={gallery.archive}
            archiveCount={archiveItems.length}
            countLabel={gallery.labels.countSuffix}
          />
        </div>

        {isArchive ? (
          <p className="mx-auto mt-6 flex max-w-2xl gap-3 rounded-card border border-edge bg-surface-raised p-4 text-sm text-pretty text-ink-muted shadow-card">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
            <span className="min-w-0 flex-1">{gallery.archive.note}</span>
          </p>
        ) : null}

        <div className="mt-8 sm:mt-10">
          {isAll ? (
            <div className="space-y-12">
              {byCategory.map((category) => {
                const preview = category.items.slice(0, PREVIEW_PER_CATEGORY);
                const hidden = category.items.length - preview.length;

                return (
                  <div key={category.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <h3 className="text-lg font-bold tracking-tight text-ink">{category.label}</h3>
                      {hidden > 0 ? (
                        <button
                          type="button"
                          onClick={() => selectFilter(category.id)}
                          // min-h-11 with a matching negative margin: a 44px
                          // touch target that still sits on the heading's
                          // baseline, instead of a 20px text link.
                          className="-my-3 inline-flex min-h-11 items-center text-sm font-semibold text-accent-strong underline underline-offset-4 transition-[color] duration-300 hover:text-ink motion-reduce:transition-none dark:text-accent"
                        >
                          {gallery.labels.viewAll(category.items.length)}
                        </button>
                      ) : null}
                    </div>
                    <div className="mt-4">{renderGrid(preview)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            renderGrid(visibleItems)
          )}
        </div>
      </Container>

      <Lightbox
        isOpen={open !== null}
        src={open ? thumbFor(open).src : ''}
        sources={open ? thumbFor(open).sources : []}
        alt={open?.alt ?? ''}
        caption={open ? `${open.title}. ${open.alt}` : ''}
        onClose={() => setOpenIndex(null)}
        onPrev={canStep ? () => step(-1) : undefined}
        onNext={canStep ? () => step(1) : undefined}
        labels={{
          close: gallery.labels.close,
          previous: gallery.labels.previous,
          next: gallery.labels.next,
        }}
      />
    </section>
  );
};

export default Gallery;
