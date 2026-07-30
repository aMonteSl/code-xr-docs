import { gallery } from '@/content/galleryContent';

// The four analysis detail pages, one URL each.
//
// SOURCES, because every fact here is checkable and none of it is invented:
//   - README.md (a byte-identical copy of the extension's own) for the prose
//     claims and the safety guarantees.
//   - public/dashboards/*/guideScreenRuntime.js — the guide the extension
//     itself renders, both on the in-room screen and as guide.html. Its
//     24-term glossary is the source for every definition below; its own header
//     says the definitions "mirror the real analysis contracts".
//   - The `availableCharts` config injected into each export's index.html, for
//     the chart list, their exact selector labels and the default mapping.
//   - dependencyGraphRuntime.js for the layouts, relation kinds and edge modes.
//
// Two naming traps worth knowing:
//   - "City" is NOT a chart. The default chart is `boats`, whose selector label
//     is "Babia Boats". The city is the metaphor for the scene, not a UI
//     string — copy may use the image, never the false name.
//   - The product calls the first analysis "Normal analysis" everywhere (guide
//     tab, mode selector, runtime); the README and this site call it "Classic".
//     Kept as "Classic" deliberately, matching the README and the home page.
//
// ACCURACY RULE, do not soften: v1.2.0 was validated on desktop browsers and
// emulated WebXR sessions, NOT on physical headsets. Nothing here may imply a
// headset was tested. Project Evolution is XR-only and has no LivePanel
// counterpart — see whatsNewContent's note on the same point.
//
// This module holds only what the home page does not already have. Title,
// description, bullets and videoId are read from `whatsNew.analyses` on the
// same `id`; the alt text is looked up in `galleryContent` by file path.

const byFile = new Map(gallery.items.filter((item) => item.file).map((item) => [item.file, item]));

// Throws rather than rendering a blank card: a typo in a path below would
// otherwise ship as a silently missing image.
const resolve = (file) => {
  const item = byFile.get(file);

  if (!item) {
    throw new Error(`analysisPagesContent: "${file}" is not in galleryContent items.`);
  }

  return { file, title: item.title, alt: item.alt };
};

// Slug for the group's in-page anchor. Derived from the label rather than
// hand-written beside it: the label is already the one human name for the
// group, and a second string would be one rename away from a nav link that
// scrolls nowhere. Uniqueness within a page is asserted at the bottom.
const slugify = (label) =>
  label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const group = (label, caption, files) => ({
  id: slugify(label),
  label,
  caption,
  images: files.map(resolve),
});

// Shared headings, so four pages cannot drift into four wordings.
const OVERVIEW_HEADING = 'How to read it';
const GLOSSARY_HEADING = 'What the numbers mean';

// Nav labels for the two blocks whose headings are too long for a bar that
// already carries six to eight entries. The overview heading is short enough
// to serve as its own. `specs` has a per-page heading, so it carries its own
// `navLabel` beside it.
const GLOSSARY_NAV = 'Metrics';
const GLOSSARY_INTRO =
  'These are the extension’s own definitions: the same glossary the in-room guide shows, generated from the real analysis contracts.';

// The link two sections of the home page use to reach the index. One home for
// the wording, because the same promise is made in two places.
export const ANALYSIS_INDEX_HREF = '/analysis/';
export const ANALYSIS_INDEX_LABEL = 'Meet the four analyses';

