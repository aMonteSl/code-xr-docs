// The filter chips. Same weight-based treatment as the step pills in
// Collaboration: the active one is the solid fill, the rest are outlines.
//
// The archive chip is separated by a divider and carries its version as its
// label, because its material is from the previous release and must never be
// mistaken for how the extension looks today.
//
// The item counts are secondary by WEIGHT, not by opacity: at 12px, fading
// them to 70% measured 3.35:1 on the active chip and 4.10:1 on the rest,
// under the 4.5:1 small text needs. At full strength they sit at 6.72 / 6.46.
const CHIP =
  'inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold transition-[background-color,border-color,color] duration-300 motion-reduce:transition-none';

const chipClass = (isActive) =>
  `${CHIP} ${
    isActive
      ? 'border-transparent bg-accent text-on-accent hover:bg-accent-strong'
      : 'border-edge text-ink-muted hover:border-accent/40 hover:text-ink'
  }`;

const GalleryFilters = ({ filters, activeId, onSelect, archive, archiveCount, countLabel }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onSelect(filter.id)}
          aria-pressed={filter.id === activeId}
          className={chipClass(filter.id === activeId)}
        >
          <span>{filter.label}</span>
          <span className="text-xs font-normal tabular-nums">{filter.count}</span>
        </button>
      ))}

      <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-edge sm:block" />

      <button
        type="button"
        onClick={() => onSelect(archive.id)}
        aria-pressed={archive.id === activeId}
        aria-label={`${archive.label}, ${countLabel(archiveCount)}`}
        className={chipClass(archive.id === activeId)}
      >
        <span>{archive.label}</span>
        <span className="text-xs font-normal tabular-nums">{archiveCount}</span>
      </button>
    </div>
  );
};

export default GalleryFilters;
