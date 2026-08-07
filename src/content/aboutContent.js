// "What is Code-XR" section: copy plus the screenshot manifest that feeds the
// carousel. Every claim is checkable against the extension README; nothing
// asserts validation on physical headset hardware (v1.2.0 was verified on
// desktop browsers and emulated WebXR sessions).
export const about = {
  eyebrow: 'Overview',
  heading: 'What is Code-XR?',
  paragraphs: [
    'Code-XR is a Visual Studio Code extension that turns static analysis into a place you can explore. It measures your code (complexity, size, structure, dependencies and history) and serves the result as a live 3D scene in the browser you already have.',
    'Walk your codebase like a city and watch it update as you save. Step inside the dependency graph to see the architecture rather than the files, compare two points of your Git history on one table, or replay the whole evolution as a film.',
    'No VR headset required: a normal desktop is enough, and the same scene becomes immersive when you want it. Everything runs on your machine, with local analysis, local servers, no telemetry and no account.',
  ],
  features: [
    { id: 'classic', label: 'Classic analysis', description: 'one building per file, live metrics' },
    { id: 'graph', label: 'Dependency graph', description: 'the architecture in three layouts' },
    { id: 'compare', label: 'Historical comparison', description: 'two points in time, one table' },
    { id: 'evolution', label: 'Project evolution', description: 'your Git history as a film' },
  ],

  // The chips above are the /analysis/ index in miniature, so this is where a
  // first-time reader meets the four and the natural place to offer the fuller
  // view. The label is shared with the release section's own link — see
  // ANALYSIS_INDEX_LABEL in analysisPagesContent.
  analysesLink: {
    text: 'Each one answers a different question, and each has a page of its own.',
  },

  // Second link in the same block, because a first-time reader who has just met
  // the four chips wants one of two things: which analysis to read about, or
  // somebody to show them the whole thing. The label and href are shared with
  // the other three entry points — see TUTORIAL_LABEL in tutorialContent.
  tutorialLink: {
    text: 'Never used it? There is a complete walkthrough of the extension, sidebar included.',
  },

  // Closing hand-off, to the Gallery at screen 13.3 — the biggest single
  // shortcut on the page (11 screens), and it points at the one thing the
  // Gallery holds that exists nowhere else: the eight rescued walkthrough
  // videos. The carousel above deliberately gives a taste, not the set, so
  // this says exactly that rather than repeating the section's own pitch.
  bridge: {
    text: 'The carousel is a sample. Every screenshot and all eight walkthrough videos are further down, in the Gallery.',
    label: 'Browse the Gallery',
    href: '#gallery',
  },

  carousel: {
    previous: 'Previous screenshot',
    next: 'Next screenshot',
    expand: 'Expand screenshot',
    close: 'Close expanded screenshot',
    counter: (position, total) => `${position} / ${total}`,

    // Spoken on a manual step ONLY, never on the six-second tick — see the
    // snapshot note in AboutCarousel, which is what enforces that.
    //
    // "3 of 40" rather than the visible counter's "3 / 40" because this
    // sentence is not the counter, it is a sentence, and it spells out the word
    // a slash stands for. (The EXPANDED view is a different case: its announcer
    // repeats the lightbox caption verbatim, slash and all, because that is
    // literally the text on screen.) The description is included because it is
    // the thing the reader pressed the arrow to get — the image sits inside a
    // button whose aria-label is "Expand screenshot", so its alt is not what
    // focus announces.
    announcement: (position, total, description) =>
      `Screenshot ${position} of ${total}. ${description}`,
  },

  // Editorial exclusions: files listed here stay in the manifest below (so
  // re-including one is deleting a line here, not re-writing its entry) but
  // never enter the carousel.
  excludedImages: [
    'guide/guide-html.png',
    'ui/new_active_servers.png',
    'ui/new_server_configuration.png',
  ],

  // The carousel manifest. `file` is relative to public/assets/releases/v1-2-0
  // (resolved via getReleaseAsset). `group` drives the spread-shuffle: no two
  // adjacent slides come from the same group when avoidable. hero.png is NOT
  // here — it is pinned as slide 0 by the section.
  heroImage: { file: 'hero.png', alt: 'Code-XR 3D code city rendered from a real project' },
  images: [
    // Live panel (2D, inside VS Code)
    { file: 'analysis/live_panel/livepanel-file.png', group: 'live-panel', alt: 'LivePanel file analysis inside VS Code' },
    { file: 'analysis/live_panel/livepanel-deps.png', group: 'live-panel', alt: 'LivePanel dependency summary inside VS Code' },
    { file: 'analysis/live_panel/livepanel-history.png', group: 'live-panel', alt: 'LivePanel 2D historical comparison inside VS Code' },

    // Classic XR analysis
    { file: 'analysis/xr/normal/normal.png', group: 'xr-normal', alt: 'Classic code city analysis: one building per file' },

    // Dependency graph
    { file: 'analysis/xr/dependency/dependency_force-3d.png', group: 'xr-dependency', alt: 'Dependency graph in the force-3d layout' },
    { file: 'analysis/xr/dependency/dependency_hierarchical.png', group: 'xr-dependency', alt: 'Dependency graph in the hierarchical layout' },
    { file: 'analysis/xr/dependency/dependency_metric-space.png', group: 'xr-dependency', alt: 'Dependency graph in the metric-space layout' },
    { file: 'analysis/xr/dependency/dependency_example.png', group: 'xr-dependency', alt: 'Dependency graph of a real project' },
    { file: 'analysis/xr/dependency/dependency_example_1.png', group: 'xr-dependency', alt: 'Dependency graph, group view drill-down' },
    { file: 'analysis/xr/dependency/dependency_node_card.png', group: 'xr-dependency', alt: 'Pinned node card with per-module metrics' },

    // Historical comparison
    { file: 'analysis/xr/historical/historical_comparison.png', group: 'xr-historical', alt: 'Historical comparison: two Git points on one dual table' },
    { file: 'analysis/xr/historical/historical_comparison_example.png', group: 'xr-historical', alt: 'Historical comparison on a real repository' },

    // Project evolution
    { file: 'analysis/xr/project_evolution/project_evolution.png', group: 'xr-evolution', alt: 'Project evolution: replaying the Git history commit by commit' },
    { file: 'analysis/xr/project_evolution/project_evolution_example_1.png', group: 'xr-evolution', alt: 'Project evolution timeline on a real repository' },

    // In-scene controllers
    { file: 'controllers/xr/analysis_selector/analysis_selector.png', group: 'controllers', alt: 'In-scene analysis selector: four analyses on one table' },
    { file: 'controllers/xr/dependency/dependency_controller.png', group: 'controllers', alt: 'Dependency analysis controller panel' },
    { file: 'controllers/xr/historical/historical_comparison_main.png', group: 'controllers', alt: 'Historical comparison controller panel' },
    { file: 'controllers/xr/historical/historical_comparison_field_mapping.png', group: 'controllers', alt: 'Field mapping for the historical comparison' },
    { file: 'controllers/xr/new_virtual_screens_controllers/virtual_controller.png', group: 'controllers', alt: 'Virtual screens controller' },
    { file: 'controllers/xr/normal/codexr_field_mapping.png', group: 'controllers', alt: 'Field mapping: any metric drives any visual channel' },
    { file: 'controllers/xr/project_evolution/project_evolution_controller.png', group: 'controllers', alt: 'Project evolution playback controller' },
    { file: 'controllers/xr/project_evolution/project_evolution_field_mapping.png', group: 'controllers', alt: 'Field mapping for project evolution' },

    // In-room user guide
    { file: 'guide/landing.png', group: 'guide', alt: 'In-room user guide: landing tab' },
    { file: 'guide/guide-html.png', group: 'guide', alt: 'The user guide served as guide.html in the browser' },
    { file: 'guide/tips.png', group: 'guide', alt: 'User guide: tips tab' },
    { file: 'guide/normal_guide.png', group: 'guide', alt: 'User guide: classic analysis walkthrough' },
    { file: 'guide/normal_data.png', group: 'guide', alt: 'User guide: classic analysis metric glossary' },
    { file: 'guide/deps_guide.png', group: 'guide', alt: 'User guide: dependency analysis walkthrough' },
    { file: 'guide/deps_guide_2.png', group: 'guide', alt: 'User guide: dependency analysis, second page' },
    { file: 'guide/deps_data.png', group: 'guide', alt: 'User guide: dependency metric glossary' },
    { file: 'guide/history_guide.png', group: 'guide', alt: 'User guide: historical comparison walkthrough' },
    { file: 'guide/history_data.png', group: 'guide', alt: 'User guide: historical comparison glossary' },
    { file: 'guide/evolution_guide.png', group: 'guide', alt: 'User guide: project evolution walkthrough' },
    { file: 'guide/evolution_data.png', group: 'guide', alt: 'User guide: project evolution glossary' },

    // Sidebar UI
    { file: 'ui/new_active_servers.png', group: 'ui', alt: 'Reorganized sidebar: active servers' },
    { file: 'ui/new_server_configuration.png', group: 'ui', alt: 'Server configuration in the sidebar' },

    // Real XR sessions
    { file: 'xr_experiences/vr-city-at-the-table.jpeg', group: 'xr-experiences', alt: 'VR session: the code city on a table' },
    { file: 'xr_experiences/vr-flying-over-the-city.jpeg', group: 'xr-experiences', alt: 'VR session: flying over the codebase skyline' },
    { file: 'xr_experiences/vr-testing-cockpit.jpeg', group: 'xr-experiences', alt: 'VR testing cockpit with the scene loaded' },
    { file: 'xr_experiences/ar-development.jpeg', group: 'xr-experiences', alt: 'AR session during development' },
    { file: 'xr_experiences/ar-hover-legend-passthrough.jpeg', group: 'xr-experiences', alt: 'AR passthrough with the hover legend' },
    { file: 'xr_experiences/ar-recentered-pedestal.jpeg', group: 'xr-experiences', alt: 'AR session: the pedestal recentered in the room' },
  ],
};
