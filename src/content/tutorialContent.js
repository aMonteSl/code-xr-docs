// The deep tutorial: the whole extension, sidebar first and then the XR room.
//
// SOURCES. Every claim is checkable and none of it is invented:
//   - the author's own walkthrough script for the 12-minute video, which is
//     what this page is the written form of,
//   - README.md (a byte-identical copy of the extension's) for the settings
//     names, the cross-network defaults and the safety guarantees,
//   - media/SHOTLIST.md in the extension repo for which screenshots exist.
//
// WHAT THIS PAGE DELIBERATELY DOES NOT DO: re-explain the four analyses. They
// have a detail page each under /analysis/<slug>/ with more depth than a
// tutorial can carry (the metric glossary, the eight charts, the three
// layouts). Steps 9 to 12 of the script are therefore one closing hand-off,
// which is how the script itself ends ("Deep dives, one per analysis"). Do not
// grow them back here: that would be a third home for the same facts.
//
// ACCURACY RULE, do not soften: v1.2.0 was validated on desktop browsers and
// emulated WebXR sessions, NOT on physical headsets. Nothing here may imply a
// headset was tested.
//
// Cross-network is ON by default as of the 2026-07-30 README. It used to be
// opt-in and five places on this site said so; see the note in
// collaborationContent.js and do not reintroduce that claim.
//
// `file` paths are relative to public/assets/releases/v1-2-0 and are resolved
// through getReleaseImageSources. Alt text is written per step rather than read
// out of galleryContent: the same screenshot answers a different question here
// than it does in a gallery tile, which is exactly what alt text is for.
// aboutContent does the same for the carousel.
//
// The whole of "Setting up" (steps 1 to 4) runs as TEXT, on purpose. The two
// ui/ sidebar screenshots that used to illustrate steps 1 and 2 were dropped by
// the author's call: they are tight crops of small dialogs (366x203 and
// 887x336), so in a figure slot they either sat tiny or were upscaled into
// blur, and the settings they show are already named in the lists beside them.
// Do not put them back without a wider retake. The room half keeps its
// screenshots, which are full scenes and hold up at any width.
export const TUTORIAL_HREF = '/tutorial/';
export const TUTORIAL_LABEL = 'Watch the full tutorial';

// The video, in one place. The id is also in README.md and in the extension
// repo's media/v1.2.0/videos/VIDEOS.md, which is the upstream source of truth
// for every YouTube id; a re-recording changes it there and here.
export const TUTORIAL_VIDEO = {
  id: 'dtvFhUQ1uKY',
  title: 'Getting started with CodeXR: the complete tutorial',
  durationLabel: '12 minutes',
  // ISO 8601, for the VideoObject the prerender injects. 12:24.
  duration: 'PT12M24S',
  uploadDate: '2026-07-30',
  posterFile: 'hero.png',
  posterAlt:
    'The CodeXR room: the pedestal table with an analysis on it, two avatars, the guide screen and a shared virtual screen',
};

