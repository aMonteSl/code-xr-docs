import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import LiveRegion from '@/components/ui/LiveRegion';
import Picture from '@/components/ui/Picture';
import { useHistoryDismiss } from '@/hooks/useHistoryDismiss';

// Dumb, controlled lightbox on the native <dialog>. showModal() gives focus
// trapping and Escape handling for free; the `cancel` event routes Escape to
// the parent's onClose so the open state never desyncs, and useHistoryDismiss
// routes the browser's Back button to the same place — Escape and Back are the
// same gesture on two different devices. The sync effect only makes imperative
// ref calls — no setState in an effect, nothing for the compiler rule to flag.
//
// `onPrev` / `onNext` are optional and additive: pass them to get arrows and
// keyboard stepping through a list, omit them and this is exactly the original
// single-image lightbox.
const NAV_BUTTON =
  'flex size-11 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-[color,background-color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none';

// The panel below is w-[min(96vw,72rem)] with 12-16px of padding, so the image
// never exceeds 1120 CSS px. Declared here rather than passed in because this
// component hardcodes that width itself — the two have to change together.
const SIZES = '(min-width: 1200px) 1120px, 96vw';

const Lightbox = ({ isOpen, src, sources, alt, caption, onClose, labels, onPrev, onNext }) => {
  const dialogRef = useRef(null);
  // The only state this component holds, and it is trivial UI state: has the
  // visitor stepped since this dialog opened. It gates the announcer at the
  // bottom — see the note there.
  const [hasStepped, setHasStepped] = useState(false);

  // EVERY dismissal must come through here, so the next open starts silent
  // again. Nothing else can do the reset: the parents own `isOpen`, and an
  // effect that cleared the flag when it went false would be setState inside an
  // effect body, which the compiler-backed react-hooks rule rejects outright.
  // If a back-button dismissal is ever added, hand IT this function and not the
  // parent's onClose, or Back leaves the flag set and the next open exposes the
  // caption in the live region the moment the dialog appears.
  const close = () => {
    setHasStepped(false);
    onClose();
  };

  // Both arrows and both arrow keys. Taking the parent's callback as an
  // argument keeps this the single place a step is recorded, rather than four
  // handlers each remembering to set the flag.
  const step = (move) => {
    setHasStepped(true);
    move();
  };

  // Back closes the viewer instead of leaving the page. It belongs HERE and not
  // in the six sections that mount a Lightbox: this component already owns the
  // whole dismissal contract — Escape through the cancel event below, the
  // backdrop click, the X — and on a phone Back is that same gesture and the
  // only one there is. Wiring it from the sections would split one contract
  // across two layers, repeat it six times, and force each of them to hand over
  // a differently-shaped "is it open" (openIndex !== null in four, isExpanded in
  // two). It stays inside the dumbness rule: the hook is fed the two props this
  // component already has, adds no prop, fetches nothing and holds no copy — the
  // same category as the showModal()/body-overflow effect below.
  //
  // `close`, NOT the raw onClose: close() is onClose plus the announcer reset,
  // and handing over the parent's callback instead would let a Back dismissal
  // leave hasStepped set, so the next open would expose the caption in the live
  // region the moment the dialog appeared.
  //
  // Nothing is announced for the dismissal itself and nothing should be. Every
  // path ends in the dialog.close() below, and a native <dialog> returns focus
  // to the element that was focused when showModal() ran — the tile or the
  // expand button that opened it. An aria-live region would duplicate that focus
  // move, and on the About carousel, which autoplays, it would land in the
  // middle of unrelated speech.
  useHistoryDismiss(isOpen, close);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return undefined;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        // Keep React the owner of the open state: cancel the native close and
        // route it through close() — which is onClose plus the announcer reset.
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // The dialog element itself is only hit when clicking the backdrop —
        // clicks on the content land on the inner elements.
        if (event.target === event.currentTarget) {
          close();
        }
      }}
      onKeyDown={(event) => {
        // Only when the caller actually gave us a list to step through.
        if (event.key === 'ArrowLeft' && onPrev) {
          event.preventDefault();
          step(onPrev);
        } else if (event.key === 'ArrowRight' && onNext) {
          event.preventDefault();
          step(onNext);
        }
      }}
      // Translucent rather than a solid panel: the blur here is functional
      // (legibility over arbitrary page content), not decoration.
      // cursor-zoom-out on the dialog itself: this element IS the click-to-
      // close hit area (see onClick above), and it answers the cursor-zoom-in
      // that opened it. The panel below resets to auto so the content is not
      // advertised as dismissable.
      className="fixed inset-0 z-[70] m-auto max-h-[92svh] w-[min(96vw,72rem)] cursor-zoom-out rounded-card border border-edge bg-surface/70 p-3 shadow-card backdrop-blur-2xl backdrop:bg-ink/50 backdrop:backdrop-blur-sm sm:p-4"
    >
      {isOpen ? (
        <div className="flex max-h-[calc(92svh-2rem)] cursor-auto flex-col gap-3">
          <Picture
            src={src}
            sources={sources}
            alt={alt}
            sizes={SIZES}
            // No background: the object-contain bands show the translucent
            // panel through instead of a flat grey block.
            className="min-h-0 w-full flex-1 rounded-lg object-contain"
          />
          {/* Caption on its own full-width row below sm: sharing the row with
              up to three size-11 buttons left it ~130px wide, and the long
              `title. alt` captions ran to 8-12 lines — which the flex-1 image
              above then shrank to accommodate. Scroll, not line-clamp: the
              carousel caption's contract (ImageCarousel) is that the full text
              is always available HERE. max-h-20 ≈ 4 lines of text-sm, min-h-10
              keeps the footer steady while stepping; the themed scrollbar
              inherits from :root. */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0 sm:flex-1">
              <p className="max-h-20 min-h-10 overflow-y-auto overscroll-contain text-sm text-pretty text-ink-muted sm:max-h-15">
                {caption}
              </p>

              {/* The arrows swap the picture and this caption while focus stays
                  on the arrow, inside a modal that has blocked the rest of the
                  page — so without this the dialog silently becomes a different
                  dialog. It repeats the caption verbatim rather than inventing a
                  sentence, which is also why none of the six callers needs a new
                  content string, and why the About and What's new captions are
                  announced with their "3 / 40" counter intact: that is the text
                  on screen.
                  Empty until the visitor actually steps. This region mounts
                  with the dialog's content, and a live region exposed with text
                  already in it can be read out on open by some screen readers,
                  on top of the dialog's own announcement — mounting it empty and
                  filling it on a later commit is what makes the change audible
                  at all.
                  Nothing here has a timer, so no autoplay rule applies: the only
                  way `caption` changes is that somebody asked. */}
              <LiveRegion message={hasStepped ? caption : ''} />
            </div>

            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              {onPrev ? (
                <button
                  type="button"
                  onClick={() => step(onPrev)}
                  aria-label={labels.previous}
                  className={NAV_BUTTON}
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
              ) : null}
              {onNext ? (
                <button
                  type="button"
                  onClick={() => step(onNext)}
                  aria-label={labels.next}
                  className={NAV_BUTTON}
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={close}
                aria-label={labels.close}
                className={NAV_BUTTON}
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </dialog>
  );
};

export default Lightbox;