export const analysisPages = {
  eyebrow: 'Analysis',
  // The detail pages point back here now that it exists, rather than to the
  // release section they happen to be summarised in.
  backLabel: 'All four analyses',
  backHref: ANALYSIS_INDEX_HREF,
  watchLabel: 'Watch the demo',
  watchOnYouTube: 'Watch on YouTube',
  bridge: {
    text: 'That is one of the four analyses. They all come from the same extension, and the same install.',
    label: 'Install it and run it',
    href: '/#install',
  },
  lightbox: {
    close: 'Close expanded screenshot',
    previous: 'Previous screenshot',
    next: 'Next screenshot',
    expand: 'Open screenshot',
  },

  exploreLabel: (name) => `Explore ${name}`,

  // The other three, at the foot of every detail page. Before this, a detail
  // page's only way onward was back to the index, which funnelled every path
  // through one URL and asked a reader who had just finished one analysis to go
  // up a level to reach the next. Titles and summaries are read from the same
  // places the index uses, so this adds pointers, not facts.
  siblings: {
    heading: 'The other three analyses',
    intro: 'The same pedestal serves all four, and the controller switches between them without losing the state of any.',
    cardLabel: 'Read about it',
  },

  // The /analysis/ index: the four side by side, each card navigating to its
  // own page. It does not replace the four direct links in the release
  // section — those stay, and this is the way in for a reader who wants to
  // choose rather than scroll.
  index: {
    seoTitle: 'The four analyses | Code-XR',
    seoDescription:
      'Code-XR serves four analyses from one table in VS Code: the classic analysis, the dependency graph, historical comparison between two Git points, and project evolution as a film.',
    eyebrow: 'Analyses',
    heading: 'Four analyses, one table',
    intro:
      'The same pedestal serves all four, and you switch between them from inside the scene without losing the state of any of them. Each one answers a different question.',
    cardLabel: 'Read about it',
    bridge: {
      text: 'All four come from the same extension, and the same install.',
      label: 'Install it and run it',
      href: '/#install',
    },
  },

  pages: [
    {
      id: 'classic',
      slug: 'classic',
      name: 'the classic analysis',
      // Short noun for the BreadcrumbList leaf, and its own field because
      // nothing else here fits: `name` carries a leading "the" for the sentence
      // it is built into, `seoTitle` runs to a clause, and the title from
      // whatsNew is a full sentence with a colon. A breadcrumb that reads
      // "Classic analysis: change the chart without re-running it" is a
      // breadcrumb Google truncates.
      breadcrumb: 'Classic analysis',
      seoTitle: 'Classic analysis | Code-XR',
      seoDescription:
        'Walk your codebase as a 3D city inside VS Code: one mark per file across eight chart types, sized and coloured by the metrics you choose, updating as you save.',
      // One line for the index card. Deliberately its own copy rather than a
      // reuse of about.features: those ids (city, graph, compare, evolution)
      // do not match the analysis ids, and pairing them by position would be
      // one reorder away from silently mislabelling every card.
      summary: 'How big and how complex every file is, as a city you can walk around.',

      overview: {
        heading: OVERVIEW_HEADING,
        paragraphs: [
          'The classic analysis measures every file in the folder or project you pointed at, then puts one mark per file on the table. Two things decide what you end up looking at: the chart, which sets the geometry, and the field mapping, which decides what that geometry means.',
          'It opens on Babia Boats, the chart that produces the city. Area is the number of functions in the file, height is its total line count, and colour is its cyclomatic complexity. So a wide, tall, hot block is a long file with many functions and complicated code, and you can see it from across the room without reading a single number.',
          'It is live. Save a file in the editor and that file is re-analysed and the scene updates by itself, so the city keeps up with what you are doing rather than showing a snapshot you have to regenerate.',
        ],
        channelsTitle: 'What the default mapping shows',
        channels: [
          { term: 'Area', description: 'the number of functions in the file' },
          { term: 'Height', description: 'its total line count' },
          { term: 'Colour', description: 'its cyclomatic complexity' },
        ],
        note: {
          label: 'On large projects',
          body: 'the table shows the top files per metric rather than every file, so the scene stays readable instead of becoming a wall.',
        },
      },

      specs: {
        heading: 'Eight charts, one table',
        navLabel: 'Charts',
        intro:
          'The chart sets the geometry; the mapping sets the meaning. You swap either one live from the Field Mapping panel, from inside the scene, without losing the analysis.',
        items: [
          {
            term: 'Babia Boats',
            description:
              'The default, and the one that reads as a city: a block per file laid out on the table. Maps area, height and colour.',
          },
          {
            term: 'Bar Chart',
            description: 'One bar per file along a single axis. Maps an axis and height.',
          },
          {
            term: 'Barsmap Chart',
            description:
              'Bars across two axes, so a second field groups them into rows. Maps two axes and height.',
          },
          {
            term: 'Cyls Chart',
            description: 'Cylinders rather than bars, which adds radius as a third channel.',
          },
          {
            term: 'Cylsmap Chart',
            description: 'Cylinders across two axes with radius, the densest of the linear charts.',
          },
          {
            term: 'Bubbles Chart',
            description:
              'Spheres placed on two axes, with height and radius. The one for spotting outliers.',
          },
          {
            term: 'Pie Chart',
            description: 'How one metric divides across the files. Maps a key and a size.',
          },
          { term: 'Donut Chart', description: 'The same proportions as the pie, centre left open.' },
        ],
      },

      glossary: {
        heading: GLOSSARY_HEADING,
        intro: GLOSSARY_INTRO,
        items: [
          {
            term: 'Total and code lines',
            description:
              'Every line in the file, and the subset that is actual code rather than comments or blanks.',
          },
          { term: 'Comment ratio', description: 'Comment lines divided by total lines.' },
          { term: 'Function count', description: 'How many functions were detected in the file.' },
          {
            term: 'Complexity (CCN)',
            description:
              'Cyclomatic complexity: the number of independent decision paths through a function.',
          },
          {
            term: 'Complexity bands',
            description: 'A CCN above 10 counts as high, and above 25 as critical.',
          },
          {
            term: 'Max complexity',
            description: 'The highest CCN among the functions in the file.',
          },
          {
            term: 'Parameters',
            description:
              'The arguments in a function signature, reported as an average and a maximum.',
          },
          {
            term: 'Nesting depth',
            description: 'How deeply loops and branches are stacked inside a function.',
          },
        ],
      },

      groups: [
        group('The scene', 'One building per file, on the table you walk around.', [
          'analysis/xr/normal/normal.png',
        ]),
        group(
          'The controller',
          'Field Mapping picks the chart, then the metric behind area, height and colour.',
          ['controllers/xr/normal/codexr_field_mapping.png']
        ),
        group('Inside VS Code', 'The same analysis as a 2D panel, without leaving the editor.', [
          'analysis/live_panel/livepanel-file.png',
        ]),
        group('The in-room guide', 'What you are looking at, explained without taking the headset off.', [
          'guide/normal_guide.png',
          'guide/normal_data.png',
        ]),
      ],
    },

    {
      id: 'dependency',
      slug: 'dependency-graph',
      name: 'the dependency graph',
      breadcrumb: 'Dependency graph',
      seoTitle: 'Dependency graph in 3D | Code-XR',
      seoDescription:
        'See what depends on what as a navigable 3D graph in VS Code: three layouts, seven relation kinds, fan-in and fan-out, cycles and instability, extracted statically from your working directory.',
      summary: 'What depends on what, and what a change will touch before you make it.',

      overview: {
        heading: OVERVIEW_HEADING,
        paragraphs: [
          'The dependency graph answers a different question from the other three: not how big or how complex a file is, but what depends on what, and what happens if you touch it. The relations are extracted statically from your working directory, so nothing has to run.',
          'Nodes are files, folders and symbols; edges are the relations between them. The shape of a node tells you what it is: a sphere is a function, a cylinder a method, a pyramid a class, a diamond an interface and a box a folder. Click any node to pin its card and read its coupling, its cycle and how much depends on it; click again to release it.',
          'Unlike the other analyses this is not a chart you swap. It is one graph you look at three ways, and the layout is the thing you change. External packages collapse into a single portal so they do not crowd your own code, and large projects open grouped so you drill down into folders rather than meeting every node at once.',
        ],
        channelsTitle: 'What you can map onto a node',
        channels: [
          { term: 'Size', description: 'the metric that scales each node' },
          { term: 'Height', description: 'the metric that raises it above the table' },
          { term: 'Colour', description: 'a metric, or the node’s language' },
          {
            term: 'Position',
            description: 'X and Z, available only in the metric-space layout, where the axes are real',
          },
        ],
        note: {
          label: 'Why it is worth the detour',
          body: 'this is the analysis that shows you what a change will touch before you make it, which is exactly what a list of files cannot do.',
        },
      },

      specs: {
        heading: 'Three layouts, and how the edges are drawn',
        navLabel: 'Layouts',
        intro:
          'The layout decides where nodes sit. The edge mode decides what the lines between them are telling you.',
        items: [
          {
            term: 'force-3d',
            description:
              'A spatial layout: connected nodes pull towards each other, so clusters emerge on their own.',
          },
          {
            term: 'hierarchical',
            description: 'Nodes arranged by dependency level, so the direction of flow is readable.',
          },
          {
            term: 'metric-space',
            description:
              'Real axes: X and Z become metrics you choose, so a node’s position itself carries meaning.',
          },
          {
            term: 'Relation type',
            description:
              'Edge colour identifies the kind of relation: import, include, require, inheritance, implementation, call or contains. Width stays constant.',
          },
          {
            term: 'Intensity color',
            description: 'Edge colour encodes how often the relation occurs instead.',
          },
          {
            term: 'Intensity width',
            description:
              'Edge width encodes occurrences, while colour still identifies the relation kind.',
          },
          {
            term: 'Color + width',
            description: 'Both channels encode how often the relation occurs.',
          },
        ],
      },

      glossary: {
        heading: GLOSSARY_HEADING,
        intro: GLOSSARY_INTRO,
        items: [
          {
            term: 'Fan-in',
            description: 'Incoming: how many files depend on this one.',
          },
          { term: 'Fan-out', description: 'Outgoing: how many files this one depends on.' },
          {
            term: 'Degree',
            description: 'Fan-in plus fan-out: the node’s total number of connections.',
          },
          { term: 'Relations', description: 'The individual relations, counting duplicates.' },
          {
            term: 'Cycle',
            description:
              'The size of the circular-dependency group this node belongs to. Zero means it is in none.',
          },
          {
            term: 'Instability',
            description:
              'Fan-out divided by degree. Zero is a stable core that others depend on; one is an unstable leaf that depends on others.',
          },
          {
            term: 'Confidence',
            description: 'Drawn as edge opacity: exact, probable or ambiguous.',
          },
          {
            term: 'Occurrences',
            description: 'Drawn as edge intensity: how often the relation repeats.',
          },
        ],
      },

      groups: [
        group('The three layouts', 'Force-3d, hierarchical, and metric-space with real axes.', [
          'analysis/xr/dependency/dependency_force-3d.png',
          'analysis/xr/dependency/dependency_hierarchical.png',
          'analysis/xr/dependency/dependency_metric-space.png',
        ]),
        group('Reading a node', 'Click one to pin its card; big projects open grouped and you drill in.', [
          'analysis/xr/dependency/dependency_node_card.png',
          'analysis/xr/dependency/dependency_example.png',
          'analysis/xr/dependency/dependency_example_1.png',
        ]),
        group('The controller', 'Layout selector, metric mapping, relation filters and flow controls.', [
          'controllers/xr/dependency/dependency_controller.png',
        ]),
        group('Inside VS Code', 'Counters, top fan-in and fan-out, and cycles, as a 2D panel.', [
          'analysis/live_panel/livepanel-deps.png',
        ]),
        group('The in-room guide', 'Two pages plus the metric glossary, in the colour of this analysis.', [
          'guide/deps_guide.png',
          'guide/deps_guide_2.png',
          'guide/deps_data.png',
        ]),
      ],
    },

    {
      id: 'historical',
      slug: 'historical-comparison',
      name: 'historical comparison',
      breadcrumb: 'Historical comparison',
      seoTitle: 'Compare two points of your Git history | Code-XR',
      seoDescription:
        'Put two revisions of your project on one dual table in VS Code, with the same chart, the same mapping and the same scale, so a height difference is a real difference. Never runs checkout or fetch.',
      summary: 'What changed between two points of your Git history, side by side.',

      overview: {
        heading: OVERVIEW_HEADING,
        paragraphs: [
          'Pick two sources: your working copy, a branch, a tag or a commit. Both states land on one dual table, side by side, each labelled with its revision and date.',
          'The whole design rests on one decision: both sides get the same chart, the same mapping and the same scale. That is what makes the comparison honest. If one side is taller, it is taller because the metric is larger, not because the two halves were scaled independently. A comparison card alongside reports how many files were added, removed and modified, plus the delta per metric.',
          'The chart is yours to choose, the same eight the classic analysis offers, and whatever you pick is applied to both sides at once. Reading it is safe by construction: it never runs checkout or fetch and never writes inside .git, so your branch, your index and your files stay exactly where you left them.',
        ],
        channelsTitle: 'What makes the comparison honest',
        channels: [
          { term: 'Same chart', description: 'both revisions render with the same geometry' },
          {
            term: 'Same mapping',
            description: 'the same metric drives the same channel on each side',
          },
          {
            term: 'Same scale',
            description: 'so a height difference is a real difference, not an artefact',
          },
        ],
        note: {
          label: 'Read-only by design',
          body: 'it talks to your local git, so it behaves the same whether the remote is GitHub, GitLab, Bitbucket or self-hosted, and it never writes to any of them.',
        },
      },

      specs: {
        heading: 'What you can compare against',
        navLabel: 'Sources',
        intro:
          'Any two of these can go on the left and the right, and the comparison is recomputed live as you save.',
        items: [
          {
            term: 'Working copy',
            description: 'Your current files, including edits you have not committed.',
          },
          { term: 'Branch', description: 'The tip of any branch your local repository knows about.' },
          { term: 'Tag', description: 'Any tag, the usual way to pin a released version.' },
          { term: 'Commit', description: 'An exact commit, picked from the panel’s filtered list.' },
        ],
      },

      glossary: {
        heading: GLOSSARY_HEADING,
        intro: GLOSSARY_INTRO,
        items: [
          {
            term: 'Reference',
            description: 'The branch, tag or commit you are comparing against.',
          },
          {
            term: 'Working copy',
            description: 'Your current files, including unsaved edits.',
          },
          { term: 'Delta', description: 'The new value minus the old one, for each metric.' },
          {
            term: 'Compared metrics',
            description: 'Lines, functions and complexity: the same set the classic analysis uses.',
          },
        ],
      },

      groups: [
        group('The dual table', 'Two revisions side by side, on one shared scale.', [
          'analysis/xr/historical/historical_comparison.png',
          'analysis/xr/historical/historical_comparison_example.png',
        ]),
        group('The controller', 'The two source slots, the filters, and mapping applied to both sides at once.', [
          'controllers/xr/historical/historical_comparison_main.png',
          'controllers/xr/historical/historical_comparison_field_mapping.png',
        ]),
        group('Inside VS Code', 'The same comparison as a searchable table of per-item deltas.', [
          'analysis/live_panel/livepanel-history.png',
        ]),
        group('The in-room guide', 'The walkthrough and the metric glossary for the comparison.', [
          'guide/history_guide.png',
          'guide/history_data.png',
        ]),
      ],
    },

    {
      id: 'evolution',
      slug: 'project-evolution',
      name: 'project evolution',
      breadcrumb: 'Project Evolution',
      seoTitle: 'Replay your Git history in 3D | Code-XR',
      seoDescription:
        'Project Evolution plays your repository as a film: the chart walks the history commit by commit, every frame a full analysis stamped with its commit and date.',
      summary: 'Your whole Git history as a film, commit by commit.',

      overview: {
        heading: OVERVIEW_HEADING,
        paragraphs: [
          'Where the comparison shows you two photographs, Project Evolution plays the movie. The chart walks your repository’s own history commit by commit, from the first revision to the current state of the branch, and you watch the shape of the project change.',
          'Every frame is a full analysis, stamped with the commit and the date it belongs to. Nothing is interpolated between commits: what you see at any point on the timeline is what the code actually measured then. Each frame also keeps your current chart mapping, so whatever you set up in the classic analysis carries straight over into the film.',
          'You build the timeline first, then play it: play, pause, step a frame at a time, change the speed, or jump anywhere. It is the analysis for questions no single snapshot answers: when complexity started climbing, which directory grew fastest, whether a refactor actually shrank anything.',
        ],
        channelsTitle: 'Three ways to build the timeline',
        channels: [
          {
            term: 'Auto',
            description: 'commits sampled evenly in time, favouring merges and tags',
          },
          { term: 'Range', description: 'you choose the span of history to walk' },
          { term: 'Manual', description: 'you pick exactly the commits you want' },
        ],
        note: {
          label: 'XR only',
          body: 'Project Evolution runs in the XR scene. Unlike the file, dependency and history analyses, it has no 2D LivePanel counterpart.',
        },
      },

      specs: {
        heading: 'What the player gives you',
        navLabel: 'The player',
        intro:
          'The controls sit on a panel inside the scene, next to the table the film plays on.',
        items: [
          {
            term: 'Timeline modes',
            description: 'Auto, Range and Manual: how the frames get chosen in the first place.',
          },
          {
            term: 'The frame list',
            description: 'Every frame in the built timeline, so you can see and jump to any of them.',
          },
          {
            term: 'Generate movie',
            description: 'Builds the timeline into a film before you play it.',
          },
          {
            term: 'Transport',
            description: 'Play, pause and step, plus seeking anywhere along the timeline.',
          },
          {
            term: 'Playback speed',
            description: 'How fast the history runs, adjustable while it plays.',
          },
        ],
      },

      glossary: {
        heading: GLOSSARY_HEADING,
        intro: GLOSSARY_INTRO,
        items: [
          { term: 'Frame', description: 'One commit, rendered as a full analysis scene.' },
          {
            term: 'Timeline',
            description: 'Auto picks the commits for you; range and manual are yours.',
          },
          {
            term: 'Frame data',
            description: 'The directory metrics, recomputed for each commit in the timeline.',
          },
          { term: 'Playback', description: 'Play, pause and seek, at an adjustable speed.' },
        ],
      },

      groups: [
        group('The film', 'Every frame is a full analysis, stamped with the commit it belongs to.', [
          'analysis/xr/project_evolution/project_evolution.png',
          'analysis/xr/project_evolution/project_evolution_example_1.png',
        ]),
        group('The controller', 'Timeline modes, the frame list, transport buttons and playback speeds.', [
          'controllers/xr/project_evolution/project_evolution_controller.png',
          'controllers/xr/project_evolution/project_evolution_field_mapping.png',
        ]),
        group('The in-room guide', 'The walkthrough and the metric glossary for the evolution.', [
          'guide/evolution_guide.png',
          'guide/evolution_data.png',
        ]),
      ],
    },
  ],
};

