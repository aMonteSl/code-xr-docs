// All hero copy. Nothing user-facing may be inlined in the section's JSX.
export const hero = {
  title: {
    // The brand is the <h1>, split so "XR" can carry the accent colour —
    // echoing the mark, where the X and the R are separate paths.
    brandLead: 'Code-',
    brandAccent: 'XR',
    // Subtitle under the brand: the official one-liner from the README.
    tagline: 'Code analysis you can walk through',
  },

  // Shown once, statically, to screen readers in place of the rotating lines.
  // The rotator itself is aria-hidden: a live region re-announcing every five
  // seconds interrupts continuously, and none of it is new information.
  accessibleDescription:
    'Code-XR is a VS Code extension that analyzes your code and turns the metrics into a 3D scene you can explore in your browser: walk your codebase like a city, inspect its dependency graph, compare two points of its Git history, or replay its whole evolution. No VR headset required.',

  // Each line is checked against the extension README. None claims validation
  // on physical headset hardware — v1.2.0 was verified on desktop browsers and
  // on emulated WebXR sessions only.
  rotatingLines: [
    'No VR headset required: it runs in the browser you already have.',
    'Walk around your codebase like a city and watch it update as you edit.',
    'See the architecture, not just the files: dependencies as a 3D graph.',
    'Replay your Git history as a film, or compare two points side by side.',
    'Local analysis, local servers. No telemetry, no account.',
  ],

  stats: {
    installs: {
      label: 'Active installs',
      detail: 'Marketplace API',
    },
    downloads: {
      label: 'Marketplace downloads',
      detail: 'Marketplace API',
    },
    // "Approx." is doing real work in this label — see the note in HeroStats.
    approxTotal: {
      label: 'Approx. total downloads',
      detail: 'Approximate',
      linkHint: 'install from the VS Code Marketplace',
    },
    rating: {
      label: 'Rating',
      // Pluralized against the live review count.
      detail: (count) => `${count} review${count === 1 ? '' : 's'}`,
    },
    version: {
      label: 'Now live',
      // Shown when the publish date has not arrived from the Marketplace.
      fallbackDetail: 'VS Code Marketplace',
    },
    award: {
      linkHint: 'see the official awards page',
    },
  },

  actions: {
    install: 'Install Extension',
    source: 'View on GitHub',
  },
};
