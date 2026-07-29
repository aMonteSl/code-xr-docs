import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import CodeXrLogo from '@/components/ui/CodeXrLogo';
import Container from '@/components/ui/Container';
import GithubIcon from '@/components/ui/GithubIcon';
import ThemeToggle from '@/components/ui/ThemeToggle';
// The section list arrives as a prop (it differs per page); the theme, action
// and menu labels are the same chrome everywhere, so they stay imported.
import { nav } from '@/content/navContent';
import { site } from '@/content/siteContent';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useMarketplaceStats } from '@/hooks/useMarketplaceStats';
import { useTheme } from '@/hooks/useTheme';

const SCROLL_THRESHOLD = 8;

// Fallback so the default is a stable reference too: useActiveSection keys its
// effect on this array, and a fresh `[]` every render would re-subscribe every
// render. Callers pass a module-scope array for the same reason.
const NO_SECTIONS = [];

// The active link differentiates by colour and an underline, never by weight:
// re-bolding a link changes its width and shoves the whole row sideways as you
// scroll. Accent-strong in light, accent in dark, per the small-text contrast
// rule. The underline carries the state for anyone who cannot use the colour.
const linkClass = (isActive) =>
  `text-sm font-medium transition-[color] duration-300 motion-reduce:transition-none ${
    isActive
      ? 'text-accent-strong underline decoration-2 underline-offset-8 hover:text-ink dark:text-accent'
      : 'text-ink-muted hover:text-ink'
  }`;

