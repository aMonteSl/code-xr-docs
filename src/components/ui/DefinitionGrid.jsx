// Dumb component: a list of term/description pairs as a real <dl>. No state,
// no hooks, no copy — the section passes `items`.
//
// One component, three jobs on the analysis pages: the chart list, the layout
// and edge-encoding list, and the metric glossary. They are all the same shape
// — a name plus what it means — so they get the same treatment rather than
// three near-identical grids.
//
// <dl> rather than a stack of headings: these are definitions, and a screen
// reader announcing "definition list, 8 items" is more useful than eight more
// h3s competing with the page's real outline.
//
// @container, not viewport breakpoints: this grid is meant to work in any slot
// (full width today, a narrower column tomorrow), which is exactly the case
// CLAUDE.md says container queries are for.
//
// `columns` is a prop rather than something a caller overrides through
// className. Passing `lg:grid-cols-2` from outside does NOT win: both classes
// have the same specificity, so Tailwind's own source order decides, and
// grid-cols-3 is emitted last. Same trap MediaCard documents about its frame.
// Four items in three columns leave one orphan on its own row, which is the case
// the 2 exists for.
const COLUMNS = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
};

const DefinitionGrid = ({ items, columns = 3, className = '' }) => {
  return (
    <dl className={`@container grid gap-4 ${COLUMNS[columns]} ${className}`}>
      {items.map((item) => (
        // The pair is one card, so the term can never end up in a different
        // column from its description when the grid reflows.
        <div
          key={item.term}
          className="rounded-card border border-edge bg-surface-raised p-4 shadow-card"
        >
          <dt className="text-sm font-bold tracking-tight text-balance text-ink">{item.term}</dt>
          <dd className="mt-1.5 text-sm text-pretty text-ink-muted">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
};

export default DefinitionGrid;
