// The gallery: every screenshot and video the site has, in one browsable
// place. It is also where the previous site's media survives — the eight
// walkthrough videos below live nowhere else now that the old site is gone,
// and they are still the only "how do I use this" material on the site.
//
// Item shapes:
//   image: { id, kind: 'image', category, file, title, alt, release? }
//   video: { id, kind: 'video', category, videoId, title, alt, poster? }
// `file` and `poster` are relative to public/assets/releases/<release>, with
// `release` defaulting to the current one. A video WITHOUT a poster falls back
// to the shared hero render (see the gallery section) — that is the case for
// the eight rescued videos, which have no still of their own.
const RELEASE_PREVIOUS = 'v1-1-0';

// Hoisted so the chip's visible count and the spoken filter announcement below
// cannot drift apart on the plural rule — the same "nothing is restated in two
// places" reason the analysis pages look their alt text up in this file.
const itemCount = (n) => `${n} item${n === 1 ? '' : 's'}`;

export const gallery = {
  eyebrow: 'Gallery',
  heading: 'Every view, in one place',
  intro:
    'Screenshots and video from the current release, plus the full set of walkthroughs recorded for the previous one. Pick a category, or open anything to see it full size.',

  // Category order is the order of the chips and of the grouped "All" view.
  //
  // Walkthroughs lead. They are the ONLY material in this section that exists
  // nowhere else on the page — every still in the other five categories has
  // already been shown by the About carousel, What's new or Collaboration —
  // and they are the site's only "how do I use this" content. The section now
  // sits after Install, which is exactly when that question gets asked.
  categories: [
    { id: 'tutorials', label: 'Walkthroughs' },
    { id: 'analyses', label: 'Analyses' },
    { id: 'panels', label: 'In-scene panels' },
    { id: 'guide', label: 'User guide' },
    { id: 'collaboration', label: 'Collaboration' },
    { id: 'immersive', label: 'VR and AR' },
  ],

  // The previous release is deliberately kept OUT of "All": it is reachable
  // only by choosing its own chip, so nobody meets a v1.1.0 screenshot by
  // accident and mistakes it for how the extension looks today.
  archive: {
    id: 'archive',
    label: 'v1.1.0 archive',
    badge: 'v1.1.0',
    note: 'Material from v1.1.0, kept for reference. The current release is v1.2.0, and everything above shows it.',
  },

  labels: {
    all: 'All',
    countSuffix: itemCount,
    viewAll: (n) => `View all ${n}`,
    openImage: 'Open screenshot',
    openVideo: 'Play video',
    close: 'Close',
    previous: 'Previous item',
    next: 'Next item',
    watchOnYouTube: 'Watch on YouTube',
    video: 'Video',
    counter: (position, total) => `${position} / ${total}`,

    // Spoken when a chip is pressed, and the only announcement on the site that
    // reports a QUANTITY — because a quantity is what the chips change and
    // nothing said out loud.
    //
    // The two-number form exists for the "All" view alone: it previews
    // PREVIEW_PER_CATEGORY tiles per category, so the figure the chips carry
    // (every item in every category) is not the figure on screen, and
    // announcing the chip's number would describe a grid the visitor does not
    // have. Everywhere else the two agree and the shorter sentence is used.
    filtered: (label, shown, total) =>
      shown === total
        ? `${label}: showing ${itemCount(shown)}.`
        : `${label}: showing ${shown} of ${itemCount(total)}.`,
  },

  // Editorial exclusions, kept as a list so re-including one is deleting a
  // line.
  //
  // The GIFs are here for weight: the four v1.2.0 demos are ~4 MB each
  // (16.8 MB together) and stream from YouTube in the Analyses category
  // anyway, and the v1.0.0 performance GIF is 19 MB on its own. That one now
  // lives in assets-src/releases/v1-1-0 (GIFs are served as-is, not thumbed),
  // so re-including it also means moving it back under public/.
  //
  // The two `ui/` shots are here for accuracy: they are the VS Code sidebar,
  // not an in-scene panel, so they do not belong in the category they were
  // filed under and do not belong in the gallery at all. The About carousel
  // excludes the same two.
  excluded: [
    'videos/normal/normal_analysis_demo.gif',
    'videos/dependency/dependency_analysis_demo.gif',
    'videos/historical/historical_comparison_demo.gif',
    'videos/project_evolution/project_evolution_demo.gif',
    'performance-v1.0.0.gif',
    'ui/new_active_servers.png',
    'ui/new_server_configuration.png',
  ],

  items: [
    // ---------------------------------------------------------------- Analyses
    {
      id: 'video-classic',
      kind: 'video',
      category: 'analyses',
      videoId: '76p1ibPaf3I',
      title: 'Classic analysis in XR',
      alt: 'The code city on the cyan table, one building per file',
      poster: 'analysis/xr/normal/normal.png',
    },
    {
      id: 'video-dependency',
      kind: 'video',
      category: 'analyses',
      videoId: '42hIQTUD0-g',
      title: 'Dependency graph in XR',
      alt: 'The dependency graph in the force-3d layout',
      poster: 'analysis/xr/dependency/dependency_force-3d.png',
    },
    {
      id: 'video-historical',
      kind: 'video',
      category: 'analyses',
      videoId: 'b37qDCQeZg0',
      title: 'Historical comparison in XR',
      alt: 'Two revisions of the same project side by side on one dual table',
      poster: 'analysis/xr/historical/historical_comparison.png',
    },
    {
      id: 'video-evolution',
      kind: 'video',
      category: 'analyses',
      videoId: 'QDN8tcKx60w',
      title: 'Project evolution in XR',
      alt: 'A frame of the evolution movie on the amber table',
      poster: 'analysis/xr/project_evolution/project_evolution.png',
    },
    {
      id: 'normal-city',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/normal/normal.png',
      title: 'Classic analysis',
      alt: 'Classic code city analysis: one building per file',
    },
    {
      id: 'dep-force',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_force-3d.png',
      title: 'Dependency graph, force-3d',
      alt: 'Dependency graph in the force-3d layout',
    },
    {
      id: 'dep-hierarchical',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_hierarchical.png',
      title: 'Dependency graph, hierarchical',
      alt: 'Dependency graph in the hierarchical layout',
    },
    {
      id: 'dep-metric-space',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_metric-space.png',
      title: 'Dependency graph, metric space',
      alt: 'Dependency graph in the metric-space layout, with real axes',
    },
    {
      id: 'dep-node-card',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_node_card.png',
      title: 'Pinned node card',
      alt: 'A pinned node card: fan-in, fan-out, degree, relations, cycle, lines and instability',
    },
    {
      id: 'dep-example',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_example.png',
      title: 'Dependencies of a real project',
      alt: 'The dependency graph of a real project',
    },
    {
      id: 'dep-example-groups',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/dependency/dependency_example_1.png',
      title: 'Group view, drilled in',
      alt: 'Dependency graph, group view drill-down',
    },
    {
      id: 'hist-dual-table',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/historical/historical_comparison.png',
      title: 'Two points in time, one table',
      alt: 'Historical comparison: two Git points on one dual table',
    },
    {
      id: 'hist-example',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/historical/historical_comparison_example.png',
      title: 'Comparison on a real repository',
      alt: 'Historical comparison on a real repository, each side labelled with its revision',
    },
    {
      id: 'evolution-movie',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/project_evolution/project_evolution.png',
      title: 'The history as a film',
      alt: 'Project evolution: replaying the Git history commit by commit',
    },
    {
      id: 'evolution-example',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/xr/project_evolution/project_evolution_example_1.png',
      title: 'A frame and its commit',
      alt: 'Project evolution timeline on a real repository, stamped with its commit and date',
    },
    {
      id: 'livepanel-file',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/live_panel/livepanel-file.png',
      title: 'LivePanel: a file',
      alt: 'LivePanel file analysis inside VS Code',
    },
    {
      id: 'livepanel-deps',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/live_panel/livepanel-deps.png',
      title: 'LivePanel: dependencies',
      alt: 'LivePanel dependency summary inside VS Code',
    },
    {
      id: 'livepanel-history',
      kind: 'image',
      category: 'analyses',
      file: 'analysis/live_panel/livepanel-history.png',
      title: 'LivePanel: history',
      alt: 'LivePanel 2D historical comparison inside VS Code',
    },

    // ---------------------------------------------------------- In-scene panels
    {
      id: 'panel-selector',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/analysis_selector/analysis_selector.png',
      title: 'Analysis selector',
      alt: 'In-scene analysis selector: four analyses on one table',
    },
    {
      id: 'panel-field-mapping',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/normal/codexr_field_mapping.png',
      title: 'Field Mapping',
      alt: 'Field mapping: any metric drives any visual channel',
    },
    {
      id: 'panel-dependency',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/dependency/dependency_controller.png',
      title: 'Dependency panel',
      alt: 'Dependency analysis controller panel',
    },
    {
      id: 'panel-historical',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/historical/historical_comparison_main.png',
      title: 'Comparison panel',
      alt: 'Historical comparison controller panel',
    },
    {
      id: 'panel-historical-mapping',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/historical/historical_comparison_field_mapping.png',
      title: 'Mapping, both sides at once',
      alt: 'Field mapping for the historical comparison',
    },
    {
      id: 'panel-evolution',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/project_evolution/project_evolution_controller.png',
      title: 'Evolution player',
      alt: 'Project evolution playback controller',
    },
    {
      id: 'panel-evolution-mapping',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/project_evolution/project_evolution_field_mapping.png',
      title: 'Mapping for the evolution',
      alt: 'Field mapping for project evolution',
    },
    {
      id: 'panel-virtual-screens',
      kind: 'image',
      category: 'panels',
      file: 'controllers/xr/new_virtual_screens_controllers/virtual_controller.png',
      title: 'Virtual screens controller',
      alt: 'Virtual screens controller',
    },
    {
      id: 'ui-servers',
      kind: 'image',
      category: 'panels',
      file: 'ui/new_active_servers.png',
      title: 'Sidebar: active servers',
      alt: 'Reorganized sidebar: active servers',
    },
    {
      id: 'ui-server-config',
      kind: 'image',
      category: 'panels',
      file: 'ui/new_server_configuration.png',
      title: 'Sidebar: server configuration',
      alt: 'Server configuration in the sidebar',
    },

    // -------------------------------------------------------------- User guide
    {
      id: 'guide-landing',
      kind: 'image',
      category: 'guide',
      file: 'guide/landing.png',
      title: 'The guide, in the room',
      alt: 'In-room user guide: landing tab',
    },
    {
      id: 'guide-tips',
      kind: 'image',
      category: 'guide',
      file: 'guide/tips.png',
      title: 'Tips',
      alt: 'User guide: tips tab',
    },
    {
      id: 'guide-html',
      kind: 'image',
      category: 'guide',
      file: 'guide/guide-html.png',
      title: 'The same guide in the browser',
      alt: 'The user guide served as guide.html in the browser',
    },
    {
      id: 'guide-normal',
      kind: 'image',
      category: 'guide',
      file: 'guide/normal_guide.png',
      title: 'Classic analysis, explained',
      alt: 'User guide: classic analysis walkthrough',
    },
    {
      id: 'guide-normal-data',
      kind: 'image',
      category: 'guide',
      file: 'guide/normal_data.png',
      title: 'Classic analysis: the metrics',
      alt: 'User guide: classic analysis metric glossary',
    },
    {
      id: 'guide-deps',
      kind: 'image',
      category: 'guide',
      file: 'guide/deps_guide.png',
      title: 'Dependencies, explained',
      alt: 'User guide: dependency analysis walkthrough',
    },
    {
      id: 'guide-deps-2',
      kind: 'image',
      category: 'guide',
      file: 'guide/deps_guide_2.png',
      title: 'Dependencies, second page',
      alt: 'User guide: dependency analysis, second page',
    },
    {
      id: 'guide-deps-data',
      kind: 'image',
      category: 'guide',
      file: 'guide/deps_data.png',
      title: 'Dependencies: the metrics',
      alt: 'User guide: dependency metric glossary',
    },
    {
      id: 'guide-history',
      kind: 'image',
      category: 'guide',
      file: 'guide/history_guide.png',
      title: 'Comparison, explained',
      alt: 'User guide: historical comparison walkthrough',
    },
    {
      id: 'guide-history-data',
      kind: 'image',
      category: 'guide',
      file: 'guide/history_data.png',
      title: 'Comparison: the metrics',
      alt: 'User guide: historical comparison glossary',
    },
    {
      id: 'guide-evolution',
      kind: 'image',
      category: 'guide',
      file: 'guide/evolution_guide.png',
      title: 'Evolution, explained',
      alt: 'User guide: project evolution walkthrough',
    },
    {
      id: 'guide-evolution-data',
      kind: 'image',
      category: 'guide',
      file: 'guide/evolution_data.png',
      title: 'Evolution: the metrics',
      alt: 'User guide: project evolution glossary',
    },

    // ----------------------------------------------------------- Collaboration
    {
      id: 'collab-panel',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/host_user/control_panel.png',
      title: 'Sharing the session',
      alt: 'The server panel with cross-network enabled and the trycloudflare address ready to share',
    },
    {
      id: 'collab-identity',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/invited_user/remote-join-identity.png',
      title: 'The guest picks a name',
      alt: 'The join page: continue as anonymous with a reserved alias, or choose a custom display name',
    },
    {
      id: 'collab-code',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/host_user/user_code.png',
      title: 'The six-digit code',
      alt: 'The VS Code notification with the temporary six-digit code and its Copy code button',
    },
    {
      id: 'collab-waiting',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/host_user/waiting_invited_user.png',
      title: 'A request waiting',
      alt: 'The sidebar while a request waits: Shared, one request waiting, and Generate new pairing code',
    },
    {
      id: 'collab-join-code',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/invited_user/remote-join-code.png',
      title: 'Typing the code',
      alt: 'The six-digit pairing field and the Connect button',
    },
    {
      id: 'collab-rejected',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/invited_user/remote-join-rejected.png',
      title: 'A burnt code',
      alt: 'The join page rejecting a code: the field is cleared and the code is burnt',
    },
    {
      id: 'collab-expired',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/invited_user/remote-join-expired.png',
      title: 'A dead invitation',
      alt: 'A dead invitation: expired or already used, so a new link is needed',
    },
    {
      id: 'collab-users',
      kind: 'image',
      category: 'collaboration',
      file: 'collaboration/host_user/control_host_users.png',
      title: 'Who is in the room',
      alt: 'Connected users: one local CodeXR participant and one remote browser guest, each with their colour',
    },

    // ------------------------------------------------------------- VR and AR
    {
      id: 'vr-table',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/vr-city-at-the-table.jpeg',
      title: 'The city on the table',
      alt: 'VR session: the code city on a table',
    },
    {
      id: 'vr-flying',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/vr-flying-over-the-city.jpeg',
      title: 'Flying over the codebase',
      alt: 'VR session: flying over the codebase skyline',
    },
    {
      id: 'vr-cockpit',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/vr-testing-cockpit.jpeg',
      title: 'The testing cockpit',
      alt: 'VR testing cockpit with the scene loaded',
    },
    {
      id: 'ar-development',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/ar-development.jpeg',
      title: 'AR while developing',
      alt: 'AR session during development',
    },
    {
      id: 'ar-legend',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/ar-hover-legend-passthrough.jpeg',
      title: 'Passthrough with the legend',
      alt: 'AR passthrough with the hover legend',
    },
    {
      id: 'ar-pedestal',
      kind: 'image',
      category: 'immersive',
      file: 'xr_experiences/ar-recentered-pedestal.jpeg',
      title: 'Recentring the pedestal',
      alt: 'AR session: the pedestal recentered in the room',
    },

    // ----------------------------------------------------------- Walkthroughs
    // Rescued from the previous site. They predate v1.2.0 but the workflows
    // they show are current, and they are the only recorded walkthroughs the
    // project has. No still of their own: they fall back to the shared poster.
    {
      id: 'tour-ui',
      kind: 'video',
      category: 'tutorials',
      videoId: 'KRgLdLZJXHA',
      title: 'Complete UI tour',
      alt: 'A full walkthrough of the Code-XR interface and its core workflows',
    },
    {
      id: 'tour-file-livepanel',
      kind: 'video',
      category: 'tutorials',
      videoId: 'n5ZcjlR4pPc',
      title: 'File analysis in LivePanel',
      alt: 'Analysing a single file in LivePanel, with its metrics and drill-downs',
    },
    {
      id: 'tour-file-xr',
      kind: 'video',
      category: 'tutorials',
      videoId: '38jGwFGORvc',
      title: 'File analysis in XR',
      alt: 'Navigating a single-file analysis inside the 3D scene',
    },
    {
      id: 'tour-directory-livepanel',
      kind: 'video',
      category: 'tutorials',
      videoId: 'sPWjcgV-gZQ',
      title: 'Directory analysis in LivePanel',
      alt: 'Inspecting directory-wide metrics in LivePanel',
    },
    {
      id: 'tour-directory-xr',
      kind: 'video',
      category: 'tutorials',
      videoId: 'TnfS2SevtWU',
      title: 'Directory analysis in XR',
      alt: 'Navigating directories in the immersive scene',
    },
    {
      id: 'tour-project',
      kind: 'video',
      category: 'tutorials',
      videoId: 'NluAHe3BQu8',
      title: 'Full project analysis',
      alt: 'A full project analysis, combining the LivePanel and XR perspectives',
    },
    {
      id: 'tour-dom',
      kind: 'video',
      category: 'tutorials',
      videoId: '110b-AergdU',
      title: 'HTML DOM visualization',
      alt: 'Visualising an HTML structure and inspecting its hierarchy',
    },
    {
      id: 'tour-ar',
      kind: 'video',
      category: 'tutorials',
      videoId: 'd7fojpP90Dk',
      title: 'Augmented reality',
      alt: 'Code-XR running in augmented reality, beyond the desktop',
    },

    // --------------------------------------------------------- v1.1.0 archive
    {
      id: 'old-video-file',
      kind: 'video',
      category: 'archive',
      videoId: 'j8dgZtmjNks',
      title: 'File XR workflow (v1.1.0)',
      alt: 'The v1.1.0 XR workflow for single-file analysis',
    },
    {
      id: 'old-video-directory',
      kind: 'video',
      category: 'archive',
      videoId: 'm6FHpENUvtU',
      title: 'Directory XR workflow (v1.1.0)',
      alt: 'The v1.1.0 project and directory XR workflow',
    },
    {
      id: 'old-scene-110',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'scene-v1.1.0.png',
      title: 'The v1.1.0 room',
      alt: 'The immersive room scene as it looked in v1.1.0',
    },
    {
      id: 'old-scene-100',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'scene-v1.0.0.png',
      title: 'The v1.0.0 stage',
      alt: 'The minimal stage the scene used in v1.0.0, before the room',
    },
    {
      id: 'old-performance',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'performance-v1.1.0.gif',
      title: 'v1.1.0 startup benchmark',
      alt: 'A same-analysis benchmark clip showing the faster v1.1.0 startup path',
    },
    {
      id: 'old-virtual-screen',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'virtual-screen-controller.png',
      title: 'Virtual screen controller (v1.1.0)',
      alt: 'The v1.1.0 controller for shared screen surfaces',
    },
    {
      id: 'old-pedestal',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'pedestal-mapping-ui.png',
      title: 'Pedestal and mapping UI (v1.1.0)',
      alt: 'The v1.1.0 pedestal layout and remapping panel',
    },
    {
      id: 'old-collaborative',
      kind: 'image',
      category: 'archive',
      release: RELEASE_PREVIOUS,
      file: 'collaborative-workspace.png',
      title: 'Collaborative workspace (v1.1.0)',
      alt: 'Presence markers in a v1.1.0 live session',
    },
  ],
};
