# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The official site for **Code-XR**, a VS Code extension that visualizes code metrics in XR. React 19 + Vite 8 + Tailwind 4, plain JS (no TypeScript), deployed to GitHub Pages at `https://code-xr.adrianmonteslinares.com/`. The extension lives in a separate repo (`aMonteSl/CodeXR`); this repo only documents it.

**The site was rebuilt from scratch for the v1.2.0 release. The previous site (`legacy/` + `/old_web/`) is deleted — do not resurrect it; its media survives in the Gallery's archive chip and its walkthrough videos are on YouTube.** One Vite multi-page build:

| Route | Entry | Code | Status |
|---|---|---|---|
| `/` | `index.html` | `src/` | The site. All work happens here. |
| `/analysis/` | `analysis/index.html` (**generated**) | `src/` | Index of the four analyses, each card linking to its detail page. |
| `/analysis/<slug>/` | `analysis/<slug>/index.html` (**generated**) | `src/` | One detail page per analysis: `classic`, `dependency-graph`, `historical-comparison`, `project-evolution`. |
| `/tutorial/` | `tutorial/index.html` (**generated**) | `src/` | The deep walkthrough: the sidebar and the XR room, plus the 12-minute video. |

## Commands

```bash
npm run dev              # Vite dev server on port 5173
npm run build            # prebuild (sync:dashboards) → vite build → postbuild (prerender)
npm run sync:dashboards  # copy dashboard exports into public/ (see below)
npm run optimize:screenshots  # regenerate release screenshot variants (see below)
npm run lint             # eslint . — MUST stay at 0 errors AND 0 warnings
npm run preview          # serve dist/
```

No test framework. ESLint 10 + `eslint-plugin-react-hooks` 7 with the compiler-backed preset (`reactHooks.configs.flat['recommended-latest']` in `eslint.config.js`) — it errors on synchronous `setState` inside effects, so follow the patterns already in the codebase (rAF deferral, observer callbacks, initial state) instead of silencing rules.

`.claude/launch.json` defines the `code-xr-docs` dev-server config (port 5173).

## New site architecture (`src/`) — READ BEFORE ADDING CODE

FSD-lite layered structure. **Import direction is strictly downward**; a layer never imports from a layer above it:

```
src/
  app/            # bootstrap: main.jsx (entry), App.jsx (orders the sections), theme.js
  sections/       # one folder per page section (kebab-case): sections/hero/Hero.jsx
  components/ui/  # DUMB components: stateless, no data fetching, no copy, props only
  content/        # ALL user-facing copy and data as plain JS modules (English)
  hooks/          # reusable hooks (create when first needed)
  lib/            # pure utilities (assets.js; add media.js etc. when needed)
  styles/         # main.css: Tailwind entry + design tokens
```

Rules:

