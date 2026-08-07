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

// Where the inline links take over from the menu, per page. Eleven home
// entries need ~820px at gap-x-3 and only clear it from 1280 up, so the home
// collapses at xl; the subpages (5-8 short entries) fit from lg. Keeping the
// bar to one 64px line at every width is what scroll-padding-top (4.5rem),
// useActiveSection's OFFSET and the subpages' pt-16 are calibrated against —
// this map is that guarantee, so a new page picks a threshold its own list
// actually fits in. Full literals per variant: Tailwind only sees classes
// written out in source.
const COLLAPSE = {
  lg: {
    links: 'hidden min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 lg:flex',
    burger: 'lg:hidden',
    panel: 'lg:hidden',
  },
  xl: {
    links: 'hidden min-w-0 flex-wrap items-center justify-end gap-x-3 gap-y-1 xl:flex',
    burger: 'xl:hidden',
    panel: 'xl:hidden',
  },
};

// The active link differentiates by colour and an underline, never by weight:
// re-bolding a link changes its width and shoves the whole row sideways as you
// scroll. Accent-strong in light, accent in dark, per the small-text contrast
// rule. The underline carries the state for anyone who cannot use the colour.
//
// The underline is ALWAYS present and only its colour changes:
// text-decoration-line cannot transition, but text-decoration-color can, and
// it is animatable throughout the site's baseline. Both states carry the same
// decoration-2/offset-8 metrics, so activation changes zero geometry. The
// colour is explicit (decoration-accent-strong), not currentColor:
// transitioning to and from the currentcolor keyword is historically
// inconsistent across engines, and an explicit value also keeps the underline
// accent while the TEXT hovers to ink — the underline is the "you are here"
// marker and should not follow the hover.
const linkClass = (isActive) =>
  `text-sm font-medium underline decoration-2 underline-offset-8 transition-[color,text-decoration-color] duration-300 motion-reduce:transition-none ${
    isActive
      ? 'text-accent-strong decoration-accent-strong hover:text-ink dark:text-accent dark:decoration-accent'
      : 'text-ink-muted decoration-transparent hover:text-ink'
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
// `collapse` picks the breakpoint where the inline links replace the menu —
// see the COLLAPSE map above for why it is per page.
//
// This is the second consumer of useMarketplaceStats; the module-level
// in-flight promise and the sessionStorage cache mean it costs no extra
// network request — the exact case that layer was designed for.
const Navbar = ({
  sections = NO_SECTIONS,
  sectionIds = NO_SECTIONS,
  homeHref = '/',
  collapse = 'lg',
}) => {
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
        {/* min-h rather than a fixed height. The COLLAPSE thresholds are what
            keep this row to one 64px line — the wrap below is only a safety
            net for the ~10px of slack at each threshold (a wider font
            rasterizer could still spill), not an expected state: a two-line
            bar breaks the scroll-padding/OFFSET calibration documented on the
            COLLAPSE map. */}
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

          {/* Inline links only from the page's collapse threshold (see the
              COLLAPSE map): below it the menu takes over — at 768 the bar
              measured exactly full with two entries, and between 1024 and 1279
              the home's eleven don't fit on one line either.

              gap-x-3, not gap-x-4. Measured: with eleven entries the row wants
              860px at 1280 and has 827, so 16px gaps left "Author" alone on a
              second line. Ten gaps at 12px buy back 40px and it fits again —
              that 1280 measurement is exactly why the home collapses at xl.
              Tightening the gap was preferred over shortening a label, because
              every label here is already the shortest honest name for its
              section. If a twelfth is ever added, redo this measurement rather
              than shrinking the number further. */}
          {hasSections ? (
            <div className={COLLAPSE[collapse].links}>
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
                CTA moves into the mobile panel instead of overflowing — except
                on pages with no sections, where there IS no panel (no burger)
                and hiding this would leave the bar with no Install anywhere;
                brand + theme + button measure ~236px of the 272 available at
                320. Visibility goes on a wrapper: Button's base class already
                sets `inline-flex`, and a `hidden` passed through className
                loses to it on stylesheet order rather than class order. */}
            <div className={hasSections ? 'hidden sm:block' : ''}>
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
                className={`flex size-11 items-center justify-center rounded-lg text-ink-muted transition-[background-color,color] duration-300 hover:bg-surface-raised hover:text-ink motion-reduce:transition-none ${COLLAPSE[collapse].burger}`}
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
        // max-h + scroll on this wrapper, not on the nav (the top row and its
        // progress edge must not move) and not on the Container (this div owns
        // the opaque bg-surface, and the scrollport's own background is what
        // paints the full scrollable extent — a child scrolling inside a
        // styled parent would draw links "outside the panel"). The 4rem is the
        // one-line top row COLLAPSE guarantees; svh so mobile browser chrome
        // can't hide the last entries; without this, eleven entries (~640px)
        // put "Author" and Install beyond reach on a 375x667 phone or any
        // phone held landscape — a fixed element does not scroll with the page.
        //
        // starting:opacity-0 — the dialog's @starting-style pattern as a
        // utility: the panel mounts conditionally, and this supplies its
        // "frame before it existed" so it fades in over 200ms. Opacity only
        // (a slide would poke out under the fixed row and demand clipping);
        // the close stays instant on purpose — the same deliberate asymmetry
        // the Lightbox documents. 200ms, not 300: this is an overlay entrance
        // (the dialog's family), not hover feedback, and a menu must not feel
        // like a gate. Engines without @starting-style get today's pop.
        <div
          className={`max-h-[calc(100svh-4rem)] overflow-y-auto overscroll-contain border-t border-edge bg-surface transition-[opacity] duration-200 starting:opacity-0 motion-reduce:transition-none ${COLLAPSE[collapse].panel}`}
        >
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
