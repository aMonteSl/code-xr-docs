import { ArrowUpRight } from 'lucide-react';
import { getTechnologyAsset } from '@/lib/assets';

// The stack, as a list of links rather than the previous site's gradient glass
// cards. Logos are our own files in public/assets/technologies — nothing is
// fetched from a third party to render this.
const TechStrip = ({ title, items, linkHint }) => {
  return (
    <div className="mt-12 sm:mt-16">
      <h3 className="text-lg font-bold tracking-tight text-ink">{title}</h3>

      <div className="stagger-cards mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.name}. ${linkHint}`}
            // The lift is the site's one signal for "this whole card
            // navigates" — same string a linked StatCard carries. These nine
            // are card-shaped external links with a corner arrow, the same
            // role, so they get it too. translate, not transform, in the
            // transition list; and motion-safe on the hover rather than a
            // reset after it — see SectionLink for both notes.
            className="group flex items-center gap-3 rounded-card border border-edge bg-surface-raised p-3 shadow-card transition-[border-color,translate] duration-300 hover:border-accent/40 motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <img
              src={getTechnologyAsset(item.logo)}
              alt=""
              width="32"
              height="32"
              loading="lazy"
              decoding="async"
              className="size-8 shrink-0 object-contain"
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                {item.name}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-3.5 text-ink-muted transition-[color,translate] duration-300 group-hover:text-accent motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5 motion-reduce:transition-none"
                />
              </span>
              <span className="mt-0.5 block text-xs text-pretty text-ink-muted">
                {item.description}
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default TechStrip;
