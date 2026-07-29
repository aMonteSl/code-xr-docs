import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import AnalysisIndexPage from '@/app/AnalysisIndexPage';
import AnalysisPage from '@/app/AnalysisPage';
import { watchSystemTheme } from '@/lib/theme';
import '@fontsource-variable/inter';
import '@/styles/main.css';

// Entry for /analysis/ and the four /analysis/<slug>/ pages. One module serves
// all five: the slug comes from the URL, so there is one bundle and one
// stylesheet rather than five near-identical ones.
//
// It repeats what main.jsx does and nothing more: the font, the stylesheet and
// watchSystemTheme() are imported in exactly one place per entry, and an entry
// that skips any of the three loses fonts, styles or theme reconciliation.
watchSystemTheme();

// `/analysis/dependency-graph/` → `dependency-graph`. Tolerates a missing
// trailing slash, which is how GitHub Pages will serve it if someone types the
// URL by hand.
const slugFromPath = () => {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? '';
};

// `/analysis/` lands here too, and its last path segment is the directory name
// itself. Matched explicitly rather than falling back to the index for any
// unrecognised slug: AnalysisPage throws on an unknown one, and that throw is
// what makes a typo in a slug obvious instead of silently showing the index.
const slug = slugFromPath();
const isIndex = slug === 'analysis';

const container = document.getElementById('root');
const tree = (
  <StrictMode>{isIndex ? <AnalysisIndexPage /> : <AnalysisPage slug={slug} />}</StrictMode>
);

// Dev mounts, production hydrates — only the built output is prerendered. Same
// split as main.jsx, for the same reason.
if (import.meta.env.DEV) {
  createRoot(container).render(tree);
} else {
  hydrateRoot(container, tree);
}
