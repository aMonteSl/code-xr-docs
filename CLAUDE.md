# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

The official site for **Code-XR**, a VS Code extension that visualizes code metrics in XR. React 19 + Vite 8 + Tailwind 4, plain JS (no TypeScript), deployed to GitHub Pages at `https://code-xr.adrianmonteslinares.com/`. The extension lives in a separate repo (`aMonteSl/CodeXR`); this repo only documents it.

**The repo is mid-rebuild for the v1.2.0 release and ships two sites from one Vite multi-page build:**

| Route | Entry | Code | Status |
|---|---|---|---|
| `/` | `index.html` | `src/` | The NEW site, being built from scratch. All new work happens here. |
| `/old_web/` | `old_web/index.html` | `legacy/` | The previous site, frozen as an archive (`noindex`). Never add features here; it will be deleted once the new site is complete. |

Both share `public/` (assets, dashboards, CNAME, 404.html), so nothing is duplicated.

## Commands

```bash
npm run dev              # Vite dev server: / = new site, /old_web/ = archived site
npm run build            # prebuild (sync:dashboards) then vite build (both entries)
npm run sync:dashboards  # copy dashboard exports into public/ (see below)
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
- `public/` files are referenced through `getAssetPath()` / helpers in `src/lib/assets.js`, never bare string paths. v1.2.0 release media is already at `public/assets/releases/v1-2-0/` (mirrors `CodeXR/media/v1.2.0`); demo videos are on YouTube — never commit `.mp4` files.
- Components: PascalCase file named after its default export, one component per file. Modules in `content`/`lib`/`hooks`: camelCase.

## Design tokens and theming

Everything lives in `src/styles/main.css`. **Two token layers — components only ever use the semantic one:**

1. **Brand scale** `--color-brand-50…950` (utilities `bg-brand-500`, etc.): the blue ramp around the Code-XR identity color `#00aaff`. Same in both themes. The site palette is blues + white — do not introduce other hues without asking the user.
2. **Semantic tokens** via `@theme inline` → CSS variables that flip with the theme: `surface`, `surface-raised`, `surface-sunken` (backgrounds), `ink`, `ink-muted`, `ink-faint` (text), `edge` (borders), `accent`, `accent-strong`, `on-accent`. Use `bg-surface`, `text-ink-muted`, `border-edge`, `bg-accent`… **Never hardcode hex colors in components.**

**Theming**: light and dark are both first-class, resolved from the browser's `prefers-color-scheme` — an inline script in `index.html` sets `.dark` on `<html>` before first paint (no FOUC), and `src/app/theme.js` watches for live preference changes. Dark mode is class-based (`@custom-variant dark`). Any future manual toggle must persist an override and update both the inline snippet and `theme.js`.

**Tailwind scoping**: each site's CSS restricts scanning with `source(…)` (`src/styles/main.css` scans `src/`; `legacy/styles/main.css` scans `legacy/` + `old_web/`) so the two bundles never leak classes into each other. Keep it that way.

## Legacy site (`legacy/`) notes

- Reachable only from `/old_web/`; `old_web/index.html` is `noindex` and canonicals to `/`.
- Don't refactor or grow it. Bug-fix only if something breaks the build.
- Things still worth **porting** (copy, then adapt) when the new site needs them: `legacy/contexts/MarketplaceContext.jsx` (live Marketplace stats via `extensionquery` POST, `'-'` fallbacks, extension id `aMonteSl.code-xr`, and the `.js`/`.jsx` context/provider split for Fast Refresh), `legacy/utils/media.js` (YouTube helpers), `legacy/content/*` (v1.1.0 copy as reference).
- The dashboard sync script imports `legacy/content/testedProjectsContent.js`; when the new site gets its own showcased-projects content module, update `scripts/sync-dashboards.mjs` to point at it.

## Dashboard sync (prebuild step)

`scripts/sync-dashboards.mjs` runs before every build. For each project with `dashboardPreview: true` in the content module it reads `dashboard-imports/<id>/` expecting **exactly one** Code-XR export folder containing `index.html`, and replaces `public/dashboards/<id>/` with it. More than one folder → build fails (deliberate). Zero → keeps the committed dashboards (CI always takes this path because `dashboard-imports/**` is gitignored).

## Deployment and the custom domain

`.github/workflows/deploy.yml` builds on push to `main` and publishes `dist/` to GitHub Pages. It asserts `dist/CNAME` exists — `public/CNAME` must stay, and `vite.config.js` must keep `base: '/'`. `public/404.html` is the custom error page (GitHub Pages only supports customizing 404, no other 4XX; it's self-contained static HTML mirroring the site look).

The domain is hardcoded in places that change together: `index.html` (canonical, OG/Twitter, JSON-LD), `public/CNAME`, `public/sitemap.xml`, `public/robots.txt`, and a `window.location.hostname` check in `legacy/sections/Downloads.jsx`.

Current work happens on branch `feat/v1.2.0-website`; nothing deploys until it merges to `main`.

## README policy

`README.md` is deliberately a byte-identical copy of the CodeXR extension repo's README on its release branch — re-sync it from `aMonteSl/CodeXR` rather than editing it here.
