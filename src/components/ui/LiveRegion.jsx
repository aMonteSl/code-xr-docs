// Dumb component: the site's only screen-reader announcer. It renders no box
// and, on its own, makes no sound — it is a paragraph that is ALWAYS in the
// DOM and whose text the sections swap when something the visitor asked for
// has changed the page under them.
//
// Why the markup is exactly this and nothing more:
//
//   - role="status" and NOT role="status" + aria-live="polite". The role
//     already implies aria-live="polite" AND aria-atomic="true", so the pair
//     tells an assistive technology nothing it does not infer, while stacking
//     an explicit live declaration on a role that carries one is the
//     combination reported to announce TWICE on some screen-reader/browser
//     pairs. One statement of politeness, made once.
//   - atomic, which comes free with the role, is doing real work: without it a
//     reader announces only the fragment that differs from the previous text,
//     so "Step 2 of 4: Analyse a file." comes out as a couple of stray words
//     when the reader steps between two similar sentences.
//   - polite, never assertive. Assertive cuts into whatever sentence the
//     reader is in the middle of, and nothing on this site earns that: a
//     screenshot changing because you pressed an arrow can wait for a gap.
//   - sr-only is position:absolute, so this generates no box and is not even a
//     flex item where it lands. That is load bearing rather than incidental:
//     ImageCarousel's caption row and Lightbox's footer hold their heights on
//     purpose (a caption that grew measured 0.116 of layout shift), and an
//     announcer that pushed either would trade one accessibility problem for
//     another. sr-only clips, it does not display:none — a hidden region is
//     not in the accessibility tree and never speaks.
//
// A live region has to already exist in the DOM before its text changes, or
// the change is not observed and nothing is spoken. So this element renders
// unconditionally and only its text varies: callers pass '' rather than
// unmounting it, and '' is what it holds at page load.
//
// THE RULE THIS EXISTS TO PROTECT, and it is not enforceable from in here:
// only a change the visitor ASKED for may reach `message`. The About deck
// rotates every six seconds across ~40 slides, and the install walkthrough
// advances on a clock; wiring either ticker to an announcer would interrupt a
// screen-reader user every few seconds for as long as the tab stays open.
// Callers keep to the rule by SNAPSHOTTING the message inside the event
// handler instead of deriving it from the index during render. See
// AboutCarousel for the pattern, and QuickStart for the other half of it —
// a ticker that moves the index must WIPE the snapshot, or the next manual
// move writes an identical string, mutates nothing, and is silent.
const LiveRegion = ({ message = '' }) => {
  return (
    <p role="status" className="sr-only">
      {message}
    </p>
  );
};

export default LiveRegion;
