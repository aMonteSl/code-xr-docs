import { useEffect, useRef } from 'react';

// The browser's Back button dismisses an overlay instead of leaving the page.
//
// On a phone Back IS the dismiss gesture — there is no Escape key and the X can
// be a long reach — so a full-screen overlay that does not touch history is a
// trap: the reader presses Back expecting the screenshot to close and loses the
// whole page instead. Opening pushes one history entry; a popstate pops it and
// closes the overlay through the callback the caller already owns.
//
// The reverse direction is the half that is easy to get wrong. An overlay closed
// from the UI (the X, Escape, a backdrop click) leaves that pushed entry on the
// stack under the SAME url, so unless closing consumes it the reader has to
// press Back twice to leave the page — and the first press looks broken, because
// nothing on screen changes. Closing therefore calls history.back(), which is
// only ever called to undo a step this hook itself took. "Took" means verified,
// not attempted (see the token below); that is what keeps it from ever
// navigating the reader off the site.
//
// No url is invented. pushState with no url argument keeps the current one, so
// the address bar, the canonical link and any open `#section` anchor are
// untouched. Deep-linking one screenshot would be a different change: the lists
// that mount a Lightbox have incompatible index semantics (the About carousel
// reshuffles per visit), so a real deep link would have to key on the
// release-relative file path and every consumer would need a resolver.
//
// StrictMode is on in dev (app/main.jsx) and double-invokes effects on mount.
// That is harmless here only because every consumer mounts its overlay CLOSED,
// so the effect below returns on its first line. An overlay mounted already open
// would push, consume and push again on every dev mount.
const MARKER = 'codexrOverlay';

// Stamped into the pushed entry so the push can be verified. A boolean would not
// do: the previous entry may already carry a marker — a reload with an overlay
// open leaves one behind — and then a DROPPED push would still read back as
// true. Firefox throttles History API calls and silently ignores the overflow,
// so this is the difference between "this one open gets no back-dismissal" and a
// history.back() aimed at a real page entry, i.e. at leaving the site. Module
// scope and monotonic; it is only ever compared with itself.
let nextToken = 0;

// The cleanup calls this rather than reading ownsEntryRef.current itself.
// Deliberate: react-hooks/exhaustive-deps warns on any `.current` read inside an
// effect cleanup — it assumes the ref points at a DOM node that has since
// changed — and `npm run lint` has to end at zero warnings as well as zero
// errors. Reading it late is the whole point here: the flag may have been
// cleared by the popstate handler a moment ago, and that is exactly the case the
// cleanup has to tell apart.
const consumeEntry = (ownsEntryRef, pendingBackRef) => {
  if (!ownsEntryRef.current) {
    // Already consumed by the browser, so this close came FROM a popstate. The
    // branch below would go back a second time, over an entry that is not ours.
    return;
  }

  ownsEntryRef.current = false;
  pendingBackRef.current += 1;
  window.history.back();
};

export const useHistoryDismiss = (isActive, onDismiss) => {
  const dismissRef = useRef(onDismiss);
  // This instance pushed an entry and has not traversed away from it. The only
  // thing that authorises history.back().
  const ownsEntryRef = useRef(false);
  // How many of our own back() calls are still in flight. back() QUEUES a
  // traversal rather than performing one, so the popstate it produces arrives a
  // task later and must not be read as the reader pressing Back. A counter, not
  // a flag: close, reopen, close puts two of them in flight at once.
  const pendingBackRef = useRef(0);

  // Latest-callback ref. Every caller passes an inline arrow
  // (`onClose={() => setOpenIndex(null)}`) and the overlay re-renders on every
  // step through its list, so naming onDismiss as a dependency of the effect
  // below would tear it down and set it up again on each arrow press: a back()
  // and a fresh push per image, i.e. an overlay that dismisses itself.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Subscribed for the whole life of the hook, not just while the overlay is
  // open. The popstate our own back() produces arrives AFTER the cleanup that
  // fired it, so a listener keyed on isActive would already be gone — and
  // pendingBackRef would stay armed and swallow the reader's next real Back.
  // popstate fires on traversals only, so the twelve idle listeners the home
  // ends up with cost nothing.
  useEffect(() => {
    const handlePopState = () => {
      if (pendingBackRef.current > 0) {
        pendingBackRef.current -= 1;
        return;
      }

      // Not our entry: a `#section` anchor being traversed back over, or an
      // orphan marker nobody owns any more. Nothing to undo, so stay out of the
      // way — this is also what makes Forward after a back-dismissal a no-op.
      if (!ownsEntryRef.current) {
        return;
      }

      // Cleared BEFORE the callback, and that ordering is why a loop is
      // impossible rather than merely unlikely: React processes the state update
      // this schedules after the native handler returns, so by the time the
      // cleanup runs it always observes the flag already false and its
      // history.back() branch is unreachable.
      ownsEntryRef.current = false;
      dismissRef.current();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyed on isActive ALONE. Stepping to the next image keeps it true, so this
  // does not re-run and no second entry is pushed: a ten-image walk through the
  // gallery still costs the reader exactly one Back.
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    nextToken += 1;
    const token = nextToken;

    // Spread the existing state so nothing another script put there is dropped.
    window.history.pushState({ ...window.history.state, [MARKER]: token }, '');

    // pushState is synchronous, so history.state already reflects it — unless
    // the engine dropped the call. Claim only what actually landed: a dropped
    // push costs this one open its back-dismissal, claiming it anyway costs the
    // reader the page.
    if (window.history.state?.[MARKER] !== token) {
      return undefined;
    }

    ownsEntryRef.current = true;

    return () => consumeEntry(ownsEntryRef, pendingBackRef);
  }, [isActive]);
};
