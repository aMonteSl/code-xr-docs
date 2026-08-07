import { ArrowUpRight } from 'lucide-react';

// Dumb component: one fact in a card — a metric, a version, a recognition.
// With `href` it renders as a link with the same chrome, plus a small corner
// arrow so the card visibly reads as clickable; without it, a plain div.
//
// The surface is translucent so the hero render reads faintly through the
// strip instead of being masked by six opaque blocks. Contrast turns out not
// to constrain the alpha here: sampling the real composited backdrop (the
// gradient plus the hero photo at 14%/12%, grain excluded — it is a ~3% noise
// layer) the worst of the six cards holds 5.85:1 in light and 6.30:1 in dark
// at /65, and even /35 stays near 5.5:1, because the card colour and what is
// behind it are close in luminance. So /65 is an aesthetic choice with a wide
// margin over the 4.5:1 the 11-12px label and detail lines need — but it is a
// measured one; re-measure rather than assume if the backdrop ever changes.
// Hover feedback belongs to the LINK branch alone. Six of these sit in one row
// in the hero and only two carry an href; lifting and lighting the other four
// had four inert <div>s promising a click they cannot take. The absence of a
// response on those IS the correct signal — they get no substitute treatment.
//
// Explicit transition list: Tailwind's bare `transition` includes
// outline-color, which would make the focus ring of the linked card fade in
// from the text color instead of appearing instantly.
const INTERACTIVE =
  'transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-accent/40 motion-reduce:transform-none motion-reduce:transition-none';

const StatCard = ({ icon: Icon, value, label, detail, isLoading = false, href, className = '', ...rest }) => {
  const Tag = href ? 'a' : 'div';

  return (
    <Tag
      href={href}
      className={`group relative rounded-card border border-edge bg-surface-raised/65 p-4 text-center shadow-card backdrop-blur-sm ${href ? INTERACTIVE : ''} ${className}`}
      {...rest}
    >
      {href ? (
        // The "this is clickable" cue. Decorative (the aria-label carries the
        // semantics), so ink-faint is fine here.
        <ArrowUpRight
          aria-hidden="true"
          className="absolute top-2.5 right-2.5 size-3.5 text-ink-faint transition-[color] duration-300 group-hover:text-accent motion-reduce:transition-none"
        />
      ) : null}

      {Icon ? <Icon aria-hidden="true" className="mx-auto size-5 text-accent" /> : null}

      {isLoading ? (
        // Sized to exactly the height the value will occupy, so the card does
        // not resize when the data lands.
        <span
          aria-hidden="true"
          className="mx-auto mt-2 block h-8 w-20 animate-pulse rounded-md bg-surface-sunken motion-reduce:animate-none sm:h-9"
        />
      ) : (
        // tabular-nums stops the digits jittering while the count animates.
        <p className="mt-2 text-2xl font-bold tabular-nums text-ink sm:text-3xl">{value}</p>
      )}

      {/* 11px below sm: in the 2-up mobile grid the content box is ~96px and
          the single word DISTINGUISHED measures 97.8px at 12px + tracking.
          break-words is the belt: a longer future label wraps ugly but
          contained, instead of overflowing the card — the one hard rule. */}
      <p className="mt-1 text-[11px] font-semibold tracking-wide break-words text-accent-strong uppercase sm:text-xs dark:text-accent">
        {label}
      </p>

      {detail ? <p className="mt-1 text-xs text-pretty text-ink-muted">{detail}</p> : null}
    </Tag>
  );
};

export default StatCard;