export const tutorial = {
  // ---------------------------------------------------------------- The page
  seoTitle: 'Getting started with CodeXR | Tutorial',
  seoDescription:
    'A complete walkthrough of the CodeXR extension for VS Code: configure the servers, set your analysis defaults, run your first analysis, and find your way around the four analyses inside the XR room.',

  eyebrow: 'Tutorial',
  heading: 'Getting started with CodeXR',
  intro:
    'A complete walkthrough of the extension, from the Visual Studio Code sidebar to the four analyses inside the XR room. The video covers exactly these steps in twelve minutes; everything below is the same tour in writing.',

  watchLabel: 'Watch on YouTube',
  playLabel: 'Play the tutorial',

  // The two halves, used as the page's own signposts and as the outline on the
  // home section. Steps 1 to 4 are the sidebar, 5 to 12 the XR experience, so
  // they split here naturally.
  parts: [
    {
      id: 'setting-up',
      label: 'Setting up',
      caption: 'The sidebar, top to bottom: servers, identity, analysis defaults and environment.',
    },
    {
      id: 'inside-the-room',
      label: 'Inside the room',
      caption: 'Your first analysis, then the furniture every scene shares: screens, guide, controller.',
    },
  ],

  // -------------------------------------------------------- What CodeXR does
  what: {
    id: 'what-it-does',
    heading: 'What CodeXR does',
    paragraphs: [
      'CodeXR is a Visual Studio Code extension that turns your codebase into something you can walk through. It gives you four ways to look at the same project.',
      'Everything runs on your machine and opens in the browser you already have. A VR headset is optional: with one, the same scene becomes fully immersive.',
    ],
    items: [
      {
        term: 'Classic analysis',
        description: 'Your files as a 3D city, sized and coloured by their metrics.',
      },
      {
        term: 'Dependency graph',
        description: 'What depends on what, as a navigable graph.',
      },
      {
        term: 'Historical comparison',
        description: 'Two points of your Git history, side by side on one table.',
      },
      {
        term: 'Project Evolution',
        description: 'Your whole history replayed as a film, commit by commit.',
      },
    ],
  },

  // ---------------------------------------------------------------- The steps
  // `part` groups them under the two signposts above. `images` is optional:
  // steps 3 and 4 have no screenshot in the extension repo's media inventory
  // (SHOTLIST.md lists only the two ui/ shots), so they run as text. If those
  // are ever captured, adding them here is the whole change.
  steps: [
    {
      id: 'configure-servers',
      part: 'setting-up',
      number: 1,
      title: 'Configure your servers',
      lead: 'The sidebar reads top to bottom, and Servers is where you decide how CodeXR serves its scenes.',
      items: [
        {
          term: 'Protocol',
          description:
            'HTTPS with generated local certificates, HTTPS with your own, or plain HTTP for development. VR headsets require HTTPS: WebXR will not start over an insecure connection.',
        },
        {
          term: 'Default port',
          description: 'The port new servers use.',
        },
        {
          term: 'Auto-open and open mode',
          description:
            'Whether a server opens automatically when it launches, and whether it opens in your browser or in a side panel inside VS Code.',
        },
        {
          term: 'Cross-network connections',
          description:
            'Enabled by default, so every server you start opens a secure outbound tunnel through Cloudflare. The first time, CodeXR asks permission to download cloudflared, exactly once. Decline and the feature turns itself off; re-enable it here whenever you want and it will ask again.',
        },
      ],
    },
    {
      id: 'active-servers',
      part: 'setting-up',
      number: 2,
      title: 'Manage active servers and your identity',
      lead: 'Active Servers has two parts: Collaboration, where you say who you are, and the list of what is running.',
      paragraphs: [
        'Collaboration is where you set up how you join others. Paste an invitation link to enter a session someone shared with you, choose your display name (stay anonymous with the alias CodeXR reserves for you, or set your own), pick your avatar colour and enable the 3D avatar models.',
      ],
      items: [
        {
          term: 'Local network address',
          description: 'For devices on your own wifi, a headset included.',
        },
        {
          term: 'Cross-network invitation link',
          description:
            'Ready to copy and send, so several people can work inside the same instance. Guests never enter with the link alone: they also need a six-digit code that only you can give them.',
        },
        {
          term: 'Server controls',
          description: 'Open in browser, server information, stop.',
        },
      ],
    },
    {
      id: 'analysis-defaults',
      part: 'setting-up',
      number: 3,
      title: 'Set your analysis defaults',
      lead: 'Analysis is the most important section. At the top are your active analyses: click any of them for its details, to open it in the browser, to export it or to close it. Below that, the settings.',
      items: [
        {
          term: 'Default analysis type',
          description: 'One for files and one for directories.',
        },
        {
          term: 'LivePanel theme',
          description: 'How the 2D panels look inside VS Code.',
        },
        {
          term: 'Default chart type',
          description:
            'For the XR experiences, separately for files and directories. This is mainly what shapes the classic analysis.',
        },
        {
          term: 'Default field mapping',
          description: 'Which metric drives each dimension of the chart.',
        },
        {
          term: 'Debounce and automatic re-analysis',
          description:
            'How quickly a save triggers a re-analysis, tuned for real time by default, with automatic re-analysis on.',
        },
        {
          term: 'Sorting filters',
          description: 'For the Language and Project Structure trees.',
        },
        {
          term: 'Configuration profiles',
          description: 'So each project can keep its own setup.',
        },
      ],
      paragraphs: [
        'Two smaller sections sit nearby: Babia Examples, a homage to BabiaXR with ready-made examples, and Visualize Data, a legacy tool that renders any JSON with Babia charts.',
      ],
    },
    {
      id: 'environment',
      part: 'setting-up',
      number: 4,
      title: 'Check your environment and find help',
      lead: 'The last three blocks are the ones you should rarely need.',
      items: [
        {
          term: 'Python Environment',
          description:
            'Whether Python and the analysis dependencies are correctly installed. CodeXR manages its own isolated environment, so normally you never touch this.',
        },
        {
          term: 'Visualization Settings',
          description: 'How the scenes look, with a one-click reset.',
        },
        {
          term: 'Learn More and Support',
          description: 'The documentation, a little about the creator, and a way to support the project.',
        },
      ],
    },
    {
      id: 'first-analysis',
      part: 'inside-the-room',
      number: 5,
      title: 'Run your first analysis',
      lead: 'Right-click a folder and launch a project analysis in deep mode. CodeXR walks the entire codebase, every file and every function, then serves the scene locally and opens it in your browser.',
    },
    {
      id: 'bearings',
      part: 'inside-the-room',
      number: 6,
      title: 'Get your bearings in the room',
      lead: 'Every analysis lives in a room with a handful of recurring pieces, and they are in the same place every time.',
      items: [
        {
          term: 'The people',
          description:
            'Everyone connected appears as an avatar with their name floating above, each in their own colour.',
        },
        {
          term: 'The virtual screens',
          description: 'With their own panel to manage them.',
        },
        {
          term: 'The table',
          description:
            'Also called the pedestal: where the data itself is rendered, with its controller on the corner closest to you.',
        },
        {
          term: 'The guide screen',
          description: 'Always within reach.',
        },
      ],
      images: [
        {
          file: 'hero.png',
          title: 'The room, in one frame',
          alt: 'The CodeXR room: the pedestal with the dependency graph, two avatars with name tags, the guide screen, a shared virtual screen and the controller',
        },
      ],
    },
    {
      id: 'screens-and-guide',
      part: 'inside-the-room',
      number: 7,
      title: 'Use the screens and the guide',
      lead: 'Create as many virtual screens as you need. Drag them, reposition them, resize them from the corners.',
      paragraphs: [
        'You can share content on them: whatever you broadcast is seen in real time by everyone else in the session, including guests connected from another network.',
        'The guide screen is built in. Colour-coded tabs explain every analysis and include a glossary of every metric, so the answer to "what am I looking at" never requires leaving the room.',
      ],
      images: [
        {
          file: 'controllers/xr/new_virtual_screens_controllers/virtual_controller.png',
          title: 'The virtual screens panel',
          alt: 'The virtual screen chrome and the Virtual screens panel that manages them',
        },
        {
          file: 'guide/landing.png',
          title: 'The guide, in the room',
          alt: 'The in-room guide screen open on its Start tab',
        },
        {
          file: 'guide/tips.png',
          title: 'The Tips tab',
          alt: 'The in-room guide open on its Tips tab',
        },
      ],
    },
    {
      id: 'the-controller',
      part: 'inside-the-room',
      number: 8,
      title: 'Meet the controller',
      lead: 'On the corner of the table closest to you there is always a controller. It drives everything: the visualizations of the four analysis types, their settings, and the switch between them.',
      paragraphs: [
        'Each mode keeps its own state, so moving between analyses never resets what you were doing.',
      ],
      images: [
        {
          file: 'controllers/xr/analysis_selector/analysis_selector.png',
          title: 'The analysis selector',
          alt: 'The Visualization mode panel with the four colour-coded analyses on it',
        },
      ],
    },
  ],

  // ------------------------------------------------- The hand-off to /analysis/
  // Steps 9 to 12 of the script live here, as four pointers rather than four
  // rewritten explanations. Titles and summaries are read from
  // analysisPagesContent, so this restates nothing.
  analyses: {
    id: 'the-four-analyses',
    heading: 'Then read the analysis you need',
    intro:
      'That is the whole tour of the room. What is left is the four analyses themselves, and each one has a page of its own: what it represents, what you can read off it, every chart or layout it offers, and what each number means.',
    cardLabel: 'Read about it',
  },

  next: {
    id: 'where-next',
    heading: 'Where to go next',
    items: [
      {
        term: 'Tried on real codebases',
        description: 'BabiaXR, Express and JetUML, each toured through all four analyses.',
      },
      {
        term: 'Install it',
        description: 'From the VS Code Marketplace, the command line, or a VSIX you download.',
      },
      {
        term: 'Read the source',
        description: 'The extension is GPL-3.0 and developed in the open on GitHub.',
      },
    ],
    note: 'No telemetry, no account, and nothing is downloaded without asking you first.',
  },

  bridge: {
    text: 'Everything here comes from one extension, and one install.',
    label: 'Install it and run it',
    href: '/#install',
  },

  backLabel: 'Back to the home page',
  backHref: '/',

  lightbox: {
    expand: 'Open screenshot',
    close: 'Close expanded screenshot',
    previous: 'Previous screenshot',
    next: 'Next screenshot',
  },

  // ------------------------------------------------------ The home page teaser
  // The section between Install and Gallery. Short on purpose: it exists to
  // surface the video and point at the page, not to summarise it twice.
  home: {
    eyebrow: 'Tutorial',
    heading: 'The whole extension, in twelve minutes',
    // No "the section above/below": this block sits high on the page now and
    // would have to be rewritten again the next time the order changes.
    intro:
      'The complete tour, from the Visual Studio Code sidebar to the four analyses inside the XR room. Watch it, or read the same walkthrough step by step.',
    outlineTitle: 'What it covers',
    bridge: {
      text: 'The written version carries the same twelve steps, with the screenshots beside each one.',
      label: 'Read the full tutorial',
      href: TUTORIAL_HREF,
    },
  },
};

// The navbar's section list for this page, built ONCE at module scope.
//
// Not optional: useActiveSection keys its effect on the ids array, so a list
// rebuilt per render would re-subscribe its scroll listener on every render.
// Same reason as SECTION_IDS on the home and the loop at the bottom of
// analysisPagesContent.js.
//
// The steps are NOT listed individually: twelve entries would double the
// longest bar on the site. The two parts are the signposts a reader actually
// navigates by, which is also how the page is laid out.
export const tutorialSections = [
  { id: tutorial.what.id, label: 'What it does' },
  ...tutorial.parts.map((part) => ({ id: part.id, label: part.label })),
  { id: tutorial.analyses.id, label: 'The four analyses' },
  { id: tutorial.next.id, label: 'Where next' },
];

export const tutorialSectionIds = tutorialSections.map((section) => section.id);

// Every step must belong to a declared part, or it would render outside both
// signposts and its anchor would point at nothing. Checked at import, like the
// image-path resolution in analysisPagesContent.
const partIds = new Set(tutorial.parts.map((part) => part.id));

for (const step of tutorial.steps) {
  if (!partIds.has(step.part)) {
    throw new Error(`tutorialContent: step "${step.id}" has unknown part "${step.part}".`);
  }
}
