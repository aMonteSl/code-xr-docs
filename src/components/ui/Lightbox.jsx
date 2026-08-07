import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Picture from '@/components/ui/Picture';

// Dumb, controlled lightbox on the native <dialog>. showModal() gives focus
// trapping and Escape handling for free; the `cancel` event routes Escape to
// the parent's onClose so the open state never desyncs. The sync effect only
// makes imperative ref calls — no setState in an effect, nothing for the
// compiler rule to flag.
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
        // route it through onClose instead.
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // The dialog element itself is only hit when clicking the backdrop —
        // clicks on the content land on the inner elements.
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={(event) => {
        // Only when the caller actually gave us a list to step through.
        if (event.key === 'ArrowLeft' && onPrev) {
          event.preventDefault();
          onPrev();
        } else if (event.key === 'ArrowRight' && onNext) {
          event.preventDefault();
          onNext();
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
            </div>

            <div className="flex shrink-0 items-center gap-1 self-end sm:self-auto">
              {onPrev ? (
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label={labels.previous}
                  className={NAV_BUTTON}
                >
                  <ChevronLeft aria-hidden="true" className="size-5" />
                </button>
              ) : null}
              {onNext ? (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label={labels.next}
                  className={NAV_BUTTON}
                >
                  <ChevronRight aria-hidden="true" className="size-5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
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
