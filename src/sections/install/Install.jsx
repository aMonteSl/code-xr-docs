import Container from '@/components/ui/Container';
import SectionLink from '@/components/ui/SectionLink';
import { install } from '@/content/installContent';
import { TUTORIAL_HREF, TUTORIAL_LABEL } from '@/content/tutorialContent';
import InstallMethods from '@/sections/install/InstallMethods';
import QuickStart from '@/sections/install/QuickStart';

// Install and first run in one section, which is how they belong: the previous
// site split them across two, and the second one opened by telling you to
// install again.
//
// Requirements are NOT repeated here. They live in "Under the hood" and this
// links to them.
const Install = () => {
  return (
    <section id="install" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {install.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {install.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {install.intro}
          </p>
          <SectionLink href={install.requirementsHref} className="mt-5">
            {install.requirementsHint}
          </SectionLink>
        </div>

        <div className="mt-10 sm:mt-12">
          <InstallMethods />
        </div>

        <div className="mt-12 sm:mt-16">
          <QuickStart />
        </div>

        {/* The hand-off from the short version to the long one. Not a
            SectionBridge: that component pushes its link to the inline END to
            clear the floating action button, which is right for a section's
            last row and wrong here, where the sentence and the link belong
            together directly under the block they follow. */}
        <div className="mt-8 max-w-3xl">
          <p className="text-sm text-pretty text-ink-muted">{install.tutorialHint}</p>
          <SectionLink href={TUTORIAL_HREF} className="mt-3">
            {TUTORIAL_LABEL}
          </SectionLink>
        </div>
      </Container>
    </section>
  );
};

export default Install;
