import SectionLink from '@/components/ui/SectionLink';

// Dumb component: the closing hand-off at the end of a section — one sentence
// plus one in-page link to somewhere else on the page. All copy arrives as
// props; this holds no strings and no state.
//
// Only the LINK is interactive, not the sentence. Wrapping the whole sentence
// would give a two-line underlined block with a vague hit area, and would
// fill a screen reader's link list with prose instead of an instruction.
//
// The link is a SectionLink chip, not underlined text: these hand-offs are the
// main way readers jump between distant sections, and at 14px underline they
// went unseen. items-center, not items-baseline — a 44px chip next to a
// text-sm sentence has no shared baseline worth aligning to.
//
// `ms-auto` is load-bearing, not cosmetic. FloatingActions is fixed at
// bottom-4 left-4 (a 56px circle, sm:bottom-6 left-6) from 120px of scroll
// onward, so anything in the left ~80px of a section's LAST row slides under it
// on the way past — and the one element you would want to tap is the worst
// thing to hide. Left-aligned sits dead centre of that column; centred clips it
// by 6px at 320; `justify-between` works on one line but sends a lone wrapped
// item to flex-START, i.e. back into the FAB. Pushed to the inline end the link
// clears it in both states. That holds as long as the label renders under
// ~200px, hence the ≤30-character rule on labels.
//
// No border of its own. The section's `border-t border-edge` already draws the
// boundary 64-96px below; a rule here would put two horizontal lines within
// 30px of each other.
const SectionBridge = ({ text, label, href, className = '' }) => {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${className}`}>
      <p className="text-sm text-pretty text-ink-muted">{text}</p>

      <SectionLink href={href} className="ms-auto">
        {label}
      </SectionLink>
    </div>
  );
};

export default SectionBridge;
