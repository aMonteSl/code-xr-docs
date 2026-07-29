import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

// Dumb component: a standalone section-level navigation link, rendered as a
// bordered chip instead of underlined text. All copy arrives as children; no
// state, no content imports.
//
// Why a chip: the small accent-underline links were invisible in practice —
// 14px text reading as a footnote next to 16-18px body copy. This raises them
// to text-base on a raised, bordered, softly shadowed surface, so they read as
// controls. The hover is the exact lift + border string LinkCard, StatCard and
// TechStrip carry, because it makes the same promise ("this navigates") — it
// joins that convention rather than inventing a second one. No hue shift, no
// glow: emphasis by weight and border, per the site's visual language.
//
// This is for STANDALONE links only — the hand-offs between sections, the
// "Explore …" links, the FAQ actions, the back link on the analysis pages.
// Links inside prose (the Academic citation) and inside media UI ("Watch on
// YouTube") deliberately keep the small underline idiom: a chip mid-sentence
// breaks the text, and inside a card it would compete with the card.
//
// Icon semantics, unchanged: `right` stays on the site (in-page anchor or
// another page of it), `up-right` leaves the site, `left` goes back. The
// arrow sits after the label except for `left`, where it leads.
const ICONS = {
  right: ArrowRight,
  'up-right': ArrowUpRight,
  left: ArrowLeft,
};

const SectionLink = ({ href, icon = 'right', className = '', children, ...rest }) => {
  const Icon = ICONS[icon];
  const arrow = <Icon aria-hidden="true" className="size-4.5 shrink-0" />;

  return (
    <a
      href={href}
      // Explicit transition list: outline-color must stay out of it (see the
      // focus-ring rules in main.css), and motion-reduce gets a static chip.
      className={`inline-flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-surface-raised px-4 py-2.5 text-base font-semibold text-accent-strong shadow-card transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/40 motion-reduce:transform-none motion-reduce:transition-none dark:text-accent ${className}`}
      {...rest}
    >
      {icon === 'left' ? arrow : null}
      {/* text-balance: at 320px the longer labels wrap to two lines, and a
          balanced break beats a one-word orphan under the first line. */}
      <span className="min-w-0 text-balance">{children}</span>
      {icon === 'left' ? null : arrow}
    </a>
  );
};

export default SectionLink;
