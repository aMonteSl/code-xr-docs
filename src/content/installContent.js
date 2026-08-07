// Install and first run, the two sections the previous site kept apart.
//
// The four steps keep the shape the old Quick Start Guide had, but their
// detail is rewritten from the v1.2.0 README, which is both current and far
// more concrete: it names the actual commands and the four directory modes.
// Anything the README does not say is not here — in particular nothing claims
// validation on physical headset hardware.
//
// Requirements deliberately live in the "Under the hood" section, not here:
// one home per fact. This section links to them instead.
export const install = {
  eyebrow: 'Install',
  heading: 'Install it, then run your first analysis',
  intro:
    'Three ways in, and a four-step first run. Nothing to configure to get a scene on screen: the Python environment and the local certificates are set up on first use.',

  requirementsHint: 'Check what you need before installing',
  requirementsHref: '#features',

  // Sits after the four-step quick start, which is deliberately the short
  // version: this is the hand-off to the long one, for the reader who has just
  // got a scene on screen and wants the rest of the sidebar and the room.
  tutorialHint: 'That was the short version. The complete walkthrough covers every panel of the sidebar and every piece of the XR room.',

  methods: {
    title: 'Install',
    recommended: 'Recommended',
    stepsLabel: 'Steps',
    copy: 'Copy the command',
    copied: 'Copied',
    items: [
      {
        id: 'marketplace',
        icon: 'package',
        title: 'VS Code Marketplace',
        description:
          'The normal route. Installs the latest published version and keeps it updated with the rest of your extensions.',
        recommended: true,
        steps: ['Open VS Code', 'Go to Extensions (Ctrl+Shift+X)', 'Search for "CodeXR"', 'Click Install, then restart VS Code'],
        cta: { text: 'Open in Marketplace', href: 'https://marketplace.visualstudio.com/items?itemName=aMonteSl.code-xr' },
      },
      {
        id: 'cli',
        icon: 'terminal',
        title: 'Command line',
        description: 'The same Marketplace build, installed from a terminal. Useful for scripted or repeatable setups.',
        command: 'code --install-extension aMonteSl.code-xr',
        steps: ['Open a terminal', 'Run the command', 'Restart VS Code', 'The extension is ready'],
      },
      {
        id: 'vsix',
        icon: 'download',
        title: 'Manual VSIX',
        description: 'Download the packaged extension from GitHub releases, for offline machines or to pin an exact version.',
        steps: ['Download the .vsix from releases', 'Open VS Code', 'Extensions, then Install from VSIX', 'Pick the downloaded file'],
        cta: { text: 'Download the VSIX', href: 'https://github.com/aMonteSl/CodeXR/releases' },
      },
    ],
  },

  quickStart: {
    title: 'Your first analysis',
    intro: 'Four steps from a fresh install to a workflow you can repeat.',
    totalTime: 'About 11 minutes in total',
    detailsTitle: 'What you will do',
    tipTitle: 'Tip',
    previous: 'Previous step',
    next: 'Next step',
    complete: 'Done',
    completed: 'Completed',
    goToStep: (n, title) => `Go to step ${n}: ${title}`,
    stepLabel: (n) => `Step ${n}`,
    minutes: (n) => `${n} min`,
    progressLabel: (title) => `Time spent on ${title}`,

    // Spoken when the READER changes step — the pills, the two arrows, the
    // arrow and number keys. Not when the clock advances on its own: that path
    // calls setCurrent directly and must keep doing so, or a visitor parked on
    // this section is interrupted every few minutes by a move they did not
    // make. See QuickStart's go(), and the wipe beside its setCurrent.
    //
    // Same sentence as collaboration.carousel.stepAnnouncement: two step
    // walkthroughs on one page should not describe themselves differently.
    stepAnnouncement: (position, total, title) => `Step ${position} of ${total}: ${title}.`,

    steps: [
      {
        id: 'install',
        icon: 'settings',
        title: 'Install and open',
        description: 'Get CodeXR into VS Code and let it prepare itself.',
        durationMinutes: 2,
        details: [
          'Install from the Marketplace and restart VS Code.',
          'On first use CodeXR creates its own isolated Python environment; you do not have to install anything for it.',
          'Local HTTPS certificates are generated on that first start and kept in the extension storage, which is what lets the immersive mode work later.',
        ],
        tip: 'Nothing needs configuring to get a first scene on screen. Leave the defaults until you have run one analysis.',
      },
      {
        id: 'analyse',
        icon: 'play',
        title: 'Analyse a file',
        description: 'Three routes into the same analysis, whichever fits how you work.',
        durationMinutes: 3,
        details: [
          'Right-click any file in the Explorer and pick "CodeXR: Analyze File (LivePanel)" for the metrics panel, or "(XR)" for the 3D scene. HTML files also offer "CodeXR: Visualize DOM".',
          'Or open the CodeXR tree view in the sidebar, expand Project Structure and click a file: it uses your preferred mode, and routes HTML straight to the DOM view.',
          'Or press Ctrl+Shift+P (Cmd+Shift+P on macOS) and type "CodeXR" to see every command available.',
        ],
        tip: 'Start with LivePanel on a single file. It stays inside VS Code, so you see the numbers before you deal with a browser window.',
      },
      {
        id: 'scale',
        icon: 'zap',
        title: 'Go wider, and watch it react',
        description: 'From one file to a directory or the whole project, updating as you edit.',
        durationMinutes: 5,
        details: [
          'Right-click a folder for "Analyze Directory (LivePanel)" or "(XR)", and their Deep variants when you want the subdirectories recursed too.',
          'Leave the scene open and keep editing: saving a file re-runs the analysis and the scene updates by itself.',
          'Use the Field Mapping panel inside the scene to put a different metric behind area, height or colour without starting over.',
        ],
        tip: 'Try the shallow directory mode first. It is the quickest way to see the shape of a project before recursing into everything.',
      },
      {
        id: 'manage',
        icon: 'search',
        title: 'Keep the session tidy',
        description: 'Manage what is running and come back to the same setup tomorrow.',
        durationMinutes: 1,
        details: [
          'The "Active Analyses" section of the tree view lists everything currently running; click one for its details, to reopen it in the browser, to export it or to close it.',
          'Closing analyses you are done with frees the resources they hold.',
          'If the Python environment ever needs attention, the sidebar has status, verification and reinitialization actions for it.',
        ],
        tip: 'Export an analysis folder when you want to keep a result or inspect it by hand: it copies the whole generated output wherever you choose.',
      },
    ],
  },
};
