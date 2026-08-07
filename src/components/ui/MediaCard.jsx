import Picture from '@/components/ui/Picture';

// Dumb component: one screenshot tile. The frame opens whatever the parent
// wires to `onOpen` (a lightbox, in both current callers), the title sits under
// it. No state, no hooks, no copy — every string arrives as a prop.
//
// Was `sections/gallery/GalleryCard`. It never had any gallery in it: it is
// used by the gallery grid and by the analysis detail pages, so it lives here.
//
// The frame deliberately repeats VideoEmbed's own chrome (aspect-video,
// rounded-card, border-edge, surface-sunken, shadow-card) rather than wrapping
// it in an outer card. Two reasons: image and video tiles then line up row by
// row, and nesting VideoEmbed inside another bordered box would draw a double
// frame — its classes are hardcoded and cannot be reliably overridden from
// outside, since Tailwind conflicts resolve by CSS source order, not by the
// order of the class attribute.
//
// object-contain, never object-cover, and a fixed aspect-video frame: these
// screenshots run from 0.49 to 2.64 in aspect ratio. Cropping them to 16:9
// would cut the UI text that is the whole point of the shot, and letting each
// tile take its own height would break every row's alignment.
//
// NO hover lift, deliberately: the lift is the site's one signal for "this
// surface navigates somewhere else" (LinkCard, SectionLink, TechStrip, a
// linked StatCard). This opens a lightbox in place — "look closer", not "go
// elsewhere" — so its feedback is the border + title colour alone. Do not
// "unify" it.
const MediaCard = ({ title, image, alt, badge, label, sizes, onOpen }) => {
  return (
    <button type="button" onClick={onOpen} aria-label={`${label}: ${title}`} className="group flex flex-col text-left">
      <span className="relative block aspect-video w-full overflow-hidden rounded-card border border-edge bg-surface-sunken shadow-card transition-[border-color] duration-300 group-hover:border-accent/40 motion-reduce:transition-none">
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

      <span className="mt-2 flex w-full items-start gap-2">
        <span className="min-w-0 flex-1 text-sm font-semibold text-pretty text-ink transition-[color] duration-300 group-hover:text-accent-strong motion-reduce:transition-none dark:group-hover:text-accent">
          {title}
        </span>
        {badge ? (
          <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
            {badge}
          </span>
        ) : null}
      </span>
    </button>
  );
};

export default MediaCard;
