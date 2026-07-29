import { useState } from 'react';
import Container from '@/components/ui/Container';
import Lightbox from '@/components/ui/Lightbox';
import { tutorial } from '@/content/tutorialContent';
import { getReleaseImageSources } from '@/lib/assets';
import TutorialStep from '@/sections/tutorial/TutorialStep';

const RELEASE = 'v1-2-0';

// One half of the tutorial: a signpost heading, then its numbered steps.
//
// It owns ONE lightbox for every screenshot in the part, as a sibling of the
// Container. That placement is required, not stylistic: the Container is what
// the scroll reveal animates, and a <dialog> inside an animated subtree is the
// trap main.css documents. It is also why the steps cannot each own one.
//
// Stepping therefore browses the whole part, not one step. That is a
// deliberate, coherent scope: "Inside the room" is five shots of the same room,
// and moving between them is what a reader who opened one of them wants. The
// finer-grained alternative (one lightbox per step) would need eight dialogs
// outside eight Containers, i.e. eight sections, which is how this page would
// have grown from six sections to fourteen.
const TutorialPart = ({ part }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const steps = tutorial.steps.filter((step) => step.part === part.id);

  // Flat list of every image in the part, in document order, plus the offset
  // each step starts at. Both derived from `steps`, so a step gaining or losing
  // a screenshot needs no bookkeeping here.
  const images = steps.flatMap((step) => step.images ?? []);
  const offsets = [];
  let running = 0;

  for (const step of steps) {
    offsets.push(running);
    running += (step.images ?? []).length;
  }

  const open = images[openIndex ?? -1] ?? null;
  const canStep = images.length > 1;
  const stepBy = (delta) =>
    setOpenIndex((current) => (current + delta + images.length) % images.length);

  return (
    <section id={part.id} className="border-t border-edge py-12 sm:py-16">
      <Container>
        <div className="@container max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {part.label}
          </h2>
          <p className="mt-2 text-base text-pretty text-ink-muted">{part.caption}</p>
        </div>

        {/* space-y rather than a grid: the steps are a vertical sequence of
            varying height, and the generous gap is what keeps two numbered
            blocks from reading as one. */}
        <div className="mt-10 space-y-12 sm:mt-12 sm:space-y-16">
          {steps.map((step, index) => (
            <TutorialStep
              key={step.id}
              step={step}
              expandLabel={tutorial.lightbox.expand}
              onOpenImage={(imageIndex) => setOpenIndex(offsets[index] + imageIndex)}
            />
          ))}
        </div>
      </Container>

      {/* Only where there is something to open. "Setting up" runs as text, and
          an always-mounted Lightbox left a <dialog> in the DOM that nothing
          could ever show. */}
      {images.length ? (
        <Lightbox
          isOpen={open !== null}
          src={open ? getReleaseImageSources(RELEASE, open.file).src : ''}
          sources={open ? getReleaseImageSources(RELEASE, open.file).sources : []}
          alt={open?.alt ?? ''}
          caption={open ? `${open.title}. ${open.alt}` : ''}
          onClose={() => setOpenIndex(null)}
          onPrev={canStep ? () => stepBy(-1) : undefined}
          onNext={canStep ? () => stepBy(1) : undefined}
          labels={tutorial.lightbox}
        />
      ) : null}
    </section>
  );
};

export default TutorialPart;
