import { ArrowRight } from 'lucide-react';
import Picture from '@/components/ui/Picture';

// Dumb component: a card that is entirely a link. Image on top, then a title,
// a line of description and an arrow. No state, no hooks, no copy.
//
// The hover lift is the same string StatCard and TechStrip carry, because it is
// the site's one signal for "this whole card navigates" — this joins that
// convention rather than inventing a second one.
//
// ArrowRight, not ArrowUpRight: on this site the up-right arrow means the link
// leaves the SITE. These go to another page of it.
//
// aspect-video + object-contain on the image, so a row of cards lines up
// whatever the source screenshots' own ratios are.
const LinkCard = ({ href, title, description, image, alt, sizes, label }) => {
  return (
    <a
      href={href}
      // translate, not transform, in the transition list and the reduce
      // reset: Tailwind v4's translate-* utilities write the standalone
      // translate property — see SectionLink for the full note.
      className="group flex flex-col overflow-hidden rounded-card border border-edge bg-surface-raised shadow-card transition-[border-color,translate] duration-300 hover:-translate-y-0.5 hover:border-accent/40 motion-reduce:translate-none motion-reduce:transition-none"
    >
      <span className="block aspect-video w-full overflow-hidden bg-surface-sunken">
        <Picture
          src={image.src}
          sources={image.sources}
          alt={alt}
          sizes={sizes}
          loading="lazy"
          decoding="async"
          className="size-full object-contain"
        />
      </span>

      {/* flex-1 so the arrow row sits on the bottom edge of every card even
          when the titles wrap to different heights. */}
      <span className="flex flex-1 flex-col p-5">
        <span className="text-lg font-bold tracking-tight text-balance text-ink">{title}</span>
        <span className="mt-2 flex-1 text-sm text-pretty text-ink-muted">{description}</span>

        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong transition-[color] duration-300 group-hover:text-ink motion-reduce:transition-none dark:text-accent">
          {label}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-[translate] duration-300 group-hover:translate-x-0.5 motion-reduce:translate-none motion-reduce:transition-none"
          />
        </span>
      </span>
    </a>
  );
};

export default LinkCard;