// Fixed top bar: brand + live version on the left, section anchors in the
// middle, GitHub + Install on the right. Transparent over the hero, solid once
// the page scrolls.
//
// `sections` and `homeHref` are props, not imports, because this bar serves two
// kinds of page. The home passes `nav.sections` and `#hero`; an analysis detail
// page passes nothing and gets `/`.
//
// That is not cosmetic. The section links are in-page `#` anchors, which on
// /analysis/<slug>/ would resolve to that URL and jump nowhere — and worse,
// useActiveSection has a bottom-of-page branch (`setActiveId(ids.at(-1))`) that
// on a short subpage is reached immediately, so the bar would permanently
// highlight the LAST home section. With an empty list `[].at(-1) ?? null` is
// null and nothing highlights, which is correct.
//
// This is the second consumer of useMarketplaceStats; the module-level
// in-flight promise and the sessionStorage cache mean it costs no extra
// network request — the exact case that layer was designed for.
const Navbar = ({ sections = NO_SECTIONS, sectionIds = NO_SECTIONS, homeHref = '/' }) => {
  const { stats } = useMarketplaceStats();
  const { theme, toggleTheme } = useTheme();
  const activeSection = useActiveSection(sectionIds);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Guarded for the prerender pass: this initializer runs during
  // renderToString, where `window` does not exist, and an unguarded read is a
  // hard ReferenceError that takes the whole build down. False is also the
  // correct first paint — the bar starts transparent over the hero — and the
  // scroll listener below corrects it immediately on a restored scroll.
  const [isScrolled, setIsScrolled] = useState(
    () => typeof window !== 'undefined' && window.scrollY > SCROLL_THRESHOLD
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > SCROLL_THRESHOLD);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const version = stats?.version ?? site.version;
  const hasSections = sections.length > 0;

  return (
    <nav
      aria-label="Primary"
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300 motion-reduce:transition-none ${
        isScrolled || isMenuOpen
          ? 'border-b border-edge bg-surface/85 backdrop-blur'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      {/* The wrapper exists so the progress bar below anchors to the BOTTOM OF
          THIS ROW. On the nav itself it would ride down to the bottom of the
          open mobile menu, i.e. jump ~200px the moment the menu opens. */}
      <div className="relative">
        {/* min-h rather than a fixed height: with eight sections the link group
            no longer fits on one line at every width, and the bar is allowed to
            grow to hold a second line instead of cramming them into 64px. */}
        <Container className="flex min-h-16 items-center justify-between gap-4 py-2">
          {/* shrink-0 and nowrap: squeezed by the link row, the brand was
              breaking "Code-XR" across two lines. */}
          {/* The mark carries the hover, not the wordmark: at 16px semibold the
              wordmark is small text, and tinting it accent would drag in the
              accent-strong/dark pair for a change nobody asked for. The mark is
              decorative SVG on `fill="currentColor"`, so a colour transition
              animates its fill for free. */}
          <a
            href={homeHref}
            className="group flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap"
          >
            <CodeXrLogo className="size-7 shrink-0 text-ink transition-[color] duration-300 group-hover:text-accent motion-reduce:transition-none" />
            <span className="font-semibold text-ink">{site.name}</span>
            <span className="hidden text-xs text-ink-muted sm:block">{version}</span>
          </a>

          {/* Inline links only from lg: at 768 the bar measured exactly full
              with two entries, so a third overflows — tablet portrait uses the
              menu instead.
              The group wraps and can shrink (min-w-0), so between lg and the
              width where they all fit on one line they lay out on two rows and
              the bar grows with them.

              gap-x-3, not gap-x-4. Measured: with eleven entries the row wants
              860px at 1280 and has 827, so 16px gaps left "Author" alone on a
              second line. Ten gaps at 12px buy back 40px and it fits again.
              Tightening the gap was preferred over shortening a label, because
              every label here is already the shortest honest name for its
              section. If a twelfth is ever added, this is the measurement to
              redo rather than the number to shrink further. */}
          {hasSections ? (
            <div className="hidden min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 lg:flex">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  aria-current={section.id === activeSection ? 'location' : undefined}
                  className={linkClass(section.id === activeSection)}
                >
                  {section.label}
                </a>
              ))}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <ThemeToggle
              theme={theme}
              onToggle={toggleTheme}
              label={theme === 'dark' ? nav.theme.toLight : nav.theme.toDark}
            />

            <a
              href={site.links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nav.actions.githubLabel}
              className="hidden size-11 items-center justify-center rounded-lg text-ink-muted transition-[color,background-color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none sm:flex"
            >
              <GithubIcon aria-hidden="true" className="size-5" />
            </a>

            {/* Below sm the bar only has room for brand + theme + menu, so the
                CTA moves into the mobile panel instead of overflowing.
                Visibility goes on a wrapper: Button's base class already sets
                `inline-flex`, and a `hidden` passed through className loses to
                it on stylesheet order rather than class order. */}
            <div className="hidden sm:block">
              <Button
                href={site.links.marketplace}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm"
              >
                {nav.actions.install}
              </Button>
            </div>

            {hasSections ? (
              <button
                type="button"
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-expanded={isMenuOpen}
                aria-label={isMenuOpen ? nav.menu.close : nav.menu.open}
                // Same treatment as the ThemeToggle and the GitHub link it sits
                // beside — three siblings in one row, one behaviour.
                className="flex size-11 items-center justify-center rounded-lg text-ink-muted transition-[background-color,color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none lg:hidden"
              >
                {isMenuOpen ? (
                  <X aria-hidden="true" className="size-5" />
                ) : (
                  <Menu aria-hidden="true" className="size-5" />
                )}
              </button>
            ) : null}
          </div>
        </Container>

        {/* How far down the document the reader is, as the bar's own bottom
            edge filling left to right. Driven entirely by CSS (see
            .scroll-progress in main.css) — no scroll listener, no state.
            aria-hidden: it duplicates the scrollbar, which assistive tech
            already reports, and it is not a <progress> anyone can act on. */}
        <div
          aria-hidden="true"
          className="scroll-progress pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-accent"
        />
      </div>

      {hasSections && isMenuOpen ? (
        <div className="border-t border-edge bg-surface lg:hidden">
          <Container className="flex flex-col gap-2 py-3">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setIsMenuOpen(false)}
                aria-current={section.id === activeSection ? 'location' : undefined}
                className={`flex min-h-11 items-center ${linkClass(section.id === activeSection)}`}
              >
                {section.label}
              </a>
            ))}

            <div className="grid sm:hidden">
              <Button
                href={site.links.marketplace}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMenuOpen(false)}
                className="py-2 text-sm"
              >
                {nav.actions.install}
              </Button>
            </div>
          </Container>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
