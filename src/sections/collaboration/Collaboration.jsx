import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import Container from '@/components/ui/Container';
import Lightbox from '@/components/ui/Lightbox';
import { collaboration } from '@/content/collaborationContent';
import { getReleaseImageSources } from '@/lib/assets';
import StepCarousel from '@/sections/collaboration/StepCarousel';

const RELEASE = 'v1-2-0';

// The cross-network walkthrough: two roles, six steps, one security principle
// up front and the fine print at the end. One shared Lightbox serves every
// step image.
const Collaboration = () => {
  const [expanded, setExpanded] = useState(null);

  return (
    <section id="collaboration" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {collaboration.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {collaboration.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {collaboration.intro}
          </p>

          {/* The principle everything below hangs from. */}
          <div className="mt-6 flex gap-4 rounded-card border border-accent/40 bg-surface-raised p-5 shadow-card">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-accent" />
            {/* min-w-0: a flex item will not shrink below its content without
                it, and this one overflowed the card by 66px at 320. */}
            <div className="@container min-w-0 flex-1">
              <p className="text-lg font-semibold text-ink">{collaboration.principle.title}</p>
              <p className="mt-1 text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
                {collaboration.principle.body}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 sm:mt-12">
          <StepCarousel
            steps={collaboration.steps}
            roles={collaboration.roles}
            labels={collaboration.carousel}
            expandLabel={collaboration.lightbox.expand}
            onExpand={setExpanded}
          />
        </div>

        <div className="mt-10 rounded-card border border-edge bg-surface-raised p-5 shadow-card sm:mt-12">
          <p className="text-lg font-semibold text-ink">{collaboration.notesTitle}</p>
          <ul className="mt-3 space-y-2">
            {collaboration.notes.map((note) => (
              <li key={note} className="flex gap-2.5 text-sm text-ink-muted">
                <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                <span className="@container min-w-0 flex-1">
                  <span className="block text-pretty hyphens-auto @md:text-justify">{note}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      <Lightbox
        isOpen={expanded !== null}
        src={expanded ? getReleaseImageSources(RELEASE, expanded.file).src : ''}
        sources={expanded ? getReleaseImageSources(RELEASE, expanded.file).sources : []}
        alt={expanded?.alt ?? ''}
        caption={expanded?.alt ?? ''}
        onClose={() => setExpanded(null)}
        labels={{ close: collaboration.lightbox.close }}
      />
    </section>
  );
};

export default Collaboration;
