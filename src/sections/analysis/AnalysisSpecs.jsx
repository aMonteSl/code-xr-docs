import Container from '@/components/ui/Container';
import DefinitionGrid from '@/components/ui/DefinitionGrid';

// A titled block of term/description pairs. Used twice per analysis page: once
// for the charts (or, for the dependency graph, its layouts and edge modes)
// and once for the metric glossary.
//
// Two call sites, one component, because they are the same thing wearing
// different headings — the alternative was a ChartList and a Glossary that
// differed only in their copy.
const AnalysisSpecs = ({ id, heading, intro, items }) => {
  return (
    <section id={id} className="border-t border-edge py-12 sm:py-16">
      <Container>
        <div className="@container max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{heading}</h2>
          {intro ? (
            <p className="mt-3 text-base text-pretty text-ink-muted hyphens-auto @md:text-justify">
              {intro}
            </p>
          ) : null}
        </div>

        <DefinitionGrid items={items} className="mt-6" />
      </Container>
    </section>
  );
};

export default AnalysisSpecs;
