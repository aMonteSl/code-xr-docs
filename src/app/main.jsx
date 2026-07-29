import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from '@/app/App';
import { watchSystemTheme } from '@/lib/theme';
import '@fontsource-variable/inter';
import '@/styles/main.css';

watchSystemTheme();

// hydrateRoot, not createRoot: scripts/prerender.mjs writes the fully rendered
// markup into #root at build time, so the browser adopts existing DOM instead
// of replacing it. Throwing it away would undo the whole point — and would
// flash the page.
//
// Two subtrees legitimately differ between the prerender and the first client
// render, and React re-renders just those: the About carousel (its slide order
// is shuffled per visit) and the hero stat strip (it reads a sessionStorage
// cache the build has no access to). Neither is an error and neither carries
// SEO weight; if either ever flashes visibly, that is the thing to look at.
//
// Only the built output is prerendered — the dev server still ships an empty
// #root, and hydrating an empty container against a full tree is a total
// mismatch that React resolves by re-rendering everything, with a console
// error each reload. So dev mounts, production hydrates.
const container = document.getElementById('root');
const tree = (
  <StrictMode>
    <App />
  </StrictMode>
);

if (import.meta.env.DEV) {
  createRoot(container).render(tree);
} else {
  hydrateRoot(container, tree);
}
