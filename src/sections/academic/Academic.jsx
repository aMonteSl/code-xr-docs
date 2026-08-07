import { Award, Download, ExternalLink, FileText, Info, Presentation } from 'lucide-react';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { academic } from '@/content/academicContent';
import { award } from '@/content/awardContent';
import { getDocumentPath } from '@/lib/assets';

const ICONS = {
  award: Award,
  file: FileText,
  presentation: Presentation,
};

// The academic material, in the three-card shape the previous site used.
//
// Downloads are plain anchors with the `download` attribute. The old site ran
// a script that branched on window.location.hostname and opened a tab in
// production instead — unnecessary, since these PDFs are served from the same
// origin as the page, which is exactly the case where `download` is honoured.
// Dropping it also removes one of the places the domain was hardcoded.
const Academic = () => {
  return (
    <section id="academic" className="border-t border-edge py-16 sm:py-24">
      <Container>
        <div className="@container max-w-3xl">
          <p className="text-sm font-semibold tracking-wide text-accent-strong uppercase dark:text-accent">
            {academic.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {academic.heading}
          </h2>
          <p className="mt-4 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify sm:text-lg">
            {academic.intro}
          </p>
        </div>

        {/* 2-up from sm, 3-up from lg: the old straight 1→3 jump at md gave
            each card 224px at 768, where the p-6 chrome left 176px for a
            full Button and the tag line. The last card spans the 2-up row so
            the band never shows an orphan. */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {academic.resources.map((resource) => {
            const Icon = ICONS[resource.icon];
            const isExternal = resource.action.kind === 'external';
            const href = isExternal
              ? resource.action.href
              : getDocumentPath(resource.action.file);

            return (
              <div
                key={resource.id}
                className="flex flex-col rounded-card border border-edge bg-surface-raised p-6 text-center shadow-card sm:last:col-span-2 lg:last:col-span-1"
              >
                <span
                  aria-hidden="true"
                  className="mx-auto flex size-14 items-center justify-center rounded-full border border-edge bg-surface text-accent"
                >
                  {Icon ? <Icon className="size-7" /> : null}
                </span>

                <h3 className="mt-5 text-lg font-bold tracking-tight text-balance text-ink">
                  {resource.title}
                </h3>

                {/* grow: the descriptions differ in length, and this keeps the
                    tag, the button and the meta line level across the three. */}
                <p className="mt-3 grow text-sm text-pretty text-ink-muted">
                  {resource.description}
                </p>

                <p className="mt-4 rounded-lg border border-edge bg-surface-sunken px-3 py-2 text-xs font-semibold text-ink">
                  {resource.tag}
                </p>

                <div className="mt-4 grid">
                  <Button
                    href={href}
                    {...(isExternal
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : { download: resource.action.file })}
                  >
                    {isExternal ? (
                      <ExternalLink aria-hidden="true" className="size-4" />
                    ) : (
                      <Download aria-hidden="true" className="size-4" />
                    )}
                    {resource.action.label}
                  </Button>
                </div>

                <p className="mt-3 text-xs text-ink-muted">{resource.meta}</p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-card border border-edge bg-surface-raised p-5 shadow-card">
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
          <div className="@container min-w-0 flex-1">
            <p className="text-sm text-pretty text-ink-muted hyphens-auto @md:text-justify">
              <span className="font-semibold text-ink">{academic.note.label}: </span>
              {academic.note.body}
            </p>
            {/* The citation. The paper's title carries the DOI link, so the
                anchor text is the most citable string the project has instead
                of the three letters "DOI"; IEEE Xplore stays as a secondary
                mirror. Both open in a new tab, like every other outbound link
                in this section. */}
            {/* A true inline link, not the -my-3 inline-flex idiom the short
                standalone links use: this anchor is a 60-character title that
                wraps to 3-4 lines on narrow screens, and inline-flex turns a
                multi-line anchor into one atomic box that drops below the
                "Paper:" label and spills its negative margins over the note
                above and the authors below. As prose it shares line boxes;
                WCAG's target-size rule exempts links inside sentences. */}
            <p className="mt-3 text-sm text-ink-muted">
              <span className="font-semibold text-ink">{academic.paper.label}: </span>
              <a
                href={award.links.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-pretty text-accent-strong underline underline-offset-4 transition-[color] duration-300 hover:text-ink motion-reduce:transition-none dark:text-accent"
              >
                {award.artifactTitle}
              </a>
            </p>
            <p className="mt-1 text-sm text-pretty text-ink-muted">
              {academic.paper.authorsIntro} {award.authors.join(', ')} · {academic.paper.venueSuffix}
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              <a
                href={award.links.ieeeXplore}
                target="_blank"
                rel="noopener noreferrer"
                className="-my-3 inline-flex min-h-11 items-center font-semibold text-accent-strong underline underline-offset-4 transition-[color] duration-300 hover:text-ink motion-reduce:transition-none dark:text-accent"
              >
                {academic.paper.mirrorLabel}
              </a>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Academic;
