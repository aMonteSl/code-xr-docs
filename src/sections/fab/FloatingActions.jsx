import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Globe, GraduationCap, X } from 'lucide-react';
import CodeXrLogo from '@/components/ui/CodeXrLogo';
import GithubIcon from '@/components/ui/GithubIcon';
import { fab } from '@/content/fabContent';
import { site } from '@/content/siteContent';

const SHOW_AFTER_PX = 120;

const ACTION_ICONS = {
  external: ExternalLink,
  github: GithubIcon,
  globe: Globe,
  lesson: GraduationCap,
};

// Every action used to be outbound, so target/rel were hardcoded on all of
// them. The tutorial is on this site, and opening an internal page in a new tab
// strands the reader with two copies of it. Derived from the href rather than
// from a flag in fabContent: the URL already knows, and a flag could disagree
// with it.
const isExternal = (href) => /^https?:/.test(href);

// Floating quick actions, bottom-left like the previous site's FAB: the logo
// button appears once the page scrolls and expands upward into three labeled
// actions. Restyled for the steel language — accent fill, neutral shadow, and
// no red close state (out of palette).
//
// Unlike the legacy version, the root stays MOUNTED when hidden and toggles
// opacity/translate classes — legacy returned null early, which made its exit
// transition unreachable and popped instead of sliding.
const FloatingActions = () => {
  // Guarded for the prerender pass, like the navbar's scroll state: this
  // initializer also runs under renderToString, where `window` is undefined.
  // Hidden is the correct prerendered state anyway — the button only exists
  // once the page has scrolled.
  const [isVisible, setIsVisible] = useState(
    () => typeof window !== 'undefined' && window.scrollY > SHOW_AFTER_PX
  );
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > SHOW_AFTER_PX;
      setIsVisible(shouldShow);

      if (!shouldShow) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Escape and click-outside close, listening only while open.
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isOpen]);

  return (
    // hidden sm:flex — no FAB below 640. On a 320px phone the 56px disc plus
    // insets covers x∈[16,72] of a 272px content box, permanently over the
    // carousels' left arrow, QuickStart's Previous and the first gallery
    // filter chips; all four of its actions also live in the hero, About,
    // Tutorial and the footer. Moving it right instead would just trade that
    // set of collisions for its mirror (carousel right arrows, QuickStart's
    // Next, VideoEmbed's corner badges — and SectionBridge's ms-auto escape
    // assumes the FAB is on the LEFT).
    <div
      ref={rootRef}
      className={`fixed bottom-6 left-6 z-40 hidden flex-col items-start gap-2 transition-[opacity,transform] duration-300 motion-reduce:transition-none sm:flex ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div
        className={`flex flex-col items-start gap-2 ${isOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={isOpen ? undefined : 'true'}
      >
        {fab.actions.map((action, index) => {
          const Icon = ACTION_ICONS[action.icon];
          const href = site.links[action.linkKey];
          const external = isExternal(href);

          return (
            <a
              key={action.id}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              tabIndex={isOpen ? undefined : -1}
              onClick={() => setIsOpen(false)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border border-edge bg-surface-raised px-4 text-sm font-medium text-ink shadow-card transition-[opacity,transform,border-color] duration-300 hover:border-accent/40 motion-reduce:transition-none ${
                isOpen ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
              // Stagger from the bottom up, so the expansion reads as growing
              // out of the button.
              style={{ transitionDelay: isOpen ? `${(fab.actions.length - 1 - index) * 60}ms` : '0ms' }}
            >
              <Icon aria-hidden="true" className="size-4 text-accent" />
              {action.label}
            </a>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? fab.close : fab.open}
        className="flex size-14 items-center justify-center rounded-full bg-accent text-on-accent shadow-card transition-[background-color] duration-300 hover:bg-accent-strong motion-reduce:transition-none"
      >
        {isOpen ? (
          <X aria-hidden="true" className="size-6" />
        ) : (
          <CodeXrLogo className="size-7" />
        )}
      </button>
    </div>
  );
};

export default FloatingActions;
