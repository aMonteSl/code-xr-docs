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
//
// Each arrow slides 2px ALONG its own direction on hover — right slides
// right, up-right diagonally, left slides left ("back" backs away). 2px, not
// more: the chip itself already lifts 2px and the icon rides on top of that;
// anything larger reads as the icon escaping the chip.
const ICONS = {
  right: { Icon: ArrowRight, slide: 'motion-safe:group-hover:translate-x-0.5' },
  'up-right': { Icon: ArrowUpRight, slide: 'motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5' },
  left: { Icon: ArrowLeft, slide: 'motion-safe:group-hover:-translate-x-0.5' },
};

const SectionLink = ({ href, icon = 'right', className = '', children, ...rest }) => {
  const { Icon, slide } = ICONS[icon];
  const arrow = (
    <Icon
      aria-hidden="true"
      className={`size-4.5 shrink-0 transition-[translate] duration-300 motion-reduce:transition-none ${slide}`}
    />
  );

  return (
    <a
      href={href}
      // Explicit transition list: outline-color must stay out of it (see the
      // focus-ring rules in main.css), and motion-reduce gets a static chip.
      // `translate`, not `transform`, in the transition list: in Tailwind v4
      // the translate-* utilities write the standalone translate property, so
      // a transition list naming only transform never transitioned it and the
      // lift snapped. (Do not write an example class in a comment here —
      // Tailwind scans this file as source text and would emit a rule for it.)
      //
      // motion-safe on the HOVER, rather than a motion-reduce reset after it.
      // A reset cannot win: `hover:` compiles to a class plus a pseudo-class
      // (0,2,0) while `motion-reduce:` is a bare class (0,1,0), and a media
      // query adds no specificity — so `motion-reduce:translate-none` lost
      // every time and the chip still jumped 2px instantly under reduced
      // motion. Gating the hover itself is what actually keeps it still.
      // Bare `group`: no SectionLink nests inside another .group today — if
      // one ever lands inside a grouped card, rename to group/link here and
      // group-hover/link: on the arrows.
      className={`group inline-flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-surface-raised px-4 py-2.5 text-base font-semibold text-accent-strong shadow-card transition-[border-color,translate] duration-300 hover:border-accent/40 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none dark:text-accent ${className}`}
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
