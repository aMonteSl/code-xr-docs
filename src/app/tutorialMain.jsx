import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import TutorialPage from '@/app/TutorialPage';
import { watchSystemTheme } from '@/lib/theme';
import '@fontsource-variable/inter';
import '@/styles/main.css';

// Entry for /tutorial/.
//
// Its own entry rather than a branch inside analysisMain: that module derives a
// slug from the URL and throws on anything it does not recognise, which is what
// makes a mistyped analysis slug obvious. Teaching it a second, slug-less page
// would blunt exactly that. The cost is one small extra chunk; main.css is still
// emitted once, which is the check that confirms nothing was duplicated.
//
// It repeats what the other entries do and nothing more: the font, the
// stylesheet and watchSystemTheme() are imported in exactly one place per entry,
// and an entry that skips any of the three loses fonts, styles or theme
// reconciliation.
watchSystemTheme();

const container = document.getElementById('root');
const tree = (
  <StrictMode>
    <TutorialPage />
  </StrictMode>
);

// Dev mounts, production hydrates — only the built output is prerendered. Same
// split as main.jsx and analysisMain.jsx, for the same reason.
if (import.meta.env.DEV) {
  createRoot(container).render(tree);
} else {
  hydrateRoot(container, tree);
}
