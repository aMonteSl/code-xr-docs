import { MessageSquarePlus, Star } from 'lucide-react';
import Button from '@/components/ui/Button';
import GithubIcon from '@/components/ui/GithubIcon';
import { feedback } from '@/content/feedbackContent';
import { site } from '@/content/siteContent';

// Icons stay in the section: the content module is plain data and never imports
// a component — the same split Features and InstallMethods document.
// MessageSquarePlus for the review and the GitHub mark for the star, so the
// star GLYPH is spent once, on the panel's own disc, and never competes with
// the word "Star" in the second button.
const ICONS = {
  review: MessageSquarePlus,
  github: GithubIcon,
};

// The page's closing ask, lodged at the end of the Author section rather than
// opening a twelfth band of its own. Three reasons, in order of how load-bearing
// they are:
//
//   - The navbar cannot take a twelfth entry. Its eleven labels were measured
//     against 1280 and the gap between them TIGHTENED to buy back 40px (read
//     the comments in Navbar). A band with no nav entry is legal — the hero is
//     one — but at the BOTTOM of the page it also leaves useActiveSection's
//     scrolled-to-bottom branch highlighting "Author" for the whole of it.
//   - App.jsx's order comment records that section order was fought over on the
//     grounds of how many screens a reader crosses. Another full band costs
//     about two more screens for what is one click; appended here it costs a
//     fraction of one and reaches the same readers.
//   - It is more honest in the author's voice than in the product's. It follows
//     a portrait, a bio and the words "Final Degree Project", so by the time the
//     ask lands the reader knows who is asking and why a single review is worth
//     anything to him. The same paragraph under its own eyebrow between Research
//     and the footer reads like a conversion band.
//
// It keeps its own id anyway, so `/#feedback` is a linkable target for a release
// note. That id is NOT in nav.sections and must not be.
//
// KNOWN LIMIT: Author is mounted by app/App.jsx and by nothing else, so this ask
// is on the home only — /tutorial/ and the four /analysis/ pages share the
// footer and nothing else. Putting it on the tutorial means moving this file out
// of sections/author/, since one section should not import another's private
// subcomponent. Deliberately not done here.
//
// Entirely stateless: no hooks, no window, nothing for the prerender pass to
// trip over and nothing for the compiler-backed react-hooks rule to reject.
const FeedbackAsk = () => {
  return (
    <div
      id="feedback"
      // mt-8 and a capped, centred box: the same shape and the same separation
      // Academic's closing note takes under its full-width card grid. The
      // highlights above run the whole 1344px content box, and a 1300px line of
      // body copy is not a readable measure. mt-8 rather than the grid's own
      // mt-6 because this is a different KIND of block and should read as one.
      //
      // p-6 FLAT, no sm:p-8 — this is load-bearing, not a style preference. The
      // @lg query below measures this element's CONTENT box, so padding that
      // grows at 640 would take 32px out of the queried size at exactly the
      // width where the viewport crosses sm, and the panel could snap back to
      // its stacked layout for one pixel band. Constant padding makes the
      // threshold monotonic in viewport width.
      className="@container mx-auto mt-8 max-w-3xl rounded-card border border-edge bg-surface-raised p-6 shadow-card"
    >
      {/* ONE breakpoint for the whole panel, and a container query rather than
          a viewport one: what decides whether the icon can sit beside the text,
          and the two buttons beside each other, is THIS PANEL's width. Splitting
          it — @md for the layout, sm for the buttons, as a first draft did —
          opens a ~96px band where the text is a left-aligned justified column
          with full-width stacked buttons under it.

          @lg is 32rem of content box, reached at a ~608px viewport. There the
          text column is 512 − 44 (disc) − 24 (gap) = 444px and the two buttons
          measure ~384px including their gap: 60px of slack, and flex-wrap means
          the worst case is a second row, never a page that scrolls sideways. */}
      <div className="flex flex-col items-center gap-5 text-center @lg:flex-row @lg:items-start @lg:gap-6 @lg:text-left">
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-edge bg-surface text-accent"
        >
          <Star className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* h3, and deliberately a step smaller than the author's name above
              it: this CLOSES the section, it does not open a new one. */}
          <h3 className="text-xl font-bold tracking-tight text-balance text-ink sm:text-2xl">
            {feedback.heading}
          </h3>

          {/* Justified only from @lg, where the column is 444px. Justifying a
              200px column at 14px is how you get rivers. */}
          <p className="mt-3 text-sm text-pretty text-ink-muted hyphens-auto @lg:text-justify sm:text-base">
            {feedback.body}
          </p>

          {/* Full-width stacked below @lg, side by side above it — the same
              breakpoint as the row itself, so the two never disagree. No
              whitespace-nowrap on Button, on purpose: at 320 the content box is
              224px and the longer label measures ~185px, so the failure mode is
              a second line inside a growing min-h-11 chip, never overflow. */}
          <div className="mt-6 flex flex-col items-stretch gap-3 @lg:flex-row @lg:flex-wrap">
            {feedback.actions.map((action) => {
              const Icon = ICONS[action.icon];

              return (
                <Button
                  key={action.id}
                  href={site.links[action.linkKey]}
                  variant={action.primary ? 'primary' : 'secondary'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                  {action.label}
                </Button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-pretty text-ink-muted">{feedback.note}</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackAsk;
