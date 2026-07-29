import { useRef } from 'react';
import { useInView } from '@/hooks/useInView';
import SectionCarousel from '@/sections/whats-new/SectionCarousel';

// Half of the 84rem container minus the 24px grid gap and this card's own
// 20px padding: 588px once the container caps at a 1344px viewport.
const SIZES =
  '(min-width: 1344px) 588px, (min-width: 1024px) calc(50vw - 84px), calc(100vw - 5rem)';

// One "rest of 1.2.0" card. Its own ref, because hooks cannot be called inside
// the parent's map and each card decides independently whether its carousel is
// on screen.
const HighlightCard = ({ highlight }) => {
  const cardRef = useRef(null);
  const isInView = useInView(cardRef);

  return (
    <article
      ref={cardRef}
      className="flex flex-col rounded-card border border-edge bg-surface-raised p-5 shadow-card"
    >
      {/* The text block absorbs the slack so the carousel is pinned to the
          bottom of the card. Cards in a row are already equal height (the
          grid stretches them), so this is what makes their frames, captions
          and controls line up even when one description runs longer. */}
      <div className="@container flex-1">
        <h4 className="text-lg font-semibold text-balance text-ink">{highlight.title}</h4>
        <p className="mt-2 text-sm hyphens-auto @md:text-justify text-ink-muted">
          {highlight.description}
        </p>

        {highlight.stat ? (
          <p className="mt-5 flex flex-wrap items-baseline gap-2 text-ink-muted">
            <span className="text-lg line-through">{highlight.stat.from}</span>
            <span aria-hidden="true">&rarr;</span>
            <span className="text-3xl font-bold tabular-nums text-accent-strong dark:text-accent">
              {highlight.stat.to}
            </span>
          </p>
        ) : null}

        {highlight.items?.length ? (
          <ul className="mt-4 space-y-2">
            {highlight.items.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-ink-muted">
                <span
                  aria-hidden="true"
                  className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                />
                {/* Sized flex item, otherwise justify has no slack to work
                    with — see the note in AnalysisBlock. */}
                <span className="min-w-0 flex-1 hyphens-auto @md:text-justify">{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {highlight.images.length > 0 ? (
        <div className="mt-5">
          <SectionCarousel
            images={highlight.images}
            isInView={isInView}
            frameClassName="aspect-video"
            sizes={SIZES}
          />
        </div>
      ) : null}
    </article>
  );
};

export default HighlightCard;