- **Imports** use the `@/` alias (configured in `vite.config.js` + `jsconfig.json`): `import Button from '@/components/ui/Button'`. No relative `../../` climbing, no barrel `index.js` files — import the file directly.
- **Sections** compose the page: they may import from `components/ui`, `content`, `hooks`, `lib`. One folder per section; section-private subcomponents live inside that folder.
- **`components/ui` stays dumb**: no state beyond trivial UI state, no context, no content imports, no copy strings. If a component needs data, the section passes it via props. See `Button.jsx` (variants map) and `Container.jsx` as the pattern.
- **Copy lives in `content/`**, never inline in JSX. `content/siteContent.js` holds site-wide copy/links; add per-section modules (e.g. `content/releaseContent.js`) as sections grow. Components receive content via imports in the *section* layer or props.
- `public/` files are referenced through `getAssetPath()` / helpers in `src/lib/assets.js`, never bare string paths. Demo videos are on YouTube — never commit `.mp4` files.
- **Release screenshot masters live in `assets-src/releases/`, OUTSIDE `public/`** (v1.2.0 mirrors `CodeXR/media/v1.2.0`). They are build inputs, not deployed files: nothing on the site fetches them, so publishing them only inflated the deploy by 57 MB. Add new release media there, then run `npm run optimize:screenshots`.
- **Never render a master directly.** They are 2x captures up to 2.9 MB and are not served at all. Resolve them with `getReleaseImageSources(release, file)` and spread the result onto `components/ui/Picture`, a drop-in `<img>` replacement (`display: contents`, so it changes no layout). See the screenshot pipeline below.
- `public/assets/releases/` holds exactly **one file**: `v1-1-0/performance-v1.1.0.gif`. It is the only release asset served as a master, because sharp collapses animated GIFs to their first frame so it cannot go through the thumbs pipeline. Every other master — v1-2-0 *and* v1-1-0 — lives in `assets-src/releases/`. Do not add masters back under `public/`.
- Components: PascalCase file named after its default export, one component per file. Modules in `content`/`lib`/`hooks`: camelCase.
- The navbar highlights the section you are in via `hooks/useActiveSection.js`. It reads scroll position rather than using an IntersectionObserver — with sections this tall, "which one is under the navbar" is the actual question, and an observer answers "which are visible", often three at once with no tie-break. Its `ids` argument **must be a stable reference** (module scope, see `SECTION_IDS` in `Navbar.jsx`), or the effect re-subscribes on every render. `OFFSET` there tracks `scroll-padding-top` in `main.css`; change them together.
- **The browser Back button dismisses the image viewer**, via `hooks/useHistoryDismiss.js`, called *inside* `components/ui/Lightbox` — so all six consumers (Gallery, MediaGroup, TutorialPart, Collaboration, AboutCarousel, SectionCarousel) get it without a line of change. It lives in Lightbox because Lightbox already owns every other dismissal path (Escape via the dialog's `cancel`, the backdrop click, the X) and Back is that same gesture on a phone; it stays inside the dumb-component rule because it adds no prop, no data and no copy. It is handed `close`, not the raw `onClose`, because `close` also resets the caption announcer. Opening pushes one history entry and **changes no URL**; closing from the UI consumes it with `history.back()`, or the reader has to press Back twice to leave the page and the first press looks broken. Four things there are load-bearing. The pushed entry carries a **unique token**, and the entry is only claimed once `history.state` is read back and confirms it — Firefox silently drops throttled `pushState` calls, and claiming a push that never landed points `history.back()` at a real page entry, i.e. at leaving the site. The popstate handler clears the ownership flag *before* calling the dismiss callback, which is what makes a popstate-driven close unable to call `back()` again (the branch is unreachable, not just unlikely). The popstate listener is mounted for the hook's whole life, because our own `back()` lands a task after the cleanup that fired it and a listener keyed on `isOpen` would miss it and leave the swallow counter armed. And the effect is keyed on `isOpen` alone, so `onPrev`/`onNext` push nothing — a ten-image walk still costs one Back. The cleanup delegates its ownership check to a module-scope `consumeEntry`: `react-hooks/exhaustive-deps` warns on any `.current` read inside an effect cleanup, and lint has to end at zero warnings too. **Deep links per screenshot are deliberately NOT part of this** — the six lists have incompatible index semantics and the About carousel reshuffles per visit, so an index means nothing there; a URL would have to key on the `file` path and is a separate change. Dismissal is announced by the native focus return, never by a live region.
- **Screen-reader announcements go through `components/ui/LiveRegion`** (`role="status"` alone — the role already implies polite + atomic, and stacking `aria-live` on it double-announces on some pairings). The rule it exists to protect: **only a change the visitor asked for may reach it.** The About deck rotates every 6s across ~40 slides and the install walkthrough advances on a clock, so the message is always SNAPSHOTTED inside the event handler, never derived from the index during render — a derived string would fire on every tick. QuickStart's ticker must also **wipe** the snapshot when it auto-advances, or returning to a previously announced step writes an identical string, mutates no DOM, and is silent. Regions render unconditionally with `''` (a region inserted at the same moment as its text does not announce). The hero stat strip deliberately has none: nobody asked for those six numbers, so the skeleton carries an `sr-only` "Loading" instead.

## Design tokens and theming

Everything lives in `src/styles/main.css`. **Two token layers — components only ever use the semantic one:**

1. **Brand scale** `--color-brand-50…950` (utilities `bg-brand-500`, etc.): the blue ramp around the Code-XR *extension* identity color `#00aaff`. Same in both themes. Currently dormant — no component uses it; it documents the product identity, not the site look.
2. **Semantic tokens** via `@theme inline` → CSS variables that flip with the theme: `surface`, `surface-raised`, `surface-sunken` (backgrounds), `ink`, `ink-muted`, `ink-faint` (text), `edge` (borders), `accent`, `accent-strong`, `on-accent`. Use `bg-surface`, `text-ink-muted`, `border-edge`, `bg-accent`… **Never hardcode hex colors in components.**

**The site's visual language is steel-slate: grayed blues, sober, elegant, and strictly glow-free.** The user chose this direction explicitly after rejecting a neon-cyan accent, a gold award ramp, and glow shadows. Rules that follow from it: no colored shadows (only the neutral `shadow-card`), no `scale` hover effects on buttons, no pulsing dots or sheen sweeps. Differentiate emphasis by weight (border strength, iconography, typography), never by introducing a hue or a glow.

**Background**: the sanctioned hero backdrop is three layers — a subtle vertical gradient (`hero-gradient`), the release render at low opacity, and a fine monochrome grain (`hero-grain`) on top; the two utilities live in `main.css`. The gradient and grain are static; the photo carries **one sanctioned motion** (user-approved 2026-08-07): a scroll-linked 24px downward drift (`.hero-drift` in `main.css`, compositor-only transform, double-gated on reduced-motion + `@supports`), clipped by the backdrop's own `aria-hidden` wrapper so the section still needs no `overflow-hidden`. The photo is **exclusive to the hero** and is served from `public/assets/hero/` (AVIF + WebP at 640/1024/1672, generated by `npm run optimize:hero` from the 1.53 MB source PNG and committed — the script is deliberately outside `prebuild`). Its opacity is lower in dark than in light because the render is a mostly light-grey room. Glows, halos, and geometric patterns (a grid + blue glow backdrop was built and rejected, twice) stay out; don't add new background treatments without asking.

**Contrast is a hard requirement, not a preference.** Small text (≤14px) must clear 4.5:1 against its *composited* background — alpha utilities like `bg-accent/10` must be composited against `--surface` before measuring, not read as declared. `text-ink-faint` is for large/decorative text only; small body copy uses `text-ink-muted`, small accent text uses `text-accent-strong dark:text-accent`.

**Scroll feedback** is two things, both in `main.css` and both free of JS. The **scrollbar** is themed on `:root` with the standard `scrollbar-width`/`scrollbar-color` so it *inherits* into every overflow container on the site; the `::-webkit-scrollbar` block is the fallback for engines without those properties and is gated behind `@supports not`, because Chromium ignores the pseudo-elements entirely on any element that sets the standard ones. The **progress bar** is the navbar's bottom edge, driven by `animation-timeline: scroll(root block)` and `scaleX` (a width animation would relayout the fixed bar every frame). It is deliberately **not** gated on `prefers-reduced-motion`, unlike every other animation here: it is a position indicator locked to the scrollbar, not motion played at the reader. Base state is `scaleX(0)`, so an unsupported browser or a page too short to scroll simply never draws it.

**Focus rings**: defined once globally as `:focus-visible { outline: 2px solid var(--accent) }` in the base layer of `main.css` — do not add `focus-visible:*` utilities per component. Use `outline`, never `ring-*`: `ring-*` writes to `box-shadow` and is silently defeated by any `shadow-*` utility on the same element. Also keep `outline-color` out of `transition-*` property lists (Tailwind's `transition-all`/`transition-colors` include it), or the ring fades in from the element's own text color and is briefly invisible.

**Theming**: light and dark are both first-class. A manual choice is persisted in `localStorage` under `codexr:theme` and wins; with none stored the site follows `prefers-color-scheme` and keeps following it live. The store is `src/lib/theme.js`; an inline script in `index.html` applies the resolved theme to `<html>` before first paint (no FOUC) by reading **the same key with the same precedence** — change the two together. Dark mode is class-based (`@custom-variant dark`).

**Switching themes** runs through the View Transitions API (`hooks/useTheme.js` + the `theme-reveal` keyframes in `main.css`): the incoming theme is revealed by a circle growing from the toggle button, 500ms, while the outgoing page waits underneath. Three things there are load-bearing. The store call is wrapped in `flushSync`, because a re-render scheduled from inside a click handler would not commit until after the "new" snapshot was taken and the sun/moon icon would be captured in its old state and pop at the end. There is deliberately **no cross-fade** between the two snapshots — overlapping a light and a dark copy of the page washes through a grey midpoint belonging to neither theme. And the reveal radius is measured to the farthest viewport corner, or the circle stops short and leaves a wedge of the old theme behind. Reduced motion and browsers without the API fall back to the plain instant switch. Do **not** replace this with a colour transition on every element: it repaints the whole document for the duration and still misses anything carrying its own `transition-*`.

**Tailwind scoping**: `src/styles/main.css` restricts scanning with `source('../')` to the `src/` tree. Keep it that way — scanning wider picks up classes from scripts and public assets that are not components.

## Responsive design — NON-NEGOTIABLE

**Every section must look good on every screen size and resolution, from a 320px phone to an ultrawide desktop.** A section is not done until it has been checked across that range. This is a hard acceptance criterion, not a polish step.

No extra dependency is needed or wanted: Tailwind 4 covers all of it in core (breakpoints, `@container` container queries, `text-balance`/`text-pretty`, arbitrary `clamp()` values, `svh`/`dvh` units). Verified working in this project.

Rules:

- **Mobile-first.** Write the base classes for the smallest screen, then layer `sm: md: lg: xl: 2xl:`. Never write desktop styles and patch mobile with overrides.
- **No horizontal overflow, ever.** The page body must never scroll sideways. Wide content (tables, code blocks, diagrams, dashboard embeds) scrolls inside its own `overflow-x-auto` container. Check with `document.documentElement.scrollWidth > clientWidth`.
- **Fluid typography for display text.** Headlines use `text-[clamp(min,vw,max)]` (see `sections/hero/Hero.jsx`) instead of jumping between fixed sizes at breakpoints. Body copy may use plain `text-base sm:text-lg` steps. Pair with `text-balance` on headings and `text-pretty` on paragraphs.
- **Touch targets ≥ 44px** on interactive elements. On narrow screens stack buttons full-width (`flex-col items-stretch sm:flex-row`) rather than shrinking them.
- **Container queries over media queries for reusable components.** A card that must adapt to *its own* width belongs in `@container` + `@sm:`/`@md:` variants, so it works in any slot. Viewport breakpoints are for page-level layout.
- **Viewport height**: use `min-h-svh`/`dvh`, not `min-h-screen`, so mobile browser chrome doesn't cut content off.
- **Images and media**: always constrained (`max-w-full h-auto`), with explicit `width`/`height` or an `aspect-[…]` wrapper to prevent layout shift, and `loading="lazy"` below the fold. Release screenshots go through `Picture` + `getReleaseImageSources` (see below), never the raw master.
- **`sizes` is derived, not guessed.** A wrong `sizes` is invisible in review and costs either bandwidth (overshoot) or sharpness (undershoot). Compute it from the real grid: container width, gaps, column fractions, card padding. Measure the result — `img.getBoundingClientRect().width` against the width in `currentSrc` — and fix any image served below its rendered box. Reload between viewport changes when checking: the browser reuses a cached larger variant rather than re-fetching, which silently fakes a pass.
- **Respect `prefers-reduced-motion`**: any non-trivial animation needs a reduced-motion fallback.
- **Both themes at every size.** Responsive checks run in light *and* dark — see the theming section.

**How to verify** (dev server on port 5173, use the browser tools): check at least **320, 375, 768, 1024, 1440** px wide. At each width confirm zero horizontal overflow, no clipped or overlapping text, tap targets big enough, and that images keep their aspect ratio. `resize_window` also takes `colorScheme` to check both themes.

## Screenshot pipeline (`npm run optimize:screenshots`)

The masters are 2x captures — 47.5 MB across 56 files, the six analysis shots alone ~2.9 MB each — rendering into slots that never exceed ~812 CSS px. Nothing on the site loads them.

`scripts/optimize-screenshots.mjs` walks `assets-src/releases/` (v1-2-0 and v1-1-0 alike), derives AVIF + WebP variants into `public/assets/thumbs/<release>/…/<name>-<width>.<ext>`, and writes `src/lib/releaseImageWidths.js`, a generated map of which widths each master actually has. Run by hand and **commit both outputs**, exactly like `optimize:hero`; deliberately outside `prebuild`, because sharp ships native binaries and CI has no reason to build them for assets that change once per release. It wipes its output directory each run, so a renamed master leaves no orphan behind.

Widths come from a `[640, 1280, 1920]` ladder, applied per master: the master's own width is always published (for anything under 1920 it is the sharpest copy that can exist, and the lightbox renders up to 1120 CSS px), and a ladder step is only kept when it is at least 1.25x smaller than the variant above it. **Every master gets at least one variant, however small** — the v1-2-0 masters are not served, so a master missing from the manifest sends `getReleaseImageSources` to a URL that 404s. The manifest exists at all because a fixed ladder would advertise files that were never written, and a 404 inside a `srcset` is a broken image, not a fallback.

Result: 29 MB → 677 KB of images for the same 30 pictures at desktop, 24.6 MB → 542 KB cold-cache at 375px, and 57 MB out of `dist/`.

## Analysis pages — one URL per analysis, plus an index

Four pages under `/analysis/<slug>/`, each covering one analysis with its scene, controller, LivePanel and in-room guide screenshots. `src/content/analysisPagesContent.js` holds **only what the home does not have** — the slug, the SEO strings, and which screenshots go in which group. Title, description, bullets and `videoId` are read from `whatsNew.analyses` on the same `id`, and the alt text is looked up in `galleryContent` by file path, so nothing is restated in two places. A path typo throws at import rather than shipping a blank tile.

**The entry HTML is generated**, by `scripts/build-pages.mjs` in `prebuild` (it writes all six subpage entries, the tutorial included: `path`, `entryScript` and `ldType` are per-page fields), and **committed** — same deal as `src/lib/releaseImageWidths.js`. Committing is what lets `npm run dev` serve them without a build, and what lets `vite.config.js` simply glob `analysis/*/index.html` (it cannot import the content module: it is the file that *defines* the `@/` alias). Written by hand these would be ~600 lines with ~380 byte-identical, including the anti-FOUC theme script — which the generator lifts out of `index.html` at build time rather than copying, so the two cannot drift.

**`/analysis/` is the index of the four**, reached from two places on the home (under the four chips in "What is Code-XR", and from the "One table, four analyses" card). The four direct "Explore …" links stay: those are for reading top to bottom, the index is for choosing. Its copy lives in `analysisPages.index` and a `summary` per page; each card's cover is `page.groups[0].images[0]`, so no new asset had to be picked.

All five share **one** entry module (`src/app/analysisMain.jsx`), which reads the slug from `window.location.pathname`. That is why the build emits one `main.css` and one small `analysisMain` chunk instead of five copies — verified in `dist/assets/`. `/analysis/` yields the slug `analysis`, which the entry branches on **explicitly**: a silent fallback for any unknown slug would hide typos, and `AnalysisPage`'s current `throw` is what makes a mistyped one obvious.

**`analysis/index.html` needs an explicit `vite.config.js` entry** (`analysis_index`). The glob that picks up the detail pages walks `analysis/` filtering `isDirectory()`, so a file sitting next to those directories is skipped silently rather than failing — it would just never be built.

**`Navbar` takes `sections`, `sectionIds` and `homeHref` as props.** The home passes `nav.sections` + `#hero`; each detail page passes **its own** list and gets `homeHref: '/'`; the `/analysis/` index passes nothing. This is not cosmetic: the section links are in-page `#` anchors, so another page's list would point at ids that do not exist, and `useActiveSection` has a bottom-of-page branch (`setActiveId(ids.at(-1))`) that a short subpage reaches immediately — with the home's list it would permanently highlight the *last* home section. An empty list makes `[].at(-1) ?? null` null, which is right for the index.

**Every subpage's section list is built once at module scope** — the loop at the bottom of `analysisPagesContent.js` for the four detail pages, `tutorialSections`/`tutorialSectionIds` for the tutorial — and never in the component. They may **not** be computed in the component: `useActiveSection` keys its effect on the ids array, so a fresh array per render re-subscribes the scroll listener every render — the same trap `SECTION_IDS` avoids on the home. Each page gets `overview`, `specs`, `glossary` and then one entry per media group, whose id is `slugify(label)` (derived, so a renamed group cannot leave a nav link pointing nowhere; the loop throws on a collision). `specs` carries a short `navLabel` beside its heading because the headings run to "Three layouts, and how the edges are drawn".

**Icon semantics, refined**: `ArrowUpRight` means the link leaves the **site**; `ArrowRight` means it stays on it, whether that is an in-page anchor (`Install` → `#features`) or another page of the site (the four "Explore …" links).

**Standalone navigation links are `components/ui/SectionLink`** — a bordered chip (`border-edge` on `bg-surface-raised`, `shadow-card`, `text-base` accent text) carrying the same hover lift as `LinkCard`/`StatCard`, because it makes the same promise: this navigates. It replaced a 14px underline idiom the user reported as invisible. Its `icon` prop (`right`/`up-right`/`left`) enforces the arrow semantics above. Links inside **prose** (the Academic citation) and inside **media UI** ("Watch on YouTube") deliberately keep the small underline style — a chip mid-sentence breaks the text, and inside a card it competes with the card.

## The tutorial (`/tutorial/`)

The written form of the 12-minute video (`dtvFhUQ1uKY`), and **the one page that covers the VS Code sidebar and the furniture of the XR room** — material that exists nowhere else on the site. Steps 1-4 are the sidebar, 5-8 the room.

**It deliberately does not explain the four analyses.** They have a detail page each with more depth than a tutorial can carry, so steps 9-12 of the author's script are one closing hand-off of four `LinkCard`s reading titles from `whatsNew.analyses` and summaries from `analysisPagesContent`. Do not grow them back: that would be a third home for the same facts. The two `ui/` sidebar screenshots, on the other hand, are *excluded* from the Gallery and the About carousel (they are VS Code, not an in-scene panel) and this is where they belong.

**The whole "Setting up" half (steps 1-4) runs as text.** Steps 3 and 4 never had a screenshot upstream (`media/SHOTLIST.md` lists only two `ui/` shots), and the two that did were dropped by the author: they are tight crops of small dialogs (366x203 and 887x336), so in a figure slot they either sat tiny or were upscaled into blur, and the settings they show are already named in the list beside them. Do not put them back without a wider retake. Those two files are now referenced by nothing on the site.

**`TutorialPart` owns one lightbox for its whole half, as a sibling of its Container.** Not a stylistic choice: the Container is what the scroll reveal animates and a `<dialog>` must not sit inside an animated subtree. Per-step lightboxes would need eight dialogs outside eight Containers, turning six sections into fourteen. `TutorialStep` is therefore stateless and reports clicks upward.

**A lone figure is capped at the screenshot's own width**, via `getReleaseImageWidth` (`lib/assets.js`). `MediaCard`'s frame is `object-contain`, which upscales as happily as it downscales, so a master narrower than the slot gets painted blurry rather than left alone. It is a guard, not a live fix: every screenshot the page still shows is wider than its slot.

**The tutorial video uses `MediaVideo` and `getYouTubeEmbedUrl`, the same pair as every other video on the site** — in-view autostart, muted, looping, with the play badge in the frame's bottom-right corner. A bespoke click-to-load component was tried and removed: the difference in badge placement and start behaviour was noticeable next to the rest, and muted autoplay was never the problem it looked like. Verified identical to the Gallery tiles: 44px badge at 9px/9px inset, same wrapper shape.

## Prerender (postbuild step) — READ BEFORE TOUCHING `main.jsx`

`scripts/prerender.mjs` runs after every `vite build` and writes fully rendered HTML into **all seven pages** (`dist/index.html`, `dist/tutorial/index.html`, `dist/analysis/index.html`, and the four `dist/analysis/<slug>/index.html`). **It owns every subpage's JSON-LD.** `build-pages.mjs` writes a deliberately minimal stub and this replaces the whole block on all six, because the real graph needs content (steps, video metadata, breadcrumb labels) that only the content modules have. Each subpage gets a `@graph` with its own type (`TechArticle`, or `HowTo` for the tutorial), a `BreadcrumbList`, **the author `Person` node itself** and, where the page embeds one, a `VideoObject`. The author node is not decoration: subpages used to carry only `author: { "@id": ".../#author" }` while the `Person` lived on the home alone, so the reference resolved to nothing on the page that made it. The replacement is **asserted** — a stub reaching production would otherwise be invisible. One video, one URL that claims it: the tutorial's `VideoObject` is on `/tutorial/` only, and each analysis demo only on its own detail page. The home keeps the `FAQPage`.

**`uploadDate` is null on all five videos, and that is on purpose.** Google requires it for the video rich result, but it is a claim it can check against YouTube, so it is left out rather than guessed — one was briefly a fabricated date. The prerender drops falsy fields (`compact()`), so the markup stays valid and simply does not qualify until the real dates land in `whatsNewContent`/`tutorialContent`. Durations come from the extension repo's `media/v1.2.0/videos/VIDEOS.md`, which disagrees with `SHOTLIST.md` by one second on the historical comparison; VIDEOS.md wins.

**The sitemap has no committed source.** `public/sitemap.xml` was deleted: this script writes `dist/sitemap.xml` whole without reading it, so a committed copy could only go stale and mislead (it had one URL of seven). `robots.txt` points at the URL, not the file. It also **regenerates `dist/sitemap.xml` whole** rather than patching it — the old single-page version used a `<lastmod>` regex with no `g` flag and would have stamped only the first URL. A page added to its `pages` array therefore enters the sitemap on its own. The `FAQPage` block goes on the home alone. Before it existed the deployed body was literally `<div id="root"></div>`: all ~3,500 words arrived only after the JS bundle ran, so Bing, social-card scrapers, chat unfurlers and most AI crawlers saw nothing but the `<title>` and the JSON-LD. Google renders JS, but on a deferred second pass.

It loads `src/app/App.jsx` through Vite's SSR pipeline — **not** `main.jsx`, which imports the CSS and the fonts — renders it with `renderToString`, and also stamps three values that were hand-maintained and went stale: the JSON-LD `softwareVersion` (from `siteContent.version`), the `FAQPage` block (from `faqContent`), and the sitemap's `lastmod`. Each still has one home.

**`main.jsx` uses `createRoot` in dev and `hydrateRoot` in production**, because only the built output is prerendered — hydrating the dev server's empty `#root` would be a total mismatch and a console error every reload.

**Any `useState` initializer that reads `window`, `document` or storage must be guarded** (`typeof window !== 'undefined'`). Two already were not and took the build down with a `ReferenceError`: `Navbar.jsx` and `FloatingActions.jsx`, both reading `window.scrollY`. Effects are safe — they never run during `renderToString`.

Two subtrees deliberately differ between the prerender and the first client render, and React re-renders just those: the About carousel (its slide order is shuffled per visit) and the hero stat strip (it reads a sessionStorage cache the build cannot see). Neither is an error and neither carries SEO weight. **To verify a build, serve a COPY of `dist/`** — `vite preview` locks the real one against the next rebuild.

## Dashboard sync (prebuild step)

**It rewrites the published manifest's `entities`, and the rule is narrow on purpose: drop only `entityKind: 'analysis-view'`, keep everything else.** That one entity records which analysis the export was saved in, and it is replayed at boot — the JetUML export is captured mid-movie, so untouched it opens on the project evolution instead of the classic analysis. The others are *data pointers* (`datasetUrl` for the dependency graph, `resultUrl` for the evolution movie), and they are what the in-scene switcher needs to fill a mode when a visitor picks it. Emptying the array whole (what this did before the schemaVersion 3 "interactive" exports) leaves every mode selectable and permanently blank: the runtime reports `dependency-graph` active with `dataset: null`, because nothing on the page knows where the dependencies JSON lives. Keeping the pointers costs nothing at boot — the datasets are fetched on entering the mode, verified by watching the network.

It also marks every copied `index.html` and `guide.html` `noindex` and gives them `lang="en"`. Those six files are full HTML pages that `TestedProjects` links to with a real, followable `<a href>`, so left alone they get indexed as thin near-duplicates (all three guides shared the title "CodeXR Guide"). **Do not "fix" this with a `Disallow` in robots.txt**: blocking the crawl stops the noindex ever being read, and Google can still index a blocked URL it finds linked.

`scripts/sync-dashboards.mjs` runs before every build. For each project with `dashboardPreview: true` in the content module it reads `dashboard-imports/<id>/` expecting **exactly one** Code-XR export folder containing `index.html`, and replaces `public/dashboards/<id>/` with it. More than one folder → build fails (deliberate). Zero → keeps the committed dashboards (CI always takes this path because `dashboard-imports/**` is gitignored).

**The export's timeline breadth is chosen in CodeXR, not here, and it decides the deploy size.** A `timelineSelection.kind` of `"all"` exports every commit: the first JetUML export was 678 MB of `git-revisions/` for 2,789 commits, while the player only ever offered 24 frames. `"latest"` with 30 commits gives the same 24 frames in 29 MB. Check `gitData.timelineSelection` in the manifest before committing a new export.

Each export also ships its dependency dataset **twice** — `dependency-graph.json` at the root and a byte-identical `dependencies/dependency-graph-1.json`. Only the nested copy is referenced (via the manifest `datasetUrl`); the root one is unreferenced dead weight, ~6 MB across the three dashboards. That is the CodeXR exporter writing it twice, so the fix belongs upstream, not in a delete step here.

## Deployment and the custom domain

`.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/` to GitHub Pages. It asserts `dist/CNAME` exists — `public/CNAME` must stay, and `vite.config.js` must keep `base: '/'`. `public/404.html` is the custom error page (GitHub Pages only supports customizing 404, no other 4XX; it's self-contained static HTML mirroring the site look).

The domain is hardcoded in places that change together: `index.html` (canonical, OG/Twitter, JSON-LD), `public/CNAME`, `public/robots.txt`, and the `ORIGIN` constants in `scripts/prerender.mjs` and `scripts/build-pages.mjs`.

`public/social-preview.png` (1200x630) is the OG/Twitter card. It is a **title card, not a screenshot**: the Code-XR mark, the wordmark with `XR` in the accent, the tagline, and a `VS Code Extension · v1.2.0 · IEEE VISSOFT 2025 Distinguished Artifact` line, over the dark surface gradient. The v1.1.0 one it replaced advertised the wrong version, carried the abandoned `amontesl.github.io` URL, clipped its own text, and used the rejected neon-cyan-and-glow look. Its `og:image:alt` / `twitter:image:alt` describe the card and must be rewritten with it.

There is no script for it, deliberately: Inter is not installed system-wide, so sharp and librsvg cannot set the type. It was produced by rendering the mark (from `lib/logoPaths.js`) and the text onto a transparent canvas **in the running dev-server page**, where the real Inter is loaded and the design tokens can be read straight off `:root`, then compositing that layer over a raw-pixel gradient in sharp. Generate the gradient as raw pixels, never via canvas or an SVG gradient: both dither the ramp and the noise takes the PNG from 28 KB to 162 KB.

Current work happens on branch `feat/v1.2.0-website`; nothing deploys until it merges to `main`.

## README policy

`README.md` is deliberately a byte-identical copy of the CodeXR extension repo's README on its release branch — re-sync it from `aMonteSl/CodeXR` rather than editing it here.
