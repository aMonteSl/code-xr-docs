// "What's new in v1.2.0". Every claim here traces to the extension's
// CHANGELOG.md on the v1.2.0 branch or to the README section it summarises.
//
// ACCURACY RULE, do not soften: v1.2.0 was validated on desktop browsers and
// through emulated WebXR sessions (Meta's Immersive Web Emulator), and — like
// v1.1.0 — NOT on physical headsets. The emulator is what is new, not hardware
// validation. Never write copy that implies a real headset was tested.
//
// `file` paths are relative to public/assets/releases/v1-2-0 and resolve
// through getReleaseAsset.
//
// VIDEO FIELDS. `videoId` and `videoTitle` are what the page renders;
// `videoDuration` and `videoUploadDate` exist only for the VideoObject that
// scripts/prerender.mjs puts on each analysis detail page.
//
//   videoDuration    ISO 8601, taken from the extension repo's
//                    media/v1.2.0/videos/VIDEOS.md, which is the declared source
//                    of truth for every video. Note it disagrees with SHOTLIST.md
//                    by one second on the historical comparison (1:18 vs 1:19);
//                    VIDEOS.md wins.
//   videoUploadDate  NOT KNOWN YET, hence null. Google requires it for the video
//                    rich result, and it is a claim it can check against
//                    YouTube — so it is left null rather than guessed. The
//                    prerender omits falsy fields, so the markup stays valid and
//                    simply does not qualify until these are real dates from
//                    YouTube Studio (YYYY-MM-DD). Same for TUTORIAL_VIDEO in
//                    tutorialContent.js.
export const whatsNew = {
  eyebrow: 'Release',
  heading: "What's new in v1.2.0",
  codename: 'Threads, Timelines & Global Networks',
  intro:
    'Threads are the new dependency graph: the lines that tie your codebase together. Timelines are the two Git analyses, one that compares two points of your history and one that replays the whole thing. Global Networks are the sessions you can now open to someone who is not on your network at all.',
  headline: 'One table, four analyses',
  headlineDetail:
    'The same pedestal now serves four different analyses, and you switch between them from inside the scene without losing the state of any of them.',

  watchLabel: 'Watch the demo',

  // Closing hand-off, to Install at screen 11.6. This is the end of the longest
  // section on the page — 5.8 screens, four analyses with videos — which is
  // where intent peaks, and nothing between here and Install answers "how do I
  // get it". It deliberately does NOT point at Collaboration: the highlight
  // card above already hands off there in prose, and two hand-offs to one
  // target out of one section is a stutter.
  //
  // "about 11 minutes" is quoted from installContent's own quickStart total —
  // change the two together.
  bridge: {
    text: 'That is all of 1.2.0. One install, then about 11 minutes to your first analysis.',
    label: 'Install it and run it',
    href: '#install',
  },

  carousel: {
    previous: 'Previous screenshot',
    next: 'Next screenshot',
    expand: 'Expand screenshot',
    close: 'Close expanded screenshot',
    counter: (position, total) => `${position} / ${total}`,

    // Spoken on a manual step only, never on the autoplay tick — SectionCarousel
    // snapshots it in the click handler, which is what makes that true. Worded
    // identically to about.carousel.announcement on purpose: two decks on one
    // page that behave the same should sound the same.
    announcement: (position, total, description) =>
      `Screenshot ${position} of ${total}. ${description}`,
  },

  analyses: [
    {
      // The odd one out, and the copy says so. This analysis is not new: it is
      // what CodeXR started with. Its only real 1.2.0 change is that the chart
      // type can be swapped mid-session instead of forcing a re-run, plus
      // fixes. The section's own intro already reflects this — the codename
      // names three things (Threads, Timelines, Global Networks) and the
      // classic is not among them; "four analyses" is about the table and the
      // switcher, which ARE new.
      //
      // Do not restore the old third bullet ("anything you save updates the
      // scene by itself"). That behaviour predates 1.2.0 and does not belong
      // in a what's-new list.
      id: 'classic',
      title: 'Classic analysis: change the chart without re-running it',
      description:
        'The analysis CodeXR started with, and still where most sessions begin: one building per file, sized and coloured by the metrics you choose. What 1.2.0 changed is that you no longer have to re-run it to see it another way.',
      points: [
        'Swap the chart type from the Field Mapping panel mid-session, without relaunching the analysis.',
        'The chart types that used to present incorrectly now render properly, and big projects stay readable by showing the top files per metric.',
      ],
      videoId: '76p1ibPaf3I',
      videoTitle: 'Classic analysis in XR',
      videoDuration: 'PT1M16S',
      videoUploadDate: null,
      images: [
        { file: 'analysis/xr/normal/normal.png', alt: 'The code city on the cyan table, with the in-room guide and the Field Mapping panel around it' },
        { file: 'controllers/xr/normal/codexr_field_mapping.png', alt: 'The Field Mapping panel: chart picker on top, then area, height and colour, each with the full metric list' },
        { file: 'guide/normal_guide.png', alt: 'The in-room guide open on its Normal tab, explaining the classic analysis' },
        { file: 'guide/normal_data.png', alt: 'The metric glossary for the classic analysis' },
      ],
    },
    {
      id: 'dependency',
      title: 'Dependency graph: see the architecture, not just the files',
      description:
        'A new analysis that answers what depends on what, and what happens if you touch it. Relations are read from your source without running it and rendered as a navigable 3D graph that keeps up as you save.',
      points: [
        'Three layouts: force-3d, hierarchical, and metric-space with real axes.',
        'Any node metric (fan-in, fan-out, cycle size, blast radius) can drive size, height, colour or position.',
        'Click a node to pin its metric card; large projects open in group view and you drill in.',
      ],
      videoId: '42hIQTUD0-g',
      videoTitle: 'Dependency graph in XR',
      videoDuration: 'PT1M48S',
      videoUploadDate: null,
      images: [
        { file: 'analysis/xr/dependency/dependency_force-3d.png', alt: 'The dependency graph in the force-3d layout' },
        { file: 'analysis/xr/dependency/dependency_hierarchical.png', alt: 'The dependency graph in the hierarchical layout' },
        { file: 'analysis/xr/dependency/dependency_metric-space.png', alt: 'The dependency graph in the metric-space layout, with real axes' },
        { file: 'analysis/xr/dependency/dependency_node_card.png', alt: 'A pinned node card: fan-in, fan-out, degree, relations, cycle, lines and instability' },
        { file: 'controllers/xr/dependency/dependency_controller.png', alt: 'The dependency panel: layout selector, metric mapping, relation filters and flow controls' },
        { file: 'analysis/xr/dependency/dependency_example.png', alt: 'The dependency graph of a real project' },
      ],
    },
    {
      id: 'historical',
      title: 'Historical comparison: what changed between two points in time',
      description:
        'Pick two sources, a working copy, a branch, a tag or a commit, and both states land on one dual table with the same chart, the same mapping and the same scale, so a height difference is a real difference.',
      points: [
        'A comparison card reports added, removed and modified counts plus per-metric deltas.',
        'It never runs checkout or fetch, and never writes inside .git: your branch and files stay where you left them.',
        'It talks to your local git, so it works the same on GitHub, GitLab, Bitbucket or a self-hosted server.',
      ],
      videoId: 'b37qDCQeZg0',
      videoTitle: 'Historical comparison in XR',
      videoDuration: 'PT1M18S',
      videoUploadDate: null,
      images: [
        { file: 'analysis/xr/historical/historical_comparison.png', alt: 'The dual table: two revisions of the same project side by side on one shared scale' },
        { file: 'analysis/xr/historical/historical_comparison_example.png', alt: 'A historical comparison on a real repository, each side labelled with its revision' },
        { file: 'controllers/xr/historical/historical_comparison_main.png', alt: 'The comparison panel: the left and right source slots, filters and the compare button' },
        { file: 'controllers/xr/historical/historical_comparison_field_mapping.png', alt: 'Field mapping for the historical comparison, applied to both sides at once' },
      ],
    },
    {
      id: 'evolution',
      title: 'Project Evolution: your Git history as a film',
      description:
        'Where the comparison shows two photographs, Project Evolution plays the movie: the chart walks your history commit by commit, from the first revision to the current state of the branch.',
      points: [
        'The timeline is sampled evenly in time, favouring merges and tags, or you pick a range or the exact commits.',
        'Play, pause, step, change speed, jump anywhere on the timeline.',
        'Every frame is a full analysis, stamped with its commit and date.',
      ],
      videoId: 'QDN8tcKx60w',
      videoTitle: 'Project Evolution in XR',
      videoDuration: 'PT3M2S',
      videoUploadDate: null,
      images: [
        { file: 'analysis/xr/project_evolution/project_evolution.png', alt: 'A frame of the evolution movie on the amber table' },
        { file: 'analysis/xr/project_evolution/project_evolution_example_1.png', alt: 'An evolution frame stamped with the commit hash and date it belongs to' },
        { file: 'controllers/xr/project_evolution/project_evolution_controller.png', alt: 'The player panel: timeline modes, frame list, transport buttons and playback speeds' },
        { file: 'controllers/xr/project_evolution/project_evolution_field_mapping.png', alt: 'Field mapping for project evolution' },
      ],
    },
  ],

  highlightsHeading: 'And the rest of 1.2.0',
  highlights: [
    {
      // A teaser: the full walkthrough lives in the Collaboration section,
      // which is where the pairing-flow screenshots moved.
      id: 'collaboration',
      title: 'Collaboration 2.0 and cross-network sessions',
      description:
        'Persistent identities, host and guest roles with automatic promotion, and a bundled animated avatar that works offline, each participant in their own colour. Sessions can now reach someone outside your network through an outbound Cloudflare tunnel that opens with the server, gated by a six-digit pairing code and switchable off in Server Configuration: the full walkthrough is in the Collaboration section below.',
      images: [
        { file: 'hero.png', alt: 'A shared Code-XR room with the analysis on the table' },
      ],
    },
    {
      id: 'xr-experience',
      title: 'A tuned XR experience, debugged in an emulator',
      description:
        "This release's immersive behaviour was debugged end to end with a browser extension, Meta's Immersive Web Emulator, which drives real WebXR sessions from the desktop. That is how the XR side got tuned this time, unlike in v1.1.0. Walking, turning and flying now run off the thumbsticks; you enter VR and AR at your real height and come back to exactly where you were; AR recenters the pedestal a step in front of you and no longer looks dim; and you can grab a screen and push or pull it with the stick.",
      images: [
        { file: 'xr_experiences/vr-city-at-the-table.jpeg', alt: 'A VR session with the code city on the table' },
        { file: 'xr_experiences/vr-flying-over-the-city.jpeg', alt: 'Flying over the codebase skyline in VR' },
        { file: 'xr_experiences/vr-testing-cockpit.jpeg', alt: 'The VR testing cockpit with the scene loaded' },
        { file: 'xr_experiences/ar-development.jpeg', alt: 'An AR session during development' },
        { file: 'xr_experiences/ar-recentered-pedestal.jpeg', alt: 'AR with the pedestal recentered a step in front of you' },
        { file: 'xr_experiences/ar-hover-legend-passthrough.jpeg', alt: 'AR passthrough showing the hover legend' },
      ],
    },
    {
      id: 'guide',
      title: 'A user guide inside the room',
      description:
        'The answer to "what am I looking at" no longer requires taking the headset off. Six tabs, each in the colour of its analysis, plus a 24-term metric glossary generated from the real analysis contracts. It behaves like any other screen: drag it, resize it, minimise it when you are done. The same guide is served as guide.html for reading outside XR.',
      // Every tab the guide actually has, in the order the description above
      // walks them: the two shared tabs, then each analysis with its
      // walkthrough followed by its glossary, and the browser twin last.
      // Anything less made the card claim six tabs and a 24-term glossary while
      // showing three screenshots.
      images: [
        { file: 'guide/landing.png', alt: 'The in-room user guide on its Start tab' },
        { file: 'guide/tips.png', alt: 'The Tips tab of the in-room user guide' },
        { file: 'guide/normal_guide.png', alt: 'The guide walking through the classic analysis' },
        { file: 'guide/normal_data.png', alt: 'The metric glossary for the classic analysis' },
        { file: 'guide/deps_guide.png', alt: 'The guide walking through the dependency graph' },
        { file: 'guide/deps_guide_2.png', alt: 'The dependency walkthrough, second page' },
        { file: 'guide/deps_data.png', alt: 'The metric glossary for the dependency graph' },
        { file: 'guide/history_guide.png', alt: 'The guide walking through the historical comparison' },
        { file: 'guide/history_data.png', alt: 'The metric glossary for the historical comparison' },
        { file: 'guide/evolution_guide.png', alt: 'The guide walking through project evolution' },
        { file: 'guide/evolution_data.png', alt: 'The metric glossary for project evolution' },
        { file: 'guide/guide-html.png', alt: 'The same guide served as guide.html, for reading outside XR' },
      ],
    },
    {
      id: 'controllers',
      title: 'A panel for every analysis',
      description:
        'Each analysis brings its own controls into the scene. Field Mapping decides which metric drives area, height and colour; the dependency, comparison and evolution panels each add their own; and the Analyses button routes between the four modes without losing the state of any of them. The virtual screens controller shares and joins screens in a session.',
      images: [
        { file: 'controllers/xr/analysis_selector/analysis_selector.png', alt: 'The in-scene analysis selector with the four colour-coded analyses' },
        { file: 'controllers/xr/normal/codexr_field_mapping.png', alt: 'Field Mapping: the chart picker and the metric behind area, height and colour' },
        { file: 'controllers/xr/dependency/dependency_controller.png', alt: 'The dependency panel: layouts, metric mapping and relation filters' },
        { file: 'controllers/xr/historical/historical_comparison_main.png', alt: 'The comparison panel: the left and right source slots and the compare button' },
        { file: 'controllers/xr/historical/historical_comparison_field_mapping.png', alt: 'Field mapping for the historical comparison, applied to both sides at once' },
        { file: 'controllers/xr/project_evolution/project_evolution_controller.png', alt: 'The evolution player: timeline modes, transport buttons and speeds' },
        { file: 'controllers/xr/project_evolution/project_evolution_field_mapping.png', alt: 'Field mapping for project evolution' },
        { file: 'controllers/xr/new_virtual_screens_controllers/virtual_controller.png', alt: 'The virtual screens controller, used to share and join screens' },
      ],
    },
    {
      id: 'livepanel',
      title: 'LivePanel caught up with the room',
      // Accuracy: LivePanel covers file, dependencies and history. Project
      // Evolution is XR-only, so this must not imply all four analyses.
      description:
        'The 2D panel inside VS Code now carries the same analytics you get in the room. Alongside the file analysis it gained a Dependency Summary (counters, top fan-in and fan-out, cycles) and a Historical Comparison with a searchable table of per-item deltas, so the file, dependency and history analyses are all there without leaving the editor.',
      images: [
        { file: 'analysis/live_panel/livepanel-file.png', alt: 'LivePanel showing a file analysis inside VS Code' },
        { file: 'analysis/live_panel/livepanel-deps.png', alt: 'LivePanel showing the dependency summary' },
        { file: 'analysis/live_panel/livepanel-history.png', alt: 'LivePanel showing the 2D historical comparison' },
      ],
    },
    {
      id: 'install-size',
      title: 'Much lighter, and much more',
      description:
        'The packaged extension went from 39.2 MB to 6.1 MB: production builds no longer ship webpack source maps (they stay in dev builds for debugging) and an unused icon set is out of the package.',
      stat: { from: '39.2 MB', to: '6.1 MB' },
      items: [
        'The Code-XR mark assembles itself in 3D over the table while no analysis is loaded, and takes itself apart when one arrives. It holds still if the frame rate drops or the system asks for reduced motion.',
        'Collision bumpers: screens stop at the room walls and at each other instead of passing through.',
        'The Analyses button wears the colour of the analysis you are in, so the panel tells you where you are before you open it.',
        'Servers really stop and leave the list, even when the shutdown fails.',
        'Server dialogs are readable native dialogs instead of printing raw escape characters.',
        'A new setting decides whether cross-network connections appear at all, and the whole interface is now in English.',
      ],
      images: [],
    },
  ],
};