// The navbar's section list for each detail page, attached ONCE here rather
// than built in the component.
//
// That is load-bearing, not tidiness. useActiveSection keys its effect on the
// ids array, so a list rebuilt on every render would tear down and re-subscribe
// its scroll listener on every render — the exact trap the home page avoids by
// keeping SECTION_IDS at module scope. Computed here, `page.sections` is the
// same reference for the life of the module.
//
// The ids are the anchors AnalysisPage puts on the sections; the labels are
// what the bar shows. Both live here so a section cannot be renamed in one
// place and linked from the other.
for (const page of analysisPages.pages) {
  const sections = [
    { id: 'overview', label: page.overview.heading },
    { id: 'specs', label: page.specs.navLabel },
    { id: 'glossary', label: GLOSSARY_NAV },
    ...page.groups.map((item) => ({ id: item.id, label: item.label })),
  ];

  const ids = sections.map((section) => section.id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);

  // Two groups whose labels slugify the same would give two sections one
  // anchor, and every link to it would land on the first. Caught at import,
  // like the missing-image check above, rather than shipping silently.
  if (duplicate) {
    throw new Error(`analysisPagesContent: "${page.slug}" has two sections with id "${duplicate}".`);
  }

  page.sections = sections;
  page.sectionIds = ids;
}

// For scripts/build-analysis-pages.mjs, which reads this module through Vite's
// SSR loader (the `@/` import above cannot be resolved by bare Node).
//
// vite.config.js deliberately does NOT import this: it is the file that defines
// the `@/` alias, so it cannot use it. It globs the generated entry HTML off
// disk instead, which makes the generator the single source and the config a
// follower.
export const ANALYSIS_SLUGS = analysisPages.pages.map((page) => page.slug);
