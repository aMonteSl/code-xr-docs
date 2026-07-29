import { useState } from 'react';
import Container from '@/components/ui/Container';
import Lightbox from '@/components/ui/Lightbox';
import MediaCard from '@/components/ui/MediaCard';
import { analysisPages } from '@/content/analysisPagesContent';
import { getReleaseImageSources } from '@/lib/assets';

const RELEASE = 'v1-2-0';

// Derived from the real grid, not guessed. The Container caps at 84rem (1344px)
// with 32px gutters, so the content box tops out at 1280. The grid below is
// 1 / 2 / 3 columns with a 20px gap, so at the cap each tile is
// (1280 - 2*20) / 3 = 413px.
//
// Three columns, not two: unlike the gallery — where two columns exist so the
// UI text inside a screenshot stays readable — these groups run 1 to 3 images
// and a 2-col grid leaves a hole on every odd group. Anything a reader wants to
// read closely opens in the lightbox.
const SIZES =
  '(min-width: 1344px) 413px, (min-width: 1024px) calc(33vw - 35px), (min-width: 640px) calc(50vw - 42px), calc(100vw - 3rem)';

// One titled group of screenshots on an analysis page: a heading, a one-line
// caption, and a grid of tiles that all open a lightbox this component owns.
//
// The lightbox lives here rather than on the page so each group steps through
// its OWN images — "next" inside "The three layouts" should not wander into the
// guide pages. Same one-lightbox-per-list pattern Gallery and Collaboration use,
// just at a finer grain.
const MediaGroup = ({ group }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const open = group.images[openIndex ?? -1] ?? null;
  const canStep = group.images.length > 1;
  const step = (delta) =>
    setOpenIndex((current) => (current + delta + group.images.length) % group.images.length);

  return (
    <section id={group.id} className="border-t border-edge py-12 sm:py-16">
      <Container>
        <div className="@container max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {group.label}
          </h2>
          <p className="mt-2 text-base text-pretty text-ink-muted">{group.caption}</p>
        </div>

        {/* items-start so a tile never stretches to match a taller neighbour;
            every tile is aspect-video anyway, so the rows line up by
            construction and only the caption below can differ in height. */}
        <div className="mt-6 grid grid-cols-1 items-start gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {group.images.map((image, index) => (
            <MediaCard
              key={image.file}
              title={image.title}
              image={getReleaseImageSources(RELEASE, image.file)}
              alt={image.alt}
              label={analysisPages.lightbox.expand}
              sizes={SIZES}
              onOpen={() => setOpenIndex(index)}
            />
          ))}
        </div>
      </Container>

      <Lightbox
        isOpen={open !== null}
        src={open ? getReleaseImageSources(RELEASE, open.file).src : ''}
        sources={open ? getReleaseImageSources(RELEASE, open.file).sources : []}
        alt={open?.alt ?? ''}
        caption={open ? `${open.title}. ${open.alt}` : ''}
        onClose={() => setOpenIndex(null)}
        onPrev={canStep ? () => step(-1) : undefined}
        onNext={canStep ? () => step(1) : undefined}
        labels={analysisPages.lightbox}
      />
    </section>
  );
};

export default MediaGroup;
